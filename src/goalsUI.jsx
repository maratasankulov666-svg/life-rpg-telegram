// goalsUI.jsx — раздел «Цели» как атлас походов в стиле «бумага + пиксель».
// Каждая цель — гора: тропа с тремя лагерями (25/50/75 %) и флагом на вершине (100 %).
// Только отображение; логику (прогресс, награды, ИИ) передаёт App.jsx через props.
import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { PAPER, PixelIcon, STAT_COLOR } from './actionsUI.jsx';

// Сферы целей (ключи хранятся в state по-английски) → русское имя, иконка-характеристика, цвет.
export const SPHERE_META = {
  Career: { ru: 'Карьера', stat: 'career' },
  Finance: { ru: 'Финансы', stat: 'finance' },
  Knowledge: { ru: 'Знания', stat: 'knowledge' },
  Physical: { ru: 'Тело', stat: 'physical' },
  Relationships: { ru: 'Отношения', stat: 'social' },
  Creator: { ru: 'Творчество', stat: 'creator' },
  'Personal Development': { ru: 'Саморазвитие', stat: 'mental' },
};
export function sphereMeta(sphere) {
  const m = SPHERE_META[sphere] || { ru: sphere || 'Цель', stat: 'discipline' };
  return { ...m, color: STAT_COLOR[m.stat] || PAPER.terra };
}

export const GOAL_CAMPS = [
  { at: 25, coins: 10, name: 'Первый лагерь' },
  { at: 50, coins: 15, name: 'Полпути' },
  { at: 75, coins: 25, name: 'Последний лагерь' },
];
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
export const GOAL_SUMMIT = { coins: 80, xp: 60 };

export function daysLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
  return Math.ceil((end - Date.now()) / 86400000) - 1;
}

const CSS = `
@keyframes gsFog { 0%,100% { opacity: .92; } 50% { opacity: .78; } }
@keyframes gsBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
@keyframes gsGlow { 0%,100% { opacity: .35; } 50% { opacity: .9; } }
@keyframes gsCloud { from { transform: translateX(-40px); } to { transform: translateX(230px); } }
@keyframes gsClimb { 0% { transform: translate(-58px, 34px); } 100% { transform: translate(0, 0); } }
@keyframes gsRise { 0% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
@keyframes gsPop { 0% { opacity: 0; transform: translateY(18px) scale(.7); } 60% { opacity: 1; transform: translateY(-4px) scale(1.05); } 100% { opacity: 1; transform: none; } }
@keyframes gsToast { 0% { opacity: 0; transform: translate(-50%, 30px); } 12%,86% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, 16px); } }
@keyframes gsConf { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--r)); opacity: 0; } }
@keyframes gsRays { to { transform: rotate(360deg); } }
@keyframes gsHi { 0% { box-shadow: 0 0 0 0 rgba(164,65,42,.5); } 100% { box-shadow: 0 0 0 14px rgba(164,65,42,0); } }
@keyframes gsSeal { 0% { transform: scale(1.8) rotate(-30deg); opacity: 0; } 100% { transform: rotate(-8deg); opacity: 1; } }
.gs-fog { animation: gsFog 5s ease-in-out infinite; }
.gs-bob { animation: gsBob .7s steps(2) infinite; }
.gs-glow { animation: gsGlow 1.3s steps(3) infinite; }
.gs-cloud { animation: gsCloud 46s linear infinite; }
.gs-climb { animation: gsClimb 1.6s cubic-bezier(.3,.7,.4,1) both; }
.gs-rise { animation: gsRise .5s cubic-bezier(.2,1.4,.3,1) 1.5s both; transform-box: fill-box; transform-origin: 50% 100%; }
.gs-pop { animation: gsPop .55s cubic-bezier(.2,1.3,.3,1) both; }
.gs-toast { animation: gsToast 3.4s ease both; }
.gs-conf { animation: gsConf 1.6s cubic-bezier(.2,.7,.4,1) both; }
.gs-rays { animation: gsRays 12s linear infinite; }
.gs-hi { animation: gsHi 1s ease-out 2; }
.gs-seal { animation: gsSeal .45s cubic-bezier(.2,1.4,.3,1) both; }
.gs-trail-hero { transition: transform 1s cubic-bezier(.16,1,.3,1); }
@media (prefers-reduced-motion: reduce) { .gs-fog,.gs-bob,.gs-glow,.gs-cloud,.gs-rays { animation: none; } .gs-trail-hero { transition: none; } }
`;
let injected = false;
export function useGoalsCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

