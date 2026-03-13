import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Plus, ArrowRight, Banknote, AlertTriangle, TrendingUp, RefreshCw, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import OrderRow from '../components/OrderRow.jsx';
import OrderCard from '../components/OrderCard.jsx';
import NewOrderModal from '../components/NewOrderModal.jsx';
import { STATUSES, STAGE_ICONS, STAGE_COLORS, formatCurrency } from '../utils/constants.js';

const STAGE_FILTERS = ['all', 'Новый', 'Замер', 'Проектирование', 'Согласование', 'Производство', 'Готово', 'Монтаж', 'Завершён'];
import { api } from '../utils/api.js';

// ─── Kanban ───────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { key: 'Новый',         label: 'Новый',          color: 'bg-slate-100',   textColor: 'text-slate-700' },
  { key: 'Замер',         label: 'Замер',          color: 'bg-amber-100',   textColor: 'text-amber-800' },
  { key: 'Проектирование',label: 'Проект',         color: 'bg-blue-100',    textColor: 'text-blue-800'  },
  { key: 'Производство',  label: 'Производство',   color: 'bg-orange-100',  textColor: 'text-orange-800'},
  { key: 'Готово',        label: 'Готово',         color: 'bg-emerald-100', textColor: 'text-emerald-800'},
  { key: 'Монтаж',        label: 'Монтаж',         color: 'bg-cyan-100',    textColor: 'text-cyan-800'  },
  { key: 'Завершён',      label: 'Завершён',       color: 'bg-purple-100',  textColor: 'text-purple-800'},
];

