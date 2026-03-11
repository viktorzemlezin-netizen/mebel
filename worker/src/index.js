// FurnFlow Worker - Cloudflare Worker API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Router
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Orders
  if (path === '/api/orders' && method === 'GET') {
    return getOrders(request, env);
  }
  if (path === '/api/orders' && method === 'POST') {
    return createOrder(request, env);
  }
  if (path.match(/^\/api\/orders\/[\w-]+$/) && method === 'GET') {
    const id = path.split('/').pop();
    return getOrder(id, env);
  }
  if (path.match(/^\/api\/orders\/[\w-]+$/) && method === 'PUT') {
    const id = path.split('/').pop();
    return updateOrder(id, request, env);
  }
  if (path.match(/^\/api\/orders\/[\w-]+\/status$/) && method === 'PUT') {
    const id = path.split('/')[3];
    return updateOrderStatus(id, request, env);
  }

  // Client portal - get order by token
  if (path.match(/^\/api\/portal\/[\w-]+$/) && method === 'GET') {
    const token = path.split('/').pop();
    return getOrderByToken(token, env);
  }

  // Notifications
  if (path.match(/^\/api\/orders\/[\w-]+\/notifications$/) && method === 'GET') {
    const id = path.split('/')[3];
    return getNotifications(id, env);
  }

  // Stats / financial summary
  if (path === '/api/stats' && method === 'GET') {
    return getStats(env);
  }

  // Seed data
  if (path === '/api/seed' && method === 'POST') {
    return seedData(env);
  }

  // AI photo analysis (single)
  if (path === '/api/analyze-photo' && method === 'POST') {
    return analyzePhoto(request, env);
  }

  // AI room analysis (multi-photo)
  if (path === '/api/analyze-room' && method === 'POST') {
    return analyzeRoom(request, env);
  }

  // Measurements persistence
  if (path === '/api/save-measurement' && method === 'POST') {
    return saveMeasurement(request, env);
  }
  if (path.match(/^\/api\/get-measurement\/[\w-]+$/) && method === 'GET') {
    const id = path.split('/').pop();
    return getMeasurement(id, env);
  }

  return errorResponse('Not found', 404);
}

// --- Handlers ---

