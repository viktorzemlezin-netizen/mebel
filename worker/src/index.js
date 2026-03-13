// FurnFlow Worker - Cloudflare Worker API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ─── Router ───────────────────────────────────────────────────────────────────

async function handleRequest(request, env) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  // Auth
  if (path === '/api/auth/register' && method === 'POST') return registerCompany(request, env);
  if (path === '/api/auth/login'    && method === 'POST') return loginUser(request, env);
  if (path === '/api/auth/create-employee' && method === 'POST') return createEmployee(request, env);
  if (path === '/api/auth/demo-login' && method === 'GET') return demoLogin(request, env);

  // AI: logo color analysis
  if (path === '/api/analyze-logo-colors' && method === 'POST') return analyzeLogoColors(request, env);

  // Orders
  if (path === '/api/orders' && method === 'GET')  return getOrders(request, env);
  if (path === '/api/orders' && method === 'POST') return createOrder(request, env);
  if (path.match(/^\/api\/orders\/[\w-]+$/) && method === 'GET') return getOrder(path.split('/').pop(), env);
  if (path.match(/^\/api\/orders\/[\w-]+$/) && method === 'PUT') return updateOrder(path.split('/').pop(), request, env);
  if (path.match(/^\/api\/orders\/[\w-]+\/status$/) && method === 'PUT') return updateOrderStatus(path.split('/')[3], request, env);
  if (path.match(/^\/api\/orders\/[\w-]+\/stage$/) && method === 'POST') return updateOrderStage(path.split('/')[3], request, env);
  if (path.match(/^\/api\/orders\/[\w-]+\/history$/) && method === 'GET')  return getOrderHistory(path.split('/')[3], env);
  if (path.match(/^\/api\/orders\/[\w-]+\/history$/) && method === 'POST') return addOrderHistoryEntry(path.split('/')[3], request, env);
  if (path.match(/^\/api\/orders\/[\w-]+\/notifications$/) && method === 'GET') return getOrderNotifications(path.split('/')[3], env);
  if (path.match(/^\/api\/orders\/[\w-]+\/final-photos$/) && method === 'GET')  return getFinalPhotos(path.split('/')[3], env);
  if (path.match(/^\/api\/orders\/[\w-]+\/final-photos$/) && method === 'POST') return saveFinalPhotos(path.split('/')[3], request, env);

  // Client portal
  if (path.match(/^\/api\/portal\/[\w-]+$/) && method === 'GET') return getOrderByToken(path.split('/').pop(), env);

  // Stats
  if (path === '/api/stats' && method === 'GET') return getStats(env);

  // Global notifications (role-based) — order matters: read-all before :id/read
  if (path === '/api/notifications/read-all' && method === 'PUT') return markAllNotificationsRead(request, env);
  if (path.match(/^\/api\/notifications\/[\w-]+\/read$/) && method === 'PUT') return markNotificationRead(path.split('/')[3], env);
  if (path === '/api/notifications' && method === 'GET')  return getGlobalNotifications(request, env);
  if (path === '/api/notifications' && method === 'POST') return createGlobalNotification(request, env);

  // Measurements
  if (path === '/api/save-measurement' && method === 'POST') return saveMeasurement(request, env);
  if (path.match(/^\/api\/get-measurement\/[\w-]+$/) && method === 'GET') return getMeasurement(path.split('/').pop(), env);

  // AI
  if (path === '/api/analyze-photo' && method === 'POST') return analyzePhoto(request, env);
  if (path === '/api/analyze-room'  && method === 'POST') return analyzeRoom(request, env);
  if (path === '/api/analyze-import' && method === 'POST') return analyzeImport(request, env);

  // Clients
  if (path === '/api/clients' && method === 'GET') return getClients(request, env);
  if (path.match(/^\/api\/clients\/[\w-]+$/) && method === 'GET') return getClient(path.split('/').pop(), env);

  // Import
  if (path === '/api/import-data' && method === 'POST') return importData(request, env);

  // Analytics (enhanced)
  if (path === '/api/analytics' && method === 'GET') return getAnalytics(env);

  // Leads
  if (path === '/api/leads' && method === 'GET') return getLeads(request, env);
  if (path === '/api/leads' && method === 'POST') return createLead(request, env);
  if (path.match(/^\/api\/leads\/[\w-]+\/action$/) && method === 'POST') return addLeadAction(path.split('/')[3], request, env);
  if (path.match(/^\/api\/leads\/[\w-]+\/convert$/) && method === 'POST') return convertLead(path.split('/')[3], request, env);
  if (path.match(/^\/api\/leads\/[\w-]+$/) && method === 'GET') return getLead(path.split('/').pop(), env);
  if (path.match(/^\/api\/leads\/[\w-]+$/) && method === 'PUT') return updateLead(path.split('/').pop(), request, env);

  // Configurations
  if (path === '/api/configurations' && method === 'POST') return saveConfiguration(request, env);
  if (path.match(/^\/api\/configurations\/[\w-]+$/) && method === 'GET') return getConfiguration(path.split('/').pop(), env);

  // Pricelists & Catalog
  if (path === '/api/analyze-pricelist' && method === 'POST') return analyzePricelist(request, env);
  if (path === '/api/pricelists' && method === 'GET') return getPricelists(env);
  if (path === '/api/pricelists' && method === 'POST') return savePricelist(request, env);
  if (path.match(/^\/api\/pricelists\/[\w-]+\/markup$/) && method === 'POST') return savePricelistMarkup(path.split('/')[3], request, env);
  if (path.match(/^\/api\/pricelists\/[\w-]+$/) && method === 'GET') return getPricelistDetail(path.split('/').pop(), env);
  if (path.match(/^\/api\/pricelists\/[\w-]+$/) && method === 'DELETE') return deletePricelist(path.split('/').pop(), env);
  if (path === '/api/catalog-items' && method === 'GET') return getCatalogItems(request, env);
  if (path.match(/^\/api\/catalog-items\/[\w-]+$/) && method === 'PUT') return updateCatalogItem(path.split('/').pop(), request, env);

  // Admin
  if (path === '/api/admin/reset-catalog' && method === 'POST') return resetCatalog(env);

  // Catalog extras
  if (path === '/api/catalog-stats' && method === 'GET') return getCatalogStats(env);
  if (path === '/api/catalog-markups' && method === 'GET') return getCatalogMarkups(env);
  if (path === '/api/catalog-markups' && method === 'POST') return saveCatalogMarkups(request, env);
  if (path === '/api/upload-log' && method === 'GET') return getUploadLog(env);
  if (path.match(/^\/api\/catalog-items\/[\w-]+$/) && method === 'DELETE') return deleteCatalogItem(path.split('/').pop(), env);

  // Seed
  if (path === '/api/seed' && method === 'POST') return seedData(env);

  // Users
  if (path === '/api/users' && method === 'GET') return getUsers(env);
  if (path === '/api/users' && method === 'POST') return createUser(request, env);
  if (path.match(/^\/api\/users\/[\w-]+$/) && method === 'PUT') return updateUser(path.split('/').pop(), request, env);

  // Process templates
  if (path === '/api/processes' && method === 'GET') return getProcesses(env);
  if (path === '/api/processes' && method === 'POST') return createProcess(request, env);
  if (path.match(/^\/api\/processes\/[\w-]+$/) && method === 'PUT') return updateProcess(path.split('/').pop(), request, env);
  if (path.match(/^\/api\/processes\/[\w-]+$/) && method === 'DELETE') return deleteProcess(path.split('/').pop(), env);

  // Order tasks (process steps)
  if (path.match(/^\/api\/orders\/[\w-]+\/tasks$/) && method === 'GET') return getOrderTasks(path.split('/')[3], env);
  if (path.match(/^\/api\/orders\/[\w-]+\/tasks$/) && method === 'POST') return createOrderTasks(path.split('/')[3], request, env);
  if (path.match(/^\/api\/order-tasks\/[\w-]+$/) && method === 'PUT') return updateOrderTask(path.split('/').pop(), request, env);

  // Procurement
  if (path === '/api/procurement' && method === 'GET') return getProcurement(request, env);
  if (path === '/api/procurement' && method === 'POST') return createProcurementItem(request, env);
  if (path.match(/^\/api\/procurement\/[\w-]+$/) && method === 'PUT') return updateProcurementItem(path.split('/').pop(), request, env);
  if (path === '/api/procurement-pending' && method === 'GET') return getProcurementPending(env);

  // Overdue tasks / dashboard alerts
  if (path === '/api/overdue-tasks' && method === 'GET') return getOverdueTasks(env);

  // Report problem on task
  if (path.match(/^\/api\/order-tasks\/[\w-]+\/problem$/) && method === 'POST') return reportTaskProblem(path.split('/')[3], request, env);

  // Payments/Finance
  if (path === '/api/payments' && method === 'GET') return getPayments(request, env);
  if (path === '/api/payments' && method === 'POST') return createPayment(request, env);
  if (path === '/api/finance-summary' && method === 'GET') return getFinanceSummary(env);

  // Seed demo
  if (path === '/api/seed-demo' && method === 'POST') return seedDemo(env);

  // Suppliers
  if (path === '/api/suppliers' && method === 'GET') return getSuppliers(env);
  if (path === '/api/suppliers' && method === 'POST') return createSupplier(request, env);
  if (path.match(/^\/api\/suppliers\/[\w-]+$/) && method === 'PUT') return updateSupplier(path.split('/').pop(), request, env);
  if (path.match(/^\/api\/suppliers\/[\w-]+$/) && method === 'DELETE') return deleteSupplier(path.split('/').pop(), env);

  // Equipment
  if (path === '/api/equipment' && method === 'GET') return getEquipment(env);
  if (path === '/api/equipment' && method === 'POST') return createEquipment(request, env);
  if (path.match(/^\/api\/equipment\/[\w-]+$/) && method === 'PUT') return updateEquipment(path.split('/').pop(), request, env);
  if (path.match(/^\/api\/equipment\/[\w-]+$/) && method === 'DELETE') return deleteEquipment(path.split('/').pop(), env);

  // Business Rules
  if (path === '/api/business-rules' && method === 'GET') return getBusinessRules(env);
  if (path === '/api/business-rules' && method === 'POST') return createBusinessRule(request, env);
  if (path.match(/^\/api\/business-rules\/[\w-]+$/) && method === 'PUT') return updateBusinessRule(path.split('/').pop(), request, env);
  if (path.match(/^\/api\/business-rules\/[\w-]+$/) && method === 'DELETE') return deleteBusinessRule(path.split('/').pop(), env);

  // Smart deadline calculator
  if (path === '/api/calculate-deadline' && method === 'POST') return calculateDeadline(request, env);

  // Chat context
  if (path === '/api/chat-context' && method === 'GET') return getChatContext(env);

  // AI Chat
  if (path === '/api/chat' && method === 'POST') return handleChat(request, env);

  // Material stock
  if (path === '/api/material-stock' && method === 'GET') return getMaterialStock(env);
  if (path === '/api/material-stock' && method === 'POST') return updateMaterialStock(request, env);

  // Company branding
  if (path === '/api/company/branding' && method === 'GET') return getBranding(env);
  if (path === '/api/company/branding' && method === 'POST') return saveBranding(request, env);

  // Clear test data
  if (path === '/api/clear-test-data' && method === 'POST') return clearTestData(env);

  return errorResponse('Not found', 404);
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      client_address TEXT,
      product_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'new',
      progress INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'Новый',
      assigned_measurer TEXT,
      assigned_designer TEXT,
      assigned_installer TEXT,
      total_price REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      portal_token TEXT UNIQUE,
      notes TEXT,
      delivery_date TEXT,
      constructor_config TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_role TEXT DEFAULT 'all',
      order_id TEXT,
      order_number TEXT,
      client_name TEXT,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      amount REAL,
      type TEXT,
      note TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS order_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      stage TEXT,
      action TEXT,
      performed_by TEXT,
      performed_by_role TEXT,
      notes TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      photos_json TEXT,
      measurements_json TEXT,
      room_summary_json TEXT,
      completed_at TEXT,
      measurer_name TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      last_order_date TEXT,
      imported_at TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      client_name TEXT,
      client_phone TEXT,
      source TEXT DEFAULT 'other',
      furniture_type TEXT,
      budget_range TEXT,
      status TEXT DEFAULT 'active',
      stage TEXT DEFAULT 'new',
      responsible TEXT,
      next_action TEXT,
      next_action_date TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS lead_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT,
      action TEXT,
      performed_by TEXT,
      notes TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS configurations (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      lead_id TEXT,
      furniture_type TEXT,
      selected_variant TEXT,
      corpus_material TEXT,
      facade_material TEXT,
      hardware TEXT,
      options_json TEXT,
      total_econom REAL,
      total_standart REAL,
      total_premium REAL,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      name TEXT,
      article TEXT,
      category TEXT,
      supplier TEXT,
      unit TEXT,
      price REAL,
      currency TEXT DEFAULT 'KZT',
      photo_url TEXT,
      is_active INTEGER DEFAULT 1,
      pricelist_id TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS pricelists (
      id TEXT PRIMARY KEY,
      supplier TEXT,
      filename TEXT,
      price_date TEXT,
      total_items INTEGER,
      status TEXT DEFAULT 'active',
      uploaded_by TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS price_markups (
      id TEXT PRIMARY KEY,
      pricelist_id TEXT,
      category TEXT,
      item_id TEXT,
      markup_percent REAL DEFAULT 0,
      created_by TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS upload_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      supplier TEXT,
      items_updated INTEGER DEFAULT 0,
      items_added INTEGER DEFAULT 0,
      uploaded_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      role TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      primary_color TEXT DEFAULT '#0062d1',
      accent_color TEXT DEFAULT '#0a7df5',
      logo_url TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS process_templates (
      id TEXT PRIMARY KEY,
      furniture_type TEXT,
      name TEXT,
      steps_json TEXT,
      is_default INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS order_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      step_name TEXT,
      step_index INTEGER,
      responsible_role TEXT,
      responsible_user TEXT,
      status TEXT DEFAULT 'pending',
      is_parallel INTEGER DEFAULT 0,
      required_actions_json TEXT,
      documents_json TEXT,
      sla_days INTEGER,
      started_at TEXT,
      completed_at TEXT,
      notes TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS procurement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      material_name TEXT,
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'шт',
      supplier TEXT,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      status TEXT DEFAULT 'needed',
      ordered_at TEXT,
      received_at TEXT,
      notes TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      city TEXT,
      delivery_days INTEGER DEFAULT 0,
      visit_schedule TEXT,
      lead_time_days INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      is_available INTEGER DEFAULT 1,
      busy_until TEXT,
      daily_capacity_minutes INTEGER DEFAULT 480,
      notes TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS equipment_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      order_id TEXT,
      start_date TEXT,
      end_date TEXT,
      operation TEXT,
      duration_minutes INTEGER DEFAULT 0
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS business_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      trigger_type TEXT,
      trigger_condition TEXT,
      actions_json TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS material_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catalog_item_id TEXT,
      material_name TEXT,
      category TEXT,
      supplier TEXT,
      stock_status TEXT DEFAULT 'in_stock',
      stock_source TEXT DEFAULT 'local_warehouse',
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'шт',
      supply_source TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT,
      company_id TEXT,
      role TEXT,
      name TEXT,
      created_at TEXT
    )
  `).run();

  // Add new columns to existing tables (migrations)
  const alterCmds = [
    `ALTER TABLE procurement ADD COLUMN payment_status TEXT DEFAULT 'unpaid'`,
    `ALTER TABLE procurement ADD COLUMN invoice_number TEXT`,
    `ALTER TABLE procurement ADD COLUMN payment_date TEXT`,
    `ALTER TABLE procurement ADD COLUMN paid_by TEXT`,
    `ALTER TABLE order_tasks ADD COLUMN problem_type TEXT`,
    `ALTER TABLE order_tasks ADD COLUMN problem_description TEXT`,
    `ALTER TABLE order_tasks ADD COLUMN problem_reported_at TEXT`,
    `ALTER TABLE orders ADD COLUMN client_address TEXT`,
    `ALTER TABLE orders ADD COLUMN assigned_measurer TEXT`,
    `ALTER TABLE orders ADD COLUMN assigned_designer TEXT`,
    `ALTER TABLE orders ADD COLUMN assigned_installer TEXT`,
    `ALTER TABLE orders ADD COLUMN constructor_config TEXT`,
    `ALTER TABLE notifications ADD COLUMN user_role TEXT DEFAULT 'all'`,
    `ALTER TABLE notifications ADD COLUMN order_number TEXT`,
    `ALTER TABLE notifications ADD COLUMN client_name TEXT`,
    `ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info'`,
    `ALTER TABLE notifications ADD COLUMN read INTEGER DEFAULT 0`,
    `ALTER TABLE catalog_items ADD COLUMN upload_source TEXT`,
    `ALTER TABLE users ADD COLUMN company_id TEXT`,
    `ALTER TABLE users ADD COLUMN email TEXT`,
    `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    `ALTER TABLE orders ADD COLUMN company_id TEXT`,
    `ALTER TABLE orders ADD COLUMN final_photos_json TEXT`,
    `ALTER TABLE orders ADD COLUMN project_files_json TEXT`,
    `ALTER TABLE orders ADD COLUMN project_links_json TEXT`,
    `ALTER TABLE orders ADD COLUMN designer_notes TEXT`,
    `ALTER TABLE orders ADD COLUMN install_checklist_json TEXT`,
  ];
  for (const cmd of alterCmds) {
    try { await env.DB.prepare(cmd).run(); } catch {}
  }
}

// ─── Order handlers ───────────────────────────────────────────────────────────

async function getOrders(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const stage  = url.searchParams.get('stage');
  const search = url.searchParams.get('search');

  const session = await verifyToken(request, env);

  let query = 'SELECT * FROM orders';
  const params = [], conditions = [];

  if (session?.company_id) {
    conditions.push('(company_id = ? OR company_id IS NULL)');
    params.push(session.company_id);
  }
  if (status && status !== 'all') { conditions.push('status = ?'); params.push(status); }
  if (stage  && stage  !== 'all') { conditions.push('stage = ?');  params.push(stage);  }
  if (search) {
    conditions.push('(client_name LIKE ? OR order_number LIKE ? OR product_type LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(result.results || []);
}

async function getOrder(id, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);

  const [notifications, payments, history] = await Promise.all([
    env.DB.prepare('SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC LIMIT 30').bind(id).all(),
    env.DB.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').bind(id).all(),
    env.DB.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC').bind(id).all(),
  ]);

  return jsonResponse({
    ...order,
    notifications: notifications.results || [],
    payments:      payments.results      || [],
    history:       history.results       || [],
  });
}

async function createOrder(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const session = await verifyToken(request, env);
  const id    = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const num   = 'ФФ-' + String(Math.floor(Math.random() * 9000) + 1000);

  await env.DB.prepare(`
    INSERT INTO orders (id, order_number, client_name, client_phone, client_email, client_address,
      product_type, description, status, progress, stage, total_price, paid_amount,
      portal_token, notes, constructor_config, created_at, updated_at, delivery_date, company_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 0, 'Новый', ?, 0, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `).bind(
    id, num, body.client_name, body.client_phone || '', body.client_email || '',
    body.client_address || '', body.product_type, body.description || '',
    body.total_price || 0, token, body.notes || '',
    body.constructor_config ? JSON.stringify(body.constructor_config) : null,
    body.delivery_date || null, session?.company_id || null
  ).run();

  // Notify managers about new order
  await addRoleNotification(id, num, body.client_name, 'manager',
    `Новый заказ: ${num} — ${body.client_name} (${body.product_type})`, 'new_order', env);

  // History entry
  await addHistory(id, 'Новый', 'Заказ создан', body.created_by || 'Система', 'manager', '', env);

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(order, 201);
}

async function updateOrder(id, request, env) {
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE orders SET
      client_name    = COALESCE(?, client_name),
      client_phone   = COALESCE(?, client_phone),
      client_email   = COALESCE(?, client_email),
      client_address = COALESCE(?, client_address),
      product_type   = COALESCE(?, product_type),
      description    = COALESCE(?, description),
      notes          = COALESCE(?, notes),
      total_price    = COALESCE(?, total_price),
      paid_amount    = COALESCE(?, paid_amount),
      delivery_date  = COALESCE(?, delivery_date),
      assigned_measurer  = COALESCE(?, assigned_measurer),
      assigned_designer  = COALESCE(?, assigned_designer),
      assigned_installer = COALESCE(?, assigned_installer),
      constructor_config    = COALESCE(?, constructor_config),
      project_files_json    = COALESCE(?, project_files_json),
      project_links_json    = COALESCE(?, project_links_json),
      designer_notes        = COALESCE(?, designer_notes),
      install_checklist_json = COALESCE(?, install_checklist_json),
      updated_at     = datetime('now')
    WHERE id = ?
  `).bind(
    body.client_name || null, body.client_phone || null, body.client_email || null,
    body.client_address || null, body.product_type || null, body.description || null,
    body.notes || null, body.total_price ?? null, body.paid_amount ?? null,
    body.delivery_date || null, body.assigned_measurer || null,
    body.assigned_designer || null, body.assigned_installer || null,
    body.constructor_config ? JSON.stringify(body.constructor_config) : null,
    body.project_files_json !== undefined ? body.project_files_json : null,
    body.project_links_json !== undefined ? body.project_links_json : null,
    body.designer_notes !== undefined ? body.designer_notes : null,
    body.install_checklist_json !== undefined ? body.install_checklist_json : null,
    id
  ).run();

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(order);
}

const STATUS_LABELS = { new: 'Новый', in_progress: 'В работе', ready: 'Готов', delivered: 'Доставлен', cancelled: 'Отменён' };
const STAGE_PROGRESS_MAP = {
  'Новый': 0, 'Замер': 10, 'Замер завершён': 20, 'Проектирование': 30,
  'Согласование': 45, 'Производство': 60, 'Готово': 80, 'Монтаж': 90,
  'Завершён': 100, 'Отменён': 0,
  // legacy
  'Проект': 30, 'Покраска': 75,
};

async function updateOrderStatus(id, request, env) {
  const body = await request.json();
  const { status, stage, progress, message } = body;

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);

  const newStage    = stage    || order.stage;
  const newProgress = progress !== undefined ? progress : (stage ? (STAGE_PROGRESS_MAP[stage] ?? order.progress) : order.progress);
  const newStatus   = status   || order.status;

  await env.DB.prepare(`
    UPDATE orders SET status = ?, stage = ?, progress = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(newStatus, newStage, newProgress, id).run();

  let notifMsg = message || '';
  if (stage  && stage  !== order.stage)  notifMsg = notifMsg || `Этап изменён: ${order.stage} → ${stage}`;
  if (status && status !== order.status) notifMsg = notifMsg || `Статус: ${STATUS_LABELS[status] || status}`;
  if (notifMsg) {
    await addOrderNotification(id, order.order_number, order.client_name, 'Обновление заказа', notifMsg, env);
  }

  const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(updated);
}

// New: stage lifecycle transition
const STAGE_NOTIFICATIONS = {
  'Замер':          { role: 'measurer',  type: 'new_task',  msg: (o) => `Новый замер: ${o.order_number} — ${o.client_name}, ${o.product_type}` },
  'Замер завершён': { role: 'manager',   type: 'completed', msg: (o) => `Замер завершён: ${o.order_number}. Готово к проектированию.` },
  'Проектирование': { role: 'designer',  type: 'new_task',  msg: (o) => `Новый проект: ${o.order_number} — ${o.product_type}` },
  'Согласование':   { role: 'manager',   type: 'info',      msg: (o) => `КП отправлено клиенту по заказу ${o.order_number}` },
  'Производство':   { role: 'manager',   type: 'new_task',  msg: (o) => `Заказ ${o.order_number} передан в производство` },
  'Готово':         { role: 'installer', type: 'new_task',  msg: (o) => `Заказ ${o.order_number} готов к монтажу — ${o.client_name}` },
  'Монтаж':         { role: 'installer', type: 'new_task',  msg: (o) => `Монтаж назначен: ${o.order_number} — ${o.client_address || o.client_name}` },
  'Завершён':       { role: 'manager',   type: 'completed', msg: (o) => `Заказ ${o.order_number} завершён. Клиент: ${o.client_name}` },
};

async function updateOrderStage(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { stage, performed_by, performed_by_role, notes } = body;
  if (!stage) return errorResponse('stage is required');

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);

  const progress = STAGE_PROGRESS_MAP[stage] ?? order.progress;
  let newStatus = order.status;
  if (stage === 'Завершён') newStatus = 'delivered';
  else if (stage === 'Отменён') newStatus = 'cancelled';
  else if (stage !== 'Новый') newStatus = 'in_progress';

  await env.DB.prepare(`
    UPDATE orders SET stage = ?, progress = ?, status = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(stage, progress, newStatus, id).run();

  // History entry
  await addHistory(id, stage, `Этап изменён: ${order.stage} → ${stage}`,
    performed_by || 'Система', performed_by_role || 'manager', notes || '', env);

  // Per-order notification
  await addOrderNotification(id, order.order_number, order.client_name,
    'Этап изменён', `${order.stage} → ${stage}`, env);

  // Role notification
  const notifConf = STAGE_NOTIFICATIONS[stage];
  if (notifConf) {
    const updatedOrder = { ...order, client_address: order.client_address };
    await addRoleNotification(id, order.order_number, order.client_name,
      notifConf.role, notifConf.msg(updatedOrder), notifConf.type, env);
  }

  // Client notification when order is fully completed
  if (stage === 'Завершён') {
    await addOrderNotification(id, order.order_number, order.client_name,
      '🎉 Заказ завершён',
      `Ваш заказ ${order.order_number} выполнен и готов. Спасибо за выбор нашей компании!`, env);
  }

  const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(updated);
}

async function getOrderByToken(token, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE portal_token = ?').bind(token).first();
  if (!order) return errorResponse('Order not found', 404);

  const notifications = await env.DB.prepare(
    'SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC LIMIT 15'
  ).bind(order.id).all();

  return jsonResponse({ ...order, notifications: notifications.results || [] });
}

async function getOrderNotifications(orderId, env) {
  const result = await env.DB.prepare(
    'SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(orderId).all();
  return jsonResponse(result.results || []);
}

async function getOrderHistory(orderId, env) {
  await ensureSchema(env);
  const result = await env.DB.prepare(
    'SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(orderId).all();
  return jsonResponse(result.results || []);
}

// ─── Global notifications ─────────────────────────────────────────────────────

async function getGlobalNotifications(request, env) {
  try {
    await ensureSchema(env);
  } catch (e) {
    console.error('getGlobalNotifications ensureSchema error:', e.message, e.stack);
    return jsonResponse([]); // graceful fallback: return empty instead of 500
  }
  const url  = new URL(request.url);
  const role = url.searchParams.get('role') || 'manager';

  try {
    const result = await env.DB.prepare(`
      SELECT * FROM notifications
      WHERE user_role = ? OR user_role = 'all'
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(role).all();
    return jsonResponse(result.results || []);
  } catch (e) {
    console.error('getGlobalNotifications query error:', e.message, e.stack);
    return jsonResponse([]);
  }
}

async function createGlobalNotification(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  await addRoleNotification(
    body.order_id, body.order_number, body.client_name,
    body.user_role || 'all', body.message, body.type || 'info', env
  );
  return jsonResponse({ success: true });
}

async function markNotificationRead(id, env) {
  await env.DB.prepare('UPDATE notifications SET read = 1 WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

async function markAllNotificationsRead(request, env) {
  const url  = new URL(request.url);
  const role = url.searchParams.get('role') || 'manager';
  await env.DB.prepare(`
    UPDATE notifications SET read = 1 WHERE user_role = ? OR user_role = 'all'
  `).bind(role).run();
  return jsonResponse({ success: true });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

async function getStats(env) {
  const total  = await env.DB.prepare('SELECT COUNT(*) as count, SUM(total_price) as revenue, SUM(paid_amount) as paid FROM orders').first();
  const byStatus = await env.DB.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
  const byStage  = await env.DB.prepare('SELECT stage, COUNT(*) as count FROM orders GROUP BY stage').all();

  // This month revenue
  const thisMonth = await env.DB.prepare(`
    SELECT SUM(paid_amount) as paid FROM orders
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).first();

  return jsonResponse({
    total_orders: total.count    || 0,
    total_revenue: total.revenue || 0,
    total_paid:    total.paid    || 0,
    month_paid:    thisMonth?.paid || 0,
    by_status: byStatus.results || [],
    by_stage:  byStage.results  || [],
  });
}

// ─── Measurements ─────────────────────────────────────────────────────────────

async function saveMeasurement(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { order_id, photos, measurements, room_summary, completed_at, measurer_name } = body;
  if (!order_id) return errorResponse('order_id is required');

  const photosJson      = JSON.stringify(photos       || []);
  const measurementsJson = JSON.stringify(measurements || {});
  const roomSummaryJson  = JSON.stringify(room_summary  || null);
  const completedAtVal   = completed_at || new Date().toISOString();

  const existing = await env.DB.prepare('SELECT id FROM measurements WHERE order_id = ?').bind(order_id).first();
  if (existing) {
    await env.DB.prepare(`
      UPDATE measurements SET photos_json=?, measurements_json=?, room_summary_json=?, completed_at=?, measurer_name=?
      WHERE order_id=?
    `).bind(photosJson, measurementsJson, roomSummaryJson, completedAtVal, measurer_name || null, order_id).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO measurements (order_id, photos_json, measurements_json, room_summary_json, completed_at, measurer_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(order_id, photosJson, measurementsJson, roomSummaryJson, completedAtVal, measurer_name || null).run();
  }

  // Advance stage: Замер → Замер завершён
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(order_id).first();
  if (order && (order.stage === 'Замер' || order.stage === 'new')) {
    await env.DB.prepare(`
      UPDATE orders SET stage='Замер завершён', progress=20, status='in_progress', updated_at=datetime('now')
      WHERE id=?
    `).bind(order_id).run();

    await addHistory(order_id, 'Замер завершён', 'Замер выполнен и отправлен в офис',
      measurer_name || 'Замерщик', 'measurer', '', env);

    await addOrderNotification(order_id, order.order_number, order.client_name,
      'Замер завершён', 'Результаты замера получены. Готово к проектированию.', env);

    await addRoleNotification(order_id, order.order_number, order.client_name,
      'manager', `Замер завершён: ${order.order_number} — ${order.client_name}. Готово к проектированию.`,
      'completed', env);
  }

  return jsonResponse({ success: true });
}

async function getMeasurement(orderId, env) {
  await ensureSchema(env);
  const row = await env.DB.prepare('SELECT * FROM measurements WHERE order_id = ?').bind(orderId).first();
  if (!row) return jsonResponse(null);
  return jsonResponse({
    ...row,
    photos:       JSON.parse(row.photos_json       || '[]'),
    measurements: JSON.parse(row.measurements_json || '{}'),
    room_summary: JSON.parse(row.room_summary_json  || 'null'),
  });
}

// ─── Notification helpers ─────────────────────────────────────────────────────

async function addOrderNotification(orderId, orderNumber, clientName, title, message, env) {
  await env.DB.prepare(`
    INSERT INTO notifications (id, order_id, order_number, client_name, title, message, user_role, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'all', 'info', 0, datetime('now'))
  `).bind(crypto.randomUUID(), orderId, orderNumber, clientName, title, message).run();
}

async function addRoleNotification(orderId, orderNumber, clientName, userRole, message, type, env) {
  await env.DB.prepare(`
    INSERT INTO notifications (id, order_id, order_number, client_name, title, message, user_role, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).bind(crypto.randomUUID(), orderId, orderNumber, clientName, message, message, userRole, type).run();
}

async function addOrderHistoryEntry(id, request, env) {
  const body = await request.json();
  const { stage, action, performed_by, performed_by_role, notes } = body;
  await addHistory(id, stage || '', action || '', performed_by || '', performed_by_role || '', notes || '', env);
  return jsonResponse({ ok: true });
}

async function addHistory(orderId, stage, action, performedBy, performedByRole, notes, env) {
  await env.DB.prepare(`
    INSERT INTO order_history (id, order_id, stage, action, performed_by, performed_by_role, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(crypto.randomUUID(), orderId, stage, action, performedBy, performedByRole, notes).run();
}

// Legacy helper used by analyzePhoto/analyzeRoom
async function addNotification(orderId, title, message, env) {
  const order = await env.DB.prepare('SELECT order_number, client_name FROM orders WHERE id = ?').bind(orderId).first();
  await addOrderNotification(orderId, order?.order_number || '', order?.client_name || '', title, message, env);
}

// ─── AI: single photo analysis ────────────────────────────────────────────────

async function analyzePhoto(request, env) {
  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const body = await request.json();
  const { image, productType } = body;
  if (!image) return errorResponse('No image provided');

  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return errorResponse('Invalid image format — expected data URL');
  const [, mediaType, base64Data] = match;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mediaType)) return errorResponse(`Unsupported image type: ${mediaType}`);

  const prompt = `Ты опытный замерщик мебели с 10-летним стажем в Казахстане. Тебе дают фото помещения где будет устанавливаться: "${productType || 'мебель'}".

ТВОЯ ЗАДАЧА: сгенерировать точный список замеров как профессионал.

ОБЯЗАТЕЛЬНЫЕ ЗАМЕРЫ ДЛЯ ЛЮБОГО ПОМЕЩЕНИЯ:
- Ширина стены ГДЕ БУДЕТ СТОЯТЬ МЕБЕЛЬ в 3 точках: по плинтусу (низ), посередине, у потолка (верх) — это выявляет кривизну стен
- Высота потолка в 2-3 точках (углы могут отличаться)
- Глубина ниши/места под мебель

ЕСЛИ ВИДИШЬ ОКНО — ОБЯЗАТЕЛЬНО:
- Ширина оконного проёма
- Высота оконного проёма
- Высота подоконника от пола
- Глубина подоконника (выступает ли за стену — критично для кухни)
- Расстояние от края окна до левой стены
- Расстояние от края окна до правой стены

ЕСЛИ ВИДИШЬ БАТАРЕЮ/РАДИАТОР — ОБЯЗАТЕЛЬНО:
- Высота батареи от пола
- Ширина батареи
- Расстояние от батареи до стены
- Расстояние от батареи до окна

УГЛЫ — ВСЕГДА:
- Левый угол прямой? (замерить угольником или диагональю)
- Правый угол прямой? (замерить угольником или диагональю)
- Если углы непрямые — указать отклонение в мм

ЕСЛИ ПОМЕЩЕНИЕ В РЕМОНТЕ (видны голые стены, строительные материалы):
- Добавить предупреждение: учесть финишную отделку (+15-20мм к стенам, +30-50мм к полу)
- Замеры брать от чернового основания

АННОТАЦИИ НА ФОТО:
- Рисуй стрелки ←→ прямо на стене где будет мебель, в 3 точках (низ/середина/верх)
- Обводи окна синим прямоугольником
- Обводи батареи красным прямоугольником
- Отмечай углы желтыми точками с номерами
- Все координаты давай в долях от 0.0 до 1.0 (x1,y1 = левый верх, x2,y2 = правый низ)

КРИТИЧЕСКИ ВАЖНО для аннотаций:
НЕ рисуй стрелки по краям фотографии!
Анализируй реальную геометрию помещения на фото.

Примеры ПРАВИЛЬНЫХ аннотаций:
- Если видишь угловую нишу: стрелка от левого проёма до угла, отдельная стрелка от угла до правого проёма
- Если есть дверной проём слева: стрелка начинается от правого края проёма, а не от края фото
- Стрелки должны соединять РЕАЛЬНЫЕ архитектурные точки: угол стены, край проёма, край окна, трубу

Для угловой комнаты или ниши:
{"type": "arrow", "label": "До угла", "x1": 0.35, "y1": 0.5, "x2": 0.65, "y2": 0.5, "color": "white"}
{"type": "arrow", "label": "От угла", "x1": 0.65, "y1": 0.5, "x2": 0.9, "y2": 0.5, "color": "yellow"}

Для проёма слева:
x1 начинается от 0.25 (правый край проёма), а НЕ от 0.0

Смотри на фото и определяй реальные координаты объектов!

ВАЖНО: Если на фото строительный мусор или материалы — ИГНОРИРУЙ их, смотри на стены/пол/потолок под ними.

Respond with PURE JSON only. No markdown. No code blocks. Start with { end with }

{
  "annotations": [
    {"type": "arrow", "label": "Ширина (низ)", "x1": 0.1, "y1": 0.85, "x2": 0.9, "y2": 0.85, "color": "white"},
    {"type": "box", "label": "Окно", "x1": 0.05, "y1": 0.1, "x2": 0.2, "y2": 0.7, "color": "blue"},
    {"type": "point", "label": "①", "x": 0.08, "y": 0.5, "color": "yellow"}
  ],
  "measurements": [
    {"id": 1, "label": "Ширина стены (по плинтусу)", "unit": "см", "required": true, "hint": "Замерьте у самого пола по плинтусу"},
    {"id": 2, "label": "Ширина стены (середина)", "unit": "см", "required": true, "hint": "На высоте 120см от пола"},
    {"id": 3, "label": "Ширина стены (у потолка)", "unit": "см", "required": true, "hint": "У верхнего плинтуса потолка"},
    {"id": 4, "label": "Высота потолка (левый угол)", "unit": "см", "required": true},
    {"id": 5, "label": "Высота потолка (правый угол)", "unit": "см", "required": true},
    {"id": 6, "label": "Левый угол прямой?", "unit": "градус", "required": true, "hint": "Измерьте угольником или диагональю"},
    {"id": 7, "label": "Правый угол прямой?", "unit": "градус", "required": true}
  ],
  "warnings": [
    "Помещение в черновой отделке — добавьте 20мм на финишную штукатурку стен и 40мм на напольное покрытие"
  ]
}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000, stream: false,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
        { type: 'text', text: prompt },
      ]}],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return errorResponse(`Anthropic API error ${anthropicRes.status}: ${errText}`, 502);
  }

  const aiData = await anthropicRes.json();
  const text = aiData.content?.[0]?.text || '';
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return jsonResponse({ annotations: parsed.annotations || [], measurements: parsed.measurements || [], warnings: parsed.warnings || [] });
    }
  } catch {}
  return jsonResponse({ annotations: [], measurements: [], warnings: [`Не удалось разобрать ответ ИИ: ${text.slice(0, 100)}`] });
}

// ─── AI: multi-photo room analysis ───────────────────────────────────────────

const roomAnalysisCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

async function analyzeRoom(request, env) {
  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const body = await request.json();
  const { photos, furnitureType, orderNumber } = body;
  if (!photos || !photos.length) return errorResponse('No photos provided');

  const cacheKey = `${orderNumber}_${photos.length}_${photos.map(p => p.step).join(',')}`;
  const cached = roomAnalysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return jsonResponse(cached.result);

  const stepLabels = { entrance: 'Фото с порога (общий вид)', wall: 'Фото стены под мебель (фронтально)', corners: 'Фото угла комнаты', windows: 'Фото окна/проёма', obstacles: 'Фото препятствия (батарея/труба/розетка)' };
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const content = [];
  for (const photo of photos) {
    const match = photo.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) continue;
    const [, mediaType, base64Data] = match;
    if (!allowedTypes.includes(mediaType)) continue;
    content.push({ type: 'text', text: `--- ${stepLabels[photo.step] || photo.step} ---` });
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
  }
  if (!content.length) return errorResponse('No valid images');

  const prompt = `Ты эксперт-замерщик мебели с 15-летним опытом. Тебе дают ${photos.length} фотографий одного помещения. Мебель: "${furnitureType || 'мебель'}".

ТВОЯ ЗАДАЧА: изучи ВСЕ фото вместе и составь ЕДИНЫЙ точный список замеров.

ПОРЯДОК АНАЛИЗА:
1. Фото с порога → общая планировка, квадратура
2. Фото стены → где будет мебель, что мешает
3. Фото углов → прямые или нет
4. Фото окон → размеры окна и подоконника
5. Фото препятствий → батареи, трубы, розетки

ОБЯЗАТЕЛЬНО ОПРЕДЕЛИ:
- Площадь (~ШхГ в метрах, например '~12м²')
- Тип помещения (прихожая/кухня/комната/коридор)
- Состояние отделки (чистовая/черновая/в ремонте)
- Тип потолка (бетонный/натяжной/гипсокартон)
- Состояние стен (ровные/неровные)

ЗАМЕРЫ — СТЕНА (category: "Стена") — ВСЕГДА:
- Ширина по плинтусу (hint: "У самого пола вдоль плинтуса")
- Ширина на 120см (hint: "На высоте пояса")
- Ширина у потолка (hint: "У потолочного плинтуса")

ЗАМЕРЫ — ВЫСОТА (category: "Высота") — ВСЕГДА:
- Высота потолка левый угол
- Высота потолка правый угол

ЗАМЕРЫ — УГЛЫ (category: "Углы") — ВСЕГДА:
- Левый угол отклонение (hint: "Угольник или диагональ 1м×1м")
- Правый угол отклонение

ЗАМЕРЫ — ОКНО (category: "Окно") — ЕСЛИ ВИДИШЬ:
- Ширина проёма (низ/середина/верх)
- Высота проёма
- Высота подоконника от пола
- Глубина подоконника
- Расстояние до левой стены
- Расстояние до правой стены

ЗАМЕРЫ — ПРЕПЯТСТВИЯ (category: "Препятствия") — ЕСЛИ ВИДИШЬ:
- Высота батареи от пола до верха
- Ширина батареи
- Выступ батареи от стены

АННОТАЦИИ — рисуй на фото стены:
- white arrows: ширина (y=0.9 низ, y=0.5 середина, y=0.1 верх)
- blue box: окно (x1/y1/x2/y2)
- red box: батарея
- yellow points: углы ①②

ВАЖНО для координат аннотаций:
- Смотри на реальные границы стен на фото, учитывай перспективу
- Если видишь комнату в перспективе (3D вид), определи:
  * Фронтальная стена (дальняя) — рисуй стрелку ширины по ней
  * Левая боковая стена — рисуй стрелку глубины вдоль неё
  * Правая боковая стена — рисуй стрелку глубины вдоль неё
- НЕ рисуй стрелки по краям фотографии
- Для фронтальной стены видимой в центре фото:
  Ширина: x1=0.25, x2=0.75 (не от края до края!)
  Левая глубина: x1=0.05,y1=0.3 до x2=0.25,y2=0.5
  Правая глубина: x1=0.75,y1=0.5 до x2=0.95,y2=0.3

Примеры ПРАВИЛЬНЫХ аннотаций:
- Если видишь угловую нишу: стрелка от левого проёма до угла, отдельная стрелка от угла до правого проёма
- Если есть дверной проём слева: стрелка начинается от правого края проёма, а не от края фото
- Стрелки должны соединять РЕАЛЬНЫЕ архитектурные точки: угол стены, край проёма, край окна, трубу

Для угловой комнаты или ниши:
{"type": "arrow", "label": "До угла", "x1": 0.35, "y1": 0.5, "x2": 0.65, "y2": 0.5, "color": "white"}
{"type": "arrow", "label": "От угла", "x1": 0.65, "y1": 0.5, "x2": 0.9, "y2": 0.5, "color": "yellow"}

Для проёма слева:
x1 начинается от 0.25 (правый край проёма), а НЕ от 0.0

Смотри на фото и определяй реальные координаты объектов!

ПРЕДУПРЕЖДЕНИЯ:
- Черновая → 'Учесть финишную отделку: +20мм стены, +50мм пол'
- Натяжной потолок → 'Натяжной потолок — уточнить высоту до монтажа'
- Непрямые углы → 'Углы непрямые — проверить угольником'
- Выступающий подоконник → 'Подоконник выступает — ограничивает глубину мебели'
- Батарея под окном → 'Батарея под окном — учесть при проектировании'

Respond with PURE JSON only. No markdown. No explanation. Start with { end with }

{"room_summary":{"approximate_area":"~15м²","room_type":"Прихожая","finishing_state":"черновая","ceiling_type":"бетонный","walls_condition":"ровные"},"annotations":[{"type":"arrow","label":"Ширина (низ)","x1":0.05,"y1":0.9,"x2":0.95,"y2":0.9,"color":"white"},{"type":"arrow","label":"Ширина (середина)","x1":0.05,"y1":0.5,"x2":0.95,"y2":0.5,"color":"white"},{"type":"arrow","label":"Ширина (верх)","x1":0.05,"y1":0.1,"x2":0.95,"y2":0.1,"color":"white"},{"type":"point","label":"①","x":0.03,"y":0.5,"color":"yellow"},{"type":"point","label":"②","x":0.97,"y":0.5,"color":"yellow"}],"measurements":[{"id":1,"label":"Ширина стены (по плинтусу)","unit":"см","required":true,"hint":"У самого пола вдоль плинтуса","category":"Стена"},{"id":2,"label":"Ширина стены (на 120см)","unit":"см","required":true,"hint":"На высоте пояса","category":"Стена"},{"id":3,"label":"Ширина стены (у потолка)","unit":"см","required":true,"hint":"У потолочного плинтуса","category":"Стена"},{"id":4,"label":"Высота потолка (левый угол)","unit":"см","required":true,"category":"Высота"},{"id":5,"label":"Высота потолка (правый угол)","unit":"см","required":true,"category":"Высота"},{"id":6,"label":"Левый угол — отклонение","unit":"мм","required":true,"hint":"Угольник или диагональ 1м×1м","category":"Углы"},{"id":7,"label":"Правый угол — отклонение","unit":"мм","required":true,"hint":"Угольник","category":"Углы"}],"warnings":["Черновая отделка — добавьте 20мм на стены и 50мм на пол"]}`;

  content.push({ type: 'text', text: prompt });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, stream: false, messages: [{ role: 'user', content }] }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return errorResponse(`Anthropic API error ${anthropicRes.status}: ${errText}`, 502);
  }

  const aiData = await anthropicRes.json();
  const text = aiData.content?.[0]?.text || '';
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const result = { room_summary: parsed.room_summary || null, annotations: parsed.annotations || [], measurements: parsed.measurements || [], warnings: parsed.warnings || [] };
      roomAnalysisCache.set(cacheKey, { result, timestamp: Date.now() });
      return jsonResponse(result);
    }
  } catch {}
  return jsonResponse({ room_summary: null, annotations: [], measurements: [], warnings: ['Не удалось разобрать ответ ИИ'] });
}

// ─── Seed data ────────────────────────────────────────────────────────────────

async function seedData(env) {
  await ensureSchema(env);

  const orders = [
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2001',
      client_name: 'Бекова Айгуль Кайратовна', client_phone: '+7 (701) 234-56-78',
      client_email: 'bekova.ak@mail.ru', client_address: 'г. Актобе, ул. Маресьева, 15, кв. 34',
      product_type: 'Кухонный гарнитур', stage: 'Производство', status: 'in_progress', progress: 60,
      total_price: 350000, paid_amount: 175000, delivery_date: '2026-04-20',
      description: 'Угловая кухня 3.2×2.4 м, фасады МДФ эмаль белая матовая, столешница кварцевый агломерат, фурнитура Blum',
      notes: 'Встроенная посудомойка и духовой шкаф за счёт клиента',
      portal_token: 'aktobe001tok2001aa',
      assigned_designer: 'Данияр Сейтжанов', assigned_measurer: 'Арман Токтаров',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2002',
      client_name: 'Исмаилов Нурлан Серикович', client_phone: '+7 (702) 345-67-89',
      client_email: 'ismail.ns@gmail.com', client_address: 'г. Актобе, пр. Абилкайыр хана, 78, кв. 12',
      product_type: 'Шкаф-купе', stage: 'Замер завершён', status: 'in_progress', progress: 20,
      total_price: 185000, paid_amount: 55500, delivery_date: '2026-05-15',
      description: 'Встроенный шкаф-купе 3 м, 3 секции, зеркальные двери с пескоструем, внутренняя LED-подсветка',
      notes: 'Цвет корпуса венге, зеркала тонированные',
      portal_token: 'aktobe002tok2002bb',
      assigned_measurer: 'Арман Токтаров',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2003',
      client_name: 'Тлеубаев Арман Жаксыбеков', client_phone: '+7 (705) 456-78-90',
      client_email: 'tleubayev@yandex.ru', client_address: 'г. Актобе, ул. Братьев Жубановых, 32',
      product_type: 'Прихожая', stage: 'Новый', status: 'new', progress: 0,
      total_price: 145000, paid_amount: 0, delivery_date: '2026-06-01',
      description: 'Прихожая с зеркалом во всю стену, вешалка, тумба для обуви на 25 пар. Белый матовый + ясень',
      notes: 'Узкий коридор — ширина 1.05 м, нужен выезд замерщика',
      portal_token: 'aktobe003tok2003cc',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2004',
      client_name: 'Сейткали Зарина Маратовна', client_phone: '+7 (707) 567-89-01',
      client_email: 'seitkali.zm@mail.ru', client_address: 'г. Актобе, мкр Мирас, дом 45, кв. 89',
      product_type: 'Гардеробная', stage: 'Проектирование', status: 'in_progress', progress: 30,
      total_price: 420000, paid_amount: 126000, delivery_date: '2026-05-10',
      description: 'Гардеробная 2.5×2.0 м с встроенной подсветкой, выдвижными ящиками, полками для обуви, зоной для аксессуаров',
      notes: 'Клиент хочет пудровый розовый цвет + золотая фурнитура',
      portal_token: 'aktobe004tok2004dd',
      assigned_measurer: 'Арман Токтаров', assigned_designer: 'Данияр Сейтжанов',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2005',
      client_name: 'Ахметов Данияр Болатович', client_phone: '+7 (708) 678-90-12',
      client_email: 'akhmetov.db@gmail.com', client_address: 'г. Актобе, ул. Санкибай батыра, 12, кв. 5',
      product_type: 'Детская комната', stage: 'Согласование', status: 'in_progress', progress: 45,
      total_price: 280000, paid_amount: 84000, delivery_date: '2026-04-30',
      description: 'Детская для двух мальчиков 7 и 10 лет: двухъярусная кровать, 2 рабочих места, стеллаж, шкаф. Тема — футбол',
      notes: 'Нужна подсветка под кроватью и рабочими столами',
      portal_token: 'aktobe005tok2005ee',
      assigned_measurer: 'Арман Токтаров', assigned_designer: 'Данияр Сейтжанов',
      constructor_config: JSON.stringify({
        variants: [
          { name: 'ЭКОНОМ', price: 195000, corpus: 'ЛДСП Egger 16мм', facade: 'Плёнка ПВХ', hardware: 'Hettich' },
          { name: 'СТАНДАРТ', price: 280000, corpus: 'ЛДСП Egger 18мм', facade: 'Эмаль матовая', hardware: 'Häfele' },
          { name: 'ПРЕМИУМ', price: 390000, corpus: 'МДФ крашеный', facade: 'Шпон натуральный', hardware: 'Blum' },
        ],
      }),
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2006',
      client_name: 'Жумабаева Гульнар Ерлановна', client_phone: '+7 (747) 789-01-23',
      client_email: 'zhumabayeva@mail.ru', client_address: 'г. Актобе, ул. Алматинская, 67, кв. 21',
      product_type: 'Спальня', stage: 'Производство', status: 'in_progress', progress: 60,
      total_price: 520000, paid_amount: 260000, delivery_date: '2026-04-25',
      description: 'Спальный гарнитур: кровать 1.8×2 м с мягким изголовьем, 2 тумбы, комод с зеркалом, шкаф-купе 4-дверный. Итальянский орех',
      notes: 'Доставка и подъём на 7 этаж без лифта — нужна бригада',
      portal_token: 'aktobe006tok2006ff',
      assigned_measurer: 'Арман Токтаров', assigned_designer: 'Данияр Сейтжанов',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2007',
      client_name: 'Кабылов Руслан Айтенович', client_phone: '+7 (771) 890-12-34',
      client_email: 'kabyl.ra@yandex.ru', client_address: 'г. Актобе, пр. 312 стрелковой дивизии, 89',
      product_type: 'Кухонный гарнитур', stage: 'Готово', status: 'ready', progress: 80,
      total_price: 680000, paid_amount: 510000, delivery_date: '2026-03-20',
      description: 'Кухня-студия 4.2 м с островом, фасады акриловые белые, столешница из искусственного камня, встроенная техника Bosch',
      notes: 'Остров на колёсах — можно сдвигать. Монтаж в приоритете!',
      portal_token: 'aktobe007tok2007gg',
      assigned_measurer: 'Арман Токтаров', assigned_designer: 'Данияр Сейтжанов', assigned_installer: 'Серик Байжанов',
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-2008',
      client_name: 'Мусина Алтынай Серикпаевна', client_phone: '+7 (775) 901-23-45',
      client_email: 'musina.as@gmail.com', client_address: 'г. Актобе, ул. Байтурсынова, 23, офис 301',
      product_type: 'Офисная мебель', stage: 'Завершён', status: 'delivered', progress: 100,
      total_price: 850000, paid_amount: 850000, delivery_date: '2026-03-10',
      description: 'Оснащение офиса на 8 рабочих мест: столы, стеллажи, ресепшн, переговорная. Корпоративный стиль, серый + дуб',
      notes: 'Установлено 10 марта, акт подписан. Клиент полностью доволен.',
      portal_token: 'aktobe008tok2008hh',
      assigned_measurer: 'Арман Токтаров', assigned_designer: 'Данияр Сейтжанов', assigned_installer: 'Серик Байжанов',
    },
  ];

  for (const order of orders) {
    const existing = await env.DB.prepare('SELECT id FROM orders WHERE order_number = ?').bind(order.order_number).first();
    if (!existing) {
      await env.DB.prepare(`
        INSERT INTO orders (id, order_number, client_name, client_phone, client_email, client_address,
          product_type, description, status, progress, stage, total_price, paid_amount,
          portal_token, notes, delivery_date, assigned_measurer, assigned_designer, assigned_installer,
          constructor_config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          datetime('now', '-' || ? || ' days'), datetime('now'))
      `).bind(
        order.id, order.order_number, order.client_name, order.client_phone, order.client_email,
        order.client_address, order.product_type, order.description, order.status, order.progress,
        order.stage, order.total_price, order.paid_amount, order.portal_token, order.notes,
        order.delivery_date, order.assigned_measurer || null, order.assigned_designer || null,
        order.assigned_installer || null, order.constructor_config || null,
        String(Math.floor(Math.random() * 45))
      ).run();

      // Seed notifications and history
      const notifs = [
        { title: 'Заказ создан', msg: `Заказ ${order.order_number} принят в работу` },
      ];
      if (order.progress >= 10) notifs.push({ title: 'Этап: Замер', msg: 'Замерщик выехал на объект' });
      if (order.progress >= 20) notifs.push({ title: 'Замер завершён', msg: 'Результаты замера получены и загружены' });
      if (order.progress >= 30) notifs.push({ title: 'Этап: Проектирование', msg: 'Дизайнер приступил к разработке проекта' });
      if (order.progress >= 45) notifs.push({ title: 'Этап: Согласование', msg: 'КП отправлено клиенту на согласование' });
      if (order.progress >= 60) notifs.push({ title: 'Этап: Производство', msg: 'Заказ передан в производство' });
      if (order.progress >= 80) notifs.push({ title: 'Готово к монтажу', msg: 'Мебель изготовлена и проверена ОТК' });
      if (order.progress >= 90) notifs.push({ title: 'Этап: Монтаж', msg: 'Бригада монтажников выехала на объект' });
      if (order.status === 'delivered') notifs.push({ title: 'Заказ завершён', msg: 'Мебель установлена, акт подписан' });

      for (let i = 0; i < notifs.length; i++) {
        await env.DB.prepare(`
          INSERT INTO notifications (id, order_id, order_number, client_name, title, message, user_role, type, read, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'all', 'info', 0, datetime('now', '-' || ? || ' hours'))
        `).bind(
          crypto.randomUUID(), order.id, order.order_number, order.client_name,
          notifs[i].title, notifs[i].msg, String((notifs.length - i) * 24)
        ).run();
      }

      // Role notification for manager
      await addRoleNotification(order.id, order.order_number, order.client_name,
        'manager', `Заказ ${order.order_number} — ${order.client_name}: этап «${order.stage}»`, 'info', env);
    }
  }

  // Seed test employees
  const testUsers = [
    { name: 'Арман Токтаров',    role: 'Замерщик',   phone: '+7 (701) 111-11-01' },
    { name: 'Сайлау Нурмагамбетов', role: 'Замерщик', phone: '+7 (701) 111-11-02' },
    { name: 'Данияр Сейтжанов',  role: 'Дизайнер',   phone: '+7 (701) 222-22-01' },
    { name: 'Айгуль Жаксыбекова', role: 'Дизайнер',  phone: '+7 (701) 222-22-02' },
    { name: 'Серик Байжанов',    role: 'Монтажник',   phone: '+7 (701) 333-33-01' },
    { name: 'Нурлан Ержанов',    role: 'Монтажник',   phone: '+7 (701) 333-33-02' },
    { name: 'Болат Сейткали',    role: 'Снабженец',   phone: '+7 (701) 444-44-01' },
    { name: 'Ержан Мусин',       role: 'Технолог',    phone: '+7 (701) 555-55-01' },
    { name: 'Марат Ахметов',     role: 'Сборщик',     phone: '+7 (701) 666-66-01' },
    { name: 'Алтынай Бекова',    role: 'Бухгалтер',   phone: '+7 (701) 777-77-01' },
  ];
  for (const u of testUsers) {
    const exists = await env.DB.prepare('SELECT id FROM users WHERE name = ? AND role = ?').bind(u.name, u.role).first();
    if (!exists) {
      await env.DB.prepare(
        'INSERT INTO users (id, name, phone, role, is_active, created_at) VALUES (?, ?, ?, ?, 1, datetime("now"))'
      ).bind(crypto.randomUUID(), u.name, u.phone, u.role).run();
    }
  }

  return jsonResponse({ success: true, message: `Загружено ${orders.length} тестовых заказов + ${testUsers.length} сотрудников (Актобе)` });
}

// ─── Clients ──────────────────────────────────────────────────────────────────

async function getClients(request, env) {
  await ensureSchema(env);
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const filter = url.searchParams.get('filter') || 'all'; // all | active | imported

  let query = 'SELECT * FROM clients';
  const params = [], conditions = [];

  if (filter === 'imported') { conditions.push("source != 'manual'"); }
  else if (filter === 'active') {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    conditions.push('last_order_date >= ?'); params.push(oneYearAgo);
  }
  if (search) {
    conditions.push('(name LIKE ? OR phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY total_amount DESC';

  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(result.results || []);
}

async function getClient(id, env) {
  await ensureSchema(env);
  const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  if (!client) return errorResponse('Client not found', 404);

  // Get client orders by phone or name
  const orders = await env.DB.prepare(
    'SELECT * FROM orders WHERE client_phone = ? OR client_name = ? ORDER BY created_at DESC'
  ).bind(client.phone || '', client.name || '').all();

  return jsonResponse({ ...client, orders: orders.results || [] });
}

// ─── AI: Import Analysis ──────────────────────────────────────────────────────

async function analyzeImport(request, env) {
  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const body = await request.json();
  const { rows, filename, text: inputText, image_base64, image_type } = body;

  const systemPrompt = `Ты эксперт по миграции данных мебельных компаний с 15-летним опытом.

Тебе могут дать данные в ЛЮБОМ формате:
- Таблица из CRM (Битрикс24, amoCRM, 1С)
- Excel таблица с заказами
- Текст из Word документа
- Фото рукописной тетради (OCR текст)
- Просто список клиентов

ТВОЯ ЗАДАЧА: извлечь максимум полезной информации и структурировать её.

Ищи любые упоминания:
- Имена клиентов (Иванов, Асем, Болат и т.д.)
- Телефоны (казахстанские +7 или 8, российские)
- Адреса (улица, дом, квартира)
- Типы мебели (кухня, шкаф, диван, стол и т.д.)
- Суммы (тенге, рубли, у.е.)
- Даты (любой формат)
- Статусы (выполнен, в работе, аванс, оплачен)

АНАЛИТИКА которую нужно извлечь:
- Сколько уникальных клиентов
- Период данных (с какого по какой год)
- Самые популярные типы мебели
- Средний чек если есть суммы
- Топ клиенты по количеству заказов
- Динамика по годам если есть даты

ВАЖНО: даже если данные грязные, неструктурированные, на русском/казахском языке — всё равно извлеки максимум.

Отвечай ТОЛЬКО чистым JSON без markdown:
{
  "source_type": "bitrix24|amocrm|excel|word|handwritten|unknown",
  "data_quality": {
    "total_records": 150,
    "recognized_clients": 142,
    "recognized_orders": 138,
    "date_range": "2015-2025",
    "data_completeness": 85
  },
  "column_mapping": {
    "client_name": "название колонки или null",
    "client_phone": "...",
    "client_email": "...",
    "client_address": "...",
    "furniture_type": "...",
    "amount": "...",
    "order_date": "...",
    "status": "...",
    "notes": "..."
  },
  "analytics": {
    "top_clients": [
      {"name": "Болат Сейткали", "orders": 5, "total_amount": 2500000}
    ],
    "popular_furniture": [
      {"type": "Кухня", "count": 45, "percentage": 30}
    ],
    "average_check": 350000,
    "orders_by_year": [
      {"year": 2020, "count": 23, "revenue": 8050000}
    ],
    "peak_months": ["Март", "Сентябрь", "Октябрь"],
    "total_revenue": 45000000,
    "business_age_years": 10
  },
  "recommendations": [
    "База содержит 10 лет истории — отличная основа для аналитики",
    "Средний чек вырос на 40% за последние 3 года",
    "Кухни — основной продукт (30% заказов)"
  ],
  "migration_summary": "Найдено 142 клиента и 138 заказов за период 2015-2025."
}`;

  let userDataText = '';
  let contentArr = [];

  if (image_base64 && image_type) {
    // Step 1: OCR via Claude Vision
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image_type)) return errorResponse('Unsupported image type');

    const ocrRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image_type, data: image_base64 } },
            { type: 'text', text: 'Извлеки ВЕСЬ текст с этого изображения. Сохрани структуру, числа, имена точно как написано. Просто выведи текст без комментариев.' },
          ],
        }],
      }),
    });
    if (!ocrRes.ok) return errorResponse(`OCR error ${ocrRes.status}`);
    const ocrData = await ocrRes.json();
    userDataText = `[Рукописная база, извлечено OCR]\nФайл: ${filename || 'image'}\n\nРаспознанный текст:\n${ocrData.content?.[0]?.text || ''}`;
    contentArr = [{ type: 'text', text: systemPrompt + '\n\n' + userDataText }];
  } else if (inputText) {
    userDataText = `Файл: ${filename || 'document'}\n\nСодержимое документа:\n${inputText.slice(0, 15000)}`;
    contentArr = [{ type: 'text', text: systemPrompt + '\n\n' + userDataText }];
  } else if (rows && Array.isArray(rows) && rows.length > 0) {
    const sample = rows.slice(0, 50);
    userDataText = `Файл: ${filename || 'import.csv'}\nВсего строк в файле: ${rows.length}\n\nПервые 50 строк данных:\n${JSON.stringify(sample, null, 2)}`;
    contentArr = [{ type: 'text', text: systemPrompt + '\n\n' + userDataText }];
  } else {
    return errorResponse('No data provided');
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: contentArr }] }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return errorResponse(`Anthropic API error ${anthropicRes.status}: ${errText}`, 502);
  }

  const aiData = await anthropicRes.json();
  const text = aiData.content?.[0]?.text || '';
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Add OCR flag if image was processed
      if (image_base64) parsed._ocr = true;
      return jsonResponse(parsed);
    }
  } catch (e) {}
  return errorResponse(`Не удалось разобрать ответ ИИ: ${text.slice(0, 200)}`);
}

// ─── Import Data ──────────────────────────────────────────────────────────────

async function importData(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { rows, column_mapping, skip_duplicates, clients_only } = body;
  if (!rows || !Array.isArray(rows)) return errorResponse('No rows provided');

  const now = new Date().toISOString();
  let imported_clients = 0, imported_orders = 0, skipped_duplicates = 0;

  for (const row of rows) {
    const name = column_mapping.client_name ? (row[column_mapping.client_name] || '') : '';
    const phone = column_mapping.client_phone ? (row[column_mapping.client_phone] || '') : '';
    const email = column_mapping.client_email ? (row[column_mapping.client_email] || '') : '';
    const address = column_mapping.client_address ? (row[column_mapping.client_address] || '') : '';
    const amount = column_mapping.amount ? parseFloat(row[column_mapping.amount]) || 0 : 0;
    const orderDate = column_mapping.order_date ? (row[column_mapping.order_date] || now) : now;
    const furnitureType = column_mapping.furniture_type ? (row[column_mapping.furniture_type] || '') : '';
    const notes = column_mapping.notes ? (row[column_mapping.notes] || '') : '';

    if (!name && !phone) continue;

    // Upsert client
    let existing = null;
    if (phone) {
      existing = await env.DB.prepare('SELECT * FROM clients WHERE phone = ?').bind(phone).first();
    }
    if (!existing && name) {
      existing = await env.DB.prepare('SELECT * FROM clients WHERE name = ?').bind(name).first();
    }

    if (existing && skip_duplicates) { skipped_duplicates++; continue; }

    if (!existing) {
      const clientId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO clients (id, name, phone, email, address, notes, source, total_orders, total_amount, last_order_date, imported_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'crm_import', 0, 0, ?, ?, ?)
      `).bind(clientId, name, phone, email, address, notes, orderDate.slice(0, 10), now, now).run();
      existing = { id: clientId, name, phone, total_orders: 0, total_amount: 0 };
      imported_clients++;
    }

    if (!clients_only && (furnitureType || amount > 0)) {
      const orderId = crypto.randomUUID();
      const token = Math.random().toString(36).slice(2, 18);
      const orderNum = 'ИМП-' + Date.now().toString(36).toUpperCase().slice(-6);
      await env.DB.prepare(`
        INSERT INTO orders (id, order_number, client_name, client_phone, client_email, client_address, product_type, total_price, status, stage, progress, notes, portal_token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'delivered', 'Завершён', 100, ?, ?, ?, ?)
      `).bind(orderId, orderNum, name, phone, email, address, furnitureType, amount, notes, token, orderDate, now).run();
      imported_orders++;

      // Update client stats
      await env.DB.prepare(`
        UPDATE clients SET total_orders = total_orders + 1, total_amount = total_amount + ?, last_order_date = ? WHERE id = ?
      `).bind(amount, orderDate.slice(0, 10), existing.id).run();
    }
  }

  return jsonResponse({ success: true, imported_clients, imported_orders, skipped_duplicates });
}

// ─── Enhanced Analytics ───────────────────────────────────────────────────────

async function getAnalytics(env) {
  try {
    await ensureSchema(env);
  } catch (e) {
    console.error('getAnalytics ensureSchema error:', e.message, e.stack);
    // return empty analytics rather than 500
    return jsonResponse({ kpi: { total_clients: 0, active_clients: 0, average_check: 0, total_revenue: 0, total_orders: 0 }, orders_by_month: [], orders_by_year: [], popular_furniture: [], top_clients: [], status_breakdown: {} });
  }

  let ordersRes, clientsRes;
  try {
    [ordersRes, clientsRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM orders').all(),
      env.DB.prepare('SELECT * FROM clients').all(),
    ]);
  } catch (e) {
    console.error('getAnalytics query error:', e.message, e.stack);
    return jsonResponse({ kpi: { total_clients: 0, active_clients: 0, average_check: 0, total_revenue: 0, total_orders: 0 }, orders_by_month: [], orders_by_year: [], popular_furniture: [], top_clients: [], status_breakdown: {} });
  }

  const orders = ordersRes.results || [];
  const clients = clientsRes.results || [];

  const totalRevenue = orders.reduce((s, o) => s + (o.total_price || 0), 0);
  const avgCheck = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const activeClients = clients.filter(c => c.last_order_date && c.last_order_date >= oneYearAgo).length;

  // Orders by month (last 12)
  const monthMap = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, count: 0, revenue: 0 };
  }
  for (const o of orders) {
    if (!o.created_at) continue;
    const key = o.created_at.slice(0, 7);
    if (monthMap[key]) {
      monthMap[key].count++;
      monthMap[key].revenue += o.total_price || 0;
    }
  }

  // Orders by year
  const yearMap = {};
  for (const o of orders) {
    if (!o.created_at) continue;
    const y = o.created_at.slice(0, 4);
    if (!yearMap[y]) yearMap[y] = { year: y, count: 0, revenue: 0 };
    yearMap[y].count++;
    yearMap[y].revenue += o.total_price || 0;
  }

  // Popular furniture types
  const typeMap = {};
  for (const o of orders) {
    const t = o.product_type || 'Другое';
    if (!typeMap[t]) typeMap[t] = 0;
    typeMap[t]++;
  }
  const popularFurniture = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count, percentage: Math.round(count / orders.length * 100) }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  // Top 10 clients
  const topClients = [...clients]
    .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
    .slice(0, 10)
    .map(c => ({ id: c.id, name: c.name, phone: c.phone, total_orders: c.total_orders, total_amount: c.total_amount, last_order_date: c.last_order_date }));

  // Status breakdown
  const statusMap = {};
  for (const o of orders) {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  }

  return jsonResponse({
    kpi: {
      total_clients: clients.length,
      active_clients: activeClients,
      average_check: avgCheck,
      total_revenue: totalRevenue,
      total_orders: orders.length,
    },
    orders_by_month: Object.values(monthMap),
    orders_by_year: Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year)),
    popular_furniture: popularFurniture,
    top_clients: topClients,
    status_breakdown: statusMap,
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

