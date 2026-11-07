// shopUI.jsx — «Лавка Веры»: пиксельный прилавок, ежедневная награда, товары, сундуки, колесо, чек покупки.
// Только отображение; покупки и начисления — в App.jsx.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PAPER } from './actionsUI.jsx';
import { NpcPortrait } from './councilUI.jsx';
import { RarityCard, RarityLabel, RarityBurst, RarityIcon, rarityRank, RARITY_META } from './rarityFX.jsx';
import { RevealCeremony, PremiumTile, ItemPreview } from './revealFX.jsx';

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
export const RAR = {
  Common: { c: '#7a7f8a', bg: '#eceae3', ru: 'Обычный' },
  Rare: { c: '#2f6b6e', bg: '#e1ecea', ru: 'Редкий' },
  Epic: { c: '#a83e66', bg: '#f2e1e7', ru: 'Эпический' },
  Legendary: { c: '#c48a2a', bg: '#f6ebd3', ru: 'Легендарный' },
  Mythic: { c: '#7a5af0', bg: '#f1ecff', ru: 'Мифический' },
};
const CSS = `
@keyframes shBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes shStamp { 0% { transform: scale(2.4) rotate(-20deg); opacity: 0; } 60% { transform: scale(.9) rotate(-9deg); opacity: 1; } 100% { transform: scale(1) rotate(-9deg); opacity: 1; } }
@keyframes shPrint { from { transform: translateY(-40px); clip-path: inset(0 0 100% 0); } to { transform: none; clip-path: inset(0 0 0 0); } }
@keyframes shShake { 0%,100% { transform: rotate(0); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(7deg); } 60% { transform: rotate(-5deg); } 80% { transform: rotate(3deg); } }
@keyframes shPop { 0% { opacity: 0; transform: scale(.7) translateY(10px); } 100% { opacity: 1; transform: none; } }
@keyframes shRays { to { transform: rotate(360deg); } }
@keyframes shPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(196,138,42,.45); } 50% { box-shadow: 0 0 0 7px rgba(196,138,42,0); } }
@keyframes shSign { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
.sh-bob { animation: shBob 1.6s steps(2) infinite; }
.sh-stamp { animation: shStamp .5s cubic-bezier(.2,1.4,.3,1) .55s both; }
.sh-print { animation: shPrint .55s cubic-bezier(.2,.9,.3,1) both; }
.sh-shake { animation: shShake .6s ease-in-out infinite; }
.sh-pop { animation: shPop .4s cubic-bezier(.2,1.3,.3,1) both; }
.sh-rays { animation: shRays 10s linear infinite; }
.sh-pulse { animation: shPulse 1.8s ease-in-out infinite; }
.sh-sign { animation: shSign 3s ease-in-out infinite; transform-origin: 50% 0; transform-box: fill-box; }
@media (prefers-reduced-motion: reduce) { .sh-bob,.sh-shake,.sh-rays,.sh-pulse,.sh-sign { animation: none; } }
`;
let injected = false;
export function useShopCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

