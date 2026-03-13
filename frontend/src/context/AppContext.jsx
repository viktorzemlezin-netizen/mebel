import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { computeStats } from '../utils/mockData.js';
import { STAGE_PROGRESS, ROLE_KEY } from '../utils/constants.js';
import { api } from '../utils/api.js';

const AppContext = createContext(null);

// Role options metadata for building roleObj from stored data
const ROLE_META = {
  'Руководитель': { initials: 'РУК', avatarBg: 'bg-purple-600' },
  'Менеджер':     { initials: 'МНЖ', avatarBg: 'bg-blue-600' },
  'Замерщик':     { initials: 'ЗАМ', avatarBg: 'bg-amber-500' },
  'Дизайнер':     { initials: 'ДЗН', avatarBg: 'bg-pink-600' },
  'Монтажник':    { initials: 'МНТ', avatarBg: 'bg-emerald-600' },
  'Снабженец':    { initials: 'СНБ', avatarBg: 'bg-teal-600' },
  'Технолог':     { initials: 'ТЕХ', avatarBg: 'bg-indigo-600' },
  'Сборщик':      { initials: 'СБР', avatarBg: 'bg-orange-600' },
  'Бухгалтер':    { initials: 'БУХ', avatarBg: 'bg-green-600' },
};

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage,  setFilterStage]  = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [toast, setToast] = useState(null);

  // Branding
  const [branding, setBrandingState] = useState({ primary_color: '#0062d1', accent_color: '#0a7df5', logo_url: null, name: 'FurnFlow' });

  const applyBrandingVars = useCallback((b) => {
    if (!b) return;
    document.documentElement.style.setProperty('--color-primary', b.primary_color || '#0062d1');
    document.documentElement.style.setProperty('--color-accent', b.accent_color || '#0a7df5');
  }, []);

  const setBranding = useCallback((b) => {
    setBrandingState(b);
    applyBrandingVars(b);
  }, [applyBrandingVars]);

  useEffect(() => {
    api.getBranding().then(b => { if (b) setBranding(b); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Role state: { role, initials, avatarBg, name? } or null
  const [currentRole, setCurrentRole] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const meta = ROLE_META[user.role] || { initials: '??', avatarBg: 'bg-slate-600' };
        setCurrentRole({ role: user.role, name: user.name, ...meta });
      } catch {}
    }
  }, []);

  const setRole = useCallback((roleObj) => {
    setCurrentRole(roleObj);
    if (!roleObj) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentRole(null);
    setOrders([]);
  }, []);

  // Role key for API (manager, measurer, designer, installer)
  const roleKey = useMemo(() => currentRole ? (ROLE_KEY[currentRole.role] || 'manager') : 'manager', [currentRole]);

  // ── Fetch orders from API ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentRole) fetchOrders();
  }, [currentRole, fetchOrders]);

  // API-backed notifications
  const [apiNotifs, setApiNotifs]   = useState([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);

  const fetchNotifications = useCallback(async (role) => {
    try {
      const data = await api.getNotifications(role || 'manager');
      setApiNotifs(Array.isArray(data) ? data : []);
    } catch {}
    setNotifsLoaded(true);
  }, []);

  useEffect(() => {
    if (currentRole) fetchNotifications(roleKey);
  }, [currentRole, roleKey, fetchNotifications]);

  const unreadCount = useMemo(() => apiNotifs.filter(n => !n.read).length, [apiNotifs]);

  const markNotifsRead = useCallback(async () => {
    try { await api.markAllNotificationsRead(roleKey); } catch {}
    setApiNotifs(prev => prev.map(n => ({ ...n, read: 1 })));
  }, [roleKey]);

  const markOneRead = useCallback(async (id) => {
    try { await api.markNotificationRead(id); } catch {}
    setApiNotifs(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) { setToast(null); return; }
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') result = result.filter(o => o.status === filterStatus);
    if (filterStage  !== 'all') result = result.filter(o => o.stage  === filterStage);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.client_name?.toLowerCase().includes(q) ||
        o.order_number?.toLowerCase().includes(q) ||
        o.product_type?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filterStatus, filterStage, searchQuery]);

  const stats = useMemo(() => computeStats(orders), [orders]);

  // ── Order mutations ──────────────────────────────────────────────────────────

  const createOrder = useCallback(async (data) => {
    const order = await api.createOrder(data);
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const updateOrder = useCallback((id, data) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, ...data, updated_at: new Date().toISOString() } : o
    ));
  }, []);

  const updateOrderStatus = useCallback((id, { status, stage, progress, message }) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const newStage    = stage    ?? o.stage;
      const newProgress = progress ?? (stage ? (STAGE_PROGRESS[stage] ?? o.progress) : o.progress);
      const newStatus   = status   ?? o.status;
      return { ...o, stage: newStage, progress: newProgress, status: newStatus, updated_at: new Date().toISOString() };
    }));
  }, []);

  // ── Photo mutations ──────────────────────────────────────────────────────────
  const addPhoto = useCallback((orderId, photo) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, photos: [...(o.photos || []), photo], updated_at: new Date().toISOString() } : o
    ));
  }, []);

  const removePhoto = useCallback((orderId, photoId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, photos: (o.photos || []).filter(p => p.id !== photoId) } : o
    ));
  }, []);

  // ── Lookups ──────────────────────────────────────────────────────────────────
  const getOrder = useCallback((id) => orders.find(o => o.id === id) || null, [orders]);
  const getOrderByToken = useCallback((token) => orders.find(o => o.portal_token === token) || null, [orders]);
  const refreshAll = useCallback(() => fetchOrders(), [fetchOrders]);
  const loading = ordersLoading;
  const error = null;

  return (
    <AppContext.Provider value={{
      orders: filteredOrders, allOrders: orders,
      stats, loading, error,
      filterStatus, setFilterStatus, filterStage, setFilterStage, searchQuery, setSearchQuery,
      refreshAll, showToast, toast,
      // notifications
      apiNotifs, unreadCount, markNotifsRead, markOneRead, fetchNotifications, notifsLoaded,
      // order mutations
      createOrder, updateOrder, updateOrderStatus,
      // photo mutations
      addPhoto, removePhoto,
      // lookups
      getOrder, getOrderByToken,
      // roles
      currentRole, setRole, roleKey,
      // auth
      logout,
      // branding
      branding, setBranding,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
