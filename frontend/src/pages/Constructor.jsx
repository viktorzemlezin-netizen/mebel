import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, CheckCircle, Layers, Wrench, Package, Sparkles, ChevronRight,
  Plus, X, Search, ShoppingCart, Save, Loader2, ChevronDown, Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/constants.js';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from '../data/catalog.js';
import { api } from '../utils/api.js';
import SmartDeadline from '../components/SmartDeadline.jsx';

// --- Config data ---

const FURNITURE_TYPES = ['Кухня', 'Шкаф-купе', 'Гардеробная', 'Прихожая', 'Детская', 'Спальня'];

const CORPUS = [
  { id: 'ldsp16', name: 'ЛДСП Egger 16мм',  price: 4500,  desc: 'Бюджетно и практично' },
  { id: 'ldsp18', name: 'ЛДСП Egger 18мм',  price: 5500,  desc: 'Повышенная прочность' },
  { id: 'mdf',    name: 'МДФ крашеный',     price: 12000, desc: 'Премиум класс' },
];

const FACADES = [
  { id: 'pvh',   name: 'Плёнка ПВХ',      price: 3500,  desc: 'Практично, легко моется' },
  { id: 'emal',  name: 'Эмаль матовая',   price: 8500,  desc: 'Стильный современный вид' },
  { id: 'shpon', name: 'Шпон натуральный', price: 15000, desc: 'Натуральное дерево' },
];

const HARDWARE = [
  { id: 'hettich', name: 'Hettich', coef: 1.0, desc: 'Немецкое качество' },
  { id: 'hafele',  name: 'Häfele',  coef: 1.3, desc: 'Премиум фурнитура' },
  { id: 'blum',    name: 'Blum',    coef: 1.8, desc: 'Австрийский топ' },
];

const FILLINGS = [
  { id: 'drawers', name: 'Выдвижные ящики',   price: 15000, unitLabel: '₸/шт',  icon: '🗄️' },
  { id: 'dampers', name: 'Мягкие доводчики',  price: 500,   unitLabel: '₸/шт',  icon: '🤫' },
  { id: 'led',     name: 'Подсветка LED',      price: 8000,  unitLabel: '₸/м',   icon: '💡' },
  { id: 'mirrors', name: 'Зеркальные элементы',price: 12000, unitLabel: '₸/шт',  icon: '🪞' },
];

const PRESETS = [
  {
    id: 'econom',
    name: 'ЭКОНОМ',
    corpus: 'ldsp16', facade: 'pvh', hardware: 'hettich',
    badge: '💚 Выгодно',
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ring: 'ring-emerald-400',
  },
  {
    id: 'standart',
    name: 'СТАНДАРТ',
    corpus: 'ldsp18', facade: 'emal', hardware: 'hafele',
    badge: '⭐ Популярно',
    gradient: 'from-brand-50 to-blue-50',
    border: 'border-brand-200',
    accent: 'text-brand-700',
    btn: 'bg-brand-600 hover:bg-brand-700 text-white',
    ring: 'ring-brand-400',
    featured: true,
  },
  {
    id: 'premium',
    name: 'ПРЕМИУМ',
    corpus: 'mdf', facade: 'shpon', hardware: 'blum',
    badge: '👑 Топ качество',
    gradient: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    accent: 'text-purple-700',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
    ring: 'ring-purple-400',
  },
];

// --- Calculation ---

function calcVariant(preset, dims, fillingQtys, catalogOptions) {
  const w = parseFloat(dims.width)  || 0;
  const h = parseFloat(dims.height) || 0;
  const d = parseFloat(dims.depth)  || 0;
  if (!w || !h || !d) return null;

  const corpusM2 = ((2 * h * d) + (2 * w * d) + (w * h)) / 10000 * 0.72;
  const facadeM2 = (w * h) / 10000 * 0.82;

  const corpus  = CORPUS.find(c => c.id === preset.corpus);
  const facade  = FACADES.find(f => f.id === preset.facade);
  const hw      = HARDWARE.find(h => h.id === preset.hardware);

  const corpusCost = Math.round(corpusM2 * corpus.price);
  const facadeCost = Math.round(facadeM2 * facade.price);
  const hwCost     = Math.round((corpusCost + facadeCost) * 0.18 * hw.coef);

  let fillingCost = 0;
  const fillingLines = [];
  for (const f of FILLINGS) {
    const qty = fillingQtys[f.id] || 0;
    if (qty > 0) {
      const cost = f.price * qty;
      fillingCost += cost;
      fillingLines.push({ name: f.name, qty, cost });
    }
  }

  let optionsCost = 0;
  for (const opt of catalogOptions) {
    optionsCost += opt.price * opt.qty;
  }

  const total = corpusCost + facadeCost + hwCost + Math.round(fillingCost) + Math.round(optionsCost);

  return {
    total,
    corpusCost, facadeCost, hwCost,
    fillingCost: Math.round(fillingCost),
    optionsCost: Math.round(optionsCost),
    corpusM2: corpusM2.toFixed(2),
    facadeM2: facadeM2.toFixed(2),
    corpus, facade, hw,
    fillingLines,
  };
}

