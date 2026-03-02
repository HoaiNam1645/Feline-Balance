import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import ProfilesPage from './pages/ProfilesPage';
import TopupPage from './pages/TopupPage';
import TeamsPage from './pages/TeamsPage';
import VendorsPage from './pages/VendorsPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import DesignStatisticsPage from './pages/DesignStatisticsPage';
import FulfillmentStatisticsPage from './pages/FulfillmentStatisticsPage';
import MediaPage from './pages/MediaPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import PayrollsPage from './pages/PayrollsPage';
import TeamFinancePage from './pages/TeamFinance/TeamFinance';
import StorePage from './pages/StorePage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      // Verify token is still valid
      fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            setUser(json.data);
            localStorage.setItem('user', JSON.stringify(json.data));
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout())
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  const handleLogin = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  }, []);

  const handleLogout = useCallback(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      }).catch(() => { });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  return (
    <BrowserRouter>
      {checking ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f0f23', color: '#6366f1',
        }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : !user ? (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-layout">
          {/* Mobile sidebar overlay */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/profiles" element={<ProfilesPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/topup" element={<TopupPage onMenuClick={() => setSidebarOpen(true)} />} />

              <Route path="/teams" element={
                <ProtectedRoute user={user} allowedRoles={['super_admin']}>
                  <TeamsPage onMenuClick={() => setSidebarOpen(true)} />
                </ProtectedRoute>
              } />
              <Route path="/vendors" element={
                <ProtectedRoute user={user} allowedRoles={['super_admin']}>
                  <VendorsPage onMenuClick={() => setSidebarOpen(true)} />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute user={user} allowedRoles={['super_admin']}>
                  <UsersPage onMenuClick={() => setSidebarOpen(true)} />
                </ProtectedRoute>
              } />
              <Route path="/roles" element={
                <ProtectedRoute user={user} allowedRoles={['super_admin']}>
                  <RolesPage onMenuClick={() => setSidebarOpen(true)} />
                </ProtectedRoute>
              } />
              <Route path="/team-finances" element={
                <ProtectedRoute user={user} allowedRoles={['super_admin', 'admin']}>
                  <TeamFinancePage onMenuClick={() => setSidebarOpen(true)} />
                </ProtectedRoute>
              } />
              <Route path="/stores" element={<StorePage onMenuClick={() => setSidebarOpen(true)} />} />

              <Route path="/design-statistics" element={<DesignStatisticsPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/fulfillment-statistics" element={<FulfillmentStatisticsPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/media" element={<MediaPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/employees" element={<EmployeesPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="/payrolls" element={<PayrollsPage onMenuClick={() => setSidebarOpen(true)} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}
