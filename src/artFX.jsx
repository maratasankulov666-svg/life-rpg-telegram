// artFX.jsx — детально нарисованные анимированные вещи для высоких редкостей:
// предметы (ItemArt), тематические рамки аватара (AvatarFrame), ауры героя (AuraArt).
// Всё — SVG + CSS-анимации; в спокойном режиме и при reduced-motion анимации гасятся.
import React, { useId } from 'react';

const CSS = `
@keyframes afScale { 0%,100% { transform: translateY(0); filter: brightness(1); } 50% { transform: translateY(-.7px); filter: brightness(1.55); } }
@keyframes afPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes afGlowEye { 0%,100% { opacity: .5; } 40%,60% { opacity: 1; } }
@keyframes afFlick { 0%,100% { transform: scaleY(1) skewX(0deg); } 25% { transform: scaleY(1.12) skewX(-3deg); } 50% { transform: scaleY(.92) skewX(2deg); } 75% { transform: scaleY(1.08) skewX(-1deg); } }
@keyframes afRise { 0% { transform: translateY(0) scale(1); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-34px) scale(.3); opacity: 0; } }
@keyframes afSpin { to { transform: rotate(360deg); } }
@keyframes afSpinRev { to { transform: rotate(-360deg); } }
@keyframes afTwinkle { 0%,100% { opacity: .15; } 50% { opacity: 1; } }
@keyframes afSway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes afSweep { 0% { transform: translateX(0); } 60%,100% { transform: translateX(110px); } }
@keyframes afFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes afWave { from { transform: translateX(0); } to { transform: translateX(-40px); } }
@keyframes afFishR { 0% { transform: translateX(-30px) translateY(0); } 25% { transform: translateX(20px) translateY(-2px); } 50% { transform: translateX(70px) translateY(1px); } 75% { transform: translateX(120px) translateY(-1px); } 100% { transform: translateX(170px) translateY(0); } }
@keyframes afFishL { 0% { transform: translateX(170px) scaleX(-1); } 100% { transform: translateX(-30px) scaleX(-1); } }
@keyframes afBubble { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: .9; } 50% { transform: translateY(-60px) translateX(3px); } 100% { transform: translateY(-120px) translateX(-2px); opacity: 0; } }
@keyframes afCaustic { 0% { transform: translate(-10%, -10%) rotate(0deg); } 100% { transform: translate(10%, 10%) rotate(20deg); } }
@keyframes afJaw { 0%,70%,100% { transform: rotate(0deg); } 78%,92% { transform: rotate(16deg); } }
@keyframes afBreath { 0%,72% { opacity: 0; transform: scaleX(.2); } 80% { opacity: 1; transform: scaleX(1); } 92% { opacity: .9; transform: scaleX(1.1); } 100% { opacity: 0; transform: scaleX(1.2); } }
@keyframes afNeon { 0%,18%,22%,62%,64%,100% { opacity: 1; } 20%,63% { opacity: .35; } }
@keyframes afHue { to { filter: hue-rotate(360deg); } }
@keyframes afOrbit { from { transform: rotate(0deg) translateX(var(--r, 40px)) rotate(0deg); } to { transform: rotate(360deg) translateX(var(--r, 40px)) rotate(-360deg); } }
@keyframes afDash { to { stroke-dashoffset: -200; } }
.af-scale { animation: afScale 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.af-pulse { animation: afPulse 1.8s ease-in-out infinite; }
.af-eye { animation: afGlowEye 2.2s ease-in-out infinite; }
.af-flick { animation: afFlick .9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.af-rise { animation: afRise 2.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.af-spin { animation: afSpin 14s linear infinite; transform-box: fill-box; transform-origin: center; }
.af-spin-fast { animation: afSpin 5s linear infinite; transform-box: fill-box; transform-origin: center; }
.af-spin-rev { animation: afSpinRev 9s linear infinite; transform-box: fill-box; transform-origin: center; }
.af-twinkle { animation: afTwinkle 1.6s ease-in-out infinite; }
.af-sway { animation: afSway 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.af-float { animation: afFloat 2.6s ease-in-out infinite; }
.af-wave { animation: afWave 3s linear infinite; }
.af-wave-slow { animation: afWave 5s linear infinite reverse; }
.af-fish-r { animation: afFishR 9s linear infinite; }
.af-fish-l { animation: afFishL 12s linear infinite; }
.af-bubble { animation: afBubble 4s ease-in infinite; }
.af-caustic { animation: afCaustic 6s ease-in-out infinite alternate; }
.af-jaw { animation: afJaw 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 0% 0%; }
.af-breath { animation: afBreath 4s ease-out infinite; transform-box: fill-box; transform-origin: 0% 50%; }
.af-neon { animation: afNeon 3.2s linear infinite; }
.af-hue { animation: afHue 6s linear infinite; }
.af-orbit { animation: afOrbit 6s linear infinite; }
.af-dash { animation: afDash 6s linear infinite; }
@media (prefers-reduced-motion: reduce) { [class*="af-"] { animation: none !important; } }
body.lrpg-calm [class*="af-"] { animation-duration: 20s !important; }
`;
let injected = false;
export function useArtCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

// ============ ПРЕДМЕТЫ ============

