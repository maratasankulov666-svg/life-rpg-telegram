// pixelRoom.jsx — пиксельная комната главного экрана (стиль «бумага + пиксель-открытка»).
// Вся сцена — один SVG 195×422 «пикселей-единиц» (1 ед. = 2px на макете 390×844),
// растягивается на весь экран через preserveAspectRatio="xMidYMax slice".
// Здесь же каталог предметов комнаты: их можно купить за монеты и поставить в слоты.
import React from 'react';
import { gearLayers, useHeroGearCss } from './heroGearFX.jsx';

// ---------- Каталог комнаты ----------
export const ROOM_SLOTS = [
  { key: 'rug', label: 'Ковёр' },
  { key: 'lamp', label: 'Торшер' },
  { key: 'poster', label: 'Постер' },
  { key: 'plant', label: 'Растение' },
  { key: 'neon', label: 'Вывеска' },
  { key: 'desk', label: 'Стол' },
  { key: 'bed', label: 'Кровать' },
  { key: 'pet', label: 'Питомец' },
  { key: 'gadget', label: 'Хобби' },
];

// id старых предметов сохранены, чтобы купленное раньше не пропало.
export const ROOM_CATALOG = [
  { id: 'rug_plain', slot: 'rug', name: 'Серый коврик', cost: 80, rarity: 'Common', c1: '#8a8f9a', c2: '#a3a8b2', c3: '#6f7480' },
  { id: 'rug_wine', slot: 'rug', name: 'Терракотовый ковёр', cost: 220, rarity: 'Rare', c1: '#a4412a', c2: '#c48a2a', c3: '#2f3e6b' },
  { id: 'rug_gold', slot: 'rug', name: 'Сюзане', cost: 640, rarity: 'Epic', c1: '#efe6d2', c2: '#a4412a', c3: '#2f6b6e', suzani: true },
  { id: 'lamp_warm', slot: 'lamp', name: 'Тёплый торшер', cost: 140, rarity: 'Common', shade: '#e8c48a', glow: '#f2c47a' },
  { id: 'lamp_cyan', slot: 'lamp', name: 'Холодный торшер', cost: 360, rarity: 'Rare', shade: '#bcd8e2', glow: '#9fd0e0' },
  { id: 'lamp_club', slot: 'lamp', name: 'Лава-лампа', cost: 880, rarity: 'Epic', shade: '#c06a9a', glow: '#e08ab8', lava: true },
  { id: 'poster_goal', slot: 'poster', name: 'Постер «Цель»', cost: 90, rarity: 'Common', kind: 'goal' },
  { id: 'poster_live', slot: 'poster', name: 'Постер «Ташкент»', cost: 200, rarity: 'Rare', kind: 'tower' },
  { id: 'poster_boss', slot: 'poster', name: 'Карта мира', cost: 540, rarity: 'Epic', kind: 'map' },
  { id: 'plant_ficus', slot: 'plant', name: 'Фикус', cost: 70, rarity: 'Common', kind: 'ficus' },
  { id: 'plant_palm', slot: 'plant', name: 'Монстера', cost: 260, rarity: 'Rare', kind: 'monstera' },
  { id: 'plant_cactus', slot: 'plant', name: 'Цветущий кактус', cost: 720, rarity: 'Epic', kind: 'cactus' },
  { id: 'neon_life', slot: 'neon', name: 'Неон LIFE', cost: 480, rarity: 'Rare', text: 'LIFE', col: '#7fd6e0' },
  { id: 'neon_go', slot: 'neon', name: 'Неон GO', cost: 1200, rarity: 'Legendary', text: 'GO!', col: '#f2b45a' },
  { id: 'desk_wood', slot: 'desk', name: 'Деревянный стол', cost: 150, rarity: 'Common', top: '#a06a44', edge: '#7a4e34', body: '#8a5a3a' },
  { id: 'desk_glass', slot: 'desk', name: 'Белый стол', cost: 420, rarity: 'Rare', top: '#f2eee5', edge: '#d6cdb9', body: '#e2dbcc' },
  { id: 'desk_dark', slot: 'desk', name: 'Графитовый стол', cost: 300, rarity: 'Rare', top: '#4a4450', edge: '#2e2a34', body: '#3a3440' },
  { id: 'bed_terra', slot: 'bed', name: 'Терракотовое покрывало', cost: 120, rarity: 'Common', c1: '#a4412a', c2: '#8a3622' },
  { id: 'bed_teal', slot: 'bed', name: 'Бирюзовое покрывало', cost: 160, rarity: 'Common', c1: '#2f6b6e', c2: '#24575a' },
  { id: 'bed_quilt', slot: 'bed', name: 'Лоскутное одеяло', cost: 380, rarity: 'Rare', c1: '#c48a2a', c2: '#a4412a', quilt: true },
  { id: 'pet_cat', slot: 'pet', name: 'Рыжий кот', cost: 600, rarity: 'Epic', kind: 'cat', box: [162, 208, 28, 18] },
  { id: 'pet_dog', slot: 'pet', name: 'Пёс', cost: 900, rarity: 'Epic', kind: 'dog', box: [144, 298, 40, 24] },
  { id: 'pet_fish', slot: 'pet', name: 'Аквариум', cost: 350, rarity: 'Rare', kind: 'fish', box: [118, 209, 18, 16] },
  { id: 'gadget_guitar', slot: 'gadget', name: 'Гитара', cost: 250, rarity: 'Common', kind: 'guitar', box: [61, 191, 18, 45] },
  { id: 'gadget_console', slot: 'gadget', name: 'Приставка', cost: 400, rarity: 'Rare', kind: 'console', box: [137, 286, 42, 18] },
  { id: 'gadget_bike', slot: 'gadget', name: 'Велотренажёр', cost: 1100, rarity: 'Legendary', kind: 'bike', box: [151, 287, 40, 40] },
];

export function roomItemById(id) { return ROOM_CATALOG.find(x => x.id === id) || null; }
export function emptyRoom() {
  const equipped = {};
  ROOM_SLOTS.forEach(s => { equipped[s.key] = null; });
  return { owned: [], equipped, placePulse: null };
}
export function normalizeRoom(r) {
  const d = emptyRoom();
  if (!r || typeof r !== 'object') return d;
  return { owned: Array.isArray(r.owned) ? r.owned : [], equipped: { ...d.equipped, ...(r.equipped || {}) }, placePulse: r.placePulse || null };
}
export const RARITY_RU = { Common: 'Обычный', Rare: 'Редкий', Epic: 'Эпический', Legendary: 'Легендарный' };
export const RARITY_COLOR = { Common: '#6b6f7a', Rare: '#2f6b6e', Epic: '#a83e66', Legendary: '#c48a2a' };

