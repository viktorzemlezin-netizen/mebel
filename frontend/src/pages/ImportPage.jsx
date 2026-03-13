import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2,
  ChevronRight, Users, TrendingUp, Package, Calendar, FileText,
  Image, FileImage, Bot, Sparkles,
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/constants.js';

const TABS = ['Загрузка файла', 'Анализ ИИ', 'Результаты'];

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

const SOURCE_BUTTONS = [
  { label: 'Битрикс24', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { label: 'amoCRM',    color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { label: 'Excel',     color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { label: 'CSV',       color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { label: 'Word',      color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { label: 'Фото',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

const FIELD_LABELS = {
  client_name:    'Имя клиента',
  client_phone:   'Телефон',
  client_email:   'Email',
  client_address: 'Адрес',
  furniture_type: 'Тип мебели',
  amount:         'Сумма заказа',
  order_date:     'Дата заказа',
  status:         'Статус',
  notes:          'Комментарии',
};

// Detect file type
function getFileFormat(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
  if (name.endsWith('.docx')) return 'word';
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  return 'unknown';
}

function FileFormatIcon({ format, size = 'md' }) {
  const cls = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  if (format === 'excel' || format === 'csv') return <FileSpreadsheet className={`${cls} text-emerald-600`} />;
  if (format === 'word') return <FileText className={`${cls} text-sky-600`} />;
  if (format === 'pdf') return <FileText className={`${cls} text-red-500`} />;
  if (format === 'image') return <FileImage className={`${cls} text-amber-500`} />;
  return <Upload className={`${cls} text-slate-400`} />;
}

function SourceBadge({ sourceType }) {
  const labels = {
    bitrix24: { label: 'Битрикс24', color: 'bg-blue-100 text-blue-700' },
    amocrm:   { label: 'amoCRM',    color: 'bg-orange-100 text-orange-700' },
    excel:    { label: 'Excel',     color: 'bg-emerald-100 text-emerald-700' },
    word:     { label: 'Word',      color: 'bg-sky-100 text-sky-700' },
    handwritten: { label: 'Рукописная база', color: 'bg-amber-100 text-amber-700' },
    unknown:  { label: 'Неизвестный', color: 'bg-slate-100 text-slate-600' },
  };
  const meta = labels[sourceType] || labels.unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export default function ImportPage() {
  const { showToast } = useApp();
  const [tab, setTab] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [fileFormat, setFileFormat] = useState(null);
  const [parsedData, setParsedData] = useState([]);  // raw rows from file parse
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rawText, setRawText] = useState(null);      // for Word/PDF
  const [imagePayload, setImagePayload] = useState(null); // { base64, type }
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [clientsOnly, setClientsOnly] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileRef = useRef();

  const parseFile = useCallback((f) => {
    const format = getFileFormat(f);
    setFileFormat(format);
    setFile(f);
    setParsedData([]);
    setRows([]);
    setColumns([]);
    setRawText(null);
    setImagePayload(null);

    if (format === 'csv' || format === 'excel') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (json.length === 0) { showToast('Файл пустой или не удалось разобрать', 'error'); return; }
          setParsedData(json);
          setRows(json);
          setColumns(Object.keys(json[0]));
          showToast(`Загружено ${json.length} строк`, 'success');
        } catch {
          showToast('Не удалось разобрать файл', 'error');
        }
      };
      reader.readAsArrayBuffer(f);
    } else if (format === 'word') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
          setRawText(result.value);
          showToast('Word документ прочитан успешно', 'success');
        } catch {
          showToast('Не удалось прочитать Word файл', 'error');
        }
      };
      reader.readAsArrayBuffer(f);
    } else if (format === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          setImagePayload({ base64: match[2], type: match[1] });
          showToast('Изображение загружено — ИИ распознает текст', 'success');
        }
      };
      reader.readAsDataURL(f);
    } else if (format === 'pdf') {
      // For PDF: read as base64 and let the worker handle extraction via Claude
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // For PDF we'll extract text from the base64 on the backend
          // For now, read as text if possible (text-based PDF)
          const bytes = new Uint8Array(e.target.result);
          // Try to extract any readable text
          let text = '';
          for (let i = 0; i < bytes.length && text.length < 50000; i++) {
            if (bytes[i] >= 32 && bytes[i] < 127) text += String.fromCharCode(bytes[i]);
            else if (bytes[i] === 10 || bytes[i] === 13) text += '\n';
          }
          // Filter out non-text garbage
          const lines = text.split('\n').filter(l => l.trim().length > 3 && /[а-яА-ЯёЁa-zA-Z0-9]/.test(l));
          setRawText(lines.join('\n'));
          showToast('PDF загружен', 'success');
        } catch {
          showToast('Не удалось прочитать PDF', 'error');
        }
      };
      reader.readAsArrayBuffer(f);
    } else {
      showToast('Неподдерживаемый формат файла', 'error');
    }
  }, [showToast]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }, [parseFile]);

  const onFileChange = (e) => { if (e.target.files[0]) parseFile(e.target.files[0]); };

  const hasData = rows.length > 0 || rawText || imagePayload;

  const handleAnalyze = async () => {
    if (!hasData) return;
    setAnalyzing(true);
    setTab(1);
    try {
      let payload = { filename: file?.name };
      if (imagePayload) {
        payload.image_base64 = imagePayload.base64;
        payload.image_type = imagePayload.type;
      } else if (rawText) {
        payload.text = rawText;
      } else {
        payload.rows = rows;
      }
      const result = await api.analyzeImport(payload);
      setAnalysis(result);
      setMapping(result.column_mapping || {});
    } catch (err) {
      showToast('Ошибка анализа: ' + err.message, 'error');
      setTab(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(10);
    try {
      const timer = setInterval(() => setImportProgress(p => Math.min(p + 15, 85)), 600);
      // Use parsedData (tabular rows from file) or fall back to top_clients from AI analysis
      let importRows = parsedData;
      let importMapping = mapping;
      if (parsedData.length === 0 && analysis?.analytics?.top_clients?.length) {
        importRows = analysis.analytics.top_clients.map(c => ({
          name: c.name, phone: c.phone || '', total: c.total_amount || 0,
        }));
        importMapping = { client_name: 'name', client_phone: 'phone', amount: 'total' };
        setMapping(importMapping);
      }
      const result = await api.importData({
        rows: importRows,
        column_mapping: importMapping,
        skip_duplicates: skipDuplicates,
        clients_only: clientsOnly,
      });
      clearInterval(timer);
      setImportProgress(100);
      setImportResult(result);
      setTab(2);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      showToast(`Импорт завершён: ${result.imported_clients} клиентов, ${result.imported_orders} заказов`, 'success');
    } catch (err) {
      showToast('Ошибка импорта: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Импорт данных</h1>
        <p className="text-slate-500 text-sm mt-1">Загрузите данные в любом формате — ИИ автоматически проанализирует и импортирует</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {i < tab && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: File Upload */}
      {tab === 0 && (
        <div className="space-y-6">
          {/* Source buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-500 self-center">Источники:</span>
            {SOURCE_BUTTONS.map(s => (
              <span key={s.label} className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${s.color}`}>{s.label}</span>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,.docx,.jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <Upload className={`w-8 h-8 ${dragging ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Перетащите файл или нажмите для выбора</p>
                <p className="text-sm text-slate-400 mt-1">CSV, Excel, Word (.docx), PDF, фото (.jpg, .png)</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-emerald-500" />Excel / CSV</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-sky-500" />Word / PDF</span>
                <span className="flex items-center gap-1.5"><FileImage className="w-4 h-4 text-amber-500" />Фото тетради</span>
              </div>
            </div>
          </div>

          {/* OCR notice for images */}
          {imagePayload && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Bot className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">ИИ распознает рукописный текст и извлечёт данные автоматически</p>
            </div>
          )}

          {/* Word notice */}
          {rawText && fileFormat === 'word' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-600 flex-shrink-0" />
              <p className="text-sm text-sky-800">Word документ прочитан — {rawText.length} символов текста</p>
            </div>
          )}

          {/* PDF notice */}
          {rawText && fileFormat === 'pdf' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800">PDF загружен — извлечено {rawText.split('\n').filter(Boolean).length} строк текста</p>
            </div>
          )}

          {/* Preview for tabular data */}
          {rows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <FileFormatIcon format={fileFormat} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{file?.name}</p>
                    <p className="text-xs text-slate-400">{rows.length} строк · {columns.length} колонок</p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Анализировать с ИИ
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>{columns.map(c => <th key={c} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">{c}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {columns.map(c => (
                          <td key={c} className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">{String(row[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-slate-100">
                  Показано 5 из {rows.length} строк
                </div>
              )}
            </div>
          )}

          {/* Analyze button for non-tabular data */}
          {(imagePayload || rawText) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50">
                  <FileFormatIcon format={fileFormat} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{file?.name}</p>
                  <p className="text-xs text-slate-400">
                    {imagePayload ? 'Изображение готово для OCR' : `${rawText?.length || 0} символов текста`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Анализировать с ИИ
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: AI Analysis */}
      {tab === 1 && (
        <div className="space-y-6">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">ИИ анализирует данные...</p>
                <p className="text-sm text-slate-400 mt-1">
                  {imagePayload ? 'Распознаю рукописный текст и извлекаю данные...' : 'Определяем структуру, качество данных и бизнес-аналитику'}
                </p>
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* Migration Summary Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <span className="text-indigo-200 text-sm font-medium">Результат анализа</span>
                  {analysis.source_type && <SourceBadge sourceType={analysis.source_type} />}
                  {analysis._ocr && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">OCR</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-bold">{analysis.data_quality?.recognized_clients ?? analysis.data_quality?.total_rows ?? rows.length}</div>
                    <div className="text-indigo-200 text-xs mt-0.5">клиентов найдено</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{analysis.data_quality?.recognized_orders ?? '—'}</div>
                    <div className="text-indigo-200 text-xs mt-0.5">заказов</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{analysis.data_quality?.date_range ?? '—'}</div>
                    <div className="text-indigo-200 text-xs mt-0.5">период данных</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{analysis.data_quality?.data_completeness ?? '—'}{analysis.data_quality?.data_completeness ? '%' : ''}</div>
                    <div className="text-indigo-200 text-xs mt-0.5">данных распознано</div>
                  </div>
                </div>
                {analysis.data_quality?.data_completeness && (
                  <div className="h-1.5 bg-indigo-500/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/80 rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.data_quality.data_completeness}%` }}
                    />
                  </div>
                )}
                {analysis.migration_summary && (
                  <p className="text-indigo-100 text-sm mt-3 leading-relaxed">{analysis.migration_summary}</p>
                )}
              </div>

              {/* KPI row from analytics */}
              {analysis.analytics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: 'Топ клиентов', value: analysis.analytics.top_clients?.length || 0, color: 'text-indigo-600 bg-indigo-50' },
                    { icon: Package, label: 'Типов мебели', value: analysis.analytics.popular_furniture?.length || 0, color: 'text-emerald-600 bg-emerald-50' },
                    { icon: TrendingUp, label: 'Средний чек', value: analysis.analytics.average_check ? formatCurrency(analysis.analytics.average_check) : '—', color: 'text-amber-600 bg-amber-50' },
                    { icon: Calendar, label: 'Лет работы', value: analysis.analytics.business_age_years || '—', color: 'text-violet-600 bg-violet-50' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-bold text-slate-800">{item.value}</div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Column Mapping (only for tabular data) */}
              {rows.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Сопоставление колонок</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ИИ определил соответствие — проверьте и скорректируйте</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {Object.entries(FIELD_LABELS).map(([field, label]) => (
                      <div key={field} className="flex items-center gap-4 px-5 py-3">
                        <span className="w-36 text-sm text-slate-600 font-medium flex-shrink-0">{label}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        <select
                          value={mapping[field] || ''}
                          onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || null }))}
                          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          <option value="">— не импортировать —</option>
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {mapping[field] && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex-shrink-0">ИИ</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Quality */}
              {analysis.data_quality && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-amber-800">Качество данных</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Всего записей', value: analysis.data_quality.total_records ?? analysis.data_quality.total_rows ?? rows.length },
                      { label: 'Клиентов', value: analysis.data_quality.recognized_clients ?? '—' },
                      { label: 'Заказов', value: analysis.data_quality.recognized_orders ?? '—' },
                      { label: 'Период', value: analysis.data_quality.date_range || '—' },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-xl p-3">
                        <div className="text-lg font-bold text-slate-800">{item.value}</div>
                        <div className="text-xs text-slate-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Charts */}
              {analysis.analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {analysis.analytics.orders_by_year?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-800 mb-4">Заказы по годам</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analysis.analytics.orders_by_year}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Заказов" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.analytics.popular_furniture?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-800 mb-4">Типы мебели</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={analysis.analytics.popular_furniture} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percentage }) => `${type} ${percentage}%`} labelLine={false}>
                            {analysis.analytics.popular_furniture.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [v, 'Заказов']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.analytics.orders_by_year?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-800 mb-4">Выручка по годам</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analysis.analytics.orders_by_year}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'М'} />
                          <Tooltip formatter={(v) => [formatCurrency(v), 'Выручка']} />
                          <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {analysis.analytics.top_clients?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-800 mb-4">Топ клиентов</h3>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {analysis.analytics.top_clients.slice(0, 10).map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-slate-400 w-5">{i + 1}.</span>
                              <span className="text-slate-700 truncate">{c.name}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">{c.orders} зак.</span>
                            </div>
                            <span className="font-medium text-slate-800 flex-shrink-0 ml-2">{formatCurrency(c.total_amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-amber-700" />
                    </div>
                    <h3 className="font-semibold text-amber-900">Инсайты ИИ</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setTab(2)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Перенести всё в FurnFlow
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-400">
              <p>Сначала загрузите файл на первом шаге</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Import */}
      {tab === 2 && (
        <div className="space-y-6 max-w-xl">
          {importResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 relative overflow-hidden">
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-sm animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                        animationDelay: `${Math.random() * 1}s`,
                        animationDuration: `${0.5 + Math.random() * 1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Добро пожаловать в FurnFlow!</h2>
                <p className="text-slate-500 mt-1">
                  {analysis?.analytics?.business_age_years
                    ? `Ваши ${analysis.analytics.business_age_years} лет работы теперь в FurnFlow`
                    : 'Данные успешно загружены в систему'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: 'Клиентов', value: importResult.imported_clients, color: 'text-indigo-600 bg-indigo-50' },
                  { icon: Package, label: 'Заказов', value: importResult.imported_orders, color: 'text-emerald-600 bg-emerald-50' },
                  { icon: AlertTriangle, label: 'Пропущено', value: importResult.skipped_duplicates, color: 'text-amber-600 bg-amber-50' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mx-auto mb-2`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
              {analysis?.source_type && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span>Импортировано из</span>
                  <SourceBadge sourceType={analysis.source_type} />
                </div>
              )}
              <a href="/clients" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Перейти к клиентам <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-slate-800">Подтверждение импорта</h2>
                {analysis && (
                  <p className="text-sm text-slate-500 mt-1">
                    Будет импортировано ~{analysis.data_quality?.recognized_clients ?? analysis.data_quality?.total_rows ?? rows.length} записей
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Пропустить дубликаты</span>
                    <p className="text-xs text-slate-400">Клиенты с совпадающим телефоном или именем будут пропущены</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={clientsOnly} onChange={e => setClientsOnly(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Импортировать только клиентов</span>
                    <p className="text-xs text-slate-400">Без создания заказов в системе</p>
                  </div>
                </label>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Импортируем...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Импортируем...' : 'Перенести всё в FurnFlow'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
