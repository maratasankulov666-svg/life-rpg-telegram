// financeUI.jsx — раздел «Финансы» как казна героя: сундук с монетами, долги-боссы, копилки-банки,
// быстрый ввод операций. Только отображение; логику (транзакции, платежи, бюджет) передаёт App.jsx.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PAPER } from './actionsUI.jsx';

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const CSS = `
@keyframes fnCoin { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes fnGlint { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
@keyframes fnHit { 0% { transform: translateX(0); filter: none; } 20% { transform: translateX(-4px); filter: brightness(2.2); } 40% { transform: translateX(4px); } 60% { transform: translateX(-2px); } 100% { transform: none; filter: none; } }
@keyframes fnDmg { 0% { opacity: 0; transform: translate(-50%, 0) scale(.6); } 20% { opacity: 1; transform: translate(-50%, -14px) scale(1.15); } 100% { opacity: 0; transform: translate(-50%, -46px) scale(1); } }
@keyframes fnIdle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes fnSheet { from { transform: translateY(100%); } to { transform: none; } }
@keyframes fnFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fnWave { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
.fn-coin { animation: fnCoin 1.6s steps(2) infinite; }
.fn-glint { animation: fnGlint 1.8s steps(2) infinite; }
.fn-hit { animation: fnHit .45s ease both; }
.fn-dmg { animation: fnDmg 1.1s cubic-bezier(.2,.8,.3,1) both; }
.fn-idle { animation: fnIdle 1.4s steps(2) infinite; }
.fn-sheet { animation: fnSheet .28s cubic-bezier(.2,.9,.3,1) both; }
.fn-fade { animation: fnFade .2s ease both; }
.fn-wave { animation: fnWave 2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .fn-coin,.fn-glint,.fn-idle,.fn-wave { animation: none; } }
`;
let injected = false;
export function useFinanceCss() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); injected = true;
}

export function fmtMoney(n, short) {
  const x = Math.round(Number(n) || 0);
  const sign = x < 0 ? '−' : '';
  const a = Math.abs(x);
  if (short && a >= 1e6) return sign + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + ' млн';
  if (short && a >= 1e4) return sign + Math.round(a / 1e3) + ' тыс';
  return sign + a.toLocaleString('ru-RU');
}

