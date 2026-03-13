import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import ChatBot from './components/ChatBot.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import Constructor from './pages/Constructor.jsx';
import ClientPortal from './pages/ClientPortal.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Measurer from './pages/Measurer.jsx';
import Clients from './pages/Clients.jsx';
import ClientDetail from './pages/ClientDetail.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import PriceLists from './pages/PriceLists.jsx';
import Processes from './pages/Processes.jsx';
import Procurement from './pages/Procurement.jsx';
import Finance from './pages/Finance.jsx';
import RulesSettings from './pages/RulesSettings.jsx';
import MyTasks from './pages/MyTasks.jsx';
import BrandingSettings from './pages/BrandingSettings.jsx';

function RoleGuard({ children }) {
  const { currentRole } = useApp();
  if (!currentRole) return <Navigate to="/login" replace />;
  return children;
}

function DemoBanner() {
  const demoRole = localStorage.getItem('is_demo');
  if (!demoRole) return null;
  return (
    <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2 flex-shrink-0">
      <span>⚡ Демо режим</span>
      <span className="opacity-60">·</span>
      <span>{demoRole}</span>
      <span className="opacity-60">·</span>
      <span className="font-normal opacity-75">Данные сбрасываются каждые 24 часа</span>
    </div>
  );
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <DemoBanner />
      <div className="flex flex-1">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-56' : 'lg:ml-16'
        }`}
      >
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4 sm:p-6">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/orders"       element={<Orders />} />
            <Route path="/orders/:id"   element={<OrderDetail />} />
            <Route path="/clients"      element={<Clients />} />
            <Route path="/clients/:id"  element={<ClientDetail />} />
            <Route path="/constructor"  element={<Constructor />} />
            <Route path="/analytics"    element={<Analytics />} />
            <Route path="/measurer"     element={<Measurer />} />
            <Route path="/leads"        element={<Leads />} />
            <Route path="/leads/:id"    element={<LeadDetail />} />
            <Route path="/pricelists"   element={<PriceLists />} />
            <Route path="/processes"   element={<Processes />} />
            <Route path="/procurement"     element={<Procurement />} />
            <Route path="/finance"         element={<Finance />} />
            <Route path="/settings/rules"     element={<RulesSettings />} />
            <Route path="/settings/branding"  element={<BrandingSettings />} />
            <Route path="/my-tasks"           element={<MyTasks />} />
          </Routes>
        </main>
      </div>
      <ChatBot systemType="internal" />
      </div>
    </div>
  );
}

function AppToast() {
  const { toast, showToast } = useApp();
  return <Toast toast={toast} onClose={() => showToast(null)} />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/portal/:token" element={<ClientPortal />} />
        <Route path="/login" element={<LoginOrRedirect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/*" element={<RoleGuard><Layout /></RoleGuard>} />
      </Routes>
      <AppToast />
    </AppProvider>
  );
}

// Redirect to home if already logged in
function LoginOrRedirect() {
  const { currentRole } = useApp();
  if (currentRole) return <Navigate to="/" replace />;
  return <Login />;
}
