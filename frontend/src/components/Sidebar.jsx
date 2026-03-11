import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, BarChart2, Calculator, Sofa, Ruler, Users, FileText, Calendar, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const ALL_NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Дашборд',      roles: ['Руководитель', 'Менеджер'] },
  { to: '/orders',      icon: Package,         label: 'Заказы',       roles: ['Руководитель', 'Менеджер', 'Дизайнер', 'Монтажник'] },
  { to: '/constructor', icon: Calculator,      label: 'Конструктор',  roles: ['Руководитель', 'Менеджер'] },
  { to: '/analytics',   icon: BarChart2,       label: 'Аналитика',    roles: ['Руководитель'] },
  { to: '/measurer',    icon: Ruler,           label: 'Мои замеры',   roles: ['Руководитель', 'Замерщик'] },
  { to: '/clients',     icon: Users,           label: 'Клиенты',      roles: ['Руководитель', 'Менеджер'], disabled: true },
  { to: '/documents',   icon: FileText,        label: 'Документы',    roles: ['Руководитель', 'Дизайнер'], disabled: true },
  { to: '/schedule',    icon: Calendar,        label: 'Мой график',   roles: ['Руководитель', 'Монтажник'], disabled: true },
];

export default function Sidebar({ open, onToggle }) {
  const { currentRole, setRole } = useApp();
  const navigate = useNavigate();

  const roleName = currentRole?.role || null;
  const nav = ALL_NAV.filter(item => !roleName || item.roles.includes(roleName));

  const handleLogout = () => {
    setRole(null);
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-white border-r border-slate-100 transition-all duration-300
          ${open ? 'w-56' : 'w-0 lg:w-16'} overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 min-w-[4rem]">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sofa className="w-4 h-4 text-white" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-base leading-tight">FurnFlow</div>
              <div className="text-xs text-slate-400">Мебельные заказы</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {nav.map(({ to, icon: Icon, label, disabled }) => (
            disabled ? (
              <div
                key={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 cursor-not-allowed"
                title="В разработке"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span className="whitespace-nowrap">{label}</span>}
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span className="whitespace-nowrap">{label}</span>}
              </NavLink>
            )
          ))}
        </nav>

        {/* Footer: role + logout */}
        <div className={`border-t border-slate-100 px-2 py-3 ${open ? 'flex items-center gap-2' : 'flex justify-center'}`}>
          {open && currentRole ? (
            <>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${currentRole.avatarBg}`}>
                {currentRole.initials?.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-700 truncate">{currentRole.role}</div>
                <div className="text-xs text-slate-400">FurnFlow v1.0</div>
              </div>
              <button onClick={handleLogout} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600" title="Выйти">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : open ? (
            <p className="text-xs text-slate-400 px-2">FurnFlow v1.0</p>
          ) : (
            currentRole && (
              <button onClick={handleLogout} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600" title="Выйти">
                <LogOut className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
}