async function getLeads(request, env) {
  try {
    await ensureSchema(env);
  } catch (e) {
    console.error('getLeads ensureSchema error:', e.message, e.stack);
    return jsonResponse([]);
  }
  const url = new URL(request.url);
  const stage = url.searchParams.get('stage');
  const search = url.searchParams.get('search');

  let query = 'SELECT * FROM leads';
  const params = [], conditions = [];
  if (stage && stage !== 'all') { conditions.push('stage = ?'); params.push(stage); }
  if (search) { conditions.push('(client_name LIKE ? OR client_phone LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  try {
    const result = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse(result.results || []);
  } catch (e) {
    console.error('getLeads query error:', e.message, e.stack);
    return jsonResponse([]);
  }
}

async function getLead(id, env) {
  await ensureSchema(env);
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  if (!lead) return errorResponse('Lead not found', 404);
  const history = await env.DB.prepare('SELECT * FROM lead_history WHERE lead_id = ? ORDER BY created_at DESC').bind(id).all();
  return jsonResponse({ ...lead, history: history.results || [] });
}

async function createLead(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { client_name, client_phone, source, furniture_type, budget_range, responsible, next_action, next_action_date, notes } = body;
  if (!client_name) return errorResponse('client_name required');

  await env.DB.prepare(`
    INSERT INTO leads (id, client_name, client_phone, source, furniture_type, budget_range, status, stage, responsible, next_action, next_action_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', 'new', ?, ?, ?, ?, ?, ?)
  `).bind(id, client_name, client_phone || '', source || 'other', furniture_type || '', budget_range || '', responsible || '', next_action || '', next_action_date || '', notes || '', now, now).run();

  // Add creation history entry
  await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, 'Лид создан', responsible || 'Менеджер', `Источник: ${source || 'other'}, Тип мебели: ${furniture_type || '—'}`, now).run();

  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  return jsonResponse(lead, 201);
}

