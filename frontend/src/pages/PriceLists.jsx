import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  Upload, FileText, Image, FileSpreadsheet, Check, Loader2,
  Trash2, Package, AlertCircle, ChevronDown, ChevronRight,
  Search, X, Database, RefreshCw, TrendingUp, Edit2,
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/constants.js';

// ── Category config ───────────────────────────────────────────────────────────

const MARKUP_CATS = [
  { id: 'фурнитура',  label: 'Фурнитура' },
  { id: 'плиты',      label: 'Плиты/ЛДСП' },
  { id: 'кромка',     label: 'Кромка' },
  { id: 'столешницы', label: 'Столешницы' },
  { id: 'погонные',   label: 'Погонные' },
  { id: 'ручки',      label: 'Ручки' },
  { id: 'подсветка',  label: 'Подсветка' },
  { id: 'аксессуары', label: 'Аксессуары' },
];

const CATEGORY_KEYWORDS = {
  'мойки':      ['мойка', 'sink'],
  'столешницы': ['столешниц', 'столешн', 'стол.', 'worktop'],
  'ручки':      ['ручк', 'gola', 'handle'],
  'подсветка':  ['подсветк', 'led', 'свет'],
  'фурнитура':  ['фурнитур', 'петл', 'навес', 'доводчик', 'направляющ', 'blum', 'hettich', 'hafele'],
  'плиты':      ['плит', 'лдсп', 'мдф', 'egger', 'kronospan'],
  'кромка':     ['кромк', 'edge'],
  'погонные':   ['погонн', 'карниз', 'плинтус', 'профил'],
  'аксессуары': ['аксессуар', 'корзин', 'лоток', 'органайз'],
};

function mapToCat(rawCat) {
  const lower = (rawCat || '').toLowerCase();
  for (const [catId, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) return catId;
  }
  return 'другое';
}

// ── File helpers ─────────────────────────────────────────────────────────────

const ACCEPT = '.xlsx,.xls,.csv,.pdf,.docx,.jpg,.jpeg,.png';

function readFileAsArrayBuffer(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsArrayBuffer(file); });
}
function readFileAsBase64(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
}
function readFileAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsText(file, 'utf-8'); });
}

async function extractFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') { const text = await readFileAsText(file); return { text, rows: [] }; }
  if (['xlsx', 'xls'].includes(ext)) {
    const buffer = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buffer, { type: 'array' });
    let text = '', rows = [];
    for (const sn of wb.SheetNames) {
      const ws = wb.Sheets[sn];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      text += `\n=== ${sn} ===\n`;
      for (const row of raw) text += row.join('\t') + '\n';
      rows = [...rows, ...XLSX.utils.sheet_to_json(ws, { defval: '' })];
    }
    return { text, rows };
  }
  if (ext === 'docx') { const buf = await readFileAsArrayBuffer(file); const r = await mammoth.extractRawText({ arrayBuffer: buf }); return { text: r.value, rows: [] }; }
  if (ext === 'pdf') { const b64 = await readFileAsBase64(file); return { pdf_base64: b64, text: '', rows: [] }; }
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    const b64 = await readFileAsBase64(file);
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
    return { image_base64: b64, image_type: mime[ext], text: '', rows: [] };
  }
  throw new Error(`Формат .${ext} не поддерживается`);
}

