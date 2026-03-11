import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Clock, Plus, ArrowRight, Banknote, CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import OrderRow from '../components/OrderRow.jsx';
import OrderCard from '../components/OrderCard.jsx';
import NewOrderModal from '../components/NewOrderModal.jsx';
import { STATUSES, formatCurrency } from '../utils/constants.js';

export default function Dashboard() {
  const { orders, stats, filterStatus, setFilterStatus, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');

  const handleCopyToken = (url) => {
    navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована'));
  };

  const statCards = [
    {
      label: 'Всего заказов',
      value: stats?.total_orders ?? orders.length,
      icon: Package,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      label: 'Выручка',
      value: formatCurrency(stats?.total_revenue),
      icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Оплачено',
      value: formatCurrency(stats?.total_paid),
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'В работе',
      value: stats?.by_status?.find(s => s.status === 'in_progress')?.count ?? '—',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  const filters = [
    { key: 'all', label: 'Все' },
    ...Object.entries(STATUSES).map(([key, val]) => ({ key, label: val.label })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Дашборд</h1>
          <p className="text-sm text-slate-500">Управление заказами мебели</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Новый заказ
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-4 py-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg w-fit">
          {[['list', '☰ Список'], ['grid', '⊞ Карточки']].map(([v, lbl]) => (
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

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-slate-200 mb-3" />
          <p className="font-medium text-slate-500">Нет заказов по выбранному фильтру</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
            Создать заказ
          </button>
        </div>
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
          {orders.map(order => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onCopyToken={handleCopyToken} />
          ))}
        </div>
      )}

      {orders.length > 0 && (
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