async function updateLead(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  if (!lead) return errorResponse('Lead not found', 404);

  const fields = ['client_name', 'client_phone', 'source', 'furniture_type', 'budget_range', 'stage', 'responsible', 'next_action', 'next_action_date', 'notes', 'status'];
  const updates = [], params = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (updates.length === 0) return jsonResponse(lead);
  updates.push('updated_at = ?'); params.push(now); params.push(id);

  await env.DB.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  // Log stage change
  if (body.stage && body.stage !== lead.stage) {
    await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, `Этап изменён: ${lead.stage} → ${body.stage}`, body.performed_by || 'Менеджер', body.notes || '', now).run();
  }

  const updated = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  return jsonResponse(updated);
}

async function addLeadAction(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const { action, performed_by, notes } = body;
  if (!action) return errorResponse('action required');

  await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, action, performed_by || 'Менеджер', notes || '', now).run();

  // Update next_action if provided
  if (body.next_action !== undefined) {
    await env.DB.prepare('UPDATE leads SET next_action = ?, next_action_date = ?, updated_at = ? WHERE id = ?')
      .bind(body.next_action || '', body.next_action_date || '', now, id).run();
  }

  return jsonResponse({ success: true });
}

async function convertLead(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();

  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  if (!lead) return errorResponse('Lead not found', 404);

  // Create order from lead
  const orderId = crypto.randomUUID();
  const token = Math.random().toString(36).slice(2, 18);
  const orderNum = 'ФФ-' + Math.floor(Math.random() * 9000 + 1000);

  await env.DB.prepare(`
    INSERT INTO orders (id, order_number, client_name, client_phone, product_type, status, stage, progress, portal_token, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'new', 'Новый', 0, ?, ?, ?, ?)
  `).bind(orderId, orderNum, lead.client_name, lead.client_phone || '', lead.furniture_type || '', token, `Создан из лида. Бюджет: ${lead.budget_range || '—'}`, now, now).run();

  // Mark lead as converted
  await env.DB.prepare("UPDATE leads SET stage = 'converted', status = 'won', updated_at = ? WHERE id = ?").bind(now, id).run();
  await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, 'Конвертирован в заказ', body.performed_by || 'Менеджер', `Заказ ${orderNum} создан`, now).run();

  return jsonResponse({ success: true, order_id: orderId, order_number: orderNum });
}

