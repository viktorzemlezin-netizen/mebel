import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sofa, Upload, Palette, Users, CheckCircle, ChevronRight, Plus, X, Trash2, ImageIcon, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const ROLE_OPTIONS = ['Менеджер', 'Замерщик', 'Дизайнер', 'Монтажник', 'Снабженец', 'Технолог', 'Сборщик', 'Бухгалтер'];
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const ACCEPTED_EXT   = '.png,.jpg,.jpeg,.svg,.webp';

const STEPS = [
  { id: 1, icon: Upload,      title: 'Логотип',   desc: 'Загрузите логотип компании' },
  { id: 2, icon: Palette,     title: 'Цвета',      desc: 'Выберите фирменные цвета' },
  { id: 3, icon: Users,       title: 'Сотрудники', desc: 'Добавьте первых сотрудников' },
  { id: 4, icon: CheckCircle, title: 'Готово',     desc: 'Всё настроено!' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setRole, setBranding } = useApp();
  const [step, setStep] = useState(1);

  // Step 1: logo as base64
  const [logoBase64, setLogoBase64]   = useState(null);
  const [logoError, setLogoError]     = useState('');
  const [dragOver, setDragOver]       = useState(false);
  const [analyzingColors, setAnalyzingColors] = useState(false);
  const [colorsFromLogo, setColorsFromLogo]   = useState(false);
  const fileRef = useRef();

  // Step 2: colors
  const [primaryColor, setPrimaryColor] = useState('#0062d1');
  const [accentColor,  setAccentColor]  = useState('#0a7df5');
  const [textColor,    setTextColor]    = useState('#ffffff');
  const [companyStyle, setCompanyStyle] = useState(null); // 'modern'|'classic'|'minimal'|'bold'

  // Step 3: employees
  const [employees, setEmployees] = useState([{ name: '', role: 'Менеджер', email: '', password: '' }]);
  const [saving, setSaving] = useState(false);

  // ── Logo upload helpers ────────────────────────────────────────────────────
  const analyzeColors = async (base64) => {
    setAnalyzingColors(true);
    try {
      const data = await api.analyzeLogoColors({ image: base64 });
      if (data.primary_color && data.accent_color) {
        setPrimaryColor(data.primary_color);
        setAccentColor(data.accent_color);
        if (data.text_color)    setTextColor(data.text_color);
        if (data.company_style) setCompanyStyle(data.company_style);
        document.documentElement.style.setProperty('--color-primary', data.primary_color);
        document.documentElement.style.setProperty('--color-accent',  data.accent_color);
        setColorsFromLogo(true);
      }
    } catch {}
    setAnalyzingColors(false);
  };

  const processFile = (file) => {
    if (!file) return;
    setLogoError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError('Поддерживаются PNG, JPG, SVG, WebP');
      return;
    }
    if (file.size > 500 * 1024) {
      setLogoError('Файл не должен превышать 500 КБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoBase64(e.target.result);
      // Auto-detect colors from non-SVG logos
      if (file.type !== 'image/svg+xml') {
        analyzeColors(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const removeLogo = () => { setLogoBase64(null); setLogoError(''); setColorsFromLogo(false); };

  // ── Employee helpers ───────────────────────────────────────────────────────
  const addEmployee = () =>
    setEmployees(prev => [...prev, { name: '', role: 'Менеджер', email: '', password: '' }]);

  const removeEmployee = (idx) =>
    setEmployees(prev => prev.filter((_, i) => i !== idx));

  const updateEmployee = (idx, key, val) =>
    setEmployees(prev => prev.map((e, i) => i === idx ? { ...e, [key]: val } : e));

  // ── Step navigation ────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === 2) {
      try {
        await api.saveBranding({
          primary_color: primaryColor,
          accent_color:  accentColor,
          logo_url:      logoBase64 || null,
        });
        setBranding({ primary_color: primaryColor, accent_color: accentColor, logo_url: logoBase64 || null });
      } catch {}
    }
    if (step === 3) {
      setSaving(true);
      try {
        for (const emp of employees) {
          if (emp.name.trim() && emp.email.trim() && emp.password) {
            await api.createEmployee({
              name: emp.name.trim(), role: emp.role,
              email: emp.email.trim(), password: emp.password,
            }).catch(() => {});
          }
        }
      } finally {
        setSaving(false);
      }
    }
    setStep(s => s + 1);
  };

  const handleSkip = () => setStep(s => s + 1);

  const handleEnter = () => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const ROLE_META = { 'Руководитель': { initials: 'РУК', avatarBg: 'bg-purple-600' } };
        const meta = ROLE_META[user.role] || { initials: '??', avatarBg: 'bg-slate-600' };
        setRole({ role: user.role, name: user.name, ...meta });
      } catch {}
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sofa className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">FurnFlow</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-1.5 ${step >= s.id ? 'text-brand-600' : 'text-slate-300'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${step > s.id ? 'bg-brand-600 border-brand-600 text-white'
                    : step === s.id ? 'border-brand-600 text-brand-600'
                    : 'border-slate-200 text-slate-300'}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 max-w-8 ${step > s.id ? 'bg-brand-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

          {/* ── Step 1: Logo ── */}
          {step === 1 && (
            <div>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Логотип компании</h2>
              <p className="text-sm text-slate-500 mb-6">Загрузите логотип с устройства (необязательно)</p>

              {logoBase64 ? (
                /* Preview */
                <div className="space-y-3">
                  {/* Analyzing banner */}
                  {analyzingColors && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl animate-pulse">
                      <span className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-brand-700">Анализируем ваш бренд...</p>
                        <p className="text-xs text-brand-500">ИИ определяет цвета и стиль из логотипа</p>
                      </div>
                    </div>
                  )}

                  {/* Logo + info row */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={logoBase64}
                      alt="Логотип"
                      className="h-16 w-auto max-w-[140px] object-contain rounded-lg bg-white border border-slate-200 p-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">Логотип загружен</p>
                      {colorsFromLogo && !analyzingColors ? (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-600 font-medium">✓ Бренд распознан</span>
                            {companyStyle && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium capitalize">
                                {companyStyle === 'modern' ? 'современный' : companyStyle === 'classic' ? 'классический' : companyStyle === 'minimal' ? 'минималистичный' : 'смелый'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: primaryColor }} />
                            <span className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: accentColor }} />
                            <span className="text-xs text-slate-400 ml-1">Цвета применены</span>
                          </div>
                        </div>
                      ) : !analyzingColors ? (
                        <p className="text-xs text-slate-400 mt-1">Нажмите «Удалить» чтобы выбрать другой</p>
                      ) : null}
                    </div>
                    <button
                      onClick={removeLogo}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Удалить
                    </button>
                  </div>

                  {/* Brand preview card */}
                  {colorsFromLogo && !analyzingColors && (
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <div className="px-4 py-3 flex items-center justify-between" style={{ background: primaryColor }}>
                        <span className="text-sm font-bold" style={{ color: textColor }}>Ваш бренд</span>
                        <div className="flex gap-1.5">
                          {[1,2,3].map(i => <span key={i} className="w-2 h-2 rounded-full opacity-70" style={{ background: textColor }} />)}
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-white flex items-center justify-between">
                        <span className="text-xs text-slate-500">Интерфейс будет оформлен в ваших цветах</span>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: accentColor, color: textColor }}>
                          Готово →
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Upload zone */
                <div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
                      ${dragOver
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${dragOver ? 'bg-brand-100' : 'bg-slate-100'}`}>
                      <ImageIcon className={`w-6 h-6 ${dragOver ? 'text-brand-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Перетащите файл или{' '}
                        <span className="text-brand-600 underline underline-offset-2">выберите с устройства</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, WebP · до 500 КБ</p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={ACCEPTED_EXT}
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {logoError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                      <X className="w-4 h-4 flex-shrink-0" /> {logoError}
                    </p>
                  )}

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mt-3 w-full btn-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload className="w-4 h-4" /> Выбрать файл
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={handleSkip} className="btn-secondary flex-1">Пропустить</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Далее <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Colors ── */}
          {step === 2 && (
            <div>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Фирменные цвета</h2>
              <p className="text-sm text-slate-500 mb-4">Настройте цветовую схему интерфейса</p>

              {logoBase64 && (
                <button
                  onClick={() => analyzeColors(logoBase64)}
                  disabled={analyzingColors}
                  className="mb-4 w-full flex items-center justify-center gap-2 text-sm border border-dashed border-brand-300 text-brand-600 rounded-xl py-2.5 hover:bg-brand-50 transition-colors disabled:opacity-50"
                >
                  {analyzingColors ? (
                    <><span className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" /> Определяю цвета...</>
                  ) : (
                    <><Palette className="w-4 h-4" /> Определить цвета из логотипа</>
                  )}
                </button>
              )}

              <div className="space-y-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Основной цвет</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                    <input className="input flex-1" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      placeholder="#0062d1" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Акцентный цвет</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                    <input className="input flex-1" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      placeholder="#0a7df5" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg" style={{ background: primaryColor }} />
                  <div className="h-8 flex-1 rounded-lg" style={{ background: accentColor }} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSkip} className="btn-secondary flex-1">Пропустить</button>
                <button onClick={handleNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Далее <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Employees ── */}
          {step === 3 && (
            <div>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Сотрудники</h2>
              <p className="text-sm text-slate-500 mb-5">Добавьте первых сотрудников (необязательно)</p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {employees.map((emp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Сотрудник {idx + 1}</span>
                      {employees.length > 1 && (
                        <button onClick={() => removeEmployee(idx)} className="text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="Имя" value={emp.name}
                        onChange={e => updateEmployee(idx, 'name', e.target.value)} />
                      <select className="input text-sm" value={emp.role}
                        onChange={e => updateEmployee(idx, 'role', e.target.value)}>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" type="email" placeholder="Email" value={emp.email}
                        onChange={e => updateEmployee(idx, 'email', e.target.value)} />
                      <input className="input text-sm" type="password" placeholder="Пароль" value={emp.password}
                        onChange={e => updateEmployee(idx, 'password', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addEmployee}
                className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-brand-600 border border-dashed border-brand-300 rounded-xl py-2.5 hover:bg-brand-50 transition-colors">
                <Plus className="w-4 h-4" /> Добавить ещё
              </button>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSkip} className="btn-secondary flex-1">Пропустить</button>
                <button onClick={handleNext} disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <>Далее <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Всё готово!</h2>
              <p className="text-slate-500 mb-6">
                Ваша компания настроена. Теперь вы можете начать работу с заказами, клиентами и командой.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-900 text-lg">0</div>
                  <div className="text-slate-500">Заказов</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-900 text-lg">{employees.filter(e => e.name).length + 1}</div>
                  <div className="text-slate-500">Сотрудников</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="font-semibold text-slate-900 text-lg">✓</div>
                  <div className="text-slate-500">Настроено</div>
                </div>
              </div>

              <button onClick={handleEnter}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold">
                Войти в систему <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
