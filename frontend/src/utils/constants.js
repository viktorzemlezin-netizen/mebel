export const STAGES = ['Замер', 'Проект', 'Производство', 'Покраска', 'Монтаж'];

export const STAGE_PROGRESS = {
  'Замер': 10,
  'Проект': 30,
  'Производство': 55,
  'Покраска': 75,
  'Монтаж': 90,
};

export const STAGE_ICONS = {
  'Замер':       '📐',
  'Проект':      '✏️',
  'Производство':'🔧',
  'Покраска':    '🎨',
  'Монтаж':      '🔩',
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
  'Кухонный гарнитур',
  'Шкаф-купе',
  'Гардеробная',
  'Детская комната',
  'Гостиная',
  'Прихожая',
  'Офисная мебель',
  'Спальня',
  'Ванная комната',
  'Библиотека / кабинет',
  'Другое',
];

// KZT currency format: "125 000 ₸"
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(amount || 0);

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
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