// ─── Configurations ───────────────────────────────────────────────────────────

async function saveConfiguration(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { order_id, lead_id, furniture_type, selected_variant, corpus_material, facade_material, hardware, options_json, total_econom, total_standart, total_premium } = body;

  await env.DB.prepare(`
    INSERT INTO configurations (id, order_id, lead_id, furniture_type, selected_variant, corpus_material, facade_material, hardware, options_json, total_econom, total_standart, total_premium, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, order_id || null, lead_id || null, furniture_type || '', selected_variant || '', corpus_material || '', facade_material || '', hardware || '', options_json ? JSON.stringify(options_json) : '[]', total_econom || 0, total_standart || 0, total_premium || 0, now).run();

  return jsonResponse({ id, success: true }, 201);
}

async function getConfiguration(id, env) {
  await ensureSchema(env);
  const config = await env.DB.prepare('SELECT * FROM configurations WHERE id = ?').bind(id).first();
  if (!config) return errorResponse('Configuration not found', 404);
  if (config.options_json) {
    try { config.options = JSON.parse(config.options_json); } catch {}
  }
  return jsonResponse(config);
}

// ─── Pricelist & Catalog handlers ─────────────────────────────────────────────

// Heuristic extraction fallback when AI returns 0 items
function extractItemsHeuristic(rows) {
  if (!rows || rows.length === 0) return [];
  const cols = Object.keys(rows[0]);
  if (cols.length < 2) return [];

  // Find name column: contains text, not all numbers
  const nameCol = cols.find(c => {
    const vals = rows.slice(0, 10).map(r => String(r[c] || ''));
    const textVals = vals.filter(v => v.length > 3 && isNaN(parseFloat(v.replace(/[\s,]/g, ''))));
    return textVals.length > 5;
  }) || cols[0];

  // Find price column: numeric values > 10
  const priceCol = cols.find(c => c !== nameCol && (() => {
    const vals = rows.slice(0, 20).map(r => parseFloat(String(r[c] || '').replace(/[\s,]/g, '')));
    const nums = vals.filter(v => !isNaN(v) && v > 10);
    return nums.length > 5;
  })()) || cols.find(c => {
    const v = String(rows[0]?.[c] || '');
    return !isNaN(parseFloat(v.replace(/[\s,]/g, '')));
  });

  // Find unit column
  const unitCol = cols.find(c => {
    const vals = rows.slice(0, 20).map(r => String(r[c] || '').toLowerCase());
    return vals.some(v => /шт|м²|пог|компл|лист|м\.п|п\.м/.test(v));
  });

  // Find article column
  const articleCol = cols.find(c => c !== nameCol && c !== priceCol && (() => {
    const name = c.toLowerCase();
    return name.includes('артик') || name.includes('код') || name.includes('арт');
  })());

  if (!nameCol || !priceCol) return [];

  return rows
    .filter(row => row[nameCol] && String(row[nameCol]).trim().length > 2)
    .map(row => ({
      name: String(row[nameCol] || '').trim(),
      article: articleCol ? String(row[articleCol] || '') : '',
      price: parseFloat(String(row[priceCol] || '0').replace(/[\s,]/g, '')) || 0,
      unit: unitCol ? String(row[unitCol] || 'шт').trim() : 'шт',
      category: 'другое',
      supplier: '',
      currency: 'KZT',
    }))
    .filter(item => item.name && item.price > 0)
    .slice(0, 2000);
}

async function analyzePricelist(request, env) {
  const body = await request.json();

  console.log(`analyzePricelist: filename=${body.filename}, text_len=${body.text?.length || 0}, rows=${body.rows?.length || 0}`);

  const systemPrompt = `Ты эксперт по анализу данных для мебельных компаний.

ШАГ 1 — ОПРЕДЕЛИ ТИП ФАЙЛА:
- ПРАЙС-ЛИСТ: содержит товары/артикулы/цены — колонки "Товар", "Наименование", "Артикул", "Цена", "Ед.изм", "Розничная цена"
- CRM ДАННЫЕ: содержит клиентов/заказы — колонки "Имя", "Телефон", "Клиент", "Заказ", "Дата", "ФИО"
- СМЕШАННЫЙ (mixed): содержит и то, и другое

ШАГ 2 — СОПОСТАВЛЕНИЕ КОЛОНОК (для Excel/CSV на русском):
Прайс-лист:
  "Товар", "Наименование", "Название" → name
  "Розничная цена", "Цена", "Стоимость", "Цена, тнг" → price
  "Ед. измерения", "Ед.изм.", "Единица", "Ед" → unit
  "Артикул", "Код", "Код товара" → article
  "Доступный остаток", "Остаток" → ИГНОРИРУЙ
CRM данные:
  "Имя", "ФИО", "Клиент", "Заказчик", "Имя клиента" → client_name
  "Телефон", "Тел", "Phone", "Моб" → client_phone
  "Email", "Эл. почта" → client_email
  "Адрес", "Улица", "Город" → client_address
  "Тип мебели", "Изделие", "Продукт" → furniture_type
  "Сумма", "Цена", "Стоимость", "Итого" → amount
  "Дата", "Дата заказа", "Создан" → order_date
  "Статус", "Состояние" → status

ШАГ 3 — ИЗВЛЕКИ ДАННЫЕ:
Для прайса: все позиции с name/article/category/supplier/unit/price/currency
Категории: фурнитура/петли/направляющие/ЛДСП/кромка/плиты/погонные материалы/фасады/столешницы/ручки/подсветка/крепёж/другое
Поставщик: определи из контекста (Blum, Hettich, Häfele, Egger, Kronospan и т.д.)
Из имени файла: Смета_Кромка→кромка, Смета_Плиты→ЛДСП, Смета_Фурнитура→фурнитура, export.xls→Blum

Отвечай ТОЛЬКО чистым JSON без markdown:
{
  "data_type": "pricelist",
  "supplier": "Blum Kazakhstan",
  "price_date": "2026-01",
  "currency": "KZT",
  "total_positions": 245,
  "categories_found": ["фурнитура", "петли"],
  "column_mapping": {"client_name": null, "client_phone": null, "amount": null, "order_date": null},
  "items": [
    {"name": "Blum Tandembox M83 белый", "article": "378M3502SA", "category": "фурнитура", "supplier": "Blum", "unit": "компл.", "price": 45000, "currency": "KZT"}
  ],
  "summary": "Прайс Blum — 245 позиций фурнитуры"
}
Если CRM: data_type="crm", items=[], column_mapping={...все поля...}
Если mixed: data_type="mixed", заполни и items, и column_mapping`;

  let messages = [];

  if (body.image_base64) {
    messages = [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: body.image_type || 'image/jpeg', data: body.image_base64 } },
        { type: 'text', text: 'Это прайс-лист или данные клиентов. Определи тип и извлеки все данные.' }
      ]
    }];
  } else {
    const text = body.text || body.pdf_text || '';
    const filename = body.filename ? `Имя файла: ${body.filename}\n\n` : '';
    messages = [{ role: 'user', content: `${filename}Содержимое файла:\n\n${text.slice(0, 60000)}` }];
  }

  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages,
    }),
  });

  const aiData = await aiResp.json();
  const raw = aiData.content?.[0]?.text || '{}';
  console.log(`analyzePricelist AI response length: ${raw.length}`);

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    parsed = { data_type: 'pricelist', supplier: 'Неизвестный', items: [], total_positions: 0, categories_found: [], summary: raw.slice(0, 200) };
  }

  // Fallback: if AI returned 0 items but we have rows, use heuristic extraction
  if ((!parsed.items || parsed.items.length === 0) && body.rows && Array.isArray(body.rows) && body.rows.length > 0) {
    console.log(`AI returned 0 items, trying heuristic extraction on ${body.rows.length} rows`);
    const heuristicItems = extractItemsHeuristic(body.rows);
    if (heuristicItems.length > 0) {
      parsed.items = heuristicItems;
      parsed.total_positions = heuristicItems.length;
      parsed.data_type = parsed.data_type || 'pricelist';
      console.log(`Heuristic extracted ${heuristicItems.length} items`);
    }
  }

  return jsonResponse(parsed);
}

async function getPricelists(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare("SELECT * FROM pricelists WHERE status = 'active' ORDER BY created_at DESC").all();
  return jsonResponse(result.results || []);
}

async function savePricelist(request, env) {
  try {
    await ensureSchema(env);
  } catch (e) {
    console.error('savePricelist ensureSchema error:', e.message, e.stack);
    return errorResponse('Schema init failed: ' + e.message, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('savePricelist JSON parse error:', e.message);
    return errorResponse('Invalid JSON body: ' + e.message);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const itemsToSave = (body.items || []).slice(0, 2000);
  console.log(`savePricelist: supplier=${body.supplier}, items=${itemsToSave.length}, filename=${body.filename}`);

  try {
    await env.DB.prepare(
      'INSERT INTO pricelists (id, supplier, filename, price_date, total_items, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.supplier || 'Неизвестный', body.filename || '', body.price_date || '', 0, 'active', now).run();
  } catch (e) {
    console.error('savePricelist INSERT pricelists error:', e.message, e.stack);
    return errorResponse('Failed to create pricelist record: ' + e.message, 500);
  }

  let updatedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;

  for (const item of itemsToSave) {
    if (!item.name && !item.article) { skippedCount++; continue; }
    const article = (item.article || '').trim();
    try {
      if (article) {
        // UPSERT: check if article already exists in active catalog
        const existing = await env.DB.prepare(
          "SELECT id FROM catalog_items WHERE article = ? AND article != '' AND is_active = 1"
        ).bind(article).first();

        if (existing) {
          // UPDATE price and metadata only
          await env.DB.prepare(
            'UPDATE catalog_items SET price = ?, updated_at = ?, upload_source = ? WHERE id = ?'
          ).bind(parseFloat(item.price) || 0, now, body.filename || '', existing.id).run();
          updatedCount++;
          continue;
        }
      }
      // INSERT new item
      const itemId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO catalog_items (id, name, article, category, supplier, unit, price, currency, is_active, pricelist_id, upload_source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        itemId,
        (item.name || '').trim(),
        article,
        (item.category || 'другое').trim(),
        (item.supplier || body.supplier || '').trim(),
        (item.unit || 'шт').trim(),
        parseFloat(item.price) || 0,
        item.currency || 'KZT',
        1, id,
        body.filename || '',
        now, now
      ).run();
      addedCount++;
    } catch (e) {
      console.error(`savePricelist item error (name="${item.name}", article="${article}"):`, e.message);
      skippedCount++;
    }
  }

  const totalInserted = updatedCount + addedCount;
  await env.DB.prepare('UPDATE pricelists SET total_items = ? WHERE id = ?').bind(totalInserted, id).run();

  // Log upload
  try {
    await env.DB.prepare(
      'INSERT INTO upload_log (filename, supplier, items_updated, items_added, uploaded_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(body.filename || '', body.supplier || '', updatedCount, addedCount, now).run();
  } catch (e) {
    console.error('upload_log insert error:', e.message);
  }

  console.log(`savePricelist done: updated=${updatedCount}, added=${addedCount}, skipped=${skippedCount}`);
  return jsonResponse({ success: true, id, items_updated: updatedCount, items_added: addedCount, total_items: totalInserted });
}

async function deletePricelist(id, env) {
  await ensureSchema(env);
  await env.DB.prepare("UPDATE pricelists SET status = 'inactive' WHERE id = ?").bind(id).run();
  await env.DB.prepare("UPDATE catalog_items SET is_active = 0 WHERE pricelist_id = ?").bind(id).run();
  return jsonResponse({ success: true });
}

async function getCatalogItems(request, env) {
  await ensureSchema(env);
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const supplier = url.searchParams.get('supplier');
  const search = url.searchParams.get('search');
  const limitParam = url.searchParams.get('limit');
  const pageParam = url.searchParams.get('page');

  let baseQuery = 'FROM catalog_items WHERE is_active = 1';
  const params = [];

  // Category filter: match raw category against keywords
  if (category && category !== 'all') {
    const KEYWORDS = {
      'мойки':      ['мойка', 'sink'],
      'столешницы': ['столешниц', 'столешн', 'стол.', 'worktop'],
      'ручки':      ['ручк', 'gola', 'handle'],
      'подсветка':  ['подсветк', 'led', 'свет'],
      'фурнитура':  ['фурнитур', 'петл', 'навес', 'доводчик', 'направляющ', 'blum', 'hettich', 'hafele'],
      'плиты':      ['плит', 'лдсп', 'мдф', 'egger', 'kronospan'],
      'кромка':     ['кромк', 'edge'],
      'погонные':   ['погонн', 'карниз', 'плинтус', 'профил'],
      'аксессуары': ['аксессуар', 'корзин', 'лоток', 'органайз'],
    };
    const kws = KEYWORDS[category.toLowerCase()];
    if (kws) {
      const catConditions = kws.map(() => 'LOWER(category) LIKE ?').join(' OR ');
      baseQuery += ` AND (${catConditions})`;
      kws.forEach(kw => params.push(`%${kw}%`));
    } else {
      baseQuery += ' AND LOWER(category) LIKE ?';
      params.push(`%${category.toLowerCase()}%`);
    }
  }

  if (supplier) {
    baseQuery += ' AND supplier LIKE ?';
    params.push(`%${supplier}%`);
  }
  if (search) {
    baseQuery += ' AND (name LIKE ? OR article LIKE ? OR supplier LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Fetch markups once
  const allMarkups = await env.DB.prepare('SELECT * FROM price_markups').all();
  const markupMap = {};
  for (const m of (allMarkups.results || [])) {
    if (!m.pricelist_id || m.pricelist_id === 'global') {
      if (!markupMap['global']) markupMap['global'] = { categories: {}, items: {} };
      if (m.item_id) markupMap['global'].items[m.item_id] = m.markup_percent;
      else if (m.category) markupMap['global'].categories[m.category] = m.markup_percent;
    } else {
      if (!markupMap[m.pricelist_id]) markupMap[m.pricelist_id] = { categories: {}, items: {} };
      if (m.item_id) markupMap[m.pricelist_id].items[m.item_id] = m.markup_percent;
      else if (m.category) markupMap[m.pricelist_id].categories[m.category] = m.markup_percent;
    }
  }

  function applyMarkup(item) {
    const globalMarkup = markupMap['global'];
    const plMarkup = item.pricelist_id ? markupMap[item.pricelist_id] : null;
    let markupPct = 0;
    // Global category markup
    if (globalMarkup?.categories[item.category] !== undefined) markupPct = globalMarkup.categories[item.category];
    // Global item override
    if (globalMarkup?.items[item.id] !== undefined) markupPct = globalMarkup.items[item.id];
    // Pricelist-level category markup (overrides global)
    if (plMarkup?.categories[item.category] !== undefined) markupPct = plMarkup.categories[item.category];
    // Pricelist-level item markup (highest priority)
    if (plMarkup?.items[item.id] !== undefined) markupPct = plMarkup.items[item.id];
    const basePrice = item.price || 0;
    const clientPrice = markupPct > 0 ? Math.round(basePrice * (1 + markupPct / 100)) : basePrice;
    return { ...item, base_price: basePrice, price: clientPrice, markup_percent: markupPct };
  }

  // Paginated response when limit param present
  if (limitParam) {
    const limit = Math.min(parseInt(limitParam) || 50, 200);
    const page = parseInt(pageParam || '1');
    const offset = (page - 1) * limit;

    const [itemsResult, countResult] = await Promise.all([
      env.DB.prepare(`SELECT * ${baseQuery} ORDER BY category, name LIMIT ? OFFSET ?`).bind(...params, limit, offset).all(),
      env.DB.prepare(`SELECT COUNT(*) as total ${baseQuery}`).bind(...params).first(),
    ]);

    const items = (itemsResult.results || []).map(applyMarkup);
    const total = countResult?.total || 0;
    return jsonResponse({ items, total, page, pages: Math.ceil(total / limit) });
  }

  // Array response (backward compat for Constructor modal — max 500)
  const result = await env.DB.prepare(`SELECT * ${baseQuery} ORDER BY category, name LIMIT 500`).bind(...params).all();
  const items = (result.results || []).map(applyMarkup);
  return jsonResponse(items);
}

async function getPricelistDetail(id, env) {
  await ensureSchema(env);
  const pl = await env.DB.prepare('SELECT * FROM pricelists WHERE id = ?').bind(id).first();
  if (!pl) return errorResponse('Pricelist not found', 404);

  const itemsResult = await env.DB.prepare(
    'SELECT * FROM catalog_items WHERE pricelist_id = ? AND is_active = 1 ORDER BY category, name'
  ).bind(id).all();

  const markupsResult = await env.DB.prepare(
    'SELECT * FROM price_markups WHERE pricelist_id = ?'
  ).bind(id).all();

  return jsonResponse({ ...pl, items: itemsResult.results || [], markups: markupsResult.results || [] });
}

async function savePricelistMarkup(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();

  for (const m of (body.markups || [])) {
    let existing;
    if (m.item_id) {
      existing = await env.DB.prepare(
        'SELECT id FROM price_markups WHERE pricelist_id = ? AND item_id = ?'
      ).bind(id, m.item_id).first();
    } else {
      existing = await env.DB.prepare(
        'SELECT id FROM price_markups WHERE pricelist_id = ? AND category = ? AND item_id IS NULL'
      ).bind(id, m.category || '').first();
    }

    if (existing) {
      await env.DB.prepare('UPDATE price_markups SET markup_percent = ?, updated_at = ? WHERE id = ?')
        .bind(m.markup_percent || 0, now, existing.id).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO price_markups (id, pricelist_id, category, item_id, markup_percent, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, m.category || null, m.item_id || null, m.markup_percent || 0, now).run();
    }
  }

  return jsonResponse({ success: true, count: (body.markups || []).length });
}

async function updateCatalogItem(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();

  const updates = []; const params = [];
  if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
  if (body.price !== undefined) { updates.push('price = ?'); params.push(parseFloat(body.price) || 0); }
  if (body.unit !== undefined) { updates.push('unit = ?'); params.push(body.unit); }
  if (body.category !== undefined) { updates.push('category = ?'); params.push(body.category); }
  if (updates.length === 0) return jsonResponse({ success: true });

  updates.push('updated_at = ?'); params.push(now); params.push(id);
  await env.DB.prepare(`UPDATE catalog_items SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  return jsonResponse({ success: true });
}

// ─── Catalog admin & stats ────────────────────────────────────────────────────

async function resetCatalog(env) {
  await ensureSchema(env);
  await env.DB.prepare('DELETE FROM price_markups').run();
  await env.DB.prepare('DELETE FROM catalog_items').run();
  await env.DB.prepare('DELETE FROM pricelists').run();
  try { await env.DB.prepare('DELETE FROM upload_log').run(); } catch {}
  return jsonResponse({ success: true, message: 'Каталог очищен' });
}

async function getCatalogStats(env) {
  try { await ensureSchema(env); } catch {}
  const total = await env.DB.prepare('SELECT COUNT(*) as count FROM catalog_items WHERE is_active = 1').first();
  const lastUpdated = await env.DB.prepare('SELECT MAX(updated_at) as last FROM catalog_items WHERE is_active = 1').first();
  const byCategory = await env.DB.prepare('SELECT category, COUNT(*) as count FROM catalog_items WHERE is_active = 1 GROUP BY category ORDER BY count DESC').all();
  const lastUpload = await env.DB.prepare('SELECT * FROM upload_log ORDER BY uploaded_at DESC LIMIT 1').first().catch(() => null);
  const suppliers = await env.DB.prepare('SELECT DISTINCT supplier FROM catalog_items WHERE is_active = 1 AND supplier != "" ORDER BY supplier').all();
  return jsonResponse({
    total: total?.count || 0,
    last_updated: lastUpdated?.last || null,
    last_upload: lastUpload || null,
    by_category: byCategory.results || [],
    suppliers: (suppliers.results || []).map(r => r.supplier),
  });
}

async function getCatalogMarkups(env) {
  try { await ensureSchema(env); } catch {}
  const result = await env.DB.prepare(
    "SELECT * FROM price_markups WHERE (pricelist_id IS NULL OR pricelist_id = 'global') AND item_id IS NULL"
  ).all();
  return jsonResponse(result.results || []);
}

async function saveCatalogMarkups(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  for (const m of (body.markups || [])) {
    const existing = await env.DB.prepare(
      "SELECT id FROM price_markups WHERE pricelist_id = 'global' AND category = ? AND item_id IS NULL"
    ).bind(m.category || '').first();
    if (existing) {
      await env.DB.prepare('UPDATE price_markups SET markup_percent = ?, updated_at = ? WHERE id = ?')
        .bind(m.markup_percent || 0, now, existing.id).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO price_markups (id, pricelist_id, category, item_id, markup_percent, updated_at) VALUES (?, 'global', ?, NULL, ?, ?)"
      ).bind(crypto.randomUUID(), m.category || '', m.markup_percent || 0, now).run();
    }
  }
  return jsonResponse({ success: true, count: (body.markups || []).length });
}

