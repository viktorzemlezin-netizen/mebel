// Full workflow lifecycle
export const WORKFLOW_STAGES = [
  'Новый', 'Замер', 'Замер завершён', 'Проектирование',
  'Согласование', 'Производство', 'Готово', 'Монтаж', 'Завершён', 'Отменён',
];

// Legacy stage list for components that need a simple array
export const STAGES = ['Замер', 'Проект', 'Производство', 'Покраска', 'Монтаж'];

export const STAGE_PROGRESS = {
  'Новый':           0,
  'Замер':           10,
  'Замер завершён':  20,
  'Проектирование':  30,
  'Согласование':    45,
  'Производство':    60,
  'Готово':          80,
  'Монтаж':          90,
  'Завершён':        100,
  'Отменён':         0,
  // legacy
  'Проект':          30,
  'Покраска':        75,
};

export const STAGE_ICONS = {
  'Новый':           '🆕',
  'Замер':           '📐',
  'Замер завершён':  '✅',
  'Проектирование':  '✏️',
  'Согласование':    '🤝',
  'Производство':    '🔧',
  'Готово':          '📦',
  'Монтаж':          '🔩',
  'Завершён':        '🎉',
  'Отменён':         '❌',
  // legacy
  'Проект':          '✏️',
  'Покраска':        '🎨',
};

export const STAGE_COLORS = {
  'Новый':           'bg-slate-100 text-slate-700',
  'Замер':           'bg-amber-100 text-amber-700',
  'Замер завершён':  'bg-teal-100 text-teal-700',
  'Проектирование':  'bg-blue-100 text-blue-700',
  'Согласование':    'bg-purple-100 text-purple-700',
  'Производство':    'bg-orange-100 text-orange-700',
  'Готово':          'bg-emerald-100 text-emerald-700',
  'Монтаж':          'bg-cyan-100 text-cyan-700',
  'Завершён':        'bg-green-100 text-green-700',
  'Отменён':         'bg-red-100 text-red-600',
};

// Role → API role key
export const ROLE_KEY = {
  'Руководитель': 'manager',
  'Менеджер':     'manager',
  'Замерщик':     'measurer',
  'Дизайнер':     'designer',
  'Монтажник':    'installer',
  'Снабженец':    'supplier',
  'Технолог':     'technologist',
  'Сборщик':      'assembler',
  'Бухгалтер':    'accountant',
};

export const STATUSES = {
  new:         { label: 'Новый',     color: 'bg-slate-100 text-slate-700',     dot: 'bg-slate-400'   },
  in_progress: { label: 'В работе',  color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'    },
  ready:       { label: 'Готов',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  delivered:   { label: 'Доставлен', color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500'  },
  cancelled:   { label: 'Отменён',   color: 'bg-red-100 text-red-700',         dot: 'bg-red-400'     },
};

export const PHOTO_CATEGORIES = ['Замер', 'Дизайн-проект', 'В производстве', 'Готовое изделие'];

export const PRODUCT_TYPES = [
  'Кухонный гарнитур', 'Шкаф-купе', 'Гардеробная', 'Детская комната',
  'Гостиная', 'Прихожая', 'Офисная мебель', 'Спальня', 'Ванная комната',
  'Библиотека / кабинет', 'Другое',
];

// KZT format: "125 000 ₸"
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн назад`;
  return formatDateShort(dateStr);
};
