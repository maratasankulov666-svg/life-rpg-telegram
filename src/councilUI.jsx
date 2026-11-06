// councilUI.jsx — «Штаб Кайлена»: пиксельные портреты наставников, сцена круглого стола, режим дня и
// «мозги» (какой ИИ-провайдер думает за персонажа). Только отображение и чистые функции — логика в App.jsx.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PAPER } from './actionsUI.jsx';

// ---------- Кто чем думает: предпочтительный ИИ-провайдер персонажа ----------
export const NPC_BRAIN = { kaylen: 'gemini', mira: 'gemini', brum: 'grok', nori: 'grok', kasper: 'groq', vera: 'mistral', tio: 'cerebras' };
export const PROVIDER_LABEL = {
  gemini: 'Gemini', grok: 'Grok', groq: 'Groq', cerebras: 'Cerebras', mistral: 'Mistral',
  openrouter: 'OpenRouter', nvidia: 'NVIDIA', huggingface: 'HuggingFace', cloudflare: 'Cloudflare', local: 'без ИИ',
};

// ---------- Раздел, который наставник может менять ----------
export const NPC_POWERS = {
  kaylen: { types: ['quest'], stat: 'discipline', section: 'Задания' },
  brum: { types: ['quest', 'habit'], stat: 'physical', section: 'Тренировки и привычки тела' },
  kasper: { types: ['expense', 'income', 'savings', 'quest'], stat: 'finance', section: 'Финансы' },
  nori: { types: ['yt_idea', 'quest'], stat: 'creator', section: 'YouTube' },
  mira: { types: ['goal', 'quest'], stat: 'career', section: 'Цели' },
  vera: { types: ['quest'], stat: 'finance', section: 'Экономика монет' },
  tio: { types: ['habit', 'quest'], stat: 'mental', section: 'Привычки и восстановление' },
};
export const ACTION_LABEL = {
  quest: 'Задание', habit: 'Привычка', goal: 'Цель', yt_idea: 'Идея ролика', expense: 'Расход', income: 'Доход', savings: 'Копилка',
};

// ---------- Режим дня: где персонаж сейчас ----------
export function npcPresence(id, date = new Date()) {
  const h = date.getHours();
  switch (id) {
    case 'kaylen': return h < 6 ? { here: true, status: 'не спит, читает донесения' } : { here: true, status: 'разбирает донесения' };
    case 'brum': return h >= 6 && h < 10 ? { here: false, status: 'на пробежке' } : h >= 18 && h < 20 ? { here: true, status: 'после зала, злой' } : { here: true, status: 'ворчит у турника' };
    case 'kasper': return h < 11 ? { here: true, sleep: true, status: 'спит на стуле' } : h >= 13 && h < 15 ? { here: false, status: 'обедает (долго)' } : { here: true, status: 'считает в уме' };
    case 'nori': return h < 12 ? { here: false, status: 'ещё не проснулась после стрима' } : h >= 22 ? { here: true, status: 'монтирует до утра' } : { here: true, status: 'листает аналитику' };
    case 'mira': return { here: true, status: h >= 21 ? 'переписывает план на завтра' : 'двигает дедлайны' };
    case 'vera': return { here: true, status: 'сверяет таблицы монет' };
    case 'tio': return h < 8 || h >= 21 ? { here: true, status: 'медитирует' } : { here: true, status: 'поливает растения' };
    default: return { here: true, status: '' };
  }
}

export function affinityWord(a) {
  if (a >= 85) return 'родной человек';
  if (a >= 65) return 'уважает';
  if (a >= 45) return 'нормально';
  if (a >= 25) return 'присматривается';
  return 'холодно';
}

// ---------- Пиксельные портреты 16×16 ----------
const LOOK = {
  kaylen: { skin: '#e2b896', hair: '#b8b4ac', cloth: '#2f3e6b', trim: '#c48a2a', eye: '#1e2230' },
  brum: { skin: '#d8a07a', hair: '#3e2a1e', cloth: '#7d7a74', trim: '#a4412a', eye: '#1e2230' },
  kasper: { skin: '#ecc4a4', hair: '#6a4a32', cloth: '#6a7a4a', trim: '#f2eee5', eye: '#1e2230' },
  nori: { skin: '#f0c8a8', hair: '#2a2030', cloth: '#a83e66', trim: '#2f6b6e', eye: '#1e2230' },
  mira: { skin: '#f2caa8', hair: '#3a2418', cloth: '#a4412a', trim: '#f2eee5', eye: '#1e2230' },
  vera: { skin: '#eac2a2', hair: '#14141c', cloth: '#55556a', trim: '#c48a2a', eye: '#1e2230' },
  tio: { skin: '#e8bc98', hair: '#d8c49a', cloth: '#3f7a4a', trim: '#7a9a56', eye: '#1e2230' },
};

function R(x, y, w, h, f, k) { return <rect key={k || `${x}-${y}-${w}-${h}-${f}`} x={x} y={y} width={w} height={h} fill={f} />; }

