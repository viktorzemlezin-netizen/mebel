import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Mail, Calendar, Bell, AlertCircle, Sofa, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import ChatBot from '../components/ChatBot.jsx';
import { WORKFLOW_STAGES, STAGE_ICONS, STAGE_COLORS, formatCurrency, formatDate, formatDateTime } from '../utils/constants.js';

const LIFECYCLE_VISIBLE = ['Новый', 'Замер', 'Проектирование', 'Производство', 'Монтаж', 'Завершён'];

function Timeline({ order }) {
  const currentIdx = LIFECYCLE_VISIBLE.indexOf(
    LIFECYCLE_VISIBLE.find(s => order.stage === s || order.stage.includes(s.split(' ')[0])) || 'Новый'
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-900 mb-5 text-sm">🗓 Этапы выполнения</h2>
      <div className="relative">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
        <div className="absolute left-4 top-4 w-0.5 bg-brand-400 transition-all duration-700"
          style={{ height: `${Math.max(0, (currentIdx / (LIFECYCLE_VISIBLE.length - 1)) * 100)}%` }} />
        <div className="space-y-4">
          {LIFECYCLE_VISIBLE.map((stage, i) => {
            const isDone   = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <div key={stage} className="flex gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-sm transition-all
                  ${isDone   ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                  : isActive ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 ring-offset-2'
                  :            'bg-slate-100 text-slate-400'}`}>
                  {isDone ? '✓' : STAGE_ICONS[stage] || '○'}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isDone ? 'text-brand-700' : isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage}
                    </span>
                    {isActive && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Сейчас</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const APPROVAL_STAGES = ['Согласование', 'Производство', 'Готово', 'Монтаж', 'Завершён'];
const PRESET_STYLES = {
  'ЭКОНОМ':   { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', badge: '💚 Выгодно' },
  'СТАНДАРТ': { bg: 'from-blue-50 to-brand-50',   border: 'border-blue-200',   accent: 'text-blue-700',    btn: 'bg-blue-600 hover:bg-blue-700 text-white',       badge: '⭐ Популярно', featured: true },
  'ПРЕМИУМ':  { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', accent: 'text-purple-700',  btn: 'bg-purple-600 hover:bg-purple-700 text-white',   badge: '👑 Топ' },
};

function PriceVariants({ order }) {
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState(false);

  const config = order.constructor_config
    ? (typeof order.constructor_config === 'string' ? JSON.parse(order.constructor_config) : order.constructor_config)
    : null;
  const variants = config?.variants || [];

  if (!APPROVAL_STAGES.includes(order.stage) && order.progress < 45) return null;
  if (variants.length === 0) return null;

  const handleChoose = (name) => {
    setSelected(name);
    setSent(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900 text-sm">💰 Выберите вариант комплектации</h2>
        <p className="text-xs text-slate-400 mt-0.5">3 варианта — выберите подходящий</p>
      </div>
      {sent ? (
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-900">Выбор отправлен менеджеру!</p>
          <p className="text-sm text-slate-500 mt-1">Вариант «{selected}» · Менеджер свяжется с вами</p>
        </div>
      ) : (
        <div className="p-4 grid gap-3">
          {variants.map((v) => {
            const style = PRESET_STYLES[v.name] || PRESET_STYLES['СТАНДАРТ'];
            return (
              <div key={v.name} className={`relative rounded-2xl border-2 bg-gradient-to-br ${style.bg} ${style.border} p-4`}>
                {style.featured && (
                  <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl rounded-tr-xl">Популярный</div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${style.accent}`}>{v.name}</span>
                      <span className="text-xs bg-white/60 rounded-full px-2 py-0.5 text-slate-600">{style.badge}</span>
                    </div>
                    <p className={`text-2xl font-bold ${style.accent}`}>{formatCurrency(v.price)}</p>
                  </div>
                </div>
                {(v.corpus || v.facade || v.hardware) && (
                  <div className="grid grid-cols-3 gap-1.5 mt-3 mb-3">
                    {v.corpus  && <div className="bg-white/60 rounded-lg px-2 py-1.5"><p className="text-xs text-slate-400">Корпус</p><p className="text-xs font-medium text-slate-700">{v.corpus}</p></div>}
                    {v.facade  && <div className="bg-white/60 rounded-lg px-2 py-1.5"><p className="text-xs text-slate-400">Фасады</p><p className="text-xs font-medium text-slate-700">{v.facade}</p></div>}
                    {v.hardware && <div className="bg-white/60 rounded-lg px-2 py-1.5"><p className="text-xs text-slate-400">Фурнитура</p><p className="text-xs font-medium text-slate-700">{v.hardware}</p></div>}
                  </div>
                )}
                <button onClick={() => handleChoose(v.name)} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${style.btn}`}>
                  Выбрать этот вариант →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const debt    = (order.total_price || 0) - (order.paid_amount || 0);
  const paidPct = order.total_price > 0 ? Math.round((order.paid_amount / order.total_price) * 100) : 0;
  const notifications = order.notifications || [];
  const stageColor = STAGE_COLORS[order.stage] || 'bg-slate-100 text-slate-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sofa className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-900 text-sm">FurnFlow</span>
            <span className="text-slate-400 text-xs ml-2 hidden sm:inline">Портал клиента</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stageColor}`}>
            {STAGE_ICONS[order.stage] || ''} {order.stage}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Order identity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-mono text-slate-400 mb-1">{order.order_number}</p>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{order.client_name}</h1>
          <p className="text-slate-500 text-sm mt-1">{order.product_type}</p>
          {order.description && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-3 leading-relaxed">{order.description}</p>
          )}
        </div>

        {/* Current stage highlight */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-5 text-white shadow-lg shadow-brand-200/40">
          <p className="text-brand-100 text-xs font-medium mb-1 uppercase tracking-wide">Текущий этап</p>
          <p className="text-2xl font-bold flex items-center gap-2">
            <span>{STAGE_ICONS[order.stage]}</span> {order.stage}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-brand-200 mb-1"><span>Прогресс</span><span>{order.progress}%</span></div>
            <div className="h-2 bg-brand-400/50 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${order.progress}%` }} />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <Timeline order={order} />

        {/* Price variants (if in approval stage) */}
        <PriceVariants order={order} />

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
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${paidPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>Оплачено {paidPct}%</span>
            {debt <= 0 && <span className="text-emerald-600 font-medium">✓ Полностью оплачен</span>}
          </div>
        </div>

        {/* Delivery date */}
        {order.delivery_date && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Ожидаемая дата сдачи</p>
              <p className="font-semibold text-slate-900 text-sm">{formatDate(order.delivery_date)}</p>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button
              onClick={() => setNotifsOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" /> Обновления
                <span className="text-xs bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-medium">{notifications.length}</span>
              </span>
              {notifsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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
                        <span className="text-xs font-semibold text-slate-800">{n.title || n.message?.slice(0, 40)}</span>
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

        {/* Footer */}
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-slate-400">Вопросы? Свяжитесь с менеджером</p>
          <div className="flex justify-center gap-5">
            <a href="tel:+77172000000" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
              <Phone className="w-3.5 h-3.5" /> +7 (7172) 00-00-00
            </a>
            <a href="mailto:info@furnflow.kz" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium">
              <Mail className="w-3.5 h-3.5" /> info@furnflow.kz
            </a>
          </div>
          <p className="text-xs text-slate-300 mt-3">Powered by FurnFlow</p>
        </div>
      </div>
      <ChatBot systemType="client" orderDetails={{
        order_number: order.order_number,
        client_name: order.client_name,
        product_type: order.product_type,
        stage: order.stage,
        status: order.status,
        delivery_date: order.delivery_date,
        total_price: order.total_price,
        description: order.description,
      }} />
    </div>
  );
}
