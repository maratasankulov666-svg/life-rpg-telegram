// profileUI.jsx — раздел «Профиль»: карточка героя с экипировкой, медали достижений, плитки разделов.
// Только отображение; данные и действия передаёт App.jsx через props.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PAPER, PixelIcon } from './actionsUI.jsx';
import { RarityCard, RarityLabel, RarityBurst, rarityRank, useRarityCss } from './rarityFX.jsx';
import { TitlePlate, AnyAuraArt } from './revealFX.jsx';
import { gearLayers, gearFromSlots, useHeroGearCss } from './heroGearFX.jsx';

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
export const RARITY_TONE = {
  Common: { c: '#7a7f8a', bg: '#eceae3', ru: 'Обычный' },
  Rare: { c: '#2f6b6e', bg: '#e1ecea', ru: 'Редкий' },
  Epic: { c: '#a83e66', bg: '#f2e1e7', ru: 'Эпический' },
  Legendary: { c: '#c48a2a', bg: '#f6ebd3', ru: 'Легендарный' },
  Mythic: { c: '#7a5af0', bg: '#f1ecff', ru: 'Мифический' },
};

const CSS = `
@keyframes pfGlow { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
@keyframes pfBreath { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
@keyframes pfShine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(220%) skewX(-20deg); } }
@keyframes pfDrop { 0% { opacity: 0; transform: translate(-50%, -40px) scale(.9); } 10%,88% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -24px); } }
@keyframes pfSpin { 0% { transform: rotateY(90deg) scale(.6); } 60% { transform: rotateY(-12deg) scale(1.08); } 100% { transform: rotateY(0) scale(1); } }
@keyframes pfPop { 0% { opacity: 0; transform: scale(.8); } 100% { opacity: 1; transform: none; } }
.pf-glow { animation: pfGlow 2.2s ease-in-out infinite; }
.pf-breath { animation: pfBreath 1.6s steps(2) infinite; }
.pf-shine { position: absolute; inset: 0; overflow: hidden; pointer-events: none; border-radius: inherit; }
.pf-shine::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); animation: pfShine 3.6s ease-in-out infinite; }
.pf-drop { animation: pfDrop 3.8s cubic-bezier(.2,1.2,.3,1) both; }
.pf-spin { animation: pfSpin .8s cubic-bezier(.2,1.3,.3,1) .15s both; }
.pf-pop { animation: pfPop .35s cubic-bezier(.2,1.3,.3,1) both; }
@media (prefers-reduced-motion: reduce) { .pf-glow,.pf-breath,.pf-shine::after { animation: none; } }
`;
let injected = false;
export function useProfileCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

// ---------- Пиксельные предметы экипировки (10×10) ----------
const GEAR = {
  weapon: [[7, 0, 2, 2], [6, 1, 2, 2], [5, 2, 2, 2], [4, 3, 2, 2], [3, 4, 2, 2], [1, 5, 4, 1], [2, 6, 2, 1], [1, 7, 2, 2, 'd'], [0, 9, 2, 1, 'd']],
  armor: [[1, 1, 3, 2], [6, 1, 3, 2], [2, 2, 6, 7], [0, 2, 2, 3], [8, 2, 2, 3], [4, 3, 2, 4, 'l']],
  helmet: [[2, 1, 6, 1], [1, 2, 8, 4], [1, 6, 2, 3], [7, 6, 2, 3], [3, 4, 4, 1, 'd'], [4, 0, 2, 1, 'l']],
  gloves: [[2, 2, 2, 4], [4, 1, 2, 5], [6, 2, 2, 4], [1, 5, 7, 3], [2, 8, 5, 2, 'd']],
  shoes: [[1, 1, 3, 5], [1, 6, 5, 2], [1, 8, 6, 1, 'd'], [6, 3, 3, 4], [6, 7, 4, 2], [6, 9, 4, 1, 'd']],
  accessory: [[3, 0, 4, 1, 'd'], [2, 1, 1, 3, 'd'], [7, 1, 1, 3, 'd'], [3, 4, 4, 1, 'd'], [3, 5, 4, 4], [4, 6, 2, 2, 'l']],
  artifact: [[1, 1, 8, 2, 'd'], [2, 3, 6, 5], [1, 8, 8, 2, 'd'], [3, 4, 4, 1, 'l'], [3, 6, 3, 1, 'l']],
};
export function GearIcon({ slot, color, size = 26 }) {
  const rects = GEAR[slot] || GEAR.artifact;
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {rects.map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={r[4] === 'd' ? '#5a4636' : r[4] === 'l' ? '#fbf9f4' : color} opacity={r[4] === 'l' ? 0.7 : 1} />)}
    </svg>
  );
}

