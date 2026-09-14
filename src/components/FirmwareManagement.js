'use client';
import { useEffect, useState } from 'react';

export default function FirmwareManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/files/firmware');
      if (!res.ok) throw new Error('Ошибка загрузки списка файлов');
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filename) => {
    setLoading(true);
    await fetch('/api/v1/files/firmware', { 
      method: 'DELETE', 
      body: JSON.stringify({ filename }), 
      headers: {'Content-Type': 'application/json'} 
    });
    await fetchFiles();
  };

  const deleteSelected = async () => {
    if (!confirm('Удалить выбранные файлы?')) return;
    setLoading(true);
    await Promise.all(selectedFiles.map(filename => 
      fetch('/api/v1/files/firmware', { 
        method: 'DELETE', 
        body: JSON.stringify({ filename }), 
        headers: {'Content-Type': 'application/json'} 
      })
    ));
    setSelectedFiles([]);
    await fetchFiles();
  };

  const toggleFile = (filename) => {
    setSelectedFiles(prev => 
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const toggleAll = () => {
    if (selectedFiles.length === files.length && files.length > 0) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.name));
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/v1/files/firmware", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Ошибка загрузки файла");
      await fetchFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  return (
    <div className="app-main">
      <header className="header">
        <div>
          <h1 className="title">📟 Управление прошивками</h1>
          <p className="subtitle">Загрузка и управление файлами прошивок</p>
        </div>
        <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button className="btn ghost" onClick={deleteSelected} disabled={loading || selectedFiles.length === 0} style={{ color: '#ef4444' }}>
            Удалить ({selectedFiles.length})
          </button>
          <label className="btn primary">
            Загрузить файл
            <input type="file" onChange={uploadFile} disabled={loading} className="hidden" />
          </label>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <div className="panel">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>
                    <input 
                      type="checkbox" 
                      checked={files.length > 0 && selectedFiles.length === files.length} 
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Имя файла</th>
                  <th>Размер</th>
                  <th>Дата создания</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.name}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.includes(f.name)} 
                        onChange={() => toggleFile(f.name)}
                      />
                    </td>
                    <td>{f.name}</td>
                    <td>{(f.size / 1024).toFixed(2)} KB</td>
                    <td>{new Date(f.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={f.url} target="_blank" rel="noreferrer" className="btn ghost" style={{ marginRight: '8px' }}>Скачать</a>
                      <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteFile(f.name)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