function KanbanCard({ order }) {
  const debt = (order.total_price || 0) - (order.paid_amount || 0);
  return (
    <Link to={`/orders/${order.id}`} className="block bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:shadow-md hover:border-brand-200 transition-all">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="text-xs font-mono text-slate-400">{order.order_number}</span>
        {debt <= 0 && order.total_price > 0 && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Оплачен</span>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-900 leading-tight mb-0.5 line-clamp-1">{order.client_name}</p>
      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{order.product_type}</p>
      {order.total_price > 0 && (
        <p className="text-xs font-medium text-slate-700">{formatCurrency(order.total_price)}</p>
      )}
      {order.delivery_date && (
        <p className="text-xs text-amber-600 mt-1">
          📅 {new Date(order.delivery_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
        </p>
      )}
      {order.assigned_measurer && <p className="text-xs text-slate-400 mt-1 truncate">👤 {order.assigned_measurer}</p>}
    </Link>
  );
}

function KanbanView({ orders }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLUMNS.map(col => {
          const colOrders = orders.filter(o => {
            if (col.key === 'Замер') return o.stage === 'Замер' || o.stage === 'Замер завершён';
            if (col.key === 'Проектирование') return o.stage === 'Проектирование' || o.stage === 'Согласование';
            return o.stage === col.key;
          });
          return (
            <div key={col.key} className="w-52 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${col.color}`}>
                <span className="text-base">{STAGE_ICONS[col.key] || '○'}</span>
                <span className={`text-xs font-semibold ${col.textColor}`}>{col.label}</span>
                <span className={`ml-auto text-xs font-medium ${col.textColor} opacity-70`}>{colOrders.length}</span>
              </div>
              <div className="space-y-2">
                {colOrders.map(o => <KanbanCard key={o.id} order={o} />)}
                {colOrders.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Нет заказов
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Problematic Orders Widget ────────────────────────────────────────────────

function ProblematicOrdersWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverdueTasks()
      .then(r => setData(r))
      .catch(() => setData({ tasks: [], stats: {} }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  const tasks = data?.tasks || [];
  if (tasks.length === 0) return null;

  // Group by order
  const byOrder = {};
  tasks.forEach(t => {
    const key = t.order_id || t.order_number;
    if (!byOrder[key]) byOrder[key] = { ...t, taskCount: 0 };
    byOrder[key].taskCount++;
  });
  const orders = Object.values(byOrder).slice(0, 5);

  return (
    <div className="card border-l-4 border-l-red-500 p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <span className="font-semibold text-red-800 text-sm">Проблемные заказы</span>
        <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.client_name || 'Неизвестный клиент'}</p>
              <p className="text-xs text-slate-500">
                {item.order_number} · {item.taskCount} {item.taskCount === 1 ? 'задача' : 'задачи'} просрочено
              </p>
            </div>
            <Link to={`/orders/${item.order_id}`} className="text-xs text-brand-600 hover:underline flex-shrink-0">
              Открыть →
            </Link>
          </div>
        ))}
      </div>
      {tasks.length > 5 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-500">и ещё {tasks.length - 5} просроченных задач</span>
        </div>
      )}
    </div>
  );
}

// ─── Team Today Widget ─────────────────────────────────────────────────────────

function TeamTodayWidget() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.getUsers().then(r => setUsers(r.users || r || [])).catch(() => {});
  }, []);
  if (!users.length) return null;

  const roles = users.map(u => u.role).filter(Boolean);
  const roleCounts = roles.reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {});

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-slate-500" />
        <span className="font-semibold text-slate-800 text-sm">Команда сегодня</span>
        <span className="ml-auto text-xs text-slate-400">{users.length} чел.</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(roleCounts).map(([role, count]) => (
          <span key={role} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
            {role} {count > 1 ? `×${count}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Leads Widget ─────────────────────────────────────────────────────────────

function LeadsWidget() {
  const [stats, setStats] = useState({ total: 0, today: 0, overdue: 0 });
  useEffect(() => {
    fetch('https://furnflow-worker.zemlezin-viktor.workers.dev/api/leads')
      .then(r => r.json())
      .then(leads => {
        if (!Array.isArray(leads)) return;
        const today = leads.filter(l => {
          if (!l.created_at) return false;
          return new Date(l.created_at).toDateString() === new Date().toDateString();
        }).length;
        const overdue = leads.filter(l => l.next_action_date && new Date(l.next_action_date) < new Date() && l.stage !== 'closed' && l.stage !== 'converted').length;
        setStats({ total: leads.length, today, overdue });
      }).catch(() => {});
  }, []);
  if (stats.total === 0 && stats.today === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Link to="/leads" className="bg-white rounded-xl border border-slate-200 p-3 hover:border-indigo-300 transition-colors">
        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        <div className="text-xs text-slate-500 mt-0.5">Всего лидов</div>
      </Link>
      <Link to="/leads" className={`rounded-xl border p-3 transition-colors ${stats.today > 0 ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
        <div className={`text-2xl font-bold ${stats.today > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>{stats.today}</div>
        <div className={`text-xs mt-0.5 ${stats.today > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>Новых сегодня</div>
      </Link>
      <Link to="/leads" className={`rounded-xl border p-3 transition-colors ${stats.overdue > 0 ? 'bg-red-50 border-red-200 hover:border-red-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
        <div className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-700' : 'text-slate-900'}`}>{stats.overdue}</div>
        <div className={`text-xs mt-0.5 ${stats.overdue > 0 ? 'text-red-600' : 'text-slate-500'}`}>Просрочено</div>
      </Link>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { orders, allOrders, stats, filterStatus, setFilterStatus, filterStage, setFilterStage, showToast, currentRole } = useApp();
  const isDirector = currentRole?.role === 'Руководитель';
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');

  const handleCopyToken = (url) => {
    navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована'));
  };

  // Live stats from orders
  const inProgress = allOrders.filter(o => o.status === 'in_progress').length;
  const readyToInstall = allOrders.filter(o => o.stage === 'Готово').length;

  const totalSum    = allOrders.reduce((s, o) => s + (o.total_price  || 0), 0);
  const paidSum     = allOrders.reduce((s, o) => s + (o.paid_amount  || 0), 0);
  const remainSum   = totalSum - paidSum;

  const statCards = [
    { label: 'Всего заказов',    value: stats?.total_orders ?? allOrders.length, icon: Package,  color: 'text-brand-600 bg-brand-50'  },
    { label: 'В работе',         value: stats?.by_status?.find(s => s.status === 'in_progress')?.count ?? inProgress, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Готовы к монтажу', value: stats?.by_stage?.find(s => s.stage === 'Готово')?.count ?? readyToInstall, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const financeCards = [
    { label: 'Общая сумма заказов',   value: formatCurrency(totalSum),  icon: Banknote,   color: 'text-purple-600 bg-purple-50'  },
    { label: 'Предоплата получена',   value: formatCurrency(paidSum),   icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Остаток к получению',   value: formatCurrency(remainSum), icon: Banknote,   color: 'text-amber-600 bg-amber-50'   },
  ];

  const filters = [
    { key: 'all', label: 'Все' },
    ...Object.entries(STATUSES).map(([key, val]) => ({ key, label: val.label })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Дашборд</h1>
          <p className="text-sm text-slate-500">Управление заказами мебели</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Новый заказ
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-4 py-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Finance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {financeCards.map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} className={`card px-4 py-4 flex items-center gap-3 ${i === 2 && remainSum > 0 ? 'border-amber-200' : ''}`}>
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-base font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leads mini widget */}
      <LeadsWidget />

      {/* Director-only: Problematic orders + Team */}
      {isDirector && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProblematicOrdersWidget />
          <TeamTodayWidget />
        </div>
      )}

      {/* Filters & view toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stage filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-slate-400 mr-1">Этап:</span>
          {STAGE_FILTERS.map(s => {
            const cnt = s === 'all' ? null : allOrders.filter(o => o.stage === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStage(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStage === s
                    ? 'bg-slate-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'Все этапы' : s}
                {cnt != null && cnt > 0 && <span className="ml-1 opacity-70">{cnt}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg w-fit">
            {[['list', '☰ Список'], ['grid', '⊞ Карточки'], ['kanban', '⬛ Канбан']].map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-slate-200 mb-3" />
          <p className="font-medium text-slate-500">Нет заказов по выбранному фильтру</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">Создать заказ</button>
        </div>
      ) : view === 'kanban' ? (
        <KanbanView orders={orders} />
      ) : view === 'list' ? (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-500 w-20">Номер</span>
            <span className="text-xs font-medium text-slate-500 flex-1">Клиент / Тип</span>
            <span className="text-xs font-medium text-slate-500 w-28 hidden sm:block">Статус</span>
            <span className="text-xs font-medium text-slate-500 w-32 hidden md:block">Прогресс</span>
            <span className="text-xs font-medium text-slate-500 w-28 hidden lg:block">Этап</span>
            <span className="text-xs font-medium text-slate-500 w-32 hidden lg:block text-right">Финансы</span>
            <span className="text-xs font-medium text-slate-500 w-20 hidden xl:block text-right">Срок</span>
            <span className="w-4" />
          </div>
          {orders.map(order => <OrderRow key={order.id} order={order} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(order => <OrderCard key={order.id} order={order} onCopyToken={handleCopyToken} />)}
        </div>
      )}

      {orders.length > 0 && view !== 'kanban' && (
        <div className="text-center">
          <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
            Все заказы <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {showModal && <NewOrderModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
