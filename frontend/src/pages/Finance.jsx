import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, Clock, CheckCircle, Loader2, X, FileText, RefreshCw, ShoppingCart, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';
import { formatCurrency, formatDate, formatDateTime } from '../utils/constants.js';

const PAYMENT_STATUS = {
  unpaid: { label: 'Не оплачен', color: 'bg-red-100 text-red-700' },
  advance: { label: 'Аванс получен', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Оплачен полностью', color: 'bg-emerald-100 text-emerald-700' },
};

function getPaymentStatus(order) {
  if (!order.total_price || order.total_price === 0) return 'paid';
  if (!order.paid_amount || order.paid_amount === 0) return 'unpaid';
  if (order.paid_amount >= order.total_price) return 'paid';
  return 'advance';
}

function PaymentModal({ order, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('advance');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await api.createPayment({ order_id: order.id, amount: amt, payment_type: type, notes });
      onSaved();
      onClose();
    } catch (err) { alert('Ошибка: ' + err.message); }
    finally { setSaving(false); }
  };

  const remaining = (order.total_price || 0) - (order.paid_amount || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Зафиксировать оплату</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-sm font-semibold text-slate-900">{order.order_number} — {order.client_name}</p>
            <div className="flex gap-4 mt-1 text-xs text-slate-500">
              <span>Итого: {formatCurrency(order.total_price)}</span>
              <span>Оплачено: {formatCurrency(order.paid_amount)}</span>
              <span className="font-semibold text-red-600">Остаток: {formatCurrency(remaining)}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Тип платежа</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
              <option value="advance">Аванс</option>
              <option value="final">Финальная оплата</option>
              <option value="partial">Частичная оплата</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Сумма (₸) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={1} required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder={String(remaining > 0 ? remaining : '')} />
            {remaining > 0 && (
              <button type="button" onClick={() => setAmount(String(remaining))} className="mt-1 text-xs text-green-600 hover:underline">
                Вписать остаток ({formatCurrency(remaining)})
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Комментарий</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Наличные, перевод, Kaspi..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-green-700 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Зафиксировать
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProcurementPendingSection({ onRefresh }) {
  const { showToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingItem, setPayingItem] = useState(null);
  const [payForm, setPayForm] = useState({ invoice_number: '', payment_date: '', paid_by: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api.getProcurementPending();
      setItems(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalPending = items.reduce((s, i) => s + (i.total_price || 0), 0);

  const confirmPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProcurementItem(payingItem.id, {
        status: 'paid',
        payment_status: 'paid',
        payment_date: payForm.payment_date || new Date().toISOString().slice(0, 10),
        invoice_number: payForm.invoice_number,
        paid_by: payForm.paid_by,
        notes: payForm.notes,
      });
      showToast('Оплата подтверждена!');
      setPayingItem(null);
      load();
      onRefresh?.();
    } catch { showToast('Ошибка', 'error'); }
    finally { setSaving(false); }
  };

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
          Закупки к оплате
          {items.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              {items.length} позиций · {formatCurrency(totalPending)}
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 border-b border-orange-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-orange-700 uppercase">Материал</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-orange-700 uppercase">Поставщик</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-orange-700 uppercase">Сумма</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-orange-700 uppercase">Заказ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-orange-50/40">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.material_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.supplier || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-700">{formatCurrency(item.total_price || 0)}</td>
                  <td className="px-4 py-3">
                    {item.order_number ? <span className="text-xs font-mono text-brand-600">{item.order_number}</span> : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setPayingItem(item); setPayForm({ invoice_number: '', payment_date: new Date().toISOString().slice(0, 10), paid_by: '', notes: '' }); }}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" /> Подтвердить оплату
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {payingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPayingItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-slate-900">Подтвердить оплату закупки</h2>
              <button onClick={() => setPayingItem(null)} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 pt-4">
              <div className="bg-orange-50 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold">{payingItem.material_name}</p>
                <p className="text-xs text-orange-700 font-semibold mt-1">{formatCurrency(payingItem.total_price)}</p>
              </div>
            </div>
            <form onSubmit={confirmPayment} className="px-6 pb-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Номер счёта</label>
                  <input value={payForm.invoice_number} onChange={e => setPayForm(p => ({...p, invoice_number: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="СЧ-12345" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Дата оплаты</label>
                  <input type="date" value={payForm.payment_date} onChange={e => setPayForm(p => ({...p, payment_date: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Оплатил / Способ</label>
                <input value={payForm.paid_by} onChange={e => setPayForm(p => ({...p, paid_by: e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Kaspi, наличные..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Оплачено
                </button>
                <button type="button" onClick={() => setPayingItem(null)} className="px-4 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Finance() {
  const { showToast } = useApp();
  const [data, setData] = useState({ orders: [], summary: { total_revenue: 0, total_received: 0, total_outstanding: 0, month_revenue: 0, month_received: 0 } });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [procPending, setProcPending] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [result, pending] = await Promise.all([
        api.getFinanceSummary(),
        api.getProcurementPending().catch(() => []),
      ]);
      setData(result);
      setProcPending(pending);
    } catch { showToast('Ошибка загрузки', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const { orders, summary } = data;

  const filtered = orders.filter(o => {
    const status = getPaymentStatus(o);
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.order_number?.toLowerCase().includes(q) || o.client_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const generateInvoice = (order) => {
    const text = `СЧЁТ НА ОПЛАТУ\n\nКлиент: ${order.client_name}\nЗаказ: ${order.order_number}\n\nСумма заказа: ${formatCurrency(order.total_price)}\nОплачено: ${formatCurrency(order.paid_amount)}\nК оплате: ${formatCurrency((order.total_price || 0) - (order.paid_amount || 0))}\n\nРеквизиты: FurnFlow\nДата: ${new Date().toLocaleDateString('ru-RU')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Счёт_${order.order_number}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Финансы</h1>
          <p className="text-slate-500 text-sm mt-0.5">Оплаты, задолженности, счета</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Обновить
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Выручка всего', value: formatCurrency(summary.total_revenue), color: 'bg-blue-50 text-blue-900', icon: TrendingUp },
          { label: 'Получено', value: formatCurrency(summary.total_received), color: 'bg-emerald-50 text-emerald-900', icon: CheckCircle },
          { label: 'Задолженность', value: formatCurrency(summary.total_outstanding), color: 'bg-red-50 text-red-900', icon: TrendingDown },
          { label: 'Выручка (месяц)', value: formatCurrency(summary.month_revenue), color: 'bg-purple-50 text-purple-900', icon: DollarSign },
          { label: 'К оплате поставщикам', value: formatCurrency(procPending.reduce((s, i) => s + (i.total_price || 0), 0)), color: 'bg-orange-50 text-orange-900', icon: ShoppingCart },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{card.label}</p>
            <p className="text-lg font-bold leading-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Закупки к оплате */}
      <ProcurementPendingSection onRefresh={load} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск заказа или клиента..."
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-64" />
        {[['all', 'Все'], ['unpaid', 'Не оплачен'], ['advance', 'Аванс'], ['paid', 'Оплачен']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatus === v ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Нет данных</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Заказ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Клиент</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Сумма</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Оплачено</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Остаток</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(order => {
                  const status = getPaymentStatus(order);
                  const ps = PAYMENT_STATUS[status];
                  const balance = (order.total_price || 0) - (order.paid_amount || 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-brand-600">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{order.client_name}</td>
                      <td className="px-4 py-3 text-right text-slate-900 font-semibold">{formatCurrency(order.total_price)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">{formatCurrency(order.paid_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-medium'}>
                          {balance > 0 ? formatCurrency(balance) : '✓ Оплачен'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${ps.color}`}>{ps.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedOrder(order)} className="text-xs px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
                            + Оплата
                          </button>
                          <button onClick={() => generateInvoice(order)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Сформировать счёт">
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && <PaymentModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSaved={load} />}
    </div>
  );
}
