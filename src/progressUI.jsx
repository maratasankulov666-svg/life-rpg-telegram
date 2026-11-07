// progressUI.jsx — раздел «Прогресс» в стиле «бумага + пиксель»: карта мира с землями-характеристиками,
// карточка героя (звание, уровень), строки характеристик. Только отображение — данные приходят из App.jsx.
import React from 'react';
import { PAPER, STAT_RU, STAT_COLOR, StatTile, PixelIcon, FlameIcon } from './actionsUI.jsx';

export const STAGES = ['Пустошь', 'Поселение', 'Городок', 'Город', 'Столица', 'Легендарные земли'];
export function stageOf(v) { return Math.max(0, Math.min(5, Math.floor((Number(v) || 0) / 20))); }

// Земли карты (координаты в единицах 180×105). Одна земля на каждую характеристику.
export const LANDS = [
  { key: 'knowledge', name: 'Серебряный лес', x: 44, y: 28, ground: '#9fbf7a', deco: 'forest' },
  { key: 'focus', name: 'Башня фокуса', x: 100, y: 18, ground: '#d8c49a', deco: 'sand' },
  { key: 'career', name: 'Столичная долина', x: 128, y: 38, ground: '#e2d6c0', deco: 'plain' },
  { key: 'discipline', name: 'Крепость воли', x: 18, y: 54, ground: '#b8c4cc', deco: 'stone' },
  { key: 'mental', name: 'Святилище', x: 82, y: 50, ground: '#c8c0dc', deco: 'sanctum' },
  { key: 'creator', name: 'Хребет искр', x: 152, y: 62, ground: '#c9a27a', deco: 'ridge' },
  { key: 'physical', name: 'Пепельные дюны', x: 34, y: 80, ground: '#d6c4a0', deco: 'dunes' },
  { key: 'finance', name: 'Рудники', x: 70, y: 84, ground: '#b8aa90', deco: 'mines' },
  { key: 'social', name: 'Острова', x: 136, y: 88, ground: '#cfe0c0', deco: 'isles' },
];
export const ROADS = [
  ['knowledge', 'focus'], ['focus', 'career'], ['knowledge', 'mental'], ['mental', 'career'], ['career', 'creator'],
  ['discipline', 'knowledge'], ['discipline', 'physical'], ['physical', 'finance'], ['finance', 'mental'],
  ['finance', 'social'], ['creator', 'social'], ['mental', 'focus'],
];

const CSS = `
@keyframes pgWave { 50% { transform: translateX(2px); } }
@keyframes pgCloud { from { transform: translateX(-40px); } to { transform: translateX(220px); } }
@keyframes pgFlag { 50% { transform: scaleX(.6); } }
@keyframes pgFire { 50% { transform: scaleY(.6); } }
@keyframes pgSel { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes pgAura { 0%,100% { opacity: .35; transform: scale(1); } 50% { opacity: .75; transform: scale(1.15); } }
@keyframes pgDash { to { stroke-dashoffset: -8; } }
@keyframes pgTw { 0%,100% { opacity: .1; } 50% { opacity: 1; } }
@keyframes pgFog { 0%,100% { transform: translateX(0); opacity: .85; } 50% { transform: translateX(2px); opacity: .7; } }
@keyframes pgShine { from { transform: translateX(-120%); } to { transform: translateX(220%); } }
.pg-wave { animation: pgWave 2.4s steps(2) infinite; }
.pg-cloud { animation: pgCloud 46s linear infinite; }
.pg-cloud2 { animation: pgCloud 70s linear infinite; animation-delay: -30s; }
.pg-flag { animation: pgFlag .9s steps(2) infinite; transform-box: fill-box; transform-origin: 0 50%; }
.pg-fire { animation: pgFire .4s steps(2) infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.pg-sel { animation: pgSel 1s steps(2) infinite; }
.pg-aura { animation: pgAura 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.pg-dash { animation: pgDash 1.2s linear infinite; }
.pg-tw { animation: pgTw 1.6s steps(2) infinite; }
.pg-fog { animation: pgFog 5s ease-in-out infinite; }
.pg-shine { position: absolute; top: 0; bottom: 0; width: 40%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); animation: pgShine 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .pg-wave,.pg-cloud,.pg-cloud2,.pg-flag,.pg-fire,.pg-sel,.pg-aura,.pg-dash,.pg-tw,.pg-fog,.pg-shine { animation: none; } }
`;
let injected = false;
function useCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

