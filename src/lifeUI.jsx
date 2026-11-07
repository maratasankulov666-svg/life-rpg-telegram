// lifeUI.jsx — «События жизни» (дневник дня) и «Хроника» (летопись): весы дня, карта активности.
// Только отображение; логика — в App.jsx.
import React from 'react';
import { PAPER } from './actionsUI.jsx';

const CSS = `
@keyframes lfTilt { from { transform: rotate(0deg); } }
@keyframes lfPop { 0% { transform: scale(.6); opacity: 0; } 100% { transform: none; opacity: 1; } }
.lf-pop { animation: lfPop .3s cubic-bezier(.2,1.4,.3,1) both; }
.lf-beam { transition: transform .8s cubic-bezier(.2,1.3,.3,1); transform-box: fill-box; transform-origin: 50% 50%; }
@media (prefers-reduced-motion: reduce) { .lf-beam { transition: none; } }
`;
let injected = false;
export function useLifeCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

/** Пиксельные весы дня: слева полезное (зелёные гири), справа вредное (красные). */
export function DayScale({ good, bad }) {
  useLifeCss();
  const diff = Math.max(-6, Math.min(6, good - bad));
  const angle = -diff * 3; // перевес хорошего опускает левую чашу
  const weights = (n, color, x0) => Array.from({ length: Math.min(6, n) }, (_, i) => (
    <rect key={i} x={x0 + (i % 3) * 7} y={-6 - Math.floor(i / 3) * 6} width="6" height="5" fill={color} className="lf-pop" style={{ animationDelay: `${i * 0.05}s` }} />
  ));
  return (
    <svg viewBox="0 0 200 86" shapeRendering="crispEdges" role="img" aria-label={`Весы дня: полезное ${good}, вредное ${bad}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="200" height="86" fill="#efe6d2" />
      <rect y="74" width="200" height="12" fill="#d8cdb8" />
      <rect x="96" y="22" width="8" height="52" fill="#8a5a3a" />
      <rect x="86" y="70" width="28" height="5" fill="#5a3826" />
      <rect x="94" y="16" width="12" height="8" fill="#c48a2a" />
      <g className="lf-beam" style={{ transform: `rotate(${angle}deg)` }}>
        <rect x="30" y="18" width="140" height="4" fill="#5a3826" />
        <g transform={`rotate(${-angle} 40 20)`}>
          <rect x="39" y="22" width="1" height="20" fill="#5a3826" />
          <rect x="22" y="42" width="36" height="3" fill="#c48a2a" /><rect x="24" y="45" width="32" height="2" fill="#a06a2a" />
          <g transform="translate(29 42)">{weights(good, '#3f7a4a', 0)}</g>
        </g>
        <g transform={`rotate(${-angle} 160 20)`}>
          <rect x="159" y="22" width="1" height="20" fill="#5a3826" />
          <rect x="142" y="42" width="36" height="3" fill="#c48a2a" /><rect x="144" y="45" width="32" height="2" fill="#a06a2a" />
          <g transform="translate(149 42)">{weights(bad, '#a4412a', 0)}</g>
        </g>
      </g>
      <text x="40" y="66" textAnchor="middle" fontSize="7" fontWeight="800" fill="#3f7a4a" fontFamily="JetBrains Mono, monospace">ПОЛЬЗА {good}</text>
      <text x="160" y="66" textAnchor="middle" fontSize="7" fontWeight="800" fill="#a4412a" fontFamily="JetBrains Mono, monospace">ВРЕД {bad}</text>
    </svg>
  );
}

/** Карта активности: weeks столбцов × 7 дней. counts: { 'YYYY-MM-DD': n }. */
export function ActivityHeatmap({ counts, weeks = 12, selected, onPick, color = PAPER.terra }) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7; // пн=0
  const start = new Date(today); start.setDate(today.getDate() - dow - (weeks - 1) * 7);
  const max = Math.max(1, ...Object.values(counts));
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
      const key = dt.toISOString().slice(0, 10);
      const future = dt > today;
      const n = counts[key] || 0;
      const a = n ? 0.25 + 0.75 * (n / max) : 0;
      cells.push(
        <button key={key} type="button" className="lrpg-btn" disabled={future} onClick={() => onPick && onPick(selected === key ? null : key)}
          aria-label={`${dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}: ${n} записей`} aria-pressed={selected === key}
          style={{ width: '100%', aspectRatio: '1', padding: 0, borderRadius: 3, border: selected === key ? `2px solid ${PAPER.ink}` : 'none', opacity: future ? 0 : 1,
            background: n ? color : '#e6e0d3', filter: n ? `saturate(${0.6 + a})` : 'none', ...(n ? { opacity: 0.35 + a * 0.65 } : {}) }} />
      );
    }
    cols.push(<div key={w} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>{cells}</div>);
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `14px repeat(${weeks}, minmax(0, 1fr))`, gap: 3, alignItems: 'stretch' }}>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 3 }}>
        {['пн', '', 'ср', '', 'пт', '', 'вс'].map((l, i) => <span key={i} className="lrpg-mono" style={{ fontSize: 6.5, color: PAPER.muted, display: 'flex', alignItems: 'center', letterSpacing: 0 }}>{l}</span>)}
      </div>
      {cols}
    </div>
  );
}

/** Неделя событий: 7 столбиков, зелёное вверх, красное вниз. days: [{ key, label, good, bad }] */
export function WeekBalance({ days }) {
  const max = Math.max(1, ...days.map(d => Math.max(d.good, d.bad)));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
      {days.map((d, i) => (
        <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: 34, display: 'flex', alignItems: 'flex-end', width: '100%' }}><div style={{ width: '100%', height: d.good ? Math.max(4, (d.good / max) * 34) : 2, background: d.good ? PAPER.green : '#e6e0d3', borderRadius: '2px 2px 0 0' }} /></div>
          <div style={{ height: 1, width: '100%', background: PAPER.line2 }} />
          <div style={{ height: 24, width: '100%' }}><div style={{ width: '100%', height: d.bad ? Math.max(4, (d.bad / max) * 24) : 0, background: PAPER.terra, borderRadius: '0 0 2px 2px' }} /></div>
          <span className="lrpg-mono" style={{ fontSize: 7.5, color: i === days.length - 1 ? PAPER.ink : PAPER.muted, marginTop: 2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