// Рамки слотов в координатах сцены — для подсветки и для превью в магазине.
export const SLOT_BOX = {
  rug: [46, 356, 103, 30],
  lamp: [172, 140, 23, 98],
  poster: [2, 70, 24, 34],
  plant: [2, 290, 34, 60],
  neon: [0, 154, 44, 17],
  desk: [0, 176, 66, 96],
  bed: [118, 200, 77, 80],
  pet: [118, 206, 77, 120],
  gadget: [62, 186, 130, 150],
};

// ---------- Время суток ----------
export function sceneTime(date = new Date()) {
  const h = date.getHours();
  if (h >= 7 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'evening';
  if (h >= 5 && h < 7) return 'dawn';
  return 'night';
}

const PAL = {
  day: { sky1: '#8fb3d0', sky2: '#a9c6db', sky3: '#c9d9e2', far: '#b8c4cc', mid: '#9aa6ae', bldg: '#d8cbb4', shade: '#a89a84', tower: '#e6e2d8', towerS: '#a8a49a', glass: '#9cc0d0', glassS: '#7aa0b4', road: '#7d7a74', leaf1: '#c08a4a', leaf2: '#a4602e', cloud: '#f4f1ea', sun: '#f4e8b0', sunY: 10, lit: 0, stars: 0, birds: 1, head: 0, dark: 0, lamp: 0, screen: '#8fb3a8', floorGlow: '#fff8e1', glowOp: 0.16, cove: 0 },
  dawn: { sky1: '#7a86b0', sky2: '#e0a69a', sky3: '#f2c9a0', far: '#a08890', mid: '#7a6a78', bldg: '#d4b09a', shade: '#9a7a70', tower: '#ead2bc', towerS: '#a88a7c', glass: '#e0b0a0', glassS: '#b08074', road: '#6a6068', leaf1: '#b07a44', leaf2: '#8e5432', cloud: '#f6d4c4', sun: '#f6d48a', sunY: 52, lit: 0.35, stars: 0.15, birds: 1, head: 1, dark: 0.08, lamp: 0.5, screen: '#8aa8c0', floorGlow: '#f6c8a0', glowOp: 0.16, cove: 0.2 },
  evening: { sky1: '#5a5a86', sky2: '#c07a6e', sky3: '#e4aa76', far: '#8a7078', mid: '#6a5a68', bldg: '#c49a84', shade: '#8a6c64', tower: '#e2c4a8', towerS: '#a0806e', glass: '#d89a7a', glassS: '#a86e60', road: '#5a5058', leaf1: '#a8683a', leaf2: '#8a4a2a', cloud: '#eec0a6', sun: '#f2c47a', sunY: 60, lit: 0.7, stars: 0.3, birds: 1, head: 1, dark: 0.14, lamp: 0.75, screen: '#7aa8c0', floorGlow: '#f0aa6e', glowOp: 0.15, cove: 0.4 },
  night: { sky1: '#1e2438', sky2: '#2a3250', sky3: '#3a4466', far: '#2a3048', mid: '#222740', bldg: '#4a4a62', shade: '#33344a', tower: '#ecd8a4', towerS: '#b09a6a', glass: '#34405e', glassS: '#262e48', road: '#24283a', leaf1: '#6a4a32', leaf2: '#4e3424', cloud: '#3e4766', sun: '#efe8cc', sunY: 8, lit: 1, stars: 1, birds: 0, head: 1, dark: 0.34, lamp: 1, screen: '#5a8ab0', floorGlow: '#96aadc', glowOp: 0.12, cove: 0.7 },
};

const CSS = `
.pxr { width: 100%; height: 100%; display: block; }
.pxr .a-carR{animation:pxrCarR 7s linear infinite}.pxr .a-carR2{animation:pxrCarR 9.5s linear infinite;animation-delay:-4s}.pxr .a-carR3{animation:pxrCarR 13s linear infinite;animation-delay:-8s}
@keyframes pxrCarR{from{transform:translateX(-10px)}to{transform:translateX(126px)}}
.pxr .a-carL{animation:pxrCarL 8s linear infinite}.pxr .a-carL2{animation:pxrCarL 11.5s linear infinite;animation-delay:-5s}
@keyframes pxrCarL{from{transform:translateX(126px)}to{transform:translateX(-12px)}}
.pxr .a-cl1{animation:pxrCloud 50s linear infinite}.pxr .a-cl2{animation:pxrCloud 75s linear infinite;animation-delay:-30s}
@keyframes pxrCloud{from{transform:translateX(-18px)}to{transform:translateX(124px)}}
.pxr .a-plane{animation:pxrPlane 26s linear infinite;animation-delay:-6s}
@keyframes pxrPlane{from{transform:translate(-10px,4px)}to{transform:translate(126px,-6px)}}
.pxr .a-birds{animation:pxrBirds 16s linear infinite}
@keyframes pxrBirds{0%{transform:translate(-8px,0)}50%{transform:translate(58px,-4px)}100%{transform:translate(126px,2px)}}
.pxr .a-flap{animation:pxrFlap .4s steps(2) infinite}@keyframes pxrFlap{50%{transform:translateY(1px)}}
.pxr .a-blink{animation:pxrBlink 1.2s steps(2) infinite}@keyframes pxrBlink{50%{opacity:.1}}
.pxr .a-tw{animation:pxrTw 2.2s steps(2) infinite}.pxr .a-tw2{animation:pxrTw 3s steps(2) infinite;animation-delay:-1s}@keyframes pxrTw{50%{opacity:.2}}
.pxr .a-flick{animation:pxrFlick 5s steps(1) infinite}.pxr .a-flick2{animation:pxrFlick 7s steps(1) infinite;animation-delay:-3s}
@keyframes pxrFlick{0%{opacity:1}30%{opacity:.3}55%{opacity:1}80%{opacity:.55}}
.pxr .a-leaves{animation:pxrLeaves 3s steps(2) infinite}@keyframes pxrLeaves{50%{transform:translateX(1px)}}
.pxr .a-curt{animation:pxrCurt 6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 0}@keyframes pxrCurt{50%{transform:skewX(1.2deg)}}
.pxr .a-breath{animation:pxrBreath 2.6s steps(2) infinite}@keyframes pxrBreath{50%{transform:translateY(1px)}}
.pxr .a-eyes{animation:pxrEyes 4.6s steps(1) infinite}@keyframes pxrEyes{0%,93%{opacity:1}94%,100%{opacity:0}}
.pxr .a-screen{animation:pxrScreen 3s steps(3) infinite}@keyframes pxrScreen{33%{opacity:.72}66%{opacity:1}}
.pxr .a-steam{animation:pxrSteam 2.4s steps(4) infinite}.pxr .a-steam2{animation:pxrSteam 2.4s steps(4) infinite;animation-delay:-1.2s}
@keyframes pxrSteam{from{transform:translateY(0);opacity:.85}to{transform:translateY(-8px);opacity:0}}
.pxr .a-sway{animation:pxrSway 3.2s steps(2) infinite}@keyframes pxrSway{50%{transform:translateX(1px)}}
.pxr .a-tail{animation:pxrTail 1.4s steps(2) infinite}@keyframes pxrTail{50%{transform:translateY(-1px)}}
.pxr .a-fish{animation:pxrFish 4s steps(8) infinite alternate}@keyframes pxrFish{to{transform:translateX(7px)}}
.pxr .a-lava{animation:pxrLava 3s steps(3) infinite alternate}@keyframes pxrLava{to{transform:translateY(-6px)}}
.pxr .a-neon{animation:pxrNeon 4s steps(1) infinite}@keyframes pxrNeon{0%,88%,100%{opacity:1}90%{opacity:.35}93%{opacity:1}95%{opacity:.5}}
.pxr .a-glow{animation:pxrGlow 4s ease-in-out infinite}@keyframes pxrGlow{50%{opacity:.75}}
.pxr .a-pedal{animation:pxrPedal .8s steps(2) infinite}@keyframes pxrPedal{50%{transform:translateY(1px)}}
.pxr .a-rain{animation:pxrRain .5s linear infinite}@keyframes pxrRain{to{transform:translate(-3px,12px)}}
.pxr .a-snow{animation:pxrSnow 6s linear infinite}@keyframes pxrSnow{to{transform:translate(4px,40px)}}
.pxr .a-hl{animation:pxrHl 1s ease-in-out infinite}@keyframes pxrHl{50%{opacity:.35}}
.pxr .a-pop{animation:pxrPop .6s cubic-bezier(.2,1.5,.3,1) both;transform-box:fill-box;transform-origin:50% 100%}
@keyframes pxrPop{0%{transform:scale(.4) translateY(-6px);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
.pxr .a-dust{animation:pxrDust .7s ease-out both;transform-box:fill-box;transform-origin:50% 50%}
@keyframes pxrDust{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.pxr.still *{animation:none !important}
`;

let cssInjected = false;
function useSceneCss() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-pxr', '1');
  el.textContent = CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

// ---------- Окно: живой Ташкент (координаты 120×145) ----------
function CityView({ p, weather }) {
  return (
    <g>
      <defs>
        <pattern id="pxr-hw" width="2" height="2" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill={p.shade} /></pattern>
        <pattern id="pxr-hl" width="4" height="4" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill="#f2d48a" /></pattern>
        <pattern id="pxr-fl" width="3" height="3" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="1" height="1" fill="#f2d48a" /></pattern>
        <pattern id="pxr-tl" width="1" height="4" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill={p.towerS} /></pattern>
        <pattern id="pxr-gs" width="3" height="1" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill={p.glassS} /></pattern>
        <pattern id="pxr-ld" width="6" height="1" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="3" height="1" fill="#d8d0b0" /></pattern>
        <g id="pxr-far"><rect x="0" y="80" width="8" height="30" /><rect x="6" y="74" width="6" height="36" /><rect x="12" y="82" width="10" height="28" /><rect x="30" y="78" width="6" height="32" /><rect x="52" y="80" width="10" height="30" /><rect x="62" y="74" width="6" height="36" /><rect x="100" y="76" width="8" height="34" /><rect x="110" y="80" width="10" height="30" /></g>
        <g id="pxr-mid"><rect x="0" y="90" width="20" height="26" /><rect x="22" y="94" width="14" height="22" /><rect x="38" y="88" width="16" height="28" /><rect x="56" y="92" width="16" height="24" /><rect x="74" y="88" width="22" height="28" /><rect x="98" y="92" width="22" height="24" /></g>
      </defs>
      <rect x="0" y="0" width="120" height="40" fill={p.sky1} />
      <rect x="0" y="40" width="120" height="30" fill={p.sky2} />
      <rect x="0" y="70" width="120" height="75" fill={p.sky3} />
      <g opacity={p.stars} fill="#f2eee5">
        <rect className="a-tw" x="40" y="8" width="1" height="1" /><rect className="a-tw2" x="56" y="4" width="1" height="1" /><rect className="a-tw" x="66" y="18" width="1" height="1" />
        <rect className="a-tw2" x="88" y="6" width="1" height="1" /><rect className="a-tw" x="8" y="12" width="1" height="1" /><rect className="a-tw2" x="112" y="22" width="1" height="1" />
      </g>
      <rect x="99" y={p.sunY} width="6" height="8" fill={p.sun} />
      <rect x="98" y={p.sunY + 1} width="8" height="6" fill={p.sun} />
      <g className="a-cl1" fill={p.cloud}><rect x="0" y="16" width="14" height="3" /><rect x="3" y="14" width="7" height="2" /></g>
      <g className="a-cl2" fill={p.cloud} opacity=".8"><rect x="0" y="34" width="10" height="2" /><rect x="2" y="32" width="5" height="2" /></g>
      <g className="a-plane"><rect x="0" y="24" width="6" height="1" fill="#f2eee5" /><rect x="2" y="23" width="2" height="1" fill="#f2eee5" /><rect className="a-blink" x="6" y="24" width="1" height="1" fill="#d65a4a" /></g>
      <g className="a-birds" opacity={p.birds} fill="#4a4e5a">
        <g className="a-flap"><rect x="0" y="40" width="1" height="1" /><rect x="1" y="41" width="1" height="1" /><rect x="2" y="40" width="1" height="1" /></g>
        <g className="a-flap"><rect x="5" y="37" width="1" height="1" /><rect x="6" y="38" width="1" height="1" /><rect x="7" y="37" width="1" height="1" /></g>
      </g>
      <use href="#pxr-far" fill={p.far} />
      <g opacity={p.lit}><use className="a-flick2" href="#pxr-far" fill="url(#pxr-fl)" /></g>
      {/* Ташкентская телебашня */}
      <polygon points="12,74 20,54 21,54 14,74" fill={p.tower} />
      <polygon points="29,74 22,54 23,54 27,74" fill={p.tower} />
      <rect x="20" y="28" width="3" height="46" fill={p.tower} /><rect x="20" y="28" width="3" height="46" fill="url(#pxr-tl)" />
      <rect x="15" y="42" width="13" height="3" fill={p.tower} /><rect x="16" y="45" width="11" height="2" fill={p.towerS} />
      <rect x="16" y="43" width="11" height="1" fill="#f6e6b0" opacity={p.lit} />
      <rect x="17" y="56" width="9" height="2" fill={p.tower} /><rect x="18" y="58" width="7" height="1" fill={p.towerS} />
      <rect x="21" y="10" width="1" height="18" fill="#efe9dc" />
      <rect x="21" y="10" width="1" height="3" fill="#c0503a" /><rect x="21" y="16" width="1" height="3" fill="#c0503a" /><rect x="21" y="22" width="1" height="3" fill="#c0503a" />
      <g className="a-blink" fill="#e04a3a"><rect x="21" y="7" width="1" height="2" /><rect x="20" y="8" width="3" height="1" /></g>
      {/* гостиница «Узбекистан» */}
      <rect x="35" y="60" width="18" height="2" fill={p.shade} />
      <rect x="36" y="62" width="16" height="26" fill={p.bldg} />
      <rect x="37" y="63" width="14" height="24" fill="url(#pxr-hw)" />
      <g opacity={p.lit}><rect className="a-flick" x="37" y="63" width="14" height="24" fill="url(#pxr-hl)" /></g>
      {/* Tashkent City */}
      <rect x="71" y="44" width="7" height="2" fill={p.glass} /><rect x="73" y="42" width="3" height="2" fill={p.glass} />
      <rect x="70" y="46" width="9" height="42" fill={p.glass} /><rect x="70" y="46" width="9" height="42" fill="url(#pxr-gs)" />
      <rect x="81" y="56" width="10" height="32" fill={p.glass} /><rect x="81" y="56" width="10" height="32" fill="url(#pxr-gs)" />
      <rect x="93" y="50" width="8" height="38" fill={p.glass} /><rect x="93" y="50" width="8" height="38" fill="url(#pxr-gs)" />
      <rect x="103" y="62" width="11" height="26" fill={p.glassS} />
      <g opacity={p.lit}><rect className="a-flick2" x="70" y="46" width="9" height="42" fill="url(#pxr-fl)" /><rect className="a-flick" x="93" y="50" width="8" height="38" fill="url(#pxr-fl)" /></g>
      <use href="#pxr-mid" fill={p.mid} />
      <g opacity={p.lit}><use className="a-flick" href="#pxr-mid" fill="url(#pxr-hl)" /></g>
      <rect x="0" y="116" width="120" height="9" fill={p.road} />
      <rect x="0" y="116" width="120" height="1" fill="#8a8780" />
      <rect x="0" y="120" width="120" height="1" fill="url(#pxr-ld)" />
      <g className="a-carR"><rect x="0" y="117" width="7" height="3" fill="#a4412a" /><rect x="2" y="117" width="3" height="1" fill="#c9d9e2" /><rect x="7" y="118" width="1" height="1" fill="#f6e6b0" opacity={p.head} /></g>
      <g className="a-carR2"><rect x="0" y="117" width="6" height="3" fill="#d8a83a" /><rect x="2" y="117" width="2" height="1" fill="#c9d9e2" /><rect x="6" y="118" width="1" height="1" fill="#f6e6b0" opacity={p.head} /></g>
      <g className="a-carR3"><rect x="0" y="117" width="8" height="3" fill="#efe9dc" /><rect x="2" y="117" width="4" height="1" fill="#c9d9e2" /><rect x="8" y="118" width="1" height="1" fill="#f6e6b0" opacity={p.head} /></g>
      <g className="a-carL"><rect x="1" y="121" width="7" height="3" fill="#2f6b6e" /><rect x="3" y="121" width="3" height="1" fill="#c9d9e2" /><rect x="0" y="122" width="1" height="1" fill="#f6e6b0" opacity={p.head} /></g>
      <g className="a-carL2"><rect x="1" y="121" width="6" height="3" fill="#3f7a4a" /><rect x="3" y="121" width="2" height="1" fill="#c9d9e2" /><rect x="0" y="122" width="1" height="1" fill="#f6e6b0" opacity={p.head} /></g>
      <g className="a-leaves">
        <g fill={p.leaf1}><rect x="0" y="126" width="14" height="19" /><rect x="24" y="128" width="10" height="17" /><rect x="92" y="127" width="14" height="18" /><rect x="80" y="132" width="10" height="13" /></g>
        <g fill={p.leaf2}><rect x="10" y="130" width="12" height="15" /><rect x="104" y="125" width="16" height="20" /><rect x="36" y="134" width="8" height="11" /></g>
      </g>
      {(weather === 'rain' || weather === 'storm') && (
        <g className="a-rain" fill="#c9d9e2" opacity=".55">
          {[4, 16, 27, 39, 50, 62, 73, 85, 96, 108, 118].map((x, i) => (
            <g key={x}><rect x={x} y={(i * 23) % 40 - 12} width="1" height="4" /><rect x={x - 6} y={(i * 23) % 40 + 40} width="1" height="4" /><rect x={x - 2} y={(i * 23) % 40 + 88} width="1" height="4" /></g>
          ))}
        </g>
      )}
      {weather === 'snow' && (
        <g className="a-snow" fill="#f2eee5">
          {[6, 20, 33, 47, 58, 71, 84, 97, 110].map((x, i) => (
            <g key={x}><rect x={x} y={(i * 17) % 40 - 40} width="1" height="1" /><rect x={x - 5} y={(i * 17) % 40 + 10} width="1" height="1" /><rect x={x + 3} y={(i * 17) % 40 + 60} width="1" height="1" /><rect x={x - 2} y={(i * 17) % 40 + 105} width="1" height="1" /></g>
          ))}
        </g>
      )}
    </g>
  );
}

// ---------- Предметы ----------
function Rug({ it }) {
  return (
    <g>
      <rect x="48" y="360" width="99" height="22" fill={it.c3} />
      <rect x="50" y="362" width="95" height="18" fill={it.c1} />
      <rect x="53" y="365" width="89" height="12" fill={it.c2} />
      {it.suzani ? (
        <g>
          <rect x="56" y="367" width="83" height="8" fill={it.c1} />
          {[64, 80, 97, 114, 130].map(x => <g key={x}><rect x={x - 3} y="369" width="6" height="4" fill={it.c2} /><rect x={x - 1} y="368" width="2" height="6" fill={it.c3} /></g>)}
        </g>
      ) : (
        <g fill={it.c3}>{[58, 70, 82, 94, 106, 118, 130].map(x => <rect key={x} x={x} y="370" width="5" height="2" />)}</g>
      )}
      <g fill={it.c2}>{[49, 53, 57, 61].map(y => <rect key={y} x="46" y={y + 311} width="2" height="1" />)}{[49, 53, 57, 61].map(y => <rect key={'r' + y} x="147" y={y + 311} width="2" height="1" />)}</g>
    </g>
  );
}

function FloorLamp({ it, p }) {
  return (
    <g>
      <circle className="a-glow" cx="183" cy="152" r="38" fill={it.glow} opacity={0.12 + 0.3 * p.lamp} style={{ filter: 'blur(6px)' }} />
      <rect x="182" y="160" width="2" height="74" fill="#3e3026" />
      <rect x="177" y="234" width="12" height="3" fill="#3e3026" />
      {it.lava ? (
        <g>
          <rect x="178" y="140" width="10" height="22" fill="#3e3026" />
          <rect x="179" y="142" width="8" height="18" fill={it.shade} />
          <g className="a-lava" fill="#f6d0e4"><rect x="181" y="154" width="3" height="3" /><rect x="183" y="148" width="2" height="2" /></g>
        </g>
      ) : (
        <g>
          <rect x="175" y="142" width="16" height="3" fill={it.shade} />
          <rect x="174" y="145" width="18" height="12" fill={it.shade} />
          <rect x="174" y="156" width="18" height="2" fill="#f6e6b0" opacity={0.3 + 0.7 * p.lamp} />
        </g>
      )}
    </g>
  );
}

function Poster({ it }) {
  return (
    <g>
      <rect x="4" y="72" width="20" height="30" fill="#3e3026" />
      <rect x="5" y="73" width="18" height="28" fill="#f2eee5" />
      {it.kind === 'goal' && (
        <g><rect x="9" y="78" width="10" height="10" fill="#a4412a" /><rect x="11" y="80" width="6" height="6" fill="#f2eee5" /><rect x="13" y="82" width="2" height="2" fill="#a4412a" /><rect x="8" y="92" width="12" height="1" fill="#1e2230" /><rect x="8" y="95" width="9" height="1" fill="#6b6f7a" /></g>
      )}
      {it.kind === 'tower' && (
        <g><rect x="5" y="73" width="18" height="18" fill="#e4aa76" /><rect x="5" y="91" width="18" height="10" fill="#c07a6e" /><rect x="13" y="76" width="1" height="20" fill="#1e2230" /><rect x="11" y="82" width="5" height="2" fill="#1e2230" /><rect x="11" y="96" width="1" height="4" fill="#1e2230" /><rect x="15" y="96" width="1" height="4" fill="#1e2230" /><rect x="13" y="74" width="1" height="2" fill="#a4412a" /></g>
      )}
      {it.kind === 'map' && (
        <g><rect x="5" y="73" width="18" height="28" fill="#cfe0e4" /><rect x="7" y="76" width="5" height="4" fill="#7a9a56" /><rect x="13" y="77" width="7" height="5" fill="#7a9a56" /><rect x="8" y="84" width="3" height="6" fill="#7a9a56" /><rect x="15" y="85" width="4" height="7" fill="#7a9a56" /><rect x="17" y="94" width="3" height="3" fill="#7a9a56" /><rect x="16" y="79" width="1" height="1" fill="#a4412a" /></g>
      )}
    </g>
  );
}

function Plant({ it }) {
  return (
    <g>
      <g className="a-sway">
        {it.kind === 'ficus' && (
          <g><rect x="17" y="306" width="2" height="26" fill="#5a4030" />
            <g fill="#5a7a4a"><rect x="9" y="300" width="9" height="7" /><rect x="18" y="296" width="10" height="8" /><rect x="12" y="308" width="8" height="6" /><rect x="20" y="310" width="9" height="6" /><rect x="6" y="314" width="8" height="5" /></g>
            <g fill="#7a9a56"><rect x="11" y="301" width="4" height="2" /><rect x="21" y="297" width="4" height="2" /><rect x="22" y="311" width="4" height="2" /></g></g>
        )}
        {it.kind === 'monstera' && (
          <g><rect x="17" y="312" width="2" height="20" fill="#3f6a3a" /><rect x="12" y="314" width="2" height="18" fill="#3f6a3a" /><rect x="23" y="316" width="2" height="16" fill="#3f6a3a" />
            <g fill="#3f7a4a"><rect x="4" y="300" width="14" height="12" /><rect x="18" y="292" width="14" height="13" /><rect x="20" y="306" width="13" height="10" /></g>
            <g fill="#2e5a36"><rect x="9" y="303" width="1" height="7" /><rect x="25" y="295" width="1" height="8" /><rect x="26" y="308" width="1" height="6" /><rect x="6" y="306" width="2" height="2" /><rect x="29" y="298" width="2" height="2" /></g></g>
        )}
        {it.kind === 'cactus' && (
          <g><rect x="15" y="298" width="7" height="34" fill="#5a8a4a" /><rect x="9" y="308" width="4" height="12" fill="#5a8a4a" /><rect x="13" y="316" width="2" height="3" fill="#5a8a4a" /><rect x="24" y="304" width="4" height="12" fill="#5a8a4a" /><rect x="22" y="312" width="2" height="3" fill="#5a8a4a" />
            <g fill="#3f6a3a"><rect x="17" y="300" width="1" height="30" /><rect x="20" y="300" width="1" height="30" /></g>
            <rect x="16" y="294" width="5" height="4" fill="#d65a8a" /><rect x="17" y="293" width="3" height="1" fill="#f2a0c0" /></g>
        )}
      </g>
      <rect x="7" y="330" width="22" height="3" fill="#c97a5a" />
      <rect x="9" y="333" width="18" height="14" fill="#b5654a" />
      <rect x="9" y="338" width="18" height="1" fill="#9a4f38" />
    </g>
  );
}

function NeonSign({ it }) {
  return (
    <g className="a-neon">
      <rect x="2" y="156" width="40" height="13" fill="#1e2230" opacity=".88" />
      <text x="22" y="166" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight="700" fontSize="9" fill={it.col} style={{ filter: `drop-shadow(0 0 2px ${it.col})` }}>{it.text}</text>
    </g>
  );
}

function Desk({ it, p }) {
  const d = it || { top: '#8a5a3a', edge: '#6e4630', body: '#7a4e34' };
  return (
    <g>
      <circle className="a-glow" cx="50" cy="196" r="30" fill="url(#pxr-warm)" opacity={0.8 * p.lamp} />
      <rect x="4" y="182" width="28" height="21" fill="#1e2230" />
      <rect className="a-screen" x="5" y="183" width="26" height="18" fill={p.screen} />
      <rect x="7" y="186" width="12" height="1" fill="#e8efe9" /><rect x="7" y="190" width="8" height="1" fill="#e8efe9" /><rect x="7" y="194" width="14" height="1" fill="#e8efe9" />
      <rect x="16" y="203" width="4" height="9" fill="#1e2230" /><rect x="12" y="212" width="12" height="2" fill="#1e2230" />
      <rect x="45" y="176" width="12" height="5" fill="#a4412a" /><rect x="47" y="181" width="8" height="1" fill="#f6e6b0" opacity={p.lamp} />
      <rect x="51" y="182" width="2" height="30" fill="#3e3026" /><rect x="47" y="212" width="10" height="2" fill="#3e3026" />
      <rect x="37" y="207" width="6" height="7" fill="#f2eee5" /><rect x="43" y="209" width="1" height="3" fill="#f2eee5" />
      <rect className="a-steam" x="39" y="202" width="1" height="3" fill="#f2eee5" /><rect className="a-steam2" x="41" y="203" width="1" height="3" fill="#f2eee5" />
      <rect x="26" y="211" width="9" height="3" fill="#55556a" />
      <rect x="0" y="214" width="65" height="4" fill={d.top} />
      <rect x="0" y="218" width="65" height="2" fill={d.edge} />
      <rect x="2" y="220" width="3" height="50" fill={d.edge} />
      <rect x="37" y="220" width="28" height="50" fill={d.body} />
      <rect x="46" y="232" width="10" height="1" fill={d.edge} /><rect x="46" y="250" width="10" height="1" fill={d.edge} />
    </g>
  );
}

function Bed({ it }) {
  const b = it || { c1: '#3a4560', c2: '#2e374e' };
  return (
    <g>
      <rect x="120" y="228" width="14" height="2" fill="#8a5a3a" /><rect x="120" y="230" width="14" height="26" fill="#7a4e34" /><rect x="122" y="241" width="10" height="1" fill="#5a3826" />
      <rect x="123" y="222" width="5" height="6" fill="#2f6b6e" /><rect x="129" y="224" width="4" height="4" fill="#c48a2a" />
      <rect x="140" y="204" width="55" height="16" fill="#5a4636" /><rect x="140" y="204" width="55" height="1" fill="#6e5844" />
      <rect x="146" y="216" width="18" height="8" fill="#f2eee5" /><rect x="166" y="216" width="22" height="8" fill="#e6e0d3" />
      <rect x="136" y="224" width="59" height="38" fill={b.c1} />
      {b.quilt ? (
        <g>{[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4, 5].map(c => ((r + c) % 2 === 0 ? <rect key={r + '-' + c} x={136 + c * 10} y={224 + r * 9} width="10" height="9" fill={b.c2} /> : null)))}<rect x="136" y="224" width="59" height="1" fill="#f2eee5" opacity=".6" /></g>
      ) : (
        <g><rect x="136" y="230" width="59" height="1" fill={b.c2} /><rect x="140" y="244" width="55" height="1" fill={b.c2} /><rect x="136" y="224" width="59" height="2" fill="#f2eee5" opacity=".35" /></g>
      )}
      <rect x="136" y="262" width="59" height="8" fill="#3e3026" /><rect x="138" y="270" width="3" height="6" fill="#3e3026" />
    </g>
  );
}

