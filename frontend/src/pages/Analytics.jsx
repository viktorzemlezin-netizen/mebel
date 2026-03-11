import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { STATUSES, STAGES, formatCurrency } from '../utils/constants.js';
import { TrendingUp, Banknote, CreditCard, AlertCircle, Package } from 'lucide-react';

export default function Analytics() {
  const { orders, stats } = useApp();

  // Compute from orders directly
  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (o.paid_amount || 0), 0);
  const totalDebt = totalRevenue - totalPaid;

  const byStatus = Object.entries(STATUSES).map(([key, val]) => {
    const group = orders.filter(o => o.status === key);
    return {
      key, label: val.label, dot: val.dot,
      count: group.length,
      revenue: group.reduce((s, o) => s + (o.total_price || 0), 0),
    };
  });

  const byStage = STAGES.map(stage => ({
    stage,
    count: orders.filter(o => o.stage === stage && o.status === 'in_progress').length,
  }));

  const maxStageCount = Math.max(...byStage.map(s => s.count), 1);

  const byType = Object.entries(
    orders.reduce((acc, o) => {
      acc[o.product_type] = (acc[o.product_type] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxTypeCount = Math.max(...byType.map(([, c]) => c), 1);

  const topByRevenue = [...orders]
    .sort((a, b) => (b.total_price || 0) - (a.total_price || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Аналитика</h1>
        <p className="text-sm text-slate-500">Финансовая сводка и статистика</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Общая выручка', value: formatCurrency(totalRevenue), icon: Banknote, color: 'text-brand-600 bg-brand-50', sub: `${orders.length} заказов` },
          { label: 'Оплачено', value: formatCurrency(totalPaid), icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', sub: `${Math.round((totalPaid / (totalRevenue || 1)) * 100)}% от выручки` },
          { label: 'Дебиторский долг', value: formatCurrency(totalDebt), icon: AlertCircle, color: 'text-amber-600 bg-amber-50', sub: `${Math.round((totalDebt / (totalRevenue || 1)) * 100)}% не оплачено` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
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
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${(s.count / (orders.length || 1)) * 100}%` }}
                  />
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
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By product type */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Типы мебели</h2>
          <div className="space-y-3">
            {byType.map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 truncate flex-1">{type}</span>
                  <span className="font-medium text-slate-900 text-sm ml-3">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top by revenue */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Топ заказов по сумме</h2>
          <div className="space-y-3">
            {topByRevenue.map((order, i) => {
              const debt = (order.total_price || 0) - (order.paid_amount || 0);
              return (
                <div key={order.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{order.client_name}</p>
                    <p className="text-xs text-slate-400 truncate">{order.product_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_price)}</p>
                    {debt > 0 && <p className="text-xs text-amber-600">долг {formatCurrency(debt)}</p>}
                    {debt <= 0 && <p className="text-xs text-emerald-600">оплачен</p>}
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