/** Прилавок: полки с товарами, вывеска, Вера за стойкой и её реплика. */
export function ShopScene({ line, night, featured }) {
  useShopCss();
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 200 92" shapeRendering="crispEdges" role="img" aria-label="Лавка Веры" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <rect width="200" height="92" fill={night ? '#3a3046' : '#d8cdb8'} />
        <g fill={night ? '#44384f' : '#cfc2a8'}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <rect key={i} x={i * 20} y="0" width="1" height="62" />)}</g>
        {/* вывеска */}
        <rect x="20" y="0" width="1" height="8" fill="#5a3826" /><rect x="60" y="0" width="1" height="8" fill="#5a3826" />
        <g className="sh-sign"><rect x="16" y="8" width="50" height="14" fill="#8a5a3a" /><rect x="18" y="10" width="46" height="10" fill="#c48a2a" />
          <text x="41" y="18" textAnchor="middle" fontSize="7" fontWeight="800" fill="#3a2418" fontFamily="JetBrains Mono, monospace">ЛАВКА</text></g>
        {/* полки */}
        {[26, 44].map(y => <rect key={y} x="110" y={y} width="84" height="3" fill="#7c5a3e" />)}
        {[[114, 18, '#a83e66'], [126, 16, '#2f6b6e'], [138, 20, '#c48a2a'], [152, 17, '#4a6a9a'], [166, 19, '#a4412a'], [180, 16, '#3f7a4a'],
          [116, 36, '#c48a2a'], [130, 37, '#7a5a8a'], [146, 35, '#2f6b6e'], [160, 36, '#a83e66'], [176, 38, '#c48a2a']].map(([x, y, c], i) => (
          <g key={i}><rect x={x} y={y + (i < 6 ? 0 : 0)} width="8" height={(i < 6 ? 26 : 44) - y} fill={c} /><rect x={x} y={y} width="8" height="2" fill="#ffffff" opacity=".3" /></g>
        ))}
        {/* хит дня на подставке */}
        <rect x="76" y="44" width="22" height="3" fill="#7c5a3e" />
        <rect className="sh-bob" x="82" y="32" width="10" height="11" fill={featured ? '#a83e66' : '#c48a2a'} />
        <rect x="84" y="34" width="3" height="3" fill="#ffffff" opacity=".45" />
        {/* прилавок */}
        <rect x="0" y="62" width="200" height="30" fill={night ? '#5a4636' : '#9a7452'} />
        <rect x="0" y="62" width="200" height="4" fill={night ? '#6a5240' : '#b48a62'} />
        <rect x="0" y="66" width="200" height="1" fill="#5a3826" />
        <g fill={night ? '#4a3a2c' : '#86623f'}>{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={10 + i * 34} y="72" width="24" height="14" />)}</g>
        {/* весы и монеты */}
        <rect x="150" y="54" width="2" height="8" fill="#5a4636" /><rect x="140" y="54" width="22" height="2" fill="#5a4636" />
        <rect x="139" y="56" width="6" height="2" fill="#c48a2a" /><rect x="157" y="56" width="6" height="2" fill="#c48a2a" />
        <g fill="#e0a83a"><rect x="168" y="58" width="8" height="2" /><rect x="168" y="56" width="8" height="2" /><rect x="170" y="54" width="8" height="2" /></g>
      </svg>
      <div style={{ position: 'absolute', left: '33%', bottom: '30%', transform: 'translateX(-50%)' }}>
        <NpcPortrait id="vera" size={56} talking={!!line} bg="transparent" />
      </div>
      {line && (
        <div className="sh-pop" style={{ position: 'absolute', left: '44%', top: 8, right: 8, background: '#fbf9f4', border: `1px solid ${PAPER.line2}`, borderRadius: 12, padding: '6px 9px', fontSize: 12, lineHeight: 1.3, color: PAPER.ink, boxShadow: '0 3px 0 rgba(0,0,0,.06)', maxWidth: 220 }}>
          <span className="lrpg-mono" style={{ fontSize: 8, color: PAPER.berry, display: 'block' }}>Вера</span>{line}
        </div>
      )}
    </div>
  );
}

/** Полоса ежедневной награды: 7 дней. table: [{ kind, amount }] */
export function DailyLoginStrip({ streak, claimedToday, table, onClaim }) {
  useShopCss();
  const day = claimedToday ? ((Math.max(1, streak) - 1) % 7) + 1 : (streak % 7) + 1;
  const label = (r) => (r.kind === 'coins' ? `${r.amount}` : r.kind === 'ticket' ? 'билет' : `${r.amount} кр.`);
  const color = (r) => (r.kind === 'coins' ? PAPER.mustard : r.kind === 'ticket' ? PAPER.teal : PAPER.berry);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {table.map((r, i) => {
          const d = i + 1;
          const done = claimedToday ? d <= day : d < day;
          const now = d === day;
          return (
            <div key={d} className={now && !claimedToday ? 'sh-pulse' : undefined} style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 8, background: done ? color(r) + '22' : now ? '#fbf3e0' : PAPER.alt, border: `1.5px solid ${now ? color(r) : done ? color(r) + '55' : PAPER.line}` }}>
              <div className="lrpg-mono" style={{ fontSize: 7, color: PAPER.muted }}>д{d}</div>
              <div className="lrpg-num" style={{ fontSize: 11, fontWeight: 800, color: done || now ? color(r) : PAPER.muted, lineHeight: 1.2 }}>{done ? '✓' : label(r)}</div>
            </div>
          );
        })}
      </div>
      <button className="lrpg-btn" disabled={claimedToday} onClick={onClaim} style={{ marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, background: claimedToday ? PAPER.alt : PAPER.mustard, color: claimedToday ? PAPER.muted : '#fbf9f4', border: claimedToday ? `1px solid ${PAPER.line}` : 'none', boxShadow: claimedToday ? 'none' : '0 3px 0 #8a5a1a' }}>
        {claimedToday ? `Забрано · серия ${streak} дн. Возвращайся завтра` : `Забрать награду дня ${day}`}
      </button>
    </div>
  );
}