function features(id, c) {
  switch (id) {
    case 'kaylen': return { hair: [R(4, 2, 8, 2, c.hair), R(3, 3, 1, 4, c.hair), R(12, 3, 1, 4, c.hair)], beard: [R(4, 8, 8, 3, c.hair), R(5, 11, 6, 1, c.hair)], brows: [R(5, 5, 3, 1, '#7a7670'), R(9, 5, 3, 1, '#7a7670')], extra: [R(10, 4, 1, 3, '#b8432e'), R(5, 12, 6, 1, c.trim), R(4, 13, 1, 3, c.trim), R(11, 13, 1, 3, c.trim)] };
    case 'brum': return { hair: [R(4, 4, 8, 1, c.trim), R(3, 4, 1, 1, c.trim)], beard: [R(4, 8, 8, 3, c.hair), R(5, 11, 6, 1, c.hair)], brows: [R(5, 5, 3, 1, c.hair), R(9, 5, 3, 1, c.hair)], extra: [R(0, 12, 3, 4, c.skin), R(13, 12, 3, 4, c.skin), R(6, 13, 4, 1, '#55556a')] };
    case 'kasper': return { hair: [R(4, 2, 8, 2, c.hair), R(3, 3, 2, 3, c.hair), R(11, 3, 2, 2, c.hair), R(6, 1, 2, 1, c.hair), R(9, 1, 1, 1, c.hair), R(5, 4, 2, 1, c.hair)], sleepy: true, extra: [R(2, 11, 12, 2, '#5a6a3a'), R(12, 12, 3, 4, c.trim), R(15, 13, 1, 2, c.trim), R(12, 12, 3, 1, '#6a4a32')] };
    case 'nori': return { hair: [R(3, 2, 10, 3, c.trim), R(2, 4, 3, 1, c.trim), R(3, 5, 1, 3, c.hair), R(12, 5, 1, 3, c.hair)], grin: true, extra: [R(3, 11, 2, 2, '#1e2230'), R(11, 11, 2, 2, '#1e2230'), R(5, 11, 6, 1, '#1e2230'), R(7, 14, 2, 2, '#f2c47a')] };
    case 'mira': return { hair: [R(6, 0, 4, 2, c.hair), R(4, 2, 8, 2, c.hair), R(3, 3, 1, 6, c.hair), R(12, 3, 1, 6, c.hair)], glasses: true, extra: [R(7, 12, 2, 4, c.trim), R(11, 13, 3, 3, '#efe6d2'), R(12, 14, 1, 1, '#6b6f7a')] };
    case 'vera': return { hair: [R(3, 2, 10, 2, c.hair), R(3, 4, 2, 6, c.hair), R(11, 4, 2, 6, c.hair), R(5, 4, 3, 1, c.hair)], monocle: true, extra: [R(7, 12, 2, 4, '#a4412a'), R(6, 12, 4, 1, '#f2eee5')] };
    case 'tio': return { hair: [R(4, 2, 8, 2, c.hair), R(3, 3, 1, 9, c.hair), R(12, 3, 1, 9, c.hair), R(2, 8, 1, 5, c.hair), R(13, 8, 1, 5, c.hair)], calm: true, extra: [R(4, 1, 2, 1, c.trim), R(7, 0, 2, 2, c.trim), R(10, 1, 2, 1, c.trim), R(5, 1, 1, 1, '#9fbf7a'), R(7, 13, 2, 3, '#7a9a56')] };
    default: return {};
  }
}

/**
 * Портрет: talking — рот открывается, sleep — закрытые глаза и «z».
 */
export function NpcPortrait({ id, size = 48, talking = false, sleep = false, bg = '#efe6d2', blink = true }) {
  const c = LOOK[id] || LOOK.kaylen;
  const f = features(id, c);
  const eyesClosed = sleep || f.sleepy === 'closed';
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', background: bg, borderRadius: Math.round(size / 6) }}>
      {R(2, 12, 12, 4, c.cloth)}
      {R(6, 11, 4, 1, c.skin)}
      {R(4, 3, 8, 8, c.skin)}
      {R(3, 6, 1, 2, c.skin)}{R(12, 6, 1, 2, c.skin)}
      {f.extra}
      {f.hair}
      {f.beard}
      {f.brows}
      {f.calm || eyesClosed ? (
        <g>{R(5, 7, 2, 1, c.eye)}{R(9, 7, 2, 1, c.eye)}</g>
      ) : f.sleepy ? (
        <g className={blink ? 'cn-blink' : undefined}>{R(5, 7, 2, 1, c.eye)}{R(9, 7, 2, 1, c.eye)}{R(5, 6, 2, 1, '#c99a82')}{R(9, 6, 2, 1, '#c99a82')}</g>
      ) : (
        <g className={blink ? 'cn-blink' : undefined}>{R(5, 6, 2, 2, c.eye)}{R(9, 6, 2, 2, c.eye)}{R(5, 6, 1, 1, '#f2eee5')}{R(9, 6, 1, 1, '#f2eee5')}</g>
      )}
      {f.glasses && <g>{R(4, 5, 4, 1, '#1e2230')}{R(8, 6, 1, 1, '#1e2230')}{R(9, 5, 4, 1, '#1e2230')}{R(4, 8, 4, 1, '#1e2230')}{R(9, 8, 4, 1, '#1e2230')}</g>}
      {f.monocle && <g>{R(9, 5, 3, 1, '#c48a2a')}{R(8, 6, 1, 2, '#c48a2a')}{R(12, 6, 1, 2, '#c48a2a')}{R(9, 8, 3, 1, '#c48a2a')}{R(12, 9, 1, 3, '#c48a2a')}</g>}
      {talking ? (
        <g className="cn-talk">{R(7, 9, 2, 2, '#7a3a2a')}</g>
      ) : f.grin ? R(6, 9, 4, 1, '#7a3a2a') : f.beard ? R(7, 9, 2, 1, '#7a3a2a') : R(7, 9, 2, 1, '#b07a62')}
      {sleep && <g className="cn-z" fill="#2f3e6b">{R(13, 0, 2, 1)}{R(14, 1, 1, 1)}{R(13, 2, 2, 1)}</g>}
    </svg>
  );
}

