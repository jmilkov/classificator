'use client';

import { useState, useEffect, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

export default function UploadsManagement() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [sizeFilter, setSizeFilter] = useState('all');

  const { paginatedFiles, totalPages } = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
      result = result.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sizeFilter !== 'all') {
      const threshold = 1024 * 1024;
      if (sizeFilter === 'gt-1mb') {
        result = result.filter(f => f.size > threshold);
      } else if (sizeFilter === 'lt-1mb') {
        result = result.filter(f => f.size < threshold);
      }
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.filename.localeCompare(b.filename);
        case 'name-desc': return b.filename.localeCompare(a.filename);
        case 'size-asc': return a.size - b.size;
        case 'size-desc': return b.size - a.size;
        case 'date-asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return 0;
      }
    });

    const totalPages = Math.ceil(result.length / itemsPerPage);
    const paginatedFiles = result.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return { paginatedFiles, totalPages };
  }, [files, searchQuery, sortOption, sizeFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, sizeFilter]);

  const deleteFile = async (filename) => {
    try {
      const response = await fetch(`/api/v1/files/uploads/${filename}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Ошибка удаления файла');
      loadFiles();
    } catch (err) {
      setError(err.message);
    }
  };

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const openViewer = async (filename) => {
    try {
      const res = await fetch(`/api/v1/files/uploads/read?filename=${filename}`);
      if (!res.ok) throw new Error('Ошибка чтения файла');
      const text = await res.text();
      setFileContent(text);
      setViewingFile(filename);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleFile = (filename) => {
    setSelectedFiles(prev => 
      prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]
    );
  };

  const toggleAll = () => {
    if (selectedFiles.length === paginatedFiles.length && paginatedFiles.length > 0) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(paginatedFiles.map(f => f.filename));
    }
  };

  const deleteSelected = async () => {
    setLoading(true);
    try {
      await Promise.all(selectedFiles.map(filename => 
        fetch(`/api/v1/files/uploads/${filename}`, { method: 'DELETE' })
      ));
      setSelectedFiles([]);
      loadFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/files/uploads');
      if (!response.ok) throw new Error('Ошибка загрузки списка файлов');
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="app-main">
      <header className="header">
        <div>
          <h1 className="title">📂 Управление загрузками</h1>
          <p className="subtitle">Список загруженных файлов и управление ими</p>
        </div>
        <div className="header-actions" style={{ marginLeft: 'auto' }}>
          <button className="btn primary" onClick={loadFiles} disabled={loading}>Обновить список</button>
          <button className="btn ghost" onClick={deleteSelected} disabled={loading || selectedFiles.length === 0} style={{ color: '#ef4444' }}>
            Удалить ({selectedFiles.length})
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="panel">
        <div className="filters">
          <div className="filter-row">
            <div className="filter-field">
              <label>Поиск</label>
              <div className="inline-controls">
                <input 
                  type="text" 
                  placeholder="Поиск по имени..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                <button 
                  className="btn ghost" 
                  onClick={() => window.open(`/json-parser?search=${searchQuery}`, '_blank')}
                >
                  JSONParser
                </button>
              </div>
            </div>
            <div className="filter-field">
              <label>Сортировка</label>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="name-asc">Имя (А-Я)</option>
                <option value="name-desc">Имя (Я-А)</option>
                <option value="size-asc">Размер (по возрастанию)</option>
                <option value="size-desc">Размер (по убыванию)</option>
                <option value="date-asc">Дата (старые сначала)</option>
                <option value="date-desc">Дата (новые сначала)</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Размер</label>
              <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
                <option value="all">Все размеры</option>
                <option value="gt-1mb">&gt; 1 MB</option>
                <option value="lt-1mb">&lt; 1 MB</option>
              </select>
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
                  <th style={{ width: '30px' }}>
                    <input 
                      type="checkbox" 
                      checked={paginatedFiles.length > 0 && selectedFiles.length === paginatedFiles.length} 
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
                {paginatedFiles.map((file) => (
                  <tr key={file.filename}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.includes(file.filename)} 
                        onChange={() => toggleFile(file.filename)}
                      />
                    </td>
                    <td>{file.filename}</td>
                    <td>{(file.size / 1024).toFixed(2)} KB</td>
                    <td>{new Date(file.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost" style={{ marginRight: '8px' }} onClick={() => openViewer(file.filename)}>Просмотр</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewingFile && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ width: '80%', maxWidth: '800px' }}>
              <header className="modal-header">
                <h2 className="modal-title">Просмотр: {viewingFile}</h2>
                <button onClick={() => setViewingFile(null)} className="modal-close">✕</button>
              </header>
              <div className="p-6">
                {viewingFile.toLowerCase().endsWith('.jpg') || viewingFile.toLowerCase().endsWith('.jpeg') || viewingFile.toLowerCase().endsWith('.png') || viewingFile.toLowerCase().endsWith('.gif') || viewingFile.toLowerCase().endsWith('.webp') ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: '#f5f5f5', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <img 
                      src={`/api/v1/files/uploads/read?filename=${viewingFile}`} 
                      alt={viewingFile} 
                      style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
                    />
                  </div>
                ) : (
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
                )}
              </div>
              <footer style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => setViewingFile(null)}>Закрыть</button>
              </footer>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pager">
            <span className="pager-info">{currentPage} из {totalPages}</span>
            <div className="pager-controls">
              <button className="btn ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Назад</button>
              <button className="btn ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Вперед</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
