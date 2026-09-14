'use client';
import { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => { setConfig(data); setLoading(false); });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Сохранение...');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Конфигурация успешно обновлена');
      } else {
        setMessage('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (err) {
      setMessage('Ошибка при сохранении');
    }
  };

  if (loading) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="p-8">
      <h1 className="title">Конфигурация приложения</h1>
      <form onSubmit={handleSubmit} className="settings-card" style={{ maxWidth: '600px' }}>
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="settings-item" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>{key}</label>
            {typeof value === 'boolean' ? (
              <input
                type="checkbox"
                name={key}
                checked={value}
                onChange={handleChange}
              />
            ) : (
              <input
                type="text"
                name={key}
                value={value}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            )}
          </div>
        ))}
        <button type="submit" className="button" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Сохранить изменения
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}
