import React, { useState, useRef, useEffect } from 'react';
import { Ruler, Camera, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, ArrowRight, SkipForward, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatDateShort } from '../utils/constants.js';

const WORKER_URL = 'https://furnflow-worker.zemlezin-viktor.workers.dev';

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'entrance',
    label: 'Вход в помещение',
    icon: '🚪',
    required: true,
    multi: false,
    instruction: 'Встаньте в дверном проёме. Сфотографируйте всю комнату целиком. Должны быть видны все стены, пол и потолок.',
    hint: 'Держите телефон горизонтально. Отступите максимально назад.',
    quickTip: 'Встаньте в дверном проёме. Горизонтально. Все 3 стены в кадре.',
  },
  {
    id: 'wall',
    label: 'Стена под мебель',
    icon: '📐',
    required: true,
    multi: false,
    instruction: 'Подойдите к стене где будет стоять {furnitureType}. Сфотографируйте стену фронтально — от угла до угла, от пола до потолка.',
    hint: 'Станьте прямо напротив стены. Вся стена должна влезть в кадр.',
    quickTip: 'Прямо напротив стены. Параллельно. Вся стена от угла до угла. НЕ под углом!',
  },
  {
    id: 'corners',
    label: 'Углы комнаты',
    icon: '📏',
    required: true,
    multi: true,
    instruction: 'Сфотографируйте оба угла где сходятся стены. Левый угол — отдельное фото, правый угол — отдельное фото.',
    hint: 'Угол должен быть виден от пола до потолка. Нужно видеть стык двух стен.',
    quickTip: 'Левый угол отдельно. Правый угол отдельно. От пола до потолка.',
  },
  {
    id: 'windows',
    label: 'Окна и проёмы',
    icon: '🪟',
    required: false,
    multi: true,
    instruction: 'Сфотографируйте каждое окно, дверной проём, арку. Каждый объект — отдельное фото.',
    hint: 'Фотографируйте фронтально. Должен быть виден подоконник, откосы, расстояние до стен.',
    skipLabel: 'Нет окон в этой зоне',
    quickTip: 'Прямо напротив окна. Подоконник и откосы видны.',
  },
  {
    id: 'obstacles',
    label: 'Особые элементы',
    icon: '⚠️',
    required: false,
    multi: true,
    instruction: 'Сфотографируйте батареи, трубы, вентиляцию, электрощиток, розетки — всё что может помешать установке мебели.',
    hint: 'Если ничего нет — пропустите этот шаг.',
    skipLabel: 'Нет препятствий',
    quickTip: 'Батареи, трубы, розетки. Всё что мешает установке.',
  },
];

// ─── Canvas annotation rendering ──────────────────────────────────────────────

const COLOR_MAP = {
  white: '#FFFFFF', blue: '#3B82F6', red: '#EF4444',
  yellow: '#FBBF24', green: '#10B981', orange: '#F97316',
};

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % photos.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photos.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex(i => (i - 1 + photos.length) % photos.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % photos.length); }}
            className="absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <img
        src={photos[index]}
        alt=""
        className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