// Крошечный герой 6×10 (тот же, что на дороге дня).
function Hero({ x, y }) {
  return (
    <g className="gs-trail-hero" style={{ transform: `translate(${x - 3}px, ${y - 10}px)` }}>
      <g className="gs-bob">
        <rect x="1" y="0" width="4" height="2" fill="#1e1a1a" />
        <rect x="1" y="2" width="4" height="2" fill="#e8b896" />
        <rect x="0" y="4" width="6" height="3" fill="#1e2230" />
        <rect x="2" y="4" width="1" height="2" fill="#f2eee5" />
        <rect x="1" y="7" width="1" height="3" fill="#2b2f3e" /><rect x="4" y="7" width="1" height="3" fill="#2b2f3e" />
      </g>
    </g>
  );
}

// Точка тропы: от лагеря внизу слева к вершине справа, с зигзагом серпантина.
function trailPoint(t) {
  const x = 10 + t * 166;
  const y = 49 - 41 * Math.pow(t, 1.15) + (t < 0.94 ? Math.sin(t * Math.PI * 5) * 2.6 : 0);
  return [Math.round(x), Math.round(y)];
}

function Tent({ x, y, lit }) {
  const c = lit ? PAPER.terra : '#b9b2a2';
  return (
    <g>
      <rect x={x - 1} y={y - 6} width="2" height="1" fill={c} />
      <rect x={x - 2} y={y - 5} width="4" height="1" fill={c} />
      <rect x={x - 3} y={y - 4} width="6" height="1" fill={c} />
      <rect x={x - 4} y={y - 3} width="8" height="2" fill={c} />
      <rect x={x} y={y - 3} width="1" height="2" fill={lit ? '#5a2216' : '#9a9384'} />
      {lit && <rect className="gs-glow" x={x + 5} y={y - 2} width="2" height="2" fill="#f6c24a" />}
    </g>
  );
}

