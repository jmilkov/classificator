'use client';

import { useEffect, useRef, useState } from 'react';

export default function StackedBarChart({ daily }) {
  const svgRef = useRef(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!svgRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(w);
    });
    const parent = svgRef.current.parentElement;
    if (parent) {
      obs.observe(parent);
      setWidth(parent.offsetWidth || 600);
    }
    return () => obs.disconnect();
  }, []);

  if (!daily || daily.length === 0) {
    return <p className="stats-empty">Нет данных за период</p>;
  }

  const PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 36;
  const chartW = width - PAD_L - PAD_R;
  const chartH = 160;
  const svgH = chartH + PAD_T + PAD_B;

  const maxVal = Math.max(...daily.map((d) => d.level1 + d.level2 + d.level3), 1);
  const barW = Math.max(4, Math.floor(chartW / daily.length) - 2);
  const step = chartW / daily.length;

  const labelEvery = Math.ceil(daily.length / Math.floor(chartW / 40));

  const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });
  function fmtDateShort(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    return DATE_FMT.format(new Date(y, m - 1, d));
  }

  return (
    <svg ref={svgRef} width="100%" height={svgH} className="stats-chart" aria-label="График срабатываний по дням">
      <g transform={`translate(${PAD_L},${PAD_T})`}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = chartH - frac * chartH;
          return (
            <g key={frac}>
              <line x1={0} y1={y} x2={chartW} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={-4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--ink-500)">{Math.round(frac * maxVal)}</text>
            </g>
          );
        })}

        {daily.map((d, i) => {
          const total = d.level1 + d.level2 + d.level3;
          if (total === 0) {
            return (
              <g key={d.date}>
                {i % labelEvery === 0 && (
                  <text x={i * step + step / 2} y={chartH + 16} textAnchor="middle" fontSize="10" fill="var(--ink-500)">
                    {fmtDateShort(d.date)}
                  </text>
                )}
              </g>
            );
          }
          const x = i * step + (step - barW) / 2;
          const h1 = (d.level1 / maxVal) * chartH;
          const h2 = (d.level2 / maxVal) * chartH;
          const h3 = (d.level3 / maxVal) * chartH;

          let curY = chartH;
          const rects = [];
          if (d.level3 > 0) {
            const sy = curY - h3;
            curY -= h3;
            rects.push(<rect key="l3" x={x} y={sy} width={barW} height={h3} fill="var(--ok)"><title>{d.date}: Уровень 3 = {d.level3}</title></rect>);
          }
          if (d.level2 > 0) {
            const sy = curY - h2;
            curY -= h2;
            rects.push(<rect key="l2" x={x} y={sy} width={barW} height={h2} fill="var(--accent)"><title>{d.date}: Уровень 2 = {d.level2}</title></rect>);
          }
          if (d.level1 > 0) {
            const sy = curY - h1;
            curY -= h1;
            rects.push(<rect key="l1" x={x} y={sy} width={barW} height={h1} fill="var(--bad)"><title>{d.date}: Уровень 1 = {d.level1}</title></rect>);
          }

          return (
            <g key={d.date}>
              {rects}
              {i % labelEvery === 0 && (
                <text x={i * step + step / 2} y={chartH + 16} textAnchor="middle" fontSize="10" fill="var(--ink-500)">
                  {fmtDateShort(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </g>

      <g transform={`translate(${PAD_L},${PAD_T + chartH + PAD_B - 8})`}>
        <rect x={0} y={0} width={10} height={10} fill="var(--bad)" />
        <text x={14} y={9} fontSize="10" fill="var(--ink-700)">Уровень 1</text>
        <rect x={80} y={0} width={10} height={10} fill="var(--accent)" />
        <text x={94} y={9} fontSize="10" fill="var(--ink-700)">Уровень 2</text>
        <rect x={160} y={0} width={10} height={10} fill="var(--ok)" />
        <text x={174} y={9} fontSize="10" fill="var(--ink-700)">Уровень 3</text>
      </g>
    </svg>
  );
}
