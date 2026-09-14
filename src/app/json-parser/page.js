'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AUTO_KEYS = ["g_boot", "g_fw", "g_v", "g_sol", "g_fw_sha", "g_kvolt", "g_apn", "g_hw", "g_tlink"];

function AnalyzerContent() {
  const searchParams = useSearchParams();
  const [vMin, setVMin] = useState('3.8');
  const [vMax, setVMax] = useState('3.9');
  const [targetSha, setTargetSha] = useState('07826492');
  const [searchId, setSearchId] = useState(searchParams.get('search') || 'C87FCF00');

  const [loading, setLoading] = useState(false);
  const [filesInfo, setFilesInfo] = useState({});
  const [availableKeys, setAvailableKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState({});
  const [isProcessed, setIsProcessed] = useState(false);
  const [chartKey, setChartKey] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('json_app_config');
    if (saved) {
      try {
        const [sha, min, max] = saved.split(',');
        setTargetSha(sha || '07826492');
        setVMin(min || '3.8');
        setVMax(max || '3.9');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (searchId) loadKeys();
  }, [searchId]);

  const loadKeys = async () => {
    setLoading(true);
    setIsProcessed(false);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId })
      });
      const { filesInfo: data } = await res.json();
      
      const keysSet = new Set();
      Object.values(data).forEach(f => Object.keys(f.data).forEach(k => keysSet.add(k)));

      const sortedKeys = AUTO_KEYS.filter(k => keysSet.has(k)).concat(
        Array.from(keysSet).filter(k => !AUTO_KEYS.includes(k)).sort()
      );
      
      setFilesInfo(data);
      setAvailableKeys(sortedKeys);
      
      const def = {};
      sortedKeys.forEach(k => def[k] = AUTO_KEYS.includes(k));
      setSelectedKeys(def);
      setIsProcessed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCellClass = (key, val) => {
    if (val === "-") return "";
    if (key === "g_v" || key === "g_sol") {
      const n = parseFloat(val);
      if (!isNaN(n) && (n < 3.6 || n > 4.4)) return "text-red-500-bold";
    }
    if (key === "g_fw_sha") return val === targetSha ? "text-emerald-900-bold" : "text-orange-900-bold";
    return "";
  };

  const activeColumns = availableKeys.filter(k => selectedKeys[k]);
  const chartData = Object.entries(filesInfo)
    .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
    .map(([name, info]) => ({
      name: info.date,
      value: parseFloat(info.data[chartKey] || 0)
    }));

  return (
    <div className="app-main">
      <header className="header">
        <h1 className="title">🔍 JSON Analyzer</h1>
      </header>

      <div className="panel p-6">
        <div className="filter-field mb-6">
          <label>Search ID</label>
          <input className="border p-2 rounded" value={searchId} onChange={e => setSearchId(e.target.value)} />
        </div>

        {availableKeys.length > 0 && (
          <div className="mb-6 border-t pt-4">
            <label className="block mb-2 font-bold">Столбцы:</label>
            <div className="flex flex-wrap gap-4">
              {availableKeys.map(k => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!selectedKeys[k]} onChange={e => setSelectedKeys({...selectedKeys, [k]: e.target.checked})} />
                  {k}
                </label>
              ))}
            </div>
          </div>
        )}

        {isProcessed && (
          <>
            <div className="mb-6 flex gap-2">
              {activeColumns.map(k => (
                <button key={k} className="btn ghost" onClick={() => setChartKey(k)}>
                  График {k}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Файл</th>
                    <th>Дата</th>
                    {activeColumns.map(k => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(filesInfo).map(([name, info]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{info.date}</td>
                    {activeColumns.map(k => (
                      <td key={k} className={`p-3 ${getCellClass(k, String(info.data[k] || '-'))}`}>
                        {info.data[k] ?? '-'}
                      </td>
                    ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

          {chartKey && (
        <div className="modal-overlay-fixed" onClick={() => setChartKey(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>График: {chartKey}</h2>
              <button onClick={() => setChartKey(null)} style={{ fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name={chartKey} stroke="#16697a" strokeWidth={2} />
                  </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JsonParserPage() {
  return <Suspense fallback={<div>Загрузка...</div>}><AnalyzerContent /></Suspense>;
}