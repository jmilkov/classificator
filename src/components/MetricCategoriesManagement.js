'use client';

import { useState, useEffect } from 'react';

export default function MetricCategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', prefix: '' });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/metric-categories/list');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch('/api/v1/metric-categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveCategory = async () => {
    try {
      const res = await fetch('/api/v1/metric-categories/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="app-main">
      <header className="header">
        <h1>Категории метрик</h1>
        <button className="btn primary" onClick={() => { setEditingCategory({}); setFormData({ id: '', name: '', description: '', prefix: '' }); }}>Добавить категорию</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr><th>Название</th><th>Префикс</th><th>Описание</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.prefix}</td>
                <td>{c.description}</td>
                <td>
                  <button className="btn ghost" onClick={() => { setEditingCategory(c.id); setFormData(c); }}>Редактировать</button>
                  <button className="btn ghost" onClick={() => { setEditingCategory({}); setFormData({ ...c, id: '' }); }}>Копия</button>
                  <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteCategory(c.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCategory !== null && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--ink-900)' }}>{editingCategory.id ? 'Редактировать категорию' : 'Создать категорию'}</h2>
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
              <button className="btn primary" onClick={saveCategory} style={{ flex: 1 }}>Сохранить</button>
              <button className="btn ghost" onClick={() => setEditingCategory(null)} style={{ flex: 1 }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
