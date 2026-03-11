import React, { useState } from 'react';
import { Menu, Bell, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import NotificationPanel from './NotificationPanel.jsx';

export default function Header({ onMenuToggle }) {
  const { refreshAll, loading, searchQuery, setSearchQuery, unreadCount, currentRole } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-14 border-b border-slate-100 bg-white flex items-center gap-3 px-4 sticky top-0 z-10">
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по клиенту, номеру, типу..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input pl-9 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={refreshAll}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50"
          title="Обновить"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors relative"
            title="Уведомления"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center px-1 leading-none font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ml-1 ${currentRole?.avatarBg || 'bg-brand-600'}`}
          title={currentRole?.role || 'Пользователь'}
        >
          {currentRole?.initials?.slice(0, 2) || 'АД'}
        </div>
      </div>
    </header>
  );
}
