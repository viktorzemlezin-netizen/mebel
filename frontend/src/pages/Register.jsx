import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sofa, Building2, User, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    manager_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    if (errors.global) setErrors(e => ({ ...e, global: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = 'Обязательное поле';
    if (!form.manager_name.trim()) e.manager_name = 'Обязательное поле';
    if (!form.email.trim()) e.email = 'Обязательное поле';
    if (!form.password) e.password = 'Обязательное поле';
    else if (form.password.length < 6) e.password = 'Минимум 6 символов';
    if (form.password !== form.password_confirm) e.password_confirm = 'Пароли не совпадают';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const data = await api.register({
        company_name: form.company_name.trim(),
        manager_name: form.manager_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify({ role: data.role, name: data.name, company_id: data.company_id }));
      navigate('/onboarding');
    } catch (err) {
      setErrors({ global: err.message || 'Ошибка регистрации' });
    } finally {
      setLoading(false);
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Регистрация компании</h1>
          <p className="text-sm text-slate-500 mb-6">Создайте аккаунт для вашей мебельной компании</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Название компании</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className={`input pl-9 ${errors.company_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="ООО «МебельПро»"
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                />
              </div>
              {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
            </div>

            {/* Manager name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ваше имя (руководитель)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className={`input pl-9 ${errors.manager_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Иванов Иван Иванович"
                  value={form.manager_name}
                  onChange={e => set('manager_name', e.target.value)}
                />
              </div>
              {errors.manager_name && <p className="text-xs text-red-500 mt-1">{errors.manager_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  className={`input pl-9 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="director@company.ru"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Минимум 6 символов"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(p => !p)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Повторите пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-9 ${errors.password_confirm ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Повторите пароль"
                  value={form.password_confirm}
                  onChange={e => set('password_confirm', e.target.value)}
                />
              </div>
              {errors.password_confirm && <p className="text-xs text-red-500 mt-1">{errors.password_confirm}</p>}
            </div>

            {errors.global && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                {errors.global}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Зарегистрироваться <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
