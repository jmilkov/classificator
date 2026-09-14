'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAlerts, fetchConfig, fetchMe } from '@/utils/api';
import StatsModal from '@/components/StatsModal';

const DEFAULT_LIMIT = 20;
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function toDatetimeLocalLocal(date) {
  const s = date.toLocaleString('sv-SE', { timeZone: LOCAL_TZ, hour12: false });
  return s.replace(' ', 'T');
}

function toIsoLocal(value) {
  return value ? new Date(value).toISOString() : undefined;
}

const LOCAL_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  timeZone: LOCAL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

function formatLocal(unixSeconds) {
  if (!unixSeconds) return '';
  const parts = LOCAL_FORMATTER.formatToParts(new Date(unixSeconds * 1000));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export default function Home() {
  const [userLogin, setUserLogin] = useState('');
  
  const [appConfig, setAppConfig] = useState({ defaultMaster: false, defaultArea: '', defaultAreas: [] });
  const [masterMode, setMasterMode] = useState(true);
  const [groupId, setGroupId] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [queryMode, setQueryMode] = useState('latest');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const now = useMemo(() => new Date(), []);
  const [toValue, setToValue] = useState(toDatetimeLocalLocal(now));
  const [fromValue, setFromValue] = useState(toDatetimeLocalLocal(new Date(now.getTime() - 24 * 60 * 60 * 1000)));

  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [, setCursorByPage] = useState({ 1: null });
  const cursorByPageRef = useRef({ 1: null });

  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    fetchMe().then(payload => {
      setUserLogin(payload.user?.login || '');
    }).catch(console.error);
    
    initializeApp();
  }, []);

  async function initializeApp() {
    const cfg = await fetchConfig();
    setAppConfig(cfg);
    const isMaster = Boolean(cfg.defaultMaster);
    const area = String(cfg.defaultArea || '');
    setMasterMode(isMaster);
    if (area) {
      setGroupId(area);
      setGroupIdInput(area);
    }
  }

  const loadPage = useCallback(async (targetPage, override = false) => {
    if (!groupId) {
      return;
    }
    const pageCursor = cursorByPageRef.current[targetPage] ?? null;
    if (!override && targetPage > 1 && pageCursor === undefined) {
      setError('Для прямого перехода сначала прогрузите предыдущие страницы или настройте anchors в Redis');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await fetchAlerts(groupId, {
        page: targetPage,
        cursor: pageCursor,
        limit,
        from: queryMode === 'filter' ? toIsoLocal(fromValue) : undefined,
        to: queryMode === 'filter' ? toIsoLocal(toValue) : undefined,
        sendto: phone || undefined,
        text: text || undefined,
        status: status === '' ? undefined : Number(status)
      });

      setEntries(payload.data || []);
      setPage(targetPage);
      setHasNext(Boolean(payload.meta?.hasNext));

      const nextCursor = payload.meta?.nextCursor ?? null;
      setCursorByPage((prev) => {
        const next = { ...prev };
        next[targetPage] = pageCursor;
        if (nextCursor) {
          next[targetPage + 1] = nextCursor;
        }
        cursorByPageRef.current = next;
        return next;
      });
    } catch (e) {
      setError(`Ошибка API: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [fromValue, groupId, limit, phone, queryMode, status, text, toValue]);

  function resetPaging() {
    setPage(1);
    setHasNext(false);
    cursorByPageRef.current = { 1: null };
    setCursorByPage({ 1: null });
  }

  function applyFilters() {
    if (!groupId) {
      setError('Укажите ID группы');
      return;
    }
    resetPaging();
    loadPage(1, true);
  }

  function applyGroupIdInput() {
    const cleaned = groupIdInput.trim();
    if (!/^\d+$/.test(cleaned)) {
      setError('ID группы должен быть числом');
      return;
    }
    setError('');
    setGroupId(cleaned);
  }

  const canGoPrev = page > 1;
  const canGoNext = hasNext;

  function onPrev() {
    if (canGoPrev) {
      loadPage(page - 1);
    }
  }

  function onNext() {
    if (canGoNext) {
      loadPage(page + 1);
    }
  }

  useEffect(() => {
    if (!groupId || !userLogin) {
      return;
    }

    const triggerInitialLoad = async () => {
      await Promise.resolve();
      setPage(1);
      setHasNext(false);
      cursorByPageRef.current = { 1: null };
      setCursorByPage({ 1: null });
      loadPage(1, true);
    };

    triggerInitialLoad();
  }, [groupId, loadPage, userLogin]);

  return (
    <>
      <div className="welcome-container" style={{ display: entries.length > 0 ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
        <h1>Добро пожаловать в SPK-collector</h1>
        <p>Для просмотра логов введите ID группы или выберите нужный раздел в меню.</p>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={groupIdInput} 
              onChange={e => setGroupIdInput(e.target.value)} 
              placeholder="ID группы"
              className="input"
            />
            <button className="btn primary" onClick={applyGroupIdInput}>Применить</button>
        </div>
        {error && <div className="error" style={{marginTop: '10px'}}>{error}</div>}
      </div>

      {entries.length > 0 && (
        <div className="logs-container" style={{ padding: '20px' }}>
            <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="title">Журнал логов (Группа: {groupId})</h1>
                <button className="btn ghost" onClick={() => setStatsOpen(true)}>
                    Статистика
                </button>
            </header>

            <div className="filters-card" style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Режим запроса</label>
                        <select className="input" value={queryMode} onChange={e => setQueryMode(e.target.value)}>
                            <option value="latest">Последние</option>
                            <option value="filter">Фильтр по времени</option>
                        </select>
                    </div>
                    
                    {queryMode === 'filter' && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>С</label>
                                <input className="input" type="datetime-local" step="1" value={fromValue} onChange={e => setFromValue(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>По</label>
                                <input className="input" type="datetime-local" step="1" value={toValue} onChange={e => setToValue(e.target.value)} />
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Телефон</label>
                        <input className="input" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Например: 79991234567" />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Текст</label>
                        <input className="input" type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Поиск в тексте" />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Статус</label>
                        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">Все</option>
                            <option value="0">0 (Успешно)</option>
                            <option value="1">1 (Ошибка)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Лимит</label>
                        <input className="input" type="number" value={limit} onChange={e => setLimit(Number(e.target.value) || 20)} style={{ width: '80px' }} />
                    </div>

                    <button className="btn primary" onClick={applyFilters} disabled={loading}>
                        {loading ? 'Загрузка...' : 'Применить'}
                    </button>
                </div>
                {error && <div className="error" style={{ marginTop: '10px' }}>{error}</div>}
            </div>

            <div className="table-wrapper" style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                            <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Время</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Телефон</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Статус</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Текст</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{formatLocal(entry.clock)}</td>
                                <td style={{ padding: '12px' }}>{entry.sendto}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '12px',
                                        background: entry.status === 0 ? '#e6f4ea' : '#fce8e6',
                                        color: entry.status === 0 ? '#137333' : '#c5221f'
                                    }}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', maxWidth: '400px', wordBreak: 'break-word' }}>{entry.message}</td>
                            </tr>
                        ))}
                        {entries.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Нет данных</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button className="btn" onClick={onPrev} disabled={!canGoPrev || loading}>&larr; Назад</button>
                <span>Страница {page}</span>
                <button className="btn" onClick={onNext} disabled={!canGoNext || loading}>Вперед &rarr;</button>
            </div>
        </div>
      )}

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        groupId={groupId}
        groupName={''}
        fromValue={fromValue}
        toValue={toValue}
        queryMode={queryMode}
        text={text}
        status={status}
        phone={phone}
        onAuthLost={() => {
            setStatsOpen(false);
            window.location.reload();
        }}
      />
    </>
  );
}
