import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { STATUSES, STAGES, formatCurrency } from '../utils/constants.js';
import { TrendingUp, Banknote, CreditCard, AlertCircle, Package, Users, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../utils/api.js';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

function monthLabel(key) {
  if (!key) return key;
  const [, m] = key.split('-');
  return MONTH_NAMES[parseInt(m, 10) - 1] || key;
}

export default function Analytics() {
  const { orders } = useApp();
  const [biData, setBiData] = useState(null);
  const [biLoading, setBiLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setBiData)
      .catch(() => setBiData(null))
      .finally(() => setBiLoading(false));
  }, []);

  // Local fallback stats
  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const totalPaid    = orders.reduce((s, o) => s + (o.paid_amount   || 0), 0);
  const totalDebt    = totalRevenue - totalPaid;

  const byStatus = Object.entries(STATUSES).map(([key, val]) => {
    const group = orders.filter(o => o.status === key);
    return { key, label: val.label, dot: val.dot, count: group.length, revenue: group.reduce((s, o) => s + (o.total_price || 0), 0) };
  });

  const byStage = STAGES.map(stage => ({
    stage, count: orders.filter(o => o.stage === stage && o.status === 'in_progress').length,
  }));
  const maxStageCount = Math.max(...byStage.map(s => s.count), 1);

  const topByRevenue = [...orders].sort((a, b) => (b.total_price || 0) - (a.total_price || 0)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Аналитика</h1>
        <p className="text-sm text-slate-500">Финансовая сводка и бизнес-аналитика</p>
      </div>

      {/* ─── BI KPIs (from API) ─── */}
      {biLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Загружаем аналитику...
        </div>
      ) : biData ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Всего клиентов',   value: biData.kpi.total_clients,            icon: Users,     color: 'text-indigo-600 bg-indigo-50'  },
              { label: 'Активных за год',  value: biData.kpi.active_clients,           icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Средний чек',      value: formatCurrency(biData.kpi.average_check), icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
              { label: 'Общая выручка',    value: formatCurrency(biData.kpi.total_revenue), icon: Banknote,   color: 'text-amber-600 bg-amber-50'  },
            ].map(item => (
              <div key={item.label} className="card p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} mb-3`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-slate-900 truncate">{item.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Orders by month */}
            {biData.orders_by_month?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Заказы по месяцам (12 мес)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={biData.orders_by_month.map(d => ({ ...d, label: monthLabel(d.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Заказов" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Popular furniture */}
            {biData.popular_furniture?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Типы мебели</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={biData.popular_furniture} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80}
                      label={({ type, percentage }) => percentage > 5 ? `${type.split(' ')[0]} ${percentage}%` : ''}
                    >
                      {biData.popular_furniture.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Revenue by year */}
            {biData.orders_by_year?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Выручка по годам</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={biData.orders_by_year}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(1) + 'М'} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Выручка']} />
                    <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top clients */}
            {biData.top_clients?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4">Топ-10 клиентов</h2>
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                  {biData.top_clients.map((c, i) => (
                    <div key={c.id || i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-400 w-5 flex-shrink-0">{i + 1}.</span>
                        <span className="text-slate-700 truncate">{c.name}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{c.total_orders} зак.</span>
                      </div>
                      <span className="font-semibold text-slate-800 ml-2 flex-shrink-0">{formatCurrency(c.total_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* ─── Divider ─── */}
      <div className="border-t border-slate-100" />
      <h2 className="font-semibold text-slate-700 -mt-2">Текущие заказы</h2>

      {/* Local stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Общая выручка',    value: formatCurrency(totalRevenue), icon: Banknote,     color: 'text-brand-600 bg-brand-50',   sub: `${orders.length} заказов` },
          { label: 'Оплачено',         value: formatCurrency(totalPaid),    icon: CreditCard,   color: 'text-emerald-600 bg-emerald-50', sub: `${Math.round((totalPaid / (totalRevenue || 1)) * 100)}% от выручки` },
          { label: 'Дебиторский долг', value: formatCurrency(totalDebt),    icon: AlertCircle,  color: 'text-amber-600 bg-amber-50',   sub: `${Math.round((totalDebt / (totalRevenue || 1)) * 100)}% не оплачено` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By status */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" /> По статусам
          </h2>
          <div className="space-y-3">
            {byStatus.filter(s => s.count > 0).map(s => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-sm text-slate-700">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">{formatCurrency(s.revenue)}</span>
                    <span className="font-medium text-slate-900 w-4 text-right">{s.count}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${(s.count / (orders.length || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By stage */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" /> Этапы (в работе)
          </h2>
          <div className="space-y-3">
            {byStage.map(({ stage, count }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{stage}</span>
                  <span className="font-medium text-slate-900 text-sm">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(count / maxStageCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top by revenue */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Топ заказов по сумме</h2>
          <div className="space-y-3">
            {topByRevenue.map((order, i) => {
              const debt = (order.total_price || 0) - (order.paid_amount || 0);
              return (
                <div key={order.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{order.client_name}</p>
                    <p className="text-xs text-slate-400 truncate">{order.product_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_price)}</p>
                    {debt > 0 ? <p className="text-xs text-amber-600">долг {formatCurrency(debt)}</p> : <p className="text-xs text-emerald-600">оплачен</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
