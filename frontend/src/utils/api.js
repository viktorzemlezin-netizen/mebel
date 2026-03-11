const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export const api = {
  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? '?' + qs : ''}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrder: (id, body) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateOrderStatus: (id, body) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Client portal
  getOrderByToken: (token) => request(`/portal/${token}`),

  // Notifications
  getNotifications: (orderId) => request(`/orders/${orderId}/notifications`),

  // Stats
  getStats: () => request('/stats'),

  // Seed
  seed: () => request('/seed', { method: 'POST' }),
};
