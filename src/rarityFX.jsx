// rarityFX.jsx — единая система редкости: Обычный → Редкий → Эпический → Легендарный → Мифический (+ Лимит).
// Чем выше редкость, тем богаче рамка, свечение, частицы и церемония открытия.
import React from 'react';

export const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
export const RARITY_META = {
  Common: { ru: 'Обычный', c: '#7a7f8a', c2: '#a9a59c', bg: '#f4f1ea', ink: '#1e2230' },
  Rare: { ru: 'Редкий', c: '#2f6b6e', c2: '#5fa3a6', bg: '#e6f0ee', ink: '#1e2230' },
  Epic: { ru: 'Эпический', c: '#a83e66', c2: '#d6709a', bg: '#f6e4ec', ink: '#1e2230' },
  Legendary: { ru: 'Легендарный', c: '#c48a2a', c2: '#f6d08a', bg: '#fbf0d6', ink: '#3a2418' },
  Mythic: { ru: 'Мифический', c: '#7a5af0', c2: '#f07ad0', bg: '#f1ecff', ink: '#231a40' },
};
export const rarityRank = (r) => Math.max(0, RARITY_ORDER.indexOf(r));
export const rarityMeta = (r) => RARITY_META[r] || RARITY_META.Common;

// Темы легендарных/мифических вещей: цвет частиц и фон-подложка.
export const RARITY_THEMES = {
  gold: { p: ['#f6d08a', '#e0a83a', '#fff3c4'], bg: 'radial-gradient(120% 90% at 50% 0%, #fff6dc 0%, #fbf0d6 55%, #f3e2b8 100%)' },
  fire: { p: ['#ff9a3a', '#ffcf5a', '#e2502a'], bg: 'radial-gradient(120% 90% at 50% 110%, #ffd9b0 0%, #fbeee0 55%, #fff6ec 100%)' },
  void: { p: ['#b58cff', '#7a5af0', '#e9dcff'], bg: 'radial-gradient(120% 90% at 50% 0%, #efe6ff 0%, #e6dcff 50%, #d8ccf6 100%)' },
  frost: { p: ['#bfe8ff', '#ffffff', '#7ac7f0'], bg: 'radial-gradient(120% 90% at 50% 0%, #f2fbff 0%, #e2f3fb 60%, #d3ebf6 100%)' },
  nature: { p: ['#9fd07a', '#f6e38a', '#5fa35a'], bg: 'radial-gradient(120% 90% at 50% 100%, #e4f3d6 0%, #f1f7e8 60%, #fbfbf2 100%)' },
  autumn: { p: ['#e2702a', '#f6b04a', '#a4412a'], bg: 'radial-gradient(120% 90% at 50% 0%, #fde6cf 0%, #fbeee0 60%, #f7e2c8 100%)' },
  holo: { p: ['#7a5af0', '#f07ad0', '#5ad0f0', '#f0e05a'], bg: 'linear-gradient(135deg, #f6f0ff 0%, #ffeefa 35%, #eefbff 70%, #fffbe8 100%)' },
};