async function getUploadLog(env) {
  try { await ensureSchema(env); } catch {}
  const result = await env.DB.prepare('SELECT * FROM upload_log ORDER BY uploaded_at DESC LIMIT 50').all();
  return jsonResponse(result.results || []);
}

async function deleteCatalogItem(id, env) {
  await env.DB.prepare('UPDATE catalog_items SET is_active = 0 WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function getUsers(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY name').all();
  return jsonResponse(result.results || []);
}

async function createUser(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO users (id, name, phone, role, is_active, created_at) VALUES (?, ?, ?, ?, 1, datetime('now'))
  `).bind(id, body.name || '', body.phone || '', body.role || 'Менеджер').run();
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return jsonResponse(user, 201);
}

async function updateUser(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?
  `).bind(body.name || null, body.phone || null, body.role || null, body.is_active ?? null, id).run();
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return jsonResponse(user);
}

// ─── Process Templates ────────────────────────────────────────────────────────

const DEFAULT_PROCESS_TEMPLATES = [
  {
    furniture_type: 'Кухонный гарнитур',
    name: 'Стандартный процесс для кухни',
    steps: [
      { name: 'Заявка принята', role: 'Менеджер', sla_days: 1, actions: ['Записать клиента', 'Уточнить размеры'], is_parallel: false },
      { name: 'Замер', role: 'Замерщик', sla_days: 2, actions: ['Выехать на объект', 'Замерить все стены', 'Сфотографировать', 'Загрузить результаты'], is_parallel: false },
      { name: 'Проектирование', role: 'Дизайнер', sla_days: 5, actions: ['Разработать 3 варианта', 'Сделать 3D визуализацию', 'Рассчитать стоимость'], is_parallel: false },
      { name: 'Согласование с клиентом', role: 'Менеджер', sla_days: 3, actions: ['Отправить КП клиенту', 'Получить обратную связь', 'Внести правки'], is_parallel: false },
      { name: 'Договор и аванс', role: 'Менеджер', sla_days: 2, actions: ['Подписать договор', 'Получить аванс 50%', 'Передать в производство'], is_parallel: false },
      { name: 'Закупка материалов', role: 'Снабженец', sla_days: 3, actions: ['Сформировать список материалов', 'Заказать у поставщиков', 'Получить материалы'], is_parallel: true },
      { name: 'Подготовка производства', role: 'Технолог', sla_days: 2, actions: ['Создать карту раскроя', 'Подготовить оборудование'], is_parallel: true },
      { name: 'Производство', role: 'Сборщик', sla_days: 7, actions: ['Раскрой', 'Кромление', 'Сверление', 'Сборка', 'Контроль качества'], is_parallel: false },
      { name: 'Монтаж', role: 'Монтажник', sla_days: 2, actions: ['Доставить на объект', 'Установить', 'Подключить технику', 'Акт приёмки'], is_parallel: false },
      { name: 'Финальная оплата', role: 'Бухгалтер', sla_days: 1, actions: ['Получить финальную оплату', 'Выдать чек', 'Закрыть заказ'], is_parallel: false },
      { name: 'Закрытие заказа', role: 'Руководитель', sla_days: 1, actions: ['Проверить акт', 'Подтвердить закрытие', 'Запросить отзыв'], is_parallel: false },
    ]
  },
  {
    furniture_type: 'Шкаф-купе',
    name: 'Стандартный процесс для шкафа-купе',
    steps: [
      { name: 'Заявка принята', role: 'Менеджер', sla_days: 1, actions: ['Записать клиента', 'Уточнить размеры'], is_parallel: false },
      { name: 'Замер', role: 'Замерщик', sla_days: 2, actions: ['Выехать на объект', 'Замерить нишу', 'Сфотографировать'], is_parallel: false },
      { name: 'Проектирование', role: 'Дизайнер', sla_days: 3, actions: ['Разработать конфигурацию', 'Рассчитать стоимость'], is_parallel: false },
      { name: 'Согласование', role: 'Менеджер', sla_days: 2, actions: ['Отправить КП', 'Согласовать с клиентом'], is_parallel: false },
      { name: 'Договор', role: 'Менеджер', sla_days: 1, actions: ['Подписать договор', 'Получить аванс'], is_parallel: false },
      { name: 'Закупка', role: 'Снабженец', sla_days: 3, actions: ['Заказать материалы', 'Получить материалы'], is_parallel: false },
      { name: 'Производство', role: 'Сборщик', sla_days: 5, actions: ['Раскрой ЛДСП', 'Кромление', 'Сборка корпуса', 'Двери'], is_parallel: false },
      { name: 'Монтаж', role: 'Монтажник', sla_days: 1, actions: ['Доставить', 'Установить', 'Акт'], is_parallel: false },
      { name: 'Закрытие', role: 'Бухгалтер', sla_days: 1, actions: ['Финальная оплата', 'Закрыть заказ'], is_parallel: false },
    ]
  },
  {
    furniture_type: 'Гардеробная',
    name: 'Стандартный процесс для гардеробной',
    steps: [
      { name: 'Заявка', role: 'Менеджер', sla_days: 1, actions: ['Консультация'], is_parallel: false },
      { name: 'Замер', role: 'Замерщик', sla_days: 2, actions: ['Замер помещения', 'Фото'], is_parallel: false },
      { name: 'Проект', role: 'Дизайнер', sla_days: 4, actions: ['3D модель', 'Спецификация'], is_parallel: false },
      { name: 'Согласование', role: 'Менеджер', sla_days: 2, actions: ['КП клиенту', 'Подтверждение'], is_parallel: false },
      { name: 'Договор', role: 'Менеджер', sla_days: 1, actions: ['Договор', 'Аванс'], is_parallel: false },
      { name: 'Закупка', role: 'Снабженец', sla_days: 3, actions: ['Материалы', 'Фурнитура'], is_parallel: false },
      { name: 'Производство', role: 'Сборщик', sla_days: 6, actions: ['Раскрой', 'Сборка секций', 'Подсветка'], is_parallel: false },
      { name: 'Монтаж', role: 'Монтажник', sla_days: 2, actions: ['Установка', 'Подключение подсветки', 'Акт'], is_parallel: false },
      { name: 'Закрытие', role: 'Бухгалтер', sla_days: 1, actions: ['Оплата'], is_parallel: false },
    ]
  },
];