// ---------- Поселение на земле: растёт по стадиям ----------
function Settlement({ x, y, stage }) {
  const R = (dx, dy, w, h, f, cls) => <rect className={cls} x={x + dx} y={y + dy} width={w} height={h} fill={f} />;
  if (stage === 0) return (
    <g>
      {R(-1, -6, 1, 6, '#6e5844')}{R(-3, -5, 2, 1, '#6e5844')}{R(0, -4, 2, 1, '#6e5844')}
      {R(2, -2, 3, 2, '#a89a84')}{R(-5, -1, 2, 1, '#a89a84')}
    </g>
  );
  if (stage === 1) return (
    <g>
      {R(-4, -5, 1, 1, '#a4412a')}{R(-5, -4, 3, 1, '#a4412a')}{R(-6, -3, 5, 3, '#b5654a')}{R(-4, -2, 1, 2, '#3e3026')}
      <g className="pg-fire">{R(2, -3, 2, 3, '#e07a3a')}{R(2, -2, 2, 1, '#f6c47a')}</g>{R(1, 0, 4, 1, '#6e4630')}
    </g>
  );
  const house = (dx, dy, roof = '#a4412a') => (
    <g key={dx + ':' + dy}>{R(dx, dy - 3, 5, 3, '#efe6d2')}{R(dx - 1, dy - 5, 7, 2, roof)}{R(dx + 1, dy - 7, 3, 2, roof)}{R(dx + 2, dy - 2, 1, 2, '#5a4636')}</g>
  );
  if (stage === 2) return <g>{house(-7, 0)}{house(1, 1, '#2f6b6e')}</g>;
  if (stage === 3) return (
    <g>{house(-9, 1)}{house(4, 1, '#2f6b6e')}{R(-3, -10, 6, 10, '#d8cbb4')}{R(-3, -11, 6, 1, '#a89a84')}{R(-2, -12, 1, 1, '#a89a84')}{R(1, -12, 1, 1, '#a89a84')}{R(-1, -7, 2, 2, '#3e3026')}</g>
  );
  const castle = (
    <g>
      {R(-9, -6, 18, 6, '#d8cbb4')}{R(-9, -7, 2, 1, '#d8cbb4')}{R(-5, -7, 2, 1, '#d8cbb4')}{R(-1, -7, 2, 1, '#d8cbb4')}{R(3, -7, 2, 1, '#d8cbb4')}{R(7, -7, 2, 1, '#d8cbb4')}
      {R(-11, -11, 5, 11, '#e6dcc6')}{R(6, -11, 5, 11, '#e6dcc6')}{R(-11, -12, 5, 1, '#a89a84')}{R(6, -12, 5, 1, '#a89a84')}
      {R(-3, -15, 6, 15, '#efe6d2')}{R(-4, -16, 8, 2, '#a4412a')}{R(-1, -4, 2, 4, '#5a4636')}
      {R(0, -22, 1, 6, '#3e3026')}<g className="pg-flag">{R(1, -22, 5, 3, stage === 5 ? '#c48a2a' : '#a4412a')}</g>
    </g>
  );
  if (stage === 4) return castle;
  return (
    <g>
      <ellipse className="pg-aura" cx={x} cy={y - 8} rx="18" ry="13" fill="#f6d08a" opacity=".45" />
      {castle}
      <g fill="#f6e6b0">
        <rect className="pg-tw" x={x - 14} y={y - 18} width="1" height="1" /><rect className="pg-tw" x={x + 13} y={y - 14} width="1" height="1" style={{ animationDelay: '-.6s' }} /><rect className="pg-tw" x={x + 4} y={y - 25} width="1" height="1" style={{ animationDelay: '-1.1s' }} />
      </g>
    </g>
  );
}