const CSS = `
@keyframes cnBlink { 0%,92% { opacity: 1; } 93%,97% { opacity: 0; } 98%,100% { opacity: 1; } }
@keyframes cnTalk { 50% { transform: scaleY(.3); } }
@keyframes cnZ { 0% { transform: translate(0,0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(1px,-2px); opacity: 0; } }
@keyframes cnBob { 50% { transform: translateY(-1px); } }
@keyframes cnBubble { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes cnDots { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes cnSteam { from { transform: translateY(0); opacity: .8; } to { transform: translateY(-5px); opacity: 0; } }
@keyframes cnTw { 0%,100% { opacity: .2; } 50% { opacity: 1; } }
.cn-blink { animation: cnBlink 4.2s steps(1) infinite; }
.cn-talk { animation: cnTalk .22s steps(2) infinite; transform-box: fill-box; transform-origin: 50% 0; }
.cn-z { animation: cnZ 2s ease-out infinite; }
.cn-bob { animation: cnBob .6s steps(2) infinite; }
.cn-bubble { animation: cnBubble .35s cubic-bezier(.2,1.4,.3,1) both; transform-box: fill-box; transform-origin: 50% 100%; }
.cn-dot { animation: cnDots 1s ease-in-out infinite; }
.cn-steam { animation: cnSteam 2.4s steps(4) infinite; }
.cn-tw { animation: cnTw 2.4s steps(2) infinite; }
.cn-seat { transition: transform 1.1s cubic-bezier(.3,.8,.3,1), opacity .4s ease; }
@media (prefers-reduced-motion: reduce) { .cn-blink,.cn-talk,.cn-z,.cn-bob,.cn-dot,.cn-steam,.cn-tw { animation: none; } .cn-seat { transition: none; } }
`;
let injected = false;
export function useCouncilCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

// ---------- Сцена круглого стола ----------
// Места (в единицах 180×110). Кайлен во главе — по центру.
export const SEATS = {
  kaylen: { x: 90, y: 44 }, mira: { x: 64, y: 46 }, brum: { x: 116, y: 46 },
  kasper: { x: 40, y: 52 }, nori: { x: 140, y: 52 }, vera: { x: 22, y: 66 }, tio: { x: 158, y: 66 },
};
const DOOR = { x: -12, y: 70 };

function Chair({ x, y }) {
  return <g>{R(x - 6, y - 4, 12, 9, '#6e4630')}{R(x - 6, y - 4, 12, 1, '#8a5a3a')}</g>;
}

/**
 * present: { [id]: { arrived: bool, sleep: bool } } — кто сидит за столом.
 * speaking: id того, кто говорит сейчас; typing: id того, кто «думает».
 */
export function RoundTable({ present = {}, speaking = null, typing = null, onPick, ids }) {
  useCouncilCss();
  const order = ids || Object.keys(SEATS);
  return (
    <svg viewBox="0 0 180 110" shapeRendering="crispEdges" role="img" aria-label="Круглый стол штаба" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="180" height="78" fill="#e6dcc6" />
      <rect y="0" width="180" height="6" fill="#d8cdb8" />
      <rect y="74" width="180" height="36" fill="#9a7452" />
      <g fill="#86623f">{[0, 1, 2, 3].map(i => <rect key={i} x="0" y={80 + i * 8} width="180" height="1" />)}</g>
      <rect y="73" width="180" height="2" fill="#7c5a3e" />
      <g>
        {R(150, 12, 22, 26, '#6e5844')}{R(152, 14, 18, 22, '#8fb3d0')}{R(152, 28, 18, 8, '#b8c4cc')}{R(160, 16, 1, 16, '#e6e2d8')}{R(158, 21, 5, 2, '#e6e2d8')}{R(160, 15, 1, 1, '#c0503a')}
        {R(160, 14, 1, 22, '#6e5844')}
      </g>
      <g>{R(4, 34, 18, 40, '#7a4e34')}{R(6, 36, 14, 36, '#8a5a3a')}{R(17, 54, 2, 2, '#c48a2a')}</g>
      <g>
        {R(62, 8, 56, 18, '#a4412a')}{R(64, 10, 52, 14, '#b5654a')}
        <text x="90" y="21" textAnchor="middle" fontFamily="'Fraunces','Lora',Georgia,serif" fontWeight="700" fontSize="9" fill="#f2eee5">ШТАБ</text>
        {R(62, 26, 4, 3, '#a4412a')}{R(114, 26, 4, 3, '#a4412a')}
      </g>
      <g className="cn-tw" fill="#c48a2a">{R(40, 16, 1, 1)}{R(132, 22, 1, 1)}</g>

      {order.map(id => <Chair key={'c' + id} x={SEATS[id].x} y={SEATS[id].y + 6} />)}

      {order.map(id => {
        const s = SEATS[id];
        const p = present[id] || {};
        const arrived = !!p.arrived;
        const tx = arrived ? s.x - 8 : DOOR.x;
        const ty = arrived ? s.y - 10 : DOOR.y - 10;
        const talking = speaking === id;
        const think = typing === id;
        return (
          <g key={id} className="cn-seat" style={{ transform: `translate(${tx}px, ${ty}px)`, opacity: arrived ? 1 : 0, cursor: onPick ? 'pointer' : 'default' }} onClick={() => onPick && onPick(id)}>
            <g className={talking ? 'cn-bob' : undefined}>
              <NpcPortrait id={id} size={16} talking={talking} sleep={p.sleep && !talking && !think} bg="transparent" />
            </g>
            {(talking || think) && (
              <g className="cn-bubble">
                {R(4, -9, 10, 7, '#fbf9f4')}{R(5, -2, 2, 2, '#fbf9f4')}
                {think ? (
                  <g fill={PAPER.terra}>{[0, 1, 2].map(i => <rect key={i} className="cn-dot" x={6 + i * 2.5} y="-6" width="1.5" height="1.5" style={{ animationDelay: `${i * 0.15}s` }} />)}</g>
                ) : (
                  <g fill={PAPER.terra}>{R(6, -7, 6, 1)}{R(6, -5, 4, 1)}</g>
                )}
              </g>
            )}
          </g>
        );
      })}

      <g>
        {R(28, 60, 124, 16, '#6e4630')}{R(20, 64, 140, 10, '#6e4630')}
        {R(30, 58, 120, 14, '#a06a44')}{R(22, 62, 136, 8, '#a06a44')}
        {R(30, 58, 120, 1, '#c48a2a')}
        {R(70, 61, 40, 8, '#efe6d2')}{R(72, 62, 36, 6, '#cfe0c0')}{R(80, 63, 6, 3, '#9fbf7a')}{R(94, 64, 8, 2, '#d8c49a')}{R(88, 62, 1, 1, '#a4412a')}
        {R(46, 62, 6, 5, '#f2eee5')}{R(130, 61, 5, 6, '#f2eee5')}{R(131, 62, 3, 1, '#6a4a32')}
        <rect className="cn-steam" x="132" y="57" width="1" height="3" fill="#f2eee5" />
        {R(56, 64, 8, 2, '#2f3e6b')}{R(116, 63, 6, 3, '#c48a2a')}
        {R(26, 74, 4, 8, '#5a3826')}{R(150, 74, 4, 8, '#5a3826')}
      </g>
    </svg>
  );
}

