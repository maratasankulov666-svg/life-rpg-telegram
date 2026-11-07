// heroGearFX.jsx — снаряжение, видимое прямо на пиксельном герое (сетка 18×53, та же, что у героя в комнате и профиле).
// У каждого слота своя стихия, облик растёт по уровням I–V: от простого до легендарного и мифического с живыми эффектами.
// gear: { weapon, armor, helmet, gloves, shoes, accessory, artifact } → индекс уровня 0..4 (I..V).
import React from 'react';

const CSS = `
@keyframes hgFlick { 0%,100% { transform: scaleY(1) skewX(0deg); opacity: .95; } 30% { transform: scaleY(1.25) skewX(-6deg); } 60% { transform: scaleY(.85) skewX(4deg); opacity: .8; } }
@keyframes hgRise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-14px); opacity: 0; } }
@keyframes hgFall { 0% { transform: translate(0, -4px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(2px, 12px); opacity: 0; } }
@keyframes hgPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes hgSpin { to { transform: rotate(360deg); } }
@keyframes hgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
@keyframes hgZap { 0%, 100% { opacity: 0; } 4%, 9% { opacity: 1; } 6% { opacity: .2; } 12% { opacity: 0; } }
@keyframes hgFlap { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-16deg); } }
@keyframes hgSway { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
.hg-flick { transform-box: fill-box; transform-origin: 50% 100%; animation: hgFlick .7s ease-in-out infinite; }
.hg-rise { animation: hgRise 2.2s ease-out infinite; }
.hg-fall { animation: hgFall 2.6s linear infinite; }
.hg-pulse { animation: hgPulse 1.8s ease-in-out infinite; }
.hg-spin { transform-box: fill-box; transform-origin: center; animation: hgSpin 6s linear infinite; }
.hg-float { animation: hgFloat 2.4s ease-in-out infinite; }
.hg-zap { animation: hgZap 2.2s steps(1) infinite; }
.hg-flap { transform-box: fill-box; transform-origin: 100% 100%; animation: hgFlap 1.4s ease-in-out infinite; }
.hg-sway { transform-box: fill-box; transform-origin: 50% 100%; animation: hgSway 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { [class*="hg-"] { animation: none !important; } }
body.lrpg-calm .hg-rise, body.lrpg-calm .hg-fall, body.lrpg-calm .hg-zap { animation-duration: 8s !important; }
`;
let cssIn = false;
export function useHeroGearCss() {
  if (cssIn || typeof document === 'undefined') return;
  cssIn = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
}
const R = (x, y, w, h, fill, extra = {}) => <rect x={x} y={y} width={w} height={h} fill={fill} {...extra} />;
const d = (i) => ({ animationDelay: `${-i * 0.37}s` });

// ---------- Броня (небо: золото рассвета) ----------
function Armor({ t }) {
  if (!t) return null;
  if (t === 1) return <g>{R(4, 15, 10, 9, '#7a4a2a')}{R(4, 15, 2, 9, '#8f5a36')}{R(4, 23, 10, 1, '#5a3420')}{R(8, 23, 2, 1, '#c8a050')}</g>;
  if (t === 2) return (
    <g>
      {R(4, 15, 10, 9, '#8a939e')}{[16, 18, 20, 22].map(y => <g key={y}>{[5, 7, 9, 11].map(x => R(x + (y % 4 ? 1 : 0), y, 1, 1, '#6a727c', { key: x }))}</g>)}
      {R(1, 13, 4, 3, '#6a727c')}{R(13, 13, 4, 3, '#6a727c')}{R(4, 23, 10, 1, '#3a4048')}
    </g>
  );
  const gold = t >= 4 ? '#fff0b0' : '#f2c45a', deep = t >= 4 ? '#f2c45a' : '#b07a1a';
  return (
    <g>
      {R(4, 15, 10, 9, deep)}{R(5, 15, 8, 8, gold)}{R(5, 15, 1, 8, '#fffbe8', { opacity: .7 })}
      {R(8, 17, 2, 3, '#e2302a')}{R(8, 17, 1, 1, '#ffd0c8')}<rect x="7.5" y="16.5" width="3" height="4" fill="#ff6a4a" opacity=".35" className="hg-pulse" />
      {R(4, 23, 10, 1, '#7a4a10')}{R(8, 23, 2, 1, '#fff4d2')}
      {R(0, 12, 5, 4, deep)}{R(13, 12, 5, 4, deep)}{R(0, 12, 5, 1, gold)}{R(13, 12, 5, 1, gold)}
      {R(1, 16, 3, 2, deep)}{R(14, 16, 3, 2, deep)}
      {t >= 4 && (
        <g>
          <g className="hg-flap"><path d="M1 13 L-6 6 L-4 10 L-8 9 L-5 13 L-8 14 L-3 16 Z" fill="#fffbe8" stroke="#f2c45a" strokeWidth=".4" /></g>
          <g transform="translate(18 0) scale(-1 1)"><g className="hg-flap"><path d="M1 13 L-6 6 L-4 10 L-8 9 L-5 13 L-8 14 L-3 16 Z" fill="#fffbe8" stroke="#f2c45a" strokeWidth=".4" /></g></g>
        </g>
      )}
    </g>
  );
}
function ArmorBack({ t }) {
  if (t < 3) return null;
  return (
    <g opacity={t >= 4 ? 1 : .7}>
      <circle cx="9" cy="20" r={t >= 4 ? 13 : 10} fill="#fff4d2" opacity=".18" className="hg-pulse" />
      {t >= 4 && <g className="hg-spin" style={{ transformOrigin: '9px 20px', transformBox: 'view-box' }}>
        {Array.from({ length: 12 }, (_, i) => <path key={i} d="M9 20 L8.4 3 L9.6 3 Z" fill="#ffe6a0" opacity=".45" transform={`rotate(${i * 30} 9 20)`} />)}
      </g>}
    </g>
  );
}

