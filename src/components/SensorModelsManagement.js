'use client';

import { useState, useEffect } from 'react';

export default function SensorModelsManagement() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingModel, setEditingModel] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', prefix: '' });

  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hw-revision/list');
      if (!res.ok) throw new Error('Failed to fetch hw revisions');
      const data = await res.json();
      setModels(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteModel = async (id) => {
    if (!confirm('Вы уверены?')) return;
    try {
      const res = await fetch('/api/v1/hw-revision/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadModels();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveModel = async () => {
    try {
      const payload = { ...formData };
      if (!payload.id) {
        payload.id = Date.now().toString();
      }
      const res = await fetch('/api/v1/hw-revision/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingModel(null);
      loadModels();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div className="app-main">
      <header className="header">
        <h1>HW ревизии</h1>
        <button className="btn primary" onClick={() => { setEditingModel({}); setFormData({ id: '', name: '', description: '', prefix: '' }); }}>Добавить ревизию</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr><th>Название</th><th>Префикс</th><th>Описание</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.prefix}</td>
                <td>{m.description}</td>
                <td>
                  <button className="btn ghost" onClick={() => { setEditingModel(m.id); setFormData(m); }}>Редактировать</button>
                  <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteModel(m.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingModel !== null && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--ink-900)' }}>{editingModel.id ? 'Редактировать ревизию' : 'Создать ревизию'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Описание</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Префикс</label>
                <input type="text" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button className="btn primary" onClick={saveModel} style={{ flex: 1 }}>Сохранить</button>
              <button className="btn ghost" onClick={() => setEditingModel(null)} style={{ flex: 1 }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
