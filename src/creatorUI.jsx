// creatorUI.jsx — раздел YouTube как «студия творца»: пиксельная студия, кнопки-награды за подписчиков,
// конвейер производства роликов, ритм публикаций. Только отображение; данные и действия — из App.jsx.
import React from 'react';
import { PAPER } from './actionsUI.jsx';

const CSS = `
@keyframes crRec { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
@keyframes crGlow { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
@keyframes crScan { 0% { transform: translateY(0); } 100% { transform: translateY(14px); } }
@keyframes crShine { 0% { transform: translateX(-130%) skewX(-20deg); } 60%,100% { transform: translateX(230%) skewX(-20deg); } }
.cr-rec { animation: crRec 1s steps(2) infinite; }
.cr-glow { animation: crGlow 2s ease-in-out infinite; }
.cr-scan { animation: crScan 2.4s linear infinite; }
.cr-shine { position: absolute; inset: 0; overflow: hidden; pointer-events: none; border-radius: inherit; }
.cr-shine::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent); animation: crShine 3.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .cr-rec,.cr-glow,.cr-scan,.cr-shine::after { animation: none; } }
`;
let injected = false;
export function useCreatorCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

// Вехи подписчиков: свои «кнопки» за каждую.
export const SUB_MILESTONES = [
  { n: 10, name: 'Первые зрители', tier: 'wood' },
  { n: 100, name: 'Сотня', tier: 'wood' },
  { n: 500, name: 'Свой круг', tier: 'bronze' },
  { n: 1000, name: 'Тысячник', tier: 'bronze' },
  { n: 10000, name: '10 тысяч', tier: 'bronze' },
  { n: 100000, name: 'Серебряная кнопка', tier: 'silver' },
  { n: 1000000, name: 'Золотая кнопка', tier: 'gold' },
  { n: 10000000, name: 'Бриллиантовая', tier: 'diamond' },
];
const TIER = {
  wood: { frame: '#8a5a3a', plate: '#c9a26a', btn: '#a4412a' },
  bronze: { frame: '#8a5a1a', plate: '#d49a5a', btn: '#a4412a' },
  silver: { frame: '#7a838c', plate: '#dfe4e8', btn: '#a4412a' },
  gold: { frame: '#a06a1a', plate: '#f0c85a', btn: '#a4412a' },
  diamond: { frame: '#4a7a9a', plate: '#cfeaf4', btn: '#2f6b6e' },
};
export function milestoneInfo(subs) {
  const s = Number(subs) || 0;
  const got = SUB_MILESTONES.filter(m => s >= m.n);
  const next = SUB_MILESTONES.find(m => s < m.n) || null;
  const prevN = got.length ? got[got.length - 1].n : 0;
  const pct = next ? (s - prevN) / (next.n - prevN) : 1;
  return { got, next, pct: Math.max(0, Math.min(1, pct)) };
}

