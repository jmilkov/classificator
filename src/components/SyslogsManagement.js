'use client';
import { useState, useEffect, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

export default function SyslogsManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const openViewer = async (filename) => {
    try {
      const res = await fetch(`/api/admin/syslogs/read?filename=${filename}`);
      if (!res.ok) throw new Error('Ошибка чтения файла');
      const text = await res.text();
      setFileContent(text);
      setViewingFile(filename);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/syslogs/list');
      if (!response.ok) throw new Error('Ошибка загрузки списка логов');
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (filename) => {
    try {
      const res = await fetch(`/api/admin/syslogs/delete?name=${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      loadFiles();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteSelected = async () => {
    if (!confirm('Удалить выбранные логи?')) return;
    setLoading(true);
    try {
      await Promise.all(selectedFiles.map(name => 
        fetch(`/api/admin/syslogs/delete?name=${name}`, { method: 'DELETE' })
      ));
      setSelectedFiles([]);
      loadFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (filename) => {
    setSelectedFiles(prev => 
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const toggleAll = () => {
    if (selectedFiles.length === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.filename));
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  return (
    <div className="app-main">
      <header className="header">
        <div>
          <h1 className="title">📋 Системные логи</h1>
          <p className="subtitle">Управление логами в public/syslog</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn ghost" onClick={deleteSelected} disabled={loading || selectedFiles.length === 0} style={{ color: '#ef4444' }}>
            Удалить ({selectedFiles.length})
          </button>
          <button className="btn primary" onClick={loadFiles} disabled={loading}>Обновить</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <div className="filters">
            <input 
              type="text" 
              placeholder="Поиск..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredFiles.length > 0 && selectedFiles.length === filteredFiles.length} 
                    onChange={toggleAll}
                  />
                </th>
                <th>Имя файла</th>
                <th style={{ textAlign: 'right' }}>Размер</th>
                <th style={{ textAlign: 'right' }}>Дата создания</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.filename}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedFiles.includes(file.filename)} 
                      onChange={() => toggleFile(file.filename)}
                    />
                  </td>
                  <td>{file.filename}</td>
                  <td style={{ textAlign: 'right' }}>{(file.size / 1024).toFixed(2)} KB</td>
                  <td style={{ textAlign: 'right' }}>{new Date(file.createdAt).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost" style={{ marginRight: '8px' }} onClick={() => openViewer(file.filename)}>Просмотр</button>
                    <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteFile(file.filename)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewingFile && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ width: '80%', maxWidth: '800px' }}>
              <header className="modal-header">
                <h2 className="modal-title">Просмотр: {viewingFile}</h2>
                <button onClick={() => setViewingFile(null)} className="modal-close">✕</button>
              </header>
              <div className="p-6">
                <Editor
                  value={fileContent}
                  onValueChange={() => {}}
                  highlight={code => highlight(code, languages.json, 'json')}
                  padding={10}
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: '#f5f5f5',
                    minHeight: '400px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px'
                  }}
                  readOnly={true}
                />
              </div>
              <footer style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => setViewingFile(null)}>Закрыть</button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
