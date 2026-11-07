// revealFX.jsx — премиальные редкости в духе мифических скинов:
// коллекционная карта (CollectibleCard), табличка титула (TitlePlate), церемония раскрытия (RevealCeremony)
// и звуковой движок раскрытия (revealSfx). У каждой темы — своя рамка, крылья, герб, частицы, сценарий и музыка.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ItemArt, hasItemArt } from './artFX.jsx';
import { RarityIcon, RarityLabel, rarityRank, rarityMeta } from './rarityFX.jsx';

// ---------- Темы ----------
const NATURE = { ru: 'Природа', c1: '#8fd06a', c2: '#1a3a12', c3: '#f6e38a', pal: ['#e8f5c0', '#8fd06a', '#f6e38a', '#ff9ac0'], frame: ['#1a3a12', '#e8f5c0', '#4a8a3a', '#f6e38a', '#1a3a12'], line: '#f6e38a', gem: ['#fff4f8', '#ff7ab0', '#6a1a3a'], plate: '#0e1e0a', bg: 'radial-gradient(circle at 50% 70%, #4a8a3a, #1a3a12 55%, #060f04)', wing: 'leaf', wingFill: ['#e8f5c0', '#8fd06a', '#3a6a2a'], wingStroke: '#2a4a1a', crest: 'flower', orbit: 'butterfly', burst: 'bloom', back: 'seed', charge: 'crack', crack: '#b8f07a', shard: ['#3a2a10', '#b8f07a'], ink: 'nature', sound: 'nature', rays: 'rgba(200,240,140,.45)', backBg: 'radial-gradient(circle at 50% 45%, #2a4a1a, #060f04 72%)' };
export const FAMILIES = {
  holy: { ru: 'Небесный', c1: '#f2c45a', c2: '#5a3810', c3: '#a06a1a', pal: ['#fff4d2', '#f2c45a', '#ffd98a', '#ffffff'], frame: ['#7a4a10', '#fff4d2', '#d8962a', '#fff4d2', '#7a4a10'], line: '#fff4d2', gem: ['#ffd0c8', '#e2302a', '#5a0a10'], plate: '#2a1806', bg: 'radial-gradient(circle at 50% 30%, #8a5a1a, #2a1806 60%, #0e0804)', wing: 'feather', wingFill: ['#fff4d2', '#f2c45a', '#a06a1a'], wingStroke: '#7a4a10', crest: 'crown', orbit: 'phoenix', burst: 'fountain', back: 'seal', charge: 'rise', ink: 'gold', sound: 'holy', rays: 'rgba(255,226,150,.55)', backBg: 'radial-gradient(circle at 50% 45%, #6a4210, #1a0e04 72%)' },
  cosmos: { ru: 'Космос', c1: '#b79bff', c2: '#2a1a6a', c3: '#5ae0ff', pal: ['#ffffff', '#c8b0ff', '#ff9ae0', '#9ae8ff', '#ffd86a'], frame: ['#7a5aff', '#ff7ad8', '#ffd86a', '#5ae0ff', '#9affb0'], line: '#ffffff', gem: ['#e0f8ff', '#5ae0ff', '#2a1a6a'], plate: '#120a2a', bg: 'radial-gradient(circle at 50% 35%, #3a2a8a, #120a2a 55%, #05030c)', wing: 'feather', wingFill: ['#ffffff', '#c8b0ff', '#5ae0ff'], wingStroke: '#ffffff', crest: 'halo', holo: true, orbit: 'comet', burst: 'nova', back: 'vortex', charge: 'vortex', vortex: ['#7a5aff', '#ff7ad8', '#5ae0ff'], hole: ['#ffffff', '#c8b0ff', '#7a5aff'], ink: 'holo', sound: 'cosmos', rays: 'rgba(200,170,255,.45)', backBg: 'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 80% 70%, #fff, transparent), radial-gradient(1px 1px at 30% 80%, #fff, transparent), radial-gradient(circle at 50% 45%, #1a0f40, #05030c 75%)' },
  dragon: { ru: 'Дракон', c1: '#ff7a2a', c2: '#5a0e0e', c3: '#ffcf5a', pal: ['#ffe08a', '#ffcf5a', '#ff8a2a', '#ff4a1a'], frame: ['#3a0c10', '#f2c45a', '#8a1e1e', '#ffe6a0', '#2a0808'], line: '#ffcf5a', gem: ['#ffe08a', '#ff5a1a', '#5a0a0a'], plate: '#1a0606', bg: 'radial-gradient(circle at 50% 70%, #8a2a10, #2a0808 55%, #0a0303)', wing: 'bat', crest: 'dragon', orbit: 'dragon', burst: 'fire', back: 'eye', charge: 'crack', crack: '#ffb02a', shard: ['#2a0806', '#ffb02a'], ink: 'fire', sound: 'dragon', rays: 'rgba(255,110,40,.5)', backBg: 'radial-gradient(circle at 50% 0, transparent 9px, rgba(255,120,40,.13) 10px, transparent 11.5px) 0 0 / 20px 12px, radial-gradient(circle at 50% 45%, #3a0a08, #0a0303 72%)' },
  ocean: { ru: 'Глубины', c1: '#3ad0e0', c2: '#08304a', c3: '#bff8ff', pal: ['#e0fbff', '#7ae8f0', '#3ad0e0', '#2a8aff'], frame: ['#08304a', '#bff8ff', '#1a7aa0', '#e0fbff', '#08304a'], line: '#e0fbff', gem: ['#ffffff', '#3ad0e0', '#08304a'], plate: '#041a2a', bg: 'radial-gradient(circle at 50% 15%, #1a7aa0, #08304a 55%, #020c16)', wing: 'fin', wingFill: ['#e0fbff', '#3ad0e0', '#1a5a8a'], wingStroke: '#bff8ff', crest: 'shell', orbit: 'fish', burst: 'wave', back: 'vortex', charge: 'vortex', vortex: ['#2a8aff', '#3ad0e0', '#bff8ff'], hole: ['#e0fbff', '#3ad0e0', '#1a5a8a'], ink: 'ocean', sound: 'ocean', rays: 'rgba(120,230,255,.4)', backBg: 'radial-gradient(circle at 50% 100%, transparent 8px, rgba(150,230,255,.12) 9px, transparent 10.5px) 0 0 / 24px 12px, radial-gradient(circle at 50% 45%, #0a3a5a, #020c16 72%)' },
  frost: { ru: 'Лёд', c1: '#9ae8ff', c2: '#163a5a', c3: '#ffffff', pal: ['#ffffff', '#e0f6ff', '#9ae8ff', '#7ac7f0'], frame: ['#2a5a7a', '#ffffff', '#7ac7f0', '#e8fbff', '#2a5a7a'], line: '#ffffff', gem: ['#ffffff', '#9ae8ff', '#2a5a7a'], plate: '#0a1e30', bg: 'radial-gradient(circle at 50% 30%, #4a8ab0, #163a5a 55%, #050f1a)', wing: 'crystal', wingFill: ['#ffffff', '#bfe8ff', '#7ac7f0'], wingStroke: '#ffffff', crest: 'snowflake', orbit: 'snow', burst: 'ice', back: 'frost', charge: 'crack', crack: '#ffffff', shard: ['rgba(220,245,255,.9)', '#7ac7f0'], ink: 'frost', sound: 'frost', rays: 'rgba(200,240,255,.45)', backBg: 'linear-gradient(135deg, rgba(255,255,255,.12) 0 10%, transparent 10% 50%, rgba(255,255,255,.08) 50% 60%, transparent 60%) 0 0 / 40px 40px, radial-gradient(circle at 50% 45%, #2a5a7a, #050f1a 72%)' },
  nature: NATURE,
  autumn: { ...NATURE, ru: 'Осень', c1: '#f6a04a', c2: '#3a1a08', c3: '#ffd86a', pal: ['#ffe0a0', '#f6b04a', '#e2702a', '#a4412a'], frame: ['#3a1a08', '#ffe0a0', '#a4412a', '#ffd86a', '#3a1a08'], line: '#ffd86a', gem: ['#fff0c0', '#e2702a', '#4a1a08'], plate: '#1e0e04', bg: 'radial-gradient(circle at 50% 30%, #a4512a, #3a1a08 55%, #100602)', wingFill: ['#ffe0a0', '#f6a04a', '#a4412a'], wingStroke: '#4a1a08', crack: '#ffb04a', shard: ['#3a1a08', '#ffb04a'], ink: 'autumn', rays: 'rgba(255,190,110,.45)', backBg: 'radial-gradient(circle at 50% 45%, #4a2a10, #100602 72%)' },
  storm: { ru: 'Буря', c1: '#7ab0ff', c2: '#101a3a', c3: '#ffe86a', pal: ['#ffffff', '#bfd8ff', '#7ab0ff', '#ffe86a'], frame: ['#101a3a', '#e0ecff', '#3a5aaa', '#ffe86a', '#101a3a'], line: '#ffe86a', gem: ['#ffffff', '#ffe86a', '#3a5aaa'], plate: '#080e22', bg: 'radial-gradient(circle at 50% 25%, #3a4a8a, #101a3a 55%, #04060f)', wing: 'bolt', wingFill: ['#ffffff', '#bfd8ff', '#5a7acc'], wingStroke: '#ffe86a', crest: 'bolt', orbit: 'orb', burst: 'thunder', back: 'cloud', charge: 'crack', crack: '#ffe86a', shard: ['#1a2440', '#ffe86a'], ink: 'storm', sound: 'storm', rays: 'rgba(160,200,255,.45)', backBg: 'radial-gradient(circle at 50% 45%, #2a3458, #04060f 72%)' },
};
const THEME_FAMILY = { gold: 'holy', holy: 'holy', sun: 'holy', holo: 'cosmos', void: 'cosmos', cosmos: 'cosmos', fire: 'dragon', dragon: 'dragon', ocean: 'ocean', frost: 'frost', nature: 'nature', autumn: 'autumn', storm: 'storm' };
export function familyKey(theme, rarity) { return THEME_FAMILY[theme] || (rarity === 'Mythic' ? 'cosmos' : 'holy'); }
export function familyOf(theme, rarity) { return FAMILIES[familyKey(theme, rarity)]; }
export const THEME_RU = Object.fromEntries(Object.entries(THEME_FAMILY).map(([k, f]) => [k, FAMILIES[f].ru]));

const REDUCE = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => typeof document !== 'undefined' && document.body.classList.contains('lrpg-calm');
let uidN = 0;
const useUid = () => useMemo(() => 'rv' + (++uidN).toString(36), []);

