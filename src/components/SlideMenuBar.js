'use client';

export default function SlideMenuBar({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  userLogin,
  userRole,
  authMode,
  onLogout,
  APP_VERSION
}) {
  const isAdmin = userRole === 'admin';
  return (
    <>
      {/* Overlay for mobile when menu is open */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {isOpen && <span className="logo-text">Classificator</span>}
          </div>
          <button className="sidebar-toggle-btn" onClick={onToggle} aria-label={isOpen ? "Свернуть меню" : "Развернуть меню"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <polyline points="15 18 9 12 15 6" />
              ) : (
                <polyline points="9 18 15 12 9 6" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {userLogin ? userLogin.substring(0, 2).toUpperCase() : 'U'}
          </div>
          {isOpen && (
            <div className="user-info">
              <div className="user-name" title={userLogin}>{userLogin}</div>
              <div className="user-role">
                {authMode === 'token' ? 'Токен' : authMode === 'login' ? 'Локальный пользователь' : 'Zabbix Пользователь'}
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <>
              <button
                className={`nav-item ${activeTab === 'sensors' ? 'active' : ''}`}
                onClick={() => onTabChange('sensors')}
                title="Приборы"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                {isOpen && <span className="nav-label">Приборы</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'hw-revision' ? 'active' : ''}`}
                onClick={() => onTabChange('hw-revision')}
                title="HW ревизия"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                {isOpen && <span className="nav-label">HW ревизия</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'connected-sensors' ? 'active' : ''}`}
                onClick={() => onTabChange('connected-sensors')}
                title="Подключаемые сенсоры"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {isOpen && <span className="nav-label">Подключаемые сенсоры</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => onTabChange('metrics')}
                title="Метрики"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
                {isOpen && <span className="nav-label">Метрики</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'metric-categories' ? 'active' : ''}`}
                onClick={() => onTabChange('metric-categories')}
                title="Категории метрик"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {isOpen && <span className="nav-label">Категории метрик</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'measurements' ? 'active' : ''}`}
                onClick={() => onTabChange('measurements')}
                title="Измерения"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {isOpen && <span className="nav-label">Измерения</span>}
              </button>

              <button
                className={`nav-item ${activeTab === 'locations' ? 'active' : ''}`}
                onClick={() => onTabChange('locations')}
                title="Места установок"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                </svg>
                {isOpen && <span className="nav-label">Места установок</span>}
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {isOpen && <div className="sidebar-version">{APP_VERSION}</div>}
          <button className="nav-item logout-btn" onClick={onLogout} title="Выйти">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {isOpen && <span className="nav-label">Выйти</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