// --- Catalog Modal ---

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format';

const CATEGORY_PHOTOS = {
  'фурнитура':   'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400&h=300&fit=crop&auto=format',
  'ручки':       'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop&auto=format',
  'столешницы':  'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop&auto=format',
  'плиты':       'https://images.unsplash.com/photo-1565014603-e8d7a9e76a02?w=400&h=300&fit=crop&auto=format',
  'кромка':      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop&auto=format',
  'подсветка':   'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=300&fit=crop&auto=format',
  'мойки':       'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop&auto=format',
  'зеркала':     'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?w=400&h=300&fit=crop&auto=format',
  'аксессуары':  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop&auto=format',
  'хранение':    'https://images.unsplash.com/photo-1558997519-83ea9252eef8?w=400&h=300&fit=crop&auto=format',
};

function getCategoryPhoto(category) {
  if (!category) return FALLBACK_PHOTO;
  const lower = category.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_PHOTOS)) {
    if (lower.includes(key)) return url;
  }
  return FALLBACK_PHOTO;
}

// D1 sidebar categories with keyword mapping
const D1_CATEGORIES = [
  { id: 'all',        label: 'Все',        icon: '📦' },
  { id: 'фурнитура',  label: 'Фурнитура',  icon: '🔩' },
  { id: 'плиты',      label: 'Плиты/ЛДСП', icon: '🪵' },
  { id: 'кромка',     label: 'Кромка',     icon: '📏' },
  { id: 'ручки',      label: 'Ручки',      icon: '🔑' },
  { id: 'подсветка',  label: 'Подсветка',  icon: '💡' },
  { id: 'столешницы', label: 'Столешницы', icon: '🪨' },
  { id: 'мойки',      label: 'Мойки',      icon: '🚿' },
  { id: 'погонные',   label: 'Погонные',   icon: '📐' },
  { id: 'аксессуары', label: 'Аксессуары', icon: '✨' },
  { id: 'другое',     label: 'Прочее',     icon: '📁' },
];

const CATEGORY_KEYWORDS = {
  'мойки':      ['мойка', 'sink'],
  'столешницы': ['столешниц', 'столешн', 'стол.', 'worktop'],
  'ручки':      ['ручк', 'профиль', 'gola', 'handle'],
  'подсветка':  ['подсветк', 'led', 'свет'],
  'фурнитура':  ['фурнитур', 'петл', 'навес', 'доводчик', 'направляющ', 'blum', 'hettich', 'hafele'],
  'плиты':      ['плит', 'лдсп', 'мдф', 'egger', 'kronospan'],
  'кромка':     ['кромк', 'edge'],
  'погонные':   ['погонн', 'карниз', 'плинтус', 'профил'],
  'аксессуары': ['аксессуар', 'корзин', 'лоток', 'органайз'],
};

function mapToCat(rawCat) {
  const lower = (rawCat || '').toLowerCase();
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return catId;
  }
  return 'другое';
}