// ---------- CSS ----------
const CSS = `
@keyframes rvSpin { to { transform: rotate(360deg); } }
@keyframes rvPulse { 50% { opacity: .55; transform: scale(.92); } }
@keyframes rvFloat { 50% { transform: translateY(-6px); } }
@keyframes rvHue { to { filter: hue-rotate(360deg); } }
@keyframes rvEye { 0%,100% { opacity: .55; } 45%,55% { opacity: 1; } }
@keyframes rvRun { to { stroke-dashoffset: -1360; } }
@keyframes rvFlap { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-9deg); } }
@keyframes rvSway { 50% { transform: rotate(5deg); } }
@keyframes rvFlick { 50% { transform: scaleY(1.18) skewX(-5deg); } }
@keyframes rvBreathe { 50% { opacity: 1; transform: scale(1.06); } }
@keyframes rvSheen { 0% { background-position: 120% 0; } 45%, 100% { background-position: -20% 0; } }
@keyframes rvShine { 0% { background-position: 150% 0, 0 0; } 60%, 100% { background-position: -60% 0, 0 0; } }
@keyframes rvHolo { to { background-position: 300% 0; } }
@keyframes rvFire { to { background-position: 0 -200%; } }
@keyframes rvFlickT { 0%, 100% { opacity: 1; } 42% { opacity: .82; } 44% { opacity: 1; } 71% { opacity: .9; } }
@keyframes rvZap { 0%, 100% { opacity: 1; } 8% { opacity: .5; } 10% { opacity: 1; } 52% { opacity: .7; } 53% { opacity: 1; } }
@keyframes rvPupil { 50% { transform: scaleX(.4); } }
.rv-spin { animation: rvSpin 22s linear infinite; transform-box: fill-box; transform-origin: center; }
.rv-spinrev { animation: rvSpin 14s linear infinite reverse; transform-box: fill-box; transform-origin: center; }
.rv-pulse { animation: rvPulse 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.rv-float { animation: rvFloat 3.6s ease-in-out infinite; }
.rv-hue { animation: rvHue 7s linear infinite; }
.rv-eye { animation: rvEye 2.4s ease-in-out infinite; }
.rv-run { animation: rvRun 3.6s linear infinite; }
.rv-wing { transform-box: fill-box; transform-origin: 100% 100%; animation: rvFlap 3.4s ease-in-out infinite; }
.rv-sway { transform-box: fill-box; transform-origin: 50% 0%; animation: rvSway 3s ease-in-out infinite; }
.rv-flick { transform-box: fill-box; transform-origin: 50% 100%; animation: rvFlick .8s ease-in-out infinite; }
.rv-zap { animation: rvZap 2.6s steps(1) infinite; }
.rv-pupil { transform-box: fill-box; transform-origin: center; animation: rvPupil 3s ease-in-out infinite; }
.rv-card { position: relative; aspect-ratio: 280 / 410; --rx: 0deg; --ry: 0deg; --mx: 50%; --my: 50%; --px: 0; --py: 0; }
.rv-tilt { position: absolute; inset: 0; transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)); }
.rv-cc { position: absolute; inset: 0; z-index: 1; filter: drop-shadow(0 22px 26px rgba(0,0,0,.55)); }
.rv-glow { position: absolute; inset: -14%; border-radius: 40%; filter: blur(28px); opacity: .7; animation: rvBreathe 3.2s ease-in-out infinite; pointer-events: none; }
.rv-body { position: absolute; inset: 15.8% 8.4% 8.8%; border-radius: 12px; overflow: hidden; background: #000; }
.rv-body canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; transform: translate(calc(var(--px) * -6px), calc(var(--py) * -5px)) scale(1.06); }
.rv-art { position: absolute; inset: 0; display: grid; place-items: center; padding: 6% 0 10%; transform: translate(calc(var(--px) * 10px), calc(var(--py) * 8px)); }
.rv-art > * { animation: rvFloat 3.6s ease-in-out infinite; }
.rv-glare { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: color-dodge; background: radial-gradient(farthest-corner circle at var(--mx) var(--my), rgba(255,255,255,.5), transparent 42%); opacity: .8; }
.rv-holo { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light; opacity: .55; background: linear-gradient(115deg, transparent 20%, rgba(255,90,200,.5) 35%, rgba(90,224,255,.5) 50%, rgba(255,230,110,.45) 65%, transparent 80%); background-size: 260% 260%; background-position: var(--mx) var(--my); }
.rv-sheen { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.85) 48%, rgba(255,255,255,.25) 53%, transparent 62%); background-size: 300% 100%; animation: rvSheen 4.5s ease-in-out infinite; }
.rv-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.rv-orbit-back { z-index: 0; } .rv-orbit-front { z-index: 2; }
.rv-cine { position: fixed; inset: 0; z-index: 230; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px)); overflow: hidden; font-family: 'Manrope', system-ui, sans-serif; color: #f4efe6; }
.rv-bg { position: absolute; inset: 0; background: radial-gradient(circle at 50% 42%, rgba(30,24,50,.88), rgba(4,3,8,.97) 72%); }
.rv-fx { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.rv-rays { position: absolute; width: 900px; height: 900px; border-radius: 50%; pointer-events: none; opacity: .55; -webkit-mask: radial-gradient(circle, #000 10%, transparent 60%); mask: radial-gradient(circle, #000 10%, transparent 60%); animation: rvSpin 40s linear infinite; }
.rv-stage { position: relative; flex-shrink: 0; }
.rv-back { position: absolute; inset: 5% 3.5% 6%; z-index: 3; border-radius: 16px; overflow: hidden; display: grid; place-items: center; border: 3px solid var(--c1); box-shadow: 0 0 30px var(--c1), inset 0 0 50px rgba(0,0,0,.85); }
.rv-back::before { content: ''; position: absolute; inset: 8px; border-radius: 10px; border: 1px dashed var(--c1); opacity: .6; }
.rv-back .rv-sig { position: absolute; inset: 8% 6%; width: 88%; height: 84%; overflow: visible; }
.rv-back-rays { position: absolute; inset: -30%; -webkit-mask: radial-gradient(circle, #000 10%, transparent 55%); mask: radial-gradient(circle, #000 10%, transparent 55%); animation: rvSpin 20s linear infinite; }
.rv-vortex { position: absolute; width: 92%; aspect-ratio: 1; border-radius: 50%; filter: blur(5px); -webkit-mask: radial-gradient(circle, transparent 14%, #000 22%, #000 55%, transparent 70%); mask: radial-gradient(circle, transparent 14%, #000 22%, #000 55%, transparent 70%); animation: rvSpin 5s linear infinite; }
.rv-hole { position: absolute; width: 24%; aspect-ratio: 1; border-radius: 50%; animation: rvPulse 1.6s ease-in-out infinite; }
.rv-pillar { position: absolute; left: 50%; top: -110%; width: 64%; height: 210%; z-index: 2; pointer-events: none; opacity: 0; transform-origin: 50% 0; transform: translateX(-50%) scaleY(0); background: linear-gradient(90deg, transparent, rgba(255,240,200,.25) 25%, rgba(255,252,240,.95) 50%, rgba(255,240,200,.25) 75%, transparent); -webkit-mask: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); mask: linear-gradient(180deg, transparent, #000 25%, #000 80%, transparent); mix-blend-mode: screen; filter: blur(2px); }
.rv-shock { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; border: 4px solid #fff; z-index: 4; pointer-events: none; opacity: 0; }
.rv-flash { position: absolute; inset: -70%; z-index: 5; pointer-events: none; opacity: 0; mix-blend-mode: screen; }
.rv-banner { position: absolute; left: 50%; top: 46%; z-index: 6; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; opacity: 0; white-space: nowrap; }
.rv-banner .b1 { font-family: 'Cormorant SC', 'Fraunces', Georgia, serif; font-weight: 700; font-size: clamp(30px, 9vw, 42px); letter-spacing: .04em; line-height: 1.05; }
.rv-info { position: relative; z-index: 7; text-align: center; margin-top: 14px; width: min(340px, 100%); }
.rv-tplate { position: relative; aspect-ratio: 340 / 120; display: block; padding: 0; border: 0; background: none; font: inherit; color: inherit; }
.rv-tplate > * { position: absolute; }
.rv-tplate canvas { left: -12%; top: -45%; width: 124%; height: 190%; pointer-events: none; }
.rv-trays { left: 50%; top: 52%; width: 86%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; opacity: .5; -webkit-mask: radial-gradient(circle, #000 12%, transparent 58%); mask: radial-gradient(circle, #000 12%, transparent 58%); animation: rvSpin 30s linear infinite; }
.rv-ttext { left: 50%; top: 58.3%; transform: translate(-50%, -50%); white-space: nowrap; font-family: 'Cormorant SC', 'Fraunces', Georgia, serif; font-weight: 700; letter-spacing: .03em; line-height: 1; z-index: 1; }
.rv-t-common { font-family: 'Manrope', system-ui, sans-serif; font-weight: 600; color: #6b6f7a; letter-spacing: .01em; }
.rv-t-rare { color: #e8fbfd; text-shadow: 0 0 8px rgba(122,224,238,.6); }
.rv-ink-epic { background: linear-gradient(100deg, transparent 40%, rgba(255,255,255,.95) 50%, transparent 60%) 0 0 / 250% 100%, linear-gradient(180deg, #fff0f8 20%, #ff9ae0 60%, #c08aff); }
.rv-ink-gold { background: linear-gradient(100deg, transparent 40%, #fff 50%, transparent 60%) 0 0 / 250% 100%, linear-gradient(180deg, #fffaf0 10%, #ffe6a0 45%, #c8861a 56%, #ffe6a0 88%); filter: drop-shadow(0 1px 0 #3a2008) drop-shadow(0 0 8px rgba(242,196,90,.7)); }
.rv-ink-holo { background: linear-gradient(90deg, #ff9ae0, #fff, #9ae8ff, #ffd86a, #c8b0ff, #fff, #ff9ae0) 0 0 / 300% 100%; filter: drop-shadow(0 0 4px rgba(255,255,255,.8)) drop-shadow(0 0 12px rgba(160,123,255,.9)); }
.rv-ink-fire { background: linear-gradient(0deg, #ff7a2a 0%, #ffd86a 25%, #fffaf0 50%, #ffd86a 75%, #ff7a2a 100%) 0 0 / 100% 200%; filter: drop-shadow(0 0 5px #ff5a1a) drop-shadow(0 0 14px rgba(255,60,0,.7)); }
.rv-ink-ocean { background: linear-gradient(0deg, #2a8aff 0%, #7ae8f0 30%, #ffffff 50%, #7ae8f0 70%, #2a8aff 100%) 0 0 / 100% 200%; filter: drop-shadow(0 0 5px #3ad0e0) drop-shadow(0 0 14px rgba(42,138,255,.7)); }
.rv-ink-frost { background: linear-gradient(100deg, transparent 40%, #fff 50%, transparent 60%) 0 0 / 250% 100%, linear-gradient(180deg, #ffffff 20%, #bfe8ff 55%, #7ac7f0 90%); filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 12px rgba(122,199,240,.9)); }
.rv-ink-nature { background: linear-gradient(100deg, transparent 40%, #fff 50%, transparent 60%) 0 0 / 250% 100%, linear-gradient(180deg, #fffbe0 15%, #f6e38a 45%, #8fd06a 80%); filter: drop-shadow(0 0 4px rgba(246,227,138,.8)) drop-shadow(0 0 12px rgba(143,208,106,.8)); }
.rv-ink-autumn { background: linear-gradient(100deg, transparent 40%, #fff 50%, transparent 60%) 0 0 / 250% 100%, linear-gradient(180deg, #fff0c0 15%, #ffd86a 45%, #e2702a 85%); filter: drop-shadow(0 0 4px rgba(255,216,106,.8)) drop-shadow(0 0 12px rgba(226,112,42,.8)); }
.rv-ink-storm { background: linear-gradient(90deg, #bfd8ff, #fff, #ffe86a, #fff, #bfd8ff) 0 0 / 300% 100%; filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 12px rgba(122,176,255,.95)); }
[class*="rv-ink-"] { -webkit-background-clip: text; background-clip: text; color: transparent !important; }
.rv-ink-epic, .rv-ink-gold, .rv-ink-frost, .rv-ink-nature, .rv-ink-autumn { animation: rvShine 3s linear infinite; }
.rv-ink-holo { animation: rvHolo 4s linear infinite; }
.rv-ink-storm { animation: rvHolo 3s linear infinite, rvZap 2.3s steps(1) infinite; }
.rv-ink-fire, .rv-ink-ocean { animation: rvFire 1.6s linear infinite, rvFlickT 2.3s steps(1) infinite; }
.rv-ink-ocean { animation: rvFire 3s linear infinite; }
@media (prefers-reduced-motion: reduce) { [class*="rv-"], [class*="rv-"] * { animation: none !important; } }
body.lrpg-calm .rv-run, body.lrpg-calm .rv-sheen { animation: none !important; }
`;
let cssIn = false;
export function useRevealCss() {
  if (cssIn || typeof document === 'undefined') return;
  cssIn = true;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@600;700&display=swap'; document.head.appendChild(l);
  const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
}

// ---------- SVG-кирпичики ----------
const grad = (id, stops, x2 = 1, y2 = 0) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const radial = (id, stops) => `<radialGradient id="${id}" cx="38%" cy="35%">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const glowF = (id, sd) => `<filter id="${id}" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const f1 = (n) => n.toFixed(1);
const spark = (x, y, r, c, i) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#fff" class="rv-pulse" style="animation-delay:-${(i * .37).toFixed(2)}s;filter:drop-shadow(0 0 3px ${c})"/>`;

/** Крыло-веер: перья / листья / кристаллы / молнии / плавники. Растёт из (x0,y0) влево-вверх. */
function fanWing(kind, fill, stroke, n, x0, y0, len0, a0 = -50, step = 12, fy = 1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const len = len0 - i * (len0 / (n + 2)), a = (a0 + i * step) * Math.PI / 180;
    const ux = -Math.cos(a), uy = Math.sin(a) * fy, L = Math.hypot(ux, uy), vx = ux / L, vy = uy / L, px = -vy, py = vx;
    const x1 = x0 + vx * len, y1 = y0 + vy * len, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, w = len * .17;
    const P = (t, o) => `${f1(x0 + vx * len * t + px * o)} ${f1(y0 + vy * len * t + py * o)}`;
    const op = (1 - i * .07).toFixed(2);
    if (kind === 'crystal') d += `<path d="M${x0} ${y0} L${P(.35, w * .7)} L${f1(x1)} ${f1(y1)} L${P(.35, -w * .5)} Z" fill="${fill}" stroke="${stroke}" stroke-width=".8" opacity="${op}"/><path d="M${x0} ${y0} L${f1(x1)} ${f1(y1)}" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/>`;
    else if (kind === 'bolt') d += `<path d="M${x0} ${y0} L${P(.45, w)} L${P(.4, w * .15)} L${f1(x1)} ${f1(y1)} L${P(.6, -w * .8)} L${P(.62, -w * .1)} Z" fill="${fill}" stroke="${stroke}" stroke-width=".9" opacity="${op}"/>`;
    else if (kind === 'leaf') d += `<path d="M${x0} ${y0} Q${f1(mx + px * w * 1.3)} ${f1(my + py * w * 1.3)} ${f1(x1)} ${f1(y1)} Q${f1(mx - px * w * 1.3)} ${f1(my - py * w * 1.3)} ${x0} ${y0} Z" fill="${fill}" stroke="${stroke}" stroke-width=".8" opacity="${op}"/><path d="M${x0} ${y0} L${f1(x1)} ${f1(y1)}" stroke="${stroke}" stroke-width=".7" opacity=".7"/>`;
    else if (kind === 'fin') d += `<path d="M${x0} ${y0} Q${f1(mx + px * w * 1.5)} ${f1(my + py * w * 1.5)} ${f1(x1)} ${f1(y1)} Q${f1(mx + px * w * .2)} ${f1(my + py * w * .2)} ${x0} ${y0 + 6} Z" fill="${fill}" stroke="${stroke}" stroke-width=".8" opacity="${(.85 - i * .06).toFixed(2)}"/><path d="M${x0} ${y0 + 2} Q${f1(mx + px * w * .7)} ${f1(my + py * w * .7)} ${f1(x1)} ${f1(y1)}" fill="none" stroke="${stroke}" stroke-width=".6" opacity=".8"/>`;
    else d += `<path d="M${x0} ${y0} Q${f1(mx + px * w)} ${f1(my + py * w)} ${f1(x1)} ${f1(y1)} Q${f1(mx - px * w * .4)} ${f1(my - py * w * .4)} ${x0} ${y0 + 7} Z" fill="${fill}" stroke="${stroke}" stroke-width=".8" opacity="${op}"/>`;
  }
  return d;
}
const batWing = (x0, y0, s, memb, edge) => `<path d="M${x0} ${y0} L${x0 - 22 * s} ${y0 - 34 * s} L${x0 - 62 * s} ${y0 - 50 * s} L${x0 - 52 * s} ${y0 - 29 * s} L${x0 - 77 * s} ${y0 - 23 * s} L${x0 - 54 * s} ${y0 - 9 * s} L${x0 - 70 * s} ${y0 + 8 * s} L${x0 - 34 * s} ${y0 + 4 * s} L${x0} ${y0 + 16 * s} Z" fill="${memb}" stroke="${edge}" stroke-width="1.3"/>
  <path d="M${x0} ${y0} L${x0 - 62 * s} ${y0 - 50 * s} M${x0} ${y0 + 2 * s} L${x0 - 77 * s} ${y0 - 23 * s} M${x0} ${y0 + 6 * s} L${x0 - 70 * s} ${y0 + 8 * s}" stroke="#2a0606" stroke-width="2"/><circle cx="${x0 - 22 * s}" cy="${y0 - 34 * s}" r="2.5" fill="${edge}"/>`;

/** Пара крыльев, зеркально относительно центра cx. */
function wings(fam, ids, cx, x0, y0, len, opts = {}) {
  let one;
  if (fam.wing === 'bat') one = batWing(x0, y0, len / 70, `url(#${ids}wm)`, fam.line);
  else one = fanWing(fam.wing, `url(#${ids}wf)`, fam.wingStroke, opts.n || 7, x0, y0, len, opts.a0 ?? -50, opts.step ?? 12, opts.fy ?? 1);
  return `<g class="rv-wing">${one}</g><g transform="translate(${cx * 2} 0) scale(-1 1)"><g class="rv-wing">${one}</g></g>`;
}
const wingDefs = (fam, ids) => fam.wing === 'bat' ? grad(ids + 'wm', ['#a0242a', '#2a0808'], 0, 1) : grad(ids + 'wf', fam.wingFill);

