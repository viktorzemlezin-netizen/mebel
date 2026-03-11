import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sofa, Crown, Briefcase, Ruler, Palette, Wrench, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const ROLE_OPTIONS = [
  {
    role: 'Руководитель',
    icon: Crown,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    activeColor: 'bg-purple-600 text-white border-purple-600',
    desc: 'Полный доступ ко всем разделам и настройкам',
    initials: 'РУК',
    avatarBg: 'bg-purple-600',
  },
  {
    role: 'Менеджер',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-600',
    desc: 'Заказы, конструктор, клиенты, дашборд',
    initials: 'МНЖ',
    avatarBg: 'bg-blue-600',
  },
  {
    role: 'Замерщик',
    icon: Ruler,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-500 text-white border-amber-500',
    desc: 'Только задачи на замер с фото и чек-листами',
    initials: 'ЗАМ',
    avatarBg: 'bg-amber-500',
  },
  {
    role: 'Дизайнер',
    icon: Palette,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    activeColor: 'bg-pink-600 text-white border-pink-600',
    desc: 'Заказы, дизайн-файлы, спецификации',
    initials: 'ДЗН',
    avatarBg: 'bg-pink-600',
  },
  {
    role: 'Монтажник',
    icon: Wrench,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    activeColor: 'bg-emerald-600 text-white border-emerald-600',
    desc: 'Назначенные заказы и график монтажа',
    initials: 'МНТ',
    avatarBg: 'bg-emerald-600',
  },
];

export default function Login() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleEnter = () => {
    if (!selected) return;
    const opt = ROLE_OPTIONS.find(r => r.role === selected);
    setRole(opt);
    // Redirect based on role
    if (selected === 'Замерщик') navigate('/measurer');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Выберите роль для входа</h1>
          <p className="text-sm text-slate-500 mb-6">Демо-режим — авторизация не требуется</p>

          <div className="space-y-2.5">
            {ROLE_OPTIONS.map(({ role, icon: Icon, color, activeColor, desc }) => {
              const isActive = selected === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelected(role)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left
                    ${isActive ? activeColor : color + ' hover:opacity-80'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{role}</div>
                    <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{desc}</div>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleEnter}
            disabled={!selected}
            className="mt-6 w-full btn-primary flex items-center justify-center gap-2 py-3 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Войти
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">FurnFlow v1.0 · Демо-стенд</p>
      </div>
    </div>
  );
}
