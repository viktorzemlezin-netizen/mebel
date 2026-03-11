import React, { useState } from 'react';
import { Package, Plus, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import OrderRow from '../components/OrderRow.jsx';
import OrderCard from '../components/OrderCard.jsx';
import NewOrderModal from '../components/NewOrderModal.jsx';
import { STATUSES } from '../utils/constants.js';

export default function Orders() {
  const { orders, loading, filterStatus, setFilterStatus, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState('list');

  const handleCopyToken = (url) => {
    navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована'));
  };

  const filters = [
    { key: 'all', label: 'Все', count: null },
    ...Object.entries(STATUSES).map(([key, val]) => ({
      key, label: val.label,
      count: orders.filter(o => o.status === key).length,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Заказы</h1>
          <p className="text-sm text-slate-500">{orders.length} заказ{orders.length === 1 ? '' : orders.length < 5 ? 'а' : 'ов'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Новый заказ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterStatus === f.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
              {f.count != null && f.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  filterStatus === f.key ? 'bg-white/20' : 'bg-slate-100'
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg w-fit">
          {[['list', '☰'], ['grid', '⊞']].map(([v, lbl]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
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
          {orders.map(order => <OrderRow key={order.id} order={order} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onCopyToken={handleCopyToken} />
          ))}
        </div>
      )}

      {showModal && <NewOrderModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