/** Герб по теме, центр щита в (0,0). */
function crest(fam, ids) {
  const g = `url(#${ids}mg)`, gem = `url(#${ids}gem)`;
  switch (fam.crest) {
    case 'dragon': return `<path d="M-16 -16 L-32 -42 L-8 -24 Z M16 -16 L32 -42 L8 -24 Z" fill="#ffe6a0" stroke="#7a4a10"/>
      <path d="M-22 -2 Q-24 -24 0 -30 Q24 -24 22 -2 Q12 10 0 12 Q-12 10 -22 -2 Z" fill="${g}" stroke="#2a0808" stroke-width="1.5"/>
      <path d="M-13 -9 L-4 -5 M13 -9 L4 -5" stroke="#2a0808" stroke-width="2"/>
      <circle cx="-8" cy="-11" r="7" fill="#ff6a1a" opacity=".4" class="rv-eye"/><circle cx="8" cy="-11" r="7" fill="#ff6a1a" opacity=".4" class="rv-eye"/>
      <circle cx="-8" cy="-11" r="3" fill="#ffe08a" class="rv-eye"/><circle cx="8" cy="-11" r="3" fill="#ffe08a" class="rv-eye"/><path d="M-8 5 L0 13 L8 5" fill="#2a0808"/>`;
    case 'shell': return `<g>${Array.from({ length: 7 }, (_, i) => { const a = (-150 + i * 20) * Math.PI / 180; return `<path d="M0 10 L${f1(Math.cos(a) * 28)} ${f1(Math.sin(a) * 28 + 4)}" stroke="${fam.line}" stroke-width="1.2" opacity=".8"/>`; }).join('')}
      <path d="M-26 6 Q-28 -26 0 -26 Q28 -26 26 6 Q14 12 0 12 Q-14 12 -26 6 Z" fill="${g}" fill-opacity=".85" stroke="${fam.line}" stroke-width="1.4"/>
      ${Array.from({ length: 6 }, (_, i) => `<path d="M0 11 Q${-21 + i * 8.4} -6 ${-22 + i * 8.8} -22" fill="none" stroke="#08304a" stroke-opacity=".5" stroke-width="1"/>`).join('')}
      <circle cx="0" cy="-2" r="6" fill="${gem}" class="rv-pulse"/><circle cx="-2" cy="-4" r="2" fill="#fff" opacity=".8"/></g>`;
    case 'snowflake': return `<g class="rv-spin">${Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60})"><path d="M0 0 L0 -30 M0 -12 L-7 -19 M0 -12 L7 -19 M0 -22 L-5 -27 M0 -22 L5 -27" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`).join('')}</g>
      <circle r="12" fill="${g}" stroke="#fff"/><path d="M0 -8 L6 0 L0 8 L-6 0 Z" fill="${gem}" class="rv-pulse"/>`;
    case 'flower': return `<g class="rv-spin">${Array.from({ length: 6 }, (_, i) => `<ellipse cx="0" cy="-15" rx="7" ry="13" fill="${i % 2 ? fam.pal[3] : fam.pal[0]}" stroke="${fam.wingStroke}" stroke-width=".8" transform="rotate(${i * 60})"/>`).join('')}</g>
      <circle r="9" fill="${g}" stroke="${fam.wingStroke}"/><circle r="4" fill="${fam.c3}" class="rv-pulse"/>`;
    case 'bolt': return `<circle r="22" fill="${g}" stroke="${fam.line}" stroke-width="1.5"/><circle r="17" fill="${fam.plate}"/>
      <path d="M4 -16 L-8 2 L0 2 L-4 16 L9 -3 L1 -3 Z" fill="${fam.c3}" stroke="#fff" stroke-width=".8" class="rv-zap" style="filter:drop-shadow(0 0 5px ${fam.c3})"/>`;
    case 'halo': return `<ellipse cx="0" cy="-34" rx="24" ry="6" fill="none" stroke="#fff" stroke-width="2.5" class="rv-pulse" style="filter:drop-shadow(0 0 6px ${fam.c1})"/>
      <path d="M-20 -22 H20 V2 Q20 16 0 22 Q-20 16 -20 2 Z" fill="${g}" stroke="#fff" stroke-width="1.5"/><path d="M-14 -16 H14 V0 Q14 10 0 15 Q-14 10 -14 0 Z" fill="${fam.plate}"/>
      <path d="M0 -12 L9 -2 L0 11 L-9 -2 Z" fill="${gem}" class="rv-pulse"/><path d="M0 -12 L9 -2 L0 -1 Z" fill="#fff" opacity=".7"/>`;
    default: return `<path d="M-14 -26 L-10 -40 L-4 -30 L0 -44 L4 -30 L10 -40 L14 -26 Z" fill="${g}" stroke="#7a4a10"/>
      <path d="M-20 -22 H20 V2 Q20 16 0 22 Q-20 16 -20 2 Z" fill="${g}" stroke="#7a4a10" stroke-width="1.5"/><path d="M-14 -16 H14 V0 Q14 10 0 15 Q-14 10 -14 0 Z" fill="${fam.plate}"/>
      <path d="M0 -12 L9 -2 L0 11 L-9 -2 Z" fill="${gem}" class="rv-pulse"/><path d="M0 -12 L9 -2 L0 -1 Z" fill="#fff" opacity=".7"/>`;
  }
}
const baseDefs = (fam, ids) => `${grad(ids + 'mg', fam.frame, 1, 1)}${radial(ids + 'gem', fam.gem)}${glowF(ids + 'gl', 3)}${wingDefs(fam, ids)}`;

/** Рамка коллекционной карты. viewBox -10 -40 300 450, внутреннее поле 14..266 × 30..372. */
function frameSVG(fam, ids, rarity) {
  const rect = (i) => `M${22 + i} ${30 + i} H${258 - i} Q${266 - i} ${30 + i} ${266 - i} ${38 + i} V${364 - i} Q${266 - i} ${372 - i} ${258 - i} ${372 - i} H${22 + i} Q${14 + i} ${372 - i} ${14 + i} ${364 - i} V${38 + i} Q${14 + i} ${30 + i} ${22 + i} ${30 + i} Z`;
  const swirl = (x, y, sx, sy) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="none" stroke="url(#${ids}mg)" stroke-width="2.2" stroke-linecap="round"><path d="M0 40 Q0 0 40 0"/><path d="M8 34 Q8 8 34 8"/><path d="M14 46 Q22 26 10 18 Q2 12 10 6"/><path d="M46 14 Q26 22 18 10 Q12 2 6 10"/><circle cx="10" cy="10" r="3" fill="url(#${ids}mg)"/></g>`;
  const w = fam.wing === 'bat' ? wings(fam, ids, 140, 124, 30, 76) : wings(fam, ids, 140, 122, 32, 62, { n: 6, a0: -32, step: 12, fy: .7 });
  const label = rarity === 'Mythic' ? 'МИФИЧЕСКИЙ' : 'ЛЕГЕНДАРНЫЙ';
  return `<defs>${baseDefs(fam, ids)}</defs><g class="${fam.holo ? 'rv-hue' : ''}">
    ${w}
    <path d="${rect(0)}" fill="none" stroke="url(#${ids}mg)" stroke-width="10"/>
    <path d="${rect(0)}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/>
    <path d="${rect(8)}" fill="none" stroke="url(#${ids}mg)" stroke-width="2.5"/>
    <path d="${rect(0)}" fill="none" stroke="${fam.line}" stroke-width="3" stroke-dasharray="90 1270" class="rv-run" filter="url(#${ids}gl)"/>
    <path d="${rect(0)}" fill="none" stroke="${fam.line}" stroke-width="3" stroke-dasharray="90 1270" stroke-dashoffset="-680" class="rv-run" filter="url(#${ids}gl)"/>
    ${swirl(14, 30, 1, 1)}${swirl(266, 30, -1, 1)}${swirl(14, 372, 1, -1)}${swirl(266, 372, -1, -1)}
    <path d="M8 190 L20 178 L32 190 L20 214 Z" fill="url(#${ids}mg)"/><circle cx="20" cy="194" r="5" fill="url(#${ids}gem)" class="rv-pulse"/>
    <path d="M272 190 L260 178 L248 190 L260 214 Z" fill="url(#${ids}mg)"/><circle cx="260" cy="194" r="5" fill="url(#${ids}gem)" class="rv-pulse"/>
    <g transform="translate(140 ${fam.crest === 'halo' || fam.crest === 'crown' ? 30 : 24})">${crest(fam, ids)}</g>
    <g transform="translate(140 372)"><path d="M-104 -16 H104 L118 0 L104 16 H-104 L-118 0 Z" fill="url(#${ids}mg)"/><path d="M-98 -11 H98 L108 0 L98 11 H-98 L-108 0 Z" fill="${fam.plate}"/>
      <text x="0" y="5" text-anchor="middle" font-family="'Cormorant SC', Georgia, serif" font-weight="700" font-size="14" letter-spacing="3" fill="url(#${ids}mg)">${label}</text></g>
  </g>`;
}

/** Существо на орбите (мифические). Две половины: за картой и перед ней. */
const ORBIT_CARD = { cx: 140, cy: 236, rx: 184, ry: 56, rot: -10, dur: 7, vb: '0 0 280 410', k: 1 };
const ORBIT_TITLE = { cx: 170, cy: 72, rx: 158, ry: 35, rot: -5, dur: 6.5, vb: '0 0 340 120', k: .5 };
function orbitSVG(fam, layer, geo, ids) {
  const { cx, cy, rx, ry, rot, dur, vb, k } = geo;
  const dragon = fam.orbit === 'dragon';
  const d = `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  const id = ids + layer;
  const P = fam.pal;
  const segs = (dragon ? [[340, 7, '#4a0a0e'], [250, 11, '#6a1014'], [160, 15, '#8a1a1a'], [70, 19, '#a82420']] : [[300, 2, P[3] || P[2]], [200, 4, P[2]], [110, 7, P[1]], [40, 10, '#ffffff']]).map(([L, w, c]) => [L, w * (dragon ? k : Math.max(.7, k)), c]);
  const lead = segs[0][0];
  const anim = (L) => `<animate attributeName="stroke-dashoffset" values="${-(lead - L)};${-(lead - L) - 1000}" dur="${dur}s" repeatCount="indefinite"/>`;
  const seg = (L, w, stroke, extra = '') => `<path d="${d}" pathLength="1000" fill="none" stroke="${stroke}" stroke-width="${f1(w)}" stroke-linecap="round" stroke-dasharray="${L} ${1000 - L}" ${extra}>${anim(L)}</path>`;
  const motion = (begin) => `<animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto" begin="${begin}s" path="${d}"/>`;
  const hb = -(lead / 1000) * dur;
  const loop = (attr, w, dash, col, op) => `<path d="${d}" pathLength="1000" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${f1(w)}" stroke-dasharray="${dash}"><animate attributeName="stroke-dashoffset" values="0;-1000" dur="${dur}s" repeatCount="indefinite"/></path>`;
  let body, head, extras = '';
  if (dragon) {
    body = `<mask id="${id}sp" maskUnits="userSpaceOnUse" x="-300" y="-300" width="1000" height="1000">${segs.map(([L, w]) => seg(L, w + 12 * k, '#fff')).join('')}</mask>
      <g mask="url(#${id}sp)">${loop(0, 40 * k, '1.4 6.6', '#ffcf5a', 1)}</g>
      ${segs.map(([L, w]) => seg(L, w + 3.5 * k, '#f2c45a')).join('')}${segs.map(([L, w, c]) => seg(L, w, c)).join('')}
      <mask id="${id}m" maskUnits="userSpaceOnUse" x="-300" y="-300" width="1000" height="1000">${segs.map(([L, w]) => seg(L, w, '#fff')).join('')}</mask>
      <g mask="url(#${id}m)">${loop(0, 20 * k, '2 6', '#2a0406', .6)}${loop(0, 20 * k, '.6 7.4', '#ffcf5a', .55)}</g>`;
    head = `<g>${motion(hb)}<g transform="scale(${1.45 * k})">
      <path d="M34 0 L96 -16 Q108 0 96 16 Z" fill="url(#${id}fire)"><animate attributeName="opacity" values=".15;.95;.55;1;.2" dur=".9s" repeatCount="indefinite"/></path>
      <path d="M2 -9 L-20 -22 L-4 -4 Z M2 9 L-20 22 L-4 4 Z" fill="#ffe6a0" stroke="#7a4a10"/>
      <path d="M-10 -11 Q6 -14 16 -8 L33 -3 Q37 0 33 3 L16 8 Q6 14 -10 11 Z" fill="#a41e1e" stroke="#f2c45a" stroke-width="1.6"/>
      <path d="M18 -4 L31 -1 M18 4 L31 1" stroke="#3a0808" stroke-width="1.4"/><path d="M31 -2 Q42 -12 50 -8 M31 2 Q42 12 50 8" stroke="#f2c45a" fill="none" stroke-width="1.1"/>
      <circle cx="13" cy="-6" r="6" fill="#ff6a1a" opacity=".45" class="rv-eye"/><circle cx="13" cy="6" r="6" fill="#ff6a1a" opacity=".45" class="rv-eye"/>
      <circle cx="13" cy="-6" r="2.4" fill="#ffe08a"/><circle cx="13" cy="6" r="2.4" fill="#ffe08a"/></g></g>`;
  } else {
    body = segs.map(([L, w, c], i) => seg(L, w, c, `stroke-opacity="${(.3 + i * .23).toFixed(2)}"`)).join('');
    const s = Math.max(.6, k);
    const shapes = {
      comet: `<circle r="9" fill="#fff" opacity=".35"/><circle r="4.5" fill="#fff"/><path d="M0 -14 Q0 0 14 0 Q0 0 0 14 Q0 0 -14 0 Q0 0 0 -14 Z" fill="#fff"><animateTransform attributeName="transform" type="scale" values="1;.6;1" dur="1s" repeatCount="indefinite"/></path>`,
      fish: `<path d="M14 0 Q4 -9 -10 -4 L-20 -10 L-16 0 L-20 10 L-10 4 Q4 9 14 0 Z" fill="${P[1]}" stroke="#fff" stroke-width="1"/><path d="M-2 -6 L4 -12 L6 -5 Z" fill="${P[2]}"/><circle cx="8" cy="-2" r="1.5" fill="#08304a"/><animateTransform attributeName="transform" type="skewY" values="-6;6;-6" dur=".6s" repeatCount="indefinite"/>`,
      snow: `<g>${Array.from({ length: 6 }, (_, i) => `<path d="M0 0 L0 -11 M0 -6 L-3 -9 M0 -6 L3 -9" stroke="#fff" stroke-width="1.6" stroke-linecap="round" transform="rotate(${i * 60})"/>`).join('')}<animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite"/></g><circle r="3" fill="#fff"/>`,
      butterfly: `<g><path d="M0 0 Q-6 -16 -16 -12 Q-14 -2 0 0 Z M0 0 Q6 -16 16 -12 Q14 -2 0 0 Z" fill="${P[3] || P[1]}" stroke="#fff" stroke-width=".8"/><path d="M0 0 Q-8 12 -12 8 Q-10 2 0 0 Z M0 0 Q8 12 12 8 Q10 2 0 0 Z" fill="${P[2]}" stroke="#fff" stroke-width=".8"/><animateTransform attributeName="transform" type="scale" values="1 1;1 .3;1 1" dur=".35s" repeatCount="indefinite"/></g><ellipse rx="6" ry="1.6" fill="#3a2a10"/>`,
      orb: `<circle r="10" fill="${P[2]}" opacity=".35"/><circle r="5" fill="#fff"/><path d="M0 0 L9 -6 L5 -1 L13 2 M0 0 L-8 7 L-4 2 L-12 -3" stroke="${P[3] || '#fff'}" stroke-width="1.4" fill="none"><animate attributeName="opacity" values="1;.2;1;.6;1" dur=".4s" repeatCount="indefinite"/></path>`,
      phoenix: `<path d="M12 0 L-4 -5 L-14 -16 L-10 -4 L-16 0 L-10 4 L-14 16 L-4 5 Z" fill="${P[1]}" stroke="#fff" stroke-width="1"/><circle cx="6" cy="0" r="3.5" fill="#fff"/><animateTransform attributeName="transform" type="scale" values="1 1;1 .55;1 1" dur=".5s" repeatCount="indefinite"/>`,
    };
    head = `<g>${motion(hb)}<g transform="scale(${s})">${shapes[fam.orbit] || shapes.comet}</g></g>`;
    if (fam.orbit === 'comet') extras = [[-2.1, 6, '#ffd86a'], [-3.9, 4.2, '#9affb0']].map(([b, r, c]) => `<g>${motion(b)}<g transform="scale(${s})"><circle r="${r + 4}" fill="${c}" opacity=".3"/><circle r="${r}" fill="${c}"/><ellipse rx="${r * 2}" ry="${r * .5}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1"/></g></g>`).join('');
    if (fam.orbit === 'fish') extras = [-1.4, -2.6, -3.5].map((b, i) => `<g>${motion(b)}<g transform="scale(${s * (.6 - i * .1)})">${shapes.fish}</g></g>`).join('');
  }
  const clipY = layer === 'front' ? cy : cy - 900;
  return `<svg class="rv-svg rv-orbit-${layer}" viewBox="${vb}" aria-hidden="true">
    <defs><clipPath id="${id}clip" clipPathUnits="userSpaceOnUse"><rect x="-500" y="${clipY}" width="1400" height="900"/></clipPath>
    ${grad(id + 'fire', ['#fff4d2', '#ffcf5a', 'rgba(255,90,26,.8)', 'rgba(255,90,26,0)'])}</defs>
    <g transform="rotate(${rot} ${cx} ${cy})" clip-path="url(#${id}clip)" style="filter:drop-shadow(0 0 6px ${fam.c1})">${body}${extras}${head}</g></svg>`;
}

