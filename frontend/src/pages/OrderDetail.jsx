import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, AlertCircle, Copy, Edit2, Check, X,
  Phone, Mail, MapPin, Calendar, Banknote, Bell, FileText,
  Ruler, Palette, Wrench, Package, ClipboardList, Users, History,
  ExternalLink, RefreshCw, ChevronDown, CheckCircle2, PenLine
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../utils/api.js';
import {
  WORKFLOW_STAGES, STAGE_ICONS, STAGE_COLORS, STAGE_PROGRESS, STATUSES, PRODUCT_TYPES,
  formatCurrency, formatDate, formatDateTime, timeAgo
} from '../utils/constants.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TabBtn({ id, label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative
        ${active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      {badge > 0 && (
        <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none font-medium
          ${active ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
          {icon} {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Stage timeline ───────────────────────────────────────────────────────────

const LIFECYCLE = [
  'Новый', 'Замер', 'Замер завершён', 'Проектирование',
  'Согласование', 'Производство', 'Готово', 'Монтаж', 'Завершён',
];

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = (e) => { drawing.current = true; const p = getPos(e); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move  = (e) => { if (!drawing.current) return; e.preventDefault(); const p = getPos(e); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke(); };
  const stop  = () => { drawing.current = false; };
  const clear = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };

  const handleConfirm = () => {
    const dataUrl = canvasRef.current.toDataURL();
    onConfirm(dataUrl);
  };

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
      <p className="text-xs text-slate-500 text-center">Подпись для подтверждения</p>
      <canvas
        ref={canvasRef}
        width={260} height={90}
        className="w-full bg-white border border-slate-200 rounded-lg touch-none cursor-crosshair"
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <div className="flex gap-2">
        <button onClick={clear}          className="btn-secondary text-xs flex-1">Очистить</button>
        <button onClick={onCancel}       className="btn-secondary text-xs flex-1">Отмена</button>
        <button onClick={handleConfirm}  className="btn-primary  text-xs flex-1">✓ Подписать</button>
      </div>
    </div>
  );
}

function StageTimeline({ order, history, onStageChange, canChange }) {
  const currentIdx = LIFECYCLE.indexOf(order.stage);
  const [confirming, setConfirming] = useState(false);
  const [showSig, setShowSig]       = useState(false);

  const nextStage = currentIdx >= 0 && currentIdx < LIFECYCLE.length - 1
    ? LIFECYCLE[currentIdx + 1]
    : null;

  const handleComplete = () => {
    if (!nextStage) return;
    setShowSig(false);
    setConfirming(true);
  };

  const handleDirectConfirm = () => {
    setConfirming(false);
    onStageChange(nextStage);
  };

  const handleSignConfirm = (sig) => {
    setShowSig(false);
    setConfirming(false);
    onStageChange(nextStage, sig);
  };

  const formatHistoryDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
        <div
          className="absolute left-4 top-4 w-0.5 bg-brand-400 transition-all duration-700"
          style={{ height: `${Math.max(0, currentIdx / (LIFECYCLE.length - 1)) * 100}%` }}
        />
        <div className="space-y-3">
          {LIFECYCLE.map((stage, i) => {
            const isDone   = i < currentIdx;
            const isActive = i === currentIdx;
            const histEntry = history?.find(h => h.stage === stage);
            return (
              <div key={stage} className="flex gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-sm transition-all
                  ${isDone   ? 'bg-brand-600 text-white shadow-sm'
                  : isActive ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 ring-offset-2'
                  :            'bg-slate-100 text-slate-400'}`}
                >
                  {isDone ? '✓' : STAGE_ICONS[stage] || '○'}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold
                      ${isDone ? 'text-brand-700' : isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage}
                    </span>
                    {isActive && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Сейчас</span>}
                    {histEntry && (
                      <span className="text-xs text-slate-400">
                        {histEntry.performed_by ? `${histEntry.performed_by} · ` : ''}{formatHistoryDate(histEntry.created_at)}
                      </span>
                    )}
                    {canChange && !isDone && !isActive && (
                      <button onClick={() => onStageChange(stage)} className="text-xs text-brand-600 hover:underline">
                        Перейти →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete stage button — big & mobile-friendly */}
      {canChange && nextStage && order.stage !== 'Завершён' && order.stage !== 'Отменён' && (
        <div className="pt-2">
          {!confirming ? (
            <button
              onClick={handleComplete}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              Завершить этап: {order.stage}
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-800 text-center">
                Подтвердить завершение «{order.stage}»?
              </p>
              <p className="text-xs text-emerald-600 text-center">Следующий этап: {nextStage}</p>
              {showSig ? (
                <SignatureCanvas
                  onConfirm={handleSignConfirm}
                  onCancel={() => { setShowSig(false); setConfirming(false); }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowSig(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-emerald-400 rounded-lg text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <PenLine className="w-4 h-4" /> Подпись
                  </button>
                  <button
                    onClick={handleDirectConfirm}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    ✓ Подтвердить
                  </button>
                </div>
              )}
              <button
                onClick={() => setConfirming(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Основное ────────────────────────────────────────────────────────────

function TabMain({ order, form, setForm, editMode, saving, onSave, onCancelEdit, onEdit, history, onStageChange, currentRole, users }) {
  const canChangeStage = currentRole?.role === 'Руководитель' || currentRole?.role === 'Менеджер';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const debt = (order.total_price || 0) - (order.paid_amount || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Client info */}
        <SectionCard title="Клиент" icon={<Users className="w-4 h-4 text-slate-400" />}
          action={!editMode ? (
            <button onClick={onEdit} className="btn-ghost flex items-center gap-1 text-xs">
              <Edit2 className="w-3 h-3" /> Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={onSave} disabled={saving} className="btn-primary text-xs flex items-center gap-1">
                <Check className="w-3 h-3" /> {saving ? '...' : 'Сохранить'}
              </button>
              <button onClick={onCancelEdit} className="btn-secondary text-xs flex items-center gap-1">
                <X className="w-3 h-3" /> Отмена
              </button>
            </div>
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Имя клиента', key: 'client_name', type: 'text' },
              { label: 'Телефон', key: 'client_phone', type: 'tel' },
              { label: 'Email', key: 'client_email', type: 'email' },
              { label: 'Адрес', key: 'client_address', type: 'text', span: true },
            ].map(({ label, key, type, span }) => (
              <div key={key} className={span ? 'sm:col-span-2' : ''}>
                <label className="label">{label}</label>
                {editMode ? (
                  <input className="input text-sm" type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)} />
                ) : (
                  <p className="text-sm text-slate-700 mt-1">{order[key] || '—'}</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Description */}
        <SectionCard title="Описание заказа" icon={<FileText className="w-4 h-4 text-slate-400" />}>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="label">Тип мебели</label>
                <select className="input text-sm" value={form.product_type || ''} onChange={e => set('product_type', e.target.value)}>
                  {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Описание</label>
                <textarea className="input resize-none text-sm" rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className="label">Примечания</label>
                <textarea className="input resize-none text-sm" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">{order.description || '—'}</p>
              {order.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700 leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Assigned employees */}
        <SectionCard title="Назначенные сотрудники" icon={<Users className="w-4 h-4 text-slate-400" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Замерщик', key: 'assigned_measurer', icon: '📐', color: 'bg-amber-50 border-amber-200', role: 'Замерщик' },
              { label: 'Дизайнер', key: 'assigned_designer', icon: '✏️', color: 'bg-blue-50 border-blue-200', role: 'Дизайнер' },
              { label: 'Монтажник', key: 'assigned_installer', icon: '🔩', color: 'bg-emerald-50 border-emerald-200', role: 'Монтажник' },
            ].map(({ label, key, icon, color, role }) => {
              const roleUsers = users.filter(u => u.role === role);
              return (
                <div key={key} className={`rounded-xl border p-3 ${color}`}>
                  <p className="text-xs text-slate-500 mb-1">{icon} {label}</p>
                  {editMode ? (
                    <select className="input text-xs py-1" value={form[key] || ''} onChange={e => set(key, e.target.value)}>
                      <option value="">Не назначен</option>
                      {roleUsers.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{order[key] || <span className="text-slate-400 font-normal">Не назначен</span>}</p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* History */}
        {history.length > 0 && (
          <SectionCard title="История изменений" icon={<History className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-2">
              {history.map(h => {
                const dt = h.created_at
                  ? new Date(h.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div key={h.id} className="flex gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 leading-snug">{h.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {h.performed_by && <span className="font-medium text-slate-500">{h.performed_by}</span>}
                        {h.performed_by && dt && <span> · </span>}
                        {dt}
                      </p>
                      {h.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{h.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Stage timeline */}
        <SectionCard title="Этапы" icon="🗓">
          <StageTimeline order={order} history={history} onStageChange={onStageChange} canChange={canChangeStage} />
        </SectionCard>

        {/* Dates */}
        <SectionCard title="Сроки" icon={<Calendar className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Создан</span>
              <span className="text-slate-700">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Срок сдачи</span>
              {editMode ? (
                <input className="input text-xs py-1 w-32" type="date" value={form.delivery_date || ''} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} />
              ) : (
                <span className="font-medium text-slate-800">{formatDate(order.delivery_date)}</span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Quick finance */}
        <SectionCard title="Финансы" icon={<Banknote className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Стоимость</span>
              <span className="font-semibold">{formatCurrency(order.total_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Оплачено</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(order.paid_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Долг</span>
              <span className={`font-semibold ${debt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {debt > 0 ? formatCurrency(debt) : '✓ Оплачен'}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${order.total_price > 0 ? Math.min(100, Math.round((order.paid_amount / order.total_price) * 100)) : 0}%` }} />
            </div>
          </div>
        </SectionCard>

        {/* Portal */}
        <SectionCard title="Портал клиента" icon={<ExternalLink className="w-4 h-4 text-slate-400" />}>
          <div className="space-y-2">
            <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 truncate text-slate-600">
              /portal/{order.portal_token}
            </code>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal/${order.portal_token}`).then(() => {})}
                className="btn-secondary flex items-center gap-1 text-xs flex-1 justify-center"
              >
                <Copy className="w-3 h-3" /> Копировать
              </button>
              <Link to={`/portal/${order.portal_token}`} target="_blank" className="btn-secondary flex items-center gap-1 text-xs flex-1 justify-center">
                <ExternalLink className="w-3 h-3" /> Открыть
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Tab: Замер ───────────────────────────────────────────────────────────────

function TabMeasurement({ order, currentRole }) {
  const [measurement, setMeasurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api.getMeasurement(order.id).then(data => {
      setMeasurement(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [order.id]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" /></div>;

  if (!measurement) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">📐</div>
        <p className="font-semibold text-slate-700 mb-1">Замер не выполнен</p>
        <p className="text-sm text-slate-500">Замерщик ещё не загрузил результаты</p>
        {(currentRole?.role === 'Руководитель' || currentRole?.role === 'Менеджер') && (
          <p className="text-xs text-slate-400 mt-4 bg-slate-50 rounded-xl p-3">
            Назначьте замерщика во вкладке «Основное» → назначенные сотрудники
          </p>
        )}
      </div>
    );
  }

  const { photos = [], measurements: comp = {}, room_summary } = measurement;
  const { measurements: mList = [], values = {}, warnings = [] } = comp;
  const categories = {};
  for (const m of mList) {
    const cat = m.category || 'Прочее';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(m);
  }

  const completedAt = measurement.completed_at
    ? new Date(measurement.completed_at).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-5">
      {/* Done badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-emerald-800">Замер выполнен</p>
          {completedAt && <p className="text-sm text-emerald-600">{completedAt}</p>}
          {measurement.measurer_name && <p className="text-xs text-emerald-600">Замерщик: {measurement.measurer_name}</p>}
        </div>
      </div>

      {/* Room summary */}
      {room_summary && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Тип', val: room_summary.room_type },
            { label: 'Площадь', val: room_summary.approximate_area },
            { label: 'Отделка', val: room_summary.finishing_state },
            { label: 'Потолок', val: room_summary.ceiling_type },
          ].map(({ label, val }) => val ? (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-800">{val}</p>
            </div>
          ) : null)}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">⚠️ Важные замечания</p>
          {warnings.map((w, i) => <p key={i} className="text-sm text-orange-700">• {w}</p>)}
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Фотографии ({photos.length})</p>
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setLightbox(p.dataUrl)} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 hover:border-brand-400 transition-colors">
                <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Measurements table */}
      {Object.entries(categories).map(([cat, items]) => (
        <div key={cat} className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{cat}</p>
          </div>
          <table className="w-full">
            <tbody>
              {items.map((m, i) => (
                <tr key={m.id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{m.label}</td>
                  <td className="px-4 py-2.5 text-right">
                    {values[m.id]
                      ? <span className="font-mono font-bold text-slate-900">{values[m.id]} <span className="text-slate-400 text-xs font-normal">{m.unit || 'см'}</span></span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Проект ──────────────────────────────────────────────────────────────

function TabProject({ order, currentRole }) {
  const { showToast } = useApp();
  const config = order.constructor_config
    ? (typeof order.constructor_config === 'string' ? JSON.parse(order.constructor_config) : order.constructor_config)
    : null;
  const variants = config?.variants || [];

  const canManage = currentRole?.role === 'Руководитель' || currentRole?.role === 'Менеджер' || currentRole?.role === 'Дизайнер';
  const portalUrl = `${window.location.origin}/portal/${order.portal_token}`;

  // Project notes / files / links state
  const [notes, setNotes]     = useState(order.designer_notes || '');
  const [files, setFiles]     = useState(() => {
    try { return order.project_files_json ? JSON.parse(order.project_files_json) : []; } catch { return []; }
  });
  const [links, setLinks]     = useState(() => {
    try { return order.project_links_json ? JSON.parse(order.project_links_json) : []; } catch { return []; }
  });
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [saving, setSaving]   = useState(false);
  const fileRef = useRef(null);

  const save = async (patch) => {
    setSaving(true);
    try {
      await api.updateOrder(order.id, patch);
    } catch (e) {
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Файл слишком большой (макс 5 МБ)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const entry = { name: file.name, type: file.type, size: file.size, data: ev.target.result, added_at: new Date().toISOString() };
      const updated = [...files, entry];
      setFiles(updated);
      await save({ project_files_json: JSON.stringify(updated) });
      showToast(`${file.name} прикреплён`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = async (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    await save({ project_files_json: JSON.stringify(updated) });
  };

  const handleAddLink = async () => {
    let url = linkInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'https://' + url;
    const updated = [...links, url];
    setLinks(updated);
    setLinkInput('');
    setShowLinkInput(false);
    await save({ project_links_json: JSON.stringify(updated) });
    showToast('Ссылка добавлена');
  };

  const handleRemoveLink = async (idx) => {
    const updated = links.filter((_, i) => i !== idx);
    setLinks(updated);
    await save({ project_links_json: JSON.stringify(updated) });
  };

  const handleNotesBlur = async () => {
    if (notes !== (order.designer_notes || '')) {
      await save({ designer_notes: notes });
      showToast('Заметки сохранены');
    }
  };

  const PRESET_COLORS = {
    'ЭКОНОМ':   { bg: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    'СТАНДАРТ': { bg: 'bg-brand-50 border-brand-200',     accent: 'text-brand-700',   btn: 'bg-brand-600 hover:bg-brand-700 text-white' },
    'ПРЕМИУМ':  { bg: 'bg-purple-50 border-purple-200',   accent: 'text-purple-700',  btn: 'bg-purple-600 hover:bg-purple-700 text-white' },
  };

  return (
    <div className="space-y-5">
      {/* Designer notes */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-slate-400" /> Проект дизайнера
          {saving && <span className="text-xs text-slate-400 ml-auto">Сохранение...</span>}
        </h3>
        {canManage ? (
          <div className="space-y-3">
            <textarea
              className="input resize-none text-sm"
              rows={3}
              placeholder="Заметки дизайнера, ссылки на файлы, пожелания клиента..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
            />

            {/* Files list */}
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-base flex-shrink-0">
                      {f.type?.startsWith('image/') ? '🖼️' : f.type?.includes('pdf') ? '📄' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.size ? `${Math.round(f.size / 1024)} КБ` : ''}</p>
                    </div>
                    {f.type?.startsWith('image/') && (
                      <a href={f.data} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline flex-shrink-0">Открыть</a>
                    )}
                    <button onClick={() => handleRemoveFile(i)} className="text-slate-300 hover:text-red-400 flex-shrink-0 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Links list */}
            {links.length > 0 && (
              <div className="space-y-1.5">
                {links.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-base flex-shrink-0">🔗</span>
                    <a href={url} target="_blank" rel="noreferrer" className="flex-1 text-xs text-brand-600 hover:underline truncate">{url}</a>
                    <button onClick={() => handleRemoveLink(i)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add link input */}
            {showLinkInput && (
              <div className="flex gap-2">
                <input
                  className="input text-xs flex-1"
                  placeholder="https://..."
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                  autoFocus
                />
                <button onClick={handleAddLink} className="btn-primary text-xs px-3">Добавить</button>
                <button onClick={() => setShowLinkInput(false)} className="btn-secondary text-xs px-2"><X className="w-3 h-3" /></button>
              </div>
            )}

            <div className="flex gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5">
                📎 Прикрепить файл
              </button>
              {!showLinkInput && (
                <button onClick={() => setShowLinkInput(true)} className="btn-secondary text-xs flex items-center gap-1.5">
                  🔗 Добавить ссылку
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notes && <p className="text-sm text-slate-600 leading-relaxed">{notes}</p>}
            {files.length === 0 && links.length === 0 && !notes && (
              <p className="text-sm text-slate-400">Проектная документация будет добавлена дизайнером</p>
            )}
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-base">📎</span>
                <p className="text-xs text-slate-700 truncate">{f.name}</p>
              </div>
            ))}
            {links.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-brand-600 hover:underline">
                🔗 {url}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 3 price variants */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
          💰 3 ценовых варианта для клиента
        </h3>
        {variants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {variants.map((v) => {
              const colors = PRESET_COLORS[v.name] || PRESET_COLORS['СТАНДАРТ'];
              return (
                <div key={v.name} className={`rounded-2xl border p-4 bg-gradient-to-br ${colors.bg}`}>
                  <p className={`text-sm font-bold ${colors.accent}`}>{v.name}</p>
                  <p className={`text-xl font-bold mt-1 ${colors.accent}`}>{formatCurrency(v.price)}</p>
                  <div className="mt-3 space-y-1">
                    {v.corpus && <p className="text-xs text-slate-600">Корпус: {v.corpus}</p>}
                    {v.facade && <p className="text-xs text-slate-600">Фасады: {v.facade}</p>}
                    {v.hardware && <p className="text-xs text-slate-600">Фурнитура: {v.hardware}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Варианты не рассчитаны</p>
            <p className="text-xs mt-1">Создайте заказ через Конструктор мебели для автоматического расчёта 3 вариантов</p>
            <Link to="/constructor" className="mt-3 btn-primary text-xs inline-flex items-center gap-1.5">
              Открыть конструктор →
            </Link>
          </div>
        )}
      </div>

      {/* Send to client */}
      {canManage && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">📨 Отправить клиенту</h3>
          <p className="text-xs text-slate-500 mb-3">Клиент увидит варианты и сможет выбрать подходящий</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={portalUrl}
              className="input text-xs flex-1"
            />
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
            >
              <Copy className="w-3 h-3" /> Копировать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Производство ────────────────────────────────────────────────────────

const PRODUCTION_STAGES = [
  { id: 'cutting',    label: 'Раскрой материалов',       icon: '🪚', paintRequired: false },
  { id: 'edging',     label: 'Кромкование',               icon: '📏', paintRequired: false },
  { id: 'drilling',   label: 'Сверление отверстий',       icon: '🔧', paintRequired: false },
  { id: 'assembly',   label: 'Сборка корпусов',           icon: '🗄️', paintRequired: false },
  { id: 'paint',      label: 'Покраска / облицовка',      icon: '🎨', paintRequired: true  },
  { id: 'hardware',   label: 'Навеска фурнитуры',         icon: '⚙️', paintRequired: false },
  { id: 'qc',         label: 'Контроль качества (ОТК)',   icon: '✅', paintRequired: false },
  { id: 'packing',    label: 'Упаковка и маркировка',     icon: '📦', paintRequired: false },
];

function needsPaint(order) {
  const text = ((order.description || '') + ' ' + (order.notes || '')).toLowerCase();
  return text.includes('шпон') || text.includes('покрас') || text.includes('эмаль') || text.includes('облиц');
}

function TabProduction({ order, history, currentRole, onHistoryRefresh }) {
  const { showToast } = useApp();
  const [confirming, setConfirming] = useState(null); // id being confirmed

  const hasPaint = needsPaint(order);

  // Build checklist state from order_history
  const checklistDone = useMemo(() => {
    const done = {};
    for (const h of (history || [])) {
      if (h.stage === 'production' && h.action?.startsWith('prod_item_')) {
        const id = h.action.replace('prod_item_', '');
        done[id] = { by: h.performed_by, at: h.created_at };
      }
    }
    return done;
  }, [history]);

  // Active stages (skip paint if not needed)
  const activeStages = PRODUCTION_STAGES.filter(s => !s.paintRequired || hasPaint);

  const doneCount = activeStages.filter(s => checklistDone[s.id]).length;
  const nextIndex = activeStages.findIndex(s => !checklistDone[s.id]);

  const canProduce = ['Технолог', 'Сборщик', 'Руководитель', 'Менеджер'].includes(currentRole?.role);

  const handleConfirm = async (id) => {
    const performerName = currentRole?.name
      ? `${currentRole.name} (${currentRole.role})`
      : currentRole?.role || 'Сотрудник';
    try {
      await api.addOrderHistory(order.id, {
        stage: 'production',
        action: `prod_item_${id}`,
        performed_by: performerName,
        performed_by_role: currentRole?.role || '',
        notes: activeStages.find(s => s.id === id)?.label || id,
      });
      // Reload by triggering parent history refresh via direct history fetch
      // Parent will refresh on next render; for now optimistically update UI
      showToast('✓ Этап подтверждён');
      onHistoryRefresh?.();
    } catch (e) {
      showToast('Ошибка: ' + e.message, 'error');
    }
    setConfirming(null);
  };

  const formatAt = (at) => {
    if (!at) return '';
    return new Date(at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" /> Производственный чек-лист
          </h3>
          <span className="text-xs text-slate-500">{doneCount}/{activeStages.length}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${activeStages.length > 0 ? (doneCount / activeStages.length) * 100 : 0}%` }} />
        </div>
        <div className="space-y-2">
          {PRODUCTION_STAGES.map((stage, globalIdx) => {
            // Handle skipped paint
            if (stage.paintRequired && !hasPaint) {
              return (
                <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 opacity-60">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-slate-400">—</span>
                  </div>
                  <span className="text-sm mr-1">{stage.icon}</span>
                  <span className="text-sm text-slate-400 flex-1 line-through">{stage.label}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">Не требуется</span>
                </div>
              );
            }

            const activeIdx = activeStages.findIndex(s => s.id === stage.id);
            const isDone = !!checklistDone[stage.id];
            const isNext = activeIdx === nextIndex;
            const isLocked = !isDone && !isNext;

            return (
              <div key={stage.id}>
                <div
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                    ${isDone ? 'bg-emerald-50 border-emerald-200' : isNext && canProduce ? 'bg-white border-brand-300 shadow-sm' : 'bg-white border-slate-200 opacity-60'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isDone ? 'bg-emerald-500 border-emerald-500' : isNext ? 'border-brand-400' : 'border-slate-300'}`}>
                    {isDone && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm mr-1 flex-shrink-0 mt-0.5">{stage.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${isDone ? 'text-emerald-800' : isNext ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{stage.label}</span>
                    {isDone && checklistDone[stage.id] && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Выполнил: {checklistDone[stage.id].by} — {formatAt(checklistDone[stage.id].at)}
                      </p>
                    )}
                  </div>
                  {isNext && canProduce && !isDone && (
                    <button
                      onClick={() => setConfirming(stage.id)}
                      className="flex-shrink-0 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Выполнено ✓
                    </button>
                  )}
                  {isLocked && (
                    <span className="flex-shrink-0 text-slate-300 text-xs">🔒</span>
                  )}
                </div>

                {confirming === stage.id && (
                  <div className="mt-1 bg-brand-50 border border-brand-200 rounded-xl p-3 flex items-center gap-3">
                    <p className="text-xs text-brand-800 flex-1 font-medium">Подтвердить: «{stage.label}»?</p>
                    <button onClick={() => handleConfirm(stage.id)} className="px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg">Да, выполнено</button>
                    <button onClick={() => setConfirming(null)} className="text-xs text-slate-400 hover:text-slate-600">Отмена</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasPaint && (
          <p className="text-xs text-slate-400 mt-3 bg-slate-50 rounded-lg px-3 py-2">
            ℹ️ Этап «Покраска / облицовка» пропущен — в описании заказа не указаны шпон, покраска или эмаль
          </p>
        )}
      </div>

      {/* Materials info */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" /> Материалы
        </h3>
        <p className="text-sm text-slate-500 whitespace-pre-wrap">
          {order.description || 'Описание не указано'}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Монтаж ──────────────────────────────────────────────────────────────

const INSTALL_CHECKLIST = [
  { id: 'delivery',  label: 'Доставка на объект',       icon: '🚚', photoPrompt: 'Сфотографируй мебель у входа на объект' },
  { id: 'unpack',    label: 'Разгрузка и распаковка',   icon: '📦', photoPrompt: 'Сфотографируй распакованные детали' },
  { id: 'assembly',  label: 'Сборка и монтаж',          icon: '🔩', photoPrompt: 'Сфотографируй установленные корпуса на стене' },
  { id: 'adjust',    label: 'Регулировка и подгонка',   icon: '⚙️', photoPrompt: 'Сфотографируй открытые дверцы и выдвинутые ящики' },
  { id: 'cleanup',   label: 'Уборка и вынос мусора',    icon: '🧹', photoPrompt: 'Сфотографируй чистое помещение' },
  { id: 'client_ok', label: 'Приёмка клиентом',         icon: '🤝', photoPrompt: 'Сфотографируй готовую работу / клиента рядом' },
];

async function compressImage(dataUrl, maxDim = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function TabInstallation({ order, finalPhotos, setFinalPhotos, onStageChange, currentRole, history, onHistoryRefresh }) {
  const { showToast } = useApp();
  const [lightbox, setLightbox] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null); // {id, dataUrl}
  const [processingId, setProcessingId] = useState(null);
  const fileRefs = useRef({});

  const canInstall = ['Монтажник', 'Руководитель', 'Менеджер'].includes(currentRole?.role);

  // Build install state from order_history
  const installDone = useMemo(() => {
    const done = {};
    for (const h of (history || [])) {
      if (h.stage === 'installation' && h.action?.startsWith('install_item_')) {
        const id = h.action.replace('install_item_', '');
        // notes stores JSON with photo
        let photo = null;
        try { const parsed = JSON.parse(h.notes); photo = parsed.photo; } catch {}
        done[id] = { by: h.performed_by, at: h.created_at, photo };
      }
    }
    return done;
  }, [history]);

  const doneCount = INSTALL_CHECKLIST.filter(s => installDone[s.id]).length;
  const allDone = doneCount === INSTALL_CHECKLIST.length;
  const nextIndex = INSTALL_CHECKLIST.findIndex(s => !installDone[s.id]);

  const handleCameraCapture = async (id, file) => {
    if (!file) return;
    setProcessingId(id);
    try {
      const raw = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(raw, 800, 0.7);
      setPendingPhoto({ id, dataUrl: compressed });
    } catch (e) {
      showToast('Ошибка обработки фото', 'error');
    }
    setProcessingId(null);
  };

  const handleConfirmStep = async () => {
    if (!pendingPhoto) return;
    const { id, dataUrl } = pendingPhoto;
    const step = INSTALL_CHECKLIST.find(s => s.id === id);
    const performerName = currentRole?.name
      ? `${currentRole.name} (${currentRole.role})`
      : currentRole?.role || 'Монтажник';

    setProcessingId(id);
    try {
      // Save to order_history
      await api.addOrderHistory(order.id, {
        stage: 'installation',
        action: `install_item_${id}`,
        performed_by: performerName,
        performed_by_role: currentRole?.role || '',
        notes: JSON.stringify({ label: step?.label, photo: dataUrl }),
      });
      // Also add to finalPhotos
      const updated = [...(finalPhotos || []), {
        dataUrl,
        name: step?.label || id,
        install_step: id,
        uploaded_at: new Date().toISOString(),
      }];
      await api.saveFinalPhotos(order.id, { photos: updated });
      setFinalPhotos(updated);
      showToast(`✓ ${step?.label} подтверждено`);
      onHistoryRefresh?.();
    } catch (e) {
      showToast('Ошибка сохранения: ' + e.message, 'error');
    }
    setProcessingId(null);
    setPendingPhoto(null);
  };

  const formatAt = (at) => {
    if (!at) return '';
    return new Date(at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-5">
      {/* Address & installer */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" /> Детали монтажа
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-400 mb-1">Адрес</p><p className="text-slate-700">{order.client_address || '—'}</p></div>
          <div><p className="text-xs text-slate-400 mb-1">Монтажник</p><p className="text-slate-700">{order.assigned_installer || <span className="text-slate-400">Не назначен</span>}</p></div>
          <div><p className="text-xs text-slate-400 mb-1">Дата сдачи</p><p className="text-slate-700">{formatDate(order.delivery_date)}</p></div>
          <div><p className="text-xs text-slate-400 mb-1">Клиент</p><p className="text-slate-700">{order.client_name}</p></div>
        </div>
      </div>

      {/* Photo checklist */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400" /> Чек-лист монтажника
          </h3>
          <span className="text-xs text-slate-500">{doneCount}/{INSTALL_CHECKLIST.length}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / INSTALL_CHECKLIST.length) * 100}%` }} />
        </div>

        <div className="space-y-3">
          {INSTALL_CHECKLIST.map((step, idx) => {
            const isDone = !!installDone[step.id];
            const isNext = idx === nextIndex;
            const isLocked = !isDone && !isNext;
            const isPending = pendingPhoto?.id === step.id;
            const isProcessing = processingId === step.id;

            return (
              <div key={step.id} className={`rounded-xl border transition-all ${isDone ? 'bg-emerald-50 border-emerald-200' : isNext ? 'bg-white border-brand-300 shadow-sm' : 'bg-slate-50/50 border-slate-200 opacity-60'}`}>
                <div className="flex items-start gap-3 p-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isDone ? 'bg-emerald-500 border-emerald-500' : isNext ? 'border-brand-400' : 'border-slate-300'}`}>
                    {isDone && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-medium ${isDone ? 'text-emerald-800' : isNext ? 'text-slate-900' : 'text-slate-500'}`}>
                          {step.icon} {step.label}
                        </p>
                        {!isDone && isNext && (
                          <p className="text-xs text-brand-600 mt-0.5">📷 {step.photoPrompt}</p>
                        )}
                        {isDone && installDone[step.id] && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {installDone[step.id].by} — {formatAt(installDone[step.id].at)}
                          </p>
                        )}
                      </div>
                      {isDone && installDone[step.id]?.photo && (
                        <button onClick={() => setLightbox(installDone[step.id].photo)} className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 flex-shrink-0">
                          <img src={installDone[step.id].photo} alt="" className="w-full h-full object-cover" />
                        </button>
                      )}
                      {isLocked && <span className="text-slate-300 text-xs flex-shrink-0 mt-0.5">🔒</span>}
                    </div>

                    {/* Camera input for active step */}
                    {isNext && canInstall && !isDone && !isPending && (
                      <div className="mt-2">
                        <input
                          ref={el => { fileRefs.current[step.id] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => handleCameraCapture(step.id, e.target.files?.[0])}
                        />
                        <button
                          onClick={() => fileRefs.current[step.id]?.click()}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? '⏳ Обработка...' : '📷 Сделать фото'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending photo confirmation */}
                {isPending && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-brand-200">
                      <img src={pendingPhoto.dataUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmStep}
                        disabled={processingId === step.id}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        ✓ Подтвердить фото
                      </button>
                      <button
                        onClick={() => setPendingPhoto(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
                      >
                        Переснять
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete button */}
      {canInstall && order.stage === 'Монтаж' && (
        allDone ? (
          <button
            onClick={() => onStageChange('Завершён')}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
            Монтаж завершён → Заказ выполнен
          </button>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-sm text-slate-400">
            🔒 Выполните все пункты чек-листа с фото ({doneCount}/{INSTALL_CHECKLIST.length})
          </div>
        )
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Финансы ─────────────────────────────────────────────────────────────

function TabFinance({ order }) {
  const debt       = (order.total_price || 0) - (order.paid_amount || 0);
  const paidPct    = order.total_price > 0 ? Math.min(100, Math.round((order.paid_amount / order.total_price) * 100)) : 0;
  const payments   = order.payments || [];
  const payStatus  = debt <= 0 ? 'paid' : order.paid_amount > 0 ? 'partial' : 'unpaid';
  const statusInfo = { paid: { label: 'Оплачен', color: 'bg-emerald-100 text-emerald-700' }, partial: { label: 'Частично', color: 'bg-amber-100 text-amber-700' }, unpaid: { label: 'Не оплачен', color: 'bg-red-100 text-red-600' } };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-slate-400" /> Финансовый итог
          </h3>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo[payStatus].color}`}>
            {statusInfo[payStatus].label}
          </span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Стоимость заказа', value: formatCurrency(order.total_price), color: 'text-slate-900' },
            { label: 'Оплачено',         value: formatCurrency(order.paid_amount),  color: 'text-emerald-600' },
            { label: 'Остаток',          value: debt > 0 ? formatCurrency(debt) : '✓ Полностью оплачен', color: debt > 0 ? 'text-amber-600' : 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`text-sm font-semibold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Оплата</span>
            <span>{paidPct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
          </div>
        </div>
      </div>

      {/* Payments list */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Поступления</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Платежей не зарегистрировано</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(p.created_at)} · {p.note || p.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main OrderDetail ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'main',        label: 'Основное',    icon: '📋' },
  { id: 'measurement', label: 'Замер',       icon: '📐' },
  { id: 'project',     label: 'Проект',      icon: '✏️' },
  { id: 'production',  label: 'Производство',icon: '🔧' },
  { id: 'installation',label: 'Монтаж',      icon: '🔩' },
  { id: 'finance',     label: 'Финансы',     icon: '💰' },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, getOrder, updateOrder, updateOrderStatus, currentRole, refreshAll } = useApp();

  const [tab, setTab]             = useState('main');
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [history, setHistory]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [localOrder, setLocalOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [users, setUsers]         = useState([]);
  const [finalPhotos, setFinalPhotos] = useState([]);

  // Use context order first, fall back to API fetch
  const ctxOrder = getOrder(id);
  const order = ctxOrder || localOrder;

  // Fetch from API if not in context (e.g. navigated directly from lead conversion)
  useEffect(() => {
    if (!ctxOrder && id) {
      setLoadingOrder(true);
      api.getOrder(id)
        .then(data => { setLocalOrder(data); refreshAll(); })
        .catch(() => {})
        .finally(() => setLoadingOrder(false));
    }
  }, [id, ctxOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (order) {
      setForm({
        client_name: order.client_name, client_phone: order.client_phone,
        client_email: order.client_email, client_address: order.client_address || '',
        product_type: order.product_type, description: order.description,
        notes: order.notes, total_price: order.total_price, paid_amount: order.paid_amount,
        delivery_date: order.delivery_date?.split('T')[0] || '',
        assigned_measurer: order.assigned_measurer || '', assigned_designer: order.assigned_designer || '',
        assigned_installer: order.assigned_installer || '',
      });
    }
  }, [order?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load history
  const refreshHistory = useCallback(() => {
    if (!id) return;
    api.getOrderHistory(id)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingHistory(true);
    api.getOrderHistory(id)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [id]);

  // Load users for assignment dropdowns
  useEffect(() => {
    api.getUsers().then(data => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // Load final photos
  useEffect(() => {
    if (!id) return;
    api.getFinalPhotos(id).then(data => setFinalPhotos(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  if (loadingOrder) return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="card p-8 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="font-medium text-slate-700">Заказ не найден</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm">Назад</button>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateOrder(order.id, {
        ...form,
        total_price: parseFloat(form.total_price) || 0,
        paid_amount: parseFloat(form.paid_amount) || 0,
      });
      updateOrder(id, { ...form, total_price: parseFloat(form.total_price) || 0, paid_amount: parseFloat(form.paid_amount) || 0 });
      showToast('Заказ обновлён');
      setEditMode(false);
    } catch (err) {
      showToast('Ошибка: ' + err.message, 'error');
    }
    setSaving(false);
  };

  const handleStageChange = async (stage, signature) => {
    if (stage === 'Завершён' && finalPhotos.length < 2) {
      showToast('Загрузите минимум 2 финальных фото перед завершением', 'error');
      return;
    }
    const performerName = currentRole?.name
      ? `${currentRole.name} (${currentRole.role})`
      : currentRole?.role || 'Система';
    try {
      const updated = await api.updateOrderStage(order.id, {
        stage,
        performed_by: performerName,
        performed_by_role: currentRole?.role || 'manager',
        notes: signature ? 'Подтверждено с подписью' : '',
      });
      updateOrderStatus(order.id, { stage: updated.stage, progress: updated.progress, status: updated.status });
      showToast(`✓ Этап завершён: ${stage}`);
      api.getOrderHistory(order.id).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (err) {
      updateOrderStatus(id, { stage });
      showToast(`Этап: ${stage}`);
    }
  };

  const stageColor = STAGE_COLORS[order.stage] || 'bg-slate-100 text-slate-700';

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-sm text-slate-500 font-mono">{order.order_number}</span>
      </div>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400">{order.order_number}</span>
              <StatusBadge status={order.status} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor}`}>
                {STAGE_ICONS[order.stage] || ''} {order.stage}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{order.client_name}</h1>
            <p className="text-slate-500 text-sm mt-1">{order.product_type}</p>
            {order.client_address && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {order.client_address}
              </p>
            )}
          </div>
          {/* Progress */}
          <div className="sm:w-48 flex-shrink-0">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Прогресс</span>
              <span className="font-semibold text-slate-700">{order.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${order.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 bg-white rounded-xl border border-slate-100 p-1.5 shadow-sm">
        {TABS.map(t => (
          <TabBtn key={t.id} {...t} active={tab === t.id} onClick={setTab} />
        ))}
      </div>

      {/* Tab content */}
      {tab === 'main' && (
        <TabMain
          order={order} form={form} setForm={setForm}
          editMode={editMode} saving={saving}
          onSave={handleSave} onCancelEdit={() => setEditMode(false)} onEdit={() => setEditMode(true)}
          history={history} onStageChange={handleStageChange}
          currentRole={currentRole} users={users}
        />
      )}
      {tab === 'measurement'  && <TabMeasurement  order={order} currentRole={currentRole} />}
      {tab === 'project'      && <TabProject      order={order} currentRole={currentRole} />}
      {tab === 'production'   && <TabProduction   order={order} history={history} currentRole={currentRole} onHistoryRefresh={refreshHistory} />}
      {tab === 'installation' && (
        <TabInstallation
          order={order}
          finalPhotos={finalPhotos} setFinalPhotos={setFinalPhotos}
          onStageChange={handleStageChange}
          currentRole={currentRole}
          history={history}
          onHistoryRefresh={refreshHistory}
        />
      )}
      {tab === 'finance'      && <TabFinance      order={order} />}
    </div>
  );
}
