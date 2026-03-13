import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, ChevronRight, RefreshCw, MessageSquare, Wrench, Package, Ruler, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const ROLE_TASK_FILTERS = {
  'Менеджер':    ['Согласование', 'Общение с клиентом', 'Менеджер'],
  'Дизайнер':    ['Проектирование', 'Дизайн', 'Дизайнер'],
  'Замерщик':    ['Замер', 'Замерщик'],
  'Технолог':    ['Технолог', 'Производство', 'Покраска'],
  'Сборщик':     ['Сборка', 'Производство', 'Сборщик'],
  'Монтажник':   ['Монтаж', 'Монтажник'],
  'Снабженец':   ['Снабженец', 'Закупки'],
  'Бухгалтер':   ['Бухгалтер', 'Оплата'],
};

const STATUS_CONFIG = {
  pending:     { label: 'Ожидает',    bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200' },
  in_progress: { label: 'В работе',   bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  completed:   { label: 'Выполнено',  bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  overdue:     { label: 'Просрочено', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200' },
  blocked:     { label: 'Заблокировано', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

const PROBLEM_TYPES = [
  { value: 'materials_missing', label: 'Нет материалов' },
  { value: 'equipment_broken', label: 'Оборудование сломано' },
  { value: 'design_unclear',   label: 'Неясно техзадание' },
  { value: 'client_unavailable', label: 'Клиент недоступен' },
  { value: 'other',            label: 'Другое' },
];

function ProblemModal({ task, onClose, onSubmit }) {
  const [type, setType] = useState('other');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!desc.trim()) return;
    setSaving(true);
    try {
      await onSubmit(task.id, { problem_type: type, problem_description: desc });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Сообщить о проблеме</h3>
          <p className="text-sm text-slate-500 mt-0.5">Задача: {task.name}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Тип проблемы</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {PROBLEM_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Описание</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="Опишите проблему подробнее..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Отмена</button>
          <button
            onClick={handleSubmit}
            disabled={!desc.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onMarkDone, onReportProblem }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const isOverdue = task.status === 'overdue' || (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed');

  return (
    <div className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg} relative`}>
      {isOverdue && task.status !== 'completed' && (
        <div className="absolute top-3 right-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{task.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.text} bg-white/60`}>{cfg.label}</span>
          </div>
          {task.order_number && (
            <Link to={`/orders/${task.order_id}`} className="text-xs text-brand-600 hover:underline mt-0.5 inline-block">
              Заказ #{task.order_number} — {task.client_name}
            </Link>
          )}
          {task.sla_days && (
            <p className="text-xs text-slate-500 mt-1">SLA: {task.sla_days} дн.</p>
          )}
          {task.due_date && (
            <p className={`text-xs mt-1 ${isOverdue && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
              {isOverdue && task.status !== 'completed' ? '⚠ ' : '📅 '}
              Срок: {new Date(task.due_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
          )}
          {task.problem_description && (
            <p className="text-xs text-orange-600 mt-1 bg-orange-50 rounded px-2 py-1">
              Проблема: {task.problem_description}
            </p>
          )}
        </div>
      </div>
      {task.status !== 'completed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/50">
          {task.status === 'pending' && (
            <button
              onClick={() => onMarkDone(task.id, 'in_progress')}
              className="flex-1 text-xs font-medium bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700 transition-colors"
            >
              Начать
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              onClick={() => onMarkDone(task.id, 'completed')}
              className="flex-1 text-xs font-medium bg-emerald-600 text-white rounded-lg py-1.5 hover:bg-emerald-700 transition-colors"
            >
              Завершить ✓
            </button>
          )}
          {task.status !== 'blocked' && (
            <button
              onClick={() => onReportProblem(task)}
              className="px-3 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg py-1.5 hover:bg-slate-50 transition-colors"
            >
              Проблема
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuickActions({ role }) {
  const actions = {
    'Замерщик':  [
      { label: 'Мои замеры', to: '/measurer', icon: Ruler },
      { label: 'Все заказы', to: '/orders', icon: Package },
    ],
    'Менеджер': [
      { label: 'Лиды', to: '/leads', icon: MessageSquare },
      { label: 'Клиенты', to: '/clients', icon: Package },
      { label: 'Конструктор', to: '/constructor', icon: Wrench },
    ],
    'Снабженец': [
      { label: 'Закупки', to: '/procurement', icon: Package },
    ],
    'Монтажник': [
      { label: 'Заказы', to: '/orders', icon: Package },
    ],
    'Технолог': [
      { label: 'Заказы', to: '/orders', icon: Package },
    ],
    'Сборщик': [
      { label: 'Заказы', to: '/orders', icon: Package },
    ],
    'Бухгалтер': [
      { label: 'Финансы', to: '/finance', icon: Package },
    ],
    'Дизайнер': [
      { label: 'Конструктор', to: '/constructor', icon: Wrench },
      { label: 'Заказы', to: '/orders', icon: Package },
    ],
  };
  const roleActions = actions[role] || [];
  if (!roleActions.length) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {roleActions.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}

export default function MyTasks() {
  const { currentRole, showToast } = useApp();
  const role = currentRole?.role;
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [problemTask, setProblemTask] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, overdueRes] = await Promise.all([
        api.getOrders({ limit: 100 }),
        api.getOverdueTasks().catch(() => ({ tasks: [] })),
      ]);
      const orders = ordersRes.orders || [];
      const keywords = ROLE_TASK_FILTERS[role] || [];

      // Fetch tasks for all active orders
      const tasksByOrder = await Promise.all(
        orders.slice(0, 20).map(o =>
          api.getOrderTasks(o.id)
            .then(r => (r.tasks || []).map(t => ({ ...t, order_number: o.order_number, client_name: o.client_name, order_id: o.id })))
            .catch(() => [])
        )
      );
      const allTasks = tasksByOrder.flat();

      // Filter by role keywords
      const myTasks = keywords.length
        ? allTasks.filter(t => keywords.some(kw => (t.role || '').toLowerCase().includes(kw.toLowerCase()) || (t.name || '').toLowerCase().includes(kw.toLowerCase())))
        : allTasks;

      setTasks(myTasks);
      setOverdueTasks(overdueRes.tasks || []);
    } catch (e) {
      showToast('Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkDone = async (taskId, newStatus) => {
    try {
      await api.updateOrderTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      showToast(newStatus === 'completed' ? 'Задача завершена!' : 'Задача начата');
    } catch {
      showToast('Ошибка обновления задачи');
    }
  };

  const handleReportProblem = async (taskId, body) => {
    await api.reportTaskProblem(taskId, body);
    showToast('Проблема отправлена руководителю');
    load();
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const doneTasks = tasks.filter(t => t.status === 'completed');
  const myOverdue = tasks.filter(t => t.status === 'overdue' || (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'));

  const displayTasks = tab === 'active' ? activeTasks : tab === 'done' ? doneTasks : myOverdue;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Мои задачи</h1>
          <p className="text-sm text-slate-500">{role} · FurnFlow</p>
        </div>
        <button onClick={load} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Обновить">
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{activeTasks.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Активных</div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${myOverdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className={`text-2xl font-bold ${myOverdue.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>{myOverdue.length}</div>
          <div className={`text-xs mt-0.5 ${myOverdue.length > 0 ? 'text-red-600' : 'text-slate-500'}`}>Просрочено</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{doneTasks.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5">Выполнено</div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Быстрый переход</p>
        <QuickActions role={role} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl w-fit">
        {[
          { key: 'active', label: `Активные (${activeTasks.length})` },
          { key: 'overdue', label: `Просроченные (${myOverdue.length})` },
          { key: 'done', label: `Выполнено (${doneTasks.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Загрузка задач...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="font-medium text-slate-600">
            {tab === 'done' ? 'Нет выполненных задач' : tab === 'overdue' ? 'Нет просроченных задач' : 'Нет активных задач'}
          </p>
          {tab === 'active' && <p className="text-sm text-slate-400 mt-1">Все задачи выполнены!</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {displayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onMarkDone={handleMarkDone}
              onReportProblem={setProblemTask}
            />
          ))}
        </div>
      )}

      {/* Overdue from other roles (escalated to this user) */}
      {overdueTasks.length > 0 && tab === 'overdue' && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Эскалированные проблемы</p>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{task.name}</p>
                  <p className="text-xs text-slate-500">{task.order_number} · {task.role}</p>
                </div>
                <Link to={`/orders/${task.order_id}`} className="text-xs text-brand-600 hover:underline">
                  Открыть <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {problemTask && (
        <ProblemModal
          task={problemTask}
          onClose={() => setProblemTask(null)}
          onSubmit={handleReportProblem}
        />
      )}
    </div>
  );
}
