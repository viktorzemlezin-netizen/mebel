import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users, Clock, AlertTriangle, ChevronRight, Phone, MessageSquare, Instagram, Globe, Star, ShoppingBag, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const STAGES = [
  { id: 'new',        label: 'Новая заявка',    color: 'bg-slate-100 text-slate-700',    dot: 'bg-slate-400' },
  { id: 'call',       label: 'Звонок',          color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  { id: 'meeting',    label: 'Встреча',         color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
  { id: 'proposal',   label: 'КП отправлено',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  { id: 'contract',   label: 'Договор',         color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500' },
  { id: 'working',    label: 'В работе',        color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500' },
  { id: 'closed',     label: 'Закрыт',          color: 'bg-rose-100 text-rose-700',      dot: 'bg-rose-500' },
  { id: 'converted',  label: 'Конвертирован',   color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-500' },
];

const SOURCES = [
  { id: 'instagram', label: 'Instagram',     icon: '📸' },
  { id: 'call',      label: 'Звонок',        icon: '📞' },
  { id: 'website',   label: 'Сайт',          icon: '🌐' },
  { id: 'whatsapp',  label: 'WhatsApp',      icon: '💬' },
  { id: 'referral',  label: 'Рекомендация',  icon: '👥' },
  { id: 'avito',     label: 'Авито',         icon: '🛒' },
  { id: 'other',     label: 'Другое',        icon: '📋' },
];

const FURNITURE_TYPES = ['Кухня', 'Шкаф-купе', 'Гардеробная', 'Прихожая', 'Детская', 'Спальня', 'Офисная', 'Другое'];
const BUDGETS = ['до 200к', '200-500к', '500к-1млн', 'от 1млн'];

function sourceInfo(id) { return SOURCES.find(s => s.id === id) || { icon: '📋', label: id || 'Другое' }; }
function stageInfo(id) { return STAGES.find(s => s.id === id) || STAGES[0]; }

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────
function NewLeadModal({ onClose, onCreated }) {
  const { currentRole } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: '', client_phone: '', source: 'instagram',
    furniture_type: 'Кухня', budget_range: '200-500к',
    responsible: currentRole?.role || 'Менеджер',
    next_action: '', next_action_date: '', notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) return;
    setSaving(true);
    try {
      const data = await api.createLead(form);
      onCreated(data);
      onClose();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Новый лид</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Имя клиента *</label>
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)} required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Болат Сейткали" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Телефон</label>
              <input value={form.client_phone} onChange={e => set('client_phone', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="+7 (700) 000-00-00" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Источник</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {SOURCES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Тип мебели</label>
              <select value={form.furniture_type} onChange={e => set('furniture_type', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {FURNITURE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Примерный бюджет</label>
              <select value={form.budget_range} onChange={e => set('budget_range', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ответственный</label>
              <input value={form.responsible} onChange={e => set('responsible', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Следующее действие</label>
              <input value={form.next_action} onChange={e => set('next_action', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Позвонить, уточнить размеры" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Дедлайн</label>
              <input type="datetime-local" value={form.next_action_date} onChange={e => set('next_action_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Комментарий</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Доп. информация о клиенте..." />
          </div>

          <button type="submit" disabled={saving || !form.client_name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Сохранение...' : 'Создать лид'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({ lead }) {
  const src = sourceInfo(lead.source);
  const stage = stageInfo(lead.stage);
  const overdue = isOverdue(lead.next_action_date);
  const createdDate = lead.created_at ? new Date(lead.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '';

  return (
    <Link to={`/leads/${lead.id}`} className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{lead.client_name}</p>
          {lead.client_phone && <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.client_phone}</p>}
        </div>
        <span className="text-lg flex-shrink-0">{src.icon}</span>
      </div>

      {lead.furniture_type && (
        <p className="text-xs text-slate-600 mb-2">🛋️ {lead.furniture_type}</p>
      )}
      {lead.budget_range && (
        <p className="text-xs text-slate-500 mb-2">💰 {lead.budget_range}</p>
      )}

      {lead.next_action && (
        <div className={`flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${overdue ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
          {overdue && <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
          <span className="leading-tight line-clamp-1">{lead.next_action}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-slate-400">{createdDate}</span>
        {lead.responsible && <span className="text-xs text-slate-400 truncate ml-2">{lead.responsible}</span>}
      </div>
    </Link>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ leads }) {
  const activeStages = STAGES.filter(s => s.id !== 'converted');
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3" style={{ minWidth: `${activeStages.length * 220}px` }}>
        {activeStages.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} className="w-52 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${stage.color}`}>
                <span className={`w-2 h-2 rounded-full ${stage.dot} flex-shrink-0`} />
                <span className="text-xs font-semibold flex-1 leading-tight">{stage.label}</span>
                <span className="text-xs opacity-60 font-semibold">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(l => <LeadCard key={l.id} lead={l} />)}
                {stageLeads.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-300">пусто</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function TableView({ leads }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Клиент</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Источник</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Мебель</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Этап</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Следующий шаг</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Ответственный</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map(lead => {
            const src = sourceInfo(lead.source);
            const stage = stageInfo(lead.stage);
            const overdue = isOverdue(lead.next_action_date);
            return (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{lead.client_name}</div>
                  {lead.client_phone && <div className="text-xs text-slate-400">{lead.client_phone}</div>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-base" title={src.label}>{src.icon}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-600 text-xs">{lead.furniture_type || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {lead.next_action ? (
                    <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {overdue && '⚠️ '}{lead.next_action}
                    </span>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{lead.responsible || '—'}</td>
                <td className="px-4 py-3">
                  <Link to={`/leads/${lead.id}`} className="text-indigo-500 hover:text-indigo-700">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
          {leads.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">Нет лидов</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // kanban | table
  const [showModal, setShowModal] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');

  const loadLeads = async () => {
    try {
      const data = await api.getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadLeads(); }, []);

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.client_name?.toLowerCase().includes(search.toLowerCase()) || l.client_phone?.includes(search);
    const matchStage = stageFilter === 'all' || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const todayLeads = leads.filter(l => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const overdueLeads = leads.filter(l => isOverdue(l.next_action_date) && l.stage !== 'closed' && l.stage !== 'converted').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Лиды</h1>
          <p className="text-slate-500 text-sm mt-0.5">CRM воронка продаж</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Новый лид
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего лидов', value: leads.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Сегодня', value: todayLeads, icon: Plus, color: todayLeads > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-50' },
          { label: 'Просрочено', value: overdueLeads, icon: AlertTriangle, color: overdueLeads > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50' },
          { label: 'В работе', value: leads.filter(l => l.stage === 'working').length, icon: ChevronRight, color: 'text-amber-600 bg-amber-50' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{item.value}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="all">Все этапы</option>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {[['kanban', '⬛ Kanban'], ['table', '☰ Таблица']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView leads={filtered} />
      ) : (
        <TableView leads={filtered} />
      )}

      {showModal && (
        <NewLeadModal
          onClose={() => setShowModal(false)}
          onCreated={(newLead) => { setLeads(prev => [newLead, ...prev]); }}
        />
      )}
    </div>
  );
}