// ---------- Шлем (космос) ----------
function Helmet({ t }) {
  if (!t) return null;
  if (t === 1) return <g fill="#2a4a5a">{R(3, 0, 12, 3)}{R(2, 2, 2, 7)}{R(14, 2, 2, 7)}{R(4, 3, 10, 1, '#3a5a6a')}</g>;
  if (t === 2) return <g>{R(3, -1, 12, 4, '#9aa3ad')}{R(2, 2, 2, 5, '#8a939e')}{R(14, 2, 2, 5, '#8a939e')}{R(8, 2, 2, 5, '#8a939e')}{R(3, -1, 12, 1, '#d8e0e8')}{R(8, -3, 2, 2, '#c4532e')}</g>;
  if (t === 3) return (
    <g>
      {R(3, 2, 12, 1, '#c8b0ff')}{R(3, 2, 12, 1, '#fff', { opacity: .4 })}
      <path d="M9 -1 L10.5 2 L9 4 L7.5 2 Z" fill="#9ae8ff" stroke="#fff" strokeWidth=".3" />
      <circle cx="9" cy="1.5" r="2.6" fill="#b79bff" opacity=".45" className="hg-pulse" />
    </g>
  );
  return (
    <g className="hg-float">
      <ellipse cx="9" cy="-7" rx="7" ry="1.6" fill="none" stroke="#fff" strokeWidth=".6" opacity=".9" className="hg-pulse" style={{ filter: 'drop-shadow(0 0 1px #c8b0ff)' }} />
      <path d="M3 0 L2.5 -5 L5 -2.5 L7 -6.5 L9 -3 L11 -6.5 L13 -2.5 L15.5 -5 L15 0 Z" fill="#3a2a8a" stroke="#ffd86a" strokeWidth=".5" />
      {[[2.5, -5, '#ff9ae0'], [7, -6.5, '#9ae8ff'], [11, -6.5, '#9ae8ff'], [15.5, -5, '#ff9ae0']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r=".9" fill={c} className="hg-pulse" style={d(i)} />)}
      <path d="M9 -3.2 L10.4 -1.4 L9 .3 L7.6 -1.4 Z" fill="#fff" />
      {[[0, -9], [17, -10], [-1, -3], [19, -2]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 1.2} L${x + .3} ${y} L${x} ${y + 1.2} L${x - .3} ${y} Z M${x - 1.2} ${y} L${x + 1.2} ${y}`} stroke="#fff" strokeWidth=".3" fill="#fff" className="hg-pulse" style={d(i)} />)}
    </g>
  );
}

// ---------- Оружие (огонь → дракон) в правой руке ----------
function Weapon({ t }) {
  if (!t) return null;
  if (t === 1) return <g>{R(17, 13, 1, 13, '#a07040')}{R(16, 25, 3, 1, '#6a4020')}{R(17, 26, 1, 3, '#5a4636')}</g>;
  if (t === 2) return <g>{R(17, 11, 1, 15, '#d8e0e8')}{R(17, 11, 1, 15, '#fff', { opacity: .3 })}{R(15, 25, 5, 1, '#6a727c')}{R(17, 26, 1, 3, '#3a2a1a')}{R(17, 29, 1, 1, '#c8a050')}</g>;
  if (t === 3) return (
    <g>
      <defs><linearGradient id="hgFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ffe08a" /><stop offset=".5" stopColor="#ff8a2a" /><stop offset="1" stopColor="#e2302a" /></linearGradient></defs>
      <path d="M16.4 25 L16.4 10 L17.5 7.5 L18.6 10 L18.6 25 Z" fill="url(#hgFlame)" />
      {[10, 14, 18, 22].map((y, i) => <path key={y} className="hg-flick" style={d(i)} d={`M${i % 2 ? 18.6 : 16.4} ${y + 2} q${i % 2 ? 1.6 : -1.6} -1.5 0 -3`} fill="#ffcf5a" stroke="none" />)}
      {R(14.5, 25, 6, 1.2, '#7a2a10')}{R(17, 26, 1, 3, '#3a1a0a')}
      {[0, 1, 2].map(i => <circle key={i} cx={16.5 + i} cy={9 + i * 4} r=".5" fill="#ffcf5a" className="hg-rise" style={d(i)} />)}
    </g>
  );
  return (
    <g>
      <defs><linearGradient id="hgDragonB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ffcf5a" /><stop offset=".35" stopColor="#c41e1e" /><stop offset="1" stopColor="#3a0808" /></linearGradient></defs>
      <path d="M17.5 24 Q14 14 15.5 6 Q17.5 3 19.5 6 Q21 14 17.5 24 Z" fill="#ff5a1a" opacity=".35" className="hg-pulse" />
      <path d="M16.2 24 L16 6 L17.5 1 L19 6 L18.8 24 Z" fill="url(#hgDragonB)" stroke="#f2c45a" strokeWidth=".35" />
      {[8, 11, 14, 17, 20].map((y, i) => <path key={y} d={`M16.3 ${y} L17.5 ${y + .8} L18.7 ${y}`} fill="none" stroke="#f2c45a" strokeWidth=".25" opacity=".8" className="hg-pulse" style={d(i)} />)}
      <path d="M13.5 24 L16 25.5 L17.5 23.5 L19 25.5 L21.5 24 L20.5 26.5 L14.5 26.5 Z" fill="#8a1e1e" stroke="#f2c45a" strokeWidth=".35" />
      <circle cx="15.2" cy="25" r=".45" fill="#ffe08a" className="hg-pulse" /><circle cx="19.8" cy="25" r=".45" fill="#ffe08a" className="hg-pulse" />
      {R(17, 26.5, 1, 3, '#2a0808')}{R(16.6, 29.5, 1.8, 1, '#f2c45a')}
      {[0, 1, 2, 3].map(i => <path key={i} className="hg-flick" style={{ ...d(i), animationDuration: `${.5 + i * .12}s` }} d={`M${16.2 + i * .9} ${7 + i * 3} q-.8 -2.2 .4 -3.6 q.2 1.4 .8 2 Z`} fill={i % 2 ? '#ffcf5a' : '#ff8a2a'} />)}
      {[0, 1, 2, 3, 4].map(i => <circle key={'e' + i} cx={15 + i * 1.3} cy={6 + (i % 3) * 5} r=".45" fill={i % 2 ? '#ffcf5a' : '#ff6a1a'} className="hg-rise" style={d(i)} />)}
    </g>
  );
}

// ---------- Перчатки (буря) ----------
function Gloves({ t, room }) {
  if (!t) return null;
  const y = room ? 27 : 26, h = room ? 2 : 3;
  const col = ['', '#7a4a2a', '#9aa3ad', '#bfd8ff', '#e8f0ff'][t];
  return (
    <g>
      {R(1, y - 1, 4, h + 1, col)}{R(13, y - 1, 4, h + 1, col)}
      {t >= 2 && <>{R(1, y - 1, 4, 1, t >= 3 ? '#ffe86a' : '#c8d0da')}{R(13, y - 1, 4, 1, t >= 3 ? '#ffe86a' : '#c8d0da')}</>}
      {t >= 3 && [0, 1, 2, 3].map(i => <path key={i} d={`M${i < 2 ? 2 + i * 2 : 14 + (i - 2) * 2} ${y + h} l-.6 1.2 l.8 0 l-.5 1.3`} stroke="#ffe86a" strokeWidth=".35" fill="none" className="hg-zap" style={{ animationDelay: `${-i * .55}s` }} />)}
      {t >= 4 && (
        <g>
          <circle cx="3" cy={y + 1} r="2.4" fill="#7ab0ff" opacity=".3" className="hg-pulse" /><circle cx="15" cy={y + 1} r="2.4" fill="#7ab0ff" opacity=".3" className="hg-pulse" />
          <path d={`M3 ${y + 1} L2 ${y - 4} L4 ${y - 7} L2.5 ${y - 11}`} stroke="#fff" strokeWidth=".45" fill="none" className="hg-zap" style={{ filter: 'drop-shadow(0 0 .8px #7ab0ff)' }} />
          <path d={`M15 ${y + 1} L16.5 ${y - 3} L14.8 ${y - 6} L16 ${y - 10}`} stroke="#fff" strokeWidth=".45" fill="none" className="hg-zap" style={{ animationDelay: '-1.1s', filter: 'drop-shadow(0 0 .8px #7ab0ff)' }} />
          <path d={`M3 ${y + 3} Q9 ${y + 6} 15 ${y + 3}`} stroke="#ffe86a" strokeWidth=".4" fill="none" className="hg-zap" style={{ animationDelay: '-.6s' }} />
        </g>
      )}
    </g>
  );
}

// ---------- Обувь (роща) ----------
function Shoes({ t, room }) {
  if (!t) return null;
  const y = room ? 48 : 46, h = room ? 3 : 5;
  const col = ['', '#a07040', '#5a3a20', '#4a8a3a', '#6ab04a'][t];
  return (
    <g>
      {R(2, y, 7, h, col)}{R(9, y, 7, h, col)}
      {t >= 2 && <>{R(2, y, 7, 1, t >= 3 ? '#f6e38a' : '#7a5a3a')}{R(9, y, 7, 1, t >= 3 ? '#f6e38a' : '#7a5a3a')}</>}
      {t >= 3 && [[2, y - 1], [8, y - 1], [9, y - 1], [15, y - 1]].map(([x, yy], i) => <g key={i} className="hg-sway" style={d(i)}><path d={`M${x + .5} ${yy + 1} q${i % 2 ? 1.6 : -1.6} -1.4 ${i % 2 ? .6 : -.6} -2.6 q${i % 2 ? -.8 : .8} 1 ${i % 2 ? -.6 : .6} 2.6 Z`} fill="#8fd06a" /></g>)}
      {t >= 4 && (
        <g>
          <ellipse cx="9" cy="52.3" rx="11" ry="1.6" fill="none" stroke="#b8f07a" strokeWidth=".4" opacity=".8" className="hg-pulse" />
          <path d="M2 52 q-3 .5 -5 -1 M16 52 q3 .5 5 -1 M5 52 q-1 1.5 -3 2 M13 52 q1 1.5 3 2" stroke="#6a4a2a" strokeWidth=".6" fill="none" />
          {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx={1 + i * 4} cy={50} rx=".8" ry=".4" fill={i % 2 ? '#ff9ac0' : '#e8f5c0'} className="hg-rise" style={{ ...d(i), animationDuration: '3s' }} />)}
        </g>
      )}
    </g>
  );
}

// ---------- Аксессуар (глубины) на груди ----------
function Accessory({ t }) {
  if (!t) return null;
  if (t === 1) return <g>{R(7, 14, 1, 1, '#8a6a4a')}{R(10, 14, 1, 1, '#8a6a4a')}{R(8, 15, 2, 1, '#8a6a4a')}{R(8, 16, 2, 1, '#c4532e')}</g>;
  if (t === 2) return <g>{R(7, 14, 1, 1, '#c8d0da')}{R(10, 14, 1, 1, '#c8d0da')}{R(8, 15, 2, 1, '#c8d0da')}{R(8, 16, 2, 2, '#8a939e')}{R(8, 16, 1, 1, '#fff')}</g>;
  return (
    <g>
      <path d="M6.5 13.5 Q9 16 11.5 13.5" stroke={t >= 4 ? '#bff8ff' : '#e0fbff'} strokeWidth=".35" fill="none" />
      {t === 3 ? <><circle cx="9" cy="16.6" r="1.3" fill="#e0fbff" stroke="#3ad0e0" strokeWidth=".3" /><circle cx="8.6" cy="16.2" r=".4" fill="#fff" /><circle cx="9" cy="16.6" r="2" fill="#3ad0e0" opacity=".22" className="hg-pulse" /></>
        : <>
          <path d="M9 14.6 Q11 17.4 9 19.2 Q7 17.4 9 14.6 Z" fill="#3ad0e0" stroke="#e0fbff" strokeWidth=".35" style={{ filter: 'drop-shadow(0 0 1px #3ad0e0)' }} />
          <path d="M8.6 15.8 Q8.2 17 8.7 18" stroke="#fff" strokeWidth=".3" fill="none" />
          <circle cx="9" cy="17" r="2.4" fill="#3ad0e0" opacity=".2" className="hg-pulse" />
          {[0, 1, 2, 3].map(i => <circle key={i} cx={6 + i * 2} cy={16} r={.5 + (i % 2) * .3} fill="none" stroke="#bff8ff" strokeWidth=".25" className="hg-rise" style={{ ...d(i), animationDuration: '2.8s' }} />)}
        </>}
    </g>
  );
}

// ---------- Артефакт (лёд) парит у левого плеча ----------
function Artifact({ t }) {
  if (!t) return null;
  if (t === 1) return <g className="hg-float">{R(-4, 22, 3, 5, '#f2e6c8')}{R(-4, 22, 3, 1, '#a07040')}{R(-4, 26, 3, 1, '#a07040')}</g>;
  if (t === 2) return <g className="hg-float">{R(-5, 21, 4, 5, '#2f6b6e')}{R(-4, 21, 3, 5, '#f2eee5')}{R(-5, 21, 1, 5, '#1e4a4c')}</g>;
  if (t === 3) return (
    <g className="hg-float">
      <circle cx="-3" cy="20" r="3.4" fill="#9ae8ff" opacity=".3" className="hg-pulse" />
      <path d="M-3 16 L-1 20 L-3 24 L-5 20 Z" fill="#e8fbff" stroke="#7ac7f0" strokeWidth=".35" />
      <path d="M-3 16 L-1 20 L-3 20.4 Z" fill="#fff" />
      {[0, 1, 2].map(i => <path key={i} d={`M${-6 + i * 3} 15 l.4 .6 l-.4 .6 l-.4 -.6 Z`} fill="#fff" className="hg-fall" style={d(i)} />)}
    </g>
  );
  return (
    <g>
      <g className="hg-float">
        <circle cx="-4" cy="13" r="4.5" fill="#9ae8ff" opacity=".25" className="hg-pulse" />
        <g className="hg-flap"><path d="M-4 13 L-10 7 L-8.5 10.5 L-11 10 L-8 13 Z" fill="#e8fbff" stroke="#7ac7f0" strokeWidth=".3" /></g>
        <g transform="translate(-8 0) scale(-1 1)"><g className="hg-flap"><path d="M-4 13 L-10 7 L-8.5 10.5 L-11 10 L-8 13 Z" fill="#e8fbff" stroke="#7ac7f0" strokeWidth=".3" /></g></g>
        <path d="M-5.5 13 Q-4 11 -2.5 13 Q-4 15.5 -5.5 13 Z" fill="#bfe8ff" stroke="#fff" strokeWidth=".3" />
        <path d="M-2.6 12.5 L-1.2 12.9 L-2.6 13.3 Z" fill="#ffe86a" />
        <path d="M-4.5 15 L-5.5 18 L-4 16.6 L-4 19 L-3.2 16.4 Z" fill="#9ae8ff" />
      </g>
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${-8 + i * 3} 18 l.45 .7 l-.45 .7 l-.45 -.7 Z`} fill="#fff" className="hg-fall" style={{ ...d(i), animationDuration: '3.2s' }} />)}
    </g>
  );
}

/** Слои снаряжения для героя 18×53. room: пропорции героя из комнаты. */
export function gearLayers(gear = {}, room = false) {
  const g = (k) => Math.max(0, Math.min(4, gear[k] || 0));
  return {
    back: <g><ArmorBack t={g('armor')} /></g>,
    body: <g><Armor t={g('armor')} /><Accessory t={g('accessory')} /><Gloves t={g('gloves')} room={room} /><Shoes t={g('shoes')} room={room} /></g>,
    head: <g><Helmet t={g('helmet')} /></g>,
    front: <g><Weapon t={g('weapon')} /><Artifact t={g('artifact')} /></g>,
  };
}
export function gearFromSlots(slots) { return Object.fromEntries((slots || []).map(s => [s.slot, s.tierIdx ?? 0])); }