/** Карточка товара витрины. */
export function ItemTile({ it, owned, afford, onBuy, big }) {
  const r = RAR[it.rarity] || RAR.Common;
  const rank = rarityRank(it.rarity);
  const price = it.currency === 'crystals' ? `${it.cost} кр.` : `${it.cost}`;
  // Легендарки и мифы — премиальная сцена темы с живыми частицами и картой по тапу.
  if (rank >= 3) return <PremiumTile rarity={it.rarity} theme={it.theme} title={it.title} desc={it.effect || it.lore} limited={it.limited} badge={it.featured ? 'хит дня' : null}
    preview={<ItemPreview art={it.id} icon={it.icon} theme={it.theme} rarity={it.rarity} size={104} />} price={it.currency === 'crystals' ? `${it.cost} кристаллов` : `${it.cost} монет`}
    owned={owned} can={afford} onBuy={onBuy} card={{ ...it, art: it.id }} />;
  return (
    <RarityCard rarity={it.rarity} theme={it.theme} limited={it.limited} className="sh-pop" style={{ gridColumn: big ? '1 / -1' : 'auto' }}>
      <div style={{ padding: big ? 12 : 10, display: 'flex', flexDirection: big ? 'row' : 'column', gap: big ? 12 : 8, alignItems: big ? 'center' : 'stretch', position: 'relative' }}>
        {it.featured && <span className="lrpg-mono" style={{ position: 'absolute', top: -2, left: 10, background: r.c, color: '#fbf9f4', fontSize: 8, padding: '2px 6px', borderRadius: 4, zIndex: 2 }}>хит дня</span>}
        <span style={{ alignSelf: big ? 'center' : 'stretch', display: 'flex', justifyContent: 'center' }}><RarityIcon rarity={it.rarity} theme={it.theme} art={it.id} size={big ? 84 : 64}>{it.icon}</RarityIcon></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: big ? 16 : 13, fontWeight: 700, lineHeight: 1.2 }}>{it.title}</div>
          <div style={{ marginTop: 2 }}><RarityLabel rarity={it.rarity} size={8} /></div>
          {(it.effect || it.lore) && <div style={{ fontSize: 11, color: PAPER.muted, marginTop: 3, lineHeight: 1.3, fontStyle: rank >= 3 ? 'italic' : 'normal' }}>{it.effect || it.lore}</div>}
          <button className="lrpg-btn" disabled={owned || !afford} onClick={onBuy} style={{ marginTop: 8, width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, background: owned ? PAPER.alt : afford ? (it.currency === 'crystals' ? PAPER.berry : PAPER.mustard) : PAPER.alt, color: owned || !afford ? PAPER.muted : '#fbf9f4', border: owned || !afford ? `1px solid ${PAPER.line}` : 'none', position: 'relative', zIndex: 2 }}>
            {owned ? 'Уже в коллекции' : price + (it.currency === 'crystals' ? '' : ' монет')}
          </button>
        </div>
      </div>
    </RarityCard>
  );
}

/** Пиксельный сундук для витрины сундуков. */
export function MiniChest({ tier = 'wood', size = 64, shaking }) {
  const p = tier === 'epic' ? ['#5a3f6a', '#7a5a8a', '#e8c48a'] : tier === 'iron' ? ['#5a6470', '#7a848d', '#c9d4d8'] : ['#8a5a3a', '#a06a44', '#c48a2a'];
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 20 16" shapeRendering="crispEdges" className={shaking ? 'sh-shake' : 'sh-bob'} aria-hidden="true" style={{ display: 'block' }}>
      <rect x="1" y="15" width="18" height="1" fill="#000" opacity=".2" />
      <rect x="2" y="7" width="16" height="8" fill={p[0]} /><rect x="2" y="7" width="16" height="1" fill={p[1]} />
      <rect x="2" y="11" width="16" height="1" fill={p[2]} /><rect x="2" y="7" width="1" height="8" fill={p[2]} /><rect x="17" y="7" width="1" height="8" fill={p[2]} />
      <rect x="1" y="3" width="18" height="4" fill={p[1]} /><rect x="3" y="2" width="14" height="1" fill={p[1]} />
      <rect x="1" y="3" width="18" height="1" fill={p[2]} /><rect x="1" y="6" width="18" height="1" fill={p[2]} />
      <rect x="9" y="8" width="2" height="3" fill="#f6e3b0" />
      {tier === 'epic' && <><rect x="5" y="4" width="1" height="1" fill="#fff3c4" /><rect x="14" y="9" width="1" height="1" fill="#fff3c4" /></>}
    </svg>
  );
}