function Pet({ it }) {
  if (it.kind === 'cat') return (
    <g>
      <rect x="168" y="216" width="14" height="7" fill="#d88a3a" /><rect x="166" y="214" width="6" height="6" fill="#d88a3a" /><rect x="166" y="212" width="2" height="2" fill="#d88a3a" /><rect x="170" y="212" width="2" height="2" fill="#d88a3a" />
      <rect x="167" y="216" width="1" height="1" fill="#1e2230" /><rect x="170" y="216" width="1" height="1" fill="#1e2230" />
      <rect x="171" y="218" width="8" height="1" fill="#b86a2a" /><rect x="173" y="220" width="6" height="1" fill="#b86a2a" />
      <g className="a-tail"><rect x="182" y="219" width="5" height="2" fill="#d88a3a" /><rect x="186" y="217" width="2" height="2" fill="#d88a3a" /></g>
    </g>
  );
  if (it.kind === 'dog') return (
    <g>
      <rect x="150" y="306" width="22" height="10" fill="#c9a27a" /><rect x="168" y="300" width="9" height="9" fill="#c9a27a" /><rect x="176" y="304" width="4" height="4" fill="#c9a27a" />
      <rect x="168" y="300" width="3" height="7" fill="#8a6a4a" /><rect x="179" y="305" width="1" height="1" fill="#1e2230" /><rect x="173" y="302" width="1" height="1" fill="#1e2230" />
      <rect x="152" y="316" width="4" height="3" fill="#b08a62" /><rect x="164" y="316" width="4" height="3" fill="#b08a62" />
      <g className="a-tail"><rect x="146" y="304" width="5" height="2" fill="#c9a27a" /></g>
      <rect x="148" y="319" width="34" height="2" fill="#000" opacity=".15" />
    </g>
  );
  return (
    <g>
      <rect x="121" y="212" width="12" height="11" fill="#3e3026" />
      <rect x="122" y="213" width="10" height="9" fill="#8ac0d0" />
      <rect x="122" y="220" width="10" height="2" fill="#d8c8a0" />
      <g className="a-fish"><rect x="123" y="215" width="3" height="2" fill="#e07a3a" /><rect x="122" y="215" width="1" height="1" fill="#e07a3a" /></g>
      <rect className="a-tw" x="129" y="214" width="1" height="1" fill="#f2eee5" />
    </g>
  );
}