function CatalogModal({ furnitureType, onAdd, onClose }) {
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('Все');
  const [liveItems, setLiveItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const availCats = CATALOG_CATEGORIES.filter(c => c.forTypes.includes(furnitureType));

  useEffect(() => {
    // For non-D1 mode, default to first available category
    if (availCats.length > 0) setActiveCat(availCats[0].id);
  }, [furnitureType]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    setLoadingItems(true);
    fetch('/api/catalog-items')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveItems(data);
          setActiveCat('all'); // default to "Все" in D1 mode
        } else {
          setLiveItems(null);
        }
      })
      .catch(() => setLiveItems(null))
      .finally(() => setLoadingItems(false));
  }, []);

  const usingLive = !!(liveItems && liveItems.length > 0);

  // Category counts (filtered by current brand)
  const categoryCounts = useMemo(() => {
    if (!usingLive) return {};
    const brandFiltered = brandFilter === 'Все'
      ? liveItems
      : liveItems.filter(i => i.supplier?.toLowerCase().includes(brandFilter.toLowerCase()));
    const counts = { all: brandFiltered.length };
    for (const item of brandFiltered) {
      const cat = mapToCat(item.category);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [liveItems, brandFilter, usingLive]);

  // Brand counts (filtered by current category)
  const brandCounts = useMemo(() => {
    if (!usingLive) return {};
    const catFiltered = (activeCat === 'all')
      ? liveItems
      : liveItems.filter(i => mapToCat(i.category) === activeCat);
    const counts = {};
    for (const item of catFiltered) {
      const b = item.supplier || '';
      if (b) counts[b] = (counts[b] || 0) + 1;
    }
    return counts;
  }, [liveItems, activeCat, usingLive]);

  // Unique brands (by presence in current category)
  const allBrands = useMemo(() => {
    if (!usingLive) return [];
    return Object.keys(brandCounts).sort();
  }, [brandCounts, usingLive]);

  // Filtered items
  const items = useMemo(() => {
    let all;
    if (usingLive) {
      all = liveItems;
      // Brand filter: case-insensitive includes
      if (brandFilter !== 'Все') {
        all = all.filter(i => i.supplier?.toLowerCase().includes(brandFilter.toLowerCase()));
      }
      // Category filter
      if (activeCat && activeCat !== 'all') {
        all = all.filter(i => mapToCat(i.category) === activeCat);
      }
    } else {
      all = CATALOG_ITEMS[activeCat] || [];
    }
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.desc || i.article || '').toLowerCase().includes(q) ||
      (i.supplier || '').toLowerCase().includes(q)
    );
  }, [activeCat, search, liveItems, brandFilter, usingLive]);

  // Sidebar: for D1 mode use D1_CATEGORIES filtered to those with items
  const sidebarCats = usingLive
    ? D1_CATEGORIES.filter(cat => cat.id === 'all' || (categoryCounts[cat.id] || 0) > 0)
    : availCats;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/60" onClick={onClose}>
      <div
        className="relative m-auto w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-100">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Каталог опций</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-400">для {furnitureType}</p>
                {loadingItems ? (
                  <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">Загрузка...</span>
                ) : usingLive ? (
                  <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">📦 {liveItems.length} позиций в базе</span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">📋 Демо-каталог</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 w-52"
                  placeholder="Поиск..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Brand filter row — only for D1 mode */}
          {usingLive && (
            <div className="flex items-center gap-1.5 px-5 pb-3 overflow-x-auto scrollbar-none">
              {['Все', ...allBrands].map(brand => {
                const count = brand === 'Все' ? categoryCounts.all : brandCounts[brand];
                return (
                  <button
                    key={brand}
                    onClick={() => setBrandFilter(brand)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                      brandFilter === brand
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {brand}{count !== undefined ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-44 flex-shrink-0 border-r border-slate-100 py-3 overflow-y-auto">
            {sidebarCats.map(cat => {
              const count = usingLive ? (categoryCounts[cat.id] || 0) : null;
              const isActive = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 border-r-2 border-brand-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex-shrink-0">{cat.icon}</span>
                  <span className="flex-1 truncate">{cat.label}</span>
                  {count !== null && count > 0 && (
                    <span className={`text-[10px] font-semibold rounded-full px-1.5 flex-shrink-0 ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingItems ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Loader2 className="w-8 h-8 mb-2 animate-spin opacity-40" />
                <p className="text-sm">Загрузка каталога...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Search className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Ничего не найдено</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(item => {
                  const photo = item.photo_url || item.photo || getCategoryPhoto(item.category);
                  const description = item.article ? `Арт. ${item.article}` : (item.desc || '');
                  const isLiveItem = !!item.pricelist_id;
                  const hasMarkup = isLiveItem && item.base_price && item.base_price !== item.price;
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-sm transition-all group"
                    >
                      <div className="relative overflow-hidden bg-slate-100" style={{ height: 140 }}>
                        <img
                          src={photo}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={e => { e.target.src = FALLBACK_PHOTO; }}
                        />
                        {isLiveItem && (
                          <div className="absolute top-1.5 left-1.5">
                            <span className="text-[9px] bg-green-600 text-white rounded px-1.5 py-0.5 font-semibold">📦 база</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                        {item.supplier && (
                          <span className="inline-block text-[10px] bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 mt-0.5">{item.supplier}</span>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5 leading-tight line-clamp-2">{description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(item.price)}</p>
                            {hasMarkup ? (
                              <p className="text-[10px] text-slate-400">{formatCurrency(item.base_price)} база / {item.unit}</p>
                            ) : (
                              <p className="text-xs text-slate-400">/{item.unit}</p>
                            )}
                          </div>
                          <button
                            onClick={() => onAdd({ ...item, photo: photo, desc: description })}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Добавить
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function Constructor() {
  const { createOrder, showToast } = useApp();
  const navigate = useNavigate();

  const [furnitureType, setFurnitureType] = useState('Кухня');
  const [dims, setDims] = useState({ width: '300', height: '220', depth: '60' });
  const [fillingQtys, setFillingQtys] = useState({ drawers: 0, dampers: 0, led: 0, mirrors: 0 });
  const [selected, setSelected] = useState(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState([]); // [{...item, qty}]
  const [saving, setSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  // Per-preset material overrides
  const [customMaterials, setCustomMaterials] = useState(
    Object.fromEntries(PRESETS.map(p => [p.id, { corpus: p.corpus, facade: p.facade, hardware: p.hardware }]))
  );
  const setMaterial = (presetId, field, value) =>
    setCustomMaterials(prev => ({ ...prev, [presetId]: { ...prev[presetId], [field]: value } }));

  const setDim = (k, v) => setDims(d => ({ ...d, [k]: v }));
  const setFilling = (id, v) => setFillingQtys(q => ({ ...q, [id]: Math.max(0, parseInt(v) || 0) }));

  const handleAddCatalogItem = useCallback((item) => {
    setCatalogOptions(prev => {
      const existing = prev.find(o => o.id === item.id);
      if (existing) {
        return prev.map(o => o.id === item.id ? { ...o, qty: o.qty + 1 } : o);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`${item.name} добавлен`);
    setCatalogOpen(false);
  }, [showToast]);

  const handleOptionQty = (id, delta) => {
    setCatalogOptions(prev =>
      prev.map(o => o.id === id ? { ...o, qty: Math.max(1, o.qty + delta) } : o)
    );
  };

  const handleOptionRemove = (id) => {
    setCatalogOptions(prev => prev.filter(o => o.id !== id));
  };

  const results = useMemo(() =>
    PRESETS.reduce((acc, p) => ({
      ...acc,
      [p.id]: calcVariant({ ...p, ...customMaterials[p.id] }, dims, fillingQtys, catalogOptions),
    }), {}),
    [dims, fillingQtys, catalogOptions, customMaterials]
  );

  const hasValidDims = parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0 && parseFloat(dims.depth) > 0;

  const handleSaveConfig = async (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    const result = results[presetId];
    if (!preset || !result) return;

    setSaving(true);
    try {
      const resp = await api.saveConfiguration({
        furniture_type: furnitureType,
        preset_id: presetId,
        dims,
        filling_qtys: fillingQtys,
        catalog_options: catalogOptions,
        total_price: result.total,
      });
      showToast(`Конфигурация сохранена (#${resp.id || '?'})`);
    } catch {
      showToast('Ошибка сохранения конфигурации');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    const result = results[presetId];
    if (!preset || !result) return;

    const custom  = customMaterials[presetId];
    const corpus  = CORPUS.find(c => c.id === custom.corpus)   || CORPUS.find(c => c.id === preset.corpus);
    const facade  = FACADES.find(f => f.id === custom.facade)  || FACADES.find(f => f.id === preset.facade);
    const hw      = HARDWARE.find(h => h.id === custom.hardware) || HARDWARE.find(h => h.id === preset.hardware);

    const optionLines = catalogOptions.map(o => `${o.name}: ${o.qty} ${o.unit}`);

    const desc = [
      `${furnitureType} — вариант ${preset.name}`,
      `Размеры: ${dims.width} × ${dims.height} × ${dims.depth} см`,
      `Корпус: ${corpus.name}`,
      `Фасады: ${facade.name}`,
      `Фурнитура: ${hw.name}`,
      ...result.fillingLines.map(l => `${l.name}: ${l.qty} шт.`),
      ...optionLines,
    ].join('\n');

    const order = await createOrder({
      client_name: '',
      product_type: furnitureType,
      description: desc,
      total_price: result.total,
      notes: `Создан через Конструктор. Вариант: ${preset.name}`,
    });

    showToast(`Заказ ${order.order_number} создан`);
    navigate(`/orders/${order.id}`);
  };

  const totalOptionsCost = catalogOptions.reduce((s, o) => s + o.price * o.qty, 0);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-brand-600" /> Конструктор мебели
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Рассчитайте стоимость в 3 вариантах — автоматически</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* === Left panel: inputs === */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Furniture type */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" /> Тип мебели
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {FURNITURE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => { setFurnitureType(t); setCatalogOptions([]); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                    furnitureType === t
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" /> Размеры (см)
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[['width', 'Ширина'], ['height', 'Высота'], ['depth', 'Глубина']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="label">{lbl}</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-sm text-center"
                    value={dims[k]}
                    onChange={e => setDim(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            {hasValidDims && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                Площадь фасада ≈ {((parseFloat(dims.width) * parseFloat(dims.height)) / 10000).toFixed(2)} м²
              </p>
            )}
          </div>

          {/* Fillings */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" /> Наполнение
            </h2>
            <div className="space-y-3">
              {FILLINGS.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 flex-shrink-0">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-tight">{f.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(f.price)} {f.unitLabel}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setFilling(f.id, (fillingQtys[f.id] || 0) - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm transition-colors"
                    >−</button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-900 tabular-nums">
                      {fillingQtys[f.id] || 0}
                    </span>
                    <button
                      onClick={() => setFilling(f.id, (fillingQtys[f.id] || 0) + 1)}
                      className="w-7 h-7 rounded-lg bg-brand-100 hover:bg-brand-200 text-brand-700 font-bold flex items-center justify-center text-sm transition-colors"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catalog options */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowOptions(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                Опции из каталога
                {catalogOptions.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold">
                    {catalogOptions.length}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showOptions ? '' : '-rotate-90'}`} />
              </button>
              <button
                onClick={() => setCatalogOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </button>
            </div>

            {showOptions && (
              <>
                {catalogOptions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Нажмите «Добавить» чтобы выбрать опции из каталога</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catalogOptions.map(opt => (
                      <div key={opt.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                        <img
                          src={opt.photo}
                          alt={opt.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{opt.name}</p>
                          <p className="text-xs text-slate-400">{formatCurrency(opt.price)}/{opt.unit}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOptionQty(opt.id, -1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs"
                          >−</button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 tabular-nums">{opt.qty}</span>
                          <button
                            onClick={() => handleOptionQty(opt.id, 1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 hover:bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs"
                          >+</button>
                          <button
                            onClick={() => handleOptionRemove(opt.id)}
                            className="ml-1 w-6 h-6 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">Итого опций:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(totalOptionsCost)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Smart Deadline */}
          {hasValidDims && (
            <SmartDeadline
              materials={catalogOptions.map(o => ({ name: o.name, category: o.category || '', supplier: o.supplier || '' }))}
              operations={[]}
              hardware={
                selected === 'blum' || catalogOptions.some(o => o.supplier && o.supplier.toLowerCase().includes('blum')) ? 'Blum' : ''
              }
            />
          )}
        </div>

        {/* === Right panel: 3 variant cards === */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3 варианта рассчитываются автоматически</span>
          </div>

          {!hasValidDims ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Calculator className="w-12 h-12 text-slate-200 mb-3" />
              <p className="font-medium">Введите размеры мебели</p>
              <p className="text-sm mt-1">Расчёт появится автоматически</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {PRESETS.map(preset => {
                const r = results[preset.id];
                const isSelected = selected === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelected(isSelected ? null : preset.id)}
                    className={`relative rounded-2xl border-2 bg-gradient-to-br ${preset.gradient} ${preset.border}
                      cursor-pointer transition-all duration-200 overflow-hidden
                      ${isSelected ? `ring-2 ${preset.ring} shadow-md` : 'hover:shadow-md'}`}
                  >
                    {preset.featured && (
                      <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
                        Популярный
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${preset.accent}`}>{preset.name}</span>
                            <span className="text-xs bg-white/60 rounded-full px-2 py-0.5 text-slate-600">{preset.badge}</span>
                          </div>
                          <p className={`text-2xl font-bold mt-1 ${preset.accent}`}>
                            {r ? formatCurrency(r.total) : '—'}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className={`w-5 h-5 ${preset.accent} flex-shrink-0 mt-1`} />
                        )}
                      </div>

                      {/* Composition — editable */}
                      {r && (
                        <div className="grid grid-cols-1 gap-1.5 mb-3">
                          {[
                            { label: 'Корпус',    field: 'corpus',   options: CORPUS,   cost: r.corpusCost, selected: customMaterials[preset.id].corpus },
                            { label: 'Фасады',   field: 'facade',   options: FACADES,  cost: r.facadeCost, selected: customMaterials[preset.id].facade },
                            { label: 'Фурнитура',field: 'hardware', options: HARDWARE, cost: r.hwCost,     selected: customMaterials[preset.id].hardware },
                          ].map(item => (
                            <div key={item.label} className="bg-white/60 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                              <p className="text-xs text-slate-500 w-16 flex-shrink-0">{item.label}</p>
                              <select
                                value={item.selected}
                                onClick={e => e.stopPropagation()}
                                onChange={e => { e.stopPropagation(); setMaterial(preset.id, item.field, e.target.value); }}
                                className="flex-1 text-xs font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer py-0.5 min-w-0"
                              >
                                {item.options.map(o => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </select>
                              <p className="text-xs text-slate-400 flex-shrink-0">{formatCurrency(item.cost)}</p>
                            </div>
                          ))}
                          {r.fillingCost > 0 && (
                            <div className="bg-white/60 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                              <p className="text-xs text-slate-500 w-16 flex-shrink-0">Наполнение</p>
                              <p className="text-xs font-semibold text-slate-700 flex-1">По выбору</p>
                              <p className="text-xs text-slate-400">{formatCurrency(r.fillingCost)}</p>
                            </div>
                          )}
                          {r.optionsCost > 0 && (
                            <div className="bg-white/60 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                              <p className="text-xs text-slate-500 w-16 flex-shrink-0">Опции</p>
                              <p className="text-xs font-semibold text-slate-700 flex-1">{catalogOptions.length} позиций</p>
                              <p className="text-xs text-slate-400">{formatCurrency(r.optionsCost)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Areas */}
                      {r && (
                        <p className="text-xs text-slate-400 mb-3">
                          Корпус {r.corpusM2} м² · Фасад {r.facadeM2} м²
                        </p>
                      )}

                      {/* Filling lines */}
                      {r && r.fillingLines.length > 0 && (
                        <div className="bg-white/40 rounded-lg px-3 py-2 mb-3 space-y-0.5">
                          {r.fillingLines.map(l => (
                            <div key={l.name} className="flex justify-between text-xs">
                              <span className="text-slate-600">{l.name} × {l.qty}</span>
                              <span className="font-medium text-slate-700">{formatCurrency(l.cost)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Catalog option thumbnails */}
                      {catalogOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {catalogOptions.map(opt => (
                            <div key={opt.id} className="relative group" title={`${opt.name} × ${opt.qty}`}>
                              <img
                                src={opt.photo}
                                alt={opt.name}
                                className="w-9 h-9 rounded-lg object-cover border-2 border-white shadow-sm"
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                              {opt.qty > 1 && (
                                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {opt.qty}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveConfig(preset.id); }}
                          disabled={saving}
                          className="flex-shrink-0 px-3 py-2.5 rounded-xl text-sm font-semibold border border-white/80 bg-white/50 hover:bg-white/80 text-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Сохранить
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreate(preset.id); }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${preset.btn}`}
                        >
                          Создать заказ <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Catalog modal */}
      {catalogOpen && (
        <CatalogModal
          furnitureType={furnitureType}
          onAdd={handleAddCatalogItem}
          onClose={() => setCatalogOpen(false)}
        />
      )}
    </div>
  );
}
