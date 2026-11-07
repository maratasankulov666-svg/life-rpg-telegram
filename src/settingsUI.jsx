// settingsUI.jsx — «Настройки» как меню игры: кристалл сохранения, переключатели, кнопка-удержание для опасных действий.
import React, { useEffect, useRef, useState } from 'react';
import { PAPER } from './actionsUI.jsx';

const CSS = `
@keyframes stSpin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes stGlow { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
.st-float { animation: stSpin 2s steps(2) infinite; }
.st-glow { animation: stGlow 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .st-float,.st-glow { animation: none; } }
.lrpg-calm *, .lrpg-calm *::before, .lrpg-calm *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
`;
let injected = false;
export function useSettingsCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

/** Пиксельный кристалл сохранения (как в RPG): цвет по статусу. */
export function SaveCrystal({ status = 'ok', size = 56 }) {
  useSettingsCss();
  const c = status === 'ok' ? ['#2f6b6e', '#5fa3a6', '#d6f0ee'] : status === 'local' ? ['#a06a1a', '#c48a2a', '#f6e3b0'] : ['#7a2e1c', '#a4412a', '#f2c9be'];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      <ellipse className="st-glow" cx="8" cy="14.5" rx="6" ry="1.2" fill={c[1]} opacity=".5" />
      <g className="st-float">
        <rect x="7" y="0" width="2" height="1" fill={c[2]} />
        <rect x="6" y="1" width="4" height="2" fill={c[1]} /><rect x="5" y="3" width="6" height="3" fill={c[1]} />
        <rect x="4" y="6" width="8" height="2" fill={c[0]} /><rect x="5" y="8" width="6" height="2" fill={c[0]} />
        <rect x="6" y="10" width="4" height="1" fill={c[0]} /><rect x="7" y="11" width="2" height="1" fill={c[0]} />
        <rect x="6" y="2" width="1" height="4" fill={c[2]} /><rect x="9" y="4" width="1" height="2" fill={c[2]} opacity=".6" />
      </g>
    </svg>
  );
}

/** Переключатель-тумблер. */
export function Toggle({ on, onChange, label, note }) {
  return (
    <button type="button" className="lrpg-btn" role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', padding: '9px 0', textAlign: 'left' }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: PAPER.ink }}>{label}</span>
        {note && <span style={{ display: 'block', fontSize: 11.5, color: PAPER.muted, marginTop: 1 }}>{note}</span>}
      </span>
      <span style={{ width: 44, height: 26, borderRadius: 13, background: on ? PAPER.green : '#d6cdb9', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 10, background: '#fbf9f4', boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'left .2s cubic-bezier(.2,1.3,.3,1)' }} />
      </span>
    </button>
  );
}

/** Кнопка «удерживай, чтобы подтвердить» — для сбросов. */
export function HoldButton({ label, color = PAPER.terra, ms = 1600, onDone, note }) {
  const [p, setP] = useState(0);
  const t0 = useRef(0);
  const raf = useRef(null);
  const done = useRef(false);
  const stop = () => { cancelAnimationFrame(raf.current); if (!done.current) setP(0); };
  const tick = () => {
    const v = Math.min(1, (performance.now() - t0.current) / ms);
    setP(v);
    if (v >= 1) { done.current = true; onDone && onDone(); setTimeout(() => { done.current = false; setP(0); }, 600); return; }
    raf.current = requestAnimationFrame(tick);
  };
  const start = (e) => { e.preventDefault(); done.current = false; t0.current = performance.now(); raf.current = requestAnimationFrame(tick); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <div>
      <button type="button" className="lrpg-btn" onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={e => e.preventDefault()}
        style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '11px 0', borderRadius: 12, border: `1.5px solid ${color}`, background: PAPER.card, color, fontSize: 14, fontWeight: 700, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
        <span style={{ position: 'absolute', inset: 0, width: `${p * 100}%`, background: color, opacity: .9 }} />
        <span style={{ position: 'relative', color: p > 0.5 ? '#fbf9f4' : color }}>{p >= 1 ? 'Готово' : p > 0 ? 'Держи…' : label}</span>
      </button>
      {note && <div style={{ fontSize: 11.5, color: PAPER.muted, marginTop: 4 }}>{note}</div>}
    </div>
  );
}

/** Заголовок раздела настроек с пиксельной иконкой-плашкой. */
export function SettingsSection({ title, icon, color = PAPER.ink, children, open, onToggle, badge }) {
  return (
    <div className="lrpg-paper" style={{ overflow: 'hidden' }}>
      <button type="button" className="lrpg-btn" onClick={onToggle} aria-expanded={open} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', background: 'none', textAlign: 'left' }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: color + '1a', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <span className="lrpg-display" style={{ flex: 1, fontSize: 17, fontWeight: 700, color: PAPER.ink }}>{title}</span>
        {badge}
        <span style={{ color: PAPER.muted, fontSize: 14, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
      </button>
      {open && <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${PAPER.line}` }}>{children}</div>}
    </div>
  );
}