function Gadget({ it }) {
  if (it.kind === 'guitar') return (
    <g>
      <rect x="69" y="196" width="2" height="18" fill="#3e3026" /><rect x="68" y="194" width="4" height="3" fill="#3e3026" />
      <rect x="65" y="214" width="10" height="9" fill="#b5654a" /><rect x="64" y="222" width="12" height="11" fill="#b5654a" />
      <rect x="68" y="224" width="4" height="4" fill="#3e3026" /><rect x="66" y="231" width="8" height="1" fill="#9a4f38" />
    </g>
  );
  if (it.kind === 'console') return (
    <g>
      <rect x="140" y="292" width="20" height="8" fill="#e6e0d3" /><rect x="140" y="292" width="20" height="1" fill="#f2eee5" /><rect className="a-blink" x="156" y="295" width="2" height="1" fill="#3f7a4a" />
      <rect x="164" y="296" width="12" height="5" fill="#1e2230" /><rect x="165" y="297" width="2" height="1" fill="#a4412a" /><rect x="172" y="297" width="2" height="1" fill="#2f6b6e" />
      <rect x="140" y="300" width="36" height="2" fill="#000" opacity=".15" />
    </g>
  );
  return (
    <g>
      <rect x="160" y="292" width="4" height="30" fill="#3e3026" /><rect x="156" y="290" width="12" height="3" fill="#1e2230" />
      <rect x="164" y="304" width="18" height="4" fill="#3e3026" /><rect x="180" y="296" width="3" height="10" fill="#3e3026" /><rect x="177" y="294" width="9" height="3" fill="#a4412a" />
      <g className="a-pedal"><rect x="168" y="310" width="8" height="8" fill="#55556a" /><rect x="171" y="313" width="2" height="2" fill="#a4412a" /></g>
      <rect x="154" y="322" width="34" height="3" fill="#3e3026" />
    </g>
  );
}

