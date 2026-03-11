import React, { useEffect, useRef } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatDateTime } from '../utils/constants.js';

export default function NotificationPanel({ open, onClose }) {
  const { globalNotifs, unreadCount, markNotifsRead } = useApp();
  const ref = useRef(null);

  useEffect(() => {
    if (open) markNotifsRead();
  }, [open, markNotifsRead]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-900">Уведомления</span>
          {unreadCount > 0 && (
            <span className="bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-96">
        {globalNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <CheckCheck className="w-8 h-8 mb-2" />
            <p className="text-sm">Нет уведомлений</p>
          </div>
        ) : (
          globalNotifs.map((n, i) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                i < unreadCount ? 'bg-brand-50/40' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-700 leading-snug">{n.title}</span>
                  {n.order_number && (
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0">{n.order_number}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
              </div>
              {i < unreadCount && (
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
        <p className="text-xs text-slate-400">Показано {Math.min(globalNotifs.length, 50)} последних</p>
      </div>
    </div>
  );
}
