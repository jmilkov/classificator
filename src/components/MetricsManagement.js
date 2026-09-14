'use client';

import { useState, useEffect } from 'react';

export default function MetricsManagement() {
  const [metrics, setMetrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMetric, setEditingMetric] = useState(null);
  const [formData, setFormData] = useState({ id: '', categoryId: '', measurementId: '', description: '', prefix: '', metricNumber: 0 });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const getPrefix = (metric) => {
    let prefix = metric.prefix || '';
    if (metric.metricNumber && parseInt(metric.metricNumber) > 0) {
      prefix += metric.metricNumber;
    }
    return prefix;
  };

  const filteredMetrics = metrics.filter(m => {
    const matchesSearch = getPrefix(m).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || m.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    // Специальная обработка для категории
    if (sortConfig.key === 'categoryId') {
      aVal = categories.find(c => c.id === a.categoryId)?.name || '';
      bVal = categories.find(c => c.id === b.categoryId)?.name || '';
    }
    // Специальная обработка для измерения
    if (sortConfig.key === 'measurementId') {
      aVal = measurements.find(m => m.id === a.measurementId)?.name || '';
      bVal = measurements.find(m => m.id === b.measurementId)?.name || '';
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, categoriesRes, measurementsRes] = await Promise.all([
        fetch('/api/v1/metrics/list'),
        fetch('/api/v1/metric-categories/list'),
        fetch('/api/v1/measurements/list')
      ]);
      if (!metricsRes.ok || !categoriesRes.ok || !measurementsRes.ok) throw new Error('Ошибка загрузки данных');
      const metricsData = await metricsRes.json();
      const categoriesData = await categoriesRes.json();
      const measurementsData = await measurementsRes.json();
      setMetrics(metricsData);
      setCategories(categoriesData);
      setMeasurements(measurementsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMetric = async (id) => {
    if (!confirm('Вы уверены?')) return;
    try {
      const response = await fetch('/api/v1/metrics/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('Ошибка удаления');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateAllPrefixes = async () => {
    if (!confirm('Обновить префиксы для всех метрик?')) return;
    
    const updatedMetrics = metrics.map(m => {
      const category = categories.find(c => c.id === m.categoryId);
      const measurement = measurements.find(meas => meas.id === m.measurementId);
      const newPrefix = category && measurement ? `${category.prefix || ''}_${measurement.prefix || ''}` : m.prefix;
      return {
        ...m,
        prefix: newPrefix,
        metricNumber: m.metricNumber || 0
      };
    });

    try {
      await Promise.all(updatedMetrics.map(m => 
        fetch('/api/v1/metrics/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        })
      ));
      loadData();
      alert('Префиксы обновлены');
    } catch (err) {
      alert('Ошибка при обновлении: ' + err.message);
    }
  };

  const saveMetric = async () => {
    try {
      const payload = { ...formData };
      
      const category = categories.find(c => c.id === payload.categoryId);
      const measurement = measurements.find(m => m.id === payload.measurementId);
      
      if (category && measurement) {
        payload.prefix = `${category.prefix || ''}_${measurement.prefix || ''}`;
      }
      
      // Обеспечиваем корректное обновление или создание
      if (editingMetric === 'new') {
        payload.id = Date.now().toString();
      } else {
        payload.id = editingMetric;
      }
      
      payload.metricNumber = parseInt(payload.metricNumber) || 0;
      
      const currentPrefix = getPrefix(payload);
      const isDuplicate = metrics.some(m => m.id !== payload.id && getPrefix(m) === currentPrefix);
      
      if (isDuplicate) {
        alert(`Ошибка: метрика с префиксом "${currentPrefix}" уже существует.`);
        return;
      }
      
      // Проверка на уникальность oldPrefix внутри своего префикса (если задан oldPrefix)
      if (payload.oldPrefix) {
        const isOldPrefixDuplicate = metrics.some(m => 
            m.id !== payload.id && 
            m.oldPrefix === payload.oldPrefix
        );
        
        if (isOldPrefixDuplicate) {
            alert(`Ошибка: метрика со старым префиксом "${payload.oldPrefix}" уже существует.`);
            return;
        }
      }
      
      const response = await fetch('/api/v1/metrics/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }
      
      setEditingMetric(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="app-main">
      <header className="header">
        <h1>📊 Управление метриками</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Поиск..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }} 
          />
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', backgroundColor: 'white' }}
          >
            <option value="">Все категории</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn ghost" onClick={updateAllPrefixes}>Обновить префиксы</button>
          <button className="btn primary" onClick={() => { setFormData({ id: '', categoryId: '', measurementId: '', description: '', prefix: '', metricNumber: 0 }); setEditingMetric('new'); }}>Добавить метрику</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('prefix')} style={{ cursor: 'pointer' }}>Префикс {sortConfig.key === 'prefix' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('oldPrefix')} style={{ cursor: 'pointer' }}>Старый префикс {sortConfig.key === 'oldPrefix' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('categoryId')} style={{ cursor: 'pointer' }}>Категория {sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('measurementId')} style={{ cursor: 'pointer' }}>Измерение {sortConfig.key === 'measurementId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th onClick={() => requestSort('description')} style={{ cursor: 'pointer' }}>Описание {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              <th style={{ textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedMetrics.map((m) => (
              <tr key={m.id} onDoubleClick={() => { setFormData(m); setEditingMetric(m.id); }}>
                <td>{getPrefix(m)}</td>
                <td>{m.oldPrefix || '-'}</td>
                <td>{categories.find(c => c.id === m.categoryId)?.name || 'Не задано'}</td>
                <td>{measurements.find(meas => meas.id === m.measurementId)?.name || 'Не задано'}</td>
                <td>{m.description}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn ghost" onClick={(e) => { e.stopPropagation(); setFormData(m); setEditingMetric(m.id); }}>Редактировать</button>
                  <button className="btn ghost" onClick={(e) => { e.stopPropagation(); setFormData({...m, id: ''}); setEditingMetric('new'); }}>Копия</button>
                  <button className="btn ghost" style={{ color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); deleteMetric(m.id); }}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingMetric && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
            <header className="modal-header" style={{ padding: '0', border: 'none' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: 'var(--ink-900)' }}>{editingMetric === 'new' ? 'Новая метрика' : 'Редактирование метрики'}</h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Категория</label>
                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%', backgroundColor: 'white' }}>
                  <option value="">Выберите категорию</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.prefix})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Измерение</label>
                <select value={formData.measurementId} onChange={e => setFormData({...formData, measurementId: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%', backgroundColor: 'white' }}>
                  <option value="">Выберите измерение</option>
                  {measurements.map(m => <option key={m.id} value={m.id}>{m.name} ({m.prefix})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Старый префикс</label>
                <input type="text" value={formData.oldPrefix || ''} onChange={e => setFormData({...formData, oldPrefix: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Префикс</label>
                <input type="text" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Номер метрики</label>
                <input type="number" value={formData.metricNumber || 0} onChange={e => setFormData({...formData, metricNumber: parseInt(e.target.value) || 0})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ink-500)', textTransform: 'uppercase' }}>Описание</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '100%', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>
            </div>
            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button className="btn ghost" onClick={() => setEditingMetric(null)} style={{ flex: 1 }}>Отмена</button>
              <button className="btn primary" onClick={saveMetric} style={{ flex: 1 }}>Сохранить</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
