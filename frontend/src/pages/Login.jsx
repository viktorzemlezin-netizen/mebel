import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sofa, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';

const ROLE_META = {
  'Руководитель': { initials: 'РУК', avatarBg: 'bg-purple-600' },
  'Менеджер':     { initials: 'МНЖ', avatarBg: 'bg-blue-600' },
  'Замерщик':     { initials: 'ЗАМ', avatarBg: 'bg-amber-500' },
  'Дизайнер':     { initials: 'ДЗН', avatarBg: 'bg-pink-600' },
  'Монтажник':    { initials: 'МНТ', avatarBg: 'bg-emerald-600' },
  'Снабженец':    { initials: 'СНБ', avatarBg: 'bg-teal-600' },
  'Технолог':     { initials: 'ТЕХ', avatarBg: 'bg-indigo-600' },
  'Сборщик':      { initials: 'СБР', avatarBg: 'bg-orange-600' },
  'Бухгалтер':    { initials: 'БУХ', avatarBg: 'bg-green-600' },
};

const DEMO_ROLES = [
  { role: 'Руководитель', icon: '👑', description: 'Полный доступ: аналитика, финансы, все заказы', color: 'purple' },
  { role: 'Менеджер',     icon: '💼', description: 'Лиды, заказы, клиенты, воронка продаж',         color: 'blue' },
  { role: 'Замерщик',     icon: '📐', description: 'Выезды на замер, ввод размеров в мм',            color: 'amber' },
  { role: 'Дизайнер',     icon: '🎨', description: 'Проекты, файлы, ссылки, дизайн-заметки',        color: 'pink' },
  { role: 'Монтажник',    icon: '🔩', description: 'Монтаж, фотоотчёт, чек-лист установки',         color: 'emerald' },
  { role: 'Снабженец',    icon: '🛒', description: 'Закупки, поставщики, остатки материалов',        color: 'teal' },
  { role: 'Технолог',     icon: '⚙️', description: 'Производственные задачи, чек-лист цехов',       color: 'indigo' },
  { role: 'Сборщик',      icon: '🔨', description: 'Сборочные задания, статусы по шагам',            color: 'orange' },
  { role: 'Бухгалтер',    icon: '💰', description: 'Платежи, финансовая сводка, отчёты',             color: 'green' },
];

const COLOR_MAP = {
  purple:  { card: 'bg-purple-50 border-purple-200 hover:bg-purple-100',  text: 'text-purple-700',  badge: 'bg-purple-600' },
  blue:    { card: 'bg-blue-50 border-blue-200 hover:bg-blue-100',        text: 'text-blue-700',    badge: 'bg-blue-600' },
  amber:   { card: 'bg-amber-50 border-amber-200 hover:bg-amber-100',     text: 'text-amber-700',   badge: 'bg-amber-500' },
  pink:    { card: 'bg-pink-50 border-pink-200 hover:bg-pink-100',        text: 'text-pink-700',    badge: 'bg-pink-600' },
  emerald: { card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600' },
  teal:    { card: 'bg-teal-50 border-teal-200 hover:bg-teal-100',        text: 'text-teal-700',    badge: 'bg-teal-600' },
  indigo:  { card: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',  text: 'text-indigo-700',  badge: 'bg-indigo-600' },
  orange:  { card: 'bg-orange-50 border-orange-200 hover:bg-orange-100',  text: 'text-orange-700',  badge: 'bg-orange-600' },
  green:   { card: 'bg-green-50 border-green-200 hover:bg-green-100',     text: 'text-green-700',   badge: 'bg-green-600' },
};

export default function Login() {
  const { setRole } = useApp();
  const navigate    = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const [error, setError]           = useState('');
  const [showDemo, setShowDemo]     = useState(false);

  const loginWithData = (data, isDemo = false) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify({ role: data.role, name: data.name, company_id: data.company_id }));
    if (isDemo) localStorage.setItem('is_demo', data.role);
    else localStorage.removeItem('is_demo');
    const meta = ROLE_META[data.role] || { initials: '??', avatarBg: 'bg-slate-600' };
    setRole({ role: data.role, name: data.name, ...meta });
    if (data.role === 'Замерщик') navigate('/measurer');
    else if (['Снабженец', 'Технолог', 'Сборщик'].includes(data.role)) navigate('/orders');
    else if (data.role === 'Бухгалтер') navigate('/finance');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.login({ email: email.trim(), password });
      loginWithData(data);
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setDemoLoading(role);
    setError('');
    try {
      const data = await api.demoLogin(role);
      loginWithData(data, true);
    } catch (err) {
      setError('Ошибка демо-входа: ' + err.message);
    } finally {
      setDemoLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sofa className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">FurnFlow</div>
            <div className="text-sm text-slate-500">Мебельные заказы</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Вход в систему</h1>
          <p className="text-sm text-slate-500 mb-6">Введите email и пароль</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="you@company.ru"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Войти <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setShowDemo(d => !d)}
              className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-700 transition-colors py-1"
            >
              <span className="font-medium">⚡ Попробовать без регистрации</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
            </button>

            {showDemo && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-3">Выберите роль — войдёте мгновенно, без пароля:</p>
                <div className="grid grid-cols-1 gap-2">
                  {DEMO_ROLES.map(({ role, icon, description, color }) => {
                    const c = COLOR_MAP[color];
                    return (
                      <button
                        key={role}
                        onClick={() => handleDemoLogin(role)}
                        disabled={!!demoLoading}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all disabled:opacity-50 ${c.card}`}
                      >
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${c.badge} text-white`}>
                          {demoLoading === role
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                            : icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${c.text}`}>{role}</p>
                          <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate">{description}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 opacity-40 ${c.text}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Зарегистрировать компанию
          </Link>
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">FurnFlow v1.0</p>
      </div>
    </div>
  );
}
