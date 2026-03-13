import React, { useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../utils/constants.js';

const TYPE_ICONS = {
  new_order:  '🆕',
  new_task:   '📋',
  completed:  '✅',
  info:       '💬',
};

export default function NotificationPanel({ open, onClose }) {
  const { apiNotifs, unreadCount, markNotifsRead, markOneRead } = useApp();
  const navigate = useNavigate();
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

  const handleNotifClick = (n) => {
    markOneRead(n.id);
    if (n.order_id) navigate(`/orders/${n.order_id}`);
    onClose();
  };

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
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[420px]">
        {apiNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <CheckCheck className="w-8 h-8 mb-2" />
            <p className="text-sm">Нет уведомлений</p>
          </div>
        ) : (
          apiNotifs.map((n) => {
            const isUnread = !n.read;
            return (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left
                  ${isUnread ? 'bg-blue-50/40' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                  {TYPE_ICONS[n.type] || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2">{n.message}</p>
                    {isUnread && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {n.order_number && (
                      <span className="text-xs font-mono text-slate-400">{n.order_number}</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-400">{apiNotifs.length} уведомлений</p>
        {unreadCount === 0 && apiNotifs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCheck className="w-3 h-3" /> Все прочитаны
          </div>
        )}
      </div>
    </div>
  );
}