// ---------- Персонаж (18×53, растягивается по телосложению) ----------
const BODY_SX = [0.84, 0.9, 0.95, 1, 1.06, 1.14, 1.24, 1.34];
function Hero({ tier = 3, heightScale = 1, photoTint, gear }) {
  useHeroGearCss();
  const L = gearLayers(gear || {}, true);
  const sx = BODY_SX[Math.max(0, Math.min(7, tier))] || 1;
  const k = 2.95 * Math.max(0.88, Math.min(1.12, heightScale));
  const w = 18 * k;
  const h = 53 * k;
  const x = 97.5 - w / 2;
  const y = 378 - h;
  const body = `translate(9 0) scale(${sx} 1) translate(-9 0)`;
  return (
    <g>
      <g fill="#000" opacity=".22">
        <rect x={97.5 - 22 * sx} y="374" width={44 * sx} height="4" /><rect x={97.5 - 17 * sx} y="378" width={34 * sx} height="2" />
      </g>
      <svg x={x} y={y} width={w} height={h} viewBox="0 0 18 53" overflow="visible" className="a-breath">
        <g transform={body}>{L.back}</g>
        <g transform={body}>
          <rect x="1" y="15" width="3" height="12" fill="#1a1e2c" /><rect x="14" y="15" width="3" height="12" fill="#1a1e2c" />
          <rect x="2" y="27" width="3" height="2" fill="#e8b896" /><rect x="13" y="27" width="3" height="2" fill="#e8b896" />
          <rect x="4" y="11" width="3" height="2" fill="#1e2230" /><rect x="11" y="11" width="3" height="2" fill="#1e2230" />
          <rect x="2" y="13" width="14" height="2" fill="#1e2230" />
          <rect x="4" y="15" width="10" height="13" fill="#1e2230" />
          <rect x="5" y="15" width="1" height="9" fill="#2e3346" />
          <rect x="7" y="12" width="1" height="6" fill="#f2eee5" /><rect x="10" y="12" width="1" height="5" fill="#f2eee5" />
          <rect x="5" y="24" width="8" height="1" fill="#141826" />
          <rect x="3" y="28" width="12" height="2" fill="#1a1e2c" />
          <rect x="4" y="30" width="5" height="18" fill="#2b2f3e" /><rect x="9" y="30" width="5" height="18" fill="#2b2f3e" />
          <rect x="8" y="34" width="2" height="14" fill="#20232f" /><rect x="5" y="31" width="1" height="14" fill="#3a3f52" />
          <rect x="3" y="44" width="6" height="4" fill="#2b2f3e" /><rect x="9" y="44" width="6" height="4" fill="#2b2f3e" />
          <rect x="2" y="48" width="7" height="3" fill="#f2eee5" /><rect x="9" y="48" width="7" height="3" fill="#f2eee5" />
          <rect x="2" y="51" width="7" height="1" fill="#c9bfae" /><rect x="9" y="51" width="7" height="1" fill="#c9bfae" />
          {L.body}
        </g>
        <rect x="7" y="10" width="4" height="2" fill="#d8a482" />
        <rect x="4" y="3" width="10" height="7" fill="#e8b896" />
        <g className="a-eyes"><rect x="5" y="6" width="2" height="2" fill="#1e2230" /><rect x="11" y="6" width="2" height="2" fill="#1e2230" /></g>
        <rect x="9" y="8" width="1" height="1" fill="#c99a82" /><rect x="8" y="9" width="2" height="1" fill="#b88274" />
        <g fill={photoTint || '#1e1a1a'}>
          <rect x="6" y="0" width="7" height="1" /><rect x="4" y="1" width="11" height="1" /><rect x="3" y="2" width="13" height="2" />
          <rect x="3" y="4" width="3" height="1" /><rect x="7" y="4" width="2" height="2" /><rect x="10" y="4" width="2" height="1" /><rect x="13" y="4" width="2" height="1" />
          <rect x="3" y="5" width="1" height="4" /><rect x="14" y="5" width="1" height="3" />
        </g>
        {L.head}
        <g transform={body}>{L.front}</g>
      </svg>
    </g>
  );
}

