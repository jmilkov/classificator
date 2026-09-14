'use client';

import { useState, useEffect } from 'react';

export default function MeasurementsManagement() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', unit: '', prefix: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const loadMeasurements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/measurements/list');
      if (!res.ok) throw new Error('Failed to fetch measurements');
      const data = await res.json();
      setMeasurements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredMeasurements = measurements.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.prefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMeasurements = [...filteredMeasurements].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key].toLowerCase();
    const bVal = b[sortConfig.key].toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const deleteMeasurement = async (id) => {
    if (!confirm('Вы уверены?')) return;
    try {
      const res = await fetch('/api/v1/measurements/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to delete');
      loadMeasurements();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveMeasurement = async () => {
    try {
      const res = await fetch('/api/v1/measurements/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setEditingMeasurement(null);
      loadMeasurements();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, []);

  return (
    <div className="app-main">
      <header className="header">
        <h1>Измерения</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Поиск..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }} 
          />
          <button className="btn primary" onClick={() => { setEditingMeasurement({}); setFormData({ id: '', name: '', unit: '', prefix: '' }); }}>Добавить измерение</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Название {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('unit')} style={{ cursor: 'pointer' }}>Единица {sortConfig.key === 'unit' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('prefix')} style={{ cursor: 'pointer' }}>Префикс {sortConfig.key === 'prefix' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedMeasurements.map(m => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.unit}</td>
                <td>{m.prefix}</td>
                <td>
                  <button className="btn ghost" onClick={() => { setEditingMeasurement(m.id); setFormData(m); }}>Редактировать</button>
                  <button className="btn ghost" onClick={() => { setEditingMeasurement({}); setFormData({ ...m, id: '' }); }}>Копия</button>
                  <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteMeasurement(m.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingMeasurement !== null && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--ink-900)' }}>{editingMeasurement.id ? 'Редактировать измерение' : 'Создать измерение'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Название</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Единица</label>
                <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Префикс</label>
                <input type="text" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button className="btn primary" onClick={saveMeasurement} style={{ flex: 1 }}>Сохранить</button>
              <button className="btn ghost" onClick={() => setEditingMeasurement(null)} style={{ flex: 1 }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
