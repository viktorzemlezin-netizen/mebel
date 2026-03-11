import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error:   <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 max-w-sm">
        {icons[toast.type] || icons.success}
        <span className="text-sm text-slate-700 flex-1">{toast.message}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