/** Тропа одной цели: лагеря 25/50/75, флаг на вершине, туман над непройденным. */
export function GoalTrail({ progress, color, done, height }) {
  useGoalsCss();
  const uid = useId().replace(/:/g, '');
  const p = Math.max(0, Math.min(100, Number(progress) || 0)) / 100;
  const dots = [];
  for (let i = 0; i <= 44; i++) {
    const t = i / 44;
    const [x, y] = trailPoint(t);
    dots.push(<rect key={i} x={x} y={y} width="2" height="2" fill={t <= p + 0.001 ? PAPER.terra : '#c4b48e'} />);
  }
  const [hx, hy] = done ? [176, 9] : trailPoint(p);
  const fogX = done ? 220 : Math.min(200, hx + 8);
  return (
    <svg viewBox="0 0 200 58" shapeRendering="crispEdges" role="img" aria-label={`Тропа к вершине: ${Math.round(p * 100)}%`} style={{ display: 'block', width: '100%', height: height || 'auto' }}>
      <defs>
        <linearGradient id={`fog${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f2eee5" stopOpacity="0" />
          <stop offset=".18" stopColor="#f2eee5" stopOpacity=".72" />
          <stop offset="1" stopColor="#f2eee5" stopOpacity=".86" />
        </linearGradient>
      </defs>
      <rect width="200" height="58" fill={done ? '#e9d9b0' : '#c9dbe6'} />
      <g className="gs-cloud" fill="#f4f1ea"><rect x="0" y="8" width="14" height="3" /><rect x="4" y="6" width="7" height="2" /></g>
      <g fill={done ? '#d8c39a' : '#b4c3cd'}>
        <polygon points="0,40 18,28 30,34 46,22 64,36 80,30 96,40 96,58 0,58" />
      </g>
      <polygon points="64,58 104,34 118,38 140,20 158,14 176,4 190,16 200,22 200,58" fill="#8d97a0" />
      <polygon points="104,34 118,38 140,20 132,32 118,42" fill="#7a848d" />
      <polygon points="165,11 176,4 188,14 182,13 177,16 171,12" fill="#f8f6f0" />
      <polygon points="0,58 0,46 30,42 60,46 92,52 120,58" fill="#9fbf7a" />
      <rect x="0" y="46" width="30" height="1" fill="#8aab68" />
      {dots}
      {GOAL_CAMPS.map(c => {
        const [x, y] = trailPoint(c.at / 100);
        return <Tent key={c.at} x={x + 1} y={y + 1} lit={p * 100 >= c.at} />;
      })}
      <g>
        <rect x="176" y="0" width="1" height="9" fill="#3e3026" />
        <rect className={done ? 'ag-flag' : undefined} x="177" y="0" width="7" height="4" fill={done ? (color || PAPER.terra) : '#cfc8b8'} />
        {done && <g fill="#fff3c4"><rect className="gs-glow" x="170" y="2" width="1" height="1" /><rect className="gs-glow" x="187" y="6" width="1" height="1" style={{ animationDelay: '-.4s' }} /><rect className="gs-glow" x="181" y="9" width="1" height="1" style={{ animationDelay: '-.8s' }} /></g>}
      </g>
      {!done && <rect className="gs-fog" x={fogX} y="0" width={Math.max(0, 200 - fogX)} height="58" fill={`url(#fog${uid})`} />}
      <Hero x={hx + 1} y={hy + 1} />
    </svg>
  );
}

// Ступенчатая пиксельная гора: ширина на уровне основания ≈ 2*h*k.
function peakPoints(cx, base, h, k = 1.15) {
  const step = 3;
  const left = [], right = [];
  for (let y = 0; y <= h; y += step) {
    const half = Math.round((h - y) * k + 2);
    left.push(`${cx - half},${base - y}`, `${cx - half},${base - y - step}`);
    right.unshift(`${cx + half},${base - y - step}`, `${cx + half},${base - y}`);
  }
  return [...left, ...right].join(' ');
}

/** Панорама хребта: каждая активная цель — гора; герой на склоне по прогрессу. */
export function RidgePanorama({ goals, onPick, summits = 0, night }) {
  useGoalsCss();
  const list = goals.slice(0, 6);
  const n = list.length;
  const W = 200, base = 66;
  const xs = list.map((_, i) => (n === 1 ? 100 : Math.round(22 + (i * (W - 44)) / (n - 1))));
  return (
    <svg viewBox="0 0 200 78" shapeRendering="crispEdges" role="img" aria-label="Хребет целей" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="200" height="78" fill={night ? '#2f3e6b' : '#bcd3e0'} />
      <rect y="40" width="200" height="38" fill={night ? '#3a4a78' : '#d3e1e8'} />
      {night
        ? <g fill="#f4e8b0"><rect x="24" y="8" width="1" height="1" /><rect x="70" y="14" width="1" height="1" /><rect x="120" y="6" width="1" height="1" /><rect x="176" y="18" width="1" height="1" /><rect x="160" y="8" width="5" height="5" /></g>
        : <g><rect x="166" y="8" width="8" height="8" fill="#f4e0a0" /><rect x="164" y="10" width="12" height="4" fill="#f4e0a0" /></g>}
      <g className="gs-cloud" fill={night ? '#53639a' : '#f4f1ea'}><rect x="0" y="16" width="16" height="3" /><rect x="5" y="13" width="7" height="3" /></g>
      <g className="gs-cloud" fill={night ? '#53639a' : '#f4f1ea'} style={{ animationDelay: '-22s' }}><rect x="0" y="28" width="12" height="2" /><rect x="3" y="26" width="6" height="2" /></g>
      <polygon points={`0,${base} 0,52 20,46 44,54 70,44 100,52 128,42 160,50 186,44 200,48 200,${base}`} fill={night ? '#46557f' : '#aebcc6'} />
      {list.map((g, i) => {
        const h = 34 + ((i * 7) % 3) * 6 + (n <= 2 ? 6 : 0);
        const cx = xs[i];
        const prog = Math.max(0, Math.min(100, g.progress || 0)) / 100;
        const color = sphereMeta(g.sphere).color;
        const top = base - h;
        const heroY = Math.round(base - 2 - prog * (h - 6));
        const heroX = Math.round(cx - (h - (base - heroY)) * 0.5 + 1);
        return (
          <g key={g.id} onClick={onPick ? () => onPick(g.id) : undefined} style={{ cursor: onPick ? 'pointer' : 'default' }}>
            <polygon points={peakPoints(cx, base, h)} fill={night ? '#5d6a8f' : '#8d97a0'} />
            <polygon points={peakPoints(cx, top + 11, 9, 1.15)} fill="#f8f6f0" />
            <rect x={cx - Math.round(h * 0.55)} y={base - Math.round(h * 0.45)} width="2" height={Math.round(h * 0.45)} fill={night ? '#4d5980' : '#7a848d'} opacity=".55" />
            <rect x={cx} y={top - 9} width="1" height="9" fill="#3e3026" />
            <rect x={cx + 1} y={top - 9} width="6" height="4" fill={color} className="ag-flag" />
            <Hero x={heroX} y={heroY} />
            <rect x={cx - 16} y={top - 12} width="32" height={h + 24} fill="transparent" />
          </g>
        );
      })}
      {n === 0 && (
        <g>
          <polygon points={peakPoints(100, base, 40)} fill="#a9b3bb" />
          <polygon points={peakPoints(100, base - 29, 11)} fill="#f8f6f0" />
          <rect x="100" y={base - 50} width="1" height="10" fill="#3e3026" /><rect x="101" y={base - 50} width="6" height="4" fill="#cfc8b8" />
        </g>
      )}
      <rect y={base} width="200" height={78 - base} fill={night ? '#4a6a4a' : '#9fbf7a'} />
      <rect y={base} width="200" height="1" fill={night ? '#3c5a3c' : '#8aab68'} />
      {list.map((g, i) => (
        <g key={'lbl' + g.id}>
          <rect x={xs[i] - 5} y={base + 2} width="10" height="8" fill="#fbf9f4" />
          <rect x={xs[i] - 5} y={base + 2} width="10" height="1" fill={sphereMeta(g.sphere).color} />
          <text x={xs[i]} y={base + 8.6} textAnchor="middle" fontSize="6" fontWeight="700" fill={PAPER.ink} fontFamily="JetBrains Mono, monospace">{i + 1}</text>
        </g>
      ))}
      {summits > 0 && (
        <g>
          {Array.from({ length: Math.min(summits, 8) }, (_, i) => (
            <g key={i}><rect x={6 + i * 6} y="4" width="1" height="8" fill="#3e3026" /><rect x={7 + i * 6} y="4" width="4" height="3" fill={PAPER.mustard} /></g>
          ))}
        </g>
      )}
    </svg>
  );
}

/** Сургучная печать со сроком. */
export function DeadlineSeal({ deadline, done, size = 46 }) {
  useGoalsCss();
  const d = daysLeft(deadline);
  let bg = '#8d97a0', big = '∞', small = 'без срока';
  if (done) { bg = PAPER.mustard; big = '★'; small = 'покорено'; }
  else if (d !== null) {
    if (d < 0) { bg = '#7a2e1c'; big = '!'; small = 'просрочено'; }
    else {
      bg = d <= 3 ? PAPER.terra : d <= 14 ? PAPER.mustard : PAPER.green;
      big = d > 999 ? '999+' : String(d);
      small = d === 0 ? 'сегодня' : plural(d, 'день', 'дня', 'дней');
    }
  }
  return (
    <div className="gs-seal" aria-label={`Срок: ${big} ${small}`} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, background: bg, color: '#fbf9f4',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      boxShadow: `inset 0 0 0 3px rgba(255,255,255,.18), inset -3px -4px 0 rgba(0,0,0,.18), 0 2px 0 rgba(0,0,0,.12)`,
    }}>
      <span className="lrpg-num" style={{ fontSize: big.length > 3 ? 12 : 17, fontWeight: 800, lineHeight: 1 }}>{big}</span>
      <span className="lrpg-mono" style={{ fontSize: 6.5, letterSpacing: '.06em', marginTop: 2, opacity: .92 }}>{small}</span>
    </div>
  );
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/** Пиксельный кубок трофея в цвете сферы. */
export function TrophyCup({ color, size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="3" y="1" width="10" height="1" fill="#e8c48a" />
      <rect x="3" y="2" width="10" height="5" fill={PAPER.mustard} />
      <rect x="4" y="7" width="8" height="1" fill={PAPER.mustard} />
      <rect x="5" y="8" width="6" height="1" fill={PAPER.mustard} />
      <rect x="1" y="2" width="2" height="1" fill={PAPER.mustard} /><rect x="0" y="3" width="1" height="3" fill={PAPER.mustard} /><rect x="1" y="6" width="2" height="1" fill={PAPER.mustard} />
      <rect x="13" y="2" width="2" height="1" fill={PAPER.mustard} /><rect x="15" y="3" width="1" height="3" fill={PAPER.mustard} /><rect x="13" y="6" width="2" height="1" fill={PAPER.mustard} />
      <rect x="4" y="2" width="1" height="4" fill="#f6e3b0" />
      <rect x="6" y="3" width="4" height="3" fill={color} />
      <rect x="7" y="9" width="2" height="2" fill="#a06a2a" />
      <rect x="5" y="11" width="6" height="1" fill="#a06a2a" />
      <rect x="4" y="12" width="8" height="3" fill="#5a3826" />
      <rect x="5" y="13" width="6" height="1" fill="#e8c48a" />
    </svg>
  );
}

/** Зал трофеев: покорённые цели на деревянных полках. */
export function TrophyShelf({ goals }) {
  useGoalsCss();
  if (!goals.length) {
    return (
      <div className="lrpg-paper" style={{ padding: 18, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', opacity: .35 }}><TrophyCup color="#8d97a0" size={56} /></div>
        <div className="lrpg-display" style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Полки пока пустые</div>
        <div style={{ fontSize: 13, color: PAPER.muted, marginTop: 4, lineHeight: 1.45 }}>Доведи цель до 100% — и здесь встанет кубок с её именем.</div>
      </div>
    );
  }
  const rows = [];
  for (let i = 0; i < goals.length; i += 3) rows.push(goals.slice(i, i + 3));
  return (
    <div style={{ background: '#e9dcc4', border: `1px solid ${PAPER.line2}`, borderRadius: 14, padding: '12px 10px 6px', boxShadow: 'inset 0 2px 0 rgba(0,0,0,.05)' }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, alignItems: 'end' }}>
            {row.map((g, i) => {
              const m = sphereMeta(g.sphere);
              const date = g.completedAt || g.updatedAt;
              return (
                <div key={g.id} className="gs-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animationDelay: `${(ri * 3 + i) * 0.06}s` }}>
                  <TrophyCup color={m.color} size={46} />
                  <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, marginTop: 4, color: PAPER.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 26 }}>{g.title}</div>
                  {date && <div className="lrpg-mono" style={{ fontSize: 7.5, color: '#7a6a50', marginTop: 2 }}>{new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ height: 7, marginTop: 4, background: '#8a5a3a', borderRadius: 2, boxShadow: '0 3px 0 #5a3826' }} />
        </div>
      ))}
    </div>
  );
}

/** Выбор сферы: пиксельные плашки. */
export function SpherePicker({ value, onChange, spheres }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6 }}>
      {spheres.map(s => {
        const m = sphereMeta(s);
        const on = value === s;
        return (
          <button key={s} type="button" className="lrpg-btn" onClick={() => onChange(s)} aria-pressed={on} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: on ? m.color + '1c' : PAPER.card, color: on ? m.color : PAPER.ink,
            border: `1px solid ${on ? m.color : PAPER.line}`, textAlign: 'left',
          }}>
            <PixelIcon kind={m.stat} color={on ? m.color : '#8d8a80'} size={14} />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.ru}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Церемония. fx = { kind: 'camp'|'summit', goal, camp?, coins, xp, young }.
 * camp — короткий тост снизу; summit — полноэкранная сцена восхождения.
 */
export function GoalCeremony({ fx, onClose, onTrophies, sound }) {
  useGoalsCss();
  const isSummit = fx.kind === 'summit';
  useEffect(() => {
    if (sound) sound(isSummit ? 'ACHIEVEMENT_UNLOCK' : 'STREAK_MILESTONE');
    if (!isSummit) {
      const t = setTimeout(onClose, 3400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => sound && sound('REWARD_POP'), 1700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const color = sphereMeta(fx.goal.sphere).color;
  const rewards = [
    fx.coins > 0 && { label: `+${fx.coins}`, sub: 'монет', c: PAPER.mustard, icon: 'finance' },
    fx.xp > 0 && { label: `+${fx.xp}`, sub: 'опыта', c: PAPER.terra, icon: 'creator' },
  ].filter(Boolean);

  if (!isSummit) {
    const view = (
      <div className="gs-toast" role="status" onClick={onClose} style={{
        fontFamily: FONT,
        position: 'fixed', left: '50%', bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))', zIndex: 210, width: 'min(360px, calc(100vw - 32px))',
        background: PAPER.card, border: `1px solid ${PAPER.line2}`, borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 12px 30px rgba(30,34,48,.25)', color: PAPER.ink, cursor: 'pointer',
      }}>
        <svg width="34" height="28" viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="5" y="0" width="2" height="1" fill={PAPER.terra} /><rect x="4" y="1" width="4" height="1" fill={PAPER.terra} /><rect x="3" y="2" width="6" height="1" fill={PAPER.terra} />
          <rect x="2" y="3" width="8" height="3" fill={PAPER.terra} /><rect x="6" y="3" width="1" height="3" fill="#5a2216" />
          <rect className="gs-glow" x="10" y="4" width="2" height="2" fill="#f6c24a" /><rect x="0" y="6" width="12" height="1" fill="#9fbf7a" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lrpg-mono" style={{ fontSize: 8.5, color }}>{fx.camp ? `${fx.camp.at}% · лагерь разбит` : 'лагерь'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>{fx.camp ? fx.camp.name : 'Привал'}: {fx.goal.title}</div>
          {fx.young && <div style={{ fontSize: 11, color: PAPER.muted }}>Награда — когда походу будет хотя бы 12 часов</div>}
        </div>
        {rewards.map(r => <span key={r.sub} className="lrpg-num" style={{ fontSize: 14, fontWeight: 800, color: r.c }}>{r.label}</span>)}
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
  }

  const conf = Array.from({ length: 22 }, (_, i) => i);
  const palette = [color, PAPER.mustard, PAPER.terra, '#fbf9f4', PAPER.teal];
  const view = (
    <div role="dialog" aria-label="Вершина покорена" style={{ fontFamily: FONT, position: 'fixed', inset: 0, zIndex: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16 }}>
      <div className="ag-scrim" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 38%, #3d3a5a 0%, #1e2230 60%, #12141c 100%)' }} />
      <div className="gs-rays" style={{
        position: 'absolute', left: '50%', top: '36%', width: 720, height: 720, marginLeft: -360, marginTop: -360, borderRadius: '50%', opacity: .5,
        background: 'repeating-conic-gradient(from 0deg, rgba(246,208,138,.32) 0deg 8deg, transparent 8deg 22deg)',
        WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 60%)', maskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
      }} />
      <div style={{ position: 'relative', textAlign: 'center', color: '#f2eee5' }}>
        <div className="lrpg-mono" style={{ fontSize: 10, color: '#f6d08a' }}>Поход завершён</div>
        <div className="lrpg-display" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.05, marginTop: 2 }}>Вершина покорена!</div>
      </div>
      <div style={{ position: 'relative', marginTop: 10 }}>
        <svg viewBox="0 0 80 52" width="260" height="169" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={peakPoints(40, 50, 40, 1)} fill="#5d6a8f" />
          <polygon points={peakPoints(40, 22, 12, 1)} fill="#f8f6f0" />
          <rect x="0" y="48" width="80" height="4" fill="#3c5a3c" />
          <g className="gs-climb"><Hero x={41} y={11} /></g>
          <g className="gs-rise">
            <rect x="44" y="0" width="1" height="11" fill="#e8c48a" />
            <rect className="ag-flag" x="45" y="0" width="9" height="5" fill={color} />
          </g>
        </svg>
        {conf.map(i => (
          <span key={i} className="gs-conf" style={{
            position: 'absolute', left: '56%', top: '8%', width: 6, height: 6, background: palette[i % palette.length],
            '--dx': `${Math.cos(i * 1.7) * (60 + (i % 5) * 26)}px`, '--dy': `${-30 + Math.sin(i * 1.3) * 90}px`, '--r': `${i * 47}deg`,
            animationDelay: `${1.55 + (i % 6) * 0.04}s`,
          }} />
        ))}
      </div>
      <div className="gs-pop" style={{ position: 'relative', animationDelay: '1.7s', width: 'min(340px, 100%)', background: '#fbf9f4', borderRadius: 16, padding: '14px 14px 12px', color: PAPER.ink, boxShadow: '0 14px 34px rgba(0,0,0,.4)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><TrophyCup color={color} size={52} /></div>
        <div className="lrpg-display" style={{ fontSize: 19, fontWeight: 700, marginTop: 6, lineHeight: 1.2 }}>{fx.goal.title}</div>
        <div className="lrpg-mono" style={{ fontSize: 8.5, color, marginTop: 3 }}>{sphereMeta(fx.goal.sphere).ru} · кубок в зале трофеев</div>
        {rewards.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
            {rewards.map(r => (
              <span key={r.sub} style={{ display: 'flex', alignItems: 'center', gap: 6, background: r.c + '18', border: `1px solid ${r.c}55`, borderRadius: 10, padding: '6px 10px' }}>
                <PixelIcon kind={r.icon} color={r.c} size={14} />
                <span className="lrpg-num" style={{ fontSize: 16, fontWeight: 800 }}>{r.label}</span>
                <span className="lrpg-mono" style={{ fontSize: 8, color: r.c }}>{r.sub}</span>
              </span>
            ))}
          </div>
        )}
        {fx.young && <div style={{ fontSize: 11.5, color: PAPER.muted, marginTop: 8 }}>Монеты дают за походы старше 12 часов. Кубок всё равно твой.</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="lrpg-btn" onClick={onClose} style={{ flex: 1, background: PAPER.alt, color: PAPER.ink, border: `1px solid ${PAPER.line}`, borderRadius: 12, padding: '11px 0', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>Дальше</button>
          {onTrophies && <button className="lrpg-btn" onClick={onTrophies} style={{ flex: 1.3, background: PAPER.terra, color: '#fbf9f4', border: 'none', borderRadius: 12, padding: '11px 0', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 3px 0 #7a2e1c' }}>В зал трофеев</button>}
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}

/** Небольшой хук: подсветить карточку цели после тапа по горе. */
export function useHighlight() {
  const [hi, setHi] = useState(null);
  useEffect(() => {
    if (!hi) return undefined;
    const t = setTimeout(() => setHi(null), 2200);
    return () => clearTimeout(t);
  }, [hi]);
  return [hi, setHi];
}
