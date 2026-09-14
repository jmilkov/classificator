'use client';

import { useState, useEffect } from 'react';

export default function ModulesManagement() {
  const [modules, setModules] = useState([]);
  const [workerFiles, setWorkerFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [logContent, setLogContent] = useState('');

  const fetchModules = async () => {
    try {
      const [modRes, filesRes] = await Promise.all([
        fetch('/api/admin/modules'),
        fetch('/api/admin/modules/files-with-meta')
      ]);
      
      const modData = await modRes.json();
      const filesData = await filesRes.json();

      if (modRes.ok) setModules(modData);
      if (filesRes.ok) setWorkerFiles(filesData);
    } catch (err) {
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (name, action) => {
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, action })
      });
      if (res.ok) {
        if (action === 'save') alert('Конфигурация сохранена (pm2 save)');
        fetchModules();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка выполнения действия');
      }
    } catch (err) {
      alert('Ошибка сети');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/modules/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('Файл успешно загружен в папку workers');
        fetchModules();
      } else {
        alert('Ошибка при загрузке');
      }
    } catch (err) {
      alert('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const fetchLogs = async (name) => {
    setSelectedLogs(name);
    setLogContent('Загрузка логов...');
    try {
      const res = await fetch(`/api/admin/modules/logs?name=${name}`);
      const data = await res.json();
      if (res.ok) {
        setLogContent(data.logs || 'Логи пусты');
      } else {
        setLogContent('Ошибка: ' + data.error);
      }
    } catch (err) {
      setLogContent('Ошибка сети при получении логов');
    }
  };

  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center">Загрузка статуса модулей...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="app-main">
      <header className="header">
        <div>
          <h1 className="title">📦 Системные модули (PM2)</h1>
          <p className="subtitle">Мониторинг и управление фоновыми процессами</p>
        </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleAction('all', 'save')}
              className="btn primary"
              title="Выполнить pm2 save"
            >
              💾 Автостарт
            </button>
            <label className="btn ghost" style={{ cursor: 'pointer' }}>
              {uploading ? 'Загрузка...' : '✚ Загрузить воркер'}
              <input type="file" style={{ display: 'none' }} accept=".js" onChange={handleFileUpload} />
            </label>
          </div>
      </header>

      <div className="panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '20px' }}>
          {modules.map((m) => (
            <div key={m.pm_id} className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '1.1rem', color: 'var(--ink-900)' }}>{m.name}</h3>
                    {m.noRestart && (
                      <span style={{ fontSize: '0.6rem', padding: '2px 4px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: 800 }}>
                        @NO-RESTART
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: 'var(--ink-500)' }}>{m.description}</p>
                </div>
                <span className={`status ${m.status === 'online' ? 'ok' : 'bad'}`}>
                  {m.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--ink-500)', fontSize: '0.7rem', textTransform: 'uppercase' }}>CPU</div>
                  <div style={{ fontWeight: 600 }}>{m.cpu}%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-500)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Память</div>
                  <div style={{ fontWeight: 600 }}>{(m.memory / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-500)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Uptime</div>
                  <div style={{ fontWeight: 600 }}>{Math.floor(m.uptime / 3600)}ч {Math.floor((m.uptime % 3600) / 60)}м</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--paper-200)' }}>
                {m.status === 'online' ? (
                  <button 
                    onClick={() => handleAction(m.name, 'stop')}
                    className="btn ghost"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', color: 'var(--bad)' }}
                  >
                    Стоп
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAction(m.name, 'start')}
                    className="btn primary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    Старт
                  </button>
                )}
                <button 
                  onClick={() => handleAction(m.name, 'restart')}
                  className="btn ghost"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                  disabled={m.noRestart}
                  title={m.noRestart ? "Перезагрузка запрещена (@no-restart)" : "Рестарт"}
                >
                  Рестарт
                </button>
                <button 
                  onClick={() => fetchLogs(m.name)}
                  className="btn ghost"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Логи
                </button>
                <button 
                  onClick={() => handleAction(m.name, 'delete')}
                  className="btn ghost"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', color: 'var(--bad)' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {workerFiles.length > 0 && (
        <section className="panel" style={{ marginTop: '20px' }}>
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px' }}>Файлы воркеров</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Имя файла</th>
                    <th>Описание</th>
                    <th>Статус в PM2</th>
                    <th style={{ textAlign: 'right' }}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {workerFiles.map(fileObj => {
                    const file = typeof fileObj === 'string' ? fileObj : fileObj.filename;
                    const description = typeof fileObj === 'object' ? fileObj.description : '';
                    const isRunning = modules.some(m => m.name === file.replace('.js', ''));
                    return (
                      <tr key={file}>
                        <td className="col-phone" style={{ fontFamily: 'var(--mono)' }}>{file}</td>
                        <td style={{ color: 'var(--ink-500)' }}>{description}</td>
                        <td>
                          <span className={`status ${isRunning ? 'ok' : 'bad'}`}>
                            {isRunning ? 'Активен' : 'Не запущен'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a 
                            href={`/api/admin/modules/files?filename=${file}`}
                            download
                            className="btn ghost"
                            style={{ marginRight: '8px' }}
                          >
                            Выгрузить
                          </a>
                          <button 
                            onClick={async () => {
                              if (confirm(`Вы уверены, что хотите удалить файл ${file}?`)) {
                                try {
                                  const res = await fetch('/api/admin/modules/files/delete', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename: file })
                                  });
                                  if (res.ok) {
                                    alert('Файл удален');
                                    fetchModules();
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || 'Ошибка удаления');
                                  }
                                } catch (e) {
                                  alert('Ошибка сети');
                                }
                              }
                            }}
                            className="btn ghost"
                            style={{ color: 'var(--bad)', marginRight: '8px' }}
                          >
                            Удалить
                          </button>
                          {!isRunning && (
                            <button 
                              onClick={() => handleAction(file, 'start')}
                              className="btn primary"
                            >
                              Запустить
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {selectedLogs && (
        <div className="modal-overlay">
          <div className="modal-box">
            <header className="modal-header">
              <h2 className="modal-title">Логи: {selectedLogs}</h2>
              <button onClick={() => setSelectedLogs(null)} className="modal-close">✕</button>
            </header>
            <div className="flex-1 overflow-auto p-6 bg-slate-950">
              <pre 
                className="font-mono text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: '#93c5fd' }}
                dangerouslySetInnerHTML={{ 
                  __html: logContent
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\u001b\[1m/g, '<b>')
                    .replace(/\u001b\[22m/g, '</b>')
                    .replace(/\u001b\[31m/g, '<span style="color: #f87171">')
                    .replace(/\u001b\[32m/g, '<span style="color: #4ade80">')
                    .replace(/\u001b\[33m/g, '<span style="color: #facc15">')
                    .replace(/\u001b\[34m/g, '<span style="color: #60a5fa">')
                    .replace(/\u001b\[36m/g, '<span style="color: #22d3ee">')
                    .replace(/\u001b\[39m/g, '</span>')
                    .replace(/\u001b\[90m/g, '<span style="color: #6b7280">')
                    .replace(/\u001b\[0m/g, '</span>')
                }}
              ></pre>
            </div>
            <footer style={{ padding: '16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => fetchLogs(selectedLogs)} className="btn primary">Обновить</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
