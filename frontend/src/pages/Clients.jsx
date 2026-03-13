import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Phone, MapPin, ShoppingBag, TrendingUp, Upload } from 'lucide-react';
import { api } from '../utils/api.js';
import { formatCurrency, formatDate } from '../utils/constants.js';

const FILTERS = [
  { key: 'all',        label: 'Все' },
  { key: 'active',     label: 'Активные' },
  { key: 'imported',   label: 'Импортированные' },
];

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { filter };
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await api.getClients(params);
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} клиентов в базе</p>
        </div>
        <button
          onClick={() => navigate('/import')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Импорт из CRM
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!loading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Клиентов пока нет</p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? 'Попробуйте изменить поиск' : 'Импортируйте базу клиентов из CRM'}
            </p>
          </div>
          {!search && (
            <button
              onClick={() => navigate('/import')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Импортировать клиентов
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client cards */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onClick={() => navigate(`/clients/${client.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onClick }) {
  const initials = (client.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500'];
  const colorIdx = (client.name || '').charCodeAt(0) % colors.length;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${colors[colorIdx]}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate group-hover:text-indigo-700">{client.name || 'Без имени'}</p>
          {client.source && client.source !== 'manual' && (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{client.source}</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{client.total_orders || 0} зак.</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">{formatCurrency(client.total_amount || 0)}</span>
        </div>
        {client.last_order_date && (
          <div className="col-span-2 text-xs text-slate-400">
            Последний заказ: {formatDate(client.last_order_date)}
          </div>
        )}
      </div>
    </button>
  );
}
