import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Phone, MessageSquare, Calendar, FileText, CheckCircle, AlertTriangle, Loader2, ChevronRight, X, Plus, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const STAGES = [
  { id: 'new',       label: 'Новая заявка',  color: 'bg-slate-100 text-slate-700' },
  { id: 'call',      label: 'Звонок',        color: 'bg-blue-100 text-blue-700' },
  { id: 'meeting',   label: 'Встреча',       color: 'bg-violet-100 text-violet-700' },
  { id: 'proposal',  label: 'КП отправлено', color: 'bg-amber-100 text-amber-700' },
  { id: 'contract',  label: 'Договор',       color: 'bg-orange-100 text-orange-700' },
  { id: 'working',   label: 'В работе',      color: 'bg-emerald-100 text-emerald-700' },
  { id: 'closed',    label: 'Закрыт',        color: 'bg-rose-100 text-rose-700' },
];

const SOURCES = {
  instagram: '📸 Instagram', call: '📞 Звонок', website: '🌐 Сайт',
  whatsapp: '💬 WhatsApp', referral: '👥 Рекомендация', avito: '🛒 Авито', other: '📋 Другое',
};

const QUICK_ACTIONS = [
  { id: 'called', label: 'Позвонил клиенту', icon: Phone, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'meeting', label: 'Назначил встречу', icon: Calendar, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'proposal', label: 'Отправил КП', icon: FileText, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'note', label: 'Добавить заметку', icon: MessageSquare, color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, showToast, refreshAll } = useApp();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('main');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [editStage, setEditStage] = useState(false);
  const [nextActionDate, setNextActionDate] = useState('');

  const load = async () => {
    try {
      const data = await api.getLead(id);
      setLead(data);
      setNextActionDate(data.next_action_date || '');
    } catch (err) {
      showToast('Ошибка загрузки: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const changeStage = async (newStage) => {
    setSaving(true);
    try {
      await api.updateLead(id, { stage: newStage, performed_by: currentRole?.role || 'Менеджер' });
      await load();
      setEditStage(false);
      showToast('Этап обновлён');
    } catch (err) { showToast(err.message, 'error'); }
    setSaving(false);
  };

  const addAction = async (actionLabel) => {
    setSaving(true);
    try {
      await api.addLeadAction(id, {
        action: actionLabel,
        performed_by: currentRole?.role || 'Менеджер',
        notes: actionNote,
        next_action_date: nextActionDate || undefined,
      });
      await load();
      setActionNote('');
      setActiveAction(null);
      showToast('Действие добавлено');
    } catch (err) { showToast(err.message, 'error'); }
    setSaving(false);
  };

  const handleConvert = async () => {
    if (!confirm('Конвертировать лид в заказ?')) return;
    setConverting(true);
    try {
      const data = await api.convertLead(id, { performed_by: currentRole?.role || 'Менеджер' });
      showToast(`Заказ ${data.order_number} создан!`, 'success');
      refreshAll();
      navigate(`/orders/${data.order_id}`);
    } catch (err) { showToast(err.message, 'error'); }
    setConverting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );
  if (!lead) return <div className="text-center py-20 text-slate-400">Лид не найден</div>;

  const stageInfo = STAGES.find(s => s.id === lead.stage) || STAGES[0];
  const isOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date();
  const isConverted = lead.stage === 'converted';

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/leads" className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 text-xl truncate">{lead.client_name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${stageInfo.color}`}>
              {stageInfo.label}
            </span>
            {lead.source && <span className="text-xs text-slate-500">{SOURCES[lead.source] || lead.source}</span>}
            {isOverdue && <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><AlertTriangle className="w-3 h-3" />Просрочено</span>}
          </div>
        </div>
        {!isConverted && (
          <button onClick={handleConvert} disabled={converting}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
            {converting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
            В заказ
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[['main', 'Основное'], ['history', 'История'], ['actions', 'Действия']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Main tab */}
      {tab === 'main' && (
        <div className="space-y-4">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Телефон', lead.client_phone || '—'],
                ['Тип мебели', lead.furniture_type || '—'],
                ['Бюджет', lead.budget_range || '—'],
                ['Ответственный', lead.responsible || '—'],
                ['Создан', lead.created_at ? new Date(lead.created_at).toLocaleDateString('ru-RU') : '—'],
                ['Источник', SOURCES[lead.source] || lead.source || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Комментарий</p>
                <p className="text-sm text-slate-700">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Next action */}
          {lead.next_action && (
            <div className={`rounded-2xl border p-4 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-xs font-semibold mb-1 ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                {isOverdue ? '⚠️ Просроченное действие' : '📋 Следующий шаг'}
              </p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-amber-800'}`}>{lead.next_action}</p>
              {lead.next_action_date && (
                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                  {new Date(lead.next_action_date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}

          {/* Stage changer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Этап воронки</p>
              <button onClick={() => setEditStage(!editStage)} className="text-xs text-indigo-600 hover:text-indigo-800">
                {editStage ? 'Отмена' : 'Изменить'}
              </button>
            </div>
            {editStage ? (
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map(s => (
                  <button key={s.id} onClick={() => changeStage(s.id)} disabled={saving}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${s.id === lead.stage ? s.color + ' ring-2 ring-offset-1 ring-indigo-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s, i) => {
                  const stageIdx = STAGES.findIndex(x => x.id === lead.stage);
                  const isCurrent = s.id === lead.stage;
                  const isPast = i < stageIdx;
                  return (
                    <div key={s.id} className={`flex items-center gap-1 ${i > 0 ? '' : ''}`}>
                      {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all ${isCurrent ? s.color : isPast ? 'bg-slate-100 text-slate-400' : 'text-slate-300'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {(lead.history || []).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">История пуста</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(lead.history || []).map((entry, i) => (
                <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{entry.action}</p>
                    {entry.notes && <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.performed_by} · {entry.created_at ? new Date(entry.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions tab */}
      {tab === 'actions' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <button key={action.id} onClick={() => setActiveAction(activeAction === action.id ? null : action.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${action.color} ${activeAction === action.id ? 'ring-2 ring-indigo-400' : ''}`}>
                <action.icon className="w-4 h-4 flex-shrink-0" />
                {action.label}
              </button>
            ))}
          </div>

          {activeAction && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                {QUICK_ACTIONS.find(a => a.id === activeAction)?.label}
              </p>
              <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                placeholder="Заметка (необязательно)..." rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Следующий шаг — дедлайн</label>
                <input type="datetime-local" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => addAction(QUICK_ACTIONS.find(a => a.id === activeAction)?.label)} disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Записать
                </button>
                <button onClick={() => setActiveAction(null)} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
