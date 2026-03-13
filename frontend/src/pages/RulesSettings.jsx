import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Trash2, Edit3, Save, X, ToggleLeft, ToggleRight,
  Truck, Cpu, Calendar, Zap, AlertTriangle, CheckCircle, Loader2,
  ChevronDown, ChevronRight, Package, Wrench, Clock
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import SmartDeadline from '../components/SmartDeadline.jsx';

const TRIGGER_TYPES = [
  { value: 'material_added', label: 'При добавлении материала' },
  { value: 'operation_added', label: 'При добавлении операции' },
  { value: 'order_created', label: 'При создании заказа' },
];

const ACTION_TYPES = [
  { value: 'add_days', label: 'Добавить дни к сроку' },
  { value: 'create_task', label: 'Создать задачу' },
  { value: 'notify', label: 'Уведомить роли' },
  { value: 'check_stock', label: 'Проверить склад' },
];

const EQUIPMENT_TYPES = [
  { value: 'cnc', label: 'ЧПУ станок' },
  { value: 'edge_banding', label: 'Кромкооблицовочный' },
  { value: 'drilling', label: 'Присадочный' },
  { value: 'assembly', label: 'Сборочный' },
  { value: 'other', label: 'Другое' },
];

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'На складе', color: 'text-emerald-600 bg-emerald-50' },
  { value: 'low_stock', label: 'Заканчивается', color: 'text-amber-600 bg-amber-50' },
  { value: 'out_of_stock', label: 'Нет в наличии', color: 'text-red-600 bg-red-50' },
  { value: 'order_required', label: 'Под заказ', color: 'text-blue-600 bg-blue-50' },
];

const DEFAULT_RULES = [
  {
    name: 'Blum фурнитура не на складе',
    trigger_type: 'material_added',
    trigger_condition: { supplier: 'Blum', stock_status: 'out_of_stock' },
    actions: [
      { type: 'add_days', days: 3, reason: 'Доставка Blum 3 дня' },
      { type: 'create_task', role: 'снабженец', title: 'Заказать фурнитуру Blum' },
      { type: 'notify', roles: ['менеджер', 'снабженец'], message: 'Требуется заказ Blum' },
    ],
    is_active: 1,
  },
  {
    name: 'Сложная фрезеровка ЧПУ',
    trigger_type: 'operation_added',
    trigger_condition: { operation_type: 'cnc_complex' },
    actions: [
      { type: 'add_days', days: 3, reason: 'Занятость ЧПУ станка' },
      { type: 'notify', roles: ['технолог'], message: 'Нужна проверка расписания ЧПУ' },
    ],
    is_active: 1,
  },
  {
    name: 'Нестандартная кромка',
    trigger_type: 'operation_added',
    trigger_condition: { operation_type: 'edge_nonstandard' },
    actions: [
      { type: 'add_days', days: 1, reason: 'Ручная работа кромкооблицовочный' },
    ],
    is_active: 1,
  },
  {
    name: 'Материал под заказ из другого города',
    trigger_type: 'material_added',
    trigger_condition: { stock_status: 'out_of_stock', stock_source: 'supplier_other_city' },
    actions: [
      { type: 'add_days', days: 7, reason: 'Доставка из другого города' },
      { type: 'create_task', role: 'снабженец', title: 'Заказать материал у иногороднего поставщика' },
      { type: 'notify', roles: ['менеджер', 'снабженец'], message: 'Материал под заказ — уточните сроки' },
    ],
    is_active: 1,
  },
];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SupplierForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: '', city: '', delivery_days: 0, visit_schedule: '', lead_time_days: 0, notes: '' });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Название *</label>
          <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-sm w-full" placeholder="Рынок Актобе" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Город</label>
          <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="input-sm w-full" placeholder="Актобе" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Срок поставки (дней)</label>
          <input type="number" value={form.lead_time_days} onChange={e => setForm(p => ({...p, lead_time_days: +e.target.value}))} className="input-sm w-full" min="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Доставка (дней)</label>
          <input type="number" value={form.delivery_days} onChange={e => setForm(p => ({...p, delivery_days: +e.target.value}))} className="input-sm w-full" min="0" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">График визитов</label>
        <input value={form.visit_schedule} onChange={e => setForm(p => ({...p, visit_schedule: e.target.value}))} className="input-sm w-full" placeholder="monday,thursday / every_wednesday" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Примечания</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="input-sm w-full" rows={2} />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 btn-secondary text-sm">Отмена</button>
        <button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 btn-primary text-sm">Сохранить</button>
      </div>
    </div>
  );
}

function EquipmentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: '', type: 'cnc', is_available: 1, busy_until: '', daily_capacity_minutes: 480, notes: '' });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Название *</label>
          <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-sm w-full" placeholder="ЧПУ станок #1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Тип</label>
          <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className="input-sm w-full">
            {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Статус</label>
          <select value={form.is_available} onChange={e => setForm(p => ({...p, is_available: +e.target.value}))} className="input-sm w-full">
            <option value={1}>Свободен</option>
            <option value={0}>Занят</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Занят до</label>
          <input type="date" value={form.busy_until || ''} onChange={e => setForm(p => ({...p, busy_until: e.target.value}))} className="input-sm w-full" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Мощность (мин/день)</label>
        <input type="number" value={form.daily_capacity_minutes} onChange={e => setForm(p => ({...p, daily_capacity_minutes: +e.target.value}))} className="input-sm w-full" min="60" />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 btn-secondary text-sm">Отмена</button>
        <button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 btn-primary text-sm">Сохранить</button>
      </div>
    </div>
  );
}

function RuleEditor({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', trigger_type: 'material_added',
    trigger_condition: {}, actions: [], is_active: 1,
  });

  const addAction = () => setForm(p => ({ ...p, actions: [...p.actions, { type: 'add_days', days: 1, reason: '' }] }));
  const removeAction = (i) => setForm(p => ({ ...p, actions: p.actions.filter((_, idx) => idx !== i) }));
  const updateAction = (i, val) => setForm(p => ({ ...p, actions: p.actions.map((a, idx) => idx === i ? { ...a, ...val } : a) }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Название правила *</label>
        <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-sm w-full" placeholder="Например: Blum под заказ" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Триггер</label>
        <select value={form.trigger_type} onChange={e => setForm(p => ({...p, trigger_type: e.target.value}))} className="input-sm w-full">
          {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Условие триггера</label>
        <div className="space-y-2">
          {form.trigger_type === 'material_added' && <>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.trigger_condition.supplier || ''}
                onChange={e => setForm(p => ({...p, trigger_condition: {...p.trigger_condition, supplier: e.target.value}}))}
                className="input-sm w-full" placeholder="Поставщик (Blum, Egger...)"
              />
              <select
                value={form.trigger_condition.stock_status || ''}
                onChange={e => setForm(p => ({...p, trigger_condition: {...p.trigger_condition, stock_status: e.target.value}}))}
                className="input-sm w-full"
              >
                <option value="">Любой статус</option>
                {STOCK_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <input
              value={form.trigger_condition.material_category || ''}
              onChange={e => setForm(p => ({...p, trigger_condition: {...p.trigger_condition, material_category: e.target.value}}))}
              className="input-sm w-full" placeholder="Категория материала (фурнитура, ЛДСП...)"
            />
          </>}
          {form.trigger_type === 'operation_added' && (
            <input
              value={form.trigger_condition.operation_type || ''}
              onChange={e => setForm(p => ({...p, trigger_condition: {...p.trigger_condition, operation_type: e.target.value}}))}
              className="input-sm w-full" placeholder="Тип операции (cnc_complex, edge_nonstandard...)"
            />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">Действия</label>
          <button onClick={addAction} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {form.actions.map((action, i) => (
            <div key={i} className="flex gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="flex-1 space-y-1.5">
                <select value={action.type} onChange={e => updateAction(i, { type: e.target.value })} className="input-sm w-full text-xs">
                  {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {action.type === 'add_days' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="number" value={action.days || 1} onChange={e => updateAction(i, { days: +e.target.value })} className="input-sm w-full text-xs" placeholder="Кол-во дней" min="1" />
                    <input value={action.reason || ''} onChange={e => updateAction(i, { reason: e.target.value })} className="input-sm w-full text-xs" placeholder="Причина" />
                  </div>
                )}
                {action.type === 'create_task' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <input value={action.role || ''} onChange={e => updateAction(i, { role: e.target.value })} className="input-sm w-full text-xs" placeholder="Роль" />
                    <input value={action.title || ''} onChange={e => updateAction(i, { title: e.target.value })} className="input-sm w-full text-xs" placeholder="Задача" />
                  </div>
                )}
                {action.type === 'notify' && (
                  <input value={(action.roles || []).join(', ')} onChange={e => updateAction(i, { roles: e.target.value.split(',').map(r => r.trim()) })} className="input-sm w-full text-xs" placeholder="Роли через запятую" />
                )}
              </div>
              <button onClick={() => removeAction(i)} className="text-red-400 hover:text-red-600 mt-0.5 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 btn-secondary text-sm">Отмена</button>
        <button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 btn-primary text-sm">Сохранить правило</button>
      </div>
    </div>
  );
}

export default function RulesSettings() {
  const { showToast } = useApp();
  const [tab, setTab] = useState('rules');
  const [subTab, setSubTab] = useState('suppliers');

  const [suppliers, setSuppliers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [supplierModal, setSupplierModal] = useState(null); // null | 'new' | {obj}
  const [equipModal, setEquipModal] = useState(null);
  const [ruleModal, setRuleModal] = useState(null);

  // Test state
  const [testMaterials, setTestMaterials] = useState([]);
  const [testHardware, setTestHardware] = useState('');
  const [testOperations, setTestOperations] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getSuppliers().then(setSuppliers).catch(() => {}),
      api.getEquipment().then(setEquipment).catch(() => {}),
      api.getBusinessRules().then(setRules).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const saveSupplier = async (form) => {
    try {
      if (supplierModal?.id) {
        const updated = await api.updateSupplier(supplierModal.id, form);
        setSuppliers(prev => prev.map(s => s.id === supplierModal.id ? updated : s));
      } else {
        const created = await api.createSupplier(form);
        setSuppliers(prev => [...prev, created]);
      }
      showToast('Поставщик сохранён');
      setSupplierModal(null);
    } catch { showToast('Ошибка сохранения', 'error'); }
  };

  const deleteSupplier = async (id) => {
    if (!confirm('Удалить поставщика?')) return;
    await api.deleteSupplier(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    showToast('Удалено');
  };

  const saveEquipment = async (form) => {
    try {
      if (equipModal?.id) {
        const updated = await api.updateEquipment(equipModal.id, form);
        setEquipment(prev => prev.map(e => e.id === equipModal.id ? updated : e));
      } else {
        const created = await api.createEquipment(form);
        setEquipment(prev => [...prev, created]);
      }
      showToast('Оборудование сохранено');
      setEquipModal(null);
    } catch { showToast('Ошибка сохранения', 'error'); }
  };

  const deleteEquipment = async (id) => {
    if (!confirm('Удалить оборудование?')) return;
    await api.deleteEquipment(id);
    setEquipment(prev => prev.filter(e => e.id !== id));
    showToast('Удалено');
  };

  const saveRule = async (form) => {
    try {
      if (ruleModal?.id) {
        const updated = await api.updateBusinessRule(ruleModal.id, form);
        setRules(prev => prev.map(r => r.id === ruleModal.id ? updated : r));
      } else {
        const created = await api.createBusinessRule(form);
        setRules(prev => [...prev, created]);
      }
      showToast('Правило сохранено');
      setRuleModal(null);
    } catch { showToast('Ошибка сохранения', 'error'); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Удалить правило?')) return;
    await api.deleteBusinessRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('Удалено');
  };

  const toggleRule = async (rule) => {
    const updated = await api.updateBusinessRule(rule.id, { ...rule, is_active: rule.is_active ? 0 : 1 });
    setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
  };

  const loadDefaultRules = async () => {
    if (!confirm('Загрузить 4 стандартных правила? Уже существующие не будут дублированы.')) return;
    let added = 0;
    for (const rule of DEFAULT_RULES) {
      const exists = rules.find(r => r.name === rule.name);
      if (!exists) {
        const created = await api.createBusinessRule(rule);
        setRules(prev => [...prev, created]);
        added++;
      }
    }
    showToast(`Добавлено правил: ${added}`);
  };

  const TABS = [
    { id: 'resources', label: 'Ресурсы', icon: Package },
    { id: 'rules', label: 'Правила', icon: Zap },
    { id: 'test', label: 'Тест правил', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Загрузка...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Бизнес-правила</h1>
          <p className="text-sm text-slate-500">Настройка автоматических правил расчёта сроков</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* RESOURCES */}
      {tab === 'resources' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-2">
            {['suppliers', 'equipment'].map(st => (
              <button
                key={st}
                onClick={() => setSubTab(st)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${subTab === st ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {st === 'suppliers' ? 'Поставщики' : 'Оборудование'}
              </button>
            ))}
          </div>

          {subTab === 'suppliers' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-600" /> Поставщики ({suppliers.length})
                </h3>
                <button onClick={() => setSupplierModal({})} className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              </div>
              {suppliers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Поставщики не добавлены. Нажмите «Добавить» для начала.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {suppliers.map(s => (
                    <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-500 flex gap-3">
                          {s.city && <span>{s.city}</span>}
                          {s.lead_time_days > 0 && <span>Срок поставки: {s.lead_time_days} дн.</span>}
                          {s.visit_schedule && <span>График: {s.visit_schedule}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setSupplierModal(s)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSupplier(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {subTab === 'equipment' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-600" /> Оборудование ({equipment.length})
                </h3>
                <button onClick={() => setEquipModal({})} className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              </div>
              {equipment.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Оборудование не добавлено.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {equipment.map(e => (
                    <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${e.is_available ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <Wrench className={`w-5 h-5 ${e.is_available ? 'text-emerald-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800">{e.name}</div>
                        <div className="text-xs text-slate-500 flex gap-3">
                          <span>{EQUIPMENT_TYPES.find(t => t.value === e.type)?.label || e.type}</span>
                          <span className={e.is_available ? 'text-emerald-600' : 'text-red-600'}>
                            {e.is_available ? 'Свободен' : `Занят${e.busy_until ? ' до ' + e.busy_until.slice(0, 10) : ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEquipModal(e)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteEquipment(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RULES */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setRuleModal({})} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Добавить правило
            </button>
            <button onClick={loadDefaultRules} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4" /> Загрузить стандартные
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Правила не созданы.</p>
              <p className="text-xs mt-1">Нажмите «Загрузить стандартные» для быстрого старта.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className={`bg-white rounded-xl border p-4 transition-opacity ${rule.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{rule.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                        </span>
                        {!rule.is_active && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">Выключено</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(rule.actions || []).map((a, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-lg flex items-center gap-1">
                            {a.type === 'add_days' && <><Clock className="w-3 h-3" /> +{a.days} дн.</>}
                            {a.type === 'create_task' && <><CheckCircle className="w-3 h-3" /> Задача: {a.title}</>}
                            {a.type === 'notify' && <><AlertTriangle className="w-3 h-3" /> Уведомление</>}
                            {a.type === 'check_stock' && <><Package className="w-3 h-3" /> Проверить склад</>}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleRule(rule)}
                        className={`p-1.5 rounded-lg transition-colors ${rule.is_active ? 'text-brand-600 hover:bg-brand-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title={rule.is_active ? 'Выключить' : 'Включить'}
                      >
                        {rule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => setRuleModal(rule)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEST */}
      {tab === 'test' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-600" /> Параметры для теста
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Фурнитура</label>
                <select value={testHardware} onChange={e => setTestHardware(e.target.value)} className="input-sm w-full">
                  <option value="">Без фурнитуры</option>
                  <option value="Hettich">Hettich</option>
                  <option value="Blum">Blum (доставка +3 дня)</option>
                  <option value="Hafele">Häfele</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Материалы</label>
                <div className="space-y-1.5">
                  {[
                    { name: 'ЛДСП Egger', category: 'плиты', supplier: 'Egger' },
                    { name: 'Петли Blum', category: 'фурнитура', supplier: 'Blum' },
                    { name: 'Кромка нестандартная', category: 'кромка', supplier: '' },
                  ].map(m => {
                    const active = testMaterials.some(t => t.name === m.name);
                    return (
                      <button
                        key={m.name}
                        onClick={() => setTestMaterials(prev => active ? prev.filter(t => t.name !== m.name) : [...prev, m])}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-200'}`}
                      >
                        {active ? '✓ ' : ''}{m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Операции</label>
                <div className="space-y-1.5">
                  {[
                    { name: 'Сложная фрезеровка ЧПУ', type: 'cnc_complex' },
                    { name: 'Нестандартная кромка', type: 'edge_nonstandard' },
                  ].map(op => {
                    const active = testOperations.some(t => t.type === op.type);
                    return (
                      <button
                        key={op.type}
                        onClick={() => setTestOperations(prev => active ? prev.filter(t => t.type !== op.type) : [...prev, op])}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-200'}`}
                      >
                        {active ? '✓ ' : ''}{op.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <SmartDeadline
              materials={testMaterials}
              operations={testOperations}
              hardware={testHardware}
              className="sticky top-4"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {supplierModal !== null && (
        <Modal title={supplierModal?.id ? 'Редактировать поставщика' : 'Добавить поставщика'} onClose={() => setSupplierModal(null)}>
          <SupplierForm initial={supplierModal?.id ? supplierModal : null} onSave={saveSupplier} onClose={() => setSupplierModal(null)} />
        </Modal>
      )}
      {equipModal !== null && (
        <Modal title={equipModal?.id ? 'Редактировать оборудование' : 'Добавить оборудование'} onClose={() => setEquipModal(null)}>
          <EquipmentForm initial={equipModal?.id ? equipModal : null} onSave={saveEquipment} onClose={() => setEquipModal(null)} />
        </Modal>
      )}
      {ruleModal !== null && (
        <Modal title={ruleModal?.id ? 'Редактировать правило' : 'Новое правило'} onClose={() => setRuleModal(null)}>
          <RuleEditor initial={ruleModal?.id ? ruleModal : null} onSave={saveRule} onClose={() => setRuleModal(null)} />
        </Modal>
      )}
    </div>
  );
}
