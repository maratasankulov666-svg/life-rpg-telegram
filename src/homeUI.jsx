// homeUI.jsx — живая Главная: доска дня (маршрут и следующие шаги), реплика героя, записка наставника.
import React, { useEffect, useState } from 'react';
import { PAPER, PixelIcon } from './actionsUI.jsx';
import { NpcPortrait } from './councilUI.jsx';

const CSS = `
@keyframes hmBubble { 0% { opacity: 0; transform: translate(-50%, 8px) scale(.85); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes hmPin { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(1.5deg); } }
@keyframes hmGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(196,138,42,.55); } 50% { box-shadow: 0 0 0 8px rgba(196,138,42,0); } }
@keyframes hmTap { 0%,100% { opacity: .0; } 50% { opacity: .9; } }
@keyframes hmDone { 0% { transform: scale(1); } 40% { transform: scale(.9); } 100% { transform: scale(1); } }
.hm-bubble { animation: hmBubble .35s cubic-bezier(.2,1.3,.3,1) both; }
.hm-pin { animation: hmPin 6s ease-in-out infinite; transform-origin: 50% 0; }
.hm-glow { animation: hmGlow 1.6s ease-in-out infinite; }
.hm-tap { animation: hmTap 2.4s ease-in-out infinite; }
.hm-done { animation: hmDone .35s ease both; }
@media (prefers-reduced-motion: reduce) { .hm-pin,.hm-glow,.hm-tap { animation: none; } }
`;
let injected = false;
export function useHomeCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

const card = { background: 'rgba(251,249,244,.97)', border: `1px solid ${PAPER.line}`, boxShadow: '0 2px 0 rgba(30,34,48,.06), 0 8px 20px rgba(30,34,48,.14)' };

/**
 * Доска дня: пришпиленная записка с маршрутом до сундука и двумя ближайшими шагами.
 * items: [{ key, title, stat, kind, onDo }], done/total, chest: 'ready'|'claimed'|null
 */
export function DayBoard({ done, total, items, chest, onOpen, onChest }) {
  useHomeCss();
  const [pressed, setPressed] = useState(null);
  const pct = total ? done / total : 0;
  return (
    <div className="hm-pin lrpg-hud-in" style={{ ...card, borderRadius: 14, padding: '10px 10px 9px', width: '100%', animationDelay: '.12s', position: 'relative' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: -5, left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, background: PAPER.terra, boxShadow: 'inset -2px -2px 0 rgba(0,0,0,.2)' }} />
      <button type="button" className="lrpg-btn" onClick={onOpen} style={{ width: '100%', background: 'none', padding: 0, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="lrpg-display" style={{ fontSize: 15, fontWeight: 700, color: PAPER.ink }}>Сегодня</span>
          <span className="lrpg-num" style={{ fontSize: 12, fontWeight: 800, color: PAPER.terra }}>{done}/{total}</span>
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
          {Array.from({ length: Math.max(1, Math.min(14, total)) }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 1, background: i < done ? PAPER.terra : '#e6e0d3' }} />
          ))}
          <span style={{ width: 10, height: 8, marginLeft: 2, marginTop: -1, background: chest === 'claimed' ? '#c9c2b2' : '#a06a44', borderTop: `2px solid ${chest === 'ready' ? '#f6c24a' : '#c48a2a'}`, borderRadius: 1 }} />
        </div>
      </button>
      {chest === 'ready' ? (
        <button type="button" className="lrpg-btn hm-glow" onClick={onChest} style={{ marginTop: 8, width: '100%', padding: '8px 0', borderRadius: 10, background: PAPER.mustard, color: '#fbf9f4', border: 'none', fontSize: 13, fontWeight: 800 }}>Сундук ждёт!</button>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 11.5, color: PAPER.muted, marginTop: 7, lineHeight: 1.3 }}>{total ? 'Все шаги пройдены. Отдыхай, герой.' : 'Маршрут пуст — добавь привычку или квест.'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
          {items.map(it => (
            <button key={it.key} type="button" className={'lrpg-btn' + (pressed === it.key ? ' hm-done' : '')} onClick={() => { setPressed(it.key); setTimeout(() => { setPressed(null); it.onDo(); }, 260); }}
              aria-label={`Выполнить: ${it.title}`} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 7px', borderRadius: 9, background: pressed === it.key ? 'rgba(63,122,74,.12)' : PAPER.alt, border: `1px solid ${PAPER.line}`, textAlign: 'left' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${pressed === it.key ? PAPER.green : PAPER.muted}`, background: pressed === it.key ? PAPER.green : 'transparent', flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: PAPER.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
              <PixelIcon kind={it.stat || 'quest'} size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Реплика героя над головой. */
export function HeroBubble({ text, onClose, onAct, actLabel }) {
  useHomeCss();
  useEffect(() => { const t = setTimeout(onClose, 5200); return () => clearTimeout(t); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div key={text} className="hm-bubble" role="status" onClick={onAct || onClose} style={{ position: 'absolute', left: '50%', top: '42%', zIndex: 4, maxWidth: 'min(260px, 72vw)', ...card, borderRadius: 14, padding: '9px 12px', fontSize: 13.5, lineHeight: 1.35, color: PAPER.ink, textAlign: 'center' }}>
      {text}
      {onAct && actLabel && <span style={{ display: 'block', marginTop: 6, fontSize: 12, fontWeight: 800, color: PAPER.terra }}>{actLabel} →</span>}
      <span aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: -7, marginLeft: -7, width: 14, height: 14, background: 'rgba(251,249,244,.97)', borderRight: `1px solid ${PAPER.line}`, borderBottom: `1px solid ${PAPER.line}`, transform: 'rotate(45deg)' }} />
    </div>
  );
}

/** Записка наставника: портрет и дневная фраза, тап — в штаб. */
export function MentorNote({ id = 'kaylen', name, line, onOpen }) {
  useHomeCss();
  return (
    <button type="button" className="lrpg-btn lrpg-hud-in" onClick={onOpen} style={{ ...card, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, padding: '6px 10px 6px 6px', maxWidth: 'min(300px, calc(100vw - 150px))', textAlign: 'left', animationDelay: '.18s' }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', background: '#efe6d2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><NpcPortrait id={id} size={34} bg="#efe6d2" /></span>
      <span style={{ minWidth: 0 }}>
        <span className="lrpg-mono" style={{ display: 'block', fontSize: 7.5, color: PAPER.terra }}>{name} пишет</span>
        <span style={{ fontSize: 12, color: PAPER.ink, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{line}</span>
      </span>
    </button>
  );
}

/** Подсказка «тапни по герою» — мерцающая стрелка. */
export function TapHint() {
  useHomeCss();
  return <div className="hm-tap" aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '47%', transform: 'translateX(-50%)', zIndex: 3, fontSize: 11, color: '#fbf9f4', background: 'rgba(30,34,48,.55)', padding: '3px 8px', borderRadius: 99, pointerEvents: 'none' }}>тапни по герою</div>;
}
