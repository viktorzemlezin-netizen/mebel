# FurnFlow — Система управления заказами мебели

Полнофункциональная платформа для мебельных компаний: ведение заказов, отслеживание этапов производства, портал клиента и финансовая аналитика.

## Стек технологий

| Слой | Технологии |
|------|-----------|
| Frontend | Vite + React 18 + Tailwind CSS |
| Backend | Cloudflare Workers |
| База данных | Cloudflare D1 (SQLite) |
| Хостинг | Cloudflare Pages |
| CI/CD | GitHub Actions |

## Возможности

- **Дашборд** — список заказов с номером, клиентом, типом, статусом и прогрессом
- **Прогресс-бар** с этапами: Замер → Проект → Производство → Покраска → Монтаж
- **Карточка заказа** — полные детали, редактирование, смена статуса/этапа
- **Фильтр по статусу** — Новый / В работе / Готов / Доставлен / Отменён
- **Портал клиента** — клиент видит свой заказ по уникальной ссылке
- **Журнал уведомлений** — автоматический лог изменений
- **Финансовая сводка** — оплата, долг, аналитика по заказам
- **10 тестовых заказов** на русском языке

---

## Локальная разработка

### Требования
- Node.js 18+
- npm

### Запуск frontend

```bash
cd frontend
npm install
npm run dev
# -> http://localhost:5173
```

### Запуск Worker (опционально)

```bash
npm install -g wrangler
wrangler login
wrangler d1 create furnflow-db
# Скопировать database_id в wrangler.toml

cd worker
npm install
wrangler dev
```

---

## Деплой на Cloudflare

### 1. Создать D1 базу данных

```bash
wrangler d1 create furnflow-db
# Скопировать database_id в wrangler.toml
```

### 2. Деплой Worker

```bash
cd worker
npm install
wrangler deploy
```

### 3. Загрузить тестовые данные

```bash
curl -X POST https://furnflow-worker.YOUR_ACCOUNT.workers.dev/api/seed
```

### 4. Деплой Frontend на Cloudflare Pages

```bash
cd frontend
npm install
VITE_API_URL=https://furnflow-worker.YOUR_ACCOUNT.workers.dev/api npm run build
npx wrangler pages deploy dist --project-name=furnflow
```

Или через Cloudflare Pages Dashboard:
1. Workers & Pages -> Create application -> Pages -> Connect to Git
2. Build command: `cd frontend && npm install && npm run build`
3. Build output directory: `frontend/dist`
4. Environment variable: `VITE_API_URL` = Worker URL

---

## GitHub Actions (CI/CD)

Добавьте секреты в настройках репозитория (Settings -> Secrets):

| Секрет | Описание |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | API токен (Pages + Workers + D1 Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | ID аккаунта Cloudflare |
| `VITE_API_URL` | URL Worker API |

Получить токен: dash.cloudflare.com -> My Profile -> API Tokens -> Create Token

---

## Структура проекта

```
mebel/
├── frontend/               # React (Vite + Tailwind)
│   └── src/
│       ├── components/     # UI компоненты
│       ├── pages/          # Страницы
│       ├── context/        # AppContext
│       └── utils/          # API клиент, константы
├── worker/
│   └── src/index.js        # Cloudflare Worker API + D1
├── wrangler.toml           # Cloudflare конфиг
└── .github/workflows/
    └── deploy.yml          # CI/CD
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/orders` | Список заказов |
| POST | `/api/orders` | Создать заказ |
| GET | `/api/orders/:id` | Детали заказа |
| PUT | `/api/orders/:id` | Обновить заказ |
| PUT | `/api/orders/:id/status` | Изменить статус/этап |
| GET | `/api/portal/:token` | Портал клиента |
| GET | `/api/stats` | Статистика |
| POST | `/api/seed` | Загрузить тест-данные |