// Пиксельный герой во весь рост (тот же, что в комнате) — в надетом снаряжении: облик растёт по уровням I–V.
export function HeroSprite({ gear = {}, height = 150 }) {
  useHeroGearCss();
  const L = gearLayers(gear);
  return (
    <svg viewBox="0 0 18 53" height={height} width={(height * 18) / 53} className="pf-breath" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {L.back}
      <g shapeRendering="crispEdges">
        <rect x="1" y="15" width="3" height="12" fill="#1a1e2c" /><rect x="14" y="15" width="3" height="12" fill="#1a1e2c" />
        <rect x="1" y="26" width="4" height="3" fill="#e8b896" /><rect x="13" y="26" width="4" height="3" fill="#e8b896" />
        <rect x="2" y="13" width="14" height="2" fill="#1e2230" />
        <rect x="4" y="15" width="10" height="13" fill="#1e2230" />
        <rect x="5" y="15" width="1" height="9" fill="#ffffff" opacity=".15" />
        <rect x="7" y="12" width="1" height="6" fill="#f2eee5" /><rect x="10" y="12" width="1" height="5" fill="#f2eee5" />
        <rect x="5" y="24" width="8" height="1" fill="#141826" />
        <rect x="3" y="28" width="12" height="2" fill="#1a1e2c" />
        <rect x="4" y="30" width="5" height="16" fill="#2b2f3e" /><rect x="9" y="30" width="5" height="16" fill="#2b2f3e" />
        <rect x="8" y="34" width="2" height="12" fill="#20232f" />
        <rect x="2" y="46" width="7" height="5" fill="#f2eee5" /><rect x="9" y="46" width="7" height="5" fill="#f2eee5" />
        <rect x="2" y="51" width="7" height="1" fill="#5a4636" /><rect x="9" y="51" width="7" height="1" fill="#5a4636" />
      </g>
      {L.body}
      <g shapeRendering="crispEdges">
        <rect x="7" y="10" width="4" height="2" fill="#d8a482" />
        <rect x="4" y="3" width="10" height="7" fill="#e8b896" />
        <rect x="5" y="6" width="2" height="2" fill="#1e2230" /><rect x="11" y="6" width="2" height="2" fill="#1e2230" />
        <rect x="8" y="9" width="2" height="1" fill="#b88274" />
        <g fill="#1e1a1a">
          <rect x="6" y="0" width="7" height="1" /><rect x="4" y="1" width="11" height="1" /><rect x="3" y="2" width="13" height="2" />
          <rect x="3" y="4" width="3" height="1" /><rect x="13" y="4" width="2" height="1" /><rect x="3" y="5" width="1" height="4" /><rect x="14" y="5" width="1" height="3" />
        </g>
      </g>
      {L.head}
      {L.front}
    </svg>
  );
}

/**
 * Карточка героя-«кукла»: герой в центре, вокруг 7 слотов экипировки.
 * slots: [{ slot, label, theme, tier: { roman, rarity, label }, value, next: { roman, min } | null, statLabel }]
 */
