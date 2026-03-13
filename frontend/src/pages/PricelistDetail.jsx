import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Search, Save, Loader2, Check, Pencil, X,
  TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';

const fmt = (n) => (Math.round(n) || 0).toLocaleString('ru-RU');

const CATEGORY_MARKUPS_DEFAULT = [
  'фурнитура', 'петли', 'направляющие', 'ЛДСП', 'кромка',
  'плиты', 'погонные материалы', 'фасады', 'столешницы', 'ручки',
  'подсветка', 'крепёж', 'другое',
];

export default function PricelistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, showToast } = useApp();
  const isAdmin = currentRole?.role === 'Руководитель';

  const [pricelist, setPricelist] = useState(null);
  const [items, setItems] = useState([]);
  const [markups, setMarkups] = useState({}); // { 'фурнитура': 35, '_item_<id>': 40 }
  const [globalMarkup, setGlobalMarkup] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markupOpen, setMarkupOpen] = useState(true);
  const [editingItem, setEditingItem] = useState(null); // { id, field, value }

  useEffect(() => {
    setLoading(true);
    api.getPricelistDetail(id)
      .then(data => {
        setPricelist(data);
        setItems(data.items || []);
        const map = {};
        for (const m of (data.markups || [])) {
          if (m.item_id) map[`_item_${m.item_id}`] = m.markup_percent;
          else if (m.category) map[m.category] = m.markup_percent;
        }
        setMarkups(map);
      })
      .catch(() => navigate('/pricelists'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const categories = useMemo(() => ['all', ...new Set(items.map(i => i.category).filter(Boolean))], [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory !== 'all') result = result.filter(i => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.article || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCategory, search]);

  const getItemMarkup = (item) => {
    const itemKey = `_item_${item.id}`;
    if (markups[itemKey] !== undefined) return markups[itemKey];
    if (item.category && markups[item.category] !== undefined) return markups[item.category];
    const g = parseFloat(globalMarkup);
    return isNaN(g) ? 0 : g;
  };

  const getClientPrice = (item) => {
    const pct = getItemMarkup(item);
    return pct > 0 ? Math.round((item.price || 0) * (1 + pct / 100)) : (item.price || 0);
  };

  const handleSaveMarkups = async () => {
    setSaving(true);
    try {
      const markupList = [];

      // Per-category markups from state
      for (const [k, pct] of Object.entries(markups)) {
        if (k.startsWith('_item_')) {
          markupList.push({ item_id: k.slice(6), markup_percent: pct });
        } else {
          markupList.push({ category: k, markup_percent: pct });
        }
      }

      // Apply global markup to all categories not already set
      const g = parseFloat(globalMarkup);
      if (!isNaN(g) && g > 0) {
        const cats = [...new Set(items.map(i => i.category).filter(Boolean))];
        for (const cat of cats) {
          if (markups[cat] === undefined) {
            markupList.push({ category: cat, markup_percent: g });
          }
        }
      }

      await api.savePricelistMarkup(id, { markups: markupList });
      showToast('Наценки сохранены');
    } catch (err) {
      showToast('Ошибка: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item, field) => {
    setEditingItem({ id: item.id, field, value: String(item[field] || '') });
  };

  const commitEdit = async () => {
    if (!editingItem) return;
    const item = items.find(i => i.id === editingItem.id);
    if (!item) return;

    const update = { [editingItem.field]: editingItem.field === 'price' ? parseFloat(editingItem.value) || 0 : editingItem.value };
    try {
      await api.updateCatalogItem(editingItem.id, update);
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...update } : i));
      showToast('Обновлено');
    } catch {
      showToast('Ошибка обновления', 'error');
    }
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!pricelist) return null;

  const uploadDate = pricelist.created_at ? new Date(pricelist.created_at).toLocaleDateString('ru-RU') : '—';

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pricelists')}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{pricelist.supplier || 'Прайс-лист'}</h1>
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${pricelist.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {pricelist.status === 'active' ? 'Активный' : 'Устарел'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            <span>📅 {uploadDate}</span>
            <span>📦 {pricelist.total_items || 0} позиций</span>
            {pricelist.price_date && <span>💰 {pricelist.price_date}</span>}
            {pricelist.filename && <span className="truncate max-w-xs">{pricelist.filename}</span>}
          </div>
        </div>
      </div>

      {/* Markup section — only for Руководитель */}
      {isAdmin && (
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setMarkupOpen(v => !v)}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold text-slate-800">Наценки</span>
              {Object.keys(markups).length > 0 && (
                <span className="text-xs bg-brand-100 text-brand-700 rounded-full px-2 py-0.5 font-medium">
                  {Object.keys(markups).length} настроено
                </span>
              )}
            </div>
            {markupOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {markupOpen && (
            <div className="px-5 pb-5 border-t border-slate-100">
              {/* Formula explanation */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mt-4 mb-4">
                <p className="text-xs text-blue-700 font-medium">Формула расчёта цены для клиента</p>
                <p className="text-xs text-blue-600 mt-0.5">Цена поставщика × (1 + наценка%) = Цена для клиента</p>
                {globalMarkup && !isNaN(parseFloat(globalMarkup)) && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    Пример: 3 300 ₸ × {(1 + parseFloat(globalMarkup) / 100).toFixed(2)} = {fmt(3300 * (1 + parseFloat(globalMarkup) / 100))} ₸ (наценка {globalMarkup}%)
                  </p>
                )}
              </div>

              {/* Global markup */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Глобальная наценка на весь прайс</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    placeholder="0"
                    value={globalMarkup}
                    onChange={e => setGlobalMarkup(e.target.value)}
                    className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <span className="text-sm text-slate-400">%</span>
                  <span className="text-xs text-slate-400">(применяется к категориям без индивидуальной наценки)</span>
                </div>
              </div>

              {/* Per-category markups */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Наценка по категориям</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...new Set(items.map(i => i.category).filter(Boolean))].map(cat => (
                    <div key={cat} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-600 flex-1 truncate">{cat}</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        placeholder={globalMarkup || '0'}
                        value={markups[cat] !== undefined ? markups[cat] : ''}
                        onChange={e => setMarkups(m => ({ ...m, [cat]: parseFloat(e.target.value) || 0 }))}
                        className="w-16 text-xs text-right px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMarkups}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить наценки
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap gap-y-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Поиск по названию или артикулу..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-400">{filteredItems.length} позиций</span>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-slate-100 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'Все' : cat}
              <span className="ml-1 opacity-60">
                {cat === 'all' ? items.length : items.filter(i => i.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs text-slate-500 font-semibold uppercase">
                <th className="text-left px-4 py-2.5">Артикул</th>
                <th className="text-left px-4 py-2.5">Наименование</th>
                <th className="text-left px-4 py-2.5">Категория</th>
                <th className="text-left px-4 py-2.5">Ед.</th>
                <th className="text-right px-4 py-2.5">Цена поставщика</th>
                {isAdmin && <th className="text-right px-4 py-2.5">Наценка%</th>}
                {isAdmin && <th className="text-right px-4 py-2.5">Цена клиента</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="text-center py-12 text-slate-400 text-sm">
                    Нет позиций
                  </td>
                </tr>
              ) : (
                filteredItems.slice(0, 500).map(item => {
                  const markup = getItemMarkup(item);
                  const clientPrice = getClientPrice(item);
                  const isEditingPrice = editingItem?.id === item.id && editingItem?.field === 'price';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 group">
                      <td className="px-4 py-2 text-slate-400 font-mono text-xs">{item.article || '—'}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium max-w-[250px]">
                        <span className="truncate block">{item.name || '—'}</span>
                        {item.supplier && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{item.supplier}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{item.category || '—'}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{item.unit || '—'}</td>
                      <td className="px-4 py-2 text-right">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              autoFocus
                              type="number"
                              value={editingItem.value}
                              onChange={e => setEditingItem(v => ({ ...v, value: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingItem(null); }}
                              className="w-24 text-right px-2 py-1 text-xs border border-brand-400 rounded focus:outline-none"
                            />
                            <button onClick={commitEdit} className="p-1 text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-end gap-1 cursor-pointer"
                            onClick={() => isAdmin && startEdit(item, 'price')}
                          >
                            <span className="font-semibold text-slate-800">{fmt(item.price)} ₸</span>
                            {isAdmin && <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="500"
                            placeholder="—"
                            value={markups[`_item_${item.id}`] !== undefined ? markups[`_item_${item.id}`] : ''}
                            onChange={e => setMarkups(m => {
                              const v = e.target.value;
                              if (v === '') {
                                const next = { ...m };
                                delete next[`_item_${item.id}`];
                                return next;
                              }
                              return { ...m, [`_item_${item.id}`]: parseFloat(v) || 0 };
                            })}
                            className="w-16 text-xs text-right px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-400"
                          />
                          <span className="text-xs text-slate-400 ml-1">%</span>
                          {markup > 0 && markups[`_item_${item.id}`] === undefined && (
                            <span className="block text-[10px] text-slate-300">кат. {markup}%</span>
                          )}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="px-4 py-2 text-right">
                          <span className={`font-semibold ${markup > 0 ? 'text-brand-700' : 'text-slate-600'}`}>
                            {fmt(clientPrice)} ₸
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredItems.length > 500 && (
            <p className="text-xs text-center text-slate-400 py-3">Показано 500 из {filteredItems.length} позиций</p>
          )}
        </div>
      </div>

      {/* Save markups sticky button */}
      {isAdmin && Object.keys(markups).length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSaveMarkups}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить наценки
          </button>
        </div>
      )}
    </div>
  );
}