/** Сердечки симпатии (0..100 → 5 сердец). */
export function AffinityHearts({ value = 40, size = 9 }) {
  const n = Math.round((Math.max(0, Math.min(100, value)) / 100) * 5);
  return (
    <span aria-label={`Симпатия ${value} из 100`} style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
          <g fill={i < n ? '#a4412a' : '#d6cdb9'}><rect x="1" y="0" width="2" height="1" /><rect x="4" y="0" width="2" height="1" /><rect x="0" y="1" width="7" height="2" /><rect x="1" y="3" width="5" height="1" /><rect x="2" y="4" width="3" height="1" /><rect x="3" y="5" width="1" height="1" /></g>
        </svg>
      ))}
    </span>
  );
}


// ======================= ЖИВОЙ СОВЕТ: ходьба, болтовня, голоса =======================

// Полный рост (16×26): верх — тот же портрет, ниже туловище и ноги. frame 0/1 — шаг.
export function NpcBody({ id, x, y, frame = 0, talking = false, sleep = false, scale = 1 }) {
  const c = LOOK[id] || LOOK.kaylen;
  const legL = frame ? 1 : 0;
  const legR = frame ? 0 : 1;
  const w = 16 * scale, h = 26 * scale;
  return (
    <svg x={x - w / 2} y={y - h} width={w} height={h} viewBox="0 0 16 26" overflow="visible">
      <rect x="3" y="25" width="10" height="1" fill="#000" opacity=".18" />
      {R(3, 15, 10, 6, c.cloth)}
      {R(2, 15, 1, 5, c.cloth)}{R(13, 15, 1, 5, c.cloth)}
      {R(2, 20 - legR, 1, 1, c.skin)}{R(13, 20 - legL, 1, 1, c.skin)}
      {R(4, 21, 3, 4 - legL, '#2b2f3e')}{R(9, 21, 3, 4 - legR, '#2b2f3e')}
      {R(4, 25 - legL, 3, 1, '#3e3026')}{R(9, 25 - legR, 3, 1, '#3e3026')}
      <svg x="0" y="0" width="16" height="16" viewBox="0 0 16 16">
        <NpcPortrait id={id} size={16} talking={talking} sleep={sleep} bg="transparent" />
      </svg>
    </svg>
  );
}

// Маршруты: дверь слева → коридор за столом → место.
const DOOR_PT = { x: 12, y: 74 };
const LANE_Y = 57;
export function pathToSeat(id) {
  const s = SEATS[id];
  if (!s) return [DOOR_PT];
  if (id === 'vera') return [{ ...DOOR_PT }, { x: 20, y: 70 }, { x: s.x, y: s.y + 10 }];
  if (id === 'tio') return [{ ...DOOR_PT }, { x: 26, y: LANE_Y }, { x: s.x, y: LANE_Y }, { x: s.x, y: s.y + 10 }];
  return [{ ...DOOR_PT }, { x: 26, y: LANE_Y }, { x: s.x, y: LANE_Y }, { x: s.x, y: s.y + 10 }];
}

/**
 * Ходоки: плавное перемещение по точкам с шагающими ногами.
 * walk(id, path, speed, { onArrive, stops: [{ i, ms, onStop }] })
 */
