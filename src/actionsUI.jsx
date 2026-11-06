// actionsUI.jsx — игровые элементы раздела «Действия» в стиле «бумага + пиксель».
// Только отображение: логику (выполнить, отложить, атаковать босса) передаёт App.jsx через props.
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export const PAPER = {
  bg: '#f2eee5', card: '#fbf9f4', alt: '#f3eee3', line: '#e2dbcc', line2: '#d6cdb9',
  ink: '#1e2230', muted: '#6b6f7a', terra: '#a4412a', teal: '#2f6b6e', green: '#3f7a4a',
  mustard: '#c48a2a', berry: '#a83e66', navy: '#2f3e6b',
};

export const STAT_RU = {
  physical: 'Тело', discipline: 'Дисциплина', knowledge: 'Знания', focus: 'Фокус', finance: 'Финансы',
  career: 'Карьера', creator: 'Творчество', social: 'Общение', mental: 'Разум',
};
export const STAT_COLOR = {
  physical: '#3f7a4a', discipline: '#2f3e6b', knowledge: '#2f6b6e', focus: '#a4412a', finance: '#c48a2a',
  career: '#5a4636', creator: '#a83e66', social: '#b0761c', mental: '#4a6a9a',
};

const CSS = `
@keyframes agStamp { 0% { transform: scale(2.2) rotate(-18deg); opacity: 0; } 55% { transform: scale(.92) rotate(-8deg); opacity: 1; } 100% { transform: scale(1) rotate(-8deg); opacity: 1; } }
@keyframes agOut { 0%,55% { opacity: 1; transform: none; max-height: 200px; } 100% { opacity: 0; transform: translateX(30px); max-height: 0; margin-top: -10px; padding-top: 0; padding-bottom: 0; } }
@keyframes agPress { 0% { transform: scale(1); } 40% { transform: scale(.86); } 100% { transform: scale(1); } }
@keyframes agWalk { 50% { transform: translateY(-1px); } }
@keyframes agFlag { 50% { transform: scaleX(.75); } }
@keyframes agSpark { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
@keyframes agCloud { from { transform: translateX(-30px); } to { transform: translateX(200px); } }
@keyframes agLid { 0% { transform: translateY(0); } 100% { transform: translateY(-3px) rotate(-12deg); } }
@keyframes agPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(164,65,42,.35); } 50% { box-shadow: 0 0 0 7px rgba(164,65,42,0); } }
@keyframes agFlame { 50% { transform: scaleY(1.15) translateY(-.5px); } }
@keyframes agFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.ag-stamp { animation: agStamp .45s cubic-bezier(.2,1.4,.3,1) both; }
.ag-out { animation: agOut .9s ease both; overflow: hidden; }
.ag-press { animation: agPress .3s ease both; }
.ag-walk { animation: agWalk .5s steps(2) infinite; }
.ag-flag { animation: agFlag 1s steps(2) infinite; transform-box: fill-box; transform-origin: 0 50%; }
.ag-spark { animation: agSpark 1.4s steps(2) infinite; }
.ag-cloud { animation: agCloud 40s linear infinite; }
.ag-lid { animation: agLid .6s cubic-bezier(.2,1.4,.3,1) both; transform-box: fill-box; transform-origin: 0 100%; }
.ag-pulse { animation: agPulse 1.8s ease-in-out infinite; }
.ag-flame { animation: agFlame .7s steps(2) infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.ag-fill { animation: agFill .8s cubic-bezier(.16,1,.3,1) both; transform-origin: left; }
@media (prefers-reduced-motion: reduce) { .ag-walk,.ag-flag,.ag-spark,.ag-cloud,.ag-pulse,.ag-flame { animation: none; } }
`;
let injected = false;
function useCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

