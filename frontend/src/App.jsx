import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import Constructor from './pages/Constructor.jsx';
import ClientPortal from './pages/ClientPortal.jsx';
import Login from './pages/Login.jsx';
import Measurer from './pages/Measurer.jsx';

function RoleGuard({ children }) {
  const { currentRole } = useApp();
  if (!currentRole) return <Navigate to="/login" replace />;
  return children;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
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
            <Route path="/constructor"  element={<Constructor />} />
            <Route path="/analytics"    element={<Analytics />} />
            <Route path="/measurer"     element={<Measurer />} />
          </Routes>
        </main>
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