export function useWalkers() {
  const [actors, setActors] = useState({});
  const inner = useRef({});
  const raf = useRef(0);
  const last = useRef(0);
  const lastCount = useRef(0);
  const tick = useCallback((t) => {
    const dt = last.current ? Math.min(0.05, (t - last.current) / 1000) : 0;
    last.current = t;
    let changed = false;
    const out = {};
    Object.entries(inner.current).forEach(([id, a]) => {
      if (a.mode === 'walk') {
        if (a.pauseUntil && t < a.pauseUntil) { out[id] = { x: a.x, y: a.y, frame: 0, mode: 'walk', paused: true }; return; }
        a.pauseUntil = 0;
        const target = a.path[a.i];
        const dx = target.x - a.x, dy = target.y - a.y;
        const d = Math.hypot(dx, dy);
        const step = a.speed * dt;
        if (d <= step || d < 0.01) {
          a.x = target.x; a.y = target.y;
          const stop = (a.stops || []).find(s => s.i === a.i && !s.done);
          if (stop) { stop.done = true; a.pauseUntil = t + stop.ms; if (stop.onStop) stop.onStop(); }
          a.i += 1;
          if (a.i >= a.path.length) { a.mode = 'seat'; if (a.onArrive) a.onArrive(); }
        } else {
          a.x += (dx / d) * step; a.y += (dy / d) * step;
          a.dist = (a.dist || 0) + step;
        }
        changed = true;
      }
      out[id] = { x: a.x, y: a.y, frame: Math.floor((a.dist || 0) / 2.2) % 2, mode: a.mode, paused: !!a.pauseUntil };
    });
    const cnt = Object.keys(out).length;
    if (changed || cnt !== lastCount.current) { lastCount.current = cnt; setActors(out); }
    raf.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line
  useEffect(() => {
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [tick]);
  const walk = useCallback((id, path, speed, opts = {}) => {
    const start = path[0];
    inner.current[id] = { x: start.x, y: start.y, path, i: 1, speed, mode: 'walk', onArrive: opts.onArrive, stops: opts.stops || [], dist: 0 };
    if (path.length < 2) { inner.current[id].mode = 'seat'; if (opts.onArrive) opts.onArrive(); }
  }, []);
  const seatNow = useCallback((id) => {
    const s = SEATS[id];
    inner.current[id] = { x: s.x, y: s.y + 10, path: [], i: 0, speed: 0, mode: 'seat' };
  }, []);
  const clear = useCallback(() => { inner.current = {}; setActors({}); }, []);
  return { actors, walk, seatNow, clear };
}

/** Сцена совета: стол, стулья, наставники (идут или сидят), облачка реплик над головами. */
export function CouncilStage({ actors = {}, bubbles = {}, speaking = null, typing = null }) {
  useCouncilCss();
  const ids = Object.keys(SEATS);
  const seated = ids.filter(id => actors[id] && actors[id].mode === 'seat');
  const walking = ids.filter(id => actors[id] && actors[id].mode === 'walk').sort((a, b) => actors[a].y - actors[b].y);
  const Bubble = ({ id, x, y }) => {
    const text = bubbles[id];
    const think = typing === id;
    if (!text && !think) return null;
    const short = text ? (text.length > 34 ? text.slice(0, 33) + '…' : text) : '';
    const w = think ? 14 : Math.min(84, 8 + short.length * 2.25);
    const bx = Math.max(2, Math.min(178 - w, x - w / 2));
    return (
      <g className="cn-bubble" pointerEvents="none">
        <rect x={bx} y={y - 9} width={w} height="8" rx="1.5" fill="#fbf9f4" stroke="#d6cdb9" strokeWidth=".4" shapeRendering="auto" />
        <rect x={x - 1} y={y - 1.2} width="2" height="1.6" fill="#fbf9f4" />
        {think ? (
          <g fill={PAPER.terra}>{[0, 1, 2].map(i => <rect key={i} className="cn-dot" x={bx + 3 + i * 3} y={y - 5.8} width="1.6" height="1.6" style={{ animationDelay: `${i * 0.15}s` }} />)}</g>
        ) : (
          <text x={bx + w / 2} y={y - 3.4} textAnchor="middle" fontSize="3.6" fontFamily="Manrope, sans-serif" fontWeight="700" fill="#1e2230">{short}</text>
        )}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 180 110" shapeRendering="crispEdges" role="img" aria-label="Совет за круглым столом" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="180" height="78" fill="#e6dcc6" />
      <rect y="0" width="180" height="6" fill="#d8cdb8" />
      <rect y="74" width="180" height="36" fill="#9a7452" />
      <g fill="#86623f">{[0, 1, 2, 3].map(i => <rect key={i} x="0" y={80 + i * 8} width="180" height="1" />)}</g>
      <rect y="73" width="180" height="2" fill="#7c5a3e" />
      {R(150, 12, 22, 26, '#6e5844')}{R(152, 14, 18, 22, '#8fb3d0')}{R(152, 28, 18, 8, '#b8c4cc')}{R(160, 16, 1, 16, '#e6e2d8')}{R(158, 21, 5, 2, '#e6e2d8')}{R(160, 15, 1, 1, '#c0503a')}{R(160, 14, 1, 22, '#6e5844')}
      {R(2, 34, 20, 40, '#5a3826')}{R(4, 36, 16, 38, '#3a2618')}{R(4, 36, 16, 38, '#2a1c14')}
      {R(19, 54, 2, 2, '#c48a2a')}
      {R(62, 8, 56, 18, '#a4412a')}{R(64, 10, 52, 14, '#b5654a')}
      <text x="90" y="21" textAnchor="middle" fontFamily="'Fraunces','Lora',Georgia,serif" fontWeight="700" fontSize="9" fill="#f2eee5">ШТАБ</text>
      {R(124, 40, 8, 10, '#b5654a')}{R(126, 34, 4, 6, '#5a7a4a')}{R(124, 36, 2, 3, '#5a7a4a')}{R(130, 35, 2, 3, '#5a7a4a')}
      <g className="cn-tw" fill="#c48a2a">{R(40, 16, 1, 1)}{R(132, 22, 1, 1)}</g>

      {ids.map(id => <g key={'c' + id}>{R(SEATS[id].x - 6, SEATS[id].y + 2, 12, 9, '#6e4630')}{R(SEATS[id].x - 6, SEATS[id].y + 2, 12, 1, '#8a5a3a')}</g>)}

      {seated.map(id => (
        <g key={id} className={speaking === id ? 'cn-bob' : undefined}>
          <svg x={SEATS[id].x - 8} y={SEATS[id].y - 10} width="16" height="16" viewBox="0 0 16 16">
            <NpcPortrait id={id} size={16} talking={speaking === id} bg="transparent" />
          </svg>
        </g>
      ))}
      {walking.filter(id => actors[id].y < 62).map(id => <NpcBody key={id} id={id} x={actors[id].x} y={actors[id].y} frame={actors[id].paused ? 0 : actors[id].frame} talking={speaking === id || !!bubbles[id]} />)}

      <g>
        {R(28, 60, 124, 16, '#6e4630')}{R(20, 64, 140, 10, '#6e4630')}
        {R(30, 58, 120, 14, '#a06a44')}{R(22, 62, 136, 8, '#a06a44')}
        {R(30, 58, 120, 1, '#c48a2a')}
        {R(70, 61, 40, 8, '#efe6d2')}{R(72, 62, 36, 6, '#cfe0c0')}{R(80, 63, 6, 3, '#9fbf7a')}{R(94, 64, 8, 2, '#d8c49a')}{R(88, 62, 1, 1, '#a4412a')}
        {R(46, 62, 6, 5, '#f2eee5')}{R(130, 61, 5, 6, '#f2eee5')}{R(131, 62, 3, 1, '#6a4a32')}
        <rect className="cn-steam" x="132" y="57" width="1" height="3" fill="#f2eee5" />
        {R(56, 64, 8, 2, '#2f3e6b')}{R(116, 63, 6, 3, '#c48a2a')}
        {R(26, 74, 4, 8, '#5a3826')}{R(150, 74, 4, 8, '#5a3826')}
      </g>
      {walking.filter(id => actors[id].y >= 62).map(id => <NpcBody key={id} id={id} x={actors[id].x} y={actors[id].y} frame={actors[id].paused ? 0 : actors[id].frame} talking={speaking === id || !!bubbles[id]} />)}

      {ids.map(id => {
        const a = actors[id];
        if (!a) return null;
        const hx = a.mode === 'seat' ? SEATS[id].x : a.x;
        const hy = a.mode === 'seat' ? SEATS[id].y - 10 : a.y - 26;
        return <Bubble key={'b' + id} id={id} x={hx} y={hy} />;
      })}
    </svg>
  );
}

// ---------- Болтовня без ИИ: короткие сценки между наставниками ----------
export function localBanter(present, flags = {}) {
  const has = (...ids) => ids.every(i => present.includes(i));
  const pool = [];
  const add = (ids, lines) => { if (has(...ids)) pool.push(lines); };
  add(['brum', 'kasper'], [['brum', 'Каспер, это опять второй кофе?'], ['kasper', 'Первый. Вчерашний не считается.']]);
  add(['mira', 'vera'], [['mira', 'Кто видел мой список приоритетов?'], ['vera', 'Лежит в графе «расходы времени». Пустой.']]);
  add(['nori', 'kaylen'], [['nori', 'Кайлен, можно я сниму совет для шортсов?'], ['kaylen', 'Нет.'], ['nori', 'Записала как «может быть».']]);
  add(['tio', 'brum'], [['tio', 'Давайте начнём с трёх спокойных вдохов.'], ['brum', 'Давай начнём с трёх подходов.']]);
  add(['kasper', 'vera'], [['kasper', 'Если совет затянется, я выставлю счёт.'], ['vera', 'У тебя оклад — ноль монет.'], ['kasper', 'Тогда тем более.']]);
  add(['kaylen', 'kasper'], [['kaylen', 'Герой молчит. Значит, думает.'], ['kasper', 'Или спит. Я бы спал.']]);
  add(['mira', 'tio'], [['mira', 'У нас семнадцать минут до чего-то важного!'], ['tio', 'До спокойствия, Мира. Только до него.']]);
  add(['brum', 'nori'], [['brum', 'Кто трогал мою гантелю?'], ['nori', 'В кадре она смотрелась лучше, чем у тебя в руке.']]);
  add(['vera', 'kasper'], [['vera', 'Напоминаю: колесо удачи — не пенсионный фонд.'], ['kasper', 'А звучит как стратегия.']]);
  add(['nori', 'mira'], [['nori', 'Мира, сделай лицо попроще, у нас тут не аудит.'], ['mira', 'У нас ВСЕГДА аудит.']]);
  add(['kaylen', 'tio'], [['tio', 'Кайлен, ты сегодня спал?'], ['kaylen', 'Директора не спят. Директора ждут отчётов.']]);
  if (flags.noMove) add(['brum', 'tio'], [['brum', 'Герой сегодня ещё не вспотел. Я считаю минуты.'], ['tio', 'Не дави. Он придёт к этому сам.'], ['brum', 'Я подтолкну.']]);
  if (flags.debts) add(['kasper', 'mira'], [['kasper', 'Долг сам себя не закроет. Я проверял — ждал.'], ['mira', 'Ставлю дедлайн на твоё «ждал».']]);
  if (flags.routeDone) add(['kaylen', 'brum'], [['kaylen', 'Маршрут дня пройден. Неплохо.'], ['brum', 'Неплохо — это когда завтра повторит.']]);
  if (flags.bigStreak) add(['tio', 'vera'], [['tio', 'Видели огонь серии у героя? Красиво горит.'], ['vera', 'Красиво. Главное, чтобы монет за это не просил.']]);
  return pool;
}

// Реплики при входе: каждый раз чуть по-разному.
export const ENTER_EXTRA = {
  kaylen: ['Садитесь. Начнём, когда герой скажет.', 'Проверка явки. Опоздавшие — отметьтесь.'],
  brum: ['Прямо с пробежки. Не нюхайте.', 'Я тут. Кто опять сидит без движения?'],
  kasper: ['Я не опоздал. Это вы рано.', '…я просто зашёл за кофе. Ну ладно, сяду.'],
  nori: ['Еууу, все в сборе? Я с телефона, не обращайте внимания.', 'Йо, штаб. Свет тут ужасный для съёмки.'],
  mira: ['Я принесла три версии плана.', 'Все пришли? Я считаю. Раз, два…'],
  vera: ['Сразу говорю: бюджет на печеньки не утверждён.', 'Добрый день. Монеты пересчитаны.'],
  tio: ['Тише, тише. Здесь хорошая энергия.', 'Я полила фикус. Можно начинать.'],
};
export const GREETS = {
  kaylen: 'Кайлен кивает', brum: 'Брум хлопает по плечу', kasper: 'Каспер зевает', nori: 'Нори машет рукой',
  mira: 'Мира поправляет очки', vera: 'Вера сухо кивает', tio: 'Тио улыбается',
};

// ---------- Голоса ----------
// Режимы: 'ai' — нейросетевые голоса Gemini TTS (/api/tts), 'device' — голос телефона, 'off'.
// Каждому наставнику — свой голос и манера речи (стиль задаётся словами).
export const NPC_VOICE = {
  kaylen: { voice: 'Algenib', male: true, style: 'Speak Russian in a low, gravelly, tired voice of a strict old commander, slowly and with weight, dry and terse' },
  brum: { voice: 'Fenrir', male: true, style: 'Speak Russian loudly, roughly and energetically like an angry gym coach who is out of patience' },
  kasper: { voice: 'Umbriel', male: true, style: 'Speak Russian lazily and sleepily with sarcasm, drawling the words like a bored cynic who just woke up' },
  nori: { voice: 'Laomedeia', male: false, style: 'Speak Russian cheerfully and fast with a playful teasing smile, like a young video blogger' },
  mira: { voice: 'Leda', male: false, style: 'Speak Russian quickly and a bit anxiously, like a nervous perfectionist who worries about deadlines' },
  vera: { voice: 'Kore', male: false, style: 'Speak Russian coldly, crisply and precisely, like a strict auditor counting money' },
  tio: { voice: 'Vindemiatrix', male: false, style: 'Speak Russian softly, quietly and slowly with a gentle sigh, like a calm meditation teacher' },
};
const DEVICE_TUNE = {
  kaylen: { pitch: 0.75, rate: 0.92 }, brum: { pitch: 0.7, rate: 1.08 }, kasper: { pitch: 0.85, rate: 0.85 },
  nori: { pitch: 1.2, rate: 1.12 }, mira: { pitch: 1.1, rate: 1.1 }, vera: { pitch: 1.0, rate: 1.0 }, tio: { pitch: 1.05, rate: 0.88 },
};
const MALE_HINT = /(dmitr|pavel|yuri|maxim|ivan|alex|artem|boris|nikolai|male|муж|дмитр|павел|юр)/i;
const FEMALE_HINT = /(milena|katya|svetlana|irina|dari|alena|elena|anna|female|жен|милен|ален|ирин|светл)/i;

const VOICE_STATE = { gen: 0, chain: Promise.resolve(), ctx: null, current: null, aiBroken: false, cache: new Map(), broken: new Set(), npcProvider: {} };

function audioCtx() {
  if (VOICE_STATE.ctx) return VOICE_STATE.ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  VOICE_STATE.ctx = new AC();
  return VOICE_STATE.ctx;
}
/** Разблокировать звук (вызывать по тапу пользователя — требование iOS/Telegram). */
export function unlockVoices() {
  const ctx = audioCtx();
  try {
    if (ctx && ctx.state !== 'running') ctx.resume();
    if (ctx) { const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); }
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  } catch (e) {}
}

function deviceSpeak(id, text, gen) {
  return new Promise(resolve => {
    try {
      if (!window.speechSynthesis || gen !== VOICE_STATE.gen) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(String(text).replace(/[«»"*()]/g, ''));
      const ru = (window.speechSynthesis.getVoices() || []).filter(v => /^ru/i.test(v.lang));
      const want = (NPC_VOICE[id] || {}).male;
      const match = ru.filter(v => (want ? MALE_HINT : FEMALE_HINT).test(v.name));
      const pickFrom = match.length ? match : ru;
      if (pickFrom.length) u.voice = pickFrom[Math.abs(String(id).charCodeAt(0) + String(id).length) % pickFrom.length];
      u.lang = 'ru-RU';
      const t = DEVICE_TUNE[id] || { pitch: 1, rate: 1 };
      // Если мужского голоса в телефоне нет — хотя бы опустить тон.
      u.pitch = want && !match.length ? Math.min(t.pitch, 0.6) : t.pitch;
      u.rate = t.rate;
      u.onend = () => resolve(); u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
      setTimeout(resolve, 15000);
    } catch (e) { resolve(); }
  });
}

// Постоянный кэш озвучки (IndexedDB): одна и та же фраза озвучивается один раз — экономит лимиты.
const IDB_NAME = 'liferpg-voices';
const IDB_STORE = 'clips';
let idbP = null;
function idb() {
  if (idbP) return idbP;
  idbP = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const r = indexedDB.open(IDB_NAME, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(IDB_STORE); };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
  return idbP;
}
async function idbGet(key) {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const rq = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
      rq.onsuccess = () => resolve(rq.result ? rq.result.buf : null);
      rq.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}
async function idbPut(key, buf) {
  const db = await idb();
  if (!db) return;
  try {
    const st = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE);
    st.put({ buf, at: Date.now() }, key);
    const cnt = st.count();
    cnt.onsuccess = () => {
      if (cnt.result <= 400) return;
      const cur = st.openCursor();
      let left = cnt.result - 360;
      cur.onsuccess = () => { const c = cur.result; if (c && left > 0) { c.delete(); left -= 1; c.continue(); } };
    };
  } catch (e) {}
}
export const VOICE_STATS = { cached: 0, fetched: 0, provider: null };

async function fetchAiVoice(id, text) {
  // v2: у каждого наставника свой постоянный сервис — старые клипы (другие голоса) не используем.
  const key = 'v2|' + id + '|' + text;
  if (VOICE_STATE.cache.has(key)) return VOICE_STATE.cache.get(key);
  const v = NPC_VOICE[id] || NPC_VOICE.vera;
  const p = (async () => {
    const stored = await idbGet(key);
    if (stored) { VOICE_STATS.cached += 1; return stored; }
    const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ npc: id, text, voice: v.voice, style: v.style }) });
    if (!r.ok) {
      const ej = await r.json().catch(() => ({}));
      if (ej.provider) VOICE_STATE.npcProvider[id] = ej.provider;
      const e = new Error('TTS ' + r.status); e.status = r.status; e.provider = ej.provider || null; throw e;
    }
    const j = await r.json();
    if (j.provider) VOICE_STATE.npcProvider[id] = j.provider;
    const bin = atob(j.audio);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    VOICE_STATS.fetched += 1; VOICE_STATS.provider = j.provider || null;
    // Временную замену (у сервиса наставника нет ключа) не сохраняем навсегда — иначе голос «застрянет».
    if (!j.substitute) idbPut(key, bytes.buffer.slice(0));
    return bytes.buffer;
  })();
  VOICE_STATE.cache.set(key, p);
  if (VOICE_STATE.cache.size > 60) VOICE_STATE.cache.delete(VOICE_STATE.cache.keys().next().value);
  p.catch(() => VOICE_STATE.cache.delete(key));
  return p;
}

async function playBuffer(arrayBuffer, gen) {
  const ctx = audioCtx();
  if (!ctx || gen !== VOICE_STATE.gen) return;
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }
  const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
  if (gen !== VOICE_STATE.gen) return;
  await new Promise(resolve => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 1;
    src.connect(g); g.connect(ctx.destination);
    src.onended = () => resolve();
    VOICE_STATE.current = src;
    src.start(0);
    setTimeout(resolve, buf.duration * 1000 + 800);
  });
  VOICE_STATE.current = null;
}