const CSS = `
@keyframes rfSpin { to { transform: rotate(360deg); } }
@keyframes rfShine { 0% { transform: translateX(-140%) skewX(-22deg); } 55%,100% { transform: translateX(260%) skewX(-22deg); } }
@keyframes rfTwinkle { 0%,100% { opacity: 0; transform: scale(.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes rfEmber { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx, 0px), -70px) scale(.4); } }
@keyframes rfPulse { 0%,100% { box-shadow: 0 0 0 0 var(--g), 0 6px 18px -6px var(--g); } 50% { box-shadow: 0 0 14px 2px var(--g), 0 10px 26px -6px var(--g); } }
@keyframes rfHolo { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
@keyframes rfHoloSlide { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes rfRays { to { transform: rotate(360deg); } }
@keyframes rfBanner { 0% { opacity: 0; transform: scale(2.6); letter-spacing: .6em; } 60% { opacity: 1; transform: scale(.94); } 100% { opacity: 1; transform: scale(1); letter-spacing: .18em; } }
@keyframes rfFlash { 0% { opacity: .95; } 100% { opacity: 0; } }
@keyframes rfTextShine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes rfFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.rf-card { position: relative; isolation: isolate; }
.rf-ring { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; z-index: -2; }
.rf-ring > i { position: absolute; left: 50%; top: 50%; width: 220%; aspect-ratio: 1; margin-left: -110%; margin-top: -110%; animation: rfSpin 4s linear infinite; }
.rf-inner { position: absolute; border-radius: inherit; z-index: -1; }
.rf-shine { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; z-index: 2; }
.rf-shine::after { content: ''; position: absolute; top: 0; bottom: 0; width: 38%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); animation: rfShine 3.4s ease-in-out infinite; }
.rf-twinkle { position: absolute; width: 6px; height: 6px; pointer-events: none; z-index: 3; animation: rfTwinkle 1.9s ease-in-out infinite; }
.rf-twinkle::before, .rf-twinkle::after { content: ''; position: absolute; left: 50%; top: 50%; background: currentColor; }
.rf-twinkle::before { width: 6px; height: 2px; margin: -1px 0 0 -3px; }
.rf-twinkle::after { width: 2px; height: 6px; margin: -3px 0 0 -1px; }
.rf-ember { position: absolute; bottom: 4px; width: 4px; height: 4px; pointer-events: none; z-index: 3; animation: rfEmber 2.6s ease-out infinite; }
.rf-pulse { animation: rfPulse 2.4s ease-in-out infinite; }
.rf-holo { animation: rfHolo 6s linear infinite; }
.rf-holo-text { background: linear-gradient(90deg, #7a5af0, #f07ad0, #5ad0f0, #f0b05a, #7a5af0); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: rfHoloSlide 3s linear infinite; }
.rf-gold-ink { background: linear-gradient(90deg, #7a4a10 0%, #b07a1a 40%, #e0a83a 50%, #b07a1a 60%, #7a4a10 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: rfTextShine 2.6s linear infinite; }
.rf-holo-ink { background: linear-gradient(90deg, #5a3ad0, #c04aa0, #2a90b0, #b07a1a, #5a3ad0); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: rfHoloSlide 3s linear infinite; }
.rf-gold-text { background: linear-gradient(90deg, #a06a1a 0%, #f6d08a 40%, #fff6dc 50%, #f6d08a 60%, #a06a1a 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: rfTextShine 2.6s linear infinite; }
.rf-float { animation: rfFloat 2.2s ease-in-out infinite; }
.rf-rays { animation: rfRays 14s linear infinite; }
.rf-banner { animation: rfBanner .9s cubic-bezier(.2,1.2,.3,1) both; }
.rf-flash { animation: rfFlash .8s ease-out both; }
@media (prefers-reduced-motion: reduce) { .rf-ring > i, .rf-shine::after, .rf-twinkle, .rf-ember, .rf-pulse, .rf-holo, .rf-holo-text, .rf-gold-text, .rf-gold-ink, .rf-holo-ink, .rf-float, .rf-rays { animation: none !important; } }
body.lrpg-calm .rf-ember, body.lrpg-calm .rf-twinkle { display: none; }
`;
let injected = false;
export function useRarityCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

function ringGradient(r) {
  if (r === 'Mythic') return 'conic-gradient(#7a5af0, #f07ad0, #f0b05a, #5ad0f0, #7a5af0)';
  if (r === 'Legendary') return 'conic-gradient(#a06a1a, #f6d08a, #fff6dc, #e0a83a, #a06a1a, #f6d08a, #a06a1a)';
  return null;
}

