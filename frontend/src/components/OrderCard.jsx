import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Calendar, ExternalLink, Copy } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import ProgressBar from './ProgressBar.jsx';
import { formatCurrency, formatDateShort } from '../utils/constants.js';

export default function OrderCard({ order, onCopyToken }) {
  const portalUrl = `${window.location.origin}/portal/${order.portal_token}`;
  const debt = (order.total_price || 0) - (order.paid_amount || 0);

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-slate-400">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <h3 className="font-semibold text-slate-900 mt-1 text-sm leading-snug">
            {order.client_name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{order.product_type}</p>
        </div>
        <Link
          to={`/orders/${order.id}`}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress */}
      <ProgressBar progress={order.progress} stage={order.stage} compact />

      {/* Stage */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Этап:</span>
        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{order.stage}</span>
      </div>

      {/* Finance */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-xs text-slate-400">Сумма</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_price)}</p>
        </div>
        <div className={`rounded-xl px-3 py-2 ${debt > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className="text-xs text-slate-400">{debt > 0 ? 'Долг' : 'Оплачено'}</p>
          <p className={`text-sm font-semibold ${debt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {debt > 0 ? formatCurrency(debt) : formatCurrency(order.paid_amount)}
          </p>
        </div>
      </div>

      {/* Contacts & date */}
      <div className="flex flex-col gap-1 text-xs text-slate-500">
        {order.client_phone && (
          <a href={`tel:${order.client_phone}`} className="flex items-center gap-1.5 hover:text-brand-600">
            <Phone className="w-3 h-3" /> {order.client_phone}
          </a>
        )}
        {order.delivery_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Срок: {formatDateShort(order.delivery_date)}
          </div>
        )}
      </div>

      {/* Portal link */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400 flex-1 truncate">🔗 Портал клиента</span>
        <button
          onClick={() => onCopyToken?.(portalUrl)}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <Copy className="w-3 h-3" /> Скопировать
        </button>
      </div>
    </div>
  );
}