export function HeroPaperDoll({ slots, onSlot, active, aura, onInspect }) {
  useProfileCss();
  const left = ['helmet', 'armor', 'gloves', 'weapon'];
  const right = ['accessory', 'artifact', 'shoes'];
  const by = Object.fromEntries(slots.map(s => [s.slot, s]));
  const gear = gearFromSlots(slots);
  const Slot = ({ s }) => {
    if (!s) return <div style={{ height: 52 }} />;
    const tone = RARITY_TONE[s.tier.rarity] || RARITY_TONE.Common;
    const on = active === s.slot;
    return (
      <RarityCard as="button" type="button" rarity={s.tier.rarity} radius={10} particles={false} onClick={() => onSlot && onSlot(on ? null : s.slot)} aria-label={`${s.label}: ${s.theme} ${s.tier.roman}`} aria-pressed={on}
        style={{ width: 52, height: 52, cursor: 'pointer', outline: on ? `2px solid ${PAPER.ink}` : 'none', outlineOffset: 2 }}>
        <span style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <GearIcon slot={s.slot} color={tone.c} size={28} />
          <span className="lrpg-num" style={{ position: 'absolute', right: 4, bottom: 2, fontSize: 9, fontWeight: 800, color: tone.c }}>{s.tier.roman}</span>
        </span>
      </RarityCard>
    );
  };
  const sel = active && by[active];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 52px', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{left.map(k => <Slot key={k} s={by[k]} />)}</div>
        <div style={{ position: 'relative', height: 232, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="pf-glow" style={{ position: 'absolute', left: '50%', bottom: 18, width: 150, height: 150, marginLeft: -75, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,138,42,.28), transparent 65%)' }} />
          <div style={{ position: 'absolute', left: '50%', bottom: 6, width: 120, height: 16, marginLeft: -60, background: '#d8cdb8', borderRadius: '50%', boxShadow: 'inset 0 -3px 0 #c4b69c' }} />
          {aura && <AnyAuraArt id={aura} width={150} height={240} style={{ position: 'absolute', left: '50%', bottom: -4, marginLeft: -75 }} />}
          <div style={{ position: 'relative', marginBottom: 12 }}><HeroSprite gear={gear} height={190} /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{right.map(k => <Slot key={k} s={by[k]} />)}<div style={{ height: 52 }} /></div>
      </div>
      {sel && (
        <div className="pf-pop" style={{ marginTop: 10, background: RARITY_TONE[sel.tier.rarity].bg, border: `1px solid ${RARITY_TONE[sel.tier.rarity].c}55`, borderRadius: 12, padding: '9px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <GearIcon slot={sel.slot} color={RARITY_TONE[sel.tier.rarity].c} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lrpg-mono" style={{ fontSize: 8.5, color: RARITY_TONE[sel.tier.rarity].c }}>{sel.label} · {RARITY_TONE[sel.tier.rarity].ru}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{sel.theme} {sel.tier.roman}</div>
            <div style={{ fontSize: 12, color: PAPER.muted, marginTop: 1 }}>
              {sel.next ? `Растёт от «${sel.statLabel}»: ${sel.value} → ${sel.next.min} до уровня ${sel.next.roman}` : `«${sel.statLabel}» ${sel.value} — максимум`}
            </div>
          </div>
          {onInspect && <button type="button" className="lrpg-btn" onClick={() => onInspect(sel)} style={{ flexShrink: 0, minHeight: 36, padding: '6px 10px', borderRadius: 9, background: PAPER.ink, color: '#fbf9f4', border: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Осмотреть</button>}
        </div>
      )}
    </div>
  );
}

// ---------- Медаль достижения ----------
export function Medal({ kind, rarity = 'Common', locked, size = 54 }) {
  const tone = RARITY_TONE[rarity] || RARITY_TONE.Common;
  const c = locked ? '#b9b2a2' : tone.c;
  const rank = locked ? 0 : rarityRank(rarity);
  useRarityCss();
  return (
    <div className={rank >= 3 ? 'rf-float' + (rank >= 4 ? ' rf-holo' : '') : undefined} style={{ position: 'relative', width: size, height: size * 1.18, filter: rank >= 2 ? `drop-shadow(0 0 ${rank * 3}px ${tone.c}aa)` : 'none' }}>
      <svg width={size} height={size * 1.18} viewBox="0 0 22 26" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
        <rect x="5" y="0" width="5" height="9" fill={locked ? '#cfc8b8' : PAPER.terra} /><rect x="12" y="0" width="5" height="9" fill={locked ? '#bdb6a6' : PAPER.navy} />
        <rect x="3" y="8" width="16" height="16" fill={c} /><rect x="5" y="6" width="12" height="2" fill={c} /><rect x="5" y="24" width="12" height="2" fill={c} />
        <rect x="1" y="10" width="2" height="12" fill={c} /><rect x="19" y="10" width="2" height="12" fill={c} />
        <rect x="4" y="9" width="14" height="14" fill={locked ? '#e6e0d3' : '#fbf9f4'} opacity={locked ? 1 : 0.9} />
        <rect x="4" y="9" width="2" height="6" fill="#ffffff" opacity=".6" />
      </svg>
      <div style={{ position: 'absolute', left: '50%', top: size * 0.62, transform: 'translate(-50%, -50%)', opacity: locked ? 0.45 : 1 }}>
        <PixelIcon kind={kind} color={locked ? '#9a9384' : tone.c} size={Math.round(size * 0.34)} bg={locked ? '#e6e0d3' : '#fbf9f4'} />
      </div>
      {!locked && rarity !== 'Common' && <span className="pf-shine" style={{ borderRadius: '50%', top: '30%' }} />}
    </div>
  );
}

/** Доска медалей. items: [{ id, label, desc, rarity, kind, xp, coins, unlocked, cur, target }] */
export function AchievementBoard({ items, cats, cat, setCat }) {
  useProfileCss();
  const shown = items.filter(a => cat === 'all' || a.cat === cat)
    .sort((a, b) => (b.unlocked - a.unlocked) || ((b.cur / b.target) - (a.cur / a.target)));
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
        {cats.map(c => (
          <button key={c.key} className="lrpg-btn" onClick={() => setCat(c.key)} aria-pressed={cat === c.key} style={{
            flexShrink: 0, padding: '6px 11px', borderRadius: 99, fontSize: 12.5, fontWeight: 600,
            background: cat === c.key ? PAPER.ink : PAPER.card, color: cat === c.key ? PAPER.bg : PAPER.ink, border: `1px solid ${cat === c.key ? PAPER.ink : PAPER.line}`,
          }}>{c.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {shown.map((a, i) => {
          const tone = RARITY_TONE[a.rarity] || RARITY_TONE.Common;
          const pct = Math.max(0, Math.min(1, a.cur / a.target));
          return (
            <RarityCard key={a.id} rarity={a.rarity} theme={a.theme} limited={a.limited ? a.limited : undefined} locked={!a.unlocked} particles={a.unlocked} className="lrpg-stagger" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
            <div style={{ padding: '10px 6px 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Medal kind={a.kind} rarity={a.rarity} locked={!a.unlocked} size={42} />
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, marginTop: 5, color: a.unlocked ? PAPER.ink : '#6b6f7a', minHeight: 29, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.label}</div>
              <div style={{ fontSize: 10.5, color: PAPER.muted, lineHeight: 1.25, marginTop: 2, minHeight: 26 }}>{a.desc}</div>
              {a.unlocked ? (
                <span style={{ marginTop: 5 }}><RarityLabel rarity={a.rarity} size={7.5} /></span>
              ) : (
                <div style={{ width: '100%', marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 2, background: '#e2dbcc', overflow: 'hidden' }}><div style={{ width: `${pct * 100}%`, height: '100%', background: tone.c }} /></div>
                  <div className="lrpg-num" style={{ fontSize: 9.5, color: PAPER.muted, marginTop: 3 }}>{Math.min(a.cur, a.target)}/{a.target} · +{a.coins}</div>
                  <div className="lrpg-mono" style={{ fontSize: 7, color: tone.c, marginTop: 2 }}>{tone.ru}</div>
                </div>
              )}
            </div>
            </RarityCard>
          );
        })}
      </div>
    </div>
  );
}

/** Баннер «Достижение получено» сверху экрана. */
export function AchievementToast({ a, onDone, sound }) {
  useProfileCss(); useRarityCss();
  useEffect(() => {
    if (sound) sound('ACHIEVEMENT_UNLOCK');
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const tone = RARITY_TONE[a.rarity] || RARITY_TONE.Common;
  const rank = rarityRank(a.rarity);
  const ring = rank >= 4 ? 'conic-gradient(#7a5af0, #f07ad0, #f0b05a, #5ad0f0, #7a5af0)' : rank >= 3 ? 'conic-gradient(#a06a1a, #f6d08a, #fff6dc, #e0a83a, #a06a1a)' : null;
  const view = (
    <div className="pf-drop rf-card" role="status" onClick={onDone} style={{
      position: 'fixed', left: '50%', top: 'calc(14px + env(safe-area-inset-top, 0px))', zIndex: 220, width: 'min(360px, calc(100vw - 32px))', fontFamily: FONT,
      background: ring ? 'transparent' : '#1e2230', color: '#f2eee5', borderRadius: 16, padding: '10px 14px 10px 10px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: ring ? `0 14px 34px rgba(0,0,0,.35), 0 0 24px ${tone.c}aa` : `0 14px 34px rgba(0,0,0,.35), 0 0 0 2px ${tone.c}`, cursor: 'pointer', overflow: 'hidden',
    }}>
      {ring && <span className="rf-ring" aria-hidden="true"><i style={{ background: ring }} /></span>}
      {ring && <span className="rf-inner" aria-hidden="true" style={{ inset: 2, background: rank >= 4 ? 'linear-gradient(135deg, #231a40, #1e2230 60%, #2e1f3a)' : 'linear-gradient(135deg, #2e2418, #1e2230 60%, #2e2418)' }} />}
      {rank >= 2 && <span className="rf-shine" aria-hidden="true" style={{ inset: 2 }} />}
      <div className="pf-spin" style={{ perspective: 200 }}><Medal kind={a.kind} rarity={a.rarity} size={40} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lrpg-mono" style={{ fontSize: 8.5, color: '#f6d08a' }}>{a.limited ? `Лимит · ${a.limited}` : 'Достижение'} · <span className={rank >= 4 ? 'rf-holo-text' : rank >= 3 ? 'rf-gold-text' : ''}>{tone.ru}</span></div>
        <div className={rank >= 4 ? 'rf-holo-text' : rank >= 3 ? 'rf-gold-text' : ''} style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.2 }}>{a.label}</div>
        <div style={{ fontSize: 11.5, opacity: .75 }}>{a.desc}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {a.coins > 0 && <div className="lrpg-num" style={{ fontSize: 13, fontWeight: 800, color: '#f6d08a' }}>+{a.coins}</div>}
        <div className="lrpg-num" style={{ fontSize: 11, fontWeight: 700, color: '#e8a08a' }}>+{a.xp} XP</div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}

/** Плитка раздела профиля. */
export function SectionTile({ icon, color, title, note, onClick, wide, badge }) {
  return (
    <button type="button" className="lrpg-btn lrpg-paper" onClick={onClick} style={{
      gridColumn: wide ? '1 / -1' : 'auto', padding: '11px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, minHeight: 62, position: 'relative',
    }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: color + '1a', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PixelIcon kind={icon} color={color} size={18} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: PAPER.ink, lineHeight: 1.2 }}>{title}</span>
        {note && <span style={{ display: 'block', fontSize: 11.5, color: PAPER.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</span>}
      </span>
      {badge && <span className="lrpg-num" style={{ position: 'absolute', top: 7, right: 8, minWidth: 18, height: 18, borderRadius: 9, background: PAPER.terra, color: '#fbf9f4', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>}
    </button>
  );
}

/** Выбор титула (нижний лист). titles: [{ id, label, rarity }] */
export function TitleSheet({ titles, current, onPick, onClose }) {
  useProfileCss();
  const view = (
    <div role="dialog" aria-label="Выбор титула" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 215, background: 'rgba(30,34,48,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
      <div className="pf-pop" onClick={e => e.stopPropagation()} style={{ width: 'min(480px, 100%)', maxHeight: '70vh', overflowY: 'auto', background: PAPER.bg, borderRadius: '18px 18px 0 0', padding: '14px 16px calc(18px + env(safe-area-inset-bottom, 0px))', color: PAPER.ink }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: PAPER.line2, margin: '0 auto 10px' }} />
        <div className="lrpg-display" style={{ fontSize: 20, fontWeight: 700 }}>Титул героя</div>
        <div style={{ fontSize: 12.5, color: PAPER.muted, marginBottom: 10 }}>Титулы дают достижения. Выбранный виден на карточке и на главной.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="lrpg-btn" onClick={() => onPick(null)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: !current ? PAPER.ink : PAPER.card, color: !current ? PAPER.bg : PAPER.muted, border: `1px solid ${PAPER.line}`, fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Без титула</button>
          {[...titles].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity)).map(t => {
            const tone = RARITY_TONE[t.rarity] || RARITY_TONE.Common;
            const on = current === t.label;
            const big = rarityRank(t.rarity) >= 3;
            return (
              <button key={t.id} type="button" className="lrpg-btn" onClick={() => onPick(t.label)} aria-pressed={on} style={{ padding: '6px 4px 2px', borderRadius: 12, background: big ? '#16131f' : PAPER.card, border: `2px solid ${on ? tone.c : big ? '#2a2638' : PAPER.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'inherit', overflow: 'hidden' }}>
                <TitlePlate text={t.label} rarity={t.rarity} theme={t.theme} width={230} />
                <span className="lrpg-mono" style={{ fontSize: 8, color: on ? tone.c : big ? '#a49eb6' : PAPER.muted, margin: '-4px 0 4px' }}>{on ? '✓ выбран · ' : ''}{tone.ru}</span>
              </button>
            );
          })}
          {titles.length === 0 && <div style={{ fontSize: 13, color: PAPER.muted, padding: 8 }}>Пока нет титулов. Получи первое достижение!</div>}
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}