/**
 * Сказать реплику голосом персонажа. Реплики идут в очередь и не перебивают друг друга;
 * аудио следующей реплики начинает готовиться сразу. onFallback(reason) — если ИИ-голос недоступен.
 */
export function speakLine(id, text, mode = 'ai', onFallback) {
  if (!text || mode === 'off' || typeof window === 'undefined') return;
  const gen = VOICE_STATE.gen;
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 420);
  // Если у сервиса ЭТОГО наставника кончился лимит — он говорит голосом телефона, остальные — своими.
  const prov = VOICE_STATE.npcProvider[id];
  const useAi = mode === 'ai' && !VOICE_STATE.aiBroken && !(prov && VOICE_STATE.broken.has(prov));
  const audioP = useAi ? fetchAiVoice(id, clean) : null;
  if (audioP) audioP.catch(() => {});
  VOICE_STATE.chain = VOICE_STATE.chain.then(async () => {
    if (gen !== VOICE_STATE.gen) return;
    if (audioP) {
      try { await playBuffer(await audioP, gen); return; }
      catch (e) {
        if (e && (e.status === 503 || e.status === 429 || e.status === 502)) {
          const name = { google: 'Google', azure: 'Azure', gemini: 'Gemini' }[e.provider] || '';
          if (e.status === 503 || !e.provider) VOICE_STATE.aiBroken = true;
          else VOICE_STATE.broken.add(e.provider);
          if (onFallback) onFallback(e.status === 429 ? `закончился лимит озвучки ${name}`.trim() : e.status === 503 ? 'на сервере нет ключа озвучки' : `сервис озвучки ${name} не ответил`.replace('  ', ' '));
        }
      }
    }
    await deviceSpeak(id, clean, gen);
  }).catch(() => {});
}