async function getOrders(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let query = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(client_name LIKE ? OR order_number LIKE ? OR product_type LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse(result.results || []);
}

async function getOrder(id, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);

  const notifications = await env.DB.prepare(
    'SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(id).all();

  const payments = await env.DB.prepare(
    'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(id).all();

  return jsonResponse({
    ...order,
    notifications: notifications.results || [],
    payments: payments.results || [],
  });
}

async function createOrder(request, env) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const orderNumber = 'ФФ-' + String(Math.floor(Math.random() * 9000) + 1000);

  await env.DB.prepare(`
    INSERT INTO orders (id, order_number, client_name, client_phone, client_email,
      product_type, description, status, progress, stage, total_price, paid_amount,
      portal_token, notes, created_at, updated_at, delivery_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 0, 'Замер', ?, 0, ?, ?, datetime('now'), datetime('now'), ?)
  `).bind(
    id, orderNumber, body.client_name, body.client_phone || '', body.client_email || '',
    body.product_type, body.description || '', body.total_price || 0,
    token, body.notes || '', body.delivery_date || null
  ).run();

  await addNotification(id, 'Заказ создан', `Заказ ${orderNumber} успешно создан`, env);

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(order, 201);
}

async function updateOrder(id, request, env) {
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE orders SET
      client_name = COALESCE(?, client_name),
      client_phone = COALESCE(?, client_phone),
      client_email = COALESCE(?, client_email),
      product_type = COALESCE(?, product_type),
      description = COALESCE(?, description),
      notes = COALESCE(?, notes),
      total_price = COALESCE(?, total_price),
      paid_amount = COALESCE(?, paid_amount),
      delivery_date = COALESCE(?, delivery_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.client_name || null, body.client_phone || null, body.client_email || null,
    body.product_type || null, body.description || null, body.notes || null,
    body.total_price || null, body.paid_amount || null, body.delivery_date || null,
    id
  ).run();

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(order);
}

const STAGES = ['Замер', 'Проект', 'Производство', 'Покраска', 'Монтаж'];
const STAGE_PROGRESS = { 'Замер': 10, 'Проект': 30, 'Производство': 55, 'Покраска': 75, 'Монтаж': 90 };
const STATUS_LABELS = { 'new': 'Новый', 'in_progress': 'В работе', 'ready': 'Готов', 'delivered': 'Доставлен', 'cancelled': 'Отменён' };

async function updateOrderStatus(id, request, env) {
  const body = await request.json();
  const { status, stage, progress, message } = body;

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) return errorResponse('Order not found', 404);

  const newStage = stage || order.stage;
  const newProgress = progress !== undefined ? progress :
    (stage ? STAGE_PROGRESS[stage] : order.progress);
  const newStatus = status || order.status;

  await env.DB.prepare(`
    UPDATE orders SET status = ?, stage = ?, progress = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newStatus, newStage, newProgress, id).run();

  // Auto notification
  let notifMessage = message || '';
  if (stage && stage !== order.stage) {
    notifMessage = notifMessage || `Этап изменён: ${order.stage} → ${stage}`;
  }
  if (status && status !== order.status) {
    notifMessage = notifMessage || `Статус изменён: ${STATUS_LABELS[order.status] || order.status} → ${STATUS_LABELS[status] || status}`;
  }
  if (notifMessage) {
    await addNotification(id, 'Обновление заказа', notifMessage, env);
  }

  const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return jsonResponse(updated);
}

async function getOrderByToken(token, env) {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE portal_token = ?').bind(token).first();
  if (!order) return errorResponse('Order not found', 404);

  const notifications = await env.DB.prepare(
    'SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(order.id).all();

  return jsonResponse({
    ...order,
    notifications: notifications.results || [],
  });
}

async function getNotifications(orderId, env) {
  const result = await env.DB.prepare(
    'SELECT * FROM notifications WHERE order_id = ? ORDER BY created_at DESC'
  ).bind(orderId).all();
  return jsonResponse(result.results || []);
}

async function getStats(env) {
  const total = await env.DB.prepare('SELECT COUNT(*) as count, SUM(total_price) as revenue, SUM(paid_amount) as paid FROM orders').first();
  const byStatus = await env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
  ).all();
  const byStage = await env.DB.prepare(
    'SELECT stage, COUNT(*) as count FROM orders WHERE status = "in_progress" GROUP BY stage'
  ).all();

  return jsonResponse({
    total_orders: total.count || 0,
    total_revenue: total.revenue || 0,
    total_paid: total.paid || 0,
    by_status: byStatus.results || [],
    by_stage: byStage.results || [],
  });
}

async function analyzePhoto(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return errorResponse('ANTHROPIC_API_KEY not configured', 500);
  }

  const body = await request.json();
  const { image, productType } = body;

  if (!image) return errorResponse('No image provided');

  // Parse data URL → base64 + media type
  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return errorResponse('Invalid image format — expected data URL');

  const [, mediaType, base64Data] = match;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mediaType)) {
    return errorResponse(`Unsupported image type: ${mediaType}`);
  }

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
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      stream: false,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return errorResponse(`Anthropic API error ${anthropicRes.status}: ${errText}`, 502);
  }

  const aiData = await anthropicRes.json();
  const text = aiData.content?.[0]?.text || '';

  // Strip markdown code blocks and extract JSON
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return jsonResponse({
        annotations:  parsed.annotations  || [],
        measurements: parsed.measurements || [],
        warnings:     parsed.warnings     || [],
      });
    }
  } catch (parseErr) {
    console.error('JSON parse failed. Raw AI response:', text);
    console.error('Parse error:', parseErr.message);
  }

  // Fallback: minimal response
  console.error('AI response could not be parsed. stop_reason:', aiData.stop_reason, 'text length:', text.length);
  return jsonResponse({ annotations: [], measurements: [], warnings: [`Не удалось разобрать ответ ИИ: ${text.slice(0, 100)}`] });
}

// ─── Multi-photo room analysis ────────────────────────────────────────────────

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

  const stepLabels = {
    entrance: 'Фото с порога (общий вид)',
    wall:     'Фото стены под мебель (фронтально)',
    corners:  'Фото угла комнаты',
    windows:  'Фото окна/проёма',
    obstacles:'Фото препятствия (батарея/труба/розетка)',
  };
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
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      stream: false,
      messages: [{ role: 'user', content }],
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
      const result = {
        room_summary: parsed.room_summary || null,
        annotations:  parsed.annotations  || [],
        measurements: parsed.measurements || [],
        warnings:     parsed.warnings     || [],
      };
      roomAnalysisCache.set(cacheKey, { result, timestamp: Date.now() });
      return jsonResponse(result);
    }
  } catch (parseErr) {
    console.error('analyzeRoom JSON parse failed. Raw:', text.slice(0, 500));
    console.error('Parse error:', parseErr.message);
  }

  console.error('analyzeRoom: could not parse. stop_reason:', aiData.stop_reason, 'length:', text.length);
  return jsonResponse({ room_summary: null, annotations: [], measurements: [], warnings: ['Не удалось разобрать ответ ИИ'] });
}

async function ensureMeasurementsTable(env) {
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
}

async function saveMeasurement(request, env) {
  const body = await request.json();
  const { order_id, photos, measurements, room_summary, completed_at, measurer_name } = body;
  if (!order_id) return errorResponse('order_id is required');

  await ensureMeasurementsTable(env);

  const photosJson = JSON.stringify(photos || []);
  const measurementsJson = JSON.stringify(measurements || {});
  const roomSummaryJson = JSON.stringify(room_summary || null);
  const completedAtVal = completed_at || new Date().toISOString();

  const existing = await env.DB.prepare('SELECT id FROM measurements WHERE order_id = ?').bind(order_id).first();
  if (existing) {
    await env.DB.prepare(`
      UPDATE measurements SET
        photos_json = ?,
        measurements_json = ?,
        room_summary_json = ?,
        completed_at = ?,
        measurer_name = ?
      WHERE order_id = ?
    `).bind(photosJson, measurementsJson, roomSummaryJson, completedAtVal, measurer_name || null, order_id).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO measurements (order_id, photos_json, measurements_json, room_summary_json, completed_at, measurer_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(order_id, photosJson, measurementsJson, roomSummaryJson, completedAtVal, measurer_name || null).run();
  }

  return jsonResponse({ success: true });
}

async function getMeasurement(orderId, env) {
  await ensureMeasurementsTable(env);

  const row = await env.DB.prepare('SELECT * FROM measurements WHERE order_id = ?').bind(orderId).first();
  if (!row) return jsonResponse(null);

  return jsonResponse({
    ...row,
    photos: JSON.parse(row.photos_json || '[]'),
    measurements: JSON.parse(row.measurements_json || '{}'),
    room_summary: JSON.parse(row.room_summary_json || 'null'),
  });
}

async function addNotification(orderId, title, message, env) {
  await env.DB.prepare(`
    INSERT INTO notifications (id, order_id, title, message, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).bind(crypto.randomUUID(), orderId, title, message).run();
}

async function seedData(env) {
  // Create tables first
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      product_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'new',
      progress INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'Замер',
      total_price REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      portal_token TEXT UNIQUE,
      notes TEXT,
      delivery_date TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      title TEXT,
      message TEXT,
      created_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      amount REAL,
      type TEXT,
      note TEXT,
      created_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `).run();

  await ensureMeasurementsTable(env);

  const orders = [
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1001', client_name: 'Иванова Мария Сергеевна',
      client_phone: '+7 (903) 123-45-67', client_email: 'ivanova@mail.ru',
      product_type: 'Кухонный гарнитур', description: 'Угловая кухня в стиле модерн, белый глянец, столешница под мрамор, 3.2 × 2.1 м',
      status: 'in_progress', progress: 55, stage: 'Производство',
      total_price: 185000, paid_amount: 92500, delivery_date: '2026-04-15',
      portal_token: 'abc123def456gh78', notes: 'Клиент просил усиленные петли на шкафах'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1002', client_name: 'Петров Александр Николаевич',
      client_phone: '+7 (916) 234-56-78', client_email: 'petrov.an@yandex.ru',
      product_type: 'Шкаф-купе', description: 'Встроенный шкаф-купе, 3 секции, зеркальные двери, внутренняя подсветка, 2.7 м',
      status: 'in_progress', progress: 75, stage: 'Покраска',
      total_price: 95000, paid_amount: 47500, delivery_date: '2026-03-28',
      portal_token: 'xyz789uvw012mn34', notes: 'Цвет корпуса — венге'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1003', client_name: 'Смирнова Елена Владимировна',
      client_phone: '+7 (925) 345-67-89', client_email: 'smirnova.ev@gmail.com',
      product_type: 'Детская комната', description: 'Мебель для детской: кровать-чердак, стол, стеллаж, шкаф. Тема — космос, синий + белый',
      status: 'in_progress', progress: 30, stage: 'Проект',
      total_price: 145000, paid_amount: 50000, delivery_date: '2026-05-10',
      portal_token: 'pqr321stu654vw98', notes: 'Дочь 7 лет, нужна безопасная конструкция'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1004', client_name: 'Козлов Дмитрий Андреевич',
      client_phone: '+7 (499) 456-78-90', client_email: 'kozlov@outlook.com',
      product_type: 'Гостиная', description: 'Стенка в гостиную с ТВ-нишей, витринами и закрытыми секциями. Цвет — дуб сонома',
      status: 'ready', progress: 100, stage: 'Монтаж',
      total_price: 120000, paid_amount: 120000, delivery_date: '2026-03-10',
      portal_token: 'lmn567opq890rs12', notes: 'Требуется профессиональный монтаж'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1005', client_name: 'Новикова Ольга Игоревна',
      client_phone: '+7 (903) 567-89-01', client_email: 'novikova.oi@mail.ru',
      product_type: 'Прихожая', description: 'Прихожая с зеркалом и вешалкой, тумба для обуви на 20 пар, крючки. Белый матовый',
      status: 'new', progress: 10, stage: 'Замер',
      total_price: 55000, paid_amount: 10000, delivery_date: '2026-04-30',
      portal_token: 'tuv234wxy567za89', notes: 'Узкий коридор 1.1 м'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1006', client_name: 'Морозов Иван Петрович',
      client_phone: '+7 (916) 678-90-12', client_email: 'morozov.ip@yandex.ru',
      product_type: 'Офисная мебель', description: 'Оснащение офиса: 6 рабочих мест, ресепшн, переговорная комната. Корпоративный стиль',
      status: 'in_progress', progress: 10, stage: 'Замер',
      total_price: 380000, paid_amount: 114000, delivery_date: '2026-06-01',
      portal_token: 'bcd890efg123hi45', notes: 'Юридическое лицо, нужен договор и счёт'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1007', client_name: 'Волкова Анастасия Романовна',
      client_phone: '+7 (925) 789-01-23', client_email: 'volkova.ar@gmail.com',
      product_type: 'Спальня', description: 'Спальный гарнитур: кровать 1.8×2 м, 2 тумбы, комод, шкаф 4-дверный. Итальянский орех',
      status: 'in_progress', progress: 90, stage: 'Монтаж',
      total_price: 210000, paid_amount: 210000, delivery_date: '2026-03-14',
      portal_token: 'jkl456mno789pq01', notes: 'Срочный заказ, клиент въезжает 15 марта'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1008', client_name: 'Зайцев Сергей Михайлович',
      client_phone: '+7 (499) 890-12-34', client_email: 'zaitsev.sm@outlook.com',
      product_type: 'Ванная комната', description: 'Тумба под раковину с двумя ящиками, зеркальный шкаф, стеллаж-этажерка. Влагостойкий ЛДСП',
      status: 'delivered', progress: 100, stage: 'Монтаж',
      total_price: 65000, paid_amount: 65000, delivery_date: '2026-03-05',
      portal_token: 'rst012uvw345xy67', notes: 'Установлено 5 марта. Клиент доволен'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1009', client_name: 'Лебедева Татьяна Юрьевна',
      client_phone: '+7 (903) 901-23-45', client_email: 'lebedeva.ty@mail.ru',
      product_type: 'Кухонный гарнитур', description: 'Прямая кухня 2.8 м, фасады МДФ эмаль серый, фурнитура Blum, встроенная техника',
      status: 'in_progress', progress: 55, stage: 'Производство',
      total_price: 155000, paid_amount: 77500, delivery_date: '2026-04-20',
      portal_token: 'zab678cde901fg23', notes: 'Мойка и смеситель за счёт клиента'
    },
    {
      id: crypto.randomUUID(), order_number: 'ФФ-1010', client_name: 'Соколов Андрей Викторович',
      client_phone: '+7 (916) 012-34-56', client_email: 'sokolov.av@yandex.ru',
      product_type: 'Библиотека / кабинет', description: 'Домашний кабинет: стеллаж на всю стену 3.5 м, письменный стол встроенный, тумба на колёсах',
      status: 'cancelled', progress: 10, stage: 'Замер',
      total_price: 175000, paid_amount: 0, delivery_date: null,
      portal_token: 'hij234klm567no89', notes: 'Отменён клиентом 10 марта — переезд отложен'
    },
  ];

  for (const order of orders) {
    const existing = await env.DB.prepare('SELECT id FROM orders WHERE order_number = ?').bind(order.order_number).first();
    if (!existing) {
      await env.DB.prepare(`
        INSERT INTO orders (id, order_number, client_name, client_phone, client_email,
          product_type, description, status, progress, stage, total_price, paid_amount,
          portal_token, notes, delivery_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now'))
      `).bind(
        order.id, order.order_number, order.client_name, order.client_phone, order.client_email,
        order.product_type, order.description, order.status, order.progress, order.stage,
        order.total_price, order.paid_amount, order.portal_token, order.notes, order.delivery_date,
        String(Math.floor(Math.random() * 60))
      ).run();

      // Add some notifications for each order
      const notifs = [
        { title: 'Заказ создан', message: `Заказ ${order.order_number} принят в работу` },
      ];
      if (order.progress >= 30) notifs.push({ title: 'Этап: Проект', message: 'Дизайн-проект согласован с клиентом' });
      if (order.progress >= 55) notifs.push({ title: 'Этап: Производство', message: 'Запущено изготовление мебели' });
      if (order.progress >= 75) notifs.push({ title: 'Этап: Покраска', message: 'Покраска и финишная отделка фасадов' });
      if (order.progress >= 90) notifs.push({ title: 'Этап: Монтаж', message: 'Выезд мастеров для монтажа' });
      if (order.status === 'delivered') notifs.push({ title: 'Заказ доставлен', message: 'Мебель установлена, акт подписан' });
      if (order.status === 'cancelled') notifs.push({ title: 'Заказ отменён', message: order.notes });

      for (const notif of notifs) {
        await env.DB.prepare(`
          INSERT INTO notifications (id, order_id, title, message, created_at)
          VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
        `).bind(crypto.randomUUID(), order.id, notif.title, notif.message, String(Math.floor(Math.random() * 72))).run();
      }
    }
  }

  return jsonResponse({ success: true, message: 'Тестовые данные загружены' });
}

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
