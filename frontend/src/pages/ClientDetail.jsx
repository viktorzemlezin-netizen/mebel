import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, ShoppingBag, TrendingUp, Calendar, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatCurrency, formatDate, STATUSES } from '../utils/constants.js';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClient(id)
      .then(setClient)
      .catch(() => navigate('/clients'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const orders = client.orders || [];
  const totalSpent = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const avgCheck = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;

  // AI insight
  const topType = (() => {
    const map = {};
    for (const o of orders) { const t = o.product_type || 'Другое'; map[t] = (map[t] || 0) + 1; }
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0];
  })();

  const aiInsight = orders.length > 0
    ? `${orders.length >= 3 ? 'Постоянный клиент' : 'Клиент'}${topType ? `, предпочитает ${topType.toLowerCase()}` : ''}, средний чек ${formatCurrency(avgCheck)}. Последний заказ ${formatDate(client.last_order_date)}.`
    : 'Новый клиент, заказов пока нет.';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Назад к клиентам
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <ClientAvatar name={client.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{client.name || 'Без имени'}</h1>
            {client.source && client.source !== 'manual' && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{client.source}</span>
            )}
            <div className="mt-3 space-y-1.5">
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${client.phone}`} className="hover:text-indigo-600">{client.phone}</a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-indigo-600">{client.email}</a>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{client.address}</span>
                </div>
              )}
              {client.notes && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span>{client.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: ShoppingBag, label: 'Заказов',       value: orders.length,            color: 'text-indigo-600 bg-indigo-50' },
          { icon: TrendingUp,  label: 'Всего потрачено', value: formatCurrency(totalSpent), color: 'text-emerald-600 bg-emerald-50' },
          { icon: TrendingUp,  label: 'Средний чек',   value: formatCurrency(avgCheck),  color: 'text-blue-600 bg-blue-50' },
          { icon: Calendar,    label: 'Последний заказ', value: formatDate(client.last_order_date), color: 'text-amber-600 bg-amber-50' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-2`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-slate-800 truncate">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800 mb-1">ИИ-анализ клиента</p>
            <p className="text-sm text-indigo-700">{aiInsight}</p>
          </div>
        </div>
      </div>

      {/* Orders history */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">История заказов</h2>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Заказов пока нет</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map(order => {
              const status = STATUSES[order.status] || STATUSES.new;
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-slate-500">{order.product_type || '—'} · {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="font-semibold text-slate-800">{formatCurrency(order.total_price)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientAvatar({ name, size = 'md' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500'];
  const colorIdx = (name || '').charCodeAt(0) % colors.length;
  const sz = size === 'lg' ? 'w-16 h-16 text-xl rounded-2xl' : 'w-10 h-10 text-sm rounded-xl';
  return (
    <div className={`flex items-center justify-center text-white font-bold flex-shrink-0 ${sz} ${colors[colorIdx]}`}>
      {initials}
    </div>
  );
}
