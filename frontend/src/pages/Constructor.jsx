import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle, Layers, Wrench, Package, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/constants.js';

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

function calcVariant(preset, dims, fillingQtys) {
  const w = parseFloat(dims.width)  || 0;
  const h = parseFloat(dims.height) || 0;
  const d = parseFloat(dims.depth)  || 0;
  if (!w || !h || !d) return null;

  // Surface area estimates (m²)
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

  const total = corpusCost + facadeCost + hwCost + Math.round(fillingCost);

  return {
    total,
    corpusCost, facadeCost, hwCost, fillingCost: Math.round(fillingCost),
    corpusM2: corpusM2.toFixed(2),
    facadeM2: facadeM2.toFixed(2),
    corpus, facade, hw,
    fillingLines,
  };
}

// --- Component ---

export default function Constructor() {
  const { createOrder, showToast } = useApp();
  const navigate = useNavigate();

  const [furnitureType, setFurnitureType] = useState('Кухня');
  const [dims, setDims] = useState({ width: '300', height: '220', depth: '60' });
  const [fillingQtys, setFillingQtys] = useState({ drawers: 0, dampers: 0, led: 0, mirrors: 0 });
  const [selected, setSelected] = useState(null); // preset id

  const setDim = (k, v) => setDims(d => ({ ...d, [k]: v }));
  const setFilling = (id, v) => setFillingQtys(q => ({ ...q, [id]: Math.max(0, parseInt(v) || 0) }));

  const results = useMemo(() =>
    PRESETS.reduce((acc, p) => ({ ...acc, [p.id]: calcVariant(p, dims, fillingQtys) }), {}),
    [dims, fillingQtys]
  );

  const hasValidDims = parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0 && parseFloat(dims.depth) > 0;

  const handleCreate = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    const result = results[presetId];
    if (!preset || !result) return;

    const corpus  = CORPUS.find(c => c.id === preset.corpus);
    const facade  = FACADES.find(f => f.id === preset.facade);
    const hw      = HARDWARE.find(h => h.id === preset.hardware);

    const desc = [
      `${furnitureType} — вариант ${preset.name}`,
      `Размеры: ${dims.width} × ${dims.height} × ${dims.depth} см`,
      `Корпус: ${corpus.name}`,
      `Фасады: ${facade.name}`,
      `Фурнитура: ${hw.name}`,
      ...result.fillingLines.map(l => `${l.name}: ${l.qty} шт.`),
    ].join('\n');

    const order = createOrder({
      client_name: '',
      product_type: furnitureType,
      description: desc,
      total_price: result.total,
      notes: `Создан через Конструктор. Вариант: ${preset.name}`,
    });

    showToast(`Заказ ${order.order_number} создан`);
    navigate(`/orders/${order.id}`);
  };

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
                  onClick={() => setFurnitureType(t)}
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

                      {/* Composition */}
                      {r && (
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          {[
                            { label: 'Корпус', value: r.corpus.name, cost: r.corpusCost },
                            { label: 'Фасады', value: r.facade.name, cost: r.facadeCost },
                            { label: 'Фурнитура', value: r.hw.name,  cost: r.hwCost },
                            ...(r.fillingCost > 0 ? [{ label: 'Наполнение', value: 'По выбору', cost: r.fillingCost }] : []),
                          ].map(item => (
                            <div key={item.label} className="bg-white/60 rounded-lg px-2.5 py-1.5">
                              <p className="text-xs text-slate-500">{item.label}</p>
                              <p className="text-xs font-semibold text-slate-700 leading-tight">{item.value}</p>
                              <p className="text-xs text-slate-400">{formatCurrency(item.cost)}</p>
                            </div>
                          ))}
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

                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreate(preset.id); }}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${preset.btn}`}
                      >
                        Создать заказ <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