function LandGround({ l, stage }) {
  const { x, y, ground, deco } = l;
  const blob = [[-14, -6, 28, 12], [-11, -9, 22, 18], [-7, -11, 14, 22]];
  const tint = stage === 0 ? '#c9bfae' : ground;
  return (
    <g>
      {blob.map((b, i) => <rect key={i} x={x + b[0]} y={y + b[1]} width={b[2]} height={b[3]} fill={tint} />)}
      {stage > 0 && deco === 'forest' && <g fill="#5a7a4a">{[[-12, -4], [9, -6], [-9, 4], [10, 3], [-3, 7]].map(([dx, dy], i) => <g key={i}><rect x={x + dx} y={y + dy - 3} width="3" height="3" /><rect x={x + dx + 1} y={y + dy} width="1" height="1" fill="#6e5844" /></g>)}</g>}
      {stage > 0 && deco === 'ridge' && <g fill="#a07a5a">{[[-13, 0], [8, -2]].map(([dx, dy], i) => <g key={i}><rect x={x + dx} y={y + dy - 4} width="6" height="4" /><rect x={x + dx + 1} y={y + dy - 6} width="4" height="2" /><rect x={x + dx + 2} y={y + dy - 7} width="2" height="1" fill="#f2eee5" /></g>)}</g>}
      {stage > 0 && deco === 'mines' && <g>{[[-12, 2], [9, -3]].map(([dx, dy], i) => <g key={i}><rect x={x + dx} y={y + dy - 3} width="4" height="3" fill="#8a7a64" /><rect x={x + dx + 1} y={y + dy - 2} width="2" height="2" fill="#3e3026" /></g>)}<rect x={x + 10} y={y + 4} width="2" height="1" fill="#c48a2a" /></g>}
      {stage > 0 && deco === 'sanctum' && <g fill="#9a8ab8"><rect x={x - 12} y={y - 3} width="2" height="6" /><rect x={x + 10} y={y - 3} width="2" height="6" /><rect x={x - 12} y={y - 4} width="24" height="1" opacity=".5" /></g>}
      {stage > 0 && deco === 'isles' && <g fill="#7a9a56"><rect x={x - 12} y={y + 3} width="4" height="2" /><rect x={x + 9} y={y - 5} width="4" height="2" /></g>}
      {stage > 0 && deco === 'dunes' && <g fill="#c4ae80"><rect x={x - 12} y={y + 2} width="6" height="1" /><rect x={x + 6} y={y - 4} width="6" height="1" /></g>}
      {stage > 0 && deco === 'stone' && <g fill="#8a96a0"><rect x={x - 12} y={y - 2} width="3" height="2" /><rect x={x + 9} y={y + 3} width="3" height="2" /></g>}
      {stage > 0 && deco === 'sand' && <g fill="#c4ae80"><rect x={x - 11} y={y + 3} width="5" height="1" /><rect x={x + 7} y={y - 3} width="4" height="1" /></g>}
    </g>
  );
}

