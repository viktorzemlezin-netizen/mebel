import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, CheckCircle, Clock, Package, X, Loader2,
  CreditCard, Truck, AlertCircle, DollarSign, FileText, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';
import { formatCurrency } from '../utils/constants.js';

const STATUS_CONFIG = {
  needed:          { label: 'Нужно заказать',    color: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    icon: AlertCircle },
  ordered:         { label: 'Заказано',          color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',  icon: Clock },
  pending_payment: { label: 'Ожидает оплаты',    color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', icon: CreditCard },
  paid:            { label: 'Оплачено',          color: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500',   icon: DollarSign },
  received:        { label: 'Получено',          color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
};

const TABS = [
  { key: 'all',             label: 'Все' },
  { key: 'needed',          label: '🔴 Нужно заказать' },
  { key: 'ordered',         label: '🟡 Заказано' },
  { key: 'pending_payment', label: '🟠 Ожидает оплаты' },
  { key: 'paid',            label: '🟢 Оплачено' },
  { key: 'received',        label: '✅ Получено' },
];

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.needed;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PaymentConfirmModal({ item, onClose, onConfirmed }) {
  const [form, setForm] = useState({
    invoice_number: '',
    payment_date: new Date().toISOString().slice(0, 10),
    paid_by: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProcurementItem(item.id, {
        status: 'paid',
        payment_status: 'paid',
        payment_date: form.payment_date,
        invoice_number: form.invoice_number,
        paid_by: form.paid_by,
        notes: form.notes || item.notes,
      });
      onConfirmed();
      onClose();
    } catch (err) { alert('Ошибка: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Подтвердить оплату</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold text-slate-900">{item.material_name}</p>
            <div className="flex gap-3 mt-1 text-xs text-slate-500">
              {item.supplier && <span>Поставщик: {item.supplier}</span>}
              <span className="font-semibold text-orange-700">Сумма: {formatCurrency(item.total_price)}</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleConfirm} className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Номер счёта</label>
              <input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="СЧ-12345" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Дата оплаты</label>
              <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Оплатил</label>
            <input value={form.paid_by} onChange={e => set('paid_by', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="ФИО / способ оплаты" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Примечание</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Kaspi, наличные..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-blue-700 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Подтвердить оплату
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ order_id: '', material_name: '', quantity: 1, unit: 'шт', supplier: '', unit_price: 0, notes: '' });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.getOrders({ status: 'in_progress' }).then(setOrders).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createProcurementItem({ ...form, quantity: parseFloat(form.quantity), unit_price: parseFloat(form.unit_price) });
      onAdded();
      onClose();
    } catch (err) { alert('Ошибка: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Добавить материал</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Заказ</label>
            <select value={form.order_id} onChange={e => set('order_id', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
              <option value="">— Общая закупка —</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {o.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Материал *</label>
            <input value={form.material_name} onChange={e => set('material_name', e.target.value)} required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="ЛДСП Egger 18мм" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Кол-во</label>
              <input type="number" value={form.quantity} min={0} step="0.1" onChange={e => set('quantity', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ед. изм.</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                {['шт', 'м²', 'пог.м', 'кг', 'л', 'компл'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Цена/ед</label>
              <input type="number" value={form.unit_price} min={0} onChange={e => set('unit_price', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Поставщик</label>
            <input value={form.supplier} onChange={e => set('supplier', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Blum Kazakhstan" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-teal-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-teal-700 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Добавить
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionButton({ item, onUpdate, currentRole }) {
  const { status } = item;
  const isAccountant = currentRole?.role === 'Бухгалтер' || currentRole?.role === 'Руководитель';

  if (status === 'needed') {
    return (
      <button onClick={() => onUpdate(item.id, 'ordered')}
        className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium whitespace-nowrap">
        Заказал ✓
      </button>
    );
  }
  if (status === 'ordered') {
    return (
      <button onClick={() => onUpdate(item.id, 'pending_payment')}
        className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium whitespace-nowrap">
        Выставили счёт
      </button>
    );
  }
  if (status === 'pending_payment') {
    if (!isAccountant) {
      return <span className="text-xs text-slate-400">Ожидает бухгалтера</span>;
    }
    return null; // PaymentConfirmModal opened from parent
  }
  if (status === 'paid') {
    return (
      <button onClick={() => onUpdate(item.id, 'received')}
        className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium whitespace-nowrap">
        Получено ✓
      </button>
    );
  }
  return null;
}

export default function Procurement() {
  const { showToast, currentRole } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentItem, setPaymentItem] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.getProcurement({});
      setItems(data);
    } catch { showToast('Ошибка загрузки', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const updateStatus = async (id, status) => {
    if (status === 'paid') {
      const item = items.find(i => i.id === id);
      setPaymentItem(item);
      return;
    }
    try {
      await api.updateProcurementItem(id, { status });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      const labels = { ordered: 'Отмечено как заказано', pending_payment: 'Ожидает оплаты', received: 'Получено!' };
      showToast(labels[status] || 'Обновлено');
    } catch { showToast('Ошибка', 'error'); }
  };

  const counts = {
    all: items.length,
    needed: items.filter(i => i.status === 'needed').length,
    ordered: items.filter(i => i.status === 'ordered').length,
    pending_payment: items.filter(i => i.status === 'pending_payment').length,
    paid: items.filter(i => i.status === 'paid').length,
    received: items.filter(i => i.status === 'received').length,
  };

  const displayItems = activeTab === 'all' ? items : items.filter(i => i.status === 'tab');
  const filteredItems = activeTab === 'all' ? items : items.filter(i => i.status === activeTab);

  const totalPending = items.filter(i => i.status === 'pending_payment').reduce((s, i) => s + (i.total_price || 0), 0);
  const totalOrdered = items.filter(i => ['ordered', 'pending_payment'].includes(i.status)).reduce((s, i) => s + (i.total_price || 0), 0);
  const isAccountant = currentRole?.role === 'Бухгалтер' || currentRole?.role === 'Руководитель';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Закупки</h1>
          <p className="text-slate-500 text-sm mt-0.5">Управление материалами и поставщиками</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadItems} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700">
            <Plus className="w-4 h-4" /> Добавить материал
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 bg-red-50 text-red-900">
          <p className="text-xs font-medium opacity-70 mb-1">Нужно заказать</p>
          <p className="text-2xl font-bold">{counts.needed}</p>
        </div>
        <div className="rounded-xl p-4 bg-orange-50 text-orange-900">
          <p className="text-xs font-medium opacity-70 mb-1">К оплате</p>
          <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
          <p className="text-xs opacity-60">{counts.pending_payment} позиций</p>
        </div>
        <div className="rounded-xl p-4 bg-amber-50 text-amber-900">
          <p className="text-xs font-medium opacity-70 mb-1">В пути</p>
          <p className="text-2xl font-bold">{counts.ordered + counts.pending_payment + counts.paid}</p>
        </div>
        <div className="rounded-xl p-4 bg-emerald-50 text-emerald-900">
          <p className="text-xs font-medium opacity-70 mb-1">Получено</p>
          <p className="text-2xl font-bold">{counts.received}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Нет материалов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Материал</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Заказ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Кол-во</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Поставщик</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Сумма</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.material_name}</p>
                      {item.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{item.notes}</p>}
                      {item.invoice_number && <p className="text-xs text-blue-500 mt-0.5">Счёт: {item.invoice_number}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {item.order_number ? (
                        <span className="text-xs font-mono text-brand-600">{item.order_number}</span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{item.supplier || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(item.total_price || 0)}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ActionButton item={item} onUpdate={updateStatus} currentRole={currentRole} />
                        {item.status === 'pending_payment' && isAccountant && (
                          <button onClick={() => setPaymentItem(item)}
                            className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium whitespace-nowrap">
                            Оплатить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onAdded={loadItems} />}
      {paymentItem && (
        <PaymentConfirmModal
          item={paymentItem}
          onClose={() => setPaymentItem(null)}
          onConfirmed={() => { loadItems(); showToast('Оплата подтверждена!'); }}
        />
      )}
    </div>
  );
}