const DRAW = {
  rug: (it) => <Rug it={it} />,
  lamp: (it, p) => <FloorLamp it={it} p={p} />,
  poster: (it) => <Poster it={it} />,
  plant: (it) => <Plant it={it} />,
  neon: (it) => <NeonSign it={it} />,
  desk: (it, p) => <Desk it={it} p={p} />,
  bed: (it) => <Bed it={it} />,
  pet: (it) => <Pet it={it} />,
  gadget: (it) => <Gadget it={it} />,
};

function Placed({ slot, it, p, pulse }) {
  if (!it) return null;
  const just = pulse && pulse.slot === slot && pulse.id === it.id && Date.now() - (pulse.ts || 0) < 4000;
  const b = SLOT_BOX[slot];
  return (
    <g key={just ? 'pop-' + pulse.ts : 'idle'} className={just ? 'a-pop' : undefined}>
      {DRAW[slot](it, p)}
      {just && b && <ellipse className="a-dust" cx={b[0] + b[2] / 2} cy={b[1] + b[3] - 2} rx={b[2] / 2} ry="5" fill="#f2eee5" opacity=".9" />}
    </g>
  );
}

/**
 * Полная сцена комнаты.
 * props: room (state.room), tier (0..7 телосложение), heightScale, time ('day'|'dawn'|'evening'|'night'),
 * weather ('clear'|'rain'|'snow'|...), still (без анимаций), highlight (ключ слота для подсветки).
 */
