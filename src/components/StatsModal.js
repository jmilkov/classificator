'use client';

import { useEffect, useState } from 'react';
import { fetchStats } from '@/utils/api';
import StackedBarChart from './StackedBarChart';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });
function fmtDateShort(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return DATE_FMT.format(new Date(y, m - 1, d));
}

function downloadPostsCsv(posts, groupName, fromValue, toValue, queryMode) {
  const csv = '﻿СПК\n' + posts.map((p) => `СПК${p}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (groupName || 'группа').replace(/[^\w\dЀ-ӿ.-]/g, '_');
  const from = queryMode === 'filter' && fromValue ? fromValue.slice(0, 10) : '';
  const to = queryMode === 'filter' && toValue ? toValue.slice(0, 10) : '';
  a.href = url;
  a.download = [safeName, from, to].filter(Boolean).join('_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadEventsCsv(events, groupName, fromValue, toValue, queryMode) {
  const header = 'Дата-время,Пост,Событие';
  const rows = events.map((e) => `${formatLocal(e.start)},СПК${e.deviceId},${e.name}`);
  const csv = '﻿' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (groupName || 'группа').replace(/[^\w\dЀ-ӿ.-]/g, '_');
  const from = queryMode === 'filter' && fromValue ? fromValue.slice(0, 10) : '';
  const to = queryMode === 'filter' && toValue ? toValue.slice(0, 10) : '';
  a.href = url;
  a.download = ['события', safeName, from, to].filter(Boolean).join('_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function StatsModal({ open, onClose, groupId, groupName, fromValue, toValue, queryMode, text, status, phone, onAuthLost }) {
  const [state, setState] = useState({ data: null, loading: false, error: '' });
  const { data, loading, error } = state;

  useEffect(() => {
    if (!open || !groupId) return;

    let active = true;

    const run = async () => {
      await Promise.resolve();
      if (!active) return;
      setState({ data: null, loading: true, error: '' });

      try {
        const payload = await fetchStats(groupId, {
          from: queryMode === 'filter' ? (fromValue ? new Date(fromValue).toISOString() : undefined) : undefined,
          to: queryMode === 'filter' ? (toValue ? new Date(toValue).toISOString() : undefined) : undefined,
          text: text || undefined,
          status: status === '' ? undefined : status,
          sendto: phone || undefined
        });
        if (!active) return;
        setState({ data: payload, loading: false, error: '' });
      } catch (e) {
        if (!active) return;
        if (e.message === 'AUTH_REQUIRED') {
          onAuthLost();
          return;
        }
        setState({ data: null, loading: false, error: `Ошибка: ${e.message}` });
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [open, groupId, fromValue, toValue, queryMode, text, status, phone, onAuthLost]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fromLabel = queryMode === 'filter' && fromValue ? fmtDateShort(fromValue.slice(0, 10)) : '—';
  const toLabel = queryMode === 'filter' && toValue ? fmtDateShort(toValue.slice(0, 10)) : '—';
  const periodLabel = queryMode === 'filter' ? `${fromLabel} — ${toLabel}` : 'За весь период';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Статистика срабатываний">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{groupName || `Группа ${groupId}`}</div>
            <div className="modal-subtitle">{periodLabel}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {loading && <div className="stats-loading">Загрузка…</div>}
        {error && <div className="error" style={{ margin: '12px 20px' }}>{error}</div>}

        {data && (
          <>
            <div className="stats-cards">
              <div className="stats-card stats-card-bad">
                <div className="stats-card-label">Уровень 1</div>
                <div className="stats-card-value">{data.summary.level1}</div>
              </div>
              <div className="stats-card stats-card-accent">
                <div className="stats-card-label">Уровень 2</div>
                <div className="stats-card-value">{data.summary.level2}</div>
              </div>
              <div className="stats-card stats-card-ok">
                <div className="stats-card-label">Уровень 3</div>
                <div className="stats-card-value">{data.summary.level3}</div>
              </div>
            </div>
            <div className="stats-meta">
              Уникальных событий: <strong>{data.meta.totalUniqueEvents}</strong> &nbsp;·&nbsp;
              Всего звонков: <strong>{data.meta.totalCallsProcessed}</strong>
              {data.meta.unparsedCount > 0 && <>&nbsp;·&nbsp; Не распознано: <strong>{data.meta.unparsedCount}</strong></>}
            </div>
            <div className="stats-chart-wrap">
              <StackedBarChart daily={data.daily} />
            </div>
            {(data.events?.length > 0 || data.posts?.length > 0) && (
              <div className="stats-footer">
                {data.events?.length > 0 && (
                  <button
                    className="btn ghost"
                    onClick={() => downloadEventsCsv(data.events, groupName, fromValue, toValue, queryMode)}
                  >
                    ↓ CSV события ({data.events.length})
                  </button>
                )}
                {data.posts?.length > 0 && (
                  <button
                    className="btn ghost"
                    onClick={() => downloadPostsCsv(data.posts, groupName, fromValue, toValue, queryMode)}
                  >
                    ↓ Посты CSV ({data.posts.length})
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