// ---------- Частицы ----------
/**
 * Движок частиц для canvas. mode: 'inner' — внутри карты (фон темы), 'ambient' — вокруг, 'stage' — церемония.
 * Возвращает { burst, charge, shatter, bolts, setCenter, stop }.
 */
function particleEngine(canvas, fam, opts = {}) {
  const ctx = canvas.getContext('2d'), dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
  let W = 0, H = 0, alive = true, raf = 0, CX = null, CY = null;
  const fit = () => { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; if (ro) ro.observe(canvas);
  const pal = opts.pal || fam.pal, rnd = (a, b) => a + Math.random() * (b - a), pick = (arr = pal) => arr[Math.floor(Math.random() * arr.length)];
  const style = fam.burst, inner = opts.mode === 'inner';
  const amb = [], fx = [], rings = [], bolts = []; let rayb = null, flashT = 0;
  const N = Math.round((opts.density ?? 1) * (inner ? 55 : style === 'nova' ? 90 : 60) * (calm() ? .35 : 1));
  const spawn = (init) => {
    const x = rnd(0, W), base = { x, a: rnd(0, 6.28), c: pick() };
    switch (style) {
      case 'fountain': return { ...base, t: Math.random() < .25 ? 'feather' : 'star', y: init ? rnd(0, H) : -10, vx: rnd(-.3, .3), vy: rnd(.15, .5), r: rnd(1, 2.6), va: rnd(-.03, .03) };
      case 'nova': return { ...base, t: 'twinkle', y: rnd(0, H), vx: 0, vy: 0, r: rnd(.6, 2) };
      case 'fire': return { ...base, t: 'ember', y: init ? rnd(0, H) : H + 10, vx: rnd(-.3, .3), vy: -rnd(.6, 1.6), r: rnd(1, 3) };
      case 'wave': return { ...base, t: 'bubble', y: init ? rnd(0, H) : H + 10, vx: 0, vy: -rnd(.4, 1.2), r: rnd(1.5, 4.5) };
      case 'ice': return { ...base, t: 'flake', y: init ? rnd(0, H) : -10, vx: rnd(-.3, .3), vy: rnd(.3, .8), r: rnd(2, 4.5), va: rnd(-.02, .02) };
      case 'bloom': return { ...base, t: 'petal', y: init ? rnd(0, H) : -10, vx: rnd(-.6, .2), vy: rnd(.4, .9), r: rnd(3, 6), va: rnd(-.04, .04) };
      default: return { ...base, t: 'rain', y: init ? rnd(0, H) : -20, vx: -1.5, vy: rnd(7, 11), r: rnd(.6, 1.2), c: 'rgba(200,220,255,.5)' };
    }
  };
  for (let i = 0; i < N; i++) amb.push(spawn(true));
  const star4 = (x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x, y, x + r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2.2); ctx.quadraticCurveTo(x, y, x - r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2.2); ctx.fill(); };
  const feather = (x, y, r, a, al) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = al; ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.ellipse(0, 0, r * 2.4, r * .8, 0, 0, 6.28); ctx.fill(); ctx.restore(); };
  const flake = (x, y, r, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 3; i++) { const q = i * Math.PI / 3; ctx.moveTo(Math.cos(q) * r, Math.sin(q) * r); ctx.lineTo(-Math.cos(q) * r, -Math.sin(q) * r); } ctx.stroke(); ctx.restore(); };
  const petal = (x, y, r, a, c) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .45, 0, 0, 6.28); ctx.fill(); ctx.restore(); };
  const boltPath = (x0, y0, a, len) => { ctx.beginPath(); ctx.moveTo(x0, y0); for (let s = 1; s <= 9; s++) { const d = len * s / 9; ctx.lineTo(x0 + Math.cos(a) * d + (Math.random() - .5) * 22, y0 + Math.sin(a) * d + (Math.random() - .5) * 22); } ctx.stroke(); };
  function draw(t) {
    if (!alive) return;
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    const cx = CX ?? W / 2, cy = CY ?? H / 2, M = Math.min(W, H);
    if (inner && style === 'fountain') { const g = ctx.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0), f = .5 + Math.sin(t / 400) * .15; g.addColorStop(0, 'rgba(255,220,140,0)'); g.addColorStop(.5, `rgba(255,240,200,${f})`); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(W / 2 - 40, 0, 80, H); }
    if (inner && style === 'wave') { for (let i = 0; i < 3; i++) { const x = W * (.3 + .2 * i) + Math.sin(t / 900 + i) * 30, g = ctx.createRadialGradient(x, H * .2, 0, x, H * .2, H * .5); g.addColorStop(0, 'rgba(150,240,255,.18)'); g.addColorStop(1, 'rgba(150,240,255,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    if (style === 'thunder' && Math.random() < (inner ? .006 : .004)) { bolts.push({ x: rnd(W * .1, W * .9), y: 0, a: Math.PI / 2 + rnd(-.3, .3), len: H * rnd(.4, .8), life: 1 }); flashT = 1; }
    if (style === 'nova' && inner && Math.random() < .006) bolts.push({ x: rnd(0, W), y: 0, a: Math.PI / 2 + rnd(-.4, .4), len: H * .6, life: 1 });
    if (flashT > 0) { ctx.globalAlpha = flashT * .25; ctx.fillStyle = '#dfe8ff'; ctx.fillRect(0, 0, W, H); flashT -= .08; }
    for (const p of amb) {
      p.x += p.vx; p.y += p.vy; p.a += p.va || 0;
      if (p.t === 'twinkle') { ctx.globalAlpha = .3 + Math.abs(Math.sin(t / 500 + p.a)) * .7; ctx.fillStyle = p.c; star4(p.x, p.y, p.r); continue; }
      if (p.t === 'feather') { p.x += Math.sin(t / 600 + p.a * 3) * .5; feather(p.x, p.y, 3, p.a, .7); }
      else if (p.t === 'star') { ctx.globalAlpha = .4 + Math.abs(Math.sin(t / 300 + p.a)) * .6; ctx.fillStyle = p.c; star4(p.x, p.y, p.r); }
      else if (p.t === 'ember') { p.x += Math.sin(t / 400 + p.a) * .5; const k = Math.max(0, Math.min(1, p.y / H)); ctx.globalAlpha = k; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.5 + k * .6), 0, 6.28); ctx.fill(); }
      else if (p.t === 'bubble') { p.x += Math.sin(t / 500 + p.a) * .4; ctx.globalAlpha = .7; ctx.strokeStyle = p.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke(); }
      else if (p.t === 'flake') { p.x += Math.sin(t / 900 + p.a) * .3; ctx.globalAlpha = .85; ctx.strokeStyle = p.c; flake(p.x, p.y, p.r, p.a); }
      else if (p.t === 'petal') { p.x += Math.sin(t / 700 + p.a) * .6; ctx.globalAlpha = .85; petal(p.x, p.y, p.r, p.a, p.c); }
      else { ctx.globalAlpha = .6; ctx.strokeStyle = p.c; ctx.lineWidth = p.r; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); ctx.stroke(); }
      if (p.y > H + 14 || p.y < -14 || p.x < -20 || p.x > W + 20) Object.assign(p, spawn(false));
    }
    if (rayb) {
      rayb.k += .02;
      if (rayb.k >= 1) rayb = null;
      else { const e = 1 - Math.pow(1 - rayb.k, 3), L = M * 1.1 * e; ctx.globalAlpha = 1 - rayb.k; ctx.fillStyle = rayb.c; for (let i = 0; i < 28; i++) { const a = i * Math.PI * 2 / 28 + rayb.k * .5, w = i % 2 ? .02 : .045; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - w) * L, cy + Math.sin(a - w) * L); ctx.lineTo(cx + Math.cos(a + w) * L, cy + Math.sin(a + w) * L); ctx.fill(); } }
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]; b.life -= 1 / 16; if (b.life <= 0) { bolts.splice(i, 1); continue; }
      ctx.globalAlpha = b.life; ctx.strokeStyle = style === 'thunder' ? '#fffbe0' : '#efe4ff'; ctx.lineWidth = 2.4; ctx.shadowColor = fam.c1; ctx.shadowBlur = 16;
      boltPath(b.x ?? cx, b.y ?? cy, b.a, b.len); ctx.shadowBlur = 0;
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      if (p.inward) { p.k += p.sp; const e = 1 - p.k * p.k, ang = p.ang + (p.spin || 0) * p.k; ctx.globalAlpha = Math.min(1, p.k * 2); ctx.fillStyle = p.c; star4(cx + Math.cos(ang) * p.rad * e, cy + Math.sin(ang) * p.rad * e, p.r); if (p.k >= 1) fx.splice(i, 1); continue; }
      if (p.delay > 0) { p.delay--; continue; }
      const dr = p.drag ?? .95;
      p.x += p.vx; p.y += p.vy; p.vx *= dr; p.vy = p.vy * dr + p.g; p.life -= 1 / p.max; p.rot = (p.rot || 0) + (p.vr || 0);
      if (p.wob) p.x += Math.sin(p.life * 20) * p.wob;
      if (p.life <= 0) { fx.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      const sh = p.shape;
      if (sh === 'line') { ctx.strokeStyle = p.c; ctx.lineWidth = p.r; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 4, p.y - p.vy * 4); ctx.lineTo(p.x, p.y); ctx.stroke(); }
      else if (sh === 'flame') { const R = p.r * (1.6 - p.life * .6), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); g.addColorStop(0, 'rgba(255,245,210,.95)'); g.addColorStop(.35, p.c); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 6.28); ctx.fill(); }
      else if (sh === 'coin') { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Math.abs(Math.cos(p.rot)) + .08, 1); ctx.fillStyle = '#f2c45a'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#fff4d2'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      else if (sh === 'shard') { ctx.globalCompositeOperation = 'source-over'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.fill; ctx.strokeStyle = p.c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-p.r, -p.r * .6); ctx.lineTo(p.r, -p.r * .2); ctx.lineTo(-p.r * .2, p.r); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.globalCompositeOperation = 'lighter'; }
      else if (sh === 'feather') feather(p.x, p.y, p.r * .45, p.rot, Math.max(0, p.life));
      else if (sh === 'bubble') { ctx.strokeStyle = p.c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .25, 0, 6.28); ctx.fill(); }
      else if (sh === 'flake') { ctx.strokeStyle = p.c; flake(p.x, p.y, p.r, p.rot); }
      else if (sh === 'petal') petal(p.x, p.y, p.r, p.rot, p.c);
      else if (sh === 'star') { ctx.fillStyle = p.c; star4(p.x, p.y, p.r * p.life + .3); }
      else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + .3, 0, 6.28); ctx.fill(); }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      if (r.delay > 0) { r.delay--; continue; }
      r.r += (r.max - r.r) * .07 + 1; r.a -= .02;
      if (r.a <= 0) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, r.a); ctx.strokeStyle = r.c; ctx.lineWidth = r.w * Math.min(1, r.a); ctx.beginPath(); ctx.ellipse(cx, cy, r.r, r.r * .9, 0, 0, 6.28); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!REDUCE) raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  const push = (o) => fx.push(o);
  return {
    setCenter(x, y) { CX = x; CY = y; },
    stop() { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); },
    burst(kind = style, rich = true) {
      const cx = CX ?? W / 2, cy = CY ?? H / 2, M = Math.min(W, H), sc = Math.max(.5, Math.min(1, M / 450)), n = rich ? 1 : .5;
      const radialP = (count, smin, smax, o) => { for (let i = 0; i < count * n; i++) { const a = rnd(0, 6.28), s = rnd(smin, smax) * sc; push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, max: rnd(50, 110), c: pick(), ...o(a, s) }); } };
      if (kind === 'nova') {
        radialP(180, 6, 20, () => ({ g: 0, drag: .965, shape: 'line', r: rnd(1, 2.6), max: rnd(40, 80) }));
        radialP(60, 1, 6, () => ({ g: 0, shape: 'star', r: rnd(1.5, 3.5), max: rnd(70, 130) }));
        ['#ffffff', '#ff9ae0', '#9ae8ff', '#ffd86a', '#c8b0ff'].forEach((c, i) => rings.push({ r: 0, max: M * (.3 + i * .08), a: 1.2, w: 9 - i, c, delay: i * 5 }));
        for (let i = 0; i < 7; i++) bolts.push({ a: rnd(0, 6.28), len: M * rnd(.4, .7), life: 1 });
        rayb = { k: 0, c: 'rgba(220,200,255,.35)' };
      } else if (kind === 'fire') {
        radialP(120, 2, 9, () => ({ x: cx + rnd(-20, 20), y: cy + rnd(-20, 20), g: -.1 * sc, drag: .93, shape: 'flame', r: rnd(8, 20) * sc, c: pick(['rgba(255,170,60,.85)', 'rgba(255,110,30,.8)', 'rgba(255,70,20,.7)']), max: rnd(35, 70) }));
        radialP(90, 3, 12, () => ({ g: -.05, shape: 'dot', r: rnd(1, 3), max: rnd(60, 120) }));
        rings.push({ r: 20, max: M * .6, a: 1.2, w: 8, c: '#ffcf5a' }, { r: 0, max: M * .45, a: 1.3, w: 4, c: '#ff5a1a', delay: 5 });
        rayb = { k: 0, c: 'rgba(255,140,60,.35)' };
      } else if (kind === 'wave') {
        radialP(130, 1, 6, (a, s) => ({ vy: Math.sin(a) * s - rnd(2, 6), g: -.04, drag: .97, wob: .8, shape: 'bubble', r: rnd(2, 7), max: rnd(70, 140) }));
        radialP(90, 4, 13, () => ({ g: .28, drag: .97, shape: 'dot', r: rnd(1.2, 3), max: rnd(50, 90) }));
        ['#ffffff', '#7ae8f0', '#2a8aff'].forEach((c, i) => rings.push({ r: 0, max: M * (.35 + i * .1), a: 1.2, w: 7 - i * 2, c, delay: i * 7 }));
        rayb = { k: 0, c: 'rgba(150,240,255,.3)' };
      } else if (kind === 'ice') {
        radialP(60, 4, 14, () => ({ g: .22, drag: .97, shape: 'shard', fill: 'rgba(225,246,255,.9)', c: '#7ac7f0', r: rnd(5, 13), rot: rnd(0, 6), vr: rnd(-.3, .3), max: rnd(50, 90) }));
        radialP(70, 1, 5, () => ({ g: .02, drag: .98, shape: 'flake', r: rnd(3, 7), rot: rnd(0, 6), vr: rnd(-.05, .05), max: rnd(100, 170) }));
        radialP(40, 2, 8, () => ({ g: 0, shape: 'star', r: rnd(1.5, 3), max: rnd(50, 90) }));
        rings.push({ r: 20, max: M * .6, a: 1.2, w: 7, c: '#ffffff' }, { r: 0, max: M * .45, a: 1.3, w: 3, c: '#9ae8ff', delay: 5 });
        rayb = { k: 0, c: 'rgba(220,245,255,.4)' };
      } else if (kind === 'bloom') {
        radialP(130, 3, 10, () => ({ g: .03, drag: .96, shape: 'petal', r: rnd(4, 8), rot: rnd(0, 6), vr: rnd(-.15, .15), max: rnd(80, 150) }));
        radialP(70, 1, 6, () => ({ g: -.01, shape: 'dot', r: rnd(1, 2.4), c: fam.c3, max: rnd(70, 130) }));
        rings.push({ r: 20, max: M * .6, a: 1.2, w: 6, c: fam.c3 }, { r: 0, max: M * .45, a: 1.3, w: 3, c: fam.c1, delay: 5 });
        rayb = { k: 0, c: 'rgba(230,250,170,.35)' };
      } else if (kind === 'thunder') {
        for (let i = 0; i < 12; i++) bolts.push({ a: rnd(0, 6.28), len: M * rnd(.4, .8), life: 1 + i * .05 });
        for (let i = 0; i < 100 * n; i++) push({ x: rnd(0, W), y: rnd(-H * .5, 0), vx: -2, vy: rnd(12, 18), g: 0, drag: 1, shape: 'line', r: 1, c: 'rgba(200,220,255,.7)', life: 1, max: rnd(40, 70) });
        radialP(70, 3, 12, () => ({ g: 0, shape: 'star', r: rnd(1.5, 3.2), max: rnd(40, 80) }));
        rings.push({ r: 20, max: M * .6, a: 1.2, w: 7, c: '#ffe86a' }, { r: 0, max: M * .45, a: 1.3, w: 4, c: '#7ab0ff', delay: 5 });
        flashT = 1; rayb = { k: 0, c: 'rgba(220,230,255,.35)' };
      } else {
        const gold = fam.burst === 'fountain' && rich;
        radialP(160, 3, 11, (a, s) => ({ vy: Math.sin(a) * s - 3 * sc, g: .16 * sc, drag: .97, shape: gold && Math.random() < .35 ? 'coin' : 'star', r: rnd(1.5, 4), rot: rnd(0, 6), vr: rnd(.1, .3), max: rnd(60, 120) }));
        if (gold) for (let i = 0; i < 18; i++) push({ x: cx + rnd(-30, 30), y: cy, vx: rnd(-3, 3), vy: rnd(-6, -2), g: .03, drag: .98, shape: 'feather', r: rnd(6, 10), rot: rnd(0, 6), vr: rnd(-.05, .05), c: '#fff', life: 1, max: rnd(150, 220) });
        rings.push({ r: 20, max: M * .6, a: 1.2, w: 6, c: pal[0] }, { r: 0, max: M * .45, a: 1.3, w: 3, c: pal[1], delay: 6 });
        rayb = { k: 0, c: gold ? 'rgba(255,236,170,.55)' : 'rgba(255,255,255,.3)' };
      }
    },
    charge(ms) {
      const M = Math.min(W, H);
      const dir = { fountain: [-Math.PI * .9, -Math.PI * .1], fire: [Math.PI * .1, Math.PI * .9], bloom: [Math.PI * .1, Math.PI * .9] }[style];
      const spin = style === 'nova' ? 2.6 : style === 'wave' ? 1.6 : 0;
      for (let i = 0; i < 110; i++) setTimeout(() => { if (!alive) return; push({ inward: true, ang: dir ? rnd(dir[0], dir[1]) : rnd(0, 6.28), spin, rad: rnd(M * .35, M * .65), k: 0, sp: rnd(.02, .035), r: rnd(.8, 2.2), c: pick() }); }, Math.random() * ms * .85);
      if (style === 'thunder') for (let i = 0; i < 5; i++) setTimeout(() => { if (alive) { bolts.push({ x: rnd(0, W), y: 0, a: Math.PI / 2 + rnd(-.3, .3), len: H * rnd(.3, .6), life: 1 }); flashT = .7; } }, ms * (.2 + i * .16));
    },
    shatter(rect) {
      const cx = CX ?? W / 2, cy = CY ?? H / 2, hw = (rect ? rect.w : W * .5) / 2, hh = (rect ? rect.h : H * .5) / 2;
      const [fill, edge] = fam.shard || ['#2a0806', '#ffb02a'];
      for (let i = 0; i < 46; i++) { const x = cx + rnd(-hw, hw), y = cy + rnd(-hh, hh); push({ x, y, vx: (x - cx) * .06 + rnd(-2, 2), vy: (y - cy) * .04 - rnd(2, 6), g: .35, drag: .98, shape: 'shard', fill, c: edge, r: rnd(6, 16), rot: rnd(0, 6), vr: rnd(-.3, .3), life: 1, max: rnd(50, 80) }); }
    },
  };
}
function useParticles(ref, fam, opts, on = true) {
  useEffect(() => {
    if (!on || !ref.current || typeof window === 'undefined') return undefined;
    const e = particleEngine(ref.current, fam, opts);
    return () => e.stop();
  }, [on, fam]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ---------- Звук ----------
let AC = null, MASTER = null, VERB = null;
function ac() {
  if (AC) return AC;
  const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!C) return null;
  AC = new C();
  const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(AC.destination);
  MASTER = AC.createGain(); MASTER.gain.value = .9; MASTER.connect(comp);
  const n = AC.sampleRate * 3, ir = AC.createBuffer(2, n, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  VERB = AC.createConvolver(); VERB.buffer = ir; const vg = AC.createGain(); vg.gain.value = .4; VERB.connect(vg).connect(comp);
  return AC;
}
function env(g, T, dur, vol, attack, rise) {
  g.gain.setValueAtTime(.0001, T);
  if (rise) { g.gain.exponentialRampToValueAtTime(vol, T + dur * .95); g.gain.linearRampToValueAtTime(0, T + dur); }
  else { g.gain.exponentialRampToValueAtTime(vol, T + attack); g.gain.exponentialRampToValueAtTime(.0001, T + dur); }
}
function route(node, wet) { node.connect(MASTER); if (wet) { const w = AC.createGain(); w.gain.value = wet; node.connect(w).connect(VERB); } }
function distCurve(k) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
function tone(f, t0, dur, o = {}) {
  const a = AC, T = a.currentTime + t0, osc = a.createOscillator(), g = a.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, T); if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, T + dur);
  if (o.detune) osc.detune.value = o.detune;
  if (o.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = o.vib; lg.gain.value = f * (o.vibDepth || .012); l.connect(lg).connect(osc.frequency); l.start(T); l.stop(T + dur + .1); }
  let node = osc;
  if (o.lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(o.lp, T); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, T + dur); node.connect(fl); node = fl; }
  if (o.dist) { const ws = a.createWaveShaper(); ws.curve = distCurve(o.dist); node.connect(ws); node = ws; }
  node.connect(g); env(g, T, dur, o.vol ?? .2, o.attack ?? .02, o.rise); route(g, o.wet ?? .3);
  osc.start(T); osc.stop(T + dur + .1);
}
function noise(t0, dur, o = {}) {
  const a = AC, n = Math.max(1, Math.floor(a.sampleRate * dur)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(), T = a.currentTime + t0;
  s.buffer = buf; fl.type = o.ft || 'bandpass'; fl.Q.value = o.Q ?? 1.2;
  fl.frequency.setValueAtTime(o.f0 || 1000, T); fl.frequency.exponentialRampToValueAtTime(o.f1 || o.f0 || 1000, T + dur);
  s.connect(fl).connect(g); env(g, T, dur, o.vol ?? .2, o.attack ?? .005, o.rise); route(g, o.wet ?? .2);
  s.start(T); s.stop(T + dur);
}
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
/** Партитура раскрытия. family: holy|cosmos|dragon|ocean|frost|nature|storm|chime; phase: charge|boom. */
export function revealSfx(family, phase) {
  try {
    if (!ac()) return;
    if (AC.state === 'suspended') AC.resume();
    if (family === 'chime' || family === 'epic') {
      const notes = family === 'epic' ? [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53] : [783.99, 987.77, 1174.66, 1567.98];
      notes.forEach((f, i) => { tone(f, i * .06, 1.4, { type: 'triangle', vol: .07, attack: .005, wet: .6 }); tone(f * 2, i * .06, .6, { vol: .02, attack: .005, wet: .6 }); });
      if (family === 'epic') noise(0, .5, { vol: .06, ft: 'highpass', f0: 6000, f1: 9000, wet: .5 });
      return;
    }
    const charge = phase === 'charge';
    if (family === 'holy') {
      if (charge) {
        [261.63, 329.63, 392, 523.25, 659.25].forEach(f => { tone(f, 0, 1.75, { vol: .06, rise: true, vib: 5, wet: .8 }); tone(f, 0, 1.75, { type: 'triangle', vol: .03, rise: true, detune: 8, vib: 4.6, wet: .8 }); });
        PENTA.forEach((f, i) => tone(f, i * .14, .5, { type: 'triangle', vol: .05 + i * .004, attack: .004, wet: .7 }));
        noise(0, 1.75, { vol: .05, f0: 5000, f1: 10000, rise: true, wet: .6 });
        return;
      }
      tone(110, 0, 1.6, { vol: .5, slide: 50, attack: .005 }); noise(0, 1, { vol: .25, ft: 'lowpass', f0: 4000, f1: 200 });
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => { tone(f, .02 + i * .03, 3.2, { vol: .07, attack: .004, wet: .9 }); tone(f * 2.76, .02 + i * .03, 1.4, { vol: .015, attack: .002, wet: .9 }); });
      [261.63, 329.63, 392, 523.25].forEach(f => tone(f, .05, 3, { type: 'triangle', vol: .05, attack: .3, vib: 5, wet: .9 }));
      for (let i = 0; i < 14; i++) tone(2093 * Math.pow(2, Math.floor(Math.random() * 12) / 12), .25 + i * .06, .5, { vol: .025, attack: .002, wet: .8 });
      return;
    }
    if (family === 'cosmos') {
      if (charge) {
        tone(40, 0, 1.75, { vol: .35, slide: 70, rise: true });
        tone(55, 0, 1.75, { type: 'sawtooth', vol: .08, slide: 220, rise: true, lp: 200, lpTo: 4000, wet: .5 });
        tone(58, 0, 1.75, { type: 'sawtooth', vol: .06, slide: 230, rise: true, lp: 200, lpTo: 4000, detune: 12, wet: .5 });
        noise(0, 1.75, { vol: .14, f0: 200, f1: 9000, rise: true, wet: .5 });
        for (let i = 0; i < 10; i++) tone(1500 + Math.random() * 3000, Math.random() * 1.5, .08, { vol: .03, attack: .002, wet: .8 });
        return;
      }
      tone(90, 0, 2.4, { vol: .6, slide: 25, attack: .004 });
      noise(0, 2.2, { vol: .3, ft: 'highpass', f0: 8000, f1: 300, Q: .7, wet: .5 });
      tone(3200, 0, .35, { vol: .06, slide: 180, wet: .4 });
      [220, 277.18, 329.63, 440, 493.88, 659.25].forEach(f => { tone(f, .05, 3.6, { type: 'sawtooth', vol: .03, attack: .08, lp: 2400, lpTo: 600, detune: -9, wet: .9 }); tone(f, .05, 3.6, { type: 'sawtooth', vol: .03, attack: .08, lp: 2400, lpTo: 600, detune: 9, wet: .9 }); });
      [880, 1108.73, 1318.51, 1760, 2217.46, 2637.02, 3520].forEach((f, i) => tone(f, .3 + i * .08, .9, { vol: .035, attack: .003, wet: .9 }));
      return;
    }
    if (family === 'dragon') {
      if (charge) {
        noise(0, 1.75, { vol: .3, ft: 'lowpass', f0: 120, f1: 400, rise: true });
        [0, .55, .95, 1.25, 1.45, 1.6].forEach(t => tone(62, t, .22, { vol: .45, slide: 40, attack: .005 }));
        for (let i = 0; i < 26; i++) noise(Math.random() * 1.6, .03, { vol: .08, ft: 'highpass', f0: 2500, f1: 4000 });
        return;
      }
      tone(150, 0, 1.6, { type: 'sawtooth', vol: .16, slide: 65, dist: 40, lp: 1600, lpTo: 300, vib: 28, vibDepth: .06, wet: .5 });
      tone(110, .03, 1.5, { type: 'square', vol: .1, slide: 50, dist: 25, lp: 900, lpTo: 200, vib: 33, vibDepth: .05, wet: .5 });
      noise(0, 1.6, { vol: .3, f0: 900, f1: 200, Q: .8, wet: .4 });
      tone(70, 0, .9, { vol: .65, slide: 28, attack: .004 }); noise(0, .7, { vol: .35, ft: 'lowpass', f0: 3000, f1: 100 });
      [146.83, 220, 293.66, 349.23, 440].forEach(f => tone(f, .25, 2.8, { type: 'sawtooth', vol: .035, attack: .12, lp: 1400, lpTo: 500, wet: .8 }));
      for (let i = 0; i < 30; i++) noise(.2 + Math.random() * 2, .03, { vol: .06, ft: 'highpass', f0: 2500, f1: 4000 });
      return;
    }
    if (family === 'ocean') {
      if (charge) {
        // глубина: прибой нарастает, пузыри, протяжная песня кита
        noise(0, 1.75, { vol: .22, ft: 'lowpass', f0: 200, f1: 1200, rise: true, wet: .6 });
        tone(180, 0, 1.6, { vol: .08, slide: 360, vib: 3, vibDepth: .03, attack: .4, wet: .9 });
        tone(240, .5, 1.2, { vol: .06, slide: 160, vib: 4, vibDepth: .03, attack: .3, wet: .9 });
        for (let i = 0; i < 18; i++) { const f = 400 + Math.random() * 900; tone(f, Math.random() * 1.6, .07, { vol: .05, slide: f * 2.2, attack: .003, wet: .5 }); }
        return;
      }
      tone(80, 0, 1.8, { vol: .5, slide: 35, attack: .01 });
      noise(0, 2.4, { vol: .32, ft: 'lowpass', f0: 3000, f1: 200, wet: .6 });
      [196, 246.94, 293.66, 392, 493.88].forEach((f, i) => tone(f, .05 + i * .02, 3.4, { type: 'triangle', vol: .055, attack: .15, vib: 3, wet: .9 }));
      [987.77, 1174.66, 1479.98, 1975.53, 2349.32].forEach((f, i) => tone(f, .25 + i * .1, 1, { vol: .03, attack: .004, wet: .9 }));
      for (let i = 0; i < 24; i++) { const f = 500 + Math.random() * 1200; tone(f, .1 + Math.random() * 1.6, .06, { vol: .04, slide: f * 2.4, attack: .003, wet: .5 }); }
      tone(320, .4, 2.2, { vol: .05, slide: 210, vib: 3.5, vibDepth: .04, attack: .5, wet: 1 });
      return;
    }
    if (family === 'frost') {
      if (charge) {
        // мороз: ветер, звон льдинок, нарастающий хрустальный гул
        noise(0, 1.75, { vol: .14, ft: 'bandpass', f0: 600, f1: 3000, Q: 2, rise: true, wet: .7 });
        for (let i = 0; i < 14; i++) tone(2000 + Math.random() * 3000, i * .11, .25, { vol: .03, attack: .002, wet: .9 });
        for (let i = 0; i < 20; i++) noise(Math.random() * 1.6, .02, { vol: .07, ft: 'highpass', f0: 4000, f1: 6000 });
        tone(880, 0, 1.75, { type: 'triangle', vol: .04, slide: 1760, rise: true, wet: .8 });
        return;
      }
      tone(100, 0, 1.2, { vol: .45, slide: 45, attack: .004 });
      noise(0, .5, { vol: .3, ft: 'highpass', f0: 5000, f1: 2000 });
      for (let i = 0; i < 30; i++) noise(Math.random() * .6, .02, { vol: .09, ft: 'highpass', f0: 3500, f1: 7000 });
      [1318.51, 1567.98, 1975.53, 2637.02, 3135.96, 3951.07].forEach((f, i) => { tone(f, .04 + i * .05, 2.4, { vol: .045, attack: .002, wet: 1 }); tone(f * 1.5, .04 + i * .05, 1, { vol: .012, attack: .002, wet: 1 }); });
      [329.63, 493.88, 659.25, 987.77].forEach(f => tone(f, .1, 3, { type: 'triangle', vol: .04, attack: .2, wet: .9 }));
      return;
    }
    if (family === 'nature') {
      if (charge) {
        // лес просыпается: ветер в листве, птицы, флейта поднимается
        noise(0, 1.75, { vol: .1, ft: 'bandpass', f0: 800, f1: 2400, Q: .6, rise: true, wet: .6 });
        for (let i = 0; i < 6; i++) { const t = .2 + i * .25, f = 2200 + Math.random() * 1500; tone(f, t, .09, { vol: .04, slide: f * 1.4, attack: .003, wet: .7 }); tone(f * 1.2, t + .1, .09, { vol: .035, slide: f, attack: .003, wet: .7 }); }
        [392, 440, 523.25, 587.33, 659.25, 783.99].forEach((f, i) => tone(f, i * .25, .45, { vol: .05, vib: 5.5, vibDepth: .01, attack: .05, wet: .8 }));
        return;
      }
      tone(98, 0, 1.4, { vol: .4, slide: 49, attack: .006 });
      noise(0, 1.2, { vol: .18, ft: 'lowpass', f0: 2500, f1: 300, wet: .5 });
      [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) => tone(f, .04 + i * .03, 3, { type: 'triangle', vol: .055, attack: .08, vib: 5, wet: .9 }));
      [1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02].forEach((f, i) => tone(f, .3 + i * .09, .6, { vol: .035, vib: 6, vibDepth: .008, attack: .01, wet: .9 }));
      for (let i = 0; i < 5; i++) { const t = .6 + i * .3, f = 2600 + Math.random() * 1200; tone(f, t, .08, { vol: .035, slide: f * 1.5, attack: .003, wet: .7 }); }
      return;
    }
    // storm
    if (charge) {
      // буря: ливень, далёкие раскаты, электрический треск нарастает
      noise(0, 1.75, { vol: .18, ft: 'highpass', f0: 2000, f1: 3000, rise: true, wet: .4 });
      [.3, .9, 1.3].forEach(t => noise(t, .9, { vol: .2, ft: 'lowpass', f0: 300, f1: 80 }));
      tone(60, 0, 1.75, { type: 'sawtooth', vol: .06, slide: 240, rise: true, lp: 300, lpTo: 3000, wet: .4 });
      for (let i = 0; i < 16; i++) noise(Math.random() * 1.7, .015, { vol: .08, ft: 'highpass', f0: 5000, f1: 8000 });
      return;
    }
    noise(0, .15, { vol: .5, ft: 'highpass', f0: 6000, f1: 1500 });
    noise(.05, 2.8, { vol: .45, ft: 'lowpass', f0: 1200, f1: 50, wet: .5 });
    tone(55, 0, 2.2, { vol: .5, slide: 28, attack: .004 });
    tone(2400, 0, .3, { type: 'sawtooth', vol: .04, slide: 120, dist: 20, wet: .3 });
    [146.83, 220, 277.18, 329.63, 440].forEach(f => tone(f, .2, 3, { type: 'sawtooth', vol: .03, attack: .1, lp: 1800, lpTo: 500, detune: 6, wet: .9 }));
    [880, 1108.73, 1318.51, 1760].forEach((f, i) => tone(f, .5 + i * .1, .7, { type: 'square', vol: .012, attack: .003, lp: 3000, wet: .8 }));
  } catch (e) { /* звук не обязателен */ }
}