// Пиксельные уголки-оправа для легендарных и мифических.
function Corners({ color }) {
  const s = { position: 'absolute', width: 10, height: 10, zIndex: 3, pointerEvents: 'none' };
  const px = (rot, pos) => (
    <svg key={rot} viewBox="0 0 5 5" shapeRendering="crispEdges" style={{ ...s, ...pos, transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <rect x="0" y="0" width="5" height="1" fill={color} /><rect x="0" y="0" width="1" height="5" fill={color} /><rect x="1" y="1" width="1" height="1" fill="#fff6dc" />
    </svg>
  );
  return <>{px(0, { left: 3, top: 3 })}{px(90, { right: 3, top: 3 })}{px(180, { right: 3, bottom: 3 })}{px(270, { left: 3, bottom: 3 })}</>;
}

/**
 * Карточка с оформлением по редкости.
 * rarity, theme (для Legendary/Mythic), limited (строка, напр. «Ноябрь 2026»), radius, as ('div'|'button'), остальное — пропсы элемента.
 */
export function RarityCard({ rarity = 'Common', theme, limited, radius = 14, as = 'div', style, children, locked, particles = true, className, ...rest }) {
  useRarityCss();
  const r = locked ? 'Common' : rarity;
  const m = rarityMeta(r);
  const rank = rarityRank(r);
  const th = RARITY_THEMES[theme || (r === 'Mythic' ? 'holo' : r === 'Legendary' ? 'gold' : '')] || null;
  const Tag = as;
  const ring = ringGradient(r);
  const border = rank >= 3 ? 2 : rank >= 1 ? 2 : 1;
  const inner = th && rank >= 3 ? th.bg : rank === 2 ? `linear-gradient(160deg, #fff 0%, ${m.bg} 70%)` : rank === 1 ? `linear-gradient(160deg, #fbf9f4 0%, ${m.bg} 100%)` : (locked ? '#f6f2e9' : '#fbf9f4');
  const pColors = th ? th.p : [m.c2, m.c];
  return (
    <Tag {...rest} className={'rf-card' + (rank >= 2 && !locked ? ' rf-pulse' : '') + (className ? ' ' + className : '')}
      style={{ borderRadius: radius, padding: 0, border: 'none', background: 'transparent', overflow: 'hidden', '--g': m.c + (rank >= 3 ? '88' : '55'), ...style }}>
      {ring ? (
        <span className="rf-ring" aria-hidden="true"><i style={{ background: ring }} /></span>
      ) : (
        <span className="rf-ring" aria-hidden="true" style={{ background: locked ? '#e2dbcc' : rank === 0 ? '#e2dbcc' : m.c }} />
      )}
      <span className={'rf-inner' + (r === 'Mythic' && !locked ? ' rf-holo' : '')} aria-hidden="true" style={{ inset: border, background: inner }} />
      {r === 'Mythic' && !locked && <span className="rf-inner" aria-hidden="true" style={{ inset: border, background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,.55) 35%, transparent 50%, rgba(240,122,208,.18) 65%, transparent 80%)', mixBlendMode: 'soft-light', zIndex: -1 }} />}
      {rank === 1 && !locked && (
        <svg viewBox="0 0 4 4" shapeRendering="crispEdges" aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, zIndex: 3 }}><rect x="1" y="0" width="2" height="4" fill={m.c2} /><rect x="0" y="1" width="4" height="2" fill={m.c2} /><rect x="1" y="1" width="1" height="1" fill="#fff" /></svg>
      )}
      {rank >= 2 && !locked && <span className="rf-shine" aria-hidden="true" style={{ inset: border }} />}
      {rank >= 2 && !locked && particles && [[12, 16], [78, 10], [88, 62], [8, 70]].slice(0, rank === 2 ? 2 : 4).map(([x, y], i) => (
        <span key={i} className="rf-twinkle" aria-hidden="true" style={{ left: x + '%', top: y + '%', color: pColors[i % pColors.length], animationDelay: `${-i * 0.55}s` }} />
      ))}
      {rank >= 3 && !locked && particles && [14, 32, 50, 68, 86].map((x, i) => (
        <span key={'e' + i} className="rf-ember" aria-hidden="true" style={{ left: x + '%', background: pColors[i % pColors.length], '--dx': `${(i % 2 ? 1 : -1) * (6 + i * 2)}px`, animationDelay: `${-i * 0.52}s`, boxShadow: `0 0 6px ${pColors[i % pColors.length]}` }} />
      ))}
      {rank >= 3 && !locked && <Corners color={r === 'Mythic' ? '#7a5af0' : '#a06a1a'} />}
      {limited && (
        <span aria-label={`Лимитированный: ${limited}`} style={{ position: 'absolute', top: 8, right: -26, zIndex: 4, transform: 'rotate(38deg)', background: '#1e2230', color: '#f6d08a', fontFamily: "'JetBrains Mono', monospace", fontSize: 7.5, fontWeight: 800, letterSpacing: '.12em', padding: '2px 26px', boxShadow: '0 2px 4px rgba(0,0,0,.25)', pointerEvents: 'none' }}>ЛИМИТ</span>
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'block', borderRadius: radius, color: m.ink }}>{children}</span>
    </Tag>
  );
}

/** Подпись редкости: у легендарного — золотой блик, у мифического — радужный перелив. */
export function RarityLabel({ rarity = 'Common', limited, size = 8.5, style, dark }) {
  useRarityCss();
  const m = rarityMeta(rarity);
  const cls = rarity === 'Mythic' ? (dark ? 'rf-holo-text' : 'rf-holo-ink') : rarity === 'Legendary' ? (dark ? 'rf-gold-text' : 'rf-gold-ink') : '';
  return (
    <span className="lrpg-mono" style={{ fontSize: size, fontWeight: 800, color: m.c, display: 'inline-flex', alignItems: 'center', gap: 5, ...style }}>
      <span className={cls}>{m.ru}</span>
      {limited && <span style={{ background: '#1e2230', color: '#f6d08a', borderRadius: 3, padding: '1px 4px', fontSize: size - 1 }}>лимит · {limited}</span>}
    </span>
  );
}

/**
 * Фон церемонии открытия по редкости: лучи, вспышка, частицы, баннер «ЛЕГЕНДАРНЫЙ!».
 * Рендерится внутри полноэкранного оверлея (position: relative контейнер).
 */
export function RarityBurst({ rarity = 'Rare', banner = true }) {
  useRarityCss();
  const m = rarityMeta(rarity);
  const rank = rarityRank(rarity);
  const rays = rank >= 4 ? 'repeating-conic-gradient(from 0deg, rgba(122,90,240,.45) 0deg 6deg, rgba(240,122,208,.35) 6deg 12deg, transparent 12deg 20deg)'
    : `repeating-conic-gradient(from 0deg, ${m.c}${rank >= 3 ? '77' : '44'} 0deg ${rank >= 3 ? 7 : 9}deg, transparent ${rank >= 3 ? 7 : 9}deg ${rank >= 3 ? 18 : 24}deg)`;
  const n = [6, 10, 18, 30, 40][rank];
  const cols = rank >= 4 ? ['#7a5af0', '#f07ad0', '#5ad0f0', '#f0e05a'] : rank >= 3 ? ['#f6d08a', '#e0a83a', '#fff3c4'] : [m.c, m.c2, '#fbf9f4'];
  return (
    <>
      <div aria-hidden="true" className={'rf-rays' + (rank >= 4 ? ' rf-holo' : '')} style={{ position: 'absolute', left: '50%', top: '42%', width: 760, height: 760, marginLeft: -380, marginTop: -380, borderRadius: '50%', opacity: rank >= 3 ? .7 : .45, background: rays, WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', pointerEvents: 'none' }} />
      {rank >= 3 && <div aria-hidden="true" className="rf-flash" style={{ position: 'absolute', inset: 0, background: rank >= 4 ? 'radial-gradient(circle, #fff 0%, #f0e8ff 40%, transparent 75%)' : 'radial-gradient(circle, #fff6dc 0%, #f6d08a 35%, transparent 75%)', pointerEvents: 'none' }} />}
      {Array.from({ length: n }, (_, i) => (
        <span key={i} aria-hidden="true" className="rf-ember" style={{ position: 'absolute', bottom: `${10 + (i * 37) % 60}%`, left: `${(i * 53) % 100}%`, width: rank >= 3 ? 5 : 4, height: rank >= 3 ? 5 : 4, background: cols[i % cols.length], boxShadow: `0 0 8px ${cols[i % cols.length]}`, '--dx': `${((i % 5) - 2) * 10}px`, animationDuration: `${2 + (i % 4) * 0.5}s`, animationDelay: `${-(i * 0.23)}s` }} />
      ))}
      {banner && rank >= 3 && (
        <div aria-hidden="true" className="rf-banner" style={{ position: 'absolute', top: '11%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <span className={rank >= 4 ? 'rf-holo-text' : 'rf-gold-text'} style={{ fontFamily: "'Fraunces', 'Lora', Georgia, serif", fontSize: 30, fontWeight: 800, letterSpacing: '.18em' }}>{rank >= 4 ? 'МИФИЧЕСКИЙ!' : 'ЛЕГЕНДАРНЫЙ!'}</span>
        </div>
      )}
    </>
  );
}

/** Значок предмета в рамке редкости (для сеток коллекций, миниатюр). */
export function RarityIcon({ rarity = 'Common', theme, size = 56, children, locked, limited }) {
  return (
    <RarityCard rarity={rarity} theme={theme} radius={12} locked={locked} limited={limited} particles={size >= 52} style={{ width: size, height: size, display: 'block' }}>
      <span className={rarityRank(rarity) >= 3 && !locked ? 'rf-float' : undefined} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, filter: locked ? 'grayscale(1) opacity(.35)' : 'none' }}>{children}</span>
    </RarityCard>
  );
}