export function stopSpeaking() {
  VOICE_STATE.gen += 1;
  VOICE_STATE.chain = Promise.resolve();
  try { if (VOICE_STATE.current) VOICE_STATE.current.stop(); } catch (e) {}
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
}
export function voiceAiBroken() { return VOICE_STATE.aiBroken; }
export function resetVoiceAi() { VOICE_STATE.aiBroken = false; VOICE_STATE.broken.clear(); }
export const VOICE_MODES = ['off', 'ai', 'device'];
export const VOICE_MODE_LABEL = { off: 'Голоса выкл.', ai: 'Голоса ИИ', device: 'Голос телефона' };

// ---------- Галерея портретов для зала ----------
export function PortraitFrame({ id, size = 92, sleep }) {
  return (
    <div style={{ position: 'relative', padding: 6, background: 'linear-gradient(145deg, #a06a44, #6e4630)', borderRadius: 6, boxShadow: '0 6px 14px rgba(30,34,48,.22), inset 0 0 0 2px #c48a2a, inset 0 0 0 4px #5a3826' }}>
      <div style={{ padding: 3, background: '#efe6d2', borderRadius: 2, boxShadow: 'inset 0 0 0 1px #d6cdb9' }}>
        <NpcPortrait id={id} size={size} sleep={sleep} bg="#e8dcc4" />
      </div>
      <span style={{ position: 'absolute', left: '50%', top: -9, width: 2, height: 9, background: '#3e3026', transform: 'translateX(-50%)' }} />
      <span style={{ position: 'absolute', left: '50%', top: -12, width: 6, height: 6, borderRadius: 3, background: '#c48a2a', transform: 'translateX(-50%)' }} />
    </div>
  );
}