// ---------- Иконки категорий (8×8) ----------
const CAT_ICONS = {
  housing: [[3, 0, 2, 1], [2, 1, 4, 1], [1, 2, 6, 1], [0, 3, 8, 1], [1, 4, 6, 4], [3, 5, 2, 3, 'w']],
  utilities: [[4, 0, 3, 1], [3, 1, 3, 1], [2, 2, 3, 1], [1, 3, 6, 1], [4, 4, 2, 1], [3, 5, 2, 1], [2, 6, 2, 1], [1, 7, 2, 1]],
  phone: [[2, 0, 4, 8], [3, 1, 2, 5, 'w'], [3, 7, 2, 1, 'w']],
  internet: [[1, 1, 6, 1], [0, 2, 1, 1], [7, 2, 1, 1], [2, 3, 4, 1], [1, 4, 1, 1], [6, 4, 1, 1], [3, 5, 2, 1], [3, 7, 2, 1]],
  food: [[4, 0, 1, 2], [2, 2, 4, 1], [1, 3, 6, 4], [2, 7, 4, 1], [2, 3, 1, 2, 'w']],
  transport: [[1, 0, 6, 1], [0, 1, 8, 5], [1, 2, 6, 2, 'w'], [1, 6, 2, 2], [5, 6, 2, 2]],
  clothes: [[1, 0, 2, 1], [5, 0, 2, 1], [0, 1, 8, 2], [2, 3, 4, 5], [3, 1, 2, 1, 'w']],
  entertainment: [[0, 2, 8, 4], [1, 3, 1, 2, 'w'], [0, 3, 3, 1, 'w'], [5, 3, 1, 1, 'w'], [6, 4, 1, 1, 'w']],
  fuel: [[1, 1, 4, 7], [2, 2, 2, 2, 'w'], [5, 2, 2, 1], [6, 3, 1, 4], [5, 6, 1, 1]],
  carwash: [[3, 0, 2, 1], [2, 1, 4, 2], [1, 3, 6, 3], [2, 6, 4, 1], [2, 3, 1, 2, 'w']],
  repair: [[5, 0, 2, 2], [6, 2, 2, 1], [4, 2, 2, 2], [3, 4, 2, 1], [2, 5, 2, 1], [1, 6, 2, 2]],
  service: [[3, 0, 2, 1], [1, 1, 6, 6], [0, 3, 1, 2], [7, 3, 1, 2], [3, 7, 2, 1], [3, 3, 2, 2, 'w']],
  insurance: [[1, 0, 6, 1], [1, 1, 6, 3], [2, 4, 4, 2], [3, 6, 2, 1], [3, 1, 2, 3, 'w']],
  debt: [[0, 1, 8, 6], [0, 2, 8, 1, 'w'], [1, 5, 2, 1, 'w']],
  savings: [[1, 2, 6, 5], [0, 3, 1, 2], [7, 2, 1, 1], [2, 7, 1, 1], [5, 7, 1, 1], [3, 1, 2, 1], [5, 3, 1, 1, 'w']],
  income: [[2, 0, 4, 8], [0, 2, 8, 4], [1, 1, 6, 6], [3, 2, 2, 4, 'w']],
  taxi: [[2, 0, 4, 1], [1, 1, 6, 2], [0, 3, 8, 3], [1, 6, 2, 2], [5, 6, 2, 2], [1, 4, 1, 1, 'w'], [6, 4, 1, 1, 'w']],
  other: [[3, 1, 2, 6], [1, 3, 6, 2]],
};
const CAT_KIND = {
  housing: 'housing', utilities: 'utilities', phone: 'phone', internet: 'internet', food: 'food', transport: 'transport',
  clothes: 'clothes', entertainment: 'entertainment', other_life: 'other', fuel: 'fuel', carwash: 'carwash', repair: 'repair',
  service: 'service', insurance: 'insurance', other_car: 'service', debt_credit: 'debt', debt_micro: 'debt', debt_installment: 'debt',
  savings: 'savings', investments: 'savings', salary: 'income', taxi: 'taxi', youtube: 'income', business: 'income', loan: 'debt', other: 'income',
};
export const CAT_COLOR = {
  housing: '#5a4636', utilities: '#c48a2a', phone: '#2f3e6b', internet: '#2f6b6e', food: '#3f7a4a', transport: '#4a6a9a',
  clothes: '#a83e66', entertainment: '#7a5a8a', other_life: '#6b6f7a', fuel: '#a4412a', carwash: '#2f6b6e', repair: '#5a4636',
  service: '#6b6f7a', insurance: '#2f3e6b', other_car: '#6b6f7a', debt_credit: '#a4412a', debt_micro: '#a4412a', debt_installment: '#a4412a',
  savings: '#2f6b6e', investments: '#3f7a4a', salary: '#3f7a4a', taxi: '#c48a2a', youtube: '#a83e66', business: '#3f7a4a', loan: '#a4412a', other: '#3f7a4a',
};
export function CatIcon({ cat, size = 16, color, bg }) {
  const rects = CAT_ICONS[CAT_KIND[cat] || 'other'];
  const c = color || CAT_COLOR[cat] || PAPER.muted;
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {rects.map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={r[4] === 'w' ? (bg || PAPER.card) : c} />)}
    </svg>
  );
}
export function CatBadge({ cat, size = 30 }) {
  const c = CAT_COLOR[cat] || PAPER.muted;
  return (
    <span style={{ width: size, height: size, borderRadius: 8, background: c + '1a', border: `1px solid ${c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <CatIcon cat={cat} size={Math.round(size * 0.55)} bg="#f4efe5" />
    </span>
  );
}

// ---------- Сундук казны: высота стопок монет растёт с балансом ----------
export function TreasuryScene({ balance, night }) {
  useFinanceCss();
  const b = Number(balance) || 0;
  const level = b <= 0 ? 0 : Math.min(6, Math.max(1, Math.floor(Math.log10(Math.max(10, b)) - 2)));
  const stacks = [0, 1, 2, 3, 4, 5].map(i => Math.max(0, level * 3 - i * 2 + (i % 2)));
  return (
    <svg viewBox="0 0 200 82" shapeRendering="crispEdges" role="img" aria-label={`Казна: ${fmtMoney(b)} сум`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="200" height="82" fill={night ? '#3a3046' : '#d8cdb8'} />
      <g fill={night ? '#44384f' : '#d2c6ae'}>{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <rect key={i} x={i * 26 + (i % 2) * 6} y={i % 2 ? 10 : 22} width="20" height="8" />)}</g>
      <rect x="0" y="60" width="200" height="22" fill={night ? '#5a4636' : '#9a7452'} />
      <rect x="0" y="60" width="200" height="2" fill={night ? '#46362a' : '#7c5a3e'} />
      {/* факел */}
      <rect x="16" y="26" width="3" height="12" fill="#5a3826" />
      <rect className="fn-glint" x="14" y="20" width="7" height="6" fill="#f6c24a" /><rect x="16" y="18" width="3" height="4" fill="#ffe9a8" />
      <rect x="181" y="26" width="3" height="12" fill="#5a3826" />
      <rect className="fn-glint" x="179" y="20" width="7" height="6" fill="#f6c24a" style={{ animationDelay: '-.9s' }} /><rect x="181" y="18" width="3" height="4" fill="#ffe9a8" />
      {/* стопки монет слева и справа от сундука */}
      {stacks.map((h, i) => {
        const x = i < 3 ? 34 + i * 12 : 128 + (i - 3) * 12;
        return (
          <g key={i} className={h ? 'fn-coin' : undefined} style={{ animationDelay: `${-i * 0.3}s` }}>
            {Array.from({ length: h }, (_, k) => (
              <g key={k}><rect x={x} y={58 - k * 3} width="10" height="3" fill={k % 2 ? '#c48a2a' : '#e0a83a'} /><rect x={x} y={58 - k * 3} width="10" height="1" fill="#f6d68a" /></g>
            ))}
          </g>
        );
      })}
      {/* сундук */}
      <g transform="translate(76 26)">
        <rect x="0" y="34" width="48" height="3" fill="#000" opacity=".2" />
        <rect x="2" y="16" width="44" height="20" fill="#8a5a3a" />
        <rect x="2" y="16" width="44" height="2" fill="#a06a44" />
        <rect x="2" y="26" width="44" height="2" fill="#c48a2a" /><rect x="2" y="34" width="44" height="2" fill="#5a3826" />
        <rect x="2" y="16" width="3" height="20" fill="#c48a2a" /><rect x="43" y="16" width="3" height="20" fill="#c48a2a" />
        {b > 0 && <>
          <rect x="6" y="10" width="36" height="7" fill="#e0a83a" />
          <rect x="8" y="8" width="10" height="3" fill="#f6d68a" /><rect x="22" y="7" width="12" height="4" fill="#e0a83a" /><rect x="34" y="9" width="6" height="2" fill="#f6d68a" />
          <rect className="fn-glint" x="14" y="5" width="2" height="2" fill="#fff6dc" /><rect className="fn-glint" x="31" y="3" width="2" height="2" fill="#fff6dc" style={{ animationDelay: '-.6s' }} />
        </>}
        <g transform={b > 0 ? 'translate(0 -8) rotate(-12 2 16)' : undefined}>
          <rect x="0" y="6" width="48" height="10" fill="#a06a44" />
          <rect x="4" y="4" width="40" height="2" fill="#a06a44" />
          <rect x="0" y="6" width="48" height="1" fill="#c48a2a" /><rect x="0" y="14" width="48" height="2" fill="#c48a2a" />
          <rect x="0" y="6" width="3" height="10" fill="#c48a2a" /><rect x="45" y="6" width="3" height="10" fill="#c48a2a" />
        </g>
        <rect x="20" y="20" width="8" height="8" fill="#e8c48a" /><rect x="23" y="23" width="2" height="3" fill="#5a3826" />
        {b < 0 && <g fill="#e2dbcc" opacity=".9"><rect x="6" y="12" width="1" height="6" /><rect x="4" y="14" width="5" height="1" /><rect x="40" y="10" width="1" height="7" /><rect x="38" y="12" width="5" height="1" /></g>}
      </g>
    </svg>
  );
}

// ---------- Долг-босс ----------
const BOSS_KIND = { debt_credit: 'dragon', debt_micro: 'goblin', debt_installment: 'slime' };
export function DebtBossSprite({ category, defeated, size = 64, hitKey }) {
  useFinanceCss();
  const kind = BOSS_KIND[category] || 'dragon';
  const body = defeated ? '#b9b2a2' : kind === 'goblin' ? '#3f7a4a' : kind === 'slime' ? '#7a5a8a' : '#a4412a';
  const dark = defeated ? '#9a9384' : kind === 'goblin' ? '#2c5a34' : kind === 'slime' ? '#5a3f6a' : '#7a2e1c';
  return (
    <div key={hitKey} className={hitKey ? 'fn-hit' : undefined} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" className={defeated ? undefined : 'fn-idle'} aria-hidden="true" style={{ display: 'block' }}>
        {kind === 'dragon' && <>
          <rect x="2" y="1" width="2" height="3" fill={dark} /><rect x="12" y="1" width="2" height="3" fill={dark} />
          <rect x="3" y="3" width="10" height="8" fill={body} /><rect x="1" y="6" width="2" height="4" fill={dark} /><rect x="13" y="6" width="2" height="4" fill={dark} />
          <rect x="4" y="11" width="8" height="3" fill={body} /><rect x="4" y="14" width="2" height="2" fill={dark} /><rect x="10" y="14" width="2" height="2" fill={dark} />
          <rect x="5" y="9" width="6" height="1" fill="#fbf9f4" /><rect x="6" y="10" width="1" height="1" fill="#fbf9f4" /><rect x="9" y="10" width="1" height="1" fill="#fbf9f4" />
        </>}
        {kind === 'goblin' && <>
          <rect x="1" y="4" width="3" height="2" fill={dark} /><rect x="12" y="4" width="3" height="2" fill={dark} />
          <rect x="4" y="2" width="8" height="8" fill={body} /><rect x="5" y="10" width="6" height="4" fill={dark} />
          <rect x="3" y="11" width="2" height="3" fill={body} /><rect x="11" y="11" width="2" height="3" fill={body} />
          <rect x="6" y="8" width="4" height="1" fill="#1e2230" /><rect x="7" y="12" width="2" height="2" fill="#e0a83a" />
        </>}
        {kind === 'slime' && <>
          <rect x="5" y="3" width="6" height="2" fill={body} /><rect x="3" y="5" width="10" height="3" fill={body} /><rect x="2" y="8" width="12" height="6" fill={body} />
          <rect x="1" y="13" width="14" height="2" fill={dark} /><rect x="4" y="5" width="2" height="2" fill="#ffffff" opacity=".35" />
          <rect x="6" y="11" width="4" height="1" fill="#1e2230" />
        </>}
        {defeated
          ? <><rect x="5" y="6" width="2" height="1" fill="#1e2230" /><rect x="6" y="5" width="1" height="3" fill="#1e2230" /><rect x="9" y="6" width="2" height="1" fill="#1e2230" /><rect x="10" y="5" width="1" height="3" fill="#1e2230" /></>
          : <><rect x="5" y="5" width="2" height="2" fill="#fff3c4" /><rect x="9" y="5" width="2" height="2" fill="#fff3c4" /><rect x="6" y="6" width="1" height="1" fill="#1e2230" /><rect x="10" y="6" width="1" height="1" fill="#1e2230" /></>}
      </svg>
    </div>
  );
}

/** Полоса HP босса из сегментов. */
export function HpBar({ value, max, color = PAPER.terra, segments = 16, height = 10 }) {
  const filled = max > 0 ? Math.ceil((segments * Math.max(0, value)) / max) : 0;
  return (
    <div style={{ display: 'flex', gap: 2 }} aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} style={{ flex: 1, height, borderRadius: 1, background: i < filled ? color : '#e6e0d3', boxShadow: i < filled ? 'inset 0 -2px 0 rgba(0,0,0,.18)' : 'none' }} />
      ))}
    </div>
  );
}

/** Всплывающее число урона над боссом. */
export function DamagePop({ amount, k }) {
  if (!amount) return null;
  return <span key={k} className="fn-dmg lrpg-num" style={{ position: 'absolute', left: '50%', top: 0, fontSize: 18, fontWeight: 900, whiteSpace: "nowrap", color: PAPER.terra, textShadow: '0 2px 0 #fbf9f4', pointerEvents: 'none' }}>−{fmtMoney(amount, true)}</span>;
}

// ---------- Копилка-банка ----------
export function PiggyJar({ pct, color = PAPER.teal, size = 56, done }) {
  const p = Math.max(0, Math.min(1, pct || 0));
  const fillH = Math.round(14 * p);
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 16 18" shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="4" y="0" width="8" height="2" fill="#8a5a3a" /><rect x="3" y="2" width="10" height="1" fill="#a06a44" />
      <rect x="1" y="3" width="14" height="15" fill="#e8eef0" /><rect x="0" y="5" width="1" height="11" fill="#c9d4d8" /><rect x="15" y="5" width="1" height="11" fill="#c9d4d8" />
      <rect x="2" y={17 - fillH} width="12" height={fillH} fill={color} />
      {fillH > 1 && <rect className="fn-wave" x="2" y={17 - fillH} width="12" height="1" fill="#ffffff" opacity=".35" />}
      {p > 0.15 && <><rect x="5" y={Math.max(4, 16 - fillH)} width="2" height="2" fill="#e0a83a" /><rect x="9" y={Math.max(5, 17 - fillH + 2)} width="2" height="2" fill="#f6d68a" /></>}
      <rect x="2" y="4" width="1" height="8" fill="#ffffff" opacity=".7" />
      {done && <rect className="fn-glint" x="12" y="1" width="2" height="2" fill="#fff3c4" />}
    </svg>
  );
}

/** Столбики трат за 7 дней (пиксельные). data: [{ label, sum }] */
export function WeekBars({ data, color = PAPER.terra, height = 64 }) {
  const max = Math.max(1, ...data.map(d => d.sum));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: height + 16 }}>
      {data.map((d, i) => {
        const h = d.sum > 0 ? Math.max(4, Math.round((d.sum / max) * height)) : 2;
        const last = i === data.length - 1;
        return (
          <div key={d.key || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div title={fmtMoney(d.sum)} style={{ width: '100%', height: h, background: d.sum > 0 ? (last ? color : color + 'aa') : '#e6e0d3', borderRadius: 2, boxShadow: d.sum > 0 ? 'inset 0 -3px 0 rgba(0,0,0,.15)' : 'none' }} />
            <span className="lrpg-mono" style={{ fontSize: 7.5, color: last ? PAPER.ink : PAPER.muted }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Оценка финансового здоровья буквой S…D. */
export function GradeBadge({ score, size = 54 }) {
  const g = score >= 85 ? ['S', PAPER.mustard] : score >= 70 ? ['A', PAPER.green] : score >= 55 ? ['B', PAPER.teal] : score >= 40 ? ['C', '#b0761c'] : ['D', PAPER.terra];
  return (
    <div aria-label={`Оценка ${g[0]}`} style={{ width: size, height: size, borderRadius: 12, background: g[1], color: '#fbf9f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,.18), 0 2px 0 rgba(0,0,0,.1)', flexShrink: 0 }}>
      <span className="lrpg-display" style={{ fontSize: size * 0.5, fontWeight: 800, lineHeight: 1 }}>{g[0]}</span>
      <span className="lrpg-num" style={{ fontSize: 9, fontWeight: 700, opacity: .9 }}>{Math.round(score)}</span>
    </div>
  );
}

/**
 * Быстрый ввод операции (нижний лист). mode: 'expense' | 'income' | 'order'.
 * onSubmit({ mode, amount, category, title, date }).
 */
export function QuickEntrySheet({ mode: initialMode, expenseCats, incomeCats, recentCats = [], commissionPct = 9, onSubmit, onClose, showOrder }) {
  useFinanceCss();
  const [mode, setMode] = useState(initialMode || 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [yesterday, setYesterday] = useState(false);
  useEffect(() => { setCategory(null); }, [mode]);
  const cats = mode === 'income' ? incomeCats : expenseCats;
  const ordered = mode === 'expense' ? [...recentCats.map(k => cats.find(c => c.key === k)).filter(Boolean), ...cats.filter(c => !recentCats.includes(c.key))] : cats;
  const amt = Number(String(amount).replace(/\s/g, '')) || 0;
  const cat = category || (mode === 'income' ? 'salary' : null);
  const ok = amt > 0 && (mode === 'order' || cat);
  const quick = mode === 'order' ? [15000, 20000, 30000, 50000] : [10000, 25000, 50000, 100000];
  const net = mode === 'order' ? amt - Math.round((amt * commissionPct) / 100) : 0;
  const submit = () => {
    if (!ok) return;
    const d = new Date(); if (yesterday) d.setDate(d.getDate() - 1);
    onSubmit({ mode, amount: amt, category: cat, title: title.trim(), date: d.toISOString().slice(0, 10) });
  };
  const tabs = [{ k: 'expense', l: 'Расход', c: PAPER.terra }, { k: 'income', l: 'Доход', c: PAPER.green }, ...(showOrder ? [{ k: 'order', l: 'Заказ', c: PAPER.mustard }] : [])];
  const accent = tabs.find(t => t.k === mode).c;
  const view = (
    <div role="dialog" aria-label="Новая операция" className="fn-fade" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 215, background: 'rgba(30,34,48,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
      <div className="fn-sheet" onClick={e => e.stopPropagation()} style={{ width: 'min(480px, 100%)', maxHeight: '88vh', overflowY: 'auto', background: PAPER.bg, borderRadius: '18px 18px 0 0', padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))', color: PAPER.ink }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: PAPER.line2, margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', gap: 6, background: PAPER.alt, borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.k} className="lrpg-btn" onClick={() => setMode(t.k)} aria-pressed={mode === t.k} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: mode === t.k ? t.c : 'transparent', color: mode === t.k ? '#fbf9f4' : PAPER.muted, border: 'none' }}>{t.l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14, borderBottom: `2px solid ${accent}`, paddingBottom: 4 }}>
          <span className="lrpg-num" style={{ fontSize: 26, fontWeight: 800, color: accent }}>{mode === 'income' || mode === 'order' ? '+' : '−'}</span>
          <input autoFocus inputMode="numeric" aria-label="Сумма" placeholder="0" value={amount ? Number(amt).toLocaleString('ru-RU') : ''}
            onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="lrpg-num" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 34, fontWeight: 800, color: PAPER.ink, fontFamily: 'inherit' }} />
          <span style={{ fontSize: 14, color: PAPER.muted }}>сум</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {quick.map(q => (
            <button key={q} className="lrpg-btn" onClick={() => setAmount(String(amt + q))} style={{ flex: 1, padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: PAPER.card, border: `1px solid ${PAPER.line}`, color: PAPER.ink }}>+{fmtMoney(q, true)}</button>
          ))}
        </div>
        {mode === 'order' ? (
          <div style={{ marginTop: 12, background: PAPER.card, border: `1px solid ${PAPER.line}`, borderRadius: 12, padding: '10px 12px', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: PAPER.muted }}>Комиссия парка {commissionPct}%</span><span>−{fmtMoney(amt - net)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 4 }}><span>На руки</span><span style={{ color: PAPER.green }}>+{fmtMoney(net)}</span></div>
          </div>
        ) : (
          <>
            <div className="lrpg-mono" style={{ fontSize: 8.5, color: PAPER.muted, margin: '14px 0 6px' }}>{mode === 'income' ? 'Откуда' : 'На что'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
              {ordered.map(c => {
                const on = cat === c.key;
                const col = CAT_COLOR[c.key] || PAPER.muted;
                return (
                  <button key={c.key} className="lrpg-btn" onClick={() => setCategory(c.key)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 2px', borderRadius: 10, fontFamily: 'inherit', background: on ? col + '22' : PAPER.card, border: `1.5px solid ${on ? col : PAPER.line}`, color: PAPER.ink }}>
                    <CatIcon cat={c.key} size={18} />
                    <span style={{ fontSize: 10.5, fontWeight: 600, lineHeight: 1.1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
            <input className="lrpg-input" placeholder="Комментарий (необязательно)" value={title} onChange={e => setTitle(e.target.value)} style={{ marginTop: 10 }} />
          </>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {[['Сегодня', false], ['Вчера', true]].map(([l, v]) => (
            <button key={l} className="lrpg-btn" onClick={() => setYesterday(v)} aria-pressed={yesterday === v} style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: yesterday === v ? PAPER.ink : PAPER.card, color: yesterday === v ? PAPER.bg : PAPER.ink, border: `1px solid ${yesterday === v ? PAPER.ink : PAPER.line}` }}>{l}</button>
          ))}
        </div>
        <button className="lrpg-btn" disabled={!ok} onClick={submit} style={{ marginTop: 14, width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 16, fontWeight: 800, fontFamily: 'inherit', background: ok ? accent : PAPER.line2, color: '#fbf9f4', border: 'none', boxShadow: ok ? '0 3px 0 rgba(0,0,0,.2)' : 'none' }}>
          {mode === 'order' ? 'Записать заказ' : mode === 'income' ? 'Положить в казну' : 'Записать расход'}
        </button>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(view, document.body) : view;
}
