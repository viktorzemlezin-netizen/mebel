import React, { useState, useRef } from 'react';
import { Palette, Upload, X, Save, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const DEFAULT_PRIMARY = '#0062d1';
const DEFAULT_ACCENT  = '#0a7df5';

export default function BrandingSettings() {
  const { branding, setBranding, showToast, currentRole } = useApp();

  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || DEFAULT_PRIMARY);
  const [accentColor,  setAccentColor]  = useState(branding?.accent_color  || DEFAULT_ACCENT);
  const [companyName,  setCompanyName]  = useState(branding?.name || 'FurnFlow');
  const [logoPreview,  setLogoPreview]  = useState(branding?.logo_url || null);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef();

  const isManager = currentRole?.role === 'Руководитель';

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { showToast('Логотип не должен превышать 500 КБ', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isManager) return;
    setSaving(true);
    try {
      const updated = await api.saveBranding({
        name:          companyName,
        primary_color: primaryColor,
        accent_color:  accentColor,
        logo_url:      logoPreview,
      });
      setBranding(updated);
      showToast('Брендинг сохранён');
    } catch (e) {
      showToast('Ошибка при сохранении: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor(DEFAULT_PRIMARY);
    setAccentColor(DEFAULT_ACCENT);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Брендинг компании</h1>
        <p className="text-sm text-slate-500 mt-1">Настройте цвета и логотип для вашей компании</p>
      </div>

      {!isManager && (
        <div className="card p-4 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Только Руководитель может изменять брендинг.
        </div>
      )}

      {/* Company name */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Название компании
        </h2>
        <input
          type="text"
          className="input"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          disabled={!isManager}
          placeholder="Название компании"
        />
      </div>

      {/* Logo */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Логотип
        </h2>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Логотип"
                className="h-16 w-auto max-w-[160px] object-contain rounded-lg border border-slate-200 p-1"
              />
              {isManager && (
                <button
                  onClick={() => setLogoPreview(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center">
              Нет логотипа
            </div>
          )}
          {isManager && (
            <div className="space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" /> Загрузить
              </button>
              <p className="text-xs text-slate-400">PNG, SVG до 500 КБ</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          )}
        </div>
      </div>

      {/* Colors */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Цвета
          </h2>
          {isManager && (
            <button onClick={handleReset} className="btn-ghost text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Сбросить
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="label">Основной цвет</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                disabled={!isManager}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer disabled:cursor-not-allowed p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                disabled={!isManager}
                className="input flex-1 font-mono text-xs"
                placeholder="#0062d1"
              />
            </div>
            <div className="h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
          </div>

          <div className="space-y-2">
            <label className="label">Акцентный цвет</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                disabled={!isManager}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer disabled:cursor-not-allowed p-0.5"
              />
              <input
                type="text"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                disabled={!isManager}
                className="input flex-1 font-mono text-xs"
                placeholder="#0a7df5"
              />
            </div>
            <div className="h-8 rounded-lg" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Предпросмотр</h2>
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: primaryColor + '15' }}>
          {logoPreview ? (
            <img src={logoPreview} alt="logo" className="w-8 h-8 object-contain rounded-lg" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <span className="text-white text-xs font-bold">{companyName?.[0] || 'F'}</span>
            </div>
          )}
          <div>
            <div className="font-bold text-sm" style={{ color: primaryColor }}>{companyName || 'FurnFlow'}</div>
            <div className="text-xs text-slate-400">Мебельные заказы</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
            Основная кнопка
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
            Акцентная кнопка
          </button>
        </div>
      </div>

      {isManager && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение...' : 'Сохранить брендинг'}
        </button>
      )}
    </div>
  );
}