export function fmtCompact(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const x = Number(n);
  const a = Math.abs(x);
  if (a >= 1e6) return (x / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + 'M';
  if (a >= 1e4) return (x / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace('.0', '') + 'K';
  return x.toLocaleString('ru-RU');
}

/** Пиксельная плашка-«кнопка». */
export function PlayPlaque({ tier = 'wood', size = 44, locked }) {
  const t = TIER[tier] || TIER.wood;
  const c = (x) => (locked ? '#c9c2b2' : x);
  return (
    <div style={{ position: 'relative', width: size, height: size * 1.2 }}>
      <svg width={size} height={size * 1.2} viewBox="0 0 20 24" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
        <rect x="0" y="0" width="20" height="24" fill={c(t.frame)} />
        <rect x="2" y="2" width="16" height="20" fill={c(t.plate)} />
        <rect x="5" y="6" width="10" height="7" fill={c(t.btn)} />
        <rect x="4" y="7" width="1" height="5" fill={c(t.btn)} /><rect x="15" y="7" width="1" height="5" fill={c(t.btn)} />
        <rect x="9" y="7" width="1" height="5" fill="#fbf9f4" /><rect x="10" y="8" width="1" height="3" fill="#fbf9f4" /><rect x="11" y="9" width="1" height="1" fill="#fbf9f4" />
        <rect x="5" y="16" width="10" height="1" fill={locked ? '#b2ab9b' : '#5a4636'} opacity=".6" /><rect x="7" y="18" width="6" height="1" fill={locked ? '#b2ab9b' : '#5a4636'} opacity=".4" />
        <rect x="2" y="2" width="2" height="8" fill="#ffffff" opacity={locked ? 0.2 : 0.45} />
      </svg>
      {!locked && (tier === 'silver' || tier === 'gold' || tier === 'diamond') && <span className="cr-shine" />}
    </div>
  );
}

/** Студия: стол, камера, кольцевая лампа, монитор с числом подписчиков, полка с плашками. */
export function StudioScene({ subs, name, live, night, plaques = [] }) {
  useCreatorCss();
  const label = fmtCompact(subs);
  return (
    <svg viewBox="0 0 200 100" shapeRendering="crispEdges" role="img" aria-label={`Студия ${name || ''}: ${label} подписчиков`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="200" height="100" fill={night ? '#2e2a40' : '#d9cdb6'} />
      <rect y="0" width="200" height="6" fill={night ? '#262236' : '#cbbfa6'} />
      {/* акустика */}
      <g fill={night ? '#3a3550' : '#c8baa0'}>{[0, 1, 2, 3].map(i => <rect key={i} x={6 + (i % 2) * 10} y={14 + Math.floor(i / 2) * 10} width="8" height="8" />)}</g>
      <g fill={night ? '#3a3550' : '#c8baa0'}>{[0, 1, 2, 3].map(i => <rect key={i} x={176 + (i % 2) * 10 - 10} y={14 + Math.floor(i / 2) * 10} width="8" height="8" />)}</g>
      {/* неоновый знак */}
      <g className="cr-glow"><rect x="78" y="10" width="44" height="12" fill="none" stroke={night ? '#ff6a6a' : '#a4412a'} strokeWidth="1" /><rect x="92" y="13" width="16" height="6" fill={night ? '#ff6a6a' : '#a4412a'} /><rect x="99" y="14" width="1" height="4" fill="#fbf9f4" /><rect x="100" y="15" width="1" height="2" fill="#fbf9f4" /></g>
      {/* полка с плашками */}
      <rect x="138" y="40" width="54" height="2" fill="#7c5a3e" />
      {plaques.slice(-4).map((p, i) => {
        const t = TIER[p.tier] || TIER.wood;
        return <g key={i}><rect x={140 + i * 13} y="28" width="10" height="12" fill={t.frame} /><rect x={141 + i * 13} y="29" width="8" height="10" fill={t.plate} /><rect x={143 + i * 13} y="32" width="4" height="3" fill={t.btn} /></g>;
      })}
      {/* стол */}
      <rect x="0" y="72" width="200" height="28" fill={night ? '#3a2e28' : '#9a7452'} />
      <rect x="20" y="66" width="120" height="6" fill={night ? '#5a4636' : '#7c5a3e'} />
      <rect x="24" y="72" width="4" height="20" fill={night ? '#46362a' : '#6a4c34'} /><rect x="132" y="72" width="4" height="20" fill={night ? '#46362a' : '#6a4c34'} />
      {/* монитор */}
      <rect x="54" y="30" width="56" height="34" fill="#1e2230" />
      <rect x="57" y="33" width="50" height="26" fill={night ? '#22334a' : '#2f3e6b'} />
      <g clipPath="url(#crScreen)"><rect className="cr-scan" x="57" y="33" width="50" height="2" fill="#ffffff" opacity=".08" /></g>
      <defs><clipPath id="crScreen"><rect x="57" y="33" width="50" height="26" /></clipPath></defs>
      <text x="82" y="47" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fbf9f4" fontFamily="JetBrains Mono, monospace">{label}</text>
      <text x="82" y="55" textAnchor="middle" fontSize="4.5" fill="#c9d4e8" fontFamily="JetBrains Mono, monospace">ПОДПИСЧИКОВ</text>
      <rect x="78" y="64" width="8" height="2" fill="#1e2230" />
      {/* камера на штативе */}
      <rect x="150" y="50" width="16" height="10" fill="#1e2230" /><rect x="166" y="52" width="5" height="6" fill="#2b2f3e" />
      <rect x="153" y="52" width="4" height="4" fill="#4a6a9a" />
      <rect className="cr-rec" x="161" y="52" width="2" height="2" fill={live ? '#ff4a4a' : '#7a2e1c'} />
      <rect x="157" y="60" width="2" height="12" fill="#2b2f3e" /><rect x="151" y="72" width="2" height="18" fill="#2b2f3e" /><rect x="163" y="72" width="2" height="18" fill="#2b2f3e" />
      {/* кольцевая лампа */}
      <g className="cr-glow"><rect x="30" y="36" width="14" height="2" fill="#fff3c4" /><rect x="28" y="38" width="2" height="12" fill="#fff3c4" /><rect x="44" y="38" width="2" height="12" fill="#fff3c4" /><rect x="30" y="50" width="14" height="2" fill="#fff3c4" /></g>
      <rect x="36" y="52" width="2" height="14" fill="#2b2f3e" />
      {/* микрофон */}
      <rect x="118" y="54" width="4" height="7" fill="#2b2f3e" /><rect x="119" y="61" width="2" height="5" fill="#2b2f3e" /><rect x="115" y="66" width="10" height="1" fill="#2b2f3e" />
    </svg>
  );
}

/** Точки ритма публикаций на неделе. */
export function RhythmDots({ done, target }) {
  const n = Math.max(target, done);
  return (
    <div style={{ display: 'flex', gap: 5 }} aria-label={`Выпущено ${done} из ${target}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ width: 18, height: 18, borderRadius: 4, background: i < done ? PAPER.terra : '#e6e0d3', boxShadow: i < done ? 'inset 0 -3px 0 rgba(0,0,0,.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {i < done && <svg width="8" height="8" viewBox="0 0 4 4" shapeRendering="crispEdges"><rect x="1" y="0" width="1" height="4" fill="#fbf9f4" /><rect x="2" y="1" width="1" height="2" fill="#fbf9f4" /></svg>}
        </span>
      ))}
    </div>
  );
}

/** Конвейер этапов: точки с подписями, активный этап подсвечен. */
export function StageTrack({ stages, current, onPick }) {
  const idx = stages.findIndex(s => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} role="img" aria-label={`Этап: ${(stages[idx] || stages[0]).label}`}>
      {stages.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span style={{ flex: 1, height: 2, background: i <= idx ? PAPER.terra : '#e2dbcc' }} />}
          <span title={s.label} onClick={onPick ? () => onPick(s.key) : undefined} style={{
            width: i === idx ? 14 : 10, height: i === idx ? 14 : 10, borderRadius: 3, flexShrink: 0, boxSizing: 'border-box',
            background: i <= idx ? PAPER.terra : '#e2dbcc', border: i === idx ? `2px solid ${PAPER.ink}` : 'none', cursor: onPick ? 'pointer' : 'default',
          }} />
        </React.Fragment>
      ))}
    </div>
  );
}