function drawArrowHead(ctx, x, y, angle, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - 0.4), y - size * Math.sin(angle - 0.4));
  ctx.lineTo(x - size * Math.cos(angle + 0.4), y - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

function labelBg(ctx, text, cx, cy, color) {
  ctx.font = 'bold 13px system-ui, sans-serif';
  const w = ctx.measureText(text).width;
  const pad = 5;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(cx - w / 2 - pad, cy - 11, w + pad * 2, 18, 3);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy - 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function renderAnnotations(canvas, annotations) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  for (const ann of annotations) {
    const color = COLOR_MAP[ann.color] || ann.color || '#FFFFFF';
    if (ann.type === 'arrow') {
      const x1 = (ann.x1 ?? 0.05) * W, y1 = (ann.y1 ?? 0.5) * H;
      const x2 = (ann.x2 ?? 0.95) * W, y2 = (ann.y2 ?? 0.5) * H;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color; ctx.fillStyle = color;
      ctx.lineWidth = 2.5; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      drawArrowHead(ctx, x2, y2, angle, 12);
      drawArrowHead(ctx, x1, y1, angle + Math.PI, 12);
      ctx.shadowBlur = 0;
      labelBg(ctx, ann.label || '', (x1 + x2) / 2, (y1 + y2) / 2 - 12, color);
    } else if (ann.type === 'box') {
      // Support both x1/y1/x2/y2 and x/y/w/h formats
      let bx, by, bw, bh;
      if (ann.x1 !== undefined) {
        bx = ann.x1 * W; by = ann.y1 * H;
        bw = (ann.x2 - ann.x1) * W; bh = (ann.y2 - ann.y1) * H;
      } else {
        bx = (ann.x ?? 0.1) * W; by = (ann.y ?? 0.1) * H;
        bw = (ann.w ?? 0.2) * W; bh = (ann.h ?? 0.3) * H;
      }
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
      ctx.strokeRect(bx, by, bw, bh); ctx.shadowBlur = 0;
      const cs = 10; ctx.lineWidth = 5;
      for (const [cx2, cy2, dx, dy] of [
        [bx, by, 1, 1], [bx+bw, by, -1, 1], [bx, by+bh, 1, -1], [bx+bw, by+bh, -1, -1]
      ]) {
        ctx.beginPath();
        ctx.moveTo(cx2 + dx*cs, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + dy*cs);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      const ly = by > 24 ? by - 6 : by + bh + 20;
      labelBg(ctx, ann.label || '', bx + bw / 2, ly, color);
    } else if (ann.type === 'point') {
      const px = (ann.x ?? 0.5) * W, py = (ann.y ?? 0.5) * H;
      const r = 15;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = (ann.color === 'yellow') ? '#000' : '#FFF';
      ctx.font = `bold ${r}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(ann.label || ann.number || '•'), px, py);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
  }
}

function AnnotatedPhoto({ imageDataUrl, annotations, onClick }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  useEffect(() => {
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !canvas) return;
    const draw = () => {
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      if (annotations?.length) renderAnnotations(canvas, annotations);
    };
    if (img.complete && img.naturalWidth > 0) draw(); else img.onload = draw;
  }, [imageDataUrl, annotations]);
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900 shadow-lg ${onClick ? 'cursor-zoom-in' : ''}`}
      onClick={onClick}
    >
      <img ref={imgRef} src={imageDataUrl} className="hidden" alt="" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="w-full rounded-2xl block" />
    </div>
  );
}

// ─── Photo step card ───────────────────────────────────────────────────────────

function PhotoSlot({ label, photo, onPhoto, onRemove, small }) {
  const fileRef = useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };
  if (photo) {
    return (
      <div className={`relative ${small ? 'w-20 h-20' : 'w-full aspect-video max-w-xs'} rounded-xl overflow-hidden bg-slate-900 flex-shrink-0`}>
        <img src={photo} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-end justify-between p-1.5">
          <span className="text-white text-xs font-medium drop-shadow leading-tight">{small ? '' : label}</span>
          <button
            onClick={onRemove}
            className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className={`${small ? 'w-20 h-20' : 'w-full aspect-video max-w-xs'} rounded-xl border-2 border-dashed border-slate-300
          hover:border-amber-400 bg-slate-50 hover:bg-amber-50 transition-all flex flex-col items-center justify-center gap-2
          text-slate-400 hover:text-amber-500 flex-shrink-0`}
      >
        <Camera className={small ? 'w-6 h-6' : 'w-8 h-8'} strokeWidth={1.5} />
        {!small && <span className="text-xs font-medium text-center px-2 leading-tight">{label}</span>}
      </button>
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </>
  );
}

// ─── Step: Photo collection ────────────────────────────────────────────────────

function PhotoCollectionStep({ stepIndex, step, furnitureType, photos, onAddPhoto, onRemovePhoto, onNext, onSkip }) {
  const canProceed = step.required ? photos.length > 0 : true;
  const instruction = step.instruction.replace('{furnitureType}', furnitureType || 'мебель');

  return (
    <div className="space-y-6">
      {/* Big step card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 flex items-start gap-4">
          <span className="text-4xl leading-none flex-shrink-0">{step.icon}</span>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Шаг {stepIndex + 1} из 5</p>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{step.label}</h2>
          </div>
        </div>
        {/* Instruction */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">{instruction}</p>
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
            <span className="text-slate-400 text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-slate-500 leading-relaxed">{step.hint}</p>
          </div>
        </div>

        {/* Quick tip card */}
        {step.quickTip && (
          <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg flex-shrink-0 leading-tight">{step.icon}</span>
            <p className="text-sm font-semibold text-amber-800 leading-snug">{step.quickTip}</p>
          </div>
        )}
        {/* Photo slots */}
        <div className="px-6 pb-5">
          {step.multi ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, i) => (
                  <PhotoSlot
                    key={i}
                    label={`Фото ${i + 1}`}
                    photo={photo}
                    onPhoto={() => {}}
                    onRemove={() => onRemovePhoto(i)}
                    small
                  />
                ))}
                <PhotoSlot
                  label={`Добавить фото`}
                  photo={null}
                  onPhoto={onAddPhoto}
                  onRemove={() => {}}
                  small
                />
              </div>
              {photos.length > 0 && (
                <p className="text-xs text-emerald-600 font-medium">{photos.length} {photos.length === 1 ? 'фото добавлено' : 'фото добавлено'} ✓</p>
              )}
            </div>
          ) : (
            <PhotoSlot
              label="Сфотографировать"
              photo={photos[0] || null}
              onPhoto={onAddPhoto}
              onRemove={() => onRemovePhoto(0)}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!step.required && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            {step.skipLabel || 'Пропустить'}
          </button>
        )}
        <button
          disabled={!canProceed}
          onClick={onNext}
          className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
            ${canProceed
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          {stepIndex < 4 ? (
            <><ArrowRight className="w-4 h-4" />Следующий шаг</>
          ) : (
            <><CheckCircle className="w-4 h-4" />Анализировать фото</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Phase: Analyzing ─────────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  'Определяю размеры...',
  'Ищу окна и препятствия...',
  'Проверяю углы...',
  'Готовлю список замеров...',
];

function AnalyzingPhase({ allPhotos }) {
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(i => (i + 1) % ANALYSIS_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
      {/* Photo strip */}
      {allPhotos.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center max-w-xs">
          {allPhotos.map((p, i) => (
            <img key={i} src={p.dataUrl} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm opacity-80" />
          ))}
        </div>
      )}
      {/* Spinner */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-slate-800">ИИ изучает помещение...</p>
        <p className="text-sm text-slate-500 transition-all duration-500">{ANALYSIS_STEPS[stepIdx]}</p>
        <p className="text-xs text-slate-300">Анализирую все фотографии вместе для точного понимания комнаты</p>
      </div>
    </div>
  );
}

// ─── Measurements phase ────────────────────────────────────────────────────────

const CATEGORY_META = {
  'Стена':       { icon: '📏', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  'Высота':      { icon: '📐', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  'Углы':        { icon: '🔺', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  'Окно':        { icon: '🪟', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  'Препятствия': { icon: '🔴', color: 'bg-red-50 border-red-200 text-red-700' },
};

function MeasurementRow({ index, item, value, onChange, required }) {
  const filled = value.trim() !== '';
  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all
      ${filled ? 'border-emerald-200 bg-emerald-50' : required ? 'border-slate-200 bg-white hover:border-amber-300' : 'border-slate-100 bg-slate-50'}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors
        ${filled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {filled ? '✓' : index}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-slate-700 leading-tight">
          {item.label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </p>
        {item.hint && <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.hint}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number" inputMode="decimal" placeholder="—" value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-20 text-right px-2 py-1.5 rounded-lg border text-sm font-mono transition-colors
            focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400
            ${filled ? 'border-emerald-300 bg-white' : 'border-slate-200 bg-white'}`}
        />
        <span className="text-xs text-slate-400 w-6 text-left">{item.unit || 'мм'}</span>
      </div>
    </div>
  );
}

function MeasurementsPhase({ order, wallPhoto, allPhotos, aiResult, onComplete }) {
  const [values, setValues] = useState({});
  const [showWarnings, setShowWarnings] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const { room_summary, annotations = [], measurements = [], warnings = [] } = aiResult;

  const allPhotoSrcs = allPhotos.map(p => p.dataUrl);
  const openLightbox = (src) => {
    const idx = allPhotoSrcs.indexOf(src);
    setLightbox({ photos: allPhotoSrcs, index: idx >= 0 ? idx : 0 });
  };

  const required = measurements.filter(m => m.required);
  const filledRequired = required.filter(m => values[m.id]?.trim());
  const allFilled = filledRequired.length === required.length;
  const setValue = (id, val) => setValues(prev => ({ ...prev, [id]: val }));

  // Group measurements by category
  const categories = {};
  for (const m of measurements) {
    const cat = m.category || 'Прочее';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  }

  const displayPhoto = activePhoto ?? wallPhoto;

  return (
    <div className="space-y-4">
      {/* Room summary card */}
      {room_summary && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <div>
              <p className="text-xs text-slate-400">Помещение</p>
              <p className="text-sm font-semibold text-slate-800">{room_summary.room_type} · {room_summary.approximate_area}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <div>
              <p className="text-xs text-slate-400">Отделка</p>
              <p className="text-sm font-semibold text-slate-800">{room_summary.finishing_state}</p>
            </div>
          </div>
          {warnings.length > 0 && (
            <button
              onClick={() => setShowWarnings(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {warnings.length} {warnings.length === 1 ? 'предупреждение' : 'предупреждения'}
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {showWarnings && warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-orange-800">Обратите внимание</p>
            {warnings.map((w, i) => <p key={i} className="text-sm text-orange-700">• {w}</p>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: annotated photo + strip */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Фото с аннотациями</h3>
          {displayPhoto && (
            <AnnotatedPhoto
              imageDataUrl={displayPhoto}
              annotations={displayPhoto === wallPhoto ? annotations : []}
              onClick={() => openLightbox(displayPhoto)}
            />
          )}
          {/* Photo strip */}
          {allPhotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allPhotos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setActivePhoto(p.dataUrl); setLightbox({ photos: allPhotoSrcs, index: i }); }}
                  className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all
                    ${activePhoto === p.dataUrl || (activePhoto === null && p.dataUrl === wallPhoto)
                      ? 'border-amber-400' : 'border-transparent'}`}
                >
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {lightbox && (
            <Lightbox photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {[['bg-blue-500','Окно'], ['bg-red-500','Батарея'], ['bg-yellow-400','Угол'], ['bg-white border border-slate-300','Замер']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: measurements by category */}
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Заполнено</span>
              <span className={`font-semibold ${allFilled ? 'text-emerald-600' : 'text-amber-600'}`}>
                {filledRequired.length} из {required.length} обязательных
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${allFilled ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${required.length ? (filledRequired.length / required.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Categories */}
          {Object.entries(categories).map(([cat, items]) => {
            const meta = CATEGORY_META[cat] || { icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-700' };
            return (
              <div key={cat} className="space-y-2">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.color}`}>
                  <span>{meta.icon}</span>
                  {cat.toUpperCase()}
                </div>
                <div className="space-y-1.5">
                  {items.map((m, i) => (
                    <MeasurementRow
                      key={m.id}
                      index={i + 1}
                      item={m}
                      value={values[m.id] || ''}
                      onChange={val => setValue(m.id, val)}
                      required={!!m.required}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Complete button */}
          <button
            disabled={!allFilled}
            onClick={() => onComplete({ measurements, values, room_summary, warnings })}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
              ${allFilled
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {allFilled
              ? <><CheckCircle className="w-4 h-4" />Завершить замер</>
              : `Заполните ещё ${required.length - filledRequired.length} обязательных`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase: Complete ───────────────────────────────────────────────────────────

function CompletePhase({ order, allPhotos, completion, onBack, showToast }) {
  const { measurements = [], values = {}, room_summary, warnings = [] } = completion;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [completeLightbox, setCompleteLightbox] = useState(null);
  const categories = {};
  for (const m of measurements) {
    const cat = m.category || 'Прочее';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  }

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${WORKER_URL}/api/save-measurement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          photos: allPhotos,
          measurements: { measurements, values, warnings },
          room_summary,
          completed_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSent(true);
      showToast('Результаты замера отправлены в офис ✓');
    } catch (err) {
      showToast('Ошибка отправки: ' + err.message, 'error');
    }
    setSending(false);
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="text-center py-4 space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Замер завершён!</h2>
        <p className="text-sm text-slate-500">{order.order_number} · {order.client_name}</p>
      </div>

      {/* Room summary */}
      {room_summary && (
        <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs text-slate-400">Тип</p><p className="text-sm font-semibold text-slate-800">{room_summary.room_type}</p></div>
          <div><p className="text-xs text-slate-400">Площадь</p><p className="text-sm font-semibold text-slate-800">{room_summary.approximate_area}</p></div>
          <div><p className="text-xs text-slate-400">Отделка</p><p className="text-sm font-semibold text-slate-800">{room_summary.finishing_state}</p></div>
          <div><p className="text-xs text-slate-400">Потолок</p><p className="text-sm font-semibold text-slate-800">{room_summary.ceiling_type}</p></div>
        </div>
      )}

      {/* All photos */}
      {allPhotos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Фотографии</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allPhotos.map((p, i) => (
              <button
                key={i}
                onClick={() => setCompleteLightbox({ photos: allPhotos.map(x => x.dataUrl), index: i })}
                className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm cursor-zoom-in"
              >
                <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {completeLightbox && (
            <Lightbox photos={completeLightbox.photos} initialIndex={completeLightbox.index} onClose={() => setCompleteLightbox(null)} />
          )}
        </div>
      )}

      {/* Measurements by category */}
      {Object.entries(categories).map(([cat, items]) => {
        const meta = CATEGORY_META[cat] || { icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-700' };
        const filled = items.filter(m => values[m.id]);
        return (
          <div key={cat} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 ${meta.color.split(' ')[0]} border-b`}>
              <span>{meta.icon}</span>
              <p className="text-xs font-semibold uppercase tracking-wide">{cat}</p>
              <span className="ml-auto text-xs opacity-60">{filled.length}/{items.length}</span>
            </div>
            <table className="w-full">
              <tbody>
                {items.map((m, i) => (
                  <tr key={m.id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{m.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      {values[m.id] ? (
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {values[m.id]} <span className="text-slate-400 font-normal text-xs">{m.unit || 'мм'}</span>
                        </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Отправить в офис */}
      {sent ? (
        <div className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Отправлено в офис
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-200 active:scale-95"
        >
          {sending ? 'Отправка...' : 'Отправить в офис'}
        </button>
      )}
      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Назад к списку замеров
      </button>
    </div>
  );
}

// ─── Fallback measurements ────────────────────────────────────────────────────

function makeFallback(productType) {
  return {
    room_summary: null,
    annotations: [
      { type: 'arrow', label: 'Ширина стены', x1: 0.05, y1: 0.85, x2: 0.95, y2: 0.85, color: 'white' },
      { type: 'arrow', label: 'Высота', x1: 0.05, y1: 0.05, x2: 0.05, y2: 0.90, color: 'white' },
    ],
    measurements: [
      { id: 1, label: 'Ширина стены (по плинтусу)', unit: 'мм', required: true, hint: 'У самого пола', category: 'Стена' },
      { id: 2, label: 'Ширина стены (на 1200мм)', unit: 'мм', required: true, hint: 'На высоте пояса', category: 'Стена' },
      { id: 3, label: 'Ширина стены (у потолка)', unit: 'мм', required: true, category: 'Стена' },
      { id: 4, label: 'Высота потолка (левый угол)', unit: 'мм', required: true, category: 'Высота' },
      { id: 5, label: 'Высота потолка (правый угол)', unit: 'мм', required: true, category: 'Высота' },
    ],
    warnings: [`ИИ-анализ недоступен — используется стандартный чек-лист для «${productType}»`],
  };
}

// ─── Completed view ───────────────────────────────────────────────────────────

function CompletedView({ order, data, onRedo, onBack }) {
  const { photos = [], measurements: completion = {}, room_summary } = data;
  const { measurements = [], values = {}, warnings = [] } = completion;
  const [viewLightbox, setViewLightbox] = useState(null);
  const completedAt = data.completed_at ? new Date(data.completed_at).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null;

  const categories = {};
  for (const m of measurements) {
    const cat = m.category || 'Прочее';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-800">Замер уже выполнен</p>
          {completedAt && <p className="text-sm text-emerald-600 mt-0.5">{completedAt}</p>}
        </div>
      </div>

      {room_summary && (
        <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs text-slate-400">Тип</p><p className="text-sm font-semibold text-slate-800">{room_summary.room_type}</p></div>
          <div><p className="text-xs text-slate-400">Площадь</p><p className="text-sm font-semibold text-slate-800">{room_summary.approximate_area}</p></div>
          <div><p className="text-xs text-slate-400">Отделка</p><p className="text-sm font-semibold text-slate-800">{room_summary.finishing_state}</p></div>
          <div><p className="text-xs text-slate-400">Потолок</p><p className="text-sm font-semibold text-slate-800">{room_summary.ceiling_type}</p></div>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Фотографии ({photos.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setViewLightbox({ photos: photos.map(x => x.dataUrl), index: i })}
                className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm cursor-zoom-in"
              >
                <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {viewLightbox && (
            <Lightbox photos={viewLightbox.photos} initialIndex={viewLightbox.index} onClose={() => setViewLightbox(null)} />
          )}
        </div>
      )}

      {Object.entries(categories).map(([cat, items]) => {
        const meta = CATEGORY_META[cat] || { icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-700' };
        const filled = items.filter(m => values[m.id]);
        return (
          <div key={cat} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 ${meta.color.split(' ')[0]}`}>
              <span>{meta.icon}</span>
              <p className="text-xs font-semibold uppercase tracking-wide">{cat}</p>
              <span className="ml-auto text-xs opacity-60">{filled.length}/{items.length}</span>
            </div>
            <table className="w-full">
              <tbody>
                {items.map((m, i) => (
                  <tr key={m.id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{m.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      {values[m.id] ? (
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {values[m.id]} <span className="text-slate-400 font-normal text-xs">{m.unit || 'мм'}</span>
                        </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <button
        onClick={onRedo}
        className="w-full py-3 rounded-xl border border-amber-200 text-sm text-amber-700 hover:bg-amber-50 transition-colors font-medium"
      >
        Переделать замер
      </button>
      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        Назад к списку замеров
      </button>
    </div>
  );
}

// ─── Main flow ────────────────────────────────────────────────────────────────

function MeasurementFlow({ order, onClose }) {
  const { showToast } = useApp();

  // phase: 'loading' | 'photos' | 'analyzing' | 'measurements' | 'complete' | 'completed'
  const [phase, setPhase] = useState('loading');
  const [existingMeasurement, setExistingMeasurement] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [stepPhotos, setStepPhotos] = useState({
    entrance: [], wall: [], corners: [], windows: [], obstacles: [],
  });
  const [aiResult, setAiResult] = useState(null);
  const [completion, setCompletion] = useState(null);

  // Load existing measurement on mount
  useEffect(() => {
    fetch(`${WORKER_URL}/api/get-measurement/${order.id}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.completed_at) {
          setExistingMeasurement(data);
          setPhase('completed');
        } else {
          setPhase('photos');
        }
      })
      .catch(() => setPhase('photos'));
  }, [order.id]);

  const step = STEPS[currentStep];

  const addPhoto = (stepId, dataUrl) => {
    setStepPhotos(prev => {
      const arr = prev[stepId];
      const step = STEPS.find(s => s.id === stepId);
      if (!step.multi) return { ...prev, [stepId]: [dataUrl] };
      return { ...prev, [stepId]: [...arr, dataUrl] };
    });
  };

  const removePhoto = (stepId, index) => {
    setStepPhotos(prev => {
      const arr = [...prev[stepId]];
      arr.splice(index, 1);
      return { ...prev, [stepId]: arr };
    });
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(i => i + 1);
    } else {
      startAnalysis();
    }
  };

  const skipStep = () => {
    setSkipped(prev => new Set([...prev, step.id]));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(i => i + 1);
    } else {
      startAnalysis();
    }
  };

  const startAnalysis = async () => {
    setPhase('analyzing');

    // Collect all photos
    const allPhotos = [];
    for (const s of STEPS) {
      for (const dataUrl of stepPhotos[s.id]) {
        allPhotos.push({ dataUrl, step: s.id });
      }
    }

    if (allPhotos.length === 0) {
      setAiResult(makeFallback(order.product_type));
      setPhase('measurements');
      return;
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/analyze-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: allPhotos,
          furnitureType: order.product_type,
          orderNumber: order.order_number,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const fallback = makeFallback(order.product_type);
      setAiResult({
        room_summary:  data.room_summary  || null,
        annotations:   data.annotations?.length  ? data.annotations  : fallback.annotations,
        measurements:  data.measurements?.length ? data.measurements : fallback.measurements,
        warnings:      data.warnings      || [],
      });
    } catch (err) {
      console.warn('AI analysis failed:', err.message);
      setAiResult(makeFallback(order.product_type));
    }

    setPhase('measurements');
  };

  const handleComplete = (data) => {
    setCompletion(data);
    setPhase('complete');
  };

  const handleBack = () => {
    if (phase === 'completed') { onClose(); return; }
    if (phase === 'measurements') { setPhase('photos'); setAiResult(null); return; }
    if (phase === 'complete') { onClose(); return; }
    if (phase === 'photos' && currentStep > 0) { setCurrentStep(i => i - 1); return; }
    onClose();
  };

  const handleRedo = () => {
    setExistingMeasurement(null);
    setPhase('photos');
    setCurrentStep(0);
    setSkipped(new Set());
    setStepPhotos({ entrance: [], wall: [], corners: [], windows: [], obstacles: [] });
    setAiResult(null);
    setCompletion(null);
  };

  // Flatten all photos for display
  const allPhotos = [];
  for (const s of STEPS) {
    for (const dataUrl of stepPhotos[s.id]) {
      allPhotos.push({ dataUrl, step: s.id });
    }
  }

  const wallPhoto = stepPhotos.wall[0] || stepPhotos.entrance[0] || allPhotos[0]?.dataUrl || null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-100 bg-white flex items-center gap-3 px-4 flex-shrink-0">
        <button onClick={handleBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{order.order_number} · {order.product_type}</p>
          <p className="text-xs text-slate-400 truncate">{order.client_name}</p>
        </div>

        {/* Step progress dots (only during photo collection) */}
        {phase === 'photos' && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`transition-all rounded-full flex items-center justify-center text-xs
                  ${i < currentStep
                    ? 'w-5 h-5 bg-emerald-500 text-white text-[10px]'
                    : i === currentStep
                      ? 'w-5 h-5 bg-amber-500 text-white text-[10px]'
                      : 'w-2 h-2 bg-slate-200'}`}
              >
                {i < currentStep ? '✓' : i === currentStep ? i + 1 : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step progress bar (during photo collection) */}
      {phase === 'photos' && (
        <div className="h-1 bg-slate-100 flex-shrink-0">
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${((currentStep) / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          {phase === 'loading' && (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="w-8 h-8 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
            </div>
          )}
          {phase === 'completed' && existingMeasurement && (
            <CompletedView
              order={order}
              data={existingMeasurement}
              onRedo={handleRedo}
              onBack={onClose}
            />
          )}
          {phase === 'photos' && (
            <PhotoCollectionStep
              stepIndex={currentStep}
              step={step}
              furnitureType={order.product_type}
              photos={stepPhotos[step.id]}
              onAddPhoto={dataUrl => addPhoto(step.id, dataUrl)}
              onRemovePhoto={i => removePhoto(step.id, i)}
              onNext={goNext}
              onSkip={skipStep}
            />
          )}
          {phase === 'analyzing' && <AnalyzingPhase allPhotos={allPhotos} />}
          {phase === 'measurements' && aiResult && (
            <MeasurementsPhase
              order={order}
              wallPhoto={wallPhoto}
              allPhotos={allPhotos}
              aiResult={aiResult}
              onComplete={handleComplete}
            />
          )}
          {phase === 'complete' && completion && (
            <CompletePhase
              order={order}
              allPhotos={allPhotos}
              completion={completion}
              onBack={onClose}
              showToast={msg => showToast(msg, 'success')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task list (main page) ────────────────────────────────────────────────────

export default function Measurer() {
  const { allOrders } = useApp();
  const [activeOrder, setActiveOrder] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  const tasks = allOrders.filter(o => o.stage === 'Замер' && o.status !== 'cancelled');

  useEffect(() => {
    if (tasks.length === 0) return;
    Promise.all(
      tasks.map(order =>
        fetch(`${WORKER_URL}/api/get-measurement/${order.id}`)
          .then(r => r.json())
          .then(data => ({ id: order.id, done: !!(data && data.completed_at) }))
          .catch(() => ({ id: order.id, done: false }))
      )
    ).then(results => {
      const map = {};
      for (const r of results) map[r.id] = r.done;
      setCompletedMap(map);
    });
  }, [tasks.length]);

  if (activeOrder) {
    return <MeasurementFlow order={activeOrder} onClose={() => {
      setActiveOrder(null);
      // Refresh completed status for this order
      fetch(`${WORKER_URL}/api/get-measurement/${activeOrder.id}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.completed_at) {
            setCompletedMap(prev => ({ ...prev, [activeOrder.id]: true }));
          }
        })
        .catch(() => {});
    }} />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Мои замеры</h1>
          <p className="text-sm text-slate-500">
            {tasks.length} {tasks.length === 1 ? 'задача' : tasks.length < 5 ? 'задачи' : 'задач'} на замер
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Ruler className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium">Нет задач на замер</p>
          <p className="text-sm text-slate-400 mt-1">Заказы на этапе «Замер» появятся здесь</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(order => {
            const done = completedMap[order.id];
            return (
              <button
                key={order.id}
                onClick={() => setActiveOrder(order)}
                className={`w-full bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4
                  hover:shadow-md transition-all text-left group
                  ${done ? 'border-emerald-200 hover:border-emerald-300' : 'border-slate-100 hover:border-amber-200'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors relative
                  ${done ? 'bg-emerald-100 group-hover:bg-emerald-200' : 'bg-amber-100 group-hover:bg-amber-200'}`}>
                  <Camera className={`w-6 h-6 ${done ? 'text-emerald-600' : 'text-amber-600'}`} />
                  {done && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{order.order_number}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-sm text-slate-700">{order.product_type}</span>
                    {done && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Выполнен</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{order.client_name}</p>
                  {order.delivery_date && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">Срок: {formatDateShort(order.delivery_date)}</p>
                  )}
                </div>
                <div className={`flex-shrink-0 flex items-center gap-1 group-hover:text-amber-600 ${done ? 'text-emerald-500' : 'text-amber-500'}`}>
                  <span className="text-xs font-medium hidden sm:block">{done ? 'Просмотр' : 'Начать замер'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
