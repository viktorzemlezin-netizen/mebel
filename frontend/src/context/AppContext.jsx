import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { MOCK_ORDERS, computeStats } from '../utils/mockData.js';
import { STAGE_PROGRESS } from '../utils/constants.js';

const AppContext = createContext(null);

// Default guest role (no role selected yet)
const GUEST_ROLE = null;

// Flatten all notifications from initial orders, sorted newest first
function buildInitialNotifs(orders) {
  return orders
    .flatMap(o => (o.notifications || []).map(n => ({ ...n, order_number: o.order_number })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);
}

export function AppProvider({ children }) {
  const [orders, setOrders]   = useState(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [toast, setToast] = useState(null);

  // Role state: { role, initials, avatarBg } or null
  const [currentRole, setCurrentRole] = useState(GUEST_ROLE);
  const setRole = useCallback((roleObj) => setCurrentRole(roleObj), []);

  // Global notification bell state
  const [globalNotifs, setGlobalNotifs]       = useState(() => buildInitialNotifs(MOCK_ORDERS));
  const [notifsLastRead, setNotifsLastRead]   = useState(null); // null = never opened

  const unreadCount = useMemo(() => {
    if (!notifsLastRead) return Math.min(globalNotifs.length, 5); // show some unread on fresh load
    return globalNotifs.filter(n => new Date(n.created_at) > notifsLastRead).length;
  }, [globalNotifs, notifsLastRead]);

  const markNotifsRead = useCallback(() => setNotifsLastRead(new Date()), []);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) { setToast(null); return; }
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Filtered orders from state
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') result = result.filter(o => o.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.client_name.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        o.product_type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filterStatus, searchQuery]);

  const stats = useMemo(() => computeStats(orders), [orders]);

  // --- Order mutations ---

  const createOrder = useCallback((data) => {
    const id    = 'ord-' + Date.now();
    const token = Math.random().toString(36).slice(2, 18);
    const num   = 'ФФ-' + String(1011 + orders.length);
    const now   = new Date().toISOString();
    const firstNotif = { id: 'n-' + Date.now(), order_id: id, title: 'Заказ создан', message: `Заказ ${num} принят в работу`, created_at: now };
    const newOrder = {
      id, order_number: num,
      client_name: data.client_name,
      client_phone: data.client_phone || '',
      client_email: data.client_email || '',
      product_type: data.product_type,
      description: data.description || '',
      status: 'new', progress: 10, stage: 'Замер',
      total_price: parseFloat(data.total_price) || 0,
      paid_amount: 0,
      delivery_date: data.delivery_date || null,
      portal_token: token,
      notes: data.notes || '',
      created_at: now, updated_at: now,
      photos: [],
      notifications: [firstNotif],
      payments: [],
    };
    setOrders(prev => [newOrder, ...prev]);
    setGlobalNotifs(prev => [{ ...firstNotif, order_number: num }, ...prev]);
    return newOrder;
  }, [orders.length]);

  const updateOrder = useCallback((id, data) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, ...data, updated_at: new Date().toISOString() } : o
    ));
  }, []);

  const updateOrderStatus = useCallback((id, { status, stage, progress, message }) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const newStage    = stage    ?? o.stage;
      const newProgress = progress ?? (stage ? STAGE_PROGRESS[stage] : o.progress);
      const newStatus   = status   ?? o.status;

      const notifMsg = message ||
        (stage  && stage  !== o.stage  ? `Этап изменён: ${o.stage} → ${stage}` : '') ||
        (status && status !== o.status ? `Статус изменён на: ${newStatus}`      : '');

      if (!notifMsg) return { ...o, stage: newStage, progress: newProgress, status: newStatus, updated_at: new Date().toISOString() };

      const notif = { id: 'n-' + Date.now(), order_id: id, title: 'Обновление заказа', message: notifMsg, created_at: new Date().toISOString() };
      setGlobalNotifs(gn => [{ ...notif, order_number: o.order_number }, ...gn].slice(0, 50));

      return {
        ...o,
        stage: newStage, progress: newProgress, status: newStatus,
        updated_at: new Date().toISOString(),
        notifications: [notif, ...(o.notifications || [])],
      };
    }));
  }, []);

  // --- Photo mutations ---

  const addPhoto = useCallback((orderId, photo) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, photos: [...(o.photos || []), photo], updated_at: new Date().toISOString() }
        : o
    ));
  }, []);

  const removePhoto = useCallback((orderId, photoId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, photos: (o.photos || []).filter(p => p.id !== photoId) }
        : o
    ));
  }, []);

  // --- Lookups ---

  const getOrder = useCallback((id) => orders.find(o => o.id === id) || null, [orders]);
  const getOrderByToken = useCallback((token) => orders.find(o => o.portal_token === token) || null, [orders]);

  const refreshAll = useCallback(() => {}, []);
  const loading = false;
  const error   = null;

  return (
    <AppContext.Provider value={{
      orders: filteredOrders,
      allOrders: orders,
      stats, loading, error,
      filterStatus, setFilterStatus,
      searchQuery, setSearchQuery,
      refreshAll,
      showToast, toast,
      // notifications bell
      globalNotifs, unreadCount, markNotifsRead,
      // order mutations
      createOrder, updateOrder, updateOrderStatus,
      // photo mutations
      addPhoto, removePhoto,
      // lookups
      getOrder, getOrderByToken,
      // roles
      currentRole, setRole,
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
