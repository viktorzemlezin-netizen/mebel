import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Mail, Calendar, Bell, AlertCircle, Sofa, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { STAGES, STAGE_ICONS, PHOTO_CATEGORIES, formatCurrency, formatDate, formatDateTime } from '../utils/constants.js';

// --- Photo gallery by stage ---
function PhotoGallery({ photos }) {
  const [activeTab, setActiveTab] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) return null;

  const grouped = PHOTO_CATEGORIES.reduce((acc, cat) => {
    const items = photos.filter(p => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const tabs = Object.keys(grouped);
  if (!tabs.length) return null;

  const currentTab = activeTab || tabs[0];
  const currentPhotos = grouped[currentTab] || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
          📸 Фотогалерея
          <span className="text-xs text-slate-400 font-normal ml-1">{photos.length} фото</span>
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              currentTab === tab
                ? 'bg-brand-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab}
            <span className={`ml-1.5 ${currentTab === tab ? 'text-brand-200' : 'text-slate-400'}`}>
              {grouped[tab].length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {currentPhotos.map(photo => (
          <div
            key={photo.id}
            className="relative rounded-xl overflow-hidden aspect-square bg-slate-100 cursor-pointer group"
            onClick={() => setLightbox(photo)}
          >
            {photo.type === 'pdf' ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <FileText className="w-8 h-8 text-red-400" />
                <span className="text-xs text-slate-500 px-2 text-center leading-tight">{photo.name}</span>
              </div>
            ) : (
              <>
                <img
                  src={photo.data}
                  alt={photo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && lightbox.type === 'image' && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.data}
            alt={lightbox.name}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm">{lightbox.name}</p>
        </div>
      )}
    </div>
  );
}

// --- Progress timeline ---
function Timeline({ order }) {
  const currentIdx = STAGES.indexOf(order.stage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2 text-sm">
        🗓 Этапы выполнения
      </h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
        <div
          className="absolute left-4 top-4 w-0.5 bg-brand-400 transition-all duration-700"
          style={{ height: `${(currentIdx / (STAGES.length - 1)) * 100}%` }}
        />

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone    = i < currentIdx;
            const isActive  = i === currentIdx;
            const isFuture  = i > currentIdx;
            const photos    = (order.photos || []).filter(p => {
              // Match stage name to photo category
              const map = { 'Замер': 'Замер', 'Проект': 'Дизайн-проект', 'Производство': 'В производстве', 'Монтаж': 'Готовое изделие' };
              return p.category === (map[stage] || stage);
            });

            return (
              <div key={stage} className="flex gap-4 relative">
                {/* Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-base transition-all
                  ${isDone   ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                  : isActive ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 ring-offset-2'
                  :            'bg-slate-100 text-slate-400'}`}
                >
                  {isDone ? '✓' : STAGE_ICONS[stage] || '○'}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isDone ? 'text-brand-700' : isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage}
                    </span>
                    {isActive && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Сейчас
                      </span>
                    )}
                    {isDone && (
                      <span className="text-xs text-slate-400">Выполнено</span>
                    )}
                  </div>

                  {/* Photos for this stage */}
                  {photos.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {photos.slice(0, 3).map(ph => (
                        <img
                          key={ph.id}
                          src={ph.data}
                          alt={ph.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      ))}
                      {photos.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                          +{photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Main portal ---
export default function ClientPortal() {
  const { token } = useParams();
  const { getOrderByToken } = useApp();
  const order = getOrderByToken(token);
  const [notifsOpen, setNotifsOpen] = useState(false);

  if (!order) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Заказ не найден</h2>
        <p className="text-sm text-slate-500">Проверьте ссылку или обратитесь к менеджеру</p>
      </div>
    </div>
  );

  const debt        = (order.total_price || 0) - (order.paid_amount || 0);
  const paidPct     = order.total_price > 0 ? Math.round((order.paid_amount / order.total_price) * 100) : 0;
  const notifications = order.notifications || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      {/* Sticky header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sofa className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-900 text-sm">FurnFlow</span>
            <span className="text-slate-400 text-xs ml-2 hidden sm:inline">Портал клиента</span>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Order identity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-mono text-slate-400 mb-1">{order.order_number}</p>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{order.client_name}</h1>
          <p className="text-slate-500 text-sm mt-1">{order.product_type}</p>
          {order.description && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-3 leading-relaxed">
              {order.description}
            </p>
          )}
        </div>

        {/* Current stage highlight */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-5 text-white shadow-lg shadow-brand-200/40">
          <p className="text-brand-100 text-xs font-medium mb-1 uppercase tracking-wide">Текущий этап</p>
          <p className="text-2xl font-bold flex items-center gap-2">
            <span>{STAGE_ICONS[order.stage]}</span> {order.stage}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-brand-200 mb-1">
              <span>Прогресс</span><span>{order.progress}%</span>
            </div>
            <div className="h-2 bg-brand-400/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${order.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <ProgressBar progress={order.progress} stage={order.stage} />
        </div>

        {/* Timeline with photos */}
        <Timeline order={order} />

        {/* Photo gallery */}
        <PhotoGallery photos={order.photos} />

        {/* Finance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">💰 Оплата</h2>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Стоимость заказа</span>
              <span className="font-bold text-slate-900">{formatCurrency(order.total_price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Оплачено</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(order.paid_amount)}</span>
            </div>
            {debt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Остаток к оплате</span>
                <span className="font-semibold text-amber-600">{formatCurrency(debt)}</span>
              </div>
            )}
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>Оплачено {paidPct}%</span>
            {debt <= 0 && <span className="text-emerald-600 font-medium">✓ Полностью оплачен</span>}
          </div>
        </div>

        {/* Delivery */}
        {order.delivery_date && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Срок сдачи</p>
              <p className="font-semibold text-slate-900 text-sm">{formatDate(order.delivery_date)}</p>
            </div>
          </div>
        )}

        {/* Notifications collapsible */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button
              onClick={() => setNotifsOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" /> Обновления заказа
                <span className="text-xs bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-medium">
                  {notifications.length}
                </span>
              </span>
              {notifsOpen
                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                : <ChevronDown className="w-4 h-4 text-slate-400" />
              }
            </button>

            {notifsOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {notifications.map(n => (
                  <div key={n.id} className="flex gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-3 h-3 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer contacts */}
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-slate-400">Вопросы? Свяжитесь с менеджером</p>
          <div className="flex justify-center gap-5">
            <a href="tel:+78001234567" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
              <Phone className="w-3.5 h-3.5" /> +7 (800) 123-45-67
            </a>
            <a href="mailto:info@furnflow.kz" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
              <Mail className="w-3.5 h-3.5" /> info@furnflow.kz
            </a>
          </div>
          <p className="text-xs text-slate-300 mt-3">Powered by FurnFlow</p>
        </div>
      </div>
    </div>
  );
}
