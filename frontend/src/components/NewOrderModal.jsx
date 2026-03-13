import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { PRODUCT_TYPES } from '../utils/constants.js';
import { useApp } from '../context/AppContext.jsx';

export default function NewOrderModal({ onClose }) {
  const { createOrder, showToast } = useApp();
  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    product_type: '', description: '', total_price: '',
    delivery_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.client_name.trim()) e.client_name = 'Обязательное поле';
    if (!form.product_type) e.product_type = 'Выберите тип мебели';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await createOrder({ ...form, total_price: parseFloat(form.total_price) || 0 });
      showToast('Заказ успешно создан');
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-slate-900">Новый заказ</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Client name */}
          <div>
            <label className="label">Имя клиента *</label>
            <input
              className={`input ${errors.client_name ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Иванова Мария Сергеевна"
              value={form.client_name}
              onChange={e => set('client_name', e.target.value)}
            />
            {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Телефон</label>
              <input className="input" placeholder="+7 (999) 000-00-00" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="client@mail.ru" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
            </div>
          </div>

          {/* Product type */}
          <div>
            <label className="label">Тип мебели *</label>
            <select
              className={`input ${errors.product_type ? 'border-red-400' : ''}`}
              value={form.product_type}
              onChange={e => set('product_type', e.target.value)}
            >
              <option value="">— Выберите —</option>
              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.product_type && <p className="text-xs text-red-500 mt-1">{errors.product_type}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Описание</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Размеры, цвет, особые пожелания..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Стоимость, ₽</label>
              <input className="input" type="number" min="0" placeholder="100000" value={form.total_price} onChange={e => set('total_price', e.target.value)} />
            </div>
            <div>
              <label className="label">Срок сдачи</label>
              <input className="input" type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Примечания</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Внутренние заметки..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Отмена</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {saving ? 'Сохраняем...' : 'Создать заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
