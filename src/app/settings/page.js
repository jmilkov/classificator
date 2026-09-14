'use client';
import { useState, useEffect } from 'react';
import { fetchConfig, fetchMe, updateConfig } from '@/utils/api';

const APP_VERSION = 'v1.23.12';

export default function SettingsPage() {
  const [appConfig, setAppConfig] = useState({ 
    defaultArea: '', 
    defaultAreas: [],
    zabbixUrl: '',
    zabbixUser: '',
    zabbixPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const TZ_LABEL = LOCAL_TZ.replace('_', ' ');

  useEffect(() => {
    fetchMe().then(payload => {
      setUserRole(payload.user?.role || 'user');
    }).catch(console.error);
    
    fetchConfig().then(cfg => {
      setAppConfig(cfg);
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateConfig(appConfig);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'admin') return null;

  return (
    <div className="settings-container">
      <header className="header">
        <div>
          <h1 className="title">Настройки системы</h1>
          <p className="subtitle">Конфигурация подключения и параметры по умолчанию</p>
        </div>
        <button className="btn primary" onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={loading}>
          {isEditing ? (loading ? 'Сохранение...' : 'Сохранить') : 'Редактировать'}
        </button>
      </header>

      <div className="settings-card">
        <h2 className="settings-title">Общие параметры</h2>
        <div className="settings-grid">
          {['zabbixUrl', 'zabbixUser', 'zabbixPassword'].map(field => (
            <div key={field} className="settings-item">
              <label>{field.replace('zabbix', 'Zabbix ')}</label>
              {isEditing ? (
                <input 
                  type={field.includes('Password') ? 'password' : 'text'}
                  value={appConfig[field]} 
                  onChange={e => setAppConfig({...appConfig, [field]: e.target.value})}
                />
              ) : (
                <div className="settings-value">{field.includes('Password') ? '••••••••' : appConfig[field] || 'Не задан'}</div>
              )}
            </div>
          ))}
          {/* Убрано: Режим Master */}
        </div>
      </div>
    </div>
  );
}
