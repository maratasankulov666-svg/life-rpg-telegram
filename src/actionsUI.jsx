// actionsUI.jsx — игровые элементы раздела «Действия» в стиле «бумага + пиксель».
// Только отображение: логику (выполнить, отложить, атаковать босса) передаёт App.jsx через props.
import React, { useState } from 'react';

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

// ---------- Огонёк серии ----------
export function StreakFlame({ n, size = 14 }) {
  useCss();
  const hot = n >= 3;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: hot ? PAPER.terra : PAPER.muted }}>
      <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true">
        <g className={hot ? 'ag-flame' : undefined}>
          <rect x="3" y="0" width="2" height="2" fill={hot ? '#e07a3a' : '#c9bfae'} /><rect x="2" y="2" width="4" height="2" fill={hot ? '#e07a3a' : '#c9bfae'} />
          <rect x="1" y="4" width="6" height="3" fill={hot ? PAPER.terra : '#b8ae9c'} /><rect x="2" y="7" width="4" height="1" fill={hot ? PAPER.terra : '#b8ae9c'} />
          <rect x="3" y="4" width="2" height="2" fill={hot ? '#f2c47a' : '#e6e0d3'} />
        </g>
      </svg>
      <span className="lrpg-num" style={{ fontSize: 12, fontWeight: 700 }}>{n}</span>
    </span>
  );
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