// ---------- Пиксельные иконки характеристик (8×8) ----------
const ICONS = {
  physical: [[0, 3, 1, 2], [1, 2, 1, 4], [2, 3, 4, 2], [6, 2, 1, 4], [7, 3, 1, 2]],
  discipline: [[1, 0, 6, 1], [1, 1, 6, 3], [2, 4, 4, 2], [3, 6, 2, 1], [3, 1, 2, 3, 'w']],
  knowledge: [[0, 1, 4, 6], [4, 1, 4, 6], [3, 1, 2, 6, 'w'], [1, 2, 2, 1, 'w'], [5, 2, 2, 1, 'w'], [1, 4, 2, 1, 'w'], [5, 4, 2, 1, 'w']],
  focus: [[2, 0, 4, 1], [0, 2, 1, 4], [7, 2, 1, 4], [2, 7, 4, 1], [1, 1, 1, 1], [6, 1, 1, 1], [1, 6, 1, 1], [6, 6, 1, 1], [3, 3, 2, 2]],
  finance: [[2, 0, 4, 8], [0, 2, 8, 4], [1, 1, 6, 6], [3, 2, 2, 4, 'w']],
  career: [[0, 2, 8, 6], [2, 0, 4, 2], [3, 1, 2, 1, 'w'], [0, 4, 8, 1, 'w'], [3, 4, 2, 2]],
  creator: [[3, 0, 2, 2], [0, 3, 8, 2], [1, 2, 6, 4], [1, 6, 2, 2], [5, 6, 2, 2]],
  social: [[1, 0, 2, 2], [5, 0, 2, 2], [0, 3, 4, 4], [4, 3, 4, 4], [0, 7, 8, 1]],
  mental: [[1, 0, 6, 1], [0, 1, 8, 5], [2, 6, 4, 1], [3, 7, 2, 1], [2, 2, 1, 2, 'w'], [5, 2, 1, 2, 'w']],
  quest: [[1, 0, 6, 8], [0, 0, 8, 1], [0, 7, 8, 1], [2, 2, 4, 1, 'w'], [2, 4, 3, 1, 'w']],
  boss: [[1, 1, 6, 6], [0, 0, 2, 2], [6, 0, 2, 2], [2, 3, 1, 1, 'w'], [5, 3, 1, 1, 'w'], [2, 5, 4, 1, 'w']],
};
export function PixelIcon({ kind, color, size = 18, bg }) {
  const rects = ICONS[kind] || ICONS.quest;
  const c = color || STAT_COLOR[kind] || PAPER.terra;
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {rects.map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={r[4] === 'w' ? (bg || PAPER.card) : c} />)}
    </svg>
  );
}

export function StatTile({ stat, size = 40 }) {
  const c = STAT_COLOR[stat] || PAPER.terra;
  return (
    <span style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c + '1a', border: `1px solid ${c}40` }}>
      <PixelIcon kind={STAT_RU[stat] ? stat : (stat || 'quest')} color={c} size={Math.round(size * 0.5)} bg="#f6efe6" />
    </span>
  );
}