function getFileIcon(file) {
  if (!file) return <FileText className="w-5 h-5 text-slate-400" />;
  const ext = file.name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return <Image className="w-5 h-5 text-pink-500" />;
  if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <FileText className="w-5 h-5 text-blue-500" />;
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onDone }) {
  const { showToast } = useApp();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);

  const processOne = useCallback(async (item, onUpdate) => {
    onUpdate({ status: 'analyzing' });
    try {
      const extracted = await extractFile(item.file);
      const payload = { filename: item.file.name };
      if (extracted.image_base64) { payload.image_base64 = extracted.image_base64; payload.image_type = extracted.image_type; }
      else { payload.text = extracted.text || ''; }
      if (extracted.rows?.length > 0) payload.rows = extracted.rows.slice(0, 200);

      const resp = await api.analyzePricelist(payload);
      const dataType = resp.data_type || 'pricelist';
      onUpdate({ status: 'saving', dataType });

      const savedInfo = {};
      if ((dataType === 'pricelist' || dataType === 'mixed') && resp.items?.length > 0) {
        const sr = await api.savePricelist({ supplier: resp.supplier, price_date: resp.price_date, filename: item.file.name, items: resp.items });
        savedInfo.updated = sr.items_updated || 0;
        savedInfo.added = sr.items_added || 0;
        showToast(`${resp.supplier || 'Файл'}: +${savedInfo.added} новых, обновлено ${savedInfo.updated}`);
      }
      if ((dataType === 'crm' || dataType === 'mixed') && extracted.rows?.length > 0 && resp.column_mapping) {
        const ir = await api.importData({ rows: extracted.rows, column_mapping: resp.column_mapping, skip_duplicates: true });
        savedInfo.clients = ir.imported_clients || 0;
        showToast(`👥 ${savedInfo.clients} клиентов сохранено`);
      }
      onUpdate({ status: 'done', savedInfo });
    } catch (err) {
      onUpdate({ status: 'error', error: err.message || 'Ошибка' });
    }
  }, [showToast]);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const items = files.map(f => ({ id: Math.random().toString(36).slice(2), file: f, status: 'waiting', savedInfo: null, error: null }));
    setQueue(prev => [...prev, ...items]);
    setProcessing(true);
    for (const item of items) {
      await processOne(item, upd => setQueue(prev => prev.map(q => q.id === item.id ? { ...q, ...upd } : q)));
    }
    setProcessing(false);
    onDone();
  }, [processOne, onDone]);

  const doneCount = queue.filter(q => q.status === 'done').length;

  const statusCfg = {
    waiting:   { label: 'Ожидание',   cls: 'text-slate-400' },
    analyzing: { label: 'Анализ ИИ', cls: 'text-blue-600',  icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    saving:    { label: 'Сохранение', cls: 'text-amber-600', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    done:      { label: 'Готово',     cls: 'text-green-600', icon: <Check className="w-3.5 h-3.5" /> },
    error:     { label: 'Ошибка',     cls: 'text-red-500',   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Загрузить прайс-лист</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-8 h-8 ${dragOver ? 'text-brand-500' : 'text-slate-300'}`} />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Перетащите или нажмите для выбора</p>
              <p className="text-xs text-slate-400 mt-1">Excel, CSV, PDF, Word, фото · Несколько файлов сразу</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />

          {queue.length > 0 && (
            <div className="mt-4 space-y-2">
              {queue.length > 1 && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(doneCount / queue.length) * 100}%` }} />
                </div>
              )}
              {queue.map(item => {
                const cfg = statusCfg[item.status] || statusCfg.waiting;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 px-3 bg-slate-50 rounded-xl">
                    {getFileIcon(item.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                      {item.status === 'done' && item.savedInfo && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.savedInfo.added !== undefined && `+${item.savedInfo.added} новых, обновлено ${item.savedInfo.updated}`}
                          {item.savedInfo.clients !== undefined && ` · 👥 ${item.savedInfo.clients} клиентов`}
                        </p>
                      )}
                      {item.status === 'error' && <p className="text-xs text-red-400 mt-0.5">{item.error}</p>}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium flex-shrink-0 ${cfg.cls}`}>
                      {cfg.icon}{cfg.label}
                    </div>
                  </div>
                );
              })}
              {!processing && doneCount > 0 && (
                <button onClick={onClose} className="w-full mt-2 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Готово — закрыть
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline edit cell ──────────────────────────────────────────────────────────

function EditableCell({ value, onSave, type = 'number', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const start = () => { setDraft(String(value ?? '')); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); };
  const commit = async () => {
    setEditing(false);
    const v = type === 'number' ? (parseFloat(draft) || 0) : draft;
    if (v !== value) await onSave(v);
  };

  if (editing) return (
    <input
      ref={inputRef}
      type={type === 'number' ? 'number' : 'text'}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className={`w-full border border-brand-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${className}`}
    />
  );

  return (
    <span onClick={start} className={`cursor-pointer hover:text-brand-600 group inline-flex items-center gap-1 ${className}`}>
      {value}
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ALL_TABS = [
  { id: 'all',        label: 'Все' },
  { id: 'фурнитура',  label: 'Фурнитура' },
  { id: 'плиты',      label: 'Плиты/ЛДСП' },
  { id: 'кромка',     label: 'Кромка' },
  { id: 'столешницы', label: 'Столешницы' },
  { id: 'погонные',   label: 'Погонные' },
  { id: 'ручки',      label: 'Ручки' },
  { id: 'подсветка',  label: 'Подсветка' },
  { id: 'аксессуары', label: 'Аксессуары' },
  { id: 'другое',     label: 'Прочее' },
];

export default function PriceLists() {
  const { currentRole, showToast } = useApp();
  const isRukovoditel = currentRole?.role === 'Руководитель';

  // Catalog state
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Markups
  const [markups, setMarkups] = useState({}); // { category: percent }
  const [markupDraft, setMarkupDraft] = useState({});
  const [savingMarkups, setSavingMarkups] = useState(false);
  const [showMarkupPanel, setShowMarkupPanel] = useState(false);

  // Upload history
  const [uploadHistory, setUploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);

  // Debounce search
  const searchTimer = useRef(null);
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); }, 400);
  };

  const loadStats = useCallback(async () => {
    try {
      const s = await api.getCatalogStats();
      setStats(s);
    } catch {}
  }, []);

  const loadMarkups = useCallback(async () => {
    try {
      const list = await api.getCatalogMarkups();
      const map = {};
      for (const m of list) map[m.category] = m.markup_percent;
      setMarkups(map);
      setMarkupDraft(map);
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const h = await api.getUploadLog();
      setUploadHistory(Array.isArray(h) ? h : []);
    } catch {}
  }, []);

  const loadItems = useCallback(async (overridePage) => {
    setLoading(true);
    try {
      const p = overridePage ?? page;
      const data = await api.getCatalogItemsPaged({
        page: p,
        limit: PAGE_SIZE,
        category: activeTab === 'all' ? '' : activeTab,
        search,
        supplier: supplierFilter,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 0);
    } catch (e) {
      console.error('loadItems error:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, supplierFilter]);

  useEffect(() => { loadStats(); if (isRukovoditel) loadMarkups(); loadHistory(); }, []);
  useEffect(() => { loadItems(); }, [page, activeTab, supplierFilter]);

  // Search debounce effect
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadItems(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Tab counts from stats
  const tabCounts = useMemo(() => {
    if (!stats?.by_category) return {};
    const counts = { all: stats.total };
    for (const { category, count } of stats.by_category) {
      const mapped = mapToCat(category);
      counts[mapped] = (counts[mapped] || 0) + count;
    }
    return counts;
  }, [stats]);

  const visibleTabs = ALL_TABS.filter(t => t.id === 'all' || (tabCounts[t.id] || 0) > 0);

  const handleSaveMarkups = async () => {
    setSavingMarkups(true);
    try {
      const markupList = Object.entries(markupDraft)
        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
        .map(([category, markup_percent]) => ({ category, markup_percent: parseFloat(markup_percent) || 0 }));
      await api.saveCatalogMarkups({ markups: markupList });
      setMarkups({ ...markupDraft });
      showToast('Наценки сохранены');
      loadItems();
    } catch {
      showToast('Ошибка сохранения наценок');
    } finally {
      setSavingMarkups(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Удалить позицию?')) return;
    try {
      await api.deleteCatalogItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
      showToast('Позиция удалена');
    } catch {
      showToast('Ошибка удаления');
    }
  };

  const handleUpdateItem = async (id, field, value) => {
    try {
      await api.updateCatalogItem(id, { [field]: value });
      setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    } catch {
      showToast('Ошибка обновления');
    }
  };

  const lastUpdated = stats?.last_updated
    ? new Date(stats.last_updated).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" /> Каталог материалов
          </h1>
          <div className="flex items-center gap-4 mt-1">
            {stats && (
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{stats.total}</span> позиций
              </span>
            )}
            {lastUpdated && <span className="text-xs text-slate-400">Обновлён {lastUpdated}</span>}
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Upload className="w-4 h-4" /> Загрузить прайс
        </button>
      </div>

      {/* Markup panel (Руководитель only) */}
      {isRukovoditel && (
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowMarkupPanel(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold text-slate-700">Наценки по категориям</span>
              {Object.keys(markups).length > 0 && (
                <span className="text-xs bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">
                  {Object.keys(markups).length} настроено
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMarkupPanel ? '' : '-rotate-90'}`} />
          </button>

          {showMarkupPanel && (
            <div className="border-t border-slate-100 p-4">
              <p className="text-xs text-slate-500 mb-4">
                Наценка применяется ко всем позициям категории. Цена клиента = Цена поставщика × (1 + наценка%)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {MARKUP_CATS.map(cat => (
                  <div key={cat.id}>
                    <label className="label text-xs">{cat.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0" max="200" step="1"
                        className="input text-sm pr-7"
                        placeholder="0"
                        value={markupDraft[cat.id] ?? ''}
                        onChange={e => setMarkupDraft(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveMarkups}
                  disabled={savingMarkups}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {savingMarkups ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Сохранить наценки
                </button>
                <button
                  onClick={() => setMarkupDraft(markups)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Сбросить
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
            {tabCounts[tab.id] !== undefined && (
              <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-slate-400'}`}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9 text-sm"
            placeholder="Поиск по наименованию или артикулу..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {stats?.suppliers?.length > 0 && (
          <select
            className="input text-sm w-auto"
            value={supplierFilter}
            onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
          >
            <option value="">Все поставщики</option>
            {stats.suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {(search || supplierFilter) && (
          <button
            onClick={() => { setSearch(''); setSupplierFilter(''); setPage(1); }}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-12 h-12 opacity-20 mb-3" />
            <p className="text-sm font-medium">
              {stats?.total === 0 ? 'Каталог пуст. Загрузите первый прайс-лист.' : 'Ничего не найдено'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Артикул</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Наименование</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Поставщик</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Ед.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Цена пост.</th>
                    {isRukovoditel && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">Наценка</th>}
                    {isRukovoditel && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Цена клиента</th>}
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Обновлено</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const updDate = item.updated_at ? new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
                    return (
                      <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{item.article || '—'}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-800 leading-tight">{item.name}</p>
                          {item.supplier && <p className="text-xs text-slate-400 mt-0.5">{item.supplier}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{item.supplier || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{item.unit || 'шт'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                          {isRukovoditel ? (
                            <EditableCell
                              value={item.base_price ?? item.price}
                              onSave={v => handleUpdateItem(item.id, 'price', v)}
                              type="number"
                            />
                          ) : (
                            formatCurrency(item.price)
                          )}
                        </td>
                        {isRukovoditel && (
                          <td className="px-4 py-2.5 text-right text-slate-600">
                            <EditableCell
                              value={item.markup_percent || 0}
                              onSave={v => {
                                // Save per-item markup via updateCatalogItem
                                api.savePricelistMarkup(item.pricelist_id || 'global', {
                                  markups: [{ item_id: item.id, category: item.category, markup_percent: v }]
                                }).catch(() => {});
                                setItems(prev => prev.map(i => i.id === item.id ? {
                                  ...i,
                                  markup_percent: v,
                                  price: v > 0 ? Math.round((i.base_price || i.price) * (1 + v / 100)) : (i.base_price || i.price)
                                } : i));
                              }}
                              type="number"
                            />
                            <span className="text-xs text-slate-400 ml-0.5">%</span>
                          </td>
                        )}
                        {isRukovoditel && (
                          <td className="px-4 py-2.5 text-right font-semibold text-brand-700">
                            {formatCurrency(item.price)}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-right text-xs text-slate-400">{updDate}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} из {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Пред.
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const pg = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${pg === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    След. →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload history */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">История загрузок</span>
            {uploadHistory.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{uploadHistory.length}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? '' : '-rotate-90'}`} />
        </button>

        {showHistory && (
          <div className="border-t border-slate-100">
            {uploadHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Загрузок ещё не было</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Файл</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Поставщик</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Добавлено</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Обновлено</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map(h => (
                    <tr key={h.id} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700 truncate max-w-xs">{h.filename}</td>
                      <td className="px-4 py-2.5 text-slate-500">{h.supplier || '—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-green-600 font-medium">+{h.items_added || 0}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-amber-600 font-medium">↻{h.items_updated || 0}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-400">
                        {h.uploaded_at ? new Date(h.uploaded_at).toLocaleDateString('ru-RU') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false);
            loadStats();
            loadItems(1);
            setPage(1);
            loadHistory();
          }}
        />
      )}
    </div>
  );
}