/** Мифические драконьи доспехи: чешуя переливается волной, глаза наплечников горят, камень пульсирует, сзади пламя. */
function DragonArmor({ uid }) {
  const rows = [
    { y: 26, xs: [20, 26, 32, 38, 44] },
    { y: 30, xs: [17, 23, 29, 35, 41, 47] },
    { y: 34, xs: [20, 26, 32, 38, 44] },
    { y: 38, xs: [17, 23, 29, 35, 41, 47] },
    { y: 42, xs: [20, 26, 32, 38, 44] },
    { y: 46, xs: [23, 29, 35, 41] },
  ];
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`dfire${uid}`} cx="50%" cy="70%" r="55%"><stop offset="0" stopColor="#ffcf5a" stopOpacity=".9" /><stop offset=".45" stopColor="#e2502a" stopOpacity=".55" /><stop offset="1" stopColor="#7a2e1c" stopOpacity="0" /></radialGradient>
        <linearGradient id={`dscale${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d24a3a" /><stop offset=".55" stopColor="#8a1e1e" /><stop offset="1" stopColor="#3a0c10" /></linearGradient>
        <linearGradient id={`dplate${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a1e24" /><stop offset=".5" stopColor="#1e1018" /><stop offset="1" stopColor="#2e141a" /></linearGradient>
        <linearGradient id={`dgold${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3c4" /><stop offset=".5" stopColor="#e0a83a" /><stop offset="1" stopColor="#8a5a1a" /></linearGradient>
        <clipPath id={`dclip${uid}`}><path d="M16 22 Q32 16 48 22 L50 44 Q32 58 14 44 Z" /></clipPath>
        <linearGradient id={`dsweep${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx="32" cy="40" rx="30" ry="26" fill={`url(#dfire${uid})`} className="af-pulse" />
      {[[12, 50, 0], [52, 48, .5], [22, 56, 1], [44, 56, 1.4], [32, 58, .8]].map(([x, y, d], i) => (
        <path key={i} className="af-flick" style={{ animationDelay: `${-d}s` }} d={`M${x - 4} ${y} Q${x - 3} ${y - 9} ${x} ${y - 14} Q${x + 3} ${y - 9} ${x + 4} ${y} Z`} fill={i % 2 ? '#ffb43a' : '#ff6a2a'} opacity=".75" />
      ))}
      {/* наплечники-головы драконов */}
      <g>
        <path d="M6 22 Q8 12 18 13 L22 20 Q14 22 10 30 Z" fill={`url(#dplate${uid})`} stroke={`url(#dgold${uid})`} strokeWidth="1.2" />
        <path d="M8 14 L4 7 L11 12 Z" fill="#e0a83a" /><path d="M13 12 L12 5 L16 11 Z" fill="#e0a83a" />
        <circle cx="13" cy="18" r="1.6" fill="#ffcf5a" className="af-eye" /><circle cx="13" cy="18" r="3.2" fill="#ff8a3a" opacity=".35" className="af-eye" />
        <path d="M58 22 Q56 12 46 13 L42 20 Q50 22 54 30 Z" fill={`url(#dplate${uid})`} stroke={`url(#dgold${uid})`} strokeWidth="1.2" />
        <path d="M56 14 L60 7 L53 12 Z" fill="#e0a83a" /><path d="M51 12 L52 5 L48 11 Z" fill="#e0a83a" />
        <circle cx="51" cy="18" r="1.6" fill="#ffcf5a" className="af-eye" style={{ animationDelay: '-.6s' }} /><circle cx="51" cy="18" r="3.2" fill="#ff8a3a" opacity=".35" className="af-eye" style={{ animationDelay: '-.6s' }} />
      </g>
      {/* нагрудник */}
      <path d="M16 22 Q32 16 48 22 L50 44 Q32 58 14 44 Z" fill={`url(#dplate${uid})`} />
      <g clipPath={`url(#dclip${uid})`}>
        {rows.map((r, ri) => r.xs.map((x, ci) => (
          <path key={ri + '-' + ci} className="af-scale" style={{ animationDelay: `${(ri * 0.16 + ci * 0.09)}s` }}
            d={`M${x - 3.2} ${r.y} Q${x - 3.2} ${r.y + 5} ${x} ${r.y + 6} Q${x + 3.2} ${r.y + 5} ${x + 3.2} ${r.y} Q${x} ${r.y + 1.6} ${x - 3.2} ${r.y} Z`}
            fill={`url(#dscale${uid})`} stroke="#e0a83a" strokeWidth=".35" />
        )))}
        <rect x="-30" y="14" width="18" height="48" fill={`url(#dsweep${uid})`} style={{ animation: 'afSweep 3.2s ease-in-out infinite' }} />
      </g>
      <path d="M16 22 Q32 16 48 22 L50 44 Q32 58 14 44 Z" fill="none" stroke={`url(#dgold${uid})`} strokeWidth="1.6" />
      <path d="M32 18 L32 50" stroke="#e0a83a" strokeWidth=".8" opacity=".6" />
      {/* сердце-камень */}
      <g>
        <path d="M32 27 L37 32 L32 39 L27 32 Z" fill="#ff3a3a" stroke={`url(#dgold${uid})`} strokeWidth="1" />
        <path d="M32 27 L37 32 L32 33 Z" fill="#ff9a8a" />
        <circle cx="32" cy="33" r="7" fill="#ff5a3a" opacity=".35" className="af-pulse" />
      </g>
      {/* пояс */}
      <path d="M17 44 Q32 52 47 44 L46 48 Q32 56 18 48 Z" fill={`url(#dgold${uid})`} />
      {[0, 1, 2, 3, 4].map(i => <circle key={i} className="af-rise" cx={18 + i * 7} cy={52} r={1} fill={i % 2 ? '#ffcf5a' : '#ff8a3a'} style={{ animationDelay: `${-i * 0.45}s` }} />)}
    </svg>
  );
}

function PhoenixFeather({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`pf${uid}`} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#7a2e1c" /><stop offset=".35" stopColor="#e2502a" /><stop offset=".7" stopColor="#ffb43a" /><stop offset="1" stopColor="#fff3c4" /></linearGradient>
        <radialGradient id={`pg${uid}`}><stop offset="0" stopColor="#ffcf5a" stopOpacity=".7" /><stop offset="1" stopColor="#ff6a2a" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="34" cy="30" r="26" fill={`url(#pg${uid})`} className="af-pulse" />
      <g className="af-float">
        <path d="M14 54 Q22 30 46 10 Q50 26 40 38 Q30 48 14 54 Z" fill={`url(#pf${uid})`} />
        {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M${18 + i * 4.5} ${50 - i * 6.5} Q${24 + i * 4} ${44 - i * 6} ${30 + i * 3.5} ${44 - i * 7}`} stroke="#7a2e1c" strokeWidth=".7" fill="none" opacity=".6" />)}
        <path d="M14 54 Q28 36 46 10" stroke="#fff3c4" strokeWidth="1.2" fill="none" />
        {[[44, 12, 0], [40, 22, .3], [36, 30, .6], [30, 38, .9]].map(([x, y, d], i) => (
          <path key={i} className="af-flick" style={{ animationDelay: `${-d}s` }} d={`M${x} ${y} q3 -6 1 -11 q5 4 3 11 z`} fill="#ffcf5a" />
        ))}
      </g>
      {[0, 1, 2, 3].map(i => <circle key={i} className="af-rise" cx={22 + i * 8} cy={44 - i * 4} r="1.2" fill="#ffcf5a" style={{ animationDelay: `${-i * 0.5}s` }} />)}
    </svg>
  );
}

function VoidCloak({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <clipPath id={`vc${uid}`}><path d="M24 10 Q32 6 40 10 L48 20 Q52 40 56 58 L8 58 Q12 40 16 20 Z" /></clipPath>
        <radialGradient id={`vn${uid}`} cx="40%" cy="40%"><stop offset="0" stopColor="#b58cff" /><stop offset=".5" stopColor="#4a2a8a" /><stop offset="1" stopColor="#120a24" /></radialGradient>
      </defs>
      <path d="M24 10 Q32 6 40 10 L48 20 Q52 40 56 58 L8 58 Q12 40 16 20 Z" fill="#120a24" />
      <g clipPath={`url(#vc${uid})`}>
        <ellipse cx="32" cy="34" rx="34" ry="30" fill={`url(#vn${uid})`} className="af-spin" opacity=".9" />
        <ellipse cx="30" cy="36" rx="18" ry="6" fill="#e9dcff" opacity=".18" className="af-spin-rev" />
        {[[18, 22], [42, 26], [26, 40], [46, 46], [14, 50], [34, 52], [30, 18], [50, 36]].map(([x, y], i) => (
          <g key={i} className="af-twinkle" style={{ animationDelay: `${-i * 0.3}s` }}><rect x={x - .6} y={y - 2} width="1.2" height="4" fill="#fff" /><rect x={x - 2} y={y - .6} width="4" height="1.2" fill="#fff" /></g>
        ))}
      </g>
      <path d="M24 10 Q32 6 40 10 L48 20 Q52 40 56 58 L8 58 Q12 40 16 20 Z" fill="none" stroke="#b58cff" strokeWidth="1.4" />
      <path d="M26 10 Q32 16 38 10" stroke="#e9dcff" strokeWidth="1.2" fill="none" />
      <circle cx="32" cy="14" r="2.2" fill="#e9dcff" className="af-pulse" />
    </svg>
  );
}

function SunCrown({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset=".45" stopColor="#f6d08a" /><stop offset="1" stopColor="#a06a1a" /></linearGradient></defs>
      <g className="af-spin" style={{ transformOrigin: '32px 34px' }}>
        {Array.from({ length: 12 }, (_, i) => <path key={i} d="M32 34 L30 6 L34 6 Z" fill="#ffd96a" opacity=".45" transform={`rotate(${i * 30} 32 34)`} />)}
      </g>
      <circle cx="32" cy="34" r="16" fill="#fff3c4" opacity=".5" className="af-pulse" />
      <g className="af-float">
        <path d="M12 46 L10 22 L22 32 L32 16 L42 32 L54 22 L52 46 Z" fill={`url(#sg${uid})`} stroke="#8a5a1a" strokeWidth="1" />
        <rect x="12" y="44" width="40" height="7" rx="1.5" fill={`url(#sg${uid})`} stroke="#8a5a1a" strokeWidth="1" />
        {[[22, 47.5, '#a83e66'], [32, 47.5, '#2f6b6e'], [42, 47.5, '#a83e66']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="2" fill={c} />)}
        {[[10, 22], [32, 16], [54, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill="#fff6dc" className="af-twinkle" style={{ animationDelay: `${-i * .4}s` }} />)}
        <rect x="14" y="26" width="3" height="16" fill="#fff" opacity=".35" />
      </g>
    </svg>
  );
}

function FrostHeart({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`fh${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".4" stopColor="#bfe8ff" /><stop offset="1" stopColor="#3a8ac0" /></linearGradient>
        <clipPath id={`fc${uid}`}><path d="M32 54 L10 30 Q6 16 18 12 Q28 10 32 20 Q36 10 46 12 Q58 16 54 30 Z" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#bfe8ff" opacity=".35" className="af-pulse" />
      <g className="af-float">
        <path d="M32 54 L10 30 Q6 16 18 12 Q28 10 32 20 Q36 10 46 12 Q58 16 54 30 Z" fill={`url(#fh${uid})`} stroke="#ffffff" strokeWidth="1.2" />
        <g clipPath={`url(#fc${uid})`} opacity=".55">
          <path d="M32 20 L22 30 L32 54 L42 30 Z" fill="#ffffff" opacity=".35" /><path d="M10 30 L22 30 L18 12" stroke="#ffffff" strokeWidth=".8" fill="none" /><path d="M54 30 L42 30 L46 12" stroke="#ffffff" strokeWidth=".8" fill="none" />
          <rect x="-30" y="0" width="14" height="64" fill="#ffffff" opacity=".7" style={{ animation: 'afSweep 3s ease-in-out infinite' }} />
        </g>
      </g>
      {[[8, 18], [56, 20], [12, 46], [52, 48], [32, 6]].map(([x, y], i) => (
        <g key={i} className="af-twinkle" style={{ animationDelay: `${-i * .35}s` }}><path d={`M${x} ${y - 3} L${x} ${y + 3} M${x - 3} ${y} L${x + 3} ${y} M${x - 2} ${y - 2} L${x + 2} ${y + 2} M${x + 2} ${y - 2} L${x - 2} ${y + 2}`} stroke="#ffffff" strokeWidth=".9" /></g>
      ))}
    </svg>
  );
}

function WorldSprout({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs><radialGradient id={`wg${uid}`}><stop offset="0" stopColor="#f6e38a" stopOpacity=".8" /><stop offset="1" stopColor="#9fd07a" stopOpacity="0" /></radialGradient></defs>
      <circle cx="32" cy="30" r="26" fill={`url(#wg${uid})`} className="af-pulse" />
      <path d="M14 50 Q32 44 50 50 L50 56 Q32 60 14 56 Z" fill="#6a4c34" />
      {[[22, 56, 14, 62], [32, 56, 32, 64], [42, 56, 50, 62]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2 + 3} ${y1 + 3} ${x2} ${y2}`} stroke="#f6e38a" strokeWidth="1.2" fill="none" className="af-pulse" style={{ animationDelay: `${-i * .4}s` }} />)}
      <g className="af-sway" style={{ transformOrigin: '32px 50px' }}>
        <path d="M32 50 Q30 34 32 20" stroke="#3f7a4a" strokeWidth="2.4" fill="none" />
        <path d="M32 34 Q18 30 14 18 Q28 18 32 32 Z" fill="#5fa35a" /><path d="M32 30 Q44 22 52 12 Q50 28 32 30 Z" fill="#9fd07a" />
        <path d="M32 22 Q28 12 32 6 Q36 12 32 22 Z" fill="#9fd07a" />
        <circle cx="32" cy="6" r="2" fill="#f6e38a" className="af-twinkle" />
      </g>
      {[0, 1, 2].map(i => <circle key={i} className="af-rise" cx={20 + i * 12} cy={40} r="1.2" fill="#f6e38a" style={{ animationDelay: `${-i * .7}s` }} />)}
    </svg>
  );
}

function PathCrown({ uid }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`pc${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f07ad0" /><stop offset=".35" stopColor="#7a5af0" /><stop offset=".7" stopColor="#5ad0f0" /><stop offset="1" stopColor="#f0e05a" /></linearGradient>
      </defs>
      <circle cx="32" cy="34" r="26" fill={`url(#pc${uid})`} opacity=".28" className="af-hue" />
      <g className="af-hue">
        <path d="M10 46 L12 20 L22 30 L32 10 L42 30 L52 20 L54 46 Z" fill={`url(#pc${uid})`} stroke="#ffffff" strokeWidth="1.2" />
        <path d="M32 10 L42 30 L32 46 L22 30 Z" fill="#ffffff" opacity=".35" />
        <rect x="10" y="44" width="44" height="7" rx="2" fill={`url(#pc${uid})`} stroke="#ffffff" strokeWidth="1" />
      </g>
      <path d="M32 26 L36 31 L32 38 L28 31 Z" fill="#ffffff" className="af-pulse" />
      {[0, 1, 2, 3].map(i => (
        <g key={i} style={{ transformOrigin: '32px 34px', animation: `afSpin ${4 + i}s linear infinite`, animationDelay: `${-i}s` }}>
          <circle cx={32 + 22 + i * 2} cy="34" r="1.6" fill={['#f07ad0', '#5ad0f0', '#f0e05a', '#ffffff'][i]} />
        </g>
      ))}
    </svg>
  );
}

const ITEM_ART = {
  'dragon-armor': DragonArmor,
  'phoenix-feather': PhoenixFeather,
  'void-cloak': VoidCloak,
  'sun-crown': SunCrown,
  'frost-heart': FrostHeart,
  'world-sprout': WorldSprout,
  'path-crown': PathCrown,
};
export const hasItemArt = (id) => !!ITEM_ART[id];
/** Нарисованный предмет (если есть), иначе null. */
export function ItemArt({ id, size = 56 }) {
  useArtCss();
  const uid = useId().replace(/:/g, '');
  const C = ITEM_ART[id];
  if (!C) return null;
  return <span style={{ width: size, height: size, display: 'block' }}><C uid={uid} /></span>;
}

// ============ РАМКИ АВАТАРА ============

/** Подводный мир: волны, рыбки, пузыри, водоросли, блики на фото. */
function OceanFrame({ size, uid, children }) {
  const fish = (c, d, y, dur, left) => (
    <g key={c + y} className={left ? 'af-fish-l' : 'af-fish-r'} style={{ animationDuration: `${dur}s`, animationDelay: `${-d}s` }}>
      <g transform={`translate(0 ${y})`}>
        <ellipse cx="6" cy="0" rx="5" ry="2.8" fill={c} /><path d="M1 0 L-3 -3 L-3 3 Z" fill={c} /><circle cx="8.5" cy="-.6" r=".8" fill="#1e2230" /><path d="M5 -2.6 L7 -4.5 L8 -2.4 Z" fill={c} opacity=".8" />
      </g>
    </g>
  );
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div className="af-pulse" style={{ position: 'absolute', inset: -size * 0.12, borderRadius: size * 0.36, background: 'radial-gradient(circle, rgba(90,208,240,.55), transparent 70%)' }} />
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`ow${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7ad8f0" /><stop offset=".5" stopColor="#2a8ac0" /><stop offset="1" stopColor="#174a7a" /></linearGradient>
          <clipPath id={`oring${uid}`}><path fillRule="evenodd" d="M20 0 H120 Q140 0 140 20 V120 Q140 140 120 140 H20 Q0 140 0 120 V20 Q0 0 20 0 Z M30 22 H110 Q118 22 118 30 V110 Q118 118 110 118 H30 Q22 118 22 110 V30 Q22 22 30 22 Z" /></clipPath>
        </defs>
        <g clipPath={`url(#oring${uid})`}>
          <rect width="140" height="140" fill={`url(#ow${uid})`} />
          <g className="af-wave"><path d="M0 8 Q10 2 20 8 T40 8 T60 8 T80 8 T100 8 T120 8 T140 8 T160 8 T180 8 V0 H0 Z" fill="#bfefff" opacity=".7" /></g>
          <g className="af-wave-slow"><path d="M0 134 Q10 128 20 134 T40 134 T60 134 T80 134 T100 134 T120 134 T140 134 T160 134 T180 134 V140 H0 Z" fill="#0e3358" opacity=".8" /></g>
          {fish('#ffb43a', 0, 13, 9, false)}{fish('#f07a9a', 4, 128, 12, true)}{fish('#ffe05a', 6.5, 126, 9, false)}
          {[[8, 120, 0], [130, 110, 1.4], [10, 70, 2.6], [128, 50, .8], [7, 30, 3.3]].map(([x, y, d], i) => (
            <circle key={i} className="af-bubble" cx={x} cy={y} r={1.6 + (i % 2)} fill="none" stroke="#e8fbff" strokeWidth=".8" style={{ animationDelay: `${-d}s` }} />
          ))}
          <g className="af-sway" style={{ transformOrigin: '10px 140px' }}><path d="M8 140 Q4 124 10 112 Q14 100 9 90" stroke="#3fa37a" strokeWidth="3" fill="none" /></g>
          <g className="af-sway" style={{ transformOrigin: '132px 140px', animationDelay: '-1.4s' }}><path d="M132 140 Q136 126 130 116 Q126 106 131 96" stroke="#5fc39a" strokeWidth="3" fill="none" /></g>
          <circle cx="20" cy="132" r="4" fill="#f07a9a" /><circle cx="126" cy="133" r="3" fill="#ffb43a" />
        </g>
        <path fillRule="evenodd" d="M20 0 H120 Q140 0 140 20 V120 Q140 140 120 140 H20 Q0 140 0 120 V20 Q0 0 20 0 Z M30 22 H110 Q118 22 118 30 V110 Q118 118 110 118 H30 Q22 118 22 110 V30 Q22 22 30 22 Z" fill="none" stroke="#e8fbff" strokeWidth="1.6" />
      </svg>
      <div style={{ position: 'absolute', left: size * 0.157, top: size * 0.157, width: size * 0.686, height: size * 0.686, borderRadius: size * 0.06, overflow: 'hidden', background: '#d6eef6' }}>
        {children}
        <div className="af-caustic" style={{ position: 'absolute', inset: '-30%', background: 'repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,.22) 0 6px, transparent 6px 18px)', mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/** Драконья оправа: дракон обвивает рамку, чешуя движется, пасть выдыхает пламя. */
function DragonFrame({ size, uid, children }) {
  const scales = [];
  const per = 14;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < per; i++) {
      const t = (i + .5) / per;
      const [x, y, rot] = side === 0 ? [10 + t * 120, 10, 0] : side === 1 ? [130, 10 + t * 120, 90] : side === 2 ? [130 - t * 120, 130, 180] : [10, 130 - t * 120, 270];
      scales.push(<path key={side + '-' + i} className="af-scale" style={{ animationDelay: `${(side * per + i) * 0.06}s` }} transform={`translate(${x} ${y}) rotate(${rot})`} d="M-4.5 -4 Q-4.5 3 0 5 Q4.5 3 4.5 -4 Q0 -1.5 -4.5 -4 Z" fill={`url(#dsc${uid})`} stroke="#f6d08a" strokeWidth=".5" />);
    }
  }
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div className="af-hue" style={{ position: 'absolute', inset: -size * 0.16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,90,58,.6), rgba(122,90,240,.25) 55%, transparent 72%)' }} />
      <div style={{ position: 'absolute', left: size * 0.157, top: size * 0.157, width: size * 0.686, height: size * 0.686, borderRadius: size * 0.05, overflow: 'hidden', background: '#2a1418' }}>{children}</div>
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`dsc${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6a4a" /><stop offset=".6" stopColor="#8a1e1e" /><stop offset="1" stopColor="#2a080c" /></linearGradient>
          <linearGradient id={`dfl${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff3c4" /><stop offset=".3" stopColor="#ffcf5a" /><stop offset=".7" stopColor="#ff6a2a" /><stop offset="1" stopColor="#e2502a" stopOpacity="0" /></linearGradient>
        </defs>
        <rect x="10" y="10" width="120" height="120" rx="12" fill="none" stroke="#2a080c" strokeWidth="13" />
        {scales}
        {/* хвост */}
        <path d="M18 130 Q4 138 2 124 Q8 128 12 122" fill="#8a1e1e" stroke="#f6d08a" strokeWidth=".8" className="af-sway" style={{ transformOrigin: '14px 128px' }} />
        {/* голова дракона сверху справа */}
        <g transform="translate(106 -6)">
          <path d="M-6 16 Q0 2 14 2 Q26 2 30 10 L24 12 Q18 9 12 12 Z" fill="#8a1e1e" stroke="#f6d08a" strokeWidth="1" />
          <path d="M2 4 L-4 -8 L6 2 Z" fill="#f6d08a" /><path d="M10 2 L8 -10 L14 1 Z" fill="#f6d08a" />
          <circle cx="16" cy="7" r="1.8" fill="#ffcf5a" className="af-eye" /><circle cx="16" cy="7" r="3.6" fill="#ff8a3a" opacity=".4" className="af-eye" />
          <g className="af-jaw"><path d="M12 12 Q20 12 28 13 L24 18 Q16 18 10 16 Z" fill="#6a141a" stroke="#f6d08a" strokeWidth=".8" /></g>
          <path className="af-breath" d="M29 13 Q48 6 62 14 Q48 22 29 15 Z" fill={`url(#dfl${uid})`} />
        </g>
        {[[20, 6], [70, 4], [134, 60], [128, 100], [60, 136], [4, 80]].map(([x, y], i) => <circle key={i} className="af-rise" cx={x} cy={y} r="1.4" fill={i % 2 ? '#ffcf5a' : '#ff6a2a'} style={{ animationDelay: `${-i * .4}s` }} />)}
      </svg>
    </div>
  );
}

/** Неоновая трубка с мерцанием. */
function NeonFrame({ size, children }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', inset: size * 0.06, borderRadius: size * 0.2, overflow: 'hidden', background: '#1e2230' }}>{children}</div>
      <div className="af-neon" style={{ position: 'absolute', inset: size * 0.03, borderRadius: size * 0.22, border: `${Math.max(2, size * 0.035)}px solid #ff6ad5`, boxShadow: '0 0 6px #ff6ad5, 0 0 16px #ff6ad5, inset 0 0 8px #ff6ad5', pointerEvents: 'none' }} />
      <div className="af-neon" style={{ position: 'absolute', inset: 0, borderRadius: size * 0.25, border: `${Math.max(1, size * 0.018)}px solid #5ad0f0`, boxShadow: '0 0 10px #5ad0f0', opacity: .8, animationDelay: '-1.3s', pointerEvents: 'none' }} />
    </div>
  );
}

function SimpleFrame({ size, children, look }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: size * 0.22, overflow: 'hidden', border: look.border, boxShadow: look.shadow, background: '#e6e0d3' }}>{children}</div>
  );
}

export const FRAME_ART = {
  frame_common: { kind: 'simple', border: '3px solid #8d97a0' },
  frame_rare: { kind: 'simple', border: '3px solid #2f6b6e', shadow: '0 0 0 3px rgba(47,107,110,.25), inset 0 0 0 2px rgba(255,255,255,.5)' },
  frame_epic: { kind: 'neon' },
  frame_ocean: { kind: 'ocean' },
  frame_dragon: { kind: 'dragon' },
};
/** Аватар в тематической рамке. id — косметика рамки (или null). */
export function AvatarFrame({ id, size = 64, children }) {
  useArtCss();
  const uid = useId().replace(/:/g, '');
  const f = FRAME_ART[id];
  if (!f) return <div style={{ width: size, height: size, borderRadius: size * 0.22, overflow: 'hidden', border: '2px solid #a4412a', background: '#e6e0d3' }}>{children}</div>;
  if (f.kind === 'ocean') return <OceanFrame size={size} uid={uid}>{children}</OceanFrame>;
  if (f.kind === 'dragon') return <DragonFrame size={size} uid={uid}>{children}</DragonFrame>;
  if (f.kind === 'neon') return <NeonFrame size={size}>{children}</NeonFrame>;
  return <SimpleFrame size={size} look={f}>{children}</SimpleFrame>;
}

// ============ АУРЫ ============
// SVG-группа в координатах 0..100 × 0..160, герой стоит по центру (ноги около y=150).

function AuraSpark() {
  return (
    <g>
      <ellipse cx="50" cy="150" rx="34" ry="6" fill="#a83e66" opacity=".35" className="af-pulse" />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} className="af-twinkle" style={{ animationDelay: `${-i * 0.27}s` }}>
          <path d={`M${14 + (i * 37) % 72} ${30 + (i * 53) % 110} m-3 0 h6 m-3 -3 v6`} stroke="#ff8ad0" strokeWidth="1.4" />
        </g>
      ))}
    </g>
  );
}
function AuraFire({ uid }) {
  return (
    <g>
      <defs><radialGradient id={`af${uid}`} cx="50%" cy="80%" r="60%"><stop offset="0" stopColor="#ffcf5a" stopOpacity=".75" /><stop offset=".5" stopColor="#ff6a2a" stopOpacity=".35" /><stop offset="1" stopColor="#ff6a2a" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="50" cy="96" rx="48" ry="70" fill={`url(#af${uid})`} className="af-pulse" />
      {[[16, 150, 34, 0], [28, 152, 46, .3], [40, 154, 58, .55], [50, 154, 66, .15], [60, 154, 58, .7], [72, 152, 46, .4], [84, 150, 34, .9]].map(([x, y, h, d], i) => (
        <path key={i} className="af-flick" style={{ animationDelay: `${-d}s` }} d={`M${x - 7} ${y} Q${x - 6} ${y - h * .5} ${x} ${y - h} Q${x + 6} ${y - h * .5} ${x + 7} ${y} Z`} fill={i % 2 ? '#ffb43a' : '#ff6a2a'} opacity=".7" />
      ))}
      {Array.from({ length: 8 }, (_, i) => <circle key={i} className="af-rise" cx={14 + i * 10} cy={140 - (i % 3) * 20} r="1.6" fill="#ffcf5a" style={{ animationDelay: `${-i * 0.3}s` }} />)}
    </g>
  );
}
function AuraVoid({ uid }) {
  return (
    <g>
      <defs><radialGradient id={`av${uid}`}><stop offset="0" stopColor="#7a5af0" stopOpacity=".05" /><stop offset=".55" stopColor="#4a2a8a" stopOpacity=".55" /><stop offset="1" stopColor="#120a24" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="50" cy="92" rx="50" ry="72" fill={`url(#av${uid})`} />
      <g className="af-spin" style={{ transformOrigin: '50px 92px' }}><ellipse cx="50" cy="92" rx="44" ry="62" fill="none" stroke="#b58cff" strokeWidth="1.4" strokeDasharray="6 10" opacity=".8" /></g>
      <g className="af-spin-rev" style={{ transformOrigin: '50px 92px' }}><ellipse cx="50" cy="92" rx="36" ry="54" fill="none" stroke="#e9dcff" strokeWidth=".8" strokeDasharray="2 8" opacity=".7" /></g>
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} className="af-twinkle" style={{ animationDelay: `${-i * 0.33}s` }}><rect x={10 + (i * 41) % 80} y={24 + (i * 59) % 124} width="1.6" height="1.6" fill="#ffffff" /></g>
      ))}
    </g>
  );
}
function AuraDragon({ uid }) {
  // Призрачный дракон летит по эллипсу вокруг героя (по часовой): голова впереди, тело тянется следом.
  const cx = 50, cy = 94, rx = 43, ry = 60;
  const pt = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  const span = Math.PI * 1.3;
  const N = 26;
  const pts = Array.from({ length: N + 1 }, (_, i) => pt(-(i / N) * span)); // от головы (0) назад к хвосту
  const path = (from, to) => pts.slice(from, to + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const parts = [[0, 9, 9], [8, 16, 7], [15, 22, 5], [21, 26, 3]];
  const spikes = [3, 6, 9, 12, 15, 18, 21];
  return (
    <g>
      <defs>
        <radialGradient id={`ad${uid}`} cx="50%" cy="70%" r="60%"><stop offset="0" stopColor="#ff6a4a" stopOpacity=".5" /><stop offset=".6" stopColor="#7a5af0" stopOpacity=".22" /><stop offset="1" stopColor="#7a5af0" stopOpacity="0" /></radialGradient>
        <linearGradient id={`adb${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a3a" /><stop offset=".5" stopColor="#a41e2a" /><stop offset="1" stopColor="#5a0c18" /></linearGradient>
        <filter id={`adg${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
      </defs>
      <ellipse cx="50" cy="94" rx="50" ry="72" fill={`url(#ad${uid})`} className="af-hue" />
      <g style={{ transformOrigin: '50px 94px', animation: 'afSpin 8s linear infinite' }}>
        <path d={path(0, N)} stroke="#ff6a2a" strokeWidth="13" fill="none" strokeLinecap="round" opacity=".35" filter={`url(#adg${uid})`} />
        {parts.map(([a, b, w], i) => <path key={i} d={path(a, b)} stroke={`url(#adb${uid})`} strokeWidth={w} fill="none" strokeLinecap="round" />)}
        {parts.map(([a, b, w], i) => <path key={'s' + i} d={path(a, b)} stroke="#3a0810" strokeWidth={w * 0.82} fill="none" strokeDasharray="1.4 2.4" strokeLinecap="round" opacity=".55" className="af-dash" style={{ animationDuration: '3s' }} />)}
        <path d={path(0, 22)} stroke="#f6d08a" strokeWidth="1.1" fill="none" strokeDasharray="3 2.5" opacity=".9" />
        {spikes.map(k => {
          const [x, y] = pts[k];
          const a = -(k / N) * span;
          const nx = Math.cos(a), ny = Math.sin(a);
          const sz = 4.6 - k * 0.14;
          return <path key={k} d={`M${(x + nx * 3).toFixed(1)} ${(y + ny * 3).toFixed(1)} l${(nx * sz).toFixed(1)} ${(ny * sz).toFixed(1)} l${(-ny * 2).toFixed(1)} ${(nx * 2).toFixed(1)} Z`} fill="#f6d08a" />;
        })}
        {/* крылья у плеч */}
        {(() => { const [x, y] = pts[4]; return <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}><path className="af-sway" d="M0 0 Q14 -10 22 2 Q14 0 10 6 Q6 2 0 6 Z" fill="#a41e2a" stroke="#f6d08a" strokeWidth=".6" opacity=".85" style={{ transformOrigin: '0 0' }} /></g>; })()}
        {/* хвост-кисточка */}
        {(() => { const [x, y] = pts[N]; return <path d={`M${x.toFixed(1)} ${y.toFixed(1)} l-4 -6 l6 2 l2 -6 l2 7 Z`} fill="#ffb43a" className="af-flick" />; })()}
        {/* голова: смотрит по ходу полёта (вниз на правой стороне эллипса) */}
        <g transform={`translate(${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}) rotate(180)`}>
          <path d="M-7 2 Q-7 -9 0 -14 Q7 -9 7 2 Q0 6 -7 2 Z" fill={`url(#adb${uid})`} stroke="#f6d08a" strokeWidth=".9" />
          <path d="M-5 -8 L-10 -17 L-2 -11 Z M5 -8 L10 -17 L2 -11 Z" fill="#f6d08a" />
          <path d="M-2.5 -13 L0 -17 L2.5 -13 Z" fill="#f6d08a" />
          <circle cx="-3" cy="-6" r="1.4" fill="#ffe08a" className="af-eye" /><circle cx="3" cy="-6" r="1.4" fill="#ffe08a" className="af-eye" />
          <circle cx="-3" cy="-6" r="3" fill="#ff8a3a" opacity=".4" className="af-eye" /><circle cx="3" cy="-6" r="3" fill="#ff8a3a" opacity=".4" className="af-eye" />
          <path className="af-flick" d="M-3 -14 Q0 -30 3 -14 Z" fill="#ffcf5a" style={{ transformOrigin: '0 -14px' }} />
        </g>
      </g>
      {Array.from({ length: 10 }, (_, i) => <circle key={i} className="af-rise" cx={12 + i * 8} cy={150 - (i % 4) * 18} r="1.6" fill={i % 3 ? '#ffcf5a' : '#b58cff'} style={{ animationDelay: `${-i * 0.27}s` }} />)}
    </g>
  );
}
export const AURA_ART = { aura_spark: AuraSpark, aura_fire: AuraFire, aura_void: AuraVoid, aura_dragon: AuraDragon };
/** Аура как SVG-группа (вставляется внутрь другого SVG в координатах 0..100×0..160). */
export function AuraGroup({ id }) {
  useArtCss();
  const uid = useId().replace(/:/g, '');
  const C = AURA_ART[id];
  return C ? <C uid={uid} /> : null;
}
/** Аура отдельным SVG (для превью и карточки героя). */
export function AuraArt({ id, width = 100, height = 160, style }) {
  useArtCss();
  if (!AURA_ART[id]) return null;
  return (
    <svg viewBox="0 0 100 160" width={width} height={height} aria-hidden="true" style={{ overflow: 'visible', display: 'block', ...style }}>
      <AuraGroup id={id} />
    </svg>
  );
}