// ---------- Дорога дня: пиксельная сценка, герой идёт к сундуку ----------
export function DayRoad({ total, done }) {
  useCss();
  const n = Math.max(1, Math.min(9, total));
  const d = Math.max(0, Math.min(n, done));
  const allDone = total > 0 && done >= total;
  const x0 = 14, x1 = 150;
  const step = (x1 - x0) / n;
  const nodes = Array.from({ length: n }, (_, i) => Math.round(x0 + step * i));
  const heroX = allDone ? 156 : nodes[Math.min(d, n - 1)];
  return (
    <svg viewBox="0 0 178 64" shapeRendering="crispEdges" role="img" aria-label={`Дорога дня: пройдено ${done} из ${total}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect x="0" y="0" width="178" height="30" fill="#a9c6db" />
      <rect x="0" y="30" width="178" height="8" fill="#c9d9e2" />
      <g className="ag-cloud" fill="#f4f1ea"><rect x="0" y="8" width="12" height="3" /><rect x="3" y="6" width="6" height="2" /></g>
      <rect x="150" y="6" width="5" height="5" fill="#f4e8b0" /><rect x="149" y="7" width="7" height="3" fill="#f4e8b0" />
      <g fill="#b8c4cc"><rect x="4" y="22" width="10" height="16" /><rect x="16" y="26" width="8" height="12" /><rect x="120" y="24" width="9" height="14" /><rect x="131" y="20" width="7" height="18" /><rect x="164" y="26" width="10" height="12" /></g>
      <rect x="96" y="10" width="1" height="28" fill="#e6e2d8" /><rect x="94" y="20" width="5" height="2" fill="#e6e2d8" /><rect x="95" y="7" width="1" height="3" fill="#c0503a" />
      <rect x="0" y="38" width="178" height="26" fill="#9fbf7a" />
      <rect x="0" y="38" width="178" height="2" fill="#8aab68" />
      <rect x="0" y="47" width="178" height="7" fill="#d8c49a" />
      <rect x="0" y="47" width="178" height="1" fill="#c4ae80" /><rect x="0" y="53" width="178" height="1" fill="#c4ae80" />
      <g fill="#7a9a56"><rect x="30" y="40" width="5" height="4" /><rect x="72" y="41" width="4" height="3" /><rect x="110" y="40" width="5" height="4" /><rect x="58" y="57" width="4" height="3" /><rect x="138" y="58" width="5" height="3" /></g>
      {nodes.map((x, i) => {
        const isDone = i < d;
        return (
          <g key={i}>
            <rect x={x - 3} y="49" width="7" height="3" fill={isDone ? PAPER.terra : '#b8a37a'} />
            {isDone && (
              <g>
                <rect x={x} y="36" width="1" height="13" fill="#3e3026" />
                <rect className="ag-flag" x={x + 1} y="36" width="5" height="4" fill={PAPER.terra} />
              </g>
            )}
          </g>
        );
      })}
      <g>
        <rect x="160" y="44" width="12" height="7" fill="#8a5a3a" />
        <rect x="160" y="47" width="12" height="1" fill="#5a3826" />
        <rect x="165" y="46" width="2" height="3" fill="#e8c48a" />
        <g className={allDone ? 'ag-lid' : undefined}><rect x="160" y="41" width="12" height="4" fill="#a06a44" /><rect x="160" y="41" width="12" height="1" fill="#c48a2a" /></g>
        {allDone && <g fill="#f6e6b0"><rect className="ag-spark" x="158" y="36" width="1" height="1" /><rect className="ag-spark" x="173" y="38" width="1" height="1" style={{ animationDelay: '-.5s' }} /><rect className="ag-spark" x="166" y="33" width="1" height="1" style={{ animationDelay: '-.9s' }} /></g>}
      </g>
      <g style={{ transform: `translateX(${heroX - 4}px)`, transition: 'transform .8s cubic-bezier(.16,1,.3,1)' }}><g className="ag-walk">
        <rect x="1" y="35" width="6" height="2" fill="#1e1a1a" />
        <rect x="1" y="37" width="6" height="3" fill="#e8b896" />
        <rect x="2" y="38" width="1" height="1" fill="#1e2230" /><rect x="5" y="38" width="1" height="1" fill="#1e2230" />
        <rect x="0" y="40" width="8" height="5" fill="#1e2230" />
        <rect x="3" y="40" width="1" height="2" fill="#f2eee5" />
        <rect x="1" y="45" width="2" height="4" fill="#2b2f3e" /><rect x="5" y="45" width="2" height="4" fill="#2b2f3e" />
        <rect x="1" y="49" width="2" height="1" fill="#f2eee5" /><rect x="5" y="49" width="2" height="1" fill="#f2eee5" />
      </g></g>
    </svg>
  );
}

// ---------- Карточка-задание с печатью «Готово» ----------
/**
 * props: title, stat, meta (строка), rewards [{label, color}], done, onDo, actionLabel, big, onMore (для меню), children (доп. контент)
 * onDo вызывается после анимации печати (650 мс), чтобы карточка успела «отыграть».
 */
export function ActionTicket({ title, stat, meta, rewards = [], done, onDo, actionLabel = 'Выполнить', big, children, accent }) {
  useCss();
  const [phase, setPhase] = useState(null);
  const c = accent || STAT_COLOR[stat] || PAPER.terra;
  const go = (e) => {
    if (phase || done || !onDo) return;
    const r = e && e.currentTarget ? e.currentTarget.getBoundingClientRect() : null;
    setPhase('stamp');
    setTimeout(() => { setPhase('out'); onDo(r ? { x: r.left + r.width / 2, y: r.top } : null); }, 650);
  };
  const stamped = done || phase;
  return (
    <div className={phase === 'out' ? 'ag-out' : 'lrpg-stagger'} style={{
      position: 'relative', background: PAPER.card, border: `1px solid ${big ? c + '66' : PAPER.line}`, borderRadius: 14,
      padding: big ? '14px 14px 14px 16px' : '11px 12px 11px 14px', boxShadow: big ? `0 1px 0 ${PAPER.line}, 0 10px 24px rgba(30,34,48,.08)` : `0 1px 0 #e9e3d6`,
      opacity: done && !phase ? 0.72 : 1, overflow: 'hidden',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, background: c }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatTile stat={stat} size={big ? 46 : 38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {meta && <div className="lrpg-mono" style={{ fontSize: 9, color: PAPER.muted, marginBottom: 3 }}>{meta}</div>}
          <div style={{ fontSize: big ? 17 : 14.5, fontWeight: 700, lineHeight: 1.25, color: PAPER.ink, textDecoration: done && !phase ? 'line-through' : 'none', textDecorationColor: PAPER.line2 }}>{title}</div>
          {rewards.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {rewards.map((r, i) => (
                <span key={i} className="lrpg-num" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: (r.color || PAPER.terra) + '14', color: r.color || PAPER.terra }}>{r.label}</span>
              ))}
            </div>
          )}
        </div>
        {!done && onDo && (
          <button className={'lrpg-btn' + (big && !phase ? ' ag-pulse' : '') + (phase ? ' ag-press' : '')} onClick={go} aria-label={actionLabel} style={{
            flexShrink: 0, width: big ? 54 : 44, height: big ? 54 : 44, borderRadius: big ? 16 : 13,
            background: phase ? PAPER.green : PAPER.terra, color: PAPER.card, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 0 ${phase ? '#2c5a35' : '#7a2e1c'}`,
          }}>
            <svg width={big ? 22 : 18} height={big ? 22 : 18} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true"><rect x="1" y="4" width="1" height="1" fill="currentColor" /><rect x="2" y="5" width="1" height="1" fill="currentColor" /><rect x="3" y="6" width="1" height="1" fill="currentColor" /><rect x="4" y="5" width="1" height="1" fill="currentColor" /><rect x="5" y="4" width="1" height="1" fill="currentColor" /><rect x="6" y="3" width="1" height="1" fill="currentColor" /><rect x="7" y="2" width="1" height="1" fill="currentColor" /></svg>
          </button>
        )}
      </div>
      {children}
      {stamped && (
        <span className={phase ? 'ag-stamp' : undefined} aria-hidden="true" style={{
          position: 'absolute', right: big ? 70 : 58, top: '50%', marginTop: -13, transform: 'rotate(-8deg)', pointerEvents: 'none',
          border: `2px solid ${PAPER.green}`, color: PAPER.green, borderRadius: 6, padding: '2px 8px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: '.12em', background: 'rgba(251,249,244,.85)',
        }}>ГОТОВО</span>
      )}
    </div>
  );
}

// ---------- Мини-шкала энергии (пиксельные батарейки) ----------
export function EnergyPips({ value }) {
  const n = 5;
  const on = Math.round((Math.max(0, Math.min(100, value)) / 100) * n);
  return (
    <span aria-label={`Энергия ${Math.round(value)} из 100`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ width: 7, height: 14, borderRadius: 2, background: i < on ? PAPER.mustard : '#e6e0d3', boxShadow: i < on ? 'inset 0 -3px 0 rgba(0,0,0,.12)' : 'none' }} />
      ))}
    </span>
  );
}

// ---------- Огонь серии: чем дольше серия, тем сильнее и «дороже» пламя ----------
export const FLAME_TIERS = [
  { min: 0, name: 'Нет серии', outer: '#c9bfae', mid: '#b8ae9c', core: '#e6e0d3', glow: null, scale: 0.85, sparks: 0, speed: 0 },
  { min: 1, name: 'Искра', outer: '#e8a05a', mid: '#d8823a', core: '#f6d08a', glow: null, scale: 0.85, sparks: 0, speed: 1.2 },
  { min: 3, name: 'Огонёк', outer: '#e07a3a', mid: '#c8562a', core: '#f6c47a', glow: 'rgba(224,122,58,.35)', scale: 1, sparks: 1, speed: 0.9 },
  { min: 7, name: 'Пламя', outer: '#d8562a', mid: '#a4412a', core: '#f6d08a', glow: 'rgba(216,86,42,.5)', scale: 1.1, sparks: 2, speed: 0.75 },
  { min: 20, name: 'Костёр', outer: '#e8402a', mid: '#b8302a', core: '#ffe08a', glow: 'rgba(232,64,42,.65)', scale: 1.25, sparks: 3, speed: 0.6 },
  { min: 30, name: 'Синее пламя', outer: '#3a7ad8', mid: '#2a5aa8', core: '#cff0ff', glow: 'rgba(58,122,216,.7)', scale: 1.32, sparks: 4, speed: 0.5 },
  { min: 50, name: 'Фиолетовое пламя', outer: '#9a4ad8', mid: '#6a2aa8', core: '#f4d4ff', glow: 'rgba(154,74,216,.8)', scale: 1.42, sparks: 5, speed: 0.42 },
  { min: 100, name: 'Чёрное пламя', outer: '#1a1420', mid: '#3a2450', core: '#c08aff', glow: 'rgba(120,40,200,.9)', scale: 1.55, sparks: 6, speed: 0.36, black: true },
];
export function flameTier(n) {
  let t = FLAME_TIERS[0];
  FLAME_TIERS.forEach(x => { if ((n || 0) >= x.min) t = x; });
  return t;
}
export const STREAK_MILESTONES = [3, 7, 20, 30, 50, 100];

const FLAME_CSS = `
@keyframes agFlick { 0%,100% { transform: scale(1,1); } 50% { transform: scale(.94,1.1); } }
@keyframes agTongue { 0%,100% { opacity: 1; transform: translateY(0); } 50% { opacity: 0; transform: translateY(-1px); } }
@keyframes agRise { 0% { transform: translate(0,0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(var(--dx), -26px); opacity: 0; } }
@keyframes agAura { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.12); } }
.ag-flick { animation: agFlick var(--sp) steps(2) infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.ag-tongue { animation: agTongue calc(var(--sp) * 1.3) steps(2) infinite; }
.ag-rise { position: absolute; animation: agRise var(--d) linear infinite; }
.ag-aura { animation: agAura 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .ag-flick,.ag-tongue,.ag-rise,.ag-aura { animation: none; } }
`;
let flameCss = false;
function useFlameCss() {
  if (flameCss || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = FLAME_CSS; document.head.appendChild(el); flameCss = true;
}

export function FlameIcon({ n, size = 16 }) {
  useCss(); useFlameCss();
  const t = flameTier(n);
  const px = Math.round(size * t.scale);
  const sparks = Array.from({ length: t.sparks }, (_, i) => i);
  return (
    <span style={{ position: 'relative', width: px, height: Math.round(px * 1.2), display: 'inline-block', flexShrink: 0 }}>
      {t.black && <span className="ag-aura" style={{ position: 'absolute', inset: -px * 0.35, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(120,40,200,.55), rgba(26,20,32,.25) 60%, transparent)' }} />}
      <svg width={px} height={Math.round(px * 1.2)} viewBox="0 0 10 12" shapeRendering="crispEdges" aria-hidden="true"
        style={{ position: 'relative', display: 'block', overflow: 'visible', filter: t.glow ? `drop-shadow(0 0 ${Math.max(2, px / 5)}px ${t.glow})` : 'none', '--sp': `${t.speed || 1}s` }}>
        <g className={t.speed ? 'ag-flick' : undefined}>
          {t.black && <g fill="#8a4ad8"><rect x="3" y="0" width="4" height="2" /><rect x="1" y="2" width="8" height="4" /><rect x="0" y="6" width="10" height="5" /><rect x="1" y="11" width="8" height="1" /></g>}
          <g fill={t.outer}><rect x="4" y="0" width="2" height="1" /><rect x="3" y="1" width="4" height="2" /><rect x="2" y="3" width="6" height="3" /><rect x="1" y="6" width="8" height="4" /><rect x="2" y="10" width="6" height="2" /></g>
          <g fill={t.mid}><rect x="4" y="3" width="2" height="1" /><rect x="3" y="4" width="4" height="3" /><rect x="2" y="7" width="6" height="3" /><rect x="3" y="10" width="4" height="1" /></g>
          <g fill={t.core}><rect x="4" y="6" width="2" height="2" /><rect x="3" y="8" width="4" height="2" /></g>
          {t.speed > 0 && <rect className="ag-tongue" x={t.min >= 20 ? 2 : 6} y="1" width="1" height="2" fill={t.outer} />}
        </g>
      </svg>
      {sparks.map(i => (
        <span key={i} className="ag-rise" style={{
          left: `${20 + ((i * 37) % 60)}%`, bottom: '55%', width: Math.max(2, px / 8), height: Math.max(2, px / 8),
          background: t.black ? (i % 2 ? '#c08aff' : '#2a1a38') : t.core, '--dx': `${(i % 2 ? 1 : -1) * (2 + i)}px`, '--d': `${1.1 + (i % 3) * 0.35}s`, animationDelay: `${-i * 0.33}s`,
        }} />
      ))}
    </span>
  );
}

export function StreakFlame({ n, size = 14, showName }) {
  const t = flameTier(n);
  const color = t.black ? '#5a2a8a' : n >= 1 ? (t.min >= 30 ? t.mid : PAPER.terra) : PAPER.muted;
  return (
    <span title={t.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color }}>
      <FlameIcon n={n} size={size} />
      <span className="lrpg-num" style={{ fontSize: 12.5, fontWeight: 700 }}>{n}</span>
      {showName && n >= 1 && <span className="lrpg-mono" style={{ fontSize: 8.5, color }}>{t.name}</span>}
    </span>
  );
}

// ---------- Сундук дня: церемония открытия ----------
const CHEST_CSS = `
@keyframes agChestIdle { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-4px) rotate(-1deg); } }
@keyframes agChestHit { 0% { transform: rotate(0) scale(1); } 20% { transform: rotate(-9deg) scale(1.06); } 40% { transform: rotate(8deg) scale(1.04); } 60% { transform: rotate(-5deg); } 80% { transform: rotate(3deg); } 100% { transform: rotate(0) scale(1); } }
@keyframes agRays { to { transform: rotate(360deg); } }
@keyframes agLidFly { 0% { transform: translate(0,0) rotate(0); } 100% { transform: translate(-18px,-70px) rotate(-38deg); opacity: 0; } }
@keyframes agFlashOut { 0% { opacity: .95; } 100% { opacity: 0; } }
@keyframes agCardIn { 0% { opacity: 0; transform: translateY(26px) scale(.6) rotate(-6deg); } 60% { opacity: 1; transform: translateY(-6px) scale(1.06) rotate(1deg); } 100% { opacity: 1; transform: none; } }
@keyframes agCoinFall { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--r)); opacity: 0; } }
@keyframes agTwinkle { 0%,100% { opacity: .15; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
@keyframes agScrim { from { opacity: 0; } to { opacity: 1; } }
@keyframes agHintBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
.ag-chest-idle { animation: agChestIdle 1.6s ease-in-out infinite; }
.ag-chest-hit { animation: agChestHit .5s cubic-bezier(.3,1.5,.5,1) both; }
.ag-rays { animation: agRays 9s linear infinite; }
.ag-lidfly { animation: agLidFly .7s cubic-bezier(.2,.9,.3,1) both; transform-box: fill-box; transform-origin: 0 100%; }
.ag-flash { animation: agFlashOut .7s ease-out both; }
.ag-cardin { animation: agCardIn .6s cubic-bezier(.2,1.3,.3,1) both; }
.ag-coinfall { animation: agCoinFall 1.2s cubic-bezier(.2,.7,.4,1) both; }
.ag-twinkle { animation: agTwinkle 1.6s ease-in-out infinite; }
.ag-scrim { animation: agScrim .35s ease both; }
.ag-hint { animation: agHintBob 1s ease-in-out infinite; }
`;
let chestCss = false;
function useChestCss() {
  if (chestCss || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CHEST_CSS; document.head.appendChild(el); chestCss = true;
}

function BigChest({ open, glow }) {
  return (
    <svg viewBox="0 0 40 34" width="190" height="162" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', overflow: 'visible', filter: `drop-shadow(0 0 ${6 + glow * 6}px rgba(246,208,138,${0.25 + glow * 0.2}))` }}>
      <rect x="4" y="30" width="32" height="3" fill="#000" opacity=".25" />
      <rect x="4" y="15" width="32" height="16" fill="#8a5a3a" />
      <rect x="4" y="15" width="32" height="2" fill="#a06a44" />
      <rect x="4" y="22" width="32" height="2" fill="#c48a2a" /><rect x="4" y="29" width="32" height="2" fill="#5a3826" />
      <rect x="4" y="15" width="2" height="16" fill="#c48a2a" /><rect x="34" y="15" width="2" height="16" fill="#c48a2a" />
      <rect x="18" y="19" width="4" height="7" fill="#e8c48a" /><rect x="19" y="21" width="2" height="2" fill="#5a3826" />
      {open && <rect x="6" y="13" width="28" height="3" fill="#ffe9a8" />}
      {glow > 0 && !open && <g fill="#ffe9a8" opacity={0.4 + glow * 0.3}><rect x="6" y="14" width="28" height="1" />{glow > 1 && <rect x="17" y="13" width="1" height="2" />}{glow > 1 && <rect x="26" y="12" width="1" height="3" />}</g>}
      <g className={open ? 'ag-lidfly' : undefined}>
        <rect x="3" y="7" width="34" height="8" fill="#a06a44" />
        <rect x="5" y="5" width="30" height="2" fill="#a06a44" /><rect x="8" y="4" width="24" height="1" fill="#a06a44" />
        <rect x="3" y="7" width="34" height="1" fill="#c48a2a" /><rect x="3" y="13" width="34" height="2" fill="#c48a2a" />
        <rect x="3" y="7" width="2" height="8" fill="#c48a2a" /><rect x="35" y="7" width="2" height="8" fill="#c48a2a" />
        <rect x="17" y="11" width="6" height="4" fill="#e8c48a" />
      </g>
    </svg>
  );
}

/**
 * Церемония сундука. rewards: { coins, xp, gift: { kind: 'room'|'crystal'|'coins', item?, amount? } }
 * fx(name): звуки/вибрация из App (CHEST_TAP, CHEST_OPEN, REWARD_POP). renderItem(item) — превью предмета комнаты.
 */
export function ChestCeremony({ rewards, fx, renderItem, onClaim }) {
  useCss(); useChestCss();
  const [taps, setTaps] = useState(0);
  const [stage, setStage] = useState('closed');
  const [hit, setHit] = useState(0);
  const [shown, setShown] = useState(0);
  const cards = [
    { key: 'coins', title: `+${rewards.coins}`, sub: 'монет', color: PAPER.mustard },
    { key: 'xp', title: `+${rewards.xp}`, sub: 'опыта', color: PAPER.terra },
    rewards.gift.kind === 'room'
      ? { key: 'gift', title: rewards.gift.item.name, sub: 'в твою комнату', color: PAPER.teal, item: rewards.gift.item, big: true }
      : rewards.gift.kind === 'crystal'
        ? { key: 'gift', title: `+${rewards.gift.amount}`, sub: 'кристалл', color: PAPER.berry, big: true }
        : { key: 'gift', title: `+${rewards.gift.amount}`, sub: 'бонусных монет', color: PAPER.mustard, big: true },
  ];
  const tap = () => {
    if (stage !== 'closed') return;
    const n = taps + 1;
    setTaps(n); setHit(h => h + 1);
    if (n < 3) { fx('CHEST_TAP'); return; }
    fx('CHEST_OPEN');
    setStage('burst');
    setTimeout(() => {
      setStage('reveal');
      cards.forEach((_, i) => setTimeout(() => { setShown(i + 1); fx('REWARD_POP'); }, 280 + i * 420));
    }, 850);
  };
  const coins = Array.from({ length: 16 }, (_, i) => i);
  const view = (
    <div role="dialog" aria-label="Сундук дня" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className="ag-scrim" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 42%, #3a2a3a 0%, #1e2230 62%, #12141c 100%)' }} />
      <div className={stage === 'closed' ? undefined : 'ag-rays'} style={{
        position: 'absolute', left: '50%', top: '40%', width: 760, height: 760, marginLeft: -380, marginTop: -380, borderRadius: '50%',
        opacity: stage === 'closed' ? 0.12 + taps * 0.1 : 0.55, transition: 'opacity .5s ease',
        background: 'repeating-conic-gradient(from 0deg, rgba(246,208,138,.35) 0deg 9deg, transparent 9deg 24deg)',
        WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
      }} />
      {[[12, 18], [80, 14], [22, 70], [86, 64], [50, 8], [64, 82], [8, 44], [92, 40]].map(([x, y], i) => (
        <span key={i} className="ag-twinkle" style={{ position: 'absolute', left: x + '%', top: y + '%', width: 5, height: 5, background: i % 2 ? '#f6d08a' : '#fbf9f4', animationDelay: `${-i * 0.27}s` }} />
      ))}

      <div style={{ position: 'relative', textAlign: 'center', color: '#f2eee5', marginBottom: 6, minHeight: 58 }}>
        <div className="lrpg-mono" style={{ fontSize: 10, color: '#f6d08a' }}>Награда за день</div>
        <div className="lrpg-display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{stage === 'reveal' ? 'Твоя добыча' : 'Сундук дня'}</div>
      </div>

      <button onClick={tap} aria-label="Открыть сундук" className="lrpg-btn" style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: stage === 'closed' ? 'pointer' : 'default' }}>
        <div key={hit} className={stage === 'closed' ? (hit ? 'ag-chest-hit' : 'ag-chest-idle') : undefined}>
          <BigChest open={stage !== 'closed'} glow={taps} />
        </div>
        {stage !== 'closed' && coins.map(i => (
          <span key={i} className="ag-coinfall" style={{
            position: 'absolute', left: '50%', top: '42%', width: 8, height: 8, background: i % 3 === 0 ? '#e8c48a' : '#c48a2a', boxShadow: 'inset -2px -2px 0 rgba(0,0,0,.2)',
            '--dx': `${Math.cos(i * 0.9) * (70 + (i % 4) * 25)}px`, '--dy': `${-60 - (i % 5) * 26}px`, '--r': `${i * 40}deg`, animationDelay: `${(i % 4) * 0.05}s`,
          }} />
        ))}
      </button>

      {stage === 'closed' && (
        <div className="ag-hint lrpg-mono" style={{ position: 'relative', marginTop: 14, fontSize: 11, color: '#f6d08a' }}>
          {taps === 0 ? 'Стучи по сундуку' : taps === 1 ? 'Ещё!' : 'Последний удар!'} · {3 - taps}
        </div>
      )}

      {stage === 'reveal' && (
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, width: 'min(340px, 88vw)', marginTop: 4 }}>
          {cards.map((c, i) => i < shown && (
            <div key={c.key} className="ag-cardin" style={{
              gridColumn: c.big ? '1 / -1' : 'auto', background: '#fbf9f4', border: `1px solid ${c.color}66`, borderRadius: 14, padding: c.item ? 10 : '12px 10px',
              display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 10px 28px rgba(0,0,0,.35), 0 0 0 3px ${c.color}22`, textAlign: 'left', color: PAPER.ink,
            }}>
              {c.item && renderItem ? (
                <div style={{ width: 96, borderRadius: 10, overflow: 'hidden', border: `1px solid ${PAPER.line}`, flexShrink: 0 }}>{renderItem(c.item)}</div>
              ) : (
                <span style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.color + '1f', flexShrink: 0 }}>
                  <PixelIcon kind={c.key === 'xp' ? 'creator' : c.sub === 'кристалл' ? 'focus' : 'finance'} color={c.color} size={20} />
                </span>
              )}
              <span style={{ minWidth: 0 }}>
                <span className={c.item ? undefined : 'lrpg-num'} style={{ display: 'block', fontSize: c.item ? 16 : 20, fontWeight: 700, lineHeight: 1.15 }}>{c.title}</span>
                <span className="lrpg-mono" style={{ fontSize: 9, color: c.color }}>{c.sub}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {stage === 'reveal' && shown >= cards.length && (
        <button className="lrpg-btn ag-cardin" onClick={onClaim} style={{ position: 'relative', marginTop: 18, background: PAPER.terra, color: '#fbf9f4', border: 'none', borderRadius: 14, padding: '13px 34px', fontSize: 16, fontWeight: 700, boxShadow: '0 3px 0 #7a2e1c, 0 10px 26px rgba(164,65,42,.45)' }}>
          Забрать
        </button>
      )}
      {stage === 'burst' && <div className="ag-flash" style={{ position: 'absolute', inset: 0, background: '#fff6dc', pointerEvents: 'none' }} />}
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}