// ---------- Коллекционная карта ----------
function ArtCenter({ art, icon, node, size }) {
  if (node) return <div style={{ transform: 'scale(1.6)' }}>{node}</div>;
  if (art && hasItemArt(art)) return <ItemArt id={art} size={size} />;
  return <span style={{ fontSize: size * .62, lineHeight: 1, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.5))' }}>{icon || '✦'}</span>;
}
function useTilt(ref, idle = true) {
  useEffect(() => {
    const el = ref.current; if (!el || REDUCE) return undefined;
    let tg = null, raf = 0; const cur = { rx: 0, ry: 0 }, ph = Math.random() * 6;
    const mv = (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; tg = { rx: (.5 - y) * 24, ry: (x - .5) * 24 }; };
    const lv = () => { tg = null; };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    const loop = (t) => {
      const g = tg || (idle ? { rx: Math.sin(t / 1700 + ph) * 5, ry: Math.cos(t / 2300 + ph) * 8 } : { rx: 0, ry: 0 });
      cur.rx += (g.rx - cur.rx) * .1; cur.ry += (g.ry - cur.ry) * .1;
      el.style.setProperty('--rx', cur.rx.toFixed(2) + 'deg'); el.style.setProperty('--ry', cur.ry.toFixed(2) + 'deg');
      el.style.setProperty('--px', (cur.ry / 12).toFixed(3)); el.style.setProperty('--py', (-cur.rx / 12).toFixed(3));
      el.style.setProperty('--mx', (50 + cur.ry * 3).toFixed(1) + '%'); el.style.setProperty('--my', (50 - cur.rx * 3).toFixed(1) + '%');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }, [ref, idle]);
}

/** Карта легендарного/мифического предмета: рамка темы, крылья, герб, живой фон, голо-блик, существо на орбите (миф). */
export function CollectibleCard({ rarity = 'Legendary', theme, art, icon, node, width = 240, tilt = true, style }) {
  useRevealCss();
  const ids = useUid(), fam = familyOf(theme, rarity), myth = rarity === 'Mythic';
  const ref = useRef(null), cv = useRef(null);
  useTilt(ref, tilt);
  useParticles(cv, fam, { mode: 'inner', density: .8 });
  const glow = fam.holo ? `conic-gradient(from 0deg, ${fam.frame.join(', ')}, ${fam.frame[0]})` : `radial-gradient(circle, ${fam.c1}bb, transparent 65%)`;
  return (
    <div ref={ref} className="rv-card" style={{ width, ...style }}>
      <div className="rv-tilt">
        {myth && <div dangerouslySetInnerHTML={{ __html: orbitSVG(fam, 'back', ORBIT_CARD, ids) }} />}
        <div className="rv-cc">
          <div className={'rv-glow' + (fam.holo ? ' rv-hue' : '')} style={{ background: glow }} />
          <div className="rv-body" style={{ background: fam.bg }}>
            <canvas ref={cv} />
            <div className="rv-art"><div><ArtCenter art={art} icon={icon} node={node} size={width * .5} /></div></div>
            {fam.holo && <div className="rv-holo" />}
            <div className="rv-sheen" /><div className="rv-glare" />
          </div>
          <svg className="rv-svg" viewBox="-10 -40 300 450" aria-hidden="true" dangerouslySetInnerHTML={{ __html: frameSVG(fam, ids, rarity) }} />
        </div>
        {myth && <div dangerouslySetInnerHTML={{ __html: orbitSVG(fam, 'front', ORBIT_CARD, ids) }} />}
      </div>
    </div>
  );
}

// ---------- Табличка титула ----------
const PL = (cx, cy, w, h, n) => `M${cx - w / 2} ${cy - h / 2} H${cx + w / 2} L${cx + w / 2 + n} ${cy} L${cx + w / 2} ${cy + h / 2} H${cx - w / 2} L${cx - w / 2 - n} ${cy} Z`;
const sheenT = (id, d, dur = 3.4, op = .6) => `<clipPath id="${id}sc"><path d="${d}"/></clipPath>${grad(id + 'sg', ['rgba(255,255,255,0)', `rgba(255,255,255,${op})`, 'rgba(255,255,255,0)'])}<g clip-path="url(#${id}sc)"><rect y="0" width="44" height="120" fill="url(#${id}sg)" transform="skewX(-22)"><animate attributeName="x" values="40;440;440" keyTimes="0;.45;1" dur="${dur}s" repeatCount="indefinite"/></rect></g>`;
const TOP_DECO = {
  dragon: (fam, ids) => Array.from({ length: 13 }, (_, k) => { const x = 94 + k * 12.7, h = 14 + (k % 3) * 8 + (k === 6 ? 6 : 0); return `<path d="M${f1(x - 7)} 54 Q${f1(x - 6)} ${f1(54 - h * .6)} ${f1(x)} ${54 - h} Q${f1(x + 6)} ${f1(54 - h * .6)} ${f1(x + 7)} 54 Z" fill="url(#${ids}fire)" class="rv-flick" style="animation-duration:${(.6 + (k % 4) * .12).toFixed(2)}s;animation-delay:-${(k * .13).toFixed(2)}s"/>`; }).join(''),
  ocean: (fam, ids) => `<g><path d="M70 56 q10 -10 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="${fam.c3}" stroke-width="2.4" stroke-linecap="round" opacity=".85"><animateTransform attributeName="transform" type="translate" values="0 0;-20 0" dur="1.6s" repeatCount="indefinite"/></path></g>${[110, 150, 200, 236].map((x, i) => `<circle cx="${x}" cy="48" r="${2 + i % 2}" fill="none" stroke="#fff" stroke-width="1"><animate attributeName="cy" values="52;20" dur="${2 + i * .4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${2 + i * .4}s" repeatCount="indefinite"/></circle>`).join('')}`,
  frost: (fam) => [96, 116, 140, 162, 184, 206, 228, 246].map((x, i) => `<path d="M${x - 4} 88 L${x} ${96 + (i % 3) * 6} L${x + 4} 88 Z" fill="#e8fbff" stroke="${fam.c1}" stroke-width=".6" opacity=".9"/>`).join(''),
  nature: (fam) => `<path d="M72 60 Q100 44 130 56 Q160 46 170 52 Q180 46 210 56 Q240 44 268 60" fill="none" stroke="#3a6a2a" stroke-width="2"/>${[86, 112, 140, 200, 228, 254].map((x, i) => `<ellipse cx="${x}" cy="${50 - (i % 2) * 4}" rx="6" ry="3" fill="${i % 2 ? fam.pal[3] : fam.c1}" transform="rotate(${i % 2 ? 30 : -30} ${x} ${50 - (i % 2) * 4})" class="rv-pulse" style="animation-delay:-${i * .3}s"/>`).join('')}`,
  storm: (fam) => [90, 128, 212, 250].map((x, i) => `<path d="M${x} 30 L${x - 6} 44 L${x} 44 L${x - 4} 56" fill="none" stroke="${fam.c3}" stroke-width="2" class="rv-zap" style="animation-delay:-${i * .6}s;filter:drop-shadow(0 0 4px ${fam.c3})"/>`).join(''),
};
function titleDeco(tier, fam, ids) {
  const CX = 170, CY = 70;
  if (tier === 'common') return `<rect x="104" y="57" width="132" height="26" rx="6" fill="#f4f1ea" stroke="#cfc8b8"/>`;
  if (tier === 'rare') {
    const o = PL(CX, CY, 150, 30, 12), i = PL(CX, CY, 142, 23, 9);
    return `<defs>${grad(ids + 'rr', ['#2b7a84', '#bff4fa', '#2b7a84', '#9fe7ee', '#2b7a84'])}</defs>
      <path d="M68 70 L60 62 M68 70 L60 78 M60 70 L52 62 M60 70 L52 78" stroke="#4aa6b0" stroke-width="2" stroke-linecap="round"/>
      <path d="M272 70 L280 62 M272 70 L280 78 M280 70 L288 62 M280 70 L288 78" stroke="#4aa6b0" stroke-width="2" stroke-linecap="round"/>
      <path d="${o}" fill="url(#${ids}rr)"/><path d="${i}" fill="#0f2e34"/>${sheenT(ids + 'r', i, 5, .35)}`;
  }
  if (tier === 'epic') {
    const o = PL(CX, CY, 190, 34, 14), i = PL(CX, CY, 181, 26, 10);
    const shard = (x, dl) => `<g class="rv-float" style="animation-delay:${dl}s"><path d="M${x} 46 L${x + 9} 68 L${x} 94 L${x - 9} 68 Z" fill="url(#${ids}ec)" stroke="#ffd0ec" stroke-width="1" style="filter:drop-shadow(0 0 6px #ff7ad8)"/><path d="M${x} 46 L${x + 9} 68 L${x} 70 Z" fill="#fff" opacity=".5"/></g>`;
    return `<defs>${grad(ids + 'eg', ['#6a1e5a', '#ffd0ec', '#a83e86', '#ffd0ec', '#6a1e5a'])}${grad(ids + 'ec', ['#ffffff', '#ff9ae0', '#8a3aff'], 0, 1)}${glowF(ids + 'egl', 3)}</defs>
      ${shard(48, 0)}${shard(292, -1.8)}<path d="${o}" fill="url(#${ids}eg)" filter="url(#${ids}egl)"/><path d="${i}" fill="#2a0a24"/>
      <path d="${PL(CX, CY, 174, 21, 8)}" fill="none" stroke="#ffd0ec" stroke-opacity=".45"/>
      <path d="M170 45 L177 53 L170 61 L163 53 Z" fill="url(#${ids}ec)" stroke="#fff" stroke-width=".8" class="rv-pulse"/>
      ${sheenT(ids + 'e', i, 3.8, .45)}${[[92, 48], [250, 92], [118, 96], [228, 46]].map(([x, y], k) => spark(x, y, 4, '#ff7ad8', k)).join('')}`;
  }
  const o = PL(CX, CY, 196, 40, 16), i = PL(CX, CY, 186, 32, 12), ln = PL(CX, CY, 178, 26, 9);
  const myth = tier === 'myth';
  const w = fam.wing === 'bat' ? wings(fam, ids, CX, 80, 62, 70) : wings(fam, ids, CX, 80, 60, myth ? 80 : 74, { n: myth ? 8 : 7 });
  const topFn = TOP_DECO[fam.crest === 'dragon' ? 'dragon' : fam.sound], top = topFn ? topFn(fam, ids) : '';
  const inside = myth
    ? `<rect width="340" height="120" fill="${fam.plate}"/><g filter="url(#${ids}bl)">
        <circle cx="110" cy="70" r="26" fill="${fam.pal[1]}" opacity=".85"><animate attributeName="cx" values="100;240;100" dur="9s" repeatCount="indefinite"/></circle>
        <circle cx="230" cy="66" r="22" fill="${fam.pal[2]}" opacity=".7"><animate attributeName="cx" values="240;105;240" dur="11s" repeatCount="indefinite"/></circle>
        <circle cx="170" cy="82" r="18" fill="${fam.pal[3] || fam.c1}" opacity=".6"><animate attributeName="cx" values="170;115;235;170" dur="7s" repeatCount="indefinite"/></circle></g>
        ${Array.from({ length: 18 }, (_, k) => `<circle cx="${80 + (k * 53) % 180}" cy="${56 + (k * 37) % 30}" r="${k % 3 ? .7 : 1.2}" fill="#fff" class="rv-eye" style="animation-delay:-${(k * .23).toFixed(2)}s"/>`).join('')}`
    : `<rect width="340" height="120" fill="url(#${ids}in)"/>`;
  const crestY = fam.crest === 'crown' ? 52 : fam.crest === 'halo' ? 40 : 44;
  return `<defs>${baseDefs(fam, ids)}${grad(ids + 'fire', ['rgba(255,60,10,0)', '#ff5a1a', '#ffcf5a', '#fff4d2'], 0, 1)}${grad(ids + 'rib', [fam.gem[1], fam.gem[2]], 0, 1)}${grad(ids + 'beam', ['rgba(255,255,255,0)', `${fam.c3}`, 'rgba(255,255,255,0)'])}
      <radialGradient id="${ids}in" cx="50%" cy="10%" r="90%"><stop offset="0" stop-color="${fam.c2}"/><stop offset="1" stop-color="${fam.plate}"/></radialGradient>
      <filter id="${ids}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter><clipPath id="${ids}clip"><path d="${i}"/></clipPath></defs>
    ${!myth ? `<rect x="150" y="-34" width="40" height="110" fill="url(#${ids}beam)" opacity=".7" class="rv-pulse"/>` : ''}
    ${top && fam.crest === 'dragon' ? top : ''}
    ${!myth ? `<g class="rv-sway"><path d="M86 78 L112 84 L98 116 L89 106 L75 114 Z" fill="url(#${ids}rib)" stroke="${fam.line}" stroke-width="1.2"/></g><g transform="translate(340 0) scale(-1 1)"><g class="rv-sway"><path d="M86 78 L112 84 L98 116 L89 106 L75 114 Z" fill="url(#${ids}rib)" stroke="${fam.line}" stroke-width="1.2"/></g></g>` : ''}
    <g class="${fam.holo ? 'rv-hue' : ''}">${w}</g>
    <g class="${fam.holo ? 'rv-hue' : ''}"><path d="${o}" fill="url(#${ids}mg)" filter="url(#${ids}gl)"/></g>
    <g clip-path="url(#${ids}clip)">${inside}</g>
    <path d="${ln}" fill="none" stroke="${fam.line}" stroke-opacity=".55"/>
    ${sheenT(ids + 's', i, 3.2, .5)}
    <path d="${o}" fill="none" stroke="${fam.line}" stroke-width="2.2" stroke-dasharray="34 600" class="rv-run" filter="url(#${ids}gl)"/>
    ${[60, 280].map(x => `<circle cx="${x}" cy="70" r="5.5" fill="url(#${ids}gem)" stroke="${fam.line}" stroke-width="1" class="rv-pulse"/>`).join('')}
    ${top && fam.crest !== 'dragon' ? top : ''}
    <g transform="translate(170 ${crestY}) scale(${fam.crest === 'crown' || fam.crest === 'halo' ? .9 : .78})">${crest(fam, ids)}</g>
    ${[[64, 34], [276, 36], [104, 104], [238, 104], [40, 86], [300, 84]].map(([x, y], k) => spark(x, y, 4.5, fam.c1, k)).join('')}`;
}
export function titleTier(rarity) { return ({ Common: 'common', Rare: 'rare', Epic: 'epic', Legendary: 'legend', Mythic: 'myth' })[rarity] || 'common'; }

/** Табличка титула: обычный — подпись, редкий — сталь, эпический — кристалл, легендарный/мифический — живые гербы темы. */
export function TitlePlate({ text, rarity = 'Common', theme, width = 300, onClick, style, label }) {
  useRevealCss();
  const ids = useUid(), tier = titleTier(rarity), fam = familyOf(theme, rarity), big = tier === 'legend' || tier === 'myth';
  const cv = useRef(null);
  useParticles(cv, fam, { mode: 'ambient', density: .35, pal: tier === 'epic' ? ['#ffd0ec', '#ff7ad8', '#c08aff'] : undefined }, big || tier === 'epic');
  const ink = tier === 'epic' ? 'rv-ink-epic' : big ? 'rv-ink-' + fam.ink : '';
  const fs = big ? width * .052 : tier === 'epic' ? width * .046 : width * .045;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} aria-label={label || `Титул «${text}»`} className="rv-tplate lrpg-btn" style={{ width, cursor: onClick ? 'pointer' : 'default', ...style }}>
      {(big || tier === 'epic') && <canvas ref={cv} />}
      {big && <div className="rv-trays" style={{ background: `repeating-conic-gradient(from 0deg, ${fam.rays} 0 3deg, transparent 3deg 12deg)` }} />}
      {tier === 'myth' && <div style={{ inset: 0 }} dangerouslySetInnerHTML={{ __html: orbitSVG(fam, 'back', ORBIT_TITLE, ids) }} />}
      <svg className="rv-svg" viewBox="0 0 340 120" aria-hidden="true" dangerouslySetInnerHTML={{ __html: titleDeco(tier, fam, ids) }} />
      <span className={'rv-ttext rv-t-' + tier + ' ' + ink} style={{ fontSize: fs }}>{text}</span>
      {tier === 'myth' && <div style={{ inset: 0, zIndex: 2 }} dangerouslySetInnerHTML={{ __html: orbitSVG(fam, 'front', ORBIT_TITLE, ids) }} />}
    </Tag>
  );
}

