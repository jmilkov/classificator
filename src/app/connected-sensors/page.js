'use client';

import { useState, useEffect } from 'react';

export default function ConnectedSensorsPage() {
  const [sensors, setSensors] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSensor, setEditingSensor] = useState(null);
  const [viewingSensor, setViewingSensor] = useState(null);
  const [formData, setFormData] = useState({ id: '', model: '', categoryId: '', metricIds: [], description: '', schemaImages: [], manualPdf: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [uploading, setUploading] = useState({ schema: false, pdf: false });
  const [selectedSchemaFile, setSelectedSchemaFile] = useState(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sensorsRes, metricsRes, categoriesRes] = await Promise.all([
        fetch('/api/v1/connected-sensors/list'),
        fetch('/api/v1/metrics/list'),
        fetch('/api/v1/metric-categories/list')
      ]);
      const sensorsData = await sensorsRes.json();
      const metricsData = await metricsRes.json();
      const categoriesData = await categoriesRes.json();
      setSensors(sensorsData);
      setMetrics(metricsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, type) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/v1/connected-sensors/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Ошибка загрузки файла');
      return await res.json();
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const filteredSensors = sensors.filter(s => {
    const matchesSearch = s.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || s.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFilteredMetrics = () => {
    return metrics.filter(m => formData.categoryId === '' || m.categoryId === formData.categoryId);
  };

  const saveSensor = async () => {
    try {
      const res = await fetch('/api/v1/connected-sensors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      setEditingSensor(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteSensor = async (id) => {
    if (!confirm('Вы уверены?')) return;
    try {
      const res = await fetch('/api/v1/connected-sensors/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const getMetricDisplay = (m) => {
    let prefix = m.prefix || '';
    if (m.metricNumber && parseInt(m.metricNumber) > 0) {
      prefix += m.metricNumber;
    }
    return prefix;
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString();
  };

  const resetForm = () => {
    setFormData({ id: '', model: '', categoryId: '', metricIds: [], description: '', schemaImages: [], manualPdf: [] });
  };

  const startEdit = (s) => {
    setFormData({ ...s, schemaImages: Array.isArray(s.schemaImages) ? [...s.schemaImages] : [], manualPdf: Array.isArray(s.manualPdf) ? [...s.manualPdf] : [] });
    setEditingSensor(s.id);
  };

  const startCopy = (s) => {
    setFormData({ ...s, id: '', schemaImages: Array.isArray(s.schemaImages) ? [...s.schemaImages] : [], manualPdf: Array.isArray(s.manualPdf) ? [...s.manualPdf] : [] });
    setEditingSensor('new');
  };

  useEffect(() => {
    loadData();
  }, []);

  const FileTable = ({ files, field }) => {
    if (!files || files.length === 0) return null;
    return (
      <div style={{ border: '1px solid var(--line)', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 'auto', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Файл</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Загружен</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid var(--line)' }}></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={i}>
                <td style={{ padding: '6px 8px' }}>
                  <a href={f.url} target="_blank" style={{ color: 'var(--accent)', cursor: 'pointer' }}>{f.filename}</a>
                </td>
                <td style={{ padding: '6px 8px', color: '#999' }}>{formatDate(f.uploadedAt)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                  <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '4px 10px' }} onClick={() => removeFile(field, i)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="app-main">
      <header className="header">
        <h1>Подключаемые сенсоры</h1>
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
          <button className="btn primary" onClick={() => { resetForm(); setEditingSensor('new'); }}>Добавить датчик</button>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <div className="panel">
        <table>
          <thead>
            <tr><th>Модель</th><th>Категория</th><th>Схемы</th><th>PDF</th><th>Метрики</th><th>Описание</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {filteredSensors.map(s => (
              <tr key={s.id}>
                <td>{s.model}</td>
                <td>{categories.find(c => c.id === s.categoryId)?.name || '-'}</td>
                <td>{Array.isArray(s.schemaImages) ? s.schemaImages.length : s.schemaImage ? 1 : 0}</td>
                <td>{Array.isArray(s.manualPdf) ? s.manualPdf.length : 0}</td>
                <td>{s.metricIds.map(id => {
                  const m = metrics.find(met => met.id === id);
                  return m ? getMetricDisplay(m) : id;
                }).join(', ')}</td>
                <td>{s.description}</td>
                <td>
                  <button className="btn ghost" onClick={() => startEdit(s)}>Редактировать</button>
                  <button className="btn ghost" onClick={() => startCopy(s)}>Копия</button>
                  <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteSensor(s.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingSensor && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
            <h2>{viewingSensor.model}</h2>
             {Array.isArray(viewingSensor.schemaImages) && viewingSensor.schemaImages.length > 0 && (
               <div>
                 <strong>Схемы подключения:</strong>
                 <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                   {viewingSensor.schemaImages.map((img, i) => (
                     <li key={i}>
                       <a href={img.url} target="_blank" style={{ color: 'var(--accent)' }}>{img.filename}</a>
                       <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>{formatDate(img.uploadedAt)}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
             <div>
               <strong>Метрики:</strong> {viewingSensor.metricIds.map(id => {
                 const m = metrics.find(met => met.id === id);
                 return m ? getMetricDisplay(m) : id;
               }).join(', ')}
             </div>
             {Array.isArray(viewingSensor.manualPdf) && viewingSensor.manualPdf.length > 0 && (
               <div>
                 <strong>Инструкции (PDF):</strong>
                 <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                   {viewingSensor.manualPdf.map((pdf, i) => (
                     <li key={i}>
                       <a href={pdf.url} target="_blank" style={{ color: 'var(--accent)' }}>{pdf.filename}</a>
                       <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>{formatDate(pdf.uploadedAt)}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
             <button className="btn primary" onClick={() => setViewingSensor(null)}>Закрыть</button>
          </div>
        </div>
      )}

      {editingSensor && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
            <h2>{editingSensor === 'new' ? 'Новый датчик' : 'Редактирование'}</h2>
            <input type="text" placeholder="Модель" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }} />
            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value, metricIds: []})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', backgroundColor: 'white' }}>
              <option value="">Выберите категорию</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <textarea placeholder="Описание" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }} />
            
            <label>Схемы подключения:</label>
            <FileTable files={formData.schemaImages} field="schemaImages" />
            <input type="file" accept="image/*" capture="environment" onChange={e => setSelectedSchemaFile(e.target.files[0] || null)} style={{ width: '100%' }} />
            {selectedSchemaFile && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '-8px' }}>
                <span style={{ fontSize: '13px', color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedSchemaFile.name}</span>
                <button className="btn primary" disabled={uploading.schema} onClick={async () => {
                  try {
                    const data = await uploadFile(selectedSchemaFile, 'schema');
                    setFormData(prev => ({ ...prev, schemaImages: [...prev.schemaImages, { url: data.url, filename: data.filename, uploadedAt: data.uploadedAt }] }));
                    setSelectedSchemaFile(null);
                  } catch {
                    alert('Ошибка загрузки схемы');
                  }
                }}>
                  {uploading.schema ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            )}
            
            <label>Инструкции (PDF):</label>
            <FileTable files={formData.manualPdf} field="manualPdf" />
            <input type="file" accept="application/pdf" onChange={e => setSelectedPdfFile(e.target.files[0] || null)} style={{ width: '100%' }} />
            {selectedPdfFile && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '-8px' }}>
                <span style={{ fontSize: '13px', color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPdfFile.name}</span>
                <button className="btn primary" disabled={uploading.pdf} onClick={async () => {
                  try {
                    const data = await uploadFile(selectedPdfFile, 'pdf');
                    setFormData(prev => ({ ...prev, manualPdf: [...prev.manualPdf, { url: data.url, filename: data.filename, uploadedAt: data.uploadedAt }] }));
                    setSelectedPdfFile(null);
                  } catch {
                    alert('Ошибка загрузки PDF');
                  }
                }}>
                  {uploading.pdf ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            )}
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <label>Метрики:</label>
              {getFilteredMetrics().map(m => (
                <div key={m.id}>
                  <input type="checkbox" checked={formData.metricIds.includes(m.id)} onChange={e => {
                    const newIds = e.target.checked ? [...formData.metricIds, m.id] : formData.metricIds.filter(id => id !== m.id);
                    setFormData({...formData, metricIds: newIds});
                  }} />
                  {getMetricDisplay(m)}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn primary" onClick={saveSensor}>Сохранить</button>
              <button className="btn ghost" onClick={() => setEditingSensor(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}