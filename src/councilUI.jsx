// councilUI.jsx — «Штаб Кайлена»: пиксельные портреты наставников, сцена круглого стола, режим дня и
// «мозги» (какой ИИ-провайдер думает за персонажа). Только отображение и чистые функции — логика в App.jsx.
import React from 'react';
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