// ---------- Заготовка под тренировки («Проект 78») ----------
export function TrainingSoon() {
  useCss();
  return (
    <div className="lrpg-stagger" style={{ background: PAPER.card, border: `1px solid ${PAPER.line}`, borderRadius: 14, overflow: 'hidden' }}>
      <svg viewBox="0 0 178 70" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <rect width="178" height="52" fill="#d8cdb8" /><rect y="52" width="178" height="18" fill="#9a7452" />
        <rect y="50" width="178" height="2" fill="#7c5a3e" />
        <rect x="20" y="14" width="40" height="22" fill="#3e3026" /><rect x="21" y="15" width="38" height="20" fill="#f2eee5" />
        <rect x="25" y="19" width="14" height="2" fill={PAPER.terra} /><rect x="25" y="24" width="24" height="1" fill="#6b6f7a" /><rect x="25" y="27" width="18" height="1" fill="#6b6f7a" /><rect x="25" y="30" width="21" height="1" fill="#6b6f7a" />
        <rect x="74" y="44" width="30" height="3" fill="#3e3026" /><rect x="70" y="40" width="5" height="11" fill="#55556a" /><rect x="103" y="40" width="5" height="11" fill="#55556a" />
        <rect x="120" y="30" width="3" height="22" fill="#3e3026" /><rect x="140" y="30" width="3" height="22" fill="#3e3026" /><rect x="118" y="28" width="27" height="3" fill="#3e3026" />
        <rect x="124" y="36" width="15" height="3" fill={PAPER.terra} /><rect x="122" y="34" width="4" height="7" fill="#55556a" /><rect x="137" y="34" width="4" height="7" fill="#55556a" />
        <rect x="150" y="38" width="10" height="13" fill={PAPER.teal} /><rect x="151" y="36" width="8" height="2" fill="#f2eee5" />
        <g className="ag-spark" fill="#f6e6b0"><rect x="64" y="10" width="1" height="1" /><rect x="112" y="16" width="1" height="1" /><rect x="164" y="22" width="1" height="1" /></g>
      </svg>
      <div style={{ padding: '14px 16px 16px' }}>
        <div className="lrpg-mono" style={{ fontSize: 9, color: PAPER.terra }}>Скоро</div>
        <div className="lrpg-display" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>Зал откроется скоро</div>
        <div style={{ fontSize: 13.5, color: '#4a4e5a', marginTop: 6, lineHeight: 1.45 }}>
          Здесь будут тренировки из приложения «Проект 78»: программы, подходы, вес и прогресс. За каждую тренировку герой будет получать опыт и прокачивать «Тело».
        </div>
      </div>
    </div>
  );
}