/** Чек покупки реальной награды: печатается и получает печать «ОПЛАЧЕНО». */
export function ReceiptModal({ reward, coinsLeft, onClose, sound }) {
  useShopCss();
  useEffect(() => { if (sound) { sound('PURCHASE'); const t = setTimeout(() => sound('ITEM_PLACE'), 600); return () => clearTimeout(t); } return undefined; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const now = new Date();
  const view = (
    <div role="dialog" aria-label="Чек" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 215, background: 'rgba(30,34,48,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(300px, 100%)' }}>
        <div className="sh-print" style={{ position: 'relative', background: '#fbf9f4', padding: '18px 18px 22px', color: PAPER.ink, boxShadow: '0 16px 40px rgba(0,0,0,.35)', backgroundImage: 'radial-gradient(circle at 8px 100%, transparent 6px, #fbf9f4 6.5px)', backgroundSize: '16px 100%' }}>
          <div className="lrpg-mono" style={{ fontSize: 9, textAlign: 'center', color: PAPER.muted }}>Лавка Веры · чек</div>
          <div className="lrpg-mono" style={{ fontSize: 8, textAlign: 'center', color: PAPER.muted }}>{now.toLocaleDateString('ru-RU')} {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ borderTop: `1px dashed ${PAPER.line2}`, margin: '10px 0' }} />
          <div style={{ fontSize: 34, textAlign: 'center' }}>{reward.icon || '🎁'}</div>
          <div style={{ fontSize: 17, fontWeight: 800, textAlign: 'center', marginTop: 4 }}>{reward.title}</div>
          <div style={{ borderTop: `1px dashed ${PAPER.line2}`, margin: '10px 0' }} />
          <div className="lrpg-num" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Цена</span><b>{reward.cost} монет</b></div>
          <div className="lrpg-num" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 3, color: PAPER.muted }}><span>Осталось</span><span>{coinsLeft}</span></div>
          <div style={{ fontSize: 12.5, textAlign: 'center', marginTop: 12, lineHeight: 1.4 }}>Заработано честно. Наслаждайся без чувства вины!</div>
          <div className="sh-stamp" style={{ position: 'absolute', right: 14, top: 64, border: `3px solid ${PAPER.terra}`, color: PAPER.terra, borderRadius: 6, padding: '3px 8px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 14, letterSpacing: '.12em', opacity: .85 }}>ОПЛАЧЕНО</div>
        </div>
        <button className="lrpg-btn" onClick={onClose} style={{ marginTop: 14, width: '100%', padding: '12px 0', borderRadius: 12, background: PAPER.terra, color: '#fbf9f4', border: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 3px 0 #7a2e1c', fontFamily: 'inherit' }}>Отлично</button>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}

/** Окно приза (колесо/сундук). */
export function PrizeModal({ title, icon, rarity, sub, onClose, chest, theme, art, lore, sound = true }) {
  useShopCss();
  const r = RAR[rarity] || RAR.Rare;
  const [phase, setPhase] = useState(chest ? 'shake' : 'open');
  useEffect(() => { if (!chest) return undefined; const t = setTimeout(() => setPhase('open'), 900); return () => clearTimeout(t); }, [chest]);
  // Раскрытие — общая церемония: у легендарных и мифических свой сценарий темы и музыка.
  if (phase === 'open') return <RevealCeremony item={{ title, icon, rarity: rarity || 'Rare', theme, art, sub, lore }} sound={sound} onClose={onClose} />;
  const view = (
    <div role="dialog" aria-label="Приз" onClick={phase === 'open' ? onClose : undefined} style={{ position: 'fixed', inset: 0, zIndex: 215, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT, overflow: 'hidden' }}>
      <div className="ag-scrim" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, #3d3a5a 0%, #1e2230 62%, #12141c 100%)' }} />
      {phase === 'open' && <RarityBurst rarity={rarity || 'Rare'} />}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', textAlign: 'center', color: '#f2eee5', width: 'min(320px, 100%)' }}>
        {phase === 'shake' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}><MiniChest tier={chest} size={150} shaking /></div>
            <div className="lrpg-mono" style={{ fontSize: 10, color: '#f6d08a', marginTop: 10 }}>Открываю…</div>
          </>
        ) : (
          <>
            <div className="lrpg-mono" style={{ fontSize: 10, color: '#f6d08a' }}>{sub || 'Твой приз'}</div>
            <div className="sh-pop" style={{ margin: '12px auto', width: 140, display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 0 ${8 + rarityRank(rarity) * 8}px ${r.c}aa)` }}><RarityIcon rarity={rarity || 'Rare'} theme={theme} art={art} size={140}>{icon || '🎁'}</RarityIcon></div>
            <div className={'lrpg-display' + (rarity === 'Legendary' ? ' rf-gold-text' : rarity === 'Mythic' ? ' rf-holo-text' : '')} style={{ fontSize: 24, fontWeight: 700 }}>{title}</div>
            {rarity && <div style={{ marginTop: 4 }}><RarityLabel rarity={rarity} size={9} dark style={{ color: rarity === 'Common' ? '#cfc8b8' : undefined }} /></div>}
            <button className="lrpg-btn" onClick={onClose} style={{ marginTop: 18, padding: '12px 34px', borderRadius: 12, background: PAPER.terra, color: '#fbf9f4', border: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 3px 0 #7a2e1c', fontFamily: 'inherit' }}>Забрать</button>
          </>
        )}
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}
