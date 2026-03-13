import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../utils/api.js';

const MONTH_NAMES_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function formatDateRu(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES_RU[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SmartDeadline({ materials = [], operations = [], hardware = '', orderDate = null, className = '' }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.calculateDeadline({
        materials,
        operations,
        hardware,
        order_date: orderDate || new Date().toISOString().slice(0, 10),
      });
      setResult(data);
    } catch (e) {
      setError('Ошибка расчёта');
    } finally {
      setLoading(false);
    }
  }, [materials, operations, hardware, orderDate]);

  useEffect(() => {
    const timer = setTimeout(calculate, 500);
    return () => clearTimeout(timer);
  }, [calculate]);

  if (loading && !result) {
    return (
      <div className={`bg-slate-50 rounded-xl p-4 flex items-center gap-3 text-slate-500 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Расчёт срока...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-xl p-4 text-red-600 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-50 border-b border-brand-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-semibold text-brand-800">Расчёт срока выполнения</span>
        </div>
        <button
          onClick={calculate}
          disabled={loading}
          className="p-1 text-brand-500 hover:text-brand-700 rounded-lg hover:bg-brand-100 transition-colors"
          title="Пересчитать"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {/* Base days */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Базовый срок:</span>
          <span className="font-medium text-slate-800">{result.base_days} дней</span>
        </div>

        {/* Additions */}
        {result.additions && result.additions.map((a, i) => (
          <div key={i} className="flex items-start justify-between text-sm gap-2">
            <div className="flex items-start gap-1.5 text-amber-700 flex-1">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="leading-snug">{a.reason}</span>
            </div>
            <span className="font-medium text-amber-700 flex-shrink-0">+{a.days} дн.</span>
          </div>
        ))}

        {result.additions && result.additions.length === 0 && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Нет задержек</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold text-slate-700">Итого:</span>
              <span className="text-sm font-bold text-brand-700">{result.total_days} дней</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Готово:</div>
              <div className="text-sm font-bold text-brand-700">{formatDateRu(result.ready_date)}</div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="space-y-1 pt-1">
            {result.warnings.map((w, i) => (
              <div key={i} className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {w}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
