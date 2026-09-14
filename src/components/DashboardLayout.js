'use client';

import { useEffect, useState } from 'react';
import { fetchMe, login, logout } from '@/utils/api';
import LoginScreen from '@/components/LoginScreen';
import SlideMenuBar from '@/components/SlideMenuBar';
import { usePathname, useRouter } from 'next/navigation';

const APP_VERSION = 'v1.23.12';

export default function DashboardLayout({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [userLogin, setUserLogin] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [authMode, setAuthMode] = useState('login');
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchMe()
      .then(payload => {
        setUserLogin(payload.user?.login || '');
        setUserRole(payload.user?.role || 'user');
        setLoading(false);
      })
      .catch((e) => {
        console.error('Initial auth check failed:', e);
        setLoading(false);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  function resetLocalState() {
    setUserLogin('');
    setUserRole('user');
    setPassword('');
    setLoginError('');
    setLoading(false);
  }

  function toDisplayError(message) {
    return message === 'AUTH_REQUIRED' ? 'Сессия истекла' : `Ошибка: ${message}`;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const payload = await login(loginValue, password);
      const loginName = payload.user?.login || loginValue;
      setUserLogin(loginName);
      setUserRole(payload.user?.role || 'user');
    } catch (e) {
      setUserLogin('');
      setLoginError(e.message === 'INVALID_CREDENTIALS' ? 'Неверный логин или пароль' : toDisplayError(e.message));
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }

  async function handleLogout() {
    setUserLogin('');
    try {
      await logout();
    } finally {
      resetLocalState();
      setAuthChecked(true);
      router.push('/');
    }
  }

  if (!authChecked) {
    return <main className="auth-page"><section className="auth-card auth-card-compact">Проверка сессии…</section></main>;
  }

  if (!userLogin) {
  return (
    <LoginScreen
      loginValue={loginValue}
      password={password}
      error={loginError}
      loading={loading}
      onLoginChange={setLoginValue}
      onPasswordChange={setPassword}
      onSubmit={handleLoginSubmit}
      APP_VERSION={APP_VERSION}
    />
  );
  }

  const activeTab = pathname.split('/')[1] || 'home';

  return (
    <div className="app-container">
      <SlideMenuBar
        activeTab={activeTab}
        onTabChange={(tab) => router.push(tab === 'home' ? '/' : `/${tab}`)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userLogin={userLogin}
        userRole={userRole}
        authMode={authMode}
        onLogout={handleLogout}
        APP_VERSION={APP_VERSION}
      />

      {!sidebarOpen && (
        <button 
          className="menu-trigger-btn" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Открыть меню"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      <main className="app-main">
        {children}
        <span className="app-version" title="Версия приложения">{APP_VERSION}</span>
      </main>
    </div>
  );
}