export function PixelRoomScene({ room, tier = 3, heightScale = 1, time, weather = 'clear', still = false, highlight = null, aura = null, gear = null }) {
  useSceneCss();
  const r = normalizeRoom(room);
  const t = time || sceneTime();
  const p = PAL[t] || PAL.day;
  const eq = r.equipped;
  const item = (slot) => roomItemById(eq[slot]);
  const pulse = r.placePulse;
  const hb = highlight ? SLOT_BOX[highlight] : null;
  return (
    <svg className={'pxr' + (still ? ' still' : '')} viewBox="0 0 195 422" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" role="img" aria-label="Комната героя, за окном Ташкент">
      <defs>
        <pattern id="pxr-wall" width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill="#d8cdb8" /><rect x="12" width="12" height="10" fill="#d2c6ae" /></pattern>
        <pattern id="pxr-plank" width="36" height="18" patternUnits="userSpaceOnUse"><rect width="36" height="18" fill="#9a7452" /><rect y="8" width="36" height="1" fill="#7c5a3e" /><rect y="17" width="36" height="1" fill="#7c5a3e" /><rect x="10" width="1" height="8" fill="#86623f" /><rect x="28" y="9" width="1" height="8" fill="#86623f" /><rect y="9" width="36" height="8" fill="#8a6646" opacity=".5" /></pattern>
        <clipPath id="pxr-win"><rect x="0" y="0" width="120" height="145" /></clipPath>
        <radialGradient id="pxr-warm"><stop offset="0" stopColor="#f6d08a" stopOpacity=".7" /><stop offset="1" stopColor="#f6d08a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="195" height="70" fill="#c9bca4" />
      <rect x="15" y="48" width="180" height="5" fill="#b8aa90" />
      <rect x="17" y="53" width="176" height="1" fill="#f2c47a" opacity={p.cove} />
      <rect x="95" y="42" width="20" height="4" fill="#f2eee5" /><rect x="97" y="46" width="16" height="1" fill="#a89a80" />
      <rect x="0" y="66" width="195" height="170" fill="url(#pxr-wall)" />
      <rect x="0" y="231" width="195" height="5" fill="#7c5a3e" />
      <rect x="0" y="236" width="195" height="186" fill="url(#pxr-plank)" />
      <polygon points="55,236 172,236 215,360 15,360" fill="url(#pxr-floorglow)" opacity={p.glowOp * 2.2} />
      <defs><linearGradient id="pxr-floorglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.floorGlow} stopOpacity=".9" /><stop offset="1" stopColor={p.floorGlow} stopOpacity="0" /></linearGradient></defs>

      <g transform="translate(52 73)"><g clipPath="url(#pxr-win)"><CityView p={p} weather={weather} /></g></g>
      <rect x="49" y="70" width="126" height="3" fill="#6e5844" />
      <rect x="49" y="73" width="3" height="145" fill="#6e5844" /><rect x="172" y="73" width="3" height="145" fill="#6e5844" />
      <rect x="85" y="73" width="3" height="145" fill="#6e5844" /><rect x="133" y="73" width="3" height="145" fill="#6e5844" /><rect x="52" y="90" width="120" height="3" fill="#6e5844" />
      <rect x="47" y="218" width="130" height="5" fill="#8a7058" /><rect x="47" y="223" width="130" height="1" fill="#6e5844" />
      <polygon points="60,73 70,73 52,110 52,95" fill="#fff" opacity=".07" /><polygon points="140,73 146,73 136,90 136,82" fill="#fff" opacity=".06" />

      <rect x="28" y="63" width="167" height="3" fill="#3e3026" />
      <g className="a-curt"><rect x="30" y="66" width="22" height="170" fill="#b5654a" /><rect x="34" y="66" width="1" height="170" fill="#9a4f38" /><rect x="40" y="66" width="1" height="170" fill="#9a4f38" /><rect x="46" y="66" width="1" height="170" fill="#9a4f38" /><rect x="51" y="66" width="1" height="170" fill="#8a4430" /></g>
      <g className="a-curt"><rect x="172" y="66" width="23" height="170" fill="#b5654a" /><rect x="172" y="66" width="1" height="170" fill="#8a4430" /><rect x="178" y="66" width="1" height="170" fill="#9a4f38" /><rect x="185" y="66" width="1" height="170" fill="#9a4f38" /><rect x="191" y="66" width="1" height="170" fill="#9a4f38" /></g>

      <rect x="0" y="118" width="42" height="3" fill="#7c5a3e" /><rect x="0" y="121" width="42" height="1" fill="#5a4030" />
      <rect x="0" y="148" width="42" height="3" fill="#7c5a3e" /><rect x="0" y="151" width="42" height="1" fill="#5a4030" />
      <rect x="2" y="104" width="3" height="14" fill="#a4412a" /><rect x="5" y="102" width="3" height="16" fill="#2f6b6e" /><rect x="8" y="105" width="3" height="13" fill="#c48a2a" /><rect x="11" y="103" width="2" height="15" fill="#1e2230" />
      <rect x="18" y="106" width="10" height="12" fill="#3e3026" /><rect x="19" y="107" width="8" height="10" fill="#8fb3a8" />
      <rect x="32" y="112" width="6" height="6" fill="#b5654a" /><rect x="34" y="106" width="2" height="6" fill="#5a7a4a" /><rect x="31" y="108" width="2" height="3" fill="#5a7a4a" /><rect x="37" y="107" width="2" height="4" fill="#5a7a4a" />
      <rect x="2" y="136" width="12" height="12" fill="#3e3026" /><rect x="3" y="137" width="10" height="10" fill="#e2c49a" />
      <rect x="18" y="138" width="3" height="10" fill="#2f6b6e" /><rect x="21" y="136" width="3" height="12" fill="#a83e66" /><rect x="24" y="139" width="3" height="9" fill="#f2eee5" />
      <rect x="30" y="144" width="10" height="2" fill="#a4412a" /><rect x="30" y="146" width="10" height="2" fill="#7c5a3e" />

      <Placed slot="poster" it={item('poster')} p={p} pulse={pulse} />
      <Placed slot="neon" it={item('neon')} p={p} pulse={pulse} />
      <Placed slot="lamp" it={item('lamp')} p={p} pulse={pulse} />
      <g>{item('desk') ? <Placed slot="desk" it={item('desk')} p={p} pulse={pulse} /> : <Desk it={null} p={p} />}</g>
      <g>{item('bed') ? <Placed slot="bed" it={item('bed')} p={p} pulse={pulse} /> : <Bed it={null} />}</g>
      <Placed slot="gadget" it={item('gadget')} p={p} pulse={pulse} />
      <Placed slot="plant" it={item('plant')} p={p} pulse={pulse} />
      <Placed slot="rug" it={item('rug')} p={p} pulse={pulse} />
      <Placed slot="pet" it={item('pet')} p={p} pulse={pulse} />

      <path d="M0 0H195V422H0Z M52 73V218H172V73Z" fillRule="evenodd" fill="#1a2040" opacity={p.dark} pointerEvents="none" />

      {aura && (() => {
        const hh = 53 * 2.95 * Math.max(0.88, Math.min(1.12, heightScale));
        const sc = (hh * 1.25) / 150;
        return <svg x={97.5 - 50 * sc} y={378 - 150 * sc} width={100 * sc} height={160 * sc} viewBox="0 0 100 160" overflow="visible" aria-hidden="true">{aura}</svg>;
      })()}
      <Hero tier={tier} heightScale={heightScale} gear={gear} />

      {hb && (
        <g className="a-hl" pointerEvents="none">
          <rect x={hb[0]} y={hb[1]} width={hb[2]} height={hb[3]} fill="#a4412a" opacity=".12" />
          <rect x={hb[0]} y={hb[1]} width={hb[2]} height="1" fill="#a4412a" /><rect x={hb[0]} y={hb[1] + hb[3] - 1} width={hb[2]} height="1" fill="#a4412a" />
          <rect x={hb[0]} y={hb[1]} width="1" height={hb[3]} fill="#a4412a" /><rect x={hb[0] + hb[2] - 1} y={hb[1]} width="1" height={hb[3]} fill="#a4412a" />
        </g>
      )}
    </svg>
  );
}