async function getProcesses(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM process_templates ORDER BY furniture_type, created_at').all();
  let templates = result.results || [];

  // Seed default templates if empty
  if (templates.length === 0) {
    const now = new Date().toISOString();
    for (const tpl of DEFAULT_PROCESS_TEMPLATES) {
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO process_templates (id, furniture_type, name, steps_json, is_default, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, 'Система', ?, ?)
      `).bind(id, tpl.furniture_type, tpl.name, JSON.stringify(tpl.steps), now, now).run();
    }
    const r2 = await env.DB.prepare('SELECT * FROM process_templates ORDER BY furniture_type').all();
    templates = r2.results || [];
  }

  return jsonResponse(templates.map(t => ({
    ...t,
    steps: (() => { try { return JSON.parse(t.steps_json || '[]'); } catch { return []; } })()
  })));
}

async function createProcess(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO process_templates (id, furniture_type, name, steps_json, is_default, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).bind(id, body.furniture_type || '', body.name || '', JSON.stringify(body.steps || []), body.created_by || 'Руководитель', now, now).run();
  const tpl = await env.DB.prepare('SELECT * FROM process_templates WHERE id = ?').bind(id).first();
  return jsonResponse({ ...tpl, steps: body.steps || [] }, 201);
}

async function updateProcess(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE process_templates SET furniture_type = COALESCE(?, furniture_type), name = COALESCE(?, name), steps_json = COALESCE(?, steps_json), updated_at = ? WHERE id = ?
  `).bind(body.furniture_type || null, body.name || null, body.steps ? JSON.stringify(body.steps) : null, now, id).run();
  const tpl = await env.DB.prepare('SELECT * FROM process_templates WHERE id = ?').bind(id).first();
  if (!tpl) return errorResponse('Not found', 404);
  return jsonResponse({ ...tpl, steps: JSON.parse(tpl.steps_json || '[]') });
}

async function deleteProcess(id, env) {
  await env.DB.prepare('DELETE FROM process_templates WHERE id = ? AND is_default = 0').bind(id).run();
  return jsonResponse({ success: true });
}

// ─── Order Tasks ──────────────────────────────────────────────────────────────

async function getOrderTasks(orderId, env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM order_tasks WHERE order_id = ? ORDER BY step_index').bind(orderId).all();
  return jsonResponse((result.results || []).map(t => ({
    ...t,
    required_actions: (() => { try { return JSON.parse(t.required_actions_json || '[]'); } catch { return []; } })(),
    documents: (() => { try { return JSON.parse(t.documents_json || '[]'); } catch { return []; } })(),
  })));
}

async function createOrderTasks(orderId, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const tasks = body.tasks || [];

  // Delete existing tasks
  await env.DB.prepare('DELETE FROM order_tasks WHERE order_id = ?').bind(orderId).run();

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    await env.DB.prepare(`
      INSERT INTO order_tasks (order_id, step_name, step_index, responsible_role, responsible_user, status, is_parallel, required_actions_json, documents_json, sla_days)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(orderId, t.name || t.step_name || '', i, t.role || t.responsible_role || '', t.responsible_user || '', t.is_parallel ? 1 : 0, JSON.stringify(t.actions || t.required_actions || []), JSON.stringify(t.documents || []), t.sla_days || 0).run();
  }

  return jsonResponse({ success: true, count: tasks.length });
}

async function updateOrderTask(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const task = await env.DB.prepare('SELECT * FROM order_tasks WHERE id = ?').bind(id).first();
  if (!task) return errorResponse('Task not found', 404);

  const newStatus = body.status || task.status;
  const startedAt = newStatus === 'in_progress' && !task.started_at ? now : task.started_at;
  const completedAt = newStatus === 'completed' ? now : task.completed_at;

  await env.DB.prepare(`
    UPDATE order_tasks SET status = ?, responsible_user = COALESCE(?, responsible_user), notes = COALESCE(?, notes), required_actions_json = COALESCE(?, required_actions_json), started_at = ?, completed_at = ? WHERE id = ?
  `).bind(newStatus, body.responsible_user || null, body.notes || null, body.required_actions ? JSON.stringify(body.required_actions) : null, startedAt, completedAt, id).run();

  const updated = await env.DB.prepare('SELECT * FROM order_tasks WHERE id = ?').bind(id).first();
  return jsonResponse({
    ...updated,
    required_actions: (() => { try { return JSON.parse(updated.required_actions_json || '[]'); } catch { return []; } })(),
  });
}

// ─── Procurement ──────────────────────────────────────────────────────────────

async function getProcurement(request, env) {
  await ensureSchema(env);
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  const status = url.searchParams.get('status');

  let query = `SELECT p.*, o.order_number, o.client_name FROM procurement p LEFT JOIN orders o ON p.order_id = o.id`;
  const params = [], conditions = [];
  if (orderId) { conditions.push('p.order_id = ?'); params.push(orderId); }
  if (status && status !== 'all') { conditions.push('p.status = ?'); params.push(status); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY p.rowid DESC';

  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(result.results || []);
}

async function createProcurementItem(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const total = (body.quantity || 1) * (body.unit_price || 0);

  await env.DB.prepare(`
    INSERT INTO procurement (order_id, material_name, quantity, unit, supplier, unit_price, total_price, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'needed', ?)
  `).bind(body.order_id || null, body.material_name || '', body.quantity || 1, body.unit || 'шт', body.supplier || '', body.unit_price || 0, total, body.notes || '').run();

  return jsonResponse({ success: true });
}

async function updateProcurementItem(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();

  const item = await env.DB.prepare(`SELECT p.*, o.order_number, o.client_name FROM procurement p LEFT JOIN orders o ON p.order_id = o.id WHERE p.id = ?`).bind(id).first();
  if (!item) return errorResponse('Not found', 404);

  const orderedAt = body.status === 'ordered' ? now : (body.ordered_at || null);
  const receivedAt = body.status === 'received' ? now : (body.received_at || null);
  const paymentDate = body.status === 'paid' ? (body.payment_date || now.slice(0, 10)) : null;

  await env.DB.prepare(`
    UPDATE procurement SET
      status = COALESCE(?, status),
      ordered_at = COALESCE(?, ordered_at),
      received_at = COALESCE(?, received_at),
      notes = COALESCE(?, notes),
      supplier = COALESCE(?, supplier),
      unit_price = COALESCE(?, unit_price),
      payment_status = COALESCE(?, payment_status),
      invoice_number = COALESCE(?, invoice_number),
      payment_date = COALESCE(?, payment_date),
      paid_by = COALESCE(?, paid_by)
    WHERE id = ?
  `).bind(
    body.status || null, orderedAt, receivedAt,
    body.notes || null, body.supplier || null, body.unit_price ?? null,
    body.payment_status || null, body.invoice_number || null,
    paymentDate, body.paid_by || null, id
  ).run();

  // Send notifications based on status transitions
  const matName = item.material_name || 'Материал';
  const total = item.total_price || 0;
  const orderNum = item.order_number || '';

  if (body.status === 'pending_payment') {
    // Notify Бухгалтер
    await addRoleNotification(item.order_id, orderNum, item.client_name || '', 'accountant',
      `Новый счёт к оплате: ${matName} — ${total.toLocaleString('ru')} ₸${item.supplier ? ' ('+item.supplier+')' : ''}`, 'payment', env);
  } else if (body.status === 'paid') {
    // Notify Снабженец
    await addRoleNotification(item.order_id, orderNum, item.client_name || '', 'supply',
      `Оплачено! Можно забирать: ${matName}${item.supplier ? ' у '+item.supplier : ''}`, 'completed', env);
  } else if (body.status === 'received') {
    // Notify Менеджер + Технолог
    await addRoleNotification(item.order_id, orderNum, item.client_name || '', 'manager',
      `Материал получен: ${matName}${orderNum ? ' для заказа '+orderNum : ''}`, 'info', env);
    await addRoleNotification(item.order_id, orderNum, item.client_name || '', 'technologist',
      `Материал получен: ${matName}${orderNum ? ' для заказа '+orderNum : ''}. Готов к производству.`, 'info', env);

    // Check if all materials for this order are received → suggest moving to Производство
    if (item.order_id) {
      const allItems = await env.DB.prepare('SELECT status FROM procurement WHERE order_id = ?').bind(item.order_id).all();
      const allReceived = (allItems.results || []).every(i => i.status === 'received');
      if (allReceived && allItems.results.length > 0) {
        await addRoleNotification(item.order_id, orderNum, item.client_name || '', 'manager',
          `✅ Все материалы для ${orderNum} получены! Можно переводить в Производство.`, 'completed', env);
      }
    }
  }

  return jsonResponse({ success: true });
}

// ─── Payments / Finance ───────────────────────────────────────────────────────

async function getPayments(request, env) {
  await ensureSchema(env);
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');

  let query = 'SELECT p.*, o.order_number, o.client_name, o.total_price FROM payments p LEFT JOIN orders o ON p.order_id = o.id';
  if (orderId) query += ' WHERE p.order_id = ?';
  query += ' ORDER BY p.created_at DESC';

  const result = orderId
    ? await env.DB.prepare(query).bind(orderId).all()
    : await env.DB.prepare(query).all();
  return jsonResponse(result.results || []);
}

async function createPayment(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO payments (id, order_id, amount, type, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, body.order_id || null, body.amount || 0, body.payment_type || body.type || 'advance', body.notes || body.note || '', now).run();

  // Update order paid_amount
  if (body.order_id) {
    const order = await env.DB.prepare('SELECT paid_amount FROM orders WHERE id = ?').bind(body.order_id).first();
    if (order) {
      const newPaid = (order.paid_amount || 0) + (body.amount || 0);
      await env.DB.prepare('UPDATE orders SET paid_amount = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newPaid, body.order_id).run();
    }
  }

  return jsonResponse({ id, success: true }, 201);
}

async function getFinanceSummary(env) {
  await ensureSchema(env);

  const orders = await env.DB.prepare(`
    SELECT id, order_number, client_name, total_price, paid_amount, status, stage, created_at FROM orders WHERE status != 'cancelled' ORDER BY created_at DESC
  `).all();

  const payments = await env.DB.prepare(`
    SELECT order_id, SUM(amount) as total, type FROM payments GROUP BY order_id, type
  `).all();

  const paymentsByOrder = {};
  for (const p of (payments.results || [])) {
    if (!paymentsByOrder[p.order_id]) paymentsByOrder[p.order_id] = { advance: 0, final: 0 };
    if (p.type === 'advance') paymentsByOrder[p.order_id].advance += p.total || 0;
    else paymentsByOrder[p.order_id].final += p.total || 0;
  }

  const orderList = (orders.results || []).map(o => ({
    ...o,
    advance_paid: paymentsByOrder[o.id]?.advance || 0,
    final_paid: paymentsByOrder[o.id]?.final || 0,
    balance_due: (o.total_price || 0) - (o.paid_amount || 0),
  }));

  // This month summary
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthOrders = orderList.filter(o => o.created_at?.startsWith(thisMonth));

  const summary = {
    total_revenue: orderList.reduce((s, o) => s + (o.total_price || 0), 0),
    total_received: orderList.reduce((s, o) => s + (o.paid_amount || 0), 0),
    total_outstanding: orderList.reduce((s, o) => s + Math.max(0, o.balance_due), 0),
    month_revenue: monthOrders.reduce((s, o) => s + (o.total_price || 0), 0),
    month_received: monthOrders.reduce((s, o) => s + (o.paid_amount || 0), 0),
  };

  return jsonResponse({ orders: orderList, summary });
}

// ─── Seed Demo ────────────────────────────────────────────────────────────────

async function seedDemo(env) {
  await ensureSchema(env);
  const now = new Date().toISOString();

  // 1. Create demo lead
  const leadId = 'demo-lead-001';
  const existingLead = await env.DB.prepare('SELECT id FROM leads WHERE id = ?').bind(leadId).first();
  if (!existingLead) {
    await env.DB.prepare(`
      INSERT INTO leads (id, client_name, client_phone, source, furniture_type, budget_range, status, stage, responsible, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', 'new', ?, ?, ?, ?)
    `).bind(leadId, 'Асем Нурланова', '+7 (701) 555-11-22', 'instagram', 'Кухня', '200-500к', 'Менеджер', 'Клиент обратился через Instagram, интересует угловая кухня', now, now).run();

    await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(leadId, 'Лид создан', 'Менеджер', 'Источник: Instagram, Тип мебели: Кухня, Бюджет: 200-500к', now).run();
  }

  // 2. Create converted order from lead
  const orderId = 'demo-order-2001';
  const existing = await env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(orderId).first();
  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO orders (id, order_number, client_name, client_phone, product_type, status, stage, progress, portal_token, notes, total_price, paid_amount, delivery_date, assigned_measurer, assigned_designer, constructor_config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'in_progress', 'Согласование', 45, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, 'ФФ-2001-D', 'Асем Нурланова', '+7 (701) 555-11-22',
      'Кухонный гарнитур', 'demo-portal-asem',
      'Создан из лида. Угловая кухня, бюджет 200-500к. Клиент пришёл с Instagram.',
      185000, 92500, '2026-06-01',
      'Арман Токтаров', 'Данияр Сейтжанов',
      JSON.stringify({
        furniture_type: 'Кухонный гарнитур',
        dimensions: { width: 380, height: 220, depth: 60 },
        variants: [
          { name: 'ЭКОНОМ', price: 135000, corpus: 'ЛДСП Egger 16мм', facade: 'Плёнка ПВХ', hardware: 'Hettich' },
          { name: 'СТАНДАРТ', price: 185000, corpus: 'ЛДСП Egger 18мм', facade: 'Эмаль матовая', hardware: 'Häfele' },
          { name: 'ПРЕМИУМ', price: 265000, corpus: 'МДФ крашеный', facade: 'Акрил глянец', hardware: 'Blum' },
        ]
      }),
      now, now
    ).run();

    // Add measurement data
    const existingMeasure = await env.DB.prepare('SELECT id FROM measurements WHERE order_id = ?').bind(orderId).first();
    if (!existingMeasure) {
      await env.DB.prepare(`
        INSERT INTO measurements (order_id, measurements_json, room_summary_json, completed_at, measurer_name)
        VALUES (?, ?, ?, ?, ?)
      `).bind(orderId, JSON.stringify([
        { id: 1, label: 'Ширина стены (по плинтусу)', value: '380', unit: 'см' },
        { id: 2, label: 'Ширина стены (на 120см)', value: '379', unit: 'см' },
        { id: 3, label: 'Высота потолка', value: '270', unit: 'см' },
        { id: 4, label: 'Глубина ниши', value: '60', unit: 'см' },
      ]), JSON.stringify({ room_type: 'Кухня', approximate_area: '~18м²', finishing_state: 'чистовая' }), now, 'Арман Токтаров').run();
    }

    // Create notifications
    await addOrderNotification(orderId, 'ФФ-2001-D', 'Асем Нурланова', 'Заказ создан из лида', 'Конвертирован из Instagram-лида', env);
    await addRoleNotification(orderId, 'ФФ-2001-D', 'Асем Нурланова', 'manager', 'Новый заказ ФФ-2001-D — Асем Нурланова (Кухня). КП готово к отправке.', 'new_order', env);

    // Update lead as converted
    await env.DB.prepare("UPDATE leads SET stage = 'converted', status = 'won', updated_at = ? WHERE id = ?").bind(now, leadId).run();
    await env.DB.prepare(`INSERT INTO lead_history (lead_id, action, performed_by, notes, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(leadId, 'Конвертирован в заказ', 'Менеджер', 'Заказ ФФ-2001-D создан', now).run();
  }

  // 3. Seed default process templates
  const tplCount = await env.DB.prepare('SELECT COUNT(*) as cnt FROM process_templates').first();
  if ((tplCount?.cnt || 0) === 0) {
    for (const tpl of DEFAULT_PROCESS_TEMPLATES) {
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO process_templates (id, furniture_type, name, steps_json, is_default, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, 'Система', ?, ?)
      `).bind(id, tpl.furniture_type, tpl.name, JSON.stringify(tpl.steps), now, now).run();
    }
  }

  // 4. Seed demo users
  const userCount = await env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first();
  if ((userCount?.cnt || 0) === 0) {
    const demoUsers = [
      { name: 'Болат Сейткали', role: 'Руководитель', phone: '+7 (701) 100-01-01' },
      { name: 'Айгуль Нурова', role: 'Менеджер', phone: '+7 (701) 100-01-02' },
      { name: 'Данияр Сейтжанов', role: 'Дизайнер', phone: '+7 (701) 100-01-03' },
      { name: 'Арман Токтаров', role: 'Замерщик', phone: '+7 (701) 100-01-04' },
      { name: 'Серик Байжанов', role: 'Монтажник', phone: '+7 (701) 100-01-05' },
      { name: 'Нурлан Сатов', role: 'Снабженец', phone: '+7 (701) 100-01-06' },
      { name: 'Акжол Темиров', role: 'Технолог', phone: '+7 (701) 100-01-07' },
      { name: 'Марат Жаков', role: 'Сборщик', phone: '+7 (701) 100-01-08' },
      { name: 'Ибрагим Касымов', role: 'Сборщик', phone: '+7 (701) 100-01-09' },
      { name: 'Динара Алиева', role: 'Бухгалтер', phone: '+7 (701) 100-01-10' },
    ];
    for (const u of demoUsers) {
      await env.DB.prepare(`INSERT INTO users (id, name, phone, role, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)`)
        .bind(crypto.randomUUID(), u.name, u.phone, u.role, now).run();
    }
  }

  return jsonResponse({
    success: true,
    message: 'Демо-данные загружены: лид Асем Нурланова, заказ ФФ-2001-D, шаблоны процессов, 10 пользователей'
  });
}

// ─── Procurement Pending (for Finance page) ───────────────────────────────────

async function getProcurementPending(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare(`
    SELECT p.*, o.order_number, o.client_name FROM procurement p
    LEFT JOIN orders o ON p.order_id = o.id
    WHERE p.status = 'pending_payment'
    ORDER BY p.rowid DESC
  `).all();
  return jsonResponse(result.results || []);
}

// ─── Overdue Tasks / Dashboard Alerts ────────────────────────────────────────

async function getOverdueTasks(env) {
  await ensureSchema(env);
  try {
    const now = new Date().toISOString().slice(0, 10);

    // Get all in-progress tasks with SLA
    const tasksRes = await env.DB.prepare(`
      SELECT ot.*, o.order_number, o.client_name, o.stage as order_stage
      FROM order_tasks ot
      LEFT JOIN orders o ON ot.order_id = o.id
      WHERE ot.status IN ('pending', 'in_progress', 'overdue')
      AND ot.sla_days IS NOT NULL AND ot.sla_days > 0
      AND ot.started_at IS NOT NULL
    `).all();

    const tasks = tasksRes.results || [];
    const overdue = [];

    for (const task of tasks) {
      const startDate = new Date(task.started_at);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (task.sla_days || 1));
      const daysOverdue = Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 0) {
        // Auto-mark as overdue
        if (task.status !== 'overdue') {
          await env.DB.prepare("UPDATE order_tasks SET status = 'overdue' WHERE id = ?").bind(task.id).run();
        }
        overdue.push({
          ...task,
          days_overdue: daysOverdue,
          due_date: dueDate.toISOString().slice(0, 10),
        });

        // Auto-escalate if >2 days overdue
        if (daysOverdue > 2) {
          const existingAlert = await env.DB.prepare(`
            SELECT id FROM notifications WHERE order_id = ? AND title LIKE ? AND created_at >= date('now', '-1 day')
          `).bind(task.order_id || '', `%просрочен%`).first();

          if (!existingAlert && task.order_id) {
            await addRoleNotification(
              task.order_id, task.order_number || '', task.client_name || '',
              'director',
              `⚠️ Заказ ${task.order_number || ''}: "${task.step_name}" просрочен на ${daysOverdue} дн. Ответственный: ${task.responsible_role}`,
              'urgent', env
            );
          }
        }
      }
    }

    // Also get stale orders (same stage >3 days)
    const staleRes = await env.DB.prepare(`
      SELECT id, order_number, client_name, stage, updated_at,
        CAST((julianday('now') - julianday(updated_at)) AS INTEGER) as days_at_stage
      FROM orders
      WHERE status = 'in_progress'
      AND updated_at IS NOT NULL
      AND CAST((julianday('now') - julianday(updated_at)) AS INTEGER) > 3
    `).all();

    return jsonResponse({
      overdue_tasks: overdue,
      stale_orders: staleRes.results || [],
    });
  } catch (e) {
    return jsonResponse({ overdue_tasks: [], stale_orders: [] });
  }
}

// ─── Report Task Problem ──────────────────────────────────────────────────────

async function reportTaskProblem(taskId, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const now = new Date().toISOString();
  const { problem_type, problem_description, reported_by } = body;

  const task = await env.DB.prepare('SELECT ot.*, o.order_number, o.client_name FROM order_tasks ot LEFT JOIN orders o ON ot.order_id = o.id WHERE ot.id = ?').bind(taskId).first();
  if (!task) return errorResponse('Task not found', 404);

  await env.DB.prepare(`
    UPDATE order_tasks SET status = 'blocked', problem_type = ?, problem_description = ?, problem_reported_at = ? WHERE id = ?
  `).bind(problem_type || 'other', problem_description || '', now, taskId).run();

  // Notify director
  await addRoleNotification(
    task.order_id, task.order_number || '', task.client_name || '',
    'director',
    `🚨 Проблема в заказе ${task.order_number || ''}: "${task.step_name}" — ${problem_type || 'другое'}. ${problem_description || ''}. Сотрудник: ${reported_by || 'неизвестно'}`,
    'urgent', env
  );

  return jsonResponse({ success: true });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

async function getSuppliers(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM suppliers ORDER BY name').all();
  return jsonResponse(result.results || []);
}

async function createSupplier(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { name, city, delivery_days, visit_schedule, lead_time_days, notes } = body;
  if (!name) return errorResponse('name required');
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    INSERT INTO suppliers (name, city, delivery_days, visit_schedule, lead_time_days, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(name, city || '', delivery_days || 0, visit_schedule || '', lead_time_days || 0, notes || '', now).run();
  const row = await env.DB.prepare('SELECT * FROM suppliers WHERE id = last_insert_rowid()').first();
  return jsonResponse(row, 201);
}

async function updateSupplier(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { name, city, delivery_days, visit_schedule, lead_time_days, notes } = body;
  await env.DB.prepare(`
    UPDATE suppliers SET name=COALESCE(?,name), city=COALESCE(?,city), delivery_days=COALESCE(?,delivery_days),
    visit_schedule=COALESCE(?,visit_schedule), lead_time_days=COALESCE(?,lead_time_days), notes=COALESCE(?,notes) WHERE id=?
  `).bind(name||null, city||null, delivery_days??null, visit_schedule||null, lead_time_days??null, notes||null, id).run();
  const row = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();
  return jsonResponse(row);
}

async function deleteSupplier(id, env) {
  await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

// ─── Equipment ────────────────────────────────────────────────────────────────

async function getEquipment(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM equipment ORDER BY name').all();
  return jsonResponse(result.results || []);
}

async function createEquipment(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { name, type, is_available, busy_until, daily_capacity_minutes, notes } = body;
  if (!name) return errorResponse('name required');
  const result = await env.DB.prepare(`
    INSERT INTO equipment (name, type, is_available, busy_until, daily_capacity_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(name, type || 'other', is_available ?? 1, busy_until || null, daily_capacity_minutes || 480, notes || '').run();
  const row = await env.DB.prepare('SELECT * FROM equipment WHERE id = last_insert_rowid()').first();
  return jsonResponse(row, 201);
}

async function updateEquipment(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE equipment SET name=COALESCE(?,name), type=COALESCE(?,type), is_available=COALESCE(?,is_available),
    busy_until=?, daily_capacity_minutes=COALESCE(?,daily_capacity_minutes), notes=COALESCE(?,notes) WHERE id=?
  `).bind(body.name||null, body.type||null, body.is_available??null, body.busy_until||null, body.daily_capacity_minutes??null, body.notes||null, id).run();
  const row = await env.DB.prepare('SELECT * FROM equipment WHERE id = ?').bind(id).first();
  return jsonResponse(row);
}

async function deleteEquipment(id, env) {
  await env.DB.prepare('DELETE FROM equipment WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

// ─── Business Rules ───────────────────────────────────────────────────────────

async function getBusinessRules(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM business_rules ORDER BY id').all();
  const rules = (result.results || []).map(r => ({
    ...r,
    trigger_condition: (() => { try { return JSON.parse(r.trigger_condition || '{}'); } catch { return {}; } })(),
    actions: (() => { try { return JSON.parse(r.actions_json || '[]'); } catch { return []; } })(),
  }));
  return jsonResponse(rules);
}

async function createBusinessRule(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { name, trigger_type, trigger_condition, actions, is_active } = body;
  if (!name) return errorResponse('name required');
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO business_rules (name, trigger_type, trigger_condition, actions_json, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(name, trigger_type || 'material_added', JSON.stringify(trigger_condition || {}), JSON.stringify(actions || []), is_active ?? 1, now).run();
  const row = await env.DB.prepare('SELECT * FROM business_rules WHERE id = last_insert_rowid()').first();
  return jsonResponse({ ...row, trigger_condition: trigger_condition || {}, actions: actions || [] }, 201);
}

async function updateBusinessRule(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE business_rules SET name=COALESCE(?,name), trigger_type=COALESCE(?,trigger_type),
    trigger_condition=COALESCE(?,trigger_condition), actions_json=COALESCE(?,actions_json), is_active=COALESCE(?,is_active) WHERE id=?
  `).bind(body.name||null, body.trigger_type||null,
    body.trigger_condition ? JSON.stringify(body.trigger_condition) : null,
    body.actions ? JSON.stringify(body.actions) : null,
    body.is_active??null, id).run();
  const row = await env.DB.prepare('SELECT * FROM business_rules WHERE id = ?').bind(id).first();
  return jsonResponse({
    ...row,
    trigger_condition: (() => { try { return JSON.parse(row.trigger_condition || '{}'); } catch { return {}; } })(),
    actions: (() => { try { return JSON.parse(row.actions_json || '[]'); } catch { return []; } })(),
  });
}

async function deleteBusinessRule(id, env) {
  await env.DB.prepare('DELETE FROM business_rules WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true });
}

// ─── Material Stock ───────────────────────────────────────────────────────────

async function getMaterialStock(env) {
  await ensureSchema(env);
  const result = await env.DB.prepare('SELECT * FROM material_stock ORDER BY material_name').all();
  return jsonResponse(result.results || []);
}

async function updateMaterialStock(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { catalog_item_id, material_name, category, supplier, stock_status, stock_source, quantity, unit, supply_source } = body;
  const now = new Date().toISOString();

  const existing = catalog_item_id
    ? await env.DB.prepare('SELECT id FROM material_stock WHERE catalog_item_id = ?').bind(catalog_item_id).first()
    : await env.DB.prepare('SELECT id FROM material_stock WHERE material_name = ?').bind(material_name || '').first();

  if (existing) {
    await env.DB.prepare(`
      UPDATE material_stock SET stock_status=?, stock_source=?, quantity=?, supply_source=?, updated_at=? WHERE id=?
    `).bind(stock_status || 'in_stock', stock_source || 'local_warehouse', quantity || 0, supply_source || '', now, existing.id).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO material_stock (catalog_item_id, material_name, category, supplier, stock_status, stock_source, quantity, unit, supply_source, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(catalog_item_id || null, material_name || '', category || '', supplier || '', stock_status || 'in_stock', stock_source || 'local_warehouse', quantity || 0, unit || 'шт', supply_source || '', now).run();
  }
  return jsonResponse({ success: true });
}

// ─── Clear Test Data ──────────────────────────────────────────────────────────

async function clearTestData(env) {
  await ensureSchema(env);
  const tables = ['order_history', 'notifications', 'measurements', 'payments', 'procurement', 'orders', 'clients', 'leads', 'lead_history'];
  for (const t of tables) {
    try { await env.DB.prepare(`DELETE FROM ${t}`).run(); } catch {}
  }
  return jsonResponse({ success: true, message: 'Тестовые данные удалены' });
}

// ─── Company Branding ─────────────────────────────────────────────────────────

async function getBranding(env) {
  await ensureSchema(env);
  const row = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind('default').first();
  if (!row) {
    return jsonResponse({ id: 'default', name: 'FurnFlow', primary_color: '#0062d1', accent_color: '#0a7df5', logo_url: null });
  }
  return jsonResponse(row);
}

async function saveBranding(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { name, primary_color, accent_color, logo_url } = body;
  const now = new Date().toISOString();

  const existing = await env.DB.prepare('SELECT id FROM companies WHERE id = ?').bind('default').first();
  if (existing) {
    await env.DB.prepare(`
      UPDATE companies SET
        name = COALESCE(?, name),
        primary_color = COALESCE(?, primary_color),
        accent_color = COALESCE(?, accent_color),
        logo_url = ?
      WHERE id = ?
    `).bind(name || null, primary_color || null, accent_color || null, logo_url !== undefined ? logo_url : null, 'default').run();
  } else {
    await env.DB.prepare(`
      INSERT INTO companies (id, name, primary_color, accent_color, logo_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind('default', name || 'FurnFlow', primary_color || '#0062d1', accent_color || '#0a7df5', logo_url || null, now).run();
  }
  const updated = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind('default').first();
  return jsonResponse(updated);
}

// ─── Smart Deadline Calculator ────────────────────────────────────────────────

async function calculateDeadline(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { order_id, materials = [], operations = [], order_date, hardware } = body;

  const BASE_DAYS = 14;
  const additions = [];
  const warnings = [];

  // Fetch active rules
  const rulesResult = await env.DB.prepare("SELECT * FROM business_rules WHERE is_active = 1").all();
  const rules = (rulesResult.results || []).map(r => ({
    ...r,
    trigger_condition: (() => { try { return JSON.parse(r.trigger_condition || '{}'); } catch { return {}; } })(),
    actions: (() => { try { return JSON.parse(r.actions_json || '[]'); } catch { return []; } })(),
  }));

  // Fetch equipment
  const equipResult = await env.DB.prepare('SELECT * FROM equipment').all();
  const equipment = equipResult.results || [];

  // Fetch suppliers
  const suppResult = await env.DB.prepare('SELECT * FROM suppliers').all();
  const suppliers = suppResult.results || [];

  const today = order_date ? new Date(order_date) : new Date();

  // Check Blum hardware
  if (hardware && hardware.toLowerCase().includes('blum')) {
    const blumSupplier = suppliers.find(s => s.name && s.name.toLowerCase().includes('blum'));
    const days = blumSupplier ? (blumSupplier.lead_time_days || 3) : 3;
    additions.push({ reason: `Фурнитура Blum (доставка)`, days });
    warnings.push(`Blum: ожидайте ${days} дня доставки`);
  }

  // Check materials
  for (const mat of materials) {
    // Check stock status
    const stockRow = mat.name
      ? await env.DB.prepare('SELECT * FROM material_stock WHERE material_name LIKE ? LIMIT 1').bind(`%${mat.name}%`).first()
      : null;

    if (stockRow) {
      if (stockRow.stock_status === 'out_of_stock') {
        if (stockRow.stock_source === 'supplier_other_city') {
          // Find matching supplier
          const sup = suppliers.find(s => s.name && stockRow.supply_source && s.name.toLowerCase().includes(stockRow.supply_source.toLowerCase()));
          const days = sup ? (sup.lead_time_days || 7) : 7;
          additions.push({ reason: `${mat.name}: под заказ (другой город)`, days });
          warnings.push(`${mat.name} нет на складе — поставка из другого города (+${days} дн.)`);
        } else if (stockRow.stock_source === 'supplier_city') {
          additions.push({ reason: `${mat.name}: заказ у поставщика`, days: 2 });
          warnings.push(`${mat.name} нет на складе — заказ у местного поставщика (+2 дн.)`);
        } else {
          additions.push({ reason: `${mat.name}: нет на складе`, days: 1 });
          warnings.push(`${mat.name} нет на складе`);
        }
      } else if (stockRow.stock_status === 'low_stock') {
        warnings.push(`${mat.name}: остаток заканчивается`);
      }
    }

    // Apply matching business rules for materials
    for (const rule of rules) {
      if (rule.trigger_type !== 'material_added') continue;
      const cond = rule.trigger_condition;
      const matches =
        (!cond.material_category || (mat.category && mat.category.toLowerCase().includes(cond.material_category.toLowerCase()))) &&
        (!cond.supplier || (mat.supplier && mat.supplier.toLowerCase().includes(cond.supplier.toLowerCase()))) &&
        (!cond.stock_status || mat.stock_status === cond.stock_status);
      if (!matches) continue;
      for (const action of rule.actions) {
        if (action.type === 'add_days' && action.days > 0) {
          additions.push({ reason: rule.name + (action.reason ? `: ${action.reason}` : ''), days: action.days });
        }
      }
    }
  }

  // Check operations
  for (const op of operations) {
    // CNC complex
    if (op.type === 'cnc_complex' || (op.name && op.name.toLowerCase().includes('фрезеровк'))) {
      const cnc = equipment.find(e => e.type === 'cnc');
      if (cnc && cnc.busy_until) {
        const busyDate = new Date(cnc.busy_until);
        if (busyDate > today) {
          const diffDays = Math.ceil((busyDate - today) / (1000 * 60 * 60 * 24));
          additions.push({ reason: `ЧПУ занят до ${cnc.busy_until.slice(0, 10)}`, days: diffDays });
          warnings.push(`${cnc.name} занят до ${cnc.busy_until.slice(0, 10)}`);
        }
      } else {
        additions.push({ reason: 'Сложная фрезеровка ЧПУ', days: 2 });
      }
    }

    // Non-standard edge banding
    if (op.type === 'edge_nonstandard' || (op.name && op.name.toLowerCase().includes('нестандартн') && op.name.toLowerCase().includes('кромк'))) {
      additions.push({ reason: 'Нестандартная кромка (ручная работа)', days: 1 });
    }

    // Apply matching business rules for operations
    for (const rule of rules) {
      if (rule.trigger_type !== 'operation_added') continue;
      const cond = rule.trigger_condition;
      const matches = !cond.operation_type || op.type === cond.operation_type;
      if (!matches) continue;
      for (const action of rule.actions) {
        if (action.type === 'add_days' && action.days > 0) {
          additions.push({ reason: rule.name + (action.reason ? `: ${action.reason}` : ''), days: action.days });
        }
      }
    }
  }

  // Deduplicate additions by reason
  const seen = new Set();
  const uniqueAdditions = additions.filter(a => {
    if (seen.has(a.reason)) return false;
    seen.add(a.reason);
    return true;
  });

  const totalDays = BASE_DAYS + uniqueAdditions.reduce((s, a) => s + a.days, 0);

  const readyDate = new Date(today);
  readyDate.setDate(readyDate.getDate() + totalDays);
  // Skip weekends
  while (readyDate.getDay() === 0 || readyDate.getDay() === 6) {
    readyDate.setDate(readyDate.getDate() + 1);
  }

  return jsonResponse({
    base_days: BASE_DAYS,
    additions: uniqueAdditions,
    total_days: totalDays,
    ready_date: readyDate.toISOString().slice(0, 10),
    warnings,
  });
}

// ─── Chat Context ─────────────────────────────────────────────────────────────

async function getChatContext(env) {
  await ensureSchema(env);
  try {
    // Orders summary
    const ordersRes = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50").all();
    const orders = ordersRes.results || [];
    const now = new Date();
    const overdue = orders.filter(o => o.delivery_date && new Date(o.delivery_date) < now && o.status !== 'delivered' && o.status !== 'cancelled');
    const active = orders.filter(o => o.status === 'in_progress');
    const ordersSummary = `Всего заказов: ${orders.length}. Активных: ${active.length}. Просроченных: ${overdue.length}${overdue.length > 0 ? ' (' + overdue.map(o => o.order_number).join(', ') + ')' : ''}.`;

    // Leads today
    const today = now.toISOString().slice(0, 10);
    const leadsRes = await env.DB.prepare("SELECT * FROM leads WHERE created_at >= ? LIMIT 20").bind(today).all();
    const leads = leadsRes.results || [];
    const leadsAllRes = await env.DB.prepare("SELECT COUNT(*) as cnt FROM leads WHERE status = 'active'").first();
    const leadsSummary = `Активных лидов: ${leadsAllRes?.cnt || 0}. Новых сегодня: ${leads.length}.`;

    // Equipment status
    const equipRes = await env.DB.prepare('SELECT * FROM equipment').all();
    const equip = equipRes.results || [];
    const equipSummary = equip.length > 0
      ? equip.map(e => `${e.name}: ${e.is_available ? 'свободен' : `занят${e.busy_until ? ' до ' + e.busy_until.slice(0, 10) : ''}`}`).join('. ')
      : 'Оборудование не настроено.';

    // Stock alerts
    const stockRes = await env.DB.prepare("SELECT * FROM material_stock WHERE stock_status IN ('low_stock','out_of_stock')").all();
    const stockAlerts = stockRes.results || [];
    const stockSummary = stockAlerts.length > 0
      ? 'Проблемы со складом: ' + stockAlerts.map(s => `${s.material_name} (${s.stock_status === 'out_of_stock' ? 'нет в наличии' : 'заканчивается'})`).join(', ')
      : 'Склад в порядке.';

    // Recent notifications
    const notifRes = await env.DB.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5").all();
    const notifs = notifRes.results || [];
    const notifSummary = notifs.length > 0 ? notifs.map(n => n.title + ': ' + (n.message || '')).join('. ') : '';

    return jsonResponse({
      orders_summary: ordersSummary,
      orders_detail: orders.slice(0, 20).map(o => ({
        number: o.order_number, client: o.client_name, status: o.status, stage: o.stage, delivery: o.delivery_date, total: o.total_price
      })),
      leads_today: leadsSummary,
      equipment: equipSummary,
      stock_alerts: stockSummary,
      recent_notifications: notifSummary,
    });
  } catch (e) {
    return jsonResponse({ orders_summary: 'Нет данных', leads_today: '', equipment: '', stock_alerts: '' });
  }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

async function handleChat(request, env) {
  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const body = await request.json();
  const { messages, system_type = 'internal', order_details = null } = body;
  if (!messages || !Array.isArray(messages)) return errorResponse('messages required');

  // Fetch context
  let contextText = '';
  try {
    const ctx = await getChatContext(env);
    const ctxData = await ctx.json();
    if (system_type === 'internal') {
      contextText = `КОНТЕКСТ СИСТЕМЫ (данные на ${new Date().toISOString().slice(0, 10)}):\n` +
        `Заказы: ${ctxData.orders_summary}\n` +
        `Лиды: ${ctxData.leads_today}\n` +
        `Оборудование: ${ctxData.equipment}\n` +
        `Склад: ${ctxData.stock_alerts}\n`;
      if (ctxData.orders_detail && ctxData.orders_detail.length > 0) {
        contextText += `\nДетали заказов:\n` + ctxData.orders_detail.map(o =>
          `${o.number} — ${o.client} — этап: ${o.stage} — статус: ${o.status} — сумма: ${o.total?.toLocaleString('ru')} ₸ — срок: ${o.delivery || 'не указан'}`
        ).join('\n');
      }
    }
  } catch {}

  let systemPrompt = '';
  if (system_type === 'internal') {
    systemPrompt = `Ты внутренний ассистент мебельной компании FurnFlow (г. Актобе, Казахстан).
У тебя есть доступ к базе данных заказов, клиентов, каталогу материалов и бизнес-правилам.
Отвечай кратко и по делу. Используй данные из контекста. Не выдумывай данные если их нет.
Язык: русский.

${contextText}`;
  } else {
    systemPrompt = `Ты вежливый ассистент мебельной компании FurnFlow.
${order_details ? `Клиент спрашивает про свой заказ:\n${JSON.stringify(order_details, null, 2)}` : ''}
Отвечай по-русски, дружелюбно, кратко. Если клиент хочет что-то изменить в заказе — скажи, что передашь пожелание менеджеру.
Контакты: +7 (701) 000-00-00, WhatsApp доступен.`;
  }

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.slice(-10), // Last 10 messages for context
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    return errorResponse(`AI error ${aiRes.status}: ${errText}`, 502);
  }

  const aiData = await aiRes.json();
  const reply = aiData.content?.[0]?.text || 'Извините, не смог ответить.';
  return jsonResponse({ reply });
}

// ─── Final photos ─────────────────────────────────────────────────────────────

async function saveFinalPhotos(id, request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { photos } = body;
  if (!Array.isArray(photos)) return errorResponse('photos array required');

  await env.DB.prepare(`UPDATE orders SET final_photos_json = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(JSON.stringify(photos), id).run();

  // If 2+ photos and order is at Монтаж stage — add history note
  if (photos.length >= 2) {
    const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
    if (order) {
      await addHistory(id, order.stage, `Загружен финальный фотоотчёт (${photos.length} фото)`,
        body.uploaded_by || 'Монтажник', 'installer', '', env);
    }
  }

  return jsonResponse({ success: true, count: photos.length });
}

async function getFinalPhotos(id, env) {
  await ensureSchema(env);
  const order = await env.DB.prepare('SELECT final_photos_json FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);
  const photos = order.final_photos_json ? JSON.parse(order.final_photos_json) : [];
  return jsonResponse(photos);
}

// ─── AI: Logo color analysis ───────────────────────────────────────────────────

async function analyzeLogoColors(request, env) {
  if (!env.ANTHROPIC_API_KEY) return errorResponse('ANTHROPIC_API_KEY not configured', 500);

  const body = await request.json();
  const { image } = body;
  if (!image) return errorResponse('No image provided');

  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return errorResponse('Invalid image format — expected data URL');
  const [, mediaType, base64Data] = match;

  const DEFAULTS = { primary_color: '#0062d1', accent_color: '#0a7df5', text_color: '#ffffff', company_style: 'modern' };

  // SVG cannot be processed as vision — return defaults
  if (mediaType === 'image/svg+xml') return jsonResponse(DEFAULTS);

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(mediaType)) return jsonResponse(DEFAULTS);

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Analyze this company logo and extract branding colors. Return ONLY valid JSON (no markdown): {"primary_color":"#hex - the most dominant brand color","accent_color":"#hex - secondary/complementary color","text_color":"#hex - best text color for contrast (dark or light, e.g. #ffffff or #1e293b)","company_style":"modern|classic|minimal|bold"}' },
        ],
      }],
    }),
  });

  if (!anthropicRes.ok) return jsonResponse(DEFAULTS);

  const aiData = await anthropicRes.json();
  const text = (aiData.content?.[0]?.text || '').trim();
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const colors = JSON.parse(jsonMatch[0]);
      const hexRe = /^#[0-9a-fA-F]{6}$/;
      const STYLES = ['modern', 'classic', 'minimal', 'bold'];
      return jsonResponse({
        primary_color:  hexRe.test(colors.primary_color)  ? colors.primary_color  : DEFAULTS.primary_color,
        accent_color:   hexRe.test(colors.accent_color)   ? colors.accent_color   : DEFAULTS.accent_color,
        text_color:     hexRe.test(colors.text_color)     ? colors.text_color     : DEFAULTS.text_color,
        company_style:  STYLES.includes(colors.company_style) ? colors.company_style : 'modern',
      });
    }
  } catch {}
  return jsonResponse(DEFAULTS);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return await env.DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first() || null;
  } catch {
    return null;
  }
}

