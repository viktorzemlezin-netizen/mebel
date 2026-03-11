import React from 'react';
import { STATUSES } from '../utils/constants.js';

export default function StatusBadge({ status, size = 'md' }) {
  const s = STATUSES[status] || { label: status, color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