/** Маленькое превью предмета для магазина: рисует предмет в его месте сцены. */
export function RoomItemThumb({ it, width = 150, height = 92 }) {
  useSceneCss();
  const b = it.box || SLOT_BOX[it.slot];
  const pad = 5;
  let w = b[2] + pad * 2;
  let h = b[3] + pad * 2;
  const A = width / height;
  if (w / h > A) h = w / A; else w = h * A;
  const cx = b[0] + b[2] / 2;
  const cy = b[1] + b[3] / 2;
  const box = `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
  return (
    <svg className="pxr" viewBox={box} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', width: '100%', height, aspectRatio: `${width} / ${height}` }}>
      <rect x="-60" y="-20" width="320" height="256" fill="#d8cdb8" />
      <rect x="-60" y="236" width="320" height="220" fill="#9a7452" />
      <rect x="-60" y="231" width="320" height="5" fill="#7c5a3e" />
      {DRAW[it.slot](it, PAL.evening)}
    </svg>
  );
}

/** Где на экране (в px от верха контейнера) нижний край слота — чтобы поднять сцену над панелью. */
export function slotBottomPx(slot, W, H) {
  const b = SLOT_BOX[slot];
  if (!b) return 0;
  const k = Math.max(W / 195, H / 422);
  const cropTop = 422 * k - H;
  return (b[1] + b[3]) * k - cropTop;
}
