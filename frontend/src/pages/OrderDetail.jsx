import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Calendar, Copy, Edit2, Check, X,
  ChevronRight, Banknote, AlertCircle, Bell, FileText, Images
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import PhotoUpload from '../components/PhotoUpload.jsx';
import {
  STAGES, STAGE_PROGRESS, STATUSES, PRODUCT_TYPES,
  formatCurrency, formatDate, formatDateTime
} from '../utils/constants.js';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, getOrder, updateOrder, updateOrderStatus, allOrders } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Pull order live from context so edits reflect immediately
  const order = getOrder(id);

  useEffect(() => {
    if (order) {
      setForm({
        client_name: order.client_name,
        client_phone: order.client_phone,
        client_email: order.client_email,
        product_type: order.product_type,
        description: order.description,
        total_price: order.total_price,
        paid_amount: order.paid_amount,
        delivery_date: order.delivery_date?.split('T')[0] || '',
        notes: order.notes,
      });
    }
  }, [id]); // only re-init form when navigating to a different order

  const loading = false;
  const error = !order ? 'Заказ не найден' : null;

  const handleSave = async () => {
    setSaving(true);
    updateOrder(id, {
      ...form,
      total_price: parseFloat(form.total_price) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
    });
    showToast('Заказ обновлён');
    setEditMode(false);
    setSaving(false);
  };

  const handleStageChange = (stage) => {
    updateOrderStatus(id, {
      stage,
      progress: STAGE_PROGRESS[stage],
      status: order.status === 'new' ? 'in_progress' : order.status,
    });
    showToast(`Этап обновлён: ${stage}`);
  };

  const handleStatusChange = (status) => {
    updateOrderStatus(id, { status });
    showToast(`Статус изменён: ${STATUSES[status]?.label}`);
  };

  const copyPortal = () => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${order.portal_token}`)
      .then(() => showToast('Ссылка скопирована'));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="font-medium text-slate-700">Ошибка загрузки</p>
      <p className="text-sm text-slate-500 mt-1">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm">Назад</button>
    </div>
  );

  const debt = (order.total_price || 0) - (order.paid_amount || 0);
  const paidPercent = order.total_price > 0 ? Math.round((order.paid_amount / order.total_price) * 100) : 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Back nav */}
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
            </div>
            {editMode ? (
              <input className="input text-lg font-bold" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
            ) : (
              <h1 className="text-xl font-bold text-slate-900">{order.client_name}</h1>
            )}
            {editMode ? (
              <select className="input mt-2 text-sm" value={form.product_type} onChange={e => set('product_type', e.target.value)}>
                {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            ) : (
              <p className="text-slate-500 text-sm mt-1">{order.product_type}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Check className="w-4 h-4" /> {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button onClick={() => setEditMode(false)} className="btn-secondary text-sm flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Отмена
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
                <Edit2 className="w-4 h-4" /> Редактировать
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main col */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Progress */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-base">📊</span> Прогресс заказа
            </h2>
            <ProgressBar progress={order.progress} stage={order.stage} />

            {/* Stage selector */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Изменить этап:</p>
              <div className="flex gap-1.5 flex-wrap">
                {STAGES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      order.stage === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Описание заказа
            </h2>
            {editMode ? (
              <textarea
                className="input resize-none"
                rows={4}
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">{order.description || '—'}</p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Примечания</p>
              {editMode ? (
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">{order.notes || '—'}</p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Images className="w-4 h-4 text-slate-400" /> Фотографии и файлы
              {(order.photos || []).length > 0 && (
                <span className="ml-auto text-xs text-slate-400 font-normal">{order.photos.length} файлов</span>
              )}
            </h2>
            <PhotoUpload orderId={order.id} />
          </div>

          {/* Notifications */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" /> Журнал уведомлений
            </h2>
            {(order.notifications || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Уведомлений нет</p>
            ) : (
              <div className="space-y-3">
                {(order.notifications || []).map(n => (
                  <div key={n.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-700">{n.title}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side col */}
        <div className="flex flex-col gap-5">
          {/* Contacts */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Контакты</h2>
            <div className="space-y-3">
              {editMode ? (
                <>
                  <div>
                    <label className="label">Телефон</label>
                    <input className="input" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  {order.client_phone && (
                    <a href={`tel:${order.client_phone}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-brand-600 transition-colors">
                      <Phone className="w-4 h-4 text-slate-400" /> {order.client_phone}
                    </a>
                  )}
                  {order.client_email && (
                    <a href={`mailto:${order.client_email}`} className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-brand-600 transition-colors">
                      <Mail className="w-4 h-4 text-slate-400" /> {order.client_email}
                    </a>
                  )}
                  {!order.client_phone && !order.client_email && (
                    <p className="text-sm text-slate-400">Контакты не указаны</p>
                  )}
                </>
              )}
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                {editMode ? (
                  <input className="input" type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} />
                ) : (
                  <span>Срок: {formatDate(order.delivery_date)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Finance */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" /> Финансы
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Стоимость</span>
                {editMode ? (
                  <input className="input w-36 text-right" type="number" value={form.total_price} onChange={e => set('total_price', e.target.value)} />
                ) : (
                  <span className="font-semibold text-slate-900">{formatCurrency(order.total_price)}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Оплачено</span>
                {editMode ? (
                  <input className="input w-36 text-right" type="number" value={form.paid_amount} onChange={e => set('paid_amount', e.target.value)} />
                ) : (
                  <span className="font-semibold text-emerald-600">{formatCurrency(order.paid_amount)}</span>
                )}
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Остаток</span>
                <span className={`font-semibold ${debt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {debt > 0 ? formatCurrency(debt) : 'Оплачено ✓'}
                </span>
              </div>
              {/* Payment bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Оплата</span>
                  <span>{paidPercent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Статус заказа</h2>
            <div className="space-y-1.5">
              {Object.entries(STATUSES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    order.status === key
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                  {val.label}
                  {order.status === key && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Portal link */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Портал клиента</h2>
            <p className="text-xs text-slate-500 mb-3">
              Отправьте клиенту ссылку для отслеживания заказа
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 truncate text-slate-600">
                /portal/{order.portal_token}
              </code>
              <button onClick={copyPortal} className="btn-secondary flex items-center gap-1 text-xs flex-shrink-0">
                <Copy className="w-3 h-3" /> Копировать
              </button>
            </div>
            <Link
              to={`/portal/${order.portal_token}`}
              target="_blank"
              className="mt-2 text-xs text-brand-600 hover:underline block"
            >
              Открыть портал →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