/** Карта мира: земли растут от характеристик, неоткрытые — под туманом. */
export function WorldMapPixel({ stats, selected, onSelect }) {
  useCss();
  const byKey = Object.fromEntries(LANDS.map(l => [l.key, l]));
  const st = (k) => stageOf(stats[k]);
  return (
    <svg viewBox="0 0 180 105" shapeRendering="crispEdges" role="img" aria-label="Карта мира героя" style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'manipulation' }}>
      <rect width="180" height="105" fill="#a9c6db" />
      <g className="pg-wave" fill="#bcd4e4">
        {[[8, 6], [40, 4], [150, 8], [168, 30], [4, 96], [96, 100], [172, 100], [112, 70]].map(([x, y], i) => <rect key={i} x={x} y={y} width="5" height="1" />)}
      </g>
      <g fill="#e6dcc6">
        <rect x="6" y="14" width="164" height="80" /><rect x="10" y="10" width="150" height="88" /><rect x="22" y="7" width="120" height="94" />
      </g>
      <g fill="#d8cdb8"><rect x="6" y="92" width="164" height="2" /><rect x="10" y="96" width="150" height="2" /><rect x="22" y="99" width="120" height="2" /></g>
      <rect x="120" y="76" width="34" height="22" fill="#a9c6db" />
      <g className="pg-wave" fill="#bcd4e4"><rect x="124" y="80" width="4" height="1" /><rect x="142" y="94" width="5" height="1" /></g>

      {ROADS.map(([a, b], i) => {
        const A = byKey[a], B = byKey[b];
        const open = st(a) > 0 && st(b) > 0;
        return <line key={i} className={open ? 'pg-dash' : undefined} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={open ? '#a4412a' : '#bfb39c'} strokeWidth="1" strokeDasharray="2 2" shapeRendering="auto" opacity={open ? 0.8 : 0.6} />;
      })}

      {LANDS.map(l => <LandGround key={l.key} l={l} stage={st(l.key)} />)}
      {LANDS.map(l => <Settlement key={l.key} x={l.x} y={l.y + 4} stage={st(l.key)} />)}

      {LANDS.filter(l => st(l.key) === 0).map(l => (
        <g key={l.key} className="pg-fog" fill="#f2eee5" opacity=".8" pointerEvents="none">
          <rect x={l.x - 13} y={l.y - 6} width="12" height="5" /><rect x={l.x - 4} y={l.y - 10} width="14" height="6" /><rect x={l.x + 2} y={l.y + 1} width="11" height="5" />
        </g>
      ))}

      <g className="pg-cloud" fill="#ffffff" opacity=".6" pointerEvents="none"><rect x="0" y="22" width="16" height="4" /><rect x="4" y="19" width="8" height="3" /></g>
      <g className="pg-cloud2" fill="#ffffff" opacity=".5" pointerEvents="none"><rect x="0" y="64" width="12" height="3" /><rect x="3" y="62" width="6" height="2" /></g>

      {LANDS.map(l => {
        const sel = l.key === selected;
        return (
          <g key={l.key} onClick={() => onSelect && onSelect(l.key)} style={{ cursor: 'pointer' }}>
            <rect x={l.x - 16} y={l.y - 14} width="32" height="26" fill="transparent" />
            {sel && (
              <g className="pg-sel" fill={PAPER.terra}>
                <rect x={l.x - 16} y={l.y - 14} width="5" height="1" /><rect x={l.x - 16} y={l.y - 14} width="1" height="5" />
                <rect x={l.x + 11} y={l.y - 14} width="5" height="1" /><rect x={l.x + 15} y={l.y - 14} width="1" height="5" />
                <rect x={l.x - 16} y={l.y + 11} width="5" height="1" /><rect x={l.x - 16} y={l.y + 7} width="1" height="5" />
                <rect x={l.x + 11} y={l.y + 11} width="5" height="1" /><rect x={l.x + 15} y={l.y + 7} width="1" height="5" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Мини-превью стадии для полосы стадий. */
export function StageMini({ stage, on, size = 40 }) {
  return (
    <svg viewBox="-16 -26 32 30" width={size} height={size * 0.94} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', opacity: on ? 1 : 0.35, filter: on ? 'none' : 'grayscale(1)' }}>
      <rect x="-16" y="0" width="32" height="4" fill="#9fbf7a" />
      <Settlement x={0} y={0} stage={stage} />
    </svg>
  );
}

// ---------- Звание героя ----------
export const RANKS = [
  { min: 1, name: 'Новичок' }, { min: 5, name: 'Искатель' }, { min: 10, name: 'Странник' },
  { min: 20, name: 'Мастер' }, { min: 35, name: 'Герой' }, { min: 50, name: 'Легенда' },
];
export function rankOf(level) { let r = RANKS[0]; RANKS.forEach(x => { if (level >= x.min) r = x; }); return r; }

export function HeroRankCard({ level, xp, xpNeed, power, days, quests, bestStreak }) {
  useCss();
  const segs = 20;
  const on = Math.floor((xp / Math.max(1, xpNeed)) * segs);
  const rank = rankOf(level);
  const next = RANKS.find(r => r.min > level);
  return (
    <div className="lrpg-paper lrpg-stagger" style={{ padding: '14px 14px 12px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 74, height: 74, flexShrink: 0, borderRadius: 16, background: '#1e2230', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 #0e1018' }}>
          <span className="lrpg-mono" style={{ fontSize: 8, color: '#d8cdb8' }}>ур.</span>
          <span className="lrpg-display" style={{ fontSize: 36, fontWeight: 700, color: '#f6d08a', lineHeight: 1 }}>{level}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lrpg-mono" style={{ fontSize: 9, color: PAPER.terra }}>Звание</div>
          <div className="lrpg-display" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{rank.name}</div>
          <div style={{ fontSize: 12, color: PAPER.muted, marginTop: 2 }}>{next ? `«${next.name}» с ${next.min} уровня` : 'Высшее звание'}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ position: 'relative', display: 'flex', gap: 2, overflow: 'hidden', borderRadius: 3 }}>
          {Array.from({ length: segs }, (_, i) => <span key={i} style={{ flex: 1, height: 9, background: i < on ? PAPER.terra : '#e6e0d3' }} />)}
          {on > 0 && <span className="pg-shine" />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span className="lrpg-num" style={{ fontSize: 11, color: PAPER.muted }}>{Math.round(xp)} / {xpNeed} XP</span>
          <span className="lrpg-mono" style={{ fontSize: 9, color: PAPER.terra }}>до ур. {level + 1} — {Math.max(0, Math.round(xpNeed - xp))}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${PAPER.line2}` }}>
        {[
          { v: power, l: 'сила героя' },
          { v: days, l: 'дней в игре' },
          { v: quests, l: 'заданий' },
          { v: bestStreak, l: 'лучшая серия', flame: true },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {c.flame && <FlameIcon n={c.v} size={13} />}
              <span className="lrpg-num" style={{ fontSize: 17, fontWeight: 700 }}>{c.v}</span>
            </span>
            <span style={{ fontSize: 10, color: PAPER.muted, textAlign: 'center', lineHeight: 1.15 }}>{c.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Строка характеристики ----------
export function StatRow({ stat, value, delta, active, onClick, index = 0 }) {
  const c = STAT_COLOR[stat] || PAPER.terra;
  const full = Math.floor(value / 10);
  const part = (value % 10) / 10;
  return (
    <button className="lrpg-btn lrpg-stagger" onClick={onClick} style={{
      animationDelay: `${index * 35}ms`, display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      background: active ? c + '12' : 'transparent', border: `1px solid ${active ? c + '55' : 'transparent'}`, borderRadius: 12, padding: '7px 8px', color: PAPER.ink,
    }}>
      <StatTile stat={stat} size={32} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{STAT_RU[stat] || stat}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {delta !== 0 && <span className="lrpg-num" style={{ fontSize: 10.5, fontWeight: 700, color: delta > 0 ? PAPER.green : '#b8432e' }}>{delta > 0 ? '+' : ''}{delta}</span>}
            <span className="lrpg-num" style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
          </span>
        </span>
        <span style={{ display: 'flex', gap: 2, marginTop: 5 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 1, background: '#e6e0d3', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: i < full ? '100%' : i === full ? `${part * 100}%` : '0%', background: c }} />
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export { PixelIcon };

// ---------- Парящие острова: карта мира 3.0 ----------
// Каждая земля — остров в небе со своей стихией. Растёт по стадиям: голая скала → трава и шатёр → постройки →
// город → столица с флагом → легендарный остров с сиянием, рунами и птицами. Открытые острова связаны мостами,
// закрытые прячутся в облаках. Небо следует реальному времени суток. Рост стадии отмечается вспышкой острова.
const SKY_POS = {
  knowledge: [.24, .27], focus: [.55, .17], career: [.76, .33], discipline: [.12, .53], mental: [.47, .49],
  creator: [.85, .6], physical: [.2, .79], finance: [.45, .8], social: [.74, .85],
};
const SKY_BIOME = {
  knowledge: 'forest', focus: 'desert', career: 'plains', discipline: 'stone', mental: 'lake', creator: 'volcano', physical: 'dunes', finance: 'mines', social: 'isles',
};
const SKY_COL = { forest: ['#5fa05a', '#3a6a2a'], desert: ['#e8c87a', '#b08a40'], plains: ['#9cc86a', '#5a8a3a'], stone: ['#a8b0bc', '#6a7480'], lake: ['#9ac8b0', '#5a8a7a'], volcano: ['#7a5a4a', '#4a2a1a'], dunes: ['#ecd29a', '#b8965a'], mines: ['#b8a07a', '#7a6440'], isles: ['#9ad0c0', '#4a8a8a'] };
const SKY_W = 360, SKY_H = 380;
function skyRng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function skyPhase() { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 5.5 || h >= 21 ? 'night' : h < 8 ? 'dawn' : h >= 18 ? 'dusk' : 'day'; }

function drawIsland(ctx, z, s, t, sel, birds, burst) {
  const bob = Math.sin(t / 1100 + z.ph) * 3, x = z.x, y = z.y + bob, w = z.w * (0.8 + s * 0.06);
  const [top, deep] = s === 0 ? ['#b8b0a0', '#7a7060'] : SKY_COL[z.b];
  if (s === 5) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, w * 1.6); g.addColorStop(0, 'rgba(255,230,150,.55)'); g.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 10, w * 1.6, 0, 6.3); ctx.fill();
    ctx.translate(x, y - 14); ctx.rotate(t / 3000); ctx.strokeStyle = 'rgba(255,240,190,.75)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(0, 0, w * 1.15, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.arc(Math.cos(a) * w * 1.15, Math.sin(a) * w * 1.15, 1.8, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
  if (burst) {
    const p = burst; ctx.save(); ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = '#ffd86a'; ctx.lineWidth = 3 * (1 - p) + .5; ctx.beginPath(); ctx.ellipse(x, y, w + p * 60, (w + p * 60) * .5, 0, 0, 6.3); ctx.stroke();
    const g = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, w * 2); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 10, w * 2, 0, 6.3); ctx.fill();
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28, r = 10 + p * 70; ctx.fillStyle = k % 2 ? '#ffd86a' : '#fff'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y - 10 + Math.sin(a) * r * .7 - p * 20, 2.2, 0, 6.3); ctx.fill(); }
    ctx.restore(); ctx.lineWidth = 1;
  }
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * .6, y + w * .7, x - w * .1, y + w * 1.15); ctx.quadraticCurveTo(x + w * .2, y + w * .8, x + w * .5, y + w * .6); ctx.quadraticCurveTo(x + w * .9, y + w * .3, x + w, y); ctx.closePath();
  const rg = ctx.createLinearGradient(0, y, 0, y + w * 1.15); rg.addColorStop(0, '#8a7a68'); rg.addColorStop(1, '#4a4038'); ctx.fillStyle = rg; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w * (1 - k * .2), y + k * 6); ctx.lineTo(x + w * (1 - k * .2), y + k * 5); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(x, y, w, w * .36, 0, 0, 6.3); ctx.fillStyle = top; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + 2, w, w * .36, 0, 0, Math.PI); ctx.strokeStyle = deep; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1;
  const b = z.b;
  if (s > 0) {
    if (b === 'forest' || b === 'plains') for (let k = 0; k < 2 + s * 2; k++) { const tx = x - w * .7 + ((k * 37) % (w * 1.4)), ty = y - 4 + (k % 3) * 3; ctx.fillStyle = b === 'forest' ? '#2a5a2a' : '#6a9a3a'; ctx.beginPath(); ctx.moveTo(tx, ty - 10); ctx.lineTo(tx + 4, ty); ctx.lineTo(tx - 4, ty); ctx.fill(); }
    if (b === 'stone') for (let k = 0; k < 2 + s; k++) { const tx = x - w * .6 + k * 10, ty = y - 2, hh = 14 + (k % 2) * 5; ctx.fillStyle = '#6a7480'; ctx.beginPath(); ctx.moveTo(tx - 6, ty); ctx.lineTo(tx, ty - hh); ctx.lineTo(tx + 6, ty); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(tx - 2, ty - hh + 4); ctx.lineTo(tx, ty - hh); ctx.lineTo(tx + 2, ty - hh + 4); ctx.fill(); }
    if (b === 'lake') { ctx.beginPath(); ctx.ellipse(x + w * .3, y, w * .3, w * .12, 0, 0, 6.3); ctx.fillStyle = '#6ab0d0'; ctx.fill(); if (s >= 3) { ctx.strokeStyle = 'rgba(180,230,255,.85)'; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t / 40; ctx.beginPath(); ctx.moveTo(x + w * .55, y + 4); ctx.lineTo(x + w * .55, y + 60); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.lineWidth = 1; } }
    if (b === 'volcano') { ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 4, y - 22); ctx.lineTo(x + 4, y - 22); ctx.lineTo(x + 16, y); ctx.fill(); ctx.fillStyle = '#ff6a1a'; ctx.fillRect(x - 3, y - 23, 6, 3); for (let k = 0; k < 3; k++) { const p = ((t / 1200 + k / 3) % 1); ctx.globalAlpha = 1 - p; ctx.fillStyle = k ? '#9a8a7a' : '#ffb03a'; ctx.beginPath(); ctx.arc(x + Math.sin(p * 5) * 3, y - 26 - p * 20, 2 + p * 5, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; } }
    if (b === 'desert' || b === 'dunes') { ctx.strokeStyle = '#b08a40'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 14 + k * 12, y + 3, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    if (b === 'desert' && s >= 3) { ctx.fillStyle = '#f0e8d8'; ctx.fillRect(x + w * .45, y - 30, 7, 28); ctx.fillStyle = '#c48a2a'; ctx.beginPath(); ctx.arc(x + w * .45 + 3.5, y - 32, 4.5, 0, 6.3); ctx.fill(); }
    if (b === 'mines') { ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.arc(x - w * .4, y, 8, Math.PI, 0); ctx.fill(); ctx.fillStyle = Math.sin(t / 300) > 0 ? '#ffd86a' : '#fff0b0'; ctx.fillRect(x - w * .4 - 2, y - 4, 3, 3); }
    if (b === 'isles') for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a8a6a'; ctx.fillRect(x - 14 + k * 12, y - 12, 2, 10); ctx.beginPath(); ctx.ellipse(x - 13 + k * 12, y - 12, 6, 2, -.4, 0, 6.3); ctx.fill(); }
    if (s === 1) { ctx.fillStyle = '#e8d8b8'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 9); ctx.lineTo(x + 6, y); ctx.fill(); ctx.fillStyle = '#c8b090'; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 6, y); ctx.lineTo(x, y); ctx.fill(); }
    if (s >= 2) {
      const bx = x + (b === 'volcano' ? 16 : 0), by = y - 2;
      for (let k = 0; k < Math.min(4, s - 1); k++) { const hx = bx - 8 + k * 7, hh = 6 + (k === 1 ? s * 3 : 2); ctx.fillStyle = '#f0e8d8'; ctx.fillRect(hx, by - hh, 6, hh); ctx.fillStyle = s >= 4 && k === 1 ? '#c8861a' : '#a4412a'; ctx.beginPath(); ctx.moveTo(hx - 1, by - hh); ctx.lineTo(hx + 3, by - hh - 5); ctx.lineTo(hx + 7, by - hh); ctx.fill(); }
      if (s >= 4) { ctx.fillStyle = '#5a4636'; ctx.fillRect(bx, by - 30, 1, 10); ctx.fillStyle = s === 5 ? '#ffd86a' : '#a4412a'; ctx.fillRect(bx + 1, by - 30, 6 + Math.sin(t / 200), 3); }
    }
  } else {
    ctx.fillStyle = 'rgba(240,240,245,.88)';
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - w + k * w * .4 + Math.sin(t / 1000 + k) * 3, y - 4 + (k % 2) * 6, 12, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#6b6f7a'; ctx.font = '700 8px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('в облаках', x, y + 2);
  }
  if (s >= 4) birds.forEach((bd, k) => { if (k > s - 3) return; const a = bd.a + t / 1500, px = x + Math.cos(a) * bd.r * 1.4, py = y - 30 + Math.sin(a) * bd.r * .4, f = 2 * Math.abs(Math.sin(t / 150 + k)); ctx.strokeStyle = '#3a3a4a'; ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.quadraticCurveTo(px - 1.5, py - f, px, py); ctx.quadraticCurveTo(px + 1.5, py - f, px + 3, py); ctx.stroke(); });
  return { x, y, w };
}

export function SkyIslandsMap({ stats, selected, onSelect, celebrate }) {
  const ref = React.useRef(null);
  const live = React.useRef({ stats, selected, celebrate, burstAt: 0 });
  live.current.stats = stats; live.current.selected = selected;
  if (celebrate && live.current.celebrate !== celebrate) { live.current.celebrate = celebrate; live.current.burstAt = performance.now(); }
  const isl = React.useMemo(() => { const R = skyRng(5); return LANDS.map(l => ({ k: l.key, n: l.name, b: SKY_BIOME[l.key], x: 40 + SKY_POS[l.key][0] * 280, y: 40 + SKY_POS[l.key][1] * 300, ph: R() * 6, w: 34 + (l.key === 'career' ? 4 : 0) })); }, []);
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const R = skyRng(9);
    const clouds = Array.from({ length: 9 }, () => ({ x: R() * 400, y: R() * 380, s: R() * .6 + .5, v: R() * .15 + .05 }));
    const birds = Array.from({ length: 5 }, () => ({ a: R() * 6, r: 16 + R() * 10 }));
    const stars = Array.from({ length: 50 }, () => [R() * SKY_W, R() * SKY_H * .7, R() * 6]);
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = true, alive = true;
    const fit = () => { const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect(); cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.width * SKY_H / SKY_W * dpr); ctx.setTransform(cv.width / SKY_W, 0, 0, cv.height / SKY_H, 0, 0); };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; if (ro) ro.observe(cv);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && alive) raf = requestAnimationFrame(draw); }) : null; if (io) io.observe(cv);
    function draw(t) {
      raf = 0; if (!alive) return;
      const { stats: st, selected: sel, burstAt } = live.current;
      const stage = (k) => stageOf(st[k]);
      const ph = skyPhase(), calm = document.body.classList.contains('lrpg-calm');
      const g = ctx.createLinearGradient(0, 0, 0, SKY_H);
      const sky = { day: ['#7ab0e0', '#cfe4f2', '#f6e8d8'], dawn: ['#f0a8a0', '#f6d0b0', '#fbeedd'], dusk: ['#6a5aa0', '#e89a8a', '#f6d0a8'], night: ['#0c1430', '#1e2a58', '#3a3a6a'] }[ph];
      g.addColorStop(0, sky[0]); g.addColorStop(.6, sky[1]); g.addColorStop(1, sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, SKY_W, SKY_H);
      if (ph === 'night') stars.forEach(([x, y, p]) => { ctx.globalAlpha = .3 + Math.abs(Math.sin(t / 700 + p)) * .7; ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 1.2, 1.2); });
      ctx.globalAlpha = 1;
      const sx = ph === 'night' ? 60 : 300, sun = ctx.createRadialGradient(sx, 50, 4, sx, 50, 80);
      sun.addColorStop(0, ph === 'night' ? 'rgba(230,236,255,.85)' : 'rgba(255,250,220,.9)'); sun.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, SKY_W, SKY_H);
      clouds.forEach(c => { if (!calm) c.x += c.v; if (c.x > 420) c.x = -60; ctx.fillStyle = ph === 'night' ? 'rgba(160,170,210,.35)' : 'rgba(255,255,255,.7)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(c.x + k * 14 * c.s, c.y + (k % 2) * 4, 12 * c.s, 0, 6.3); ctx.fill(); } });
      ROADS.forEach(([a, b]) => {
        const A = isl.find(z => z.k === a), B = isl.find(z => z.k === b); if (!A || !B || !(stage(a) > 0 && stage(b) > 0)) return;
        const ay = A.y + Math.sin(t / 1100 + A.ph) * 3, by = B.y + Math.sin(t / 1100 + B.ph) * 3;
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(A.x, ay); ctx.quadraticCurveTo((A.x + B.x) / 2, (ay + by) / 2 + 16, B.x, by); ctx.stroke();
        ctx.setLineDash([2, 3]); ctx.strokeStyle = '#c8a070'; ctx.beginPath(); ctx.moveTo(A.x, ay + 2); ctx.quadraticCurveTo((A.x + B.x) / 2, (ay + by) / 2 + 18, B.x, by + 2); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
      });
      const bp = burstAt ? (t - burstAt) / 2200 : 2;
      isl.slice().sort((a, b) => a.y - b.y).forEach(z => {
        const on = z.k === sel, s = stage(z.k);
        const r = drawIsland(ctx, z, s, t, on, birds, bp >= 0 && bp < 1 && z.k === live.current.celebrate ? bp : 0);
        ctx.font = `${on ? 800 : 700} ${on ? 10.5 : 9}px Manrope, sans-serif`; ctx.textAlign = 'center';
        const ly = r.y + r.w * .36 + 13;
        if (on) { const tw = ctx.measureText(z.n).width + 12; ctx.fillStyle = 'rgba(30,34,48,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(r.x - tw / 2, ly - 10, tw, 14, 7) : ctx.rect(r.x - tw / 2, ly - 10, tw, 14); ctx.fill(); ctx.fillStyle = '#ffd86a'; }
        else ctx.fillStyle = ph === 'night' ? '#e8ecff' : '#1e2230';
        ctx.fillText(z.n, r.x, ly);
        if (on) { ctx.strokeStyle = '#a4412a'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(r.x, r.y, r.w + 8, r.w * .36 + 8, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]); }
      });
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); };
  }, [isl]);
  const onClick = (e) => {
    const r = ref.current.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * SKY_W, y = (e.clientY - r.top) / r.height * SKY_H;
    let best = null, bd = 1e9; isl.forEach(z => { const d = (z.x - x) ** 2 + (z.y - y) ** 2; if (d < bd) { bd = d; best = z; } });
    if (best && bd < 60 * 60 && onSelect) onSelect(best.k);
  };
  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); const i = LANDS.findIndex(l => l.key === selected), n = (i + (e.key === 'ArrowRight' ? 1 : LANDS.length - 1)) % LANDS.length; onSelect && onSelect(LANDS[n].key);
  };
  return <canvas ref={ref} role="img" tabIndex={0} onClick={onClick} onKeyDown={onKey} aria-label={`Карта мира: парящие острова. Выбрана земля ${(LANDS.find(l => l.key === selected) || {}).name || ''}. Стрелки влево-вправо переключают землю`} style={{ display: 'block', width: '100%', aspectRatio: `${SKY_W} / ${SKY_H}`, cursor: 'pointer', touchAction: 'manipulation' }} />;
}