async function registerCompany(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { company_name, manager_name, email, password } = body;
  if (!company_name || !manager_name || !email || !password)
    return errorResponse('Все поля обязательны');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return errorResponse('Email уже используется', 409);

  const company_id = crypto.randomUUID();
  const user_id    = crypto.randomUUID();
  const token      = crypto.randomUUID();
  const password_hash = await hashPassword(password);
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO companies (id, name, created_at) VALUES (?, ?, ?)
  `).bind(company_id, company_name, now).run();

  await env.DB.prepare(`
    INSERT INTO users (id, name, role, email, password_hash, company_id, is_active, created_at)
    VALUES (?, ?, 'Руководитель', ?, ?, ?, 1, ?)
  `).bind(user_id, manager_name, email, password_hash, company_id, now).run();

  await env.DB.prepare(`
    INSERT INTO sessions (token, user_id, company_id, role, name, created_at)
    VALUES (?, ?, ?, 'Руководитель', ?, ?)
  `).bind(token, user_id, company_id, manager_name, now).run();

  return jsonResponse({ token, role: 'Руководитель', company_id, name: manager_name }, 201);
}

async function loginUser(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const { email, password } = body;
  if (!email || !password) return errorResponse('Email и пароль обязательны');

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return errorResponse('Неверный email или пароль', 401);

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) return errorResponse('Неверный email или пароль', 401);

  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sessions (token, user_id, company_id, role, name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(token, user.id, user.company_id || null, user.role, user.name, now).run();

  return jsonResponse({ token, role: user.role, company_id: user.company_id, name: user.name });
}

async function createEmployee(request, env) {
  await ensureSchema(env);
  const session = await verifyToken(request, env);
  if (!session) return errorResponse('Unauthorized', 401);

  const body = await request.json();
  const { name, role, email, password } = body;
  if (!name || !email || !password) return errorResponse('Имя, email и пароль обязательны');

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return errorResponse('Email уже используется', 409);

  const user_id = crypto.randomUUID();
  const password_hash = await hashPassword(password);
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO users (id, name, role, email, password_hash, company_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(user_id, name, role || 'Менеджер', email, password_hash, session.company_id, now).run();

  return jsonResponse({ id: user_id, name, role: role || 'Менеджер' }, 201);
}

async function demoLogin(request, env) {
  await ensureSchema(env);
  const url  = new URL(request.url);
  const role = url.searchParams.get('role');
  if (!role) return errorResponse('role is required');

  // Find any existing user with this role (prefer demo users)
  let user = await env.DB.prepare(
    "SELECT * FROM users WHERE role = ? LIMIT 1"
  ).bind(role).first();

  // Create demo user if none exists
  if (!user) {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const demoEmail = `demo.${Date.now()}@furnflow.demo`;
    const demoHash  = await hashPassword('demo1234');
    await env.DB.prepare(`
      INSERT INTO users (id, name, role, email, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(userId, `Демо (${role})`, role, demoEmail, demoHash, now).run();
    user = { id: userId, name: `Демо (${role})`, role, company_id: null };
  }

  const token = crypto.randomUUID();
  const now   = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO sessions (token, user_id, company_id, role, name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(token, user.id, user.company_id || null, user.role, user.name, now).run();

  return jsonResponse({ token, role: user.role, company_id: user.company_id || null, name: user.name });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      console.error(err);
      return jsonResponse({ error: 'Internal server error', details: err.message }, 500);
    }
  },
};
