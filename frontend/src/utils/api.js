const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  createEmployee: (body) => request('/auth/create-employee', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role) => request(`/auth/demo-login?role=${encodeURIComponent(role)}`),

  // AI
  analyzeLogoColors: (body) => request('/analyze-logo-colors', { method: 'POST', body: JSON.stringify(body) }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/orders${qs ? '?' + qs : ''}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrder: (id, body) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateOrderStatus: (id, body) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  updateOrderStage: (id, body) => request(`/orders/${id}/stage`, { method: 'POST', body: JSON.stringify(body) }),

  // Client portal
  getOrderByToken: (token) => request(`/portal/${token}`),

  // Final photos
  getFinalPhotos: (orderId) => request(`/orders/${orderId}/final-photos`),
  saveFinalPhotos: (orderId, body) => request(`/orders/${orderId}/final-photos`, { method: 'POST', body: JSON.stringify(body) }),

  // Per-order notifications (activity log)
  getOrderNotifications: (orderId) => request(`/orders/${orderId}/notifications`),

  // Global role-based notifications
  getNotifications: (role) => request(`/notifications?role=${role}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (role) => request(`/notifications/read-all?role=${role}`, { method: 'PUT' }),

  // Measurements
  getMeasurement: (orderId) => request(`/get-measurement/${orderId}`),
  saveMeasurement: (body) => request('/save-measurement', { method: 'POST', body: JSON.stringify(body) }),

  // Order history
  getOrderHistory: (orderId) => request(`/orders/${orderId}/history`),
  addOrderHistory: (orderId, body) => request(`/orders/${orderId}/history`, { method: 'POST', body: JSON.stringify(body) }),

  // Stats
  getStats: () => request('/stats'),

  // Clients
  getClients: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/clients${qs ? '?' + qs : ''}`);
  },
  getClient: (id) => request(`/clients/${id}`),

  // Import
  analyzeImport: (body) => request('/analyze-import', { method: 'POST', body: JSON.stringify(body) }),
  importData: (body) => request('/import-data', { method: 'POST', body: JSON.stringify(body) }),

  // Analytics (enhanced)
  getAnalytics: () => request('/analytics'),

  // Configurations
  saveConfiguration: (body) => request('/configurations', { method: 'POST', body: JSON.stringify(body) }),
  getConfiguration: (id) => request(`/configurations/${id}`),

  // Leads
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads${qs ? '?' + qs : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  createLead: (body) => request('/leads', { method: 'POST', body: JSON.stringify(body) }),
  updateLead: (id, body) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  addLeadAction: (id, body) => request(`/leads/${id}/action`, { method: 'POST', body: JSON.stringify(body) }),
  convertLead: (id, body) => request(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(body) }),

  // Pricelists & Catalog
  analyzePricelist: (body) => request('/analyze-pricelist', { method: 'POST', body: JSON.stringify(body) }),
  getPricelists: () => request('/pricelists'),
  getPricelistDetail: (id) => request(`/pricelists/${id}`),
  savePricelist: (body) => request('/pricelists', { method: 'POST', body: JSON.stringify(body) }),
  savePricelistMarkup: (id, body) => request(`/pricelists/${id}/markup`, { method: 'POST', body: JSON.stringify(body) }),
  deletePricelist: (id) => request(`/pricelists/${id}`, { method: 'DELETE' }),
  getCatalogItems: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/catalog-items${qs ? '?' + qs : ''}`);
  },
  updateCatalogItem: (id, body) => request(`/catalog-items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Unified catalog
  getCatalogStats: () => request('/catalog-stats'),
  getCatalogMarkups: () => request('/catalog-markups'),
  saveCatalogMarkups: (body) => request('/catalog-markups', { method: 'POST', body: JSON.stringify(body) }),
  getUploadLog: () => request('/upload-log'),
  getCatalogItemsPaged: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString();
    return request(`/catalog-items${qs ? '?' + qs : ''}`);
  },
  deleteCatalogItem: (id) => request(`/catalog-items/${id}`, { method: 'DELETE' }),

  // Seed
  seed: () => request('/seed', { method: 'POST' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body: JSON.stringify(body) }),

  // Process templates
  getProcesses: () => request('/processes'),
  createProcess: (body) => request('/processes', { method: 'POST', body: JSON.stringify(body) }),
  updateProcess: (id, body) => request(`/processes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProcess: (id) => request(`/processes/${id}`, { method: 'DELETE' }),

  // Order tasks
  getOrderTasks: (orderId) => request(`/orders/${orderId}/tasks`),
  createOrderTasks: (orderId, body) => request(`/orders/${orderId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  updateOrderTask: (id, body) => request(`/order-tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Procurement
  getProcurement: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement${qs ? '?' + qs : ''}`);
  },
  createProcurementItem: (body) => request('/procurement', { method: 'POST', body: JSON.stringify(body) }),
  updateProcurementItem: (id, body) => request(`/procurement/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getProcurementPending: () => request('/procurement-pending'),

  // Overdue tasks
  getOverdueTasks: () => request('/overdue-tasks'),

  // Report problem
  reportTaskProblem: (taskId, body) => request(`/order-tasks/${taskId}/problem`, { method: 'POST', body: JSON.stringify(body) }),

  // Finance
  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/payments${qs ? '?' + qs : ''}`);
  },
  createPayment: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
  getFinanceSummary: () => request('/finance-summary'),

  // Seed demo
  seedDemo: () => request('/seed-demo', { method: 'POST' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (body) => request('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  updateSupplier: (id, body) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Equipment
  getEquipment: () => request('/equipment'),
  createEquipment: (body) => request('/equipment', { method: 'POST', body: JSON.stringify(body) }),
  updateEquipment: (id, body) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEquipment: (id) => request(`/equipment/${id}`, { method: 'DELETE' }),

  // Business Rules
  getBusinessRules: () => request('/business-rules'),
  createBusinessRule: (body) => request('/business-rules', { method: 'POST', body: JSON.stringify(body) }),
  updateBusinessRule: (id, body) => request(`/business-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBusinessRule: (id) => request(`/business-rules/${id}`, { method: 'DELETE' }),

  // Smart deadline
  calculateDeadline: (body) => request('/calculate-deadline', { method: 'POST', body: JSON.stringify(body) }),

  // Chat
  getChatContext: () => request('/chat-context'),
  chat: (body) => request('/chat', { method: 'POST', body: JSON.stringify(body) }),

  // Material stock
  getMaterialStock: () => request('/material-stock'),
  updateMaterialStock: (body) => request('/material-stock', { method: 'POST', body: JSON.stringify(body) }),

  // Company branding
  getBranding: () => request('/company/branding'),
  saveBranding: (body) => request('/company/branding', { method: 'POST', body: JSON.stringify(body) }),
};