// ---------- Рубашки карт ----------
const CRACKS = ['M0 -18 L-6 -40 L4 -55 L-4 -84', 'M30 -8 L44 -22 L52 -16 L58 -44', 'M32 8 L46 30 L40 46 L58 72', 'M-32 8 L-46 24 L-40 44 L-58 68', 'M-30 -8 L-44 -26 L-54 -18 L-58 -52', 'M0 18 L6 44 L-4 60 L4 86'];
function CardBack({ fam, ids }) {
  const cracks = (col) => CRACKS.map((d, i) => `<path class="rv-crack" d="${d}" pathLength="200" stroke-dasharray="200" stroke-dashoffset="200" fill="none" stroke="${col}" stroke-width="2.4" style="filter:drop-shadow(0 0 4px ${col})"/>`).join('');
  if (fam.back === 'vortex') return (<>
    <div className="rv-vortex" style={{ background: `conic-gradient(from 0deg, transparent, ${fam.vortex[0]}, transparent 25%, ${fam.vortex[1]}, transparent 50%, ${fam.vortex[2]}, transparent 75%, ${fam.vortex[0]})` }} />
    <div className="rv-hole" style={{ background: fam.sound === 'ocean' ? `radial-gradient(circle at 40% 35%, #fff, ${fam.c1} 45%, ${fam.c2})` : '#000', boxShadow: `0 0 0 2px ${fam.hole[0]}, 0 0 24px 4px ${fam.hole[1]}, 0 0 60px 10px ${fam.hole[2]}` }} />
  </>);
  let inner;
  if (fam.back === 'seal') {
    const w = fanWing('feather', '#f2c45a', '#7a4a10', 5, -10, 0, 40);
    inner = `<defs>${radial(ids + 'bg', fam.gem)}</defs><circle r="48" fill="none" stroke="#f2c45a" stroke-width="2"/><circle r="42" fill="none" stroke="#f2c45a" stroke-dasharray="2 4"/>
      <g class="rv-wing">${w}</g><g transform="scale(-1 1)"><g class="rv-wing">${w}</g></g>
      <path d="M-12 -22 L-14 -34 L-6 -28 L0 -38 L6 -28 L14 -34 L12 -22 Z" fill="#f2c45a" stroke="#7a4a10"/>
      <path d="M0 -16 L12 0 L0 18 L-12 0 Z" fill="url(#${ids}bg)" stroke="#fff4d2" stroke-width="1.5" class="rv-pulse"/>`;
    return (<><div className="rv-back-rays" style={{ background: 'repeating-conic-gradient(rgba(255,226,150,.35) 0 4deg, transparent 4deg 15deg)' }} /><svg className="rv-sig" viewBox="-60 -86 120 172" dangerouslySetInnerHTML={{ __html: inner }} /></>);
  }
  if (fam.back === 'eye') inner = `<defs><radialGradient id="${ids}eye"><stop offset="0" stop-color="#fff4a0"/><stop offset=".5" stop-color="#ffb02a"/><stop offset="1" stop-color="#a02a0a"/></radialGradient></defs>${cracks(fam.crack)}
      <path d="M-40 0 Q0 -34 40 0 Q0 34 -40 0 Z" fill="url(#${ids}eye)" stroke="#f2c45a" stroke-width="2" style="filter:drop-shadow(0 0 10px #ff6a1a)"/><ellipse class="rv-pupil" rx="5" ry="22" fill="#140404"/>`;
  else if (fam.back === 'frost') inner = `${cracks(fam.crack)}<g class="rv-spin">${Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60})"><path d="M0 0 L0 -40 M0 -16 L-10 -26 M0 -16 L10 -26 M0 -30 L-7 -37 M0 -30 L7 -37" stroke="#fff" stroke-width="2.6" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ${fam.c1})"/></g>`).join('')}</g><circle r="9" fill="${fam.c1}" stroke="#fff" stroke-width="1.5" class="rv-pulse"/>`;
  else if (fam.back === 'seed') inner = `${cracks(fam.crack)}<ellipse rx="22" ry="30" fill="${fam.c2}" stroke="${fam.c1}" stroke-width="2.5" style="filter:drop-shadow(0 0 12px ${fam.c1})"/><path d="M0 -24 Q10 0 0 24 Q-10 0 0 -24 Z" fill="${fam.c1}" opacity=".7" class="rv-pulse"/><path d="M0 -30 Q8 -44 18 -40 Q8 -34 0 -30 Z" fill="${fam.c1}"/>`;
  else inner = `${cracks(fam.crack)}<g fill="#3a4468" stroke="#7ab0ff" stroke-width="1.2"><circle cx="-16" cy="-6" r="16"/><circle cx="8" cy="-14" r="20"/><circle cx="24" cy="-2" r="14"/><rect x="-30" y="-6" width="66" height="16" rx="8"/></g><path d="M6 6 L-6 26 L2 26 L-4 44 L12 20 L4 20 L10 6 Z" fill="#ffe86a" class="rv-zap" style="filter:drop-shadow(0 0 8px #ffe86a)"/>`;
  return <svg className="rv-sig" viewBox="-60 -86 120 172" dangerouslySetInnerHTML={{ __html: inner }} />;
}

// ---------- Церемония раскрытия ----------
const wait = (ms) => new Promise(r => setTimeout(r, ms));
/**
 * Полноэкранная церемония получения. item: { title, icon, rarity, theme, art, node, sub, lore }.
 * Обычный/редкий — вспышка, эпический — короткий заряд, легендарный/мифический — сценарий темы (рубашка → заряд → взрыв → баннер).
 * extra — что показать под названием (например, табличку нового титула).
 */
export function RevealCeremony({ item, onClose, sound = true, extra, cta = 'Забрать' }) {
  useRevealCss();
  const ids = useUid();
  const rank = rarityRank(item.rarity), big = rank >= 3, epic = rank === 2;
  const fam = familyOf(item.theme, item.rarity);
  const meta = rarityMeta(item.rarity);
  const lowPal = useMemo(() => [meta.c2, meta.c, '#ffffff', '#fbf0d6'], [meta]);
  const [done, setDone] = useState(false);
  const cvRef = useRef(null), stageRef = useRef(null), backRef = useRef(null), cardRef = useRef(null), flashRef = useRef(null), bannerRef = useRef(null), pillarRef = useRef(null), shockRefs = useRef([]);
  const W = typeof window !== 'undefined' ? Math.min(250, window.innerWidth * .62, (window.innerHeight - 230) * .68) : 240;
  useEffect(() => {
    let alive = true;
    const eng = particleEngine(cvRef.current, big ? fam : { ...fam, burst: 'fountain' }, { mode: 'stage', density: big ? .8 : .3, pal: big ? undefined : lowPal });
    const center = () => { const r = stageRef.current.getBoundingClientRect(); eng.setCenter(r.left + r.width / 2, r.top + r.height / 2); return r; };
    const sfx = (ph) => { if (sound) revealSfx(big ? fam.sound : epic ? 'epic' : 'chime', ph); };
    const back = backRef.current, card = cardRef.current;
    async function run() {
      center();
      if (REDUCE) { if (back) back.style.display = 'none'; card.style.visibility = 'visible'; setDone(true); return; }
      if (!big) {
        if (epic) { eng.charge(700); await wait(750); }
        if (!alive) return;
        card.style.visibility = 'visible'; sfx('boom'); eng.burst('fountain', rank >= 1);
        flashRef.current.animate([{ opacity: .7 }, { opacity: 0 }], { duration: 600 });
        await card.animate([{ transform: 'scale(.2)', opacity: 0, filter: 'brightness(3)' }, { transform: 'scale(1.12)', opacity: 1, filter: 'brightness(1.5)', offset: .6 }, { transform: 'none', filter: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,1.3,.4,1)' }).finished;
        if (alive) setDone(true); return;
      }
      const CH = 1650, kind = fam.charge;
      const appear = kind === 'rise' ? [{ transform: 'translateY(-60px) scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }]
        : kind === 'vortex' ? [{ transform: 'scale(0) rotate(-200deg)', opacity: 0 }, { transform: 'none', opacity: 1 }]
          : [{ transform: 'translateY(40px) scale(1.25)', opacity: 0, filter: 'brightness(3)' }, { transform: 'none', opacity: 1, filter: 'none' }];
      await back.animate(appear, { duration: 450, easing: 'cubic-bezier(.2,1.3,.4,1)' }).finished;
      if (!alive) return;
      sfx('charge'); eng.charge(CH);
      if (kind === 'rise') {
        pillarRef.current.animate([{ opacity: 0, transform: 'translateX(-50%) scaleY(0)' }, { opacity: .9, transform: 'translateX(-50%) scaleY(1)', offset: .45 }, { opacity: 1, transform: 'translateX(-50%) scaleY(1) scaleX(1.5)' }], { duration: CH, easing: 'ease-in', fill: 'forwards' });
        await back.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateY(-14px) scale(1.04)', filter: `brightness(1.6) drop-shadow(0 0 30px ${fam.c1})`, offset: .7 }, { transform: 'translateY(-20px) scale(1.08)', filter: 'brightness(3) drop-shadow(0 0 60px #fff4d2)' }], { duration: CH, easing: 'ease-in', fill: 'forwards' }).finished;
        await back.animate([{ transform: 'translateY(-20px) scale(1.08) scaleX(1)' }, { transform: 'translateY(-20px) scale(1.08) scaleX(0)', filter: 'brightness(5)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished;
        pillarRef.current.animate([{ opacity: 1, transform: 'translateX(-50%) scaleX(1.5)' }, { opacity: 0, transform: 'translateX(-50%) scaleX(4)' }], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
      } else if (kind === 'vortex') {
        const v = back.querySelector('.rv-vortex'); if (v) v.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(1440deg)' }], { duration: CH, easing: 'ease-in' });
        await back.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'scale(.9) rotate(-3deg)', filter: 'brightness(1.4) hue-rotate(40deg)', offset: .6 }, { transform: 'scale(.8) rotate(4deg)', filter: 'brightness(2) hue-rotate(100deg)' }], { duration: CH, easing: 'ease-in', fill: 'forwards' }).finished;
        await back.animate([{ transform: 'scale(.8)', filter: 'brightness(2)' }, { transform: 'scale(0) rotate(240deg)', filter: 'brightness(6)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished;
      } else {
        back.querySelectorAll('.rv-crack').forEach((p, i) => p.animate([{ strokeDashoffset: 200, opacity: .3 }, { strokeDashoffset: 0, opacity: 1 }], { duration: CH * .7, delay: i * CH * .05, easing: 'ease-in', fill: 'forwards' }));
        const fr = []; for (let i = 0; i <= 20; i++) { const k = i / 20; fr.push({ transform: `translate(${(Math.random() - .5) * 22 * k}px, ${(Math.random() - .5) * 14 * k}px) rotate(${(Math.random() - .5) * 8 * k}deg)`, filter: `brightness(${1 + k * 1.4}) drop-shadow(0 0 ${10 + k * 50}px ${fam.c1})` }); }
        await back.animate(fr, { duration: CH, easing: 'ease-in' }).finished;
        const r = center(); eng.shatter({ w: r.width * .9, h: r.height * .9 });
        await back.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0, filter: 'brightness(6)' }], { duration: 180, fill: 'forwards' }).finished;
      }
      if (!alive) return;
      back.style.display = 'none'; card.style.visibility = 'visible';
      sfx('boom'); center(); eng.burst();
      flashRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: kind === 'rise' ? 1100 : 800, easing: 'ease-out' });
      shockRefs.current.forEach((el, i) => el && el.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(5.5)', opacity: 0 }], { duration: 900, delay: i * 140, easing: 'cubic-bezier(.1,.7,.3,1)' }));
      const emerge = kind === 'rise' ? [{ transform: 'translateY(-20px) scaleX(0) scaleY(1.1)', filter: 'brightness(3)' }, { transform: 'translateY(-8px) scaleX(1.1) scaleY(1.06)', filter: 'brightness(1.6)', offset: .55 }, { transform: 'none', filter: 'none' }]
        : kind === 'vortex' ? [{ transform: 'scale(0) rotate(-90deg)', filter: 'brightness(4)' }, { transform: 'scale(1.16) rotate(4deg)', filter: 'brightness(1.8)', offset: .55 }, { transform: 'none', filter: 'none' }]
          : [{ transform: 'translateY(30px) scale(.6)', filter: 'brightness(4) saturate(2)' }, { transform: 'translateY(-6px) scale(1.12)', filter: 'brightness(1.8)', offset: .5 }, { transform: 'none', filter: 'none' }];
      card.animate(emerge, { duration: 650, easing: 'cubic-bezier(.2,1.2,.4,1)' });
      if (kind !== 'rise') { const fr = []; const px = item.rarity === 'Mythic' ? 14 : 7; for (let i = 0; i <= 10; i++) { const k = 1 - i / 10; fr.push({ transform: `translate(${(Math.random() - .5) * px * 2 * k}px, ${(Math.random() - .5) * px * 1.4 * k}px)` }); } stageRef.current.animate(fr, { duration: 600 }); }
      const bA = kind === 'rise' ? [{ opacity: 0, transform: 'translate(-50%,-110%) scale(1.25)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .2 }, { opacity: 1, offset: .8 }, { opacity: 0, transform: 'translate(-50%,-62%) scale(1.06)' }]
        : fam.ink === 'holo' || fam.ink === 'storm' ? [{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.6) skewX(30deg)' }, { opacity: 1, transform: 'translate(-58%,-50%) skewX(-20deg)', offset: .04 }, { opacity: .3, transform: 'translate(-44%,-52%) skewX(12deg)', offset: .07 }, { opacity: 1, transform: 'translate(-50%,-50%)', offset: .12 }, { opacity: 1, offset: .8 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.3)' }]
          : [{ opacity: 0, transform: 'translate(-50%,-50%) scale(3.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(.92)', offset: .1 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0, transform: 'translate(-50%,-80%) scale(1.08)' }];
      bannerRef.current.animate(bA, { duration: 2400, easing: 'ease-out', fill: 'forwards' });
      await wait(700);
      if (alive) setDone(true);
    }
    run();
    return () => { alive = false; eng.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cardH = W * 410 / 280;
  const view = (
    <div className="rv-cine" role="dialog" aria-label={`Получено: ${item.title}`} style={{ '--c1': fam.c1 }}>
      <div className="rv-bg" />
      {big && <div className="rv-rays" style={{ left: '50%', top: '40%', marginLeft: -450, marginTop: -450, background: `repeating-conic-gradient(from 0deg, ${fam.rays} 0 3deg, transparent 3deg 12deg)` }} />}
      <canvas ref={cvRef} className="rv-fx" />
      <div className="lrpg-mono" style={{ position: 'relative', zIndex: 7, fontSize: 10, letterSpacing: '.2em', color: fam.c3 || '#f6d08a', marginBottom: 10, opacity: done ? 1 : .7 }}>{item.sub || 'Твой приз'}</div>
      <div ref={stageRef} className="rv-stage" style={{ width: big ? W : 160, height: big ? cardH : 160 }}>
        {big && fam.charge === 'rise' && <div ref={pillarRef} className="rv-pillar" />}
        <div ref={cardRef} style={{ position: 'absolute', inset: 0, visibility: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {big ? <CollectibleCard rarity={item.rarity} theme={item.theme} art={item.art} icon={item.icon} node={item.node} width={W} />
            : <RarityIcon rarity={item.rarity} theme={item.theme} art={item.art} size={150}>{item.node || item.icon || '🎁'}</RarityIcon>}
        </div>
        {big && <div ref={backRef} className="rv-back" style={{ background: fam.backBg, '--c1': fam.c1 }}><CardBack fam={fam} ids={ids} /></div>}
        {[0, 1, 2].map(i => <div key={i} ref={el => { shockRefs.current[i] = el; }} className="rv-shock" style={{ borderColor: fam.pal[i % fam.pal.length], boxShadow: `0 0 24px ${fam.pal[i % fam.pal.length]}, inset 0 0 24px ${fam.pal[i % fam.pal.length]}` }} />)}
        <div ref={flashRef} className="rv-flash" style={{ background: `radial-gradient(circle, #fff 0%, ${big ? fam.c1 : meta.c2} 22%, transparent 58%)` }} />
        {big && <div ref={bannerRef} className="rv-banner"><div className={'b1 rv-ink-' + fam.ink}>{item.rarity === 'Mythic' ? 'МИФИЧЕСКИЙ!' : 'ЛЕГЕНДАРНЫЙ!'}</div></div>}
      </div>
      <div className="rv-info" style={{ opacity: done ? 1 : 0, transform: done ? 'none' : 'translateY(10px)', transition: 'opacity .4s, transform .4s' }}>
        <div className={big ? 'rv-ink-' + fam.ink : ''} style={{ fontFamily: "'Cormorant SC', 'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: big ? undefined : '#f4efe6' }}>{item.title}</div>
        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <RarityLabel rarity={item.rarity} size={9} dark style={{ color: item.rarity === 'Common' ? '#cfc8b8' : undefined }} />
          {big && <span className="lrpg-mono" style={{ fontSize: 8.5, color: fam.c3, letterSpacing: '.12em' }}>· {fam.ru}</span>}
        </div>
        {item.lore && <div style={{ fontSize: 13, color: 'rgba(244,239,230,.75)', marginTop: 8, lineHeight: 1.45 }}>{item.lore}</div>}
        {extra && <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>{extra}</div>}
        <button type="button" className="lrpg-btn" onClick={done ? onClose : undefined} disabled={!done} style={{ marginTop: 14, padding: '12px 34px', minHeight: 44, borderRadius: 12, background: big ? `linear-gradient(180deg, #fff, ${fam.c1})` : '#c4532e', color: big ? '#120c04' : '#fbf9f4', border: 'none', fontSize: 15, fontWeight: 800, boxShadow: big ? `0 0 22px ${fam.c1}aa` : '0 3px 0 #7a2e1c', fontFamily: 'inherit' }}>{cta}</button>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}

/** Просмотр карты предмета из инвентаря/коллекции: карта с наклоном + описание. */
export function CardViewer({ item, onClose }) {
  useRevealCss();
  const fam = familyOf(item.theme, item.rarity), big = rarityRank(item.rarity) >= 3;
  const W = typeof window !== 'undefined' ? Math.min(260, window.innerWidth * .66, (window.innerHeight - 220) * .68) : 240;
  const cv = useRef(null);
  useParticles(cv, fam, { mode: 'ambient', density: .5 }, big);
  const view = (
    <div className="rv-cine" role="dialog" aria-label={item.title} onClick={onClose}>
      <div className="rv-bg" />
      {big && <canvas ref={cv} className="rv-fx" />}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 7, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {big ? <CollectibleCard rarity={item.rarity} theme={item.theme} art={item.art} icon={item.icon} node={item.node} width={W} />
          : <RarityIcon rarity={item.rarity} theme={item.theme} art={item.art} size={150}>{item.node || item.icon}</RarityIcon>}
        <div className="rv-info">
          <div className={big ? 'rv-ink-' + fam.ink : ''} style={{ fontFamily: "'Cormorant SC', 'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 700, color: big ? undefined : '#f4efe6' }}>{item.title}</div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center', gap: 8 }}><RarityLabel rarity={item.rarity} size={9} dark />{big && <span className="lrpg-mono" style={{ fontSize: 8.5, color: fam.c3 }}>· {fam.ru}</span>}</div>
          {item.effect && <div style={{ fontSize: 13, color: '#f4efe6', marginTop: 8 }}>{item.effect}</div>}
          {item.lore && <div style={{ fontSize: 12.5, color: 'rgba(244,239,230,.7)', marginTop: 4, fontStyle: 'italic' }}>{item.lore}</div>}
          <button type="button" className="lrpg-btn" onClick={onClose} style={{ marginTop: 14, padding: '11px 30px', minHeight: 44, borderRadius: 12, background: 'rgba(255,255,255,.12)', color: '#f4efe6', border: '1px solid rgba(255,255,255,.25)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>Закрыть</button>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}
