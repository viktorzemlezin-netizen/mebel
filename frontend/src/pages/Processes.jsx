import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Save, Trash2, Edit3, GitBranch, ArrowRight, X, Check,
  Clock, User, ChevronRight, Copy, Loader2, AlertTriangle, Lock,
  ChevronLeft, GripVertical, ToggleLeft, ToggleRight, Users
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const ROLES_LIST = ['Менеджер', 'Замерщик', 'Дизайнер', 'Снабженец', 'Технолог', 'Сборщик', 'Монтажник', 'Бухгалтер', 'Руководитель'];
const FURNITURE_TYPES = ['Кухонный гарнитур', 'Шкаф-купе', 'Гардеробная', 'Прихожая', 'Детская комната', 'Спальня', 'Офисная мебель'];

const ROLE_COLORS = {
  'Менеджер':     { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',   node: 'bg-blue-50 border-blue-300' },
  'Замерщик':     { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',  node: 'bg-amber-50 border-amber-300' },
  'Дизайнер':     { bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-300',   node: 'bg-pink-50 border-pink-300' },
  'Снабженец':    { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-300',   node: 'bg-teal-50 border-teal-300' },
  'Технолог':     { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-300', node: 'bg-indigo-50 border-indigo-300' },
  'Сборщик':      { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-300', node: 'bg-orange-50 border-orange-300' },
  'Монтажник':    { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300',    node: 'bg-red-50 border-red-300' },
  'Бухгалтер':    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300',node: 'bg-emerald-50 border-emerald-300' },
  'Руководитель': { bg: 'bg-slate-200',   text: 'text-slate-700',   border: 'border-slate-400',  node: 'bg-slate-100 border-slate-400' },
};

function getRoleColor(role) {
  return ROLE_COLORS[role] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', node: 'bg-slate-50 border-slate-300' };
}

// ─── Flow Node ────────────────────────────────────────────────────────────────

function FlowNode({ step, index, isSelected, onSelect, onAddAfter, isDragging, dragHandleProps }) {
  const colors = getRoleColor(step.responsible_role);

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {/* Node */}
      <div
        onClick={() => onSelect(index)}
        className={`relative w-44 border-2 rounded-xl cursor-pointer transition-all duration-150 shadow-sm hover:shadow-md
          ${isSelected ? colors.border + ' ring-2 ring-offset-1 ring-brand-400 shadow-md' : colors.node + ' border-opacity-70'}
        `}
      >
        {step.is_parallel && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">∥ параллельно</div>
        )}
        <div className={`px-3 py-3`}>
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
            <div {...dragHandleProps} className="cursor-grab p-0.5 text-slate-300 hover:text-slate-500">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{step.name}</p>
          <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
            <User className="w-3 h-3" />
            {step.responsible_role}
          </div>
          {step.sla_days > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {step.sla_days} {step.sla_days === 1 ? 'день' : 'дней'}
            </div>
          )}
          {step.required_actions && step.required_actions.length > 0 && (
            <div className="mt-1.5 text-xs text-slate-400">
              ✓ {step.required_actions.length} действий
            </div>
          )}
        </div>
      </div>

      {/* Add step button */}
      <button
        onClick={() => onAddAfter(index)}
        className="w-6 h-6 bg-white border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-300 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all flex-shrink-0"
        title="Добавить шаг"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </div>
  );
}

// ─── Step Editor Side Panel ───────────────────────────────────────────────────

function StepPanel({ step, stepIndex, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...step });
  const [actionInput, setActionInput] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const colors = getRoleColor(form.responsible_role);

  const addAction = () => {
    if (!actionInput.trim()) return;
    set('required_actions', [...(form.required_actions || []), actionInput.trim()]);
    setActionInput('');
  };

  const removeAction = (i) => {
    set('required_actions', (form.required_actions || []).filter((_, idx) => idx !== i));
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.bg.replace('bg-', 'bg-').replace('100', '500')}`} />
          <span className="font-semibold text-sm text-slate-800">Шаг {stepIndex + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onDelete(stepIndex)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Название шага *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Замер помещения" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Ответственная роль</label>
          <select value={form.responsible_role} onChange={e => set('responsible_role', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
            {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Срок (дней)</label>
          <input type="number" value={form.sla_days || 1} min={0} onChange={e => set('sla_days', +e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Параллельный шаг</label>
          <button
            onClick={() => set('is_parallel', !form.is_parallel)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-colors ${form.is_parallel ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-slate-200 text-slate-500'}`}
          >
            {form.is_parallel ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {form.is_parallel ? 'Параллельный' : 'Последовательный'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Обязательные действия</label>
          <div className="space-y-1.5 mb-2">
            {(form.required_actions || []).map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 flex-1">{a}</span>
                <button onClick={() => removeAction(i)} className="text-slate-300 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input value={actionInput} onChange={e => setActionInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAction())}
              className="flex-1 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="Добавить действие..." />
            <button onClick={addAction} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-xs">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Уведомить при завершении</label>
          <div className="flex flex-wrap gap-1">
            {ROLES_LIST.map(role => {
              const notifyRoles = form.notify_roles || [];
              const active = notifyRoles.includes(role);
              return (
                <button key={role} onClick={() => set('notify_roles', active ? notifyRoles.filter(r => r !== role) : [...notifyRoles, role])}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${active ? getRoleColor(role).bg + ' ' + getRoleColor(role).text + ' ' + getRoleColor(role).border : 'border-slate-200 text-slate-500'}`}>
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button onClick={() => onSave(stepIndex, form)}
          disabled={!form.name}
          className="w-full btn-primary flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Сохранить шаг
        </button>
      </div>
    </div>
  );
}

// ─── Default Steps ─────────────────────────────────────────────────────────────

function makeDefaultSteps(furnitureType) {
  const base = [
    { name: 'Заявка принята', responsible_role: 'Менеджер', sla_days: 1, required_actions: ['Заполнить карточку клиента', 'Уточнить бюджет', 'Назначить замерщика'], is_parallel: false, notify_roles: ['Замерщик'] },
    { name: 'Выезд на замер', responsible_role: 'Замерщик', sla_days: 2, required_actions: ['Выехать на объект', 'Замерить все стены', 'Сфотографировать помещение', 'Заполнить акт замера'], is_parallel: false, notify_roles: ['Дизайнер', 'Менеджер'] },
    { name: 'Разработка проекта', responsible_role: 'Дизайнер', sla_days: 3, required_actions: ['Создать 3D модель', 'Согласовать с менеджером', 'Подготовить чертежи'], is_parallel: false, notify_roles: ['Менеджер'] },
    { name: 'Согласование с клиентом', responsible_role: 'Менеджер', sla_days: 2, required_actions: ['Отправить КП клиенту', 'Получить подтверждение', 'Оформить договор'], is_parallel: false, notify_roles: ['Снабженец', 'Технолог'] },
    { name: 'Закупка материалов', responsible_role: 'Снабженец', sla_days: 3, required_actions: ['Составить список материалов', 'Разместить заказ у поставщиков', 'Получить материалы'], is_parallel: true, notify_roles: ['Технолог'] },
    { name: 'Производство', responsible_role: 'Технолог', sla_days: 5, required_actions: ['Раскрой деталей', 'Обработка кромки', 'Сборка корпусов', 'Проверка качества'], is_parallel: true, notify_roles: ['Монтажник', 'Менеджер'] },
    { name: 'Монтаж и сдача', responsible_role: 'Монтажник', sla_days: 2, required_actions: ['Выехать на объект', 'Установить мебель', 'Подписать акт сдачи'], is_parallel: false, notify_roles: ['Менеджер', 'Бухгалтер'] },
  ];
  return base.map((s, i) => ({ ...s, step_index: i }));
}

// ─── Template Sidebar ─────────────────────────────────────────────────────────

function TemplateSidebar({ templates, selectedId, onSelect, onCreate, onClone, loading }) {
  return (
    <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="font-semibold text-sm text-slate-700">Шаблоны</span>
        <button onClick={onCreate} className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-6 px-3 text-xs text-slate-400">Нет шаблонов. Создайте первый!</div>
        ) : (
          templates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedId === t.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="font-medium truncate">{t.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.furniture_type}</div>
            </button>
          ))
        )}
      </div>
      {selectedId && (
        <div className="p-3 border-t border-slate-100">
          <button onClick={onClone} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 py-1.5">
            <Copy className="w-3.5 h-3.5" /> Клонировать
          </button>
        </div>
      )}
    </div>
  );
}

// ─── New Template Modal ────────────────────────────────────────────────────────

function NewTemplateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', furniture_type: 'Кухонный гарнитур' });
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-slate-900">Новый шаблон</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Название *</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Стандартный процесс Кухня" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Тип мебели</label>
            <select value={form.furniture_type} onChange={e => setForm(f => ({...f, furniture_type: e.target.value}))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
              {FURNITURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 btn-secondary text-sm">Отмена</button>
            <button onClick={() => form.name && onCreate(form)} disabled={!form.name} className="flex-1 btn-primary text-sm">Создать</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Processes() {
  const { showToast } = useApp();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedStepIdx, setSelectedStepIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const flowRef = useRef(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.getProcesses();
      setTemplates(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadTemplates(); }, []);

  const selectTemplate = (t) => {
    if (isDirty && !confirm('Несохранённые изменения будут потеряны. Продолжить?')) return;
    setSelectedTemplate(t);
    try {
      const parsed = JSON.parse(t.steps_json || '[]');
      setSteps(parsed);
    } catch { setSteps([]); }
    setSelectedStepIdx(null);
    setIsDirty(false);
  };

  const handleCreate = async (form) => {
    const defaultSteps = makeDefaultSteps(form.furniture_type);
    try {
      const created = await api.createProcess({
        name: form.name,
        furniture_type: form.furniture_type,
        steps_json: JSON.stringify(defaultSteps),
        is_default: 0,
      });
      await loadTemplates();
      selectTemplate({ ...created, steps_json: JSON.stringify(defaultSteps) });
      showToast('Шаблон создан');
    } catch { showToast('Ошибка создания', 'error'); }
    setShowNewModal(false);
  };

  const handleClone = async () => {
    if (!selectedTemplate) return;
    try {
      const created = await api.createProcess({
        name: selectedTemplate.name + ' (копия)',
        furniture_type: selectedTemplate.furniture_type,
        steps_json: JSON.stringify(steps),
        is_default: 0,
      });
      await loadTemplates();
      showToast('Шаблон клонирован');
    } catch { showToast('Ошибка', 'error'); }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await api.updateProcess(selectedTemplate.id, {
        name: selectedTemplate.name,
        furniture_type: selectedTemplate.furniture_type,
        steps_json: JSON.stringify(steps.map((s, i) => ({ ...s, step_index: i }))),
      });
      showToast('Сохранено');
      setIsDirty(false);
    } catch { showToast('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (!confirm('Удалить шаблон "' + selectedTemplate.name + '"?')) return;
    try {
      await api.deleteProcess(selectedTemplate.id);
      await loadTemplates();
      setSelectedTemplate(null);
      setSteps([]);
      setSelectedStepIdx(null);
      showToast('Удалено');
    } catch { showToast('Ошибка', 'error'); }
  };

  const addStepAfter = (index) => {
    const newStep = {
      name: 'Новый шаг',
      responsible_role: 'Менеджер',
      sla_days: 1,
      required_actions: [],
      is_parallel: false,
      notify_roles: [],
      step_index: index + 1,
    };
    const newSteps = [...steps.slice(0, index + 1), newStep, ...steps.slice(index + 1)];
    setSteps(newSteps.map((s, i) => ({ ...s, step_index: i })));
    setSelectedStepIdx(index + 1);
    setIsDirty(true);
  };

  const addStepAtStart = () => {
    const newStep = {
      name: 'Новый шаг',
      responsible_role: 'Менеджер',
      sla_days: 1,
      required_actions: [],
      is_parallel: false,
      notify_roles: [],
    };
    setSteps([newStep, ...steps].map((s, i) => ({ ...s, step_index: i })));
    setSelectedStepIdx(0);
    setIsDirty(true);
  };

  const updateStep = (index, form) => {
    const newSteps = steps.map((s, i) => i === index ? { ...s, ...form } : s);
    setSteps(newSteps);
    setIsDirty(true);
  };

  const deleteStep = (index) => {
    if (!confirm('Удалить шаг?')) return;
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_index: i }));
    setSteps(newSteps);
    setSelectedStepIdx(null);
    setIsDirty(true);
  };

  // Drag and drop
  const handleDragStart = (index) => setDragIdx(index);
  const handleDragOver = (e, index) => { e.preventDefault(); setDragOverIdx(index); };
  const handleDrop = (index) => {
    if (dragIdx === null || dragIdx === index) { setDragIdx(null); setDragOverIdx(null); return; }
    const newSteps = [...steps];
    const [removed] = newSteps.splice(dragIdx, 1);
    newSteps.splice(index, 0, removed);
    setSteps(newSteps.map((s, i) => ({ ...s, step_index: i })));
    setSelectedStepIdx(index);
    setDragIdx(null);
    setDragOverIdx(null);
    setIsDirty(true);
  };

  const totalSla = steps.reduce((s, step) => step.is_parallel ? s : s + (step.sla_days || 0), 0);
  const selectedStep = selectedStepIdx !== null ? steps[selectedStepIdx] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-4 sm:-m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {selectedTemplate ? selectedTemplate.name : 'Шаблоны процессов'}
            </h1>
            {selectedTemplate && (
              <p className="text-xs text-slate-500">{selectedTemplate.furniture_type} · {steps.length} шагов · ~{totalSla} дней</p>
            )}
          </div>
          {isDirty && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Не сохранено</span>}
        </div>

        <div className="flex items-center gap-2">
          {selectedTemplate && (
            <>
              <button onClick={handleDeleteTemplate} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={handleSave} disabled={saving || !isDirty}
                className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Сохранить
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Template list sidebar */}
        <TemplateSidebar
          templates={templates}
          selectedId={selectedTemplate?.id}
          onSelect={selectTemplate}
          onCreate={() => setShowNewModal(true)}
          onClone={handleClone}
          loading={loading}
        />

        {/* Flow editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {!selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <GitBranch className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Выберите шаблон из списка слева</p>
              <p className="text-slate-400 text-sm mt-1">или создайте новый нажав «+»</p>
            </div>
          ) : (
            <>
              {/* Flow canvas */}
              <div ref={flowRef} className="flex-1 overflow-x-auto overflow-y-auto p-6">
                <div className="flex items-start gap-0 min-w-max">
                  {/* Add at start button */}
                  <button onClick={addStepAtStart}
                    className="flex-shrink-0 w-10 h-10 mr-2 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all self-center">
                    <Plus className="w-4 h-4" />
                  </button>

                  {steps.length === 0 ? (
                    <div className="flex items-center justify-center w-64 h-32 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm self-center">
                      Нет шагов. Нажмите + для добавления.
                    </div>
                  ) : (
                    steps.map((step, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        className={`transition-opacity ${dragOverIdx === index && dragIdx !== index ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <FlowNode
                          step={step}
                          index={index}
                          isSelected={selectedStepIdx === index}
                          onSelect={setSelectedStepIdx}
                          onAddAfter={addStepAfter}
                          dragHandleProps={{
                            onMouseDown: () => {},
                          }}
                        />
                      </div>
                    ))
                  )}

                  {/* Final node */}
                  {steps.length > 0 && (
                    <div className="flex-shrink-0 w-20 h-12 bg-emerald-100 border-2 border-emerald-300 rounded-xl flex items-center justify-center self-center ml-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {Object.entries(ROLE_COLORS).slice(0, 5).map(([role, colors]) => (
                    <div key={role} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      <div className={`w-2 h-2 rounded-full ${colors.bg.replace('100', '500')}`} />
                      {role}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-4 px-4 py-2 bg-white border-t border-slate-200 text-xs text-slate-500 flex-shrink-0">
                <span>{steps.length} шагов</span>
                <span>~{totalSla} дней (последовательных)</span>
                <span>{steps.filter(s => s.is_parallel).length} параллельных</span>
              </div>
            </>
          )}
        </div>

        {/* Step editor panel */}
        {selectedStep && (
          <StepPanel
            step={selectedStep}
            stepIndex={selectedStepIdx}
            onSave={updateStep}
            onDelete={deleteStep}
            onClose={() => setSelectedStepIdx(null)}
          />
        )}
      </div>

      {showNewModal && <NewTemplateModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
