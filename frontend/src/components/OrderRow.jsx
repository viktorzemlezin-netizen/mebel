import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import ProgressBar from './ProgressBar.jsx';
import { formatCurrency, formatDateShort } from '../utils/constants.js';

export default function OrderRow({ order }) {
  const debt = (order.total_price || 0) - (order.paid_amount || 0);

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 group"
    >
      {/* Number */}
      <span className="text-xs font-mono text-slate-400 w-20 flex-shrink-0">{order.order_number}</span>

      {/* Client */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{order.client_name}</p>
        <p className="text-xs text-slate-400 truncate">{order.product_type}</p>
      </div>

      {/* Status */}
      <div className="w-28 flex-shrink-0 hidden sm:block">
        <StatusBadge status={order.status} />
      </div>

      {/* Progress */}
      <div className="w-32 flex-shrink-0 hidden md:block">
        <ProgressBar progress={order.progress} stage={order.stage} compact />
      </div>

      {/* Stage */}
      <div className="w-28 flex-shrink-0 hidden lg:block">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{order.stage}</span>
      </div>

      {/* Finance */}
      <div className="w-32 flex-shrink-0 hidden lg:flex flex-col items-end">
        <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_price)}</span>
        {debt > 0 && (
          <span className="text-xs text-amber-600">долг {formatCurrency(debt)}</span>
        )}
        {debt <= 0 && (
          <span className="text-xs text-emerald-600">оплачен</span>
        )}
      </div>

      {/* Date */}
      <div className="w-20 flex-shrink-0 hidden xl:block text-right">
        <span className="text-xs text-slate-400">{formatDateShort(order.delivery_date)}</span>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
    </Link>
  );
}
