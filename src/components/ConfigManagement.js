'use client';

import { useState, useEffect, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

export default function ConfigManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const deleteFile = async (filename) => {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) return;
    try {
      const response = await fetch(`/api/admin/config/delete?filename=${filename}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Ошибка удаления файла');
      loadFiles();
    } catch (err) {
      alert(err.message);
    }
  };

  const editFile = (filename) => {
    // В будущем здесь можно открыть модальное окно с редактором
    alert(`Функция редактирования для ${filename} пока в разработке.`);
  };

  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isViewing, setIsViewing] = useState(false);

  const openEditor = async (filename, viewOnly = false) => {
    try {
      const res = await fetch(`/api/admin/config/read?filename=${filename}`);
      if (!res.ok) throw new Error('Ошибка чтения файла');
      const text = await res.text();
      setFileContent(text);
      setEditingFile(filename);
      setIsViewing(viewOnly);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/config/list');
      if (!response.ok) throw new Error('Ошибка загрузки списка файлов');
      const data = await response.json();
      // data is an array of strings like ["file1.json", "file2.txt"]
      // mapping it to objects with filename property so f.filename.toLowerCase() works
      setFiles(data.map(filename => ({ filename })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    try {
      const res = await fetch('/api/admin/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: editingFile, content: fileContent })
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      alert('Файл сохранен');
      setEditingFile(null);
    } catch (err) {
      alert(err.message);
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
          <h1 className="title">📂 Файлы конфигурации</h1>
          <p className="subtitle">Управление конфигурационными файлами в public/config</p>
        </div>
        <button className="btn primary" onClick={loadFiles} disabled={loading}>Обновить список</button>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <div className="filters">
          <div className="filter-row">
            <div className="filter-field">
              <label>Поиск</label>
              <input 
                type="text" 
                placeholder="Поиск по имени..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Имя файла</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.filename}>
                    <td>{file.filename}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost" style={{ marginRight: '8px' }} onClick={() => openEditor(file.filename, true)}>Просмотр</button>
                      <button className="btn ghost" style={{ marginRight: '8px' }} onClick={() => openEditor(file.filename)}>Редактировать</button>
                      <button className="btn ghost" style={{ color: '#ef4444' }} onClick={() => deleteFile(file.filename)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editingFile && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ width: '80%', maxWidth: '800px' }}>
              <header className="modal-header">
                <h2 className="modal-title">{isViewing ? 'Просмотр' : 'Редактирование'}: {editingFile}</h2>
                <button onClick={() => setEditingFile(null)} className="modal-close">✕</button>
              </header>
              <div className="p-6">
                <Editor
                  value={fileContent}
                  onValueChange={setFileContent}
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
                  readOnly={isViewing}
                />
              </div>
              <footer style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {isViewing ? (
                  <button className="btn primary" onClick={() => setEditingFile(null)}>Закрыть</button>
                ) : (
                  <>
                    <button className="btn ghost" onClick={() => setEditingFile(null)}>Отмена</button>
                    <button className="btn primary" onClick={saveFile}>Сохранить</button>
                  </>
                )}
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
