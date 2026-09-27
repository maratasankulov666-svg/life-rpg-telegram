// LIFE RPG — changelog
// 1.0  Core loop: Character, Level/XP, Coins, Quests, Stats, Goals, Reward Shop, Chronicle
// 2.0  Habits (streaks + evolution), Achievements, World Map (territories), Consistency, Recovery Mode
// 3.0  Finance: Income/Expenses/Budget, Debts as Bosses (Avalanche/Snowball/Cash Flow), Savings Goals
// 4.0  Titles (from Achievements), AI Mentor (rule-based advice), navigation regrouped into 6 tabs
// 5.0  Home status strip, Energy from daily check-in (sleep/breakfast/coffee/water), correct annuity math, Taxi tracker
// 6.0  Garage (car profile with photo, expenses, taxi P&L), manual steps in check-in, Life Events (quick stat +/-), Settings
// 6.1  Real AI Mentor chat (Claude API, grounded in live character data, rule-based fallback offline),
//      AI Goal Engine (big goal -> auto-generated quest chain, rule-based fallback), Body & Calories + evolving avatar
// 7.0  AI call reliability: automatic retry with backoff + manual "Retry" button instead of silently going offline,
//      visible diagnostic error text, higher-quality rule-based Goal Engine fallback, Stats "why it changed" drill-down
// 8.0  Character photo on Home, Recovery Mode now actually protects streaks, Random Events, Inventory & Equipment
//      (items grow with your stats), Consistency history (7/30/90/all-time), Absence-from-App soft return,
//      AI Mentor got a named RPG persona, AI Goal Reality Check (3 scenarios: aggressive/realistic/safe)
// 9.0  Cross-sphere quest effects (secondary stat + explanation), Goal Conflict detection + Available Time,
//      Chronicle history editing (add past entries, edit/delete with an "edited" mark), Equipment Set bonuses,
//      Personality Traits (derived from real usage patterns)
// 9.1  Bugfixes: starting stats no longer auto-unlock Equipment Sets/instant level-up, storage status is now visible
//      instead of silently failing, AI errors distinguish "your Claude usage limit" from other failures,
//      goal progress uses a safer commit-on-release control instead of a live-drag slider, economy rebalanced
//      (lower coin-per-XP, higher shop prices), more Life Events + custom event creation, avatar redesigned with
//      genuinely different body silhouettes per tier + a target-weight preview
// 10.0 Export/Import save (platform storage isn't guaranteed for this artifact type — manual save is now the
//      reliable path), Anti-farm (diminishing returns on repeated near-identical quests same day),
//      Abandoned Goal detection (no progress in 14+ days -> Resume/Extend/Reduce/Abandon), Quest Evolution
//      (an Easy quest type you keep crushing gets nudged up, a Hard one you keep skipping gets nudged down)
// 11.0 Boss Task (quest with its own HP bar), Level-Up Unlocks (Boss Tasks gate at lvl5, more at lvl10/15/20),
//      real recharts graphs (weight, taxi income, stat history), AI Weekly Recap, Habit library (quick-pick
//      templates), search/filter in Chronicle and Quests, first-run onboarding from Master Kaylen, export
//      reminder, Difficulty Mode (Easy/Normal/Hardcore — scoped to anti-farm curve and skip penalties)
// 12.1 Save/load reliability fix: storage.get/set now time out after 8s instead of hanging forever
//      ("Сохраняю..." stuck button), and every save is mirrored to a local backup that's used
//      automatically if the main storage is empty/unavailable on load — so progress survives
//      updates/redeploys even if the platform storage resets.
// 12.2 Softer status UI: when cloud storage fails but the local backup succeeded, the banner/status
//      now says so calmly instead of showing a scary "progress may be lost" error, since the data
//      is actually safe on-device in that case.
// 12.3 Telegram-client diagnostics card in Settings (client version/platform/initData/CloudStorage
//      support), fed by telegramStorage.js's version guard that skips CloudStorage entirely (straight
//      to local fallback) on clients too old to support it, instead of stalling for 6-8s every save.
// 12.4 Realized the 8s save timeout was the actual bug on well-supported clients: a full save is many
//      sequential CloudStorage round-trips (one per ~4KB chunk), which legitimately takes longer than
//      8s on real networks. Raised timeouts (8s->25s outer, 6s->12s per chunk, bigger chunk size), and
//      diagnostics now show live chunk count / size / duration of the last save attempt.
// 12.5 Real root cause found: full state was 248KB (finance.transactions + taxi.orders grow forever,
//      unlike chronicle/coinTransactions which are capped at 300) -> 64 sequential chunk writes per
//      save, inherently unreliable. Per user's choice, kept full history and added gzip compression
//      (CompressionStream, with automatic fallback to uncompressed on unsupported clients and full
//      backward-compat reading of old uncompressed saves) before chunking, cutting chunk count a lot
//      without deleting any transaction/order history.
// 12.6 Gzip barely helped (248740 -> 239032, ~4%): the bulk of the JSON is high-entropy unique ids/
//      timestamps in transactions/orders, which don't compress. Per user's choice, split persistence:
//      Telegram CloudStorage now only syncs the "core" state (buildCloudPayload — everything except
//      finance.transactions/taxi.orders/debt payment history), which should be a handful of chunks
//      instead of 60+. The FULL state (all financial history included) still lives in the on-device
//      local backup and in Export, unchanged. On load, the local backup wins when present (it's the
//      complete copy); cloud is only the fallback for a fresh device with no local backup, and in
//      that case financial history has to come back via Import.
// 13.0 Feature request batch: (1) Calendar tab under Progress — days-played counter, current streak,
//      days-since-first-open, and a month grid marking which days the game was opened (state.playLog/
//      firstOpenedAt). (2) Debts reworked: loanType is now 'annuity' | 'differentiated' | 'simple'.
//      Adding a loan now takes the ORIGINAL amount/rate/term plus "months already paid", and correctly
//      recomputes the current remaining balance from the amortization schedule instead of treating it
//      as a fresh loan. Differentiated loans get their own schedule (buildDifferentiatedSchedule,
//      fixed principal + shrinking interest -> decreasing payment) with a recharts line chart of
//      balance/payment. Simple debts (owed to a friend, credit-card balance) now just take an amount
//      and a due date, no monthly-payment field. New ObligationsSummaryCard shows this month's loan
//      payments and simple-debt due dates together. (3) Budget plan is now per-month
//      (finance.budgetPlanByMonth), with a "this month / next month" toggle, so a plan can be set up
//      for next month in advance (old flat budgetPlan auto-migrates into the current month on load).
// 13.1 Two fixes: (1) Coin history in the Coin Wallet card now shows source label + full date/time for
//      the last 60 operations (was: title only, last 15, no source) — should make it clear where/why
//      every coin was earned or spent. (2) Adding a debt/loan no longer leaves cashBalance untouched:
//      addDebt now optionally records the loan amount as an income transaction (checkbox, defaulting
//      to on for brand-new debts, off when "months already paid" > 0 since that money isn't arriving
//      today) so taking a loan and then spending it doesn't drive the balance artificially negative.
//      deleteDebt reverses that mirrored transaction. Added a compact "У меня есть / Всего
//      обязательств / Баланс минус долги" row above the debts list for a clear at-a-glance split
//      between cash on hand and total liabilities.
// 13.2 Fixed real bug: <Card> never forwarded onClick to its div, so tapping the Coin Wallet card in
//      Shop did nothing at all (dead click, not just a display issue) — Card now takes an onClick prop.
//      Also removed the easy-to-miss checkbox for "add loan to balance": a brand-new loan/debt
//      (0 months already paid) now ALWAYS auto-adds to cashBalance, no opt-in needed; the checkbox
//      only remains for simple debts, where recording an old pre-existing debt vs. a fresh borrow is
//      genuinely ambiguous. Added an income-by-source breakdown (work/taxi/loan/etc, this month) under
//      Cash Balance, and an "Обязательства за этот месяц" card (new debt taken vs. principal repaid,
//      net change) so it's clear whether total debt is growing or shrinking, not just its current sum.
// 13.3 YouTube: отдельная вкладка с каналами (подписчики/просмотры/видео, история, график), ручной ввод или авто-синхронизация
//      через /api/youtube, квесты «+N подписчиков/просмотров/видео» с автозакрытием при достижении цели.
// 13.4  UI переделка главного экрана: полноэкранная игровая сцена (комната + герой в полный рост,
//       силуэт меняется от роста/веса из Параметров), TopHUD (Lv/HP/Energy/XP слева, монеты и время справа),
//       выезжающее левое игровое меню и правая панель «Параметры», «Цель на сегодня» поверх сцены,
//       низ переоформлен под игровой HUD. Вся остальная логика и вкладки не тронуты.
// 13.5  Home полностью переделан под фикс. RPG HUD без вертикального скролла (100dvh, overflow hidden):
//       GameShell на весь экран, статичная левая рельса-меню (не drawer), центр сцены с персонажем,
//       правая колонка «Параметры» (read-only + карандаш) и «Цель на сегодня», нижний игровой нав
//       из 6 кнопок без overflow-x. Редактирование имени/фото/титула, роста/веса/пола, Energy-чекина
//       вынесено в модалки поверх сцены — функциональность не потеряна, просто не занимает layout.
//       Остальные вкладки (Действия/Цели/Финансы/Гараж/YouTube/Прогресс/Ещё) и вся логика не тронуты.
// 13.6  Реальный арт вместо плейсхолдеров: 8 спрайтов телосложения (Очень худой -> Очень плотный,
//       подбираются по реальному BMI из Роста/Веса) и фон спальни на Home-сцене. Полная RPG HUD
//       дизайн-система: CSS-токены (--gold/--violet/...), фрейм с уголками-скобками (.lrpg-frame) на
//       топ-баре, левом меню, правой колонке, нижнем нав-баре и модалках, сегментированные гейджи
//       HP/Energy/XP с числовыми значениями, рамка сцены с 4 угловыми засечками и ночной виньеткой.
// 13.7  Честная доработка после сравнения со скриншотом-референсом: (1) фон комнаты теперь
//       занимает весь экран Home (а не только центральную колонку) — персонаж и HUD-панели стоят
//       прямо на нём, как в референсе, а не в отдельной рамке-боксе. (2) Спрайты персонажа
//       пересобраны крупнее (420px, WebP) с растворяющимися краями (feather), чтобы не было видно
//       прямоугольного шва на фоне окна. (3) Исходное фото комнаты обрезано от лишнего потолка —
//       теперь видно пол/ковёр, на котором стоят ноги. (4) Панели HUD переведены с "плавающих"
//       золотых скобок по углам на срезанные (chamfered) углы с тонкой обводкой — надёжнее и ближе
//       к референсу, чем прошлая попытка. (5) HP/Energy/XP теперь показывают числа "значение/макс".
import React, { useState, useEffect, useRef } from 'react';
import {
  Home as HomeIcon, Sword, Target, Activity, ScrollText,
  Dumbbell, ShieldCheck, BookOpen, Crosshair, Wallet, Briefcase,
  Sparkles, Users, Brain, Coins as CoinsIcon, Zap, Plus, ChevronUp,
  ChevronDown, Check, Clock, X, Trash2, Pencil, Flame, Trophy, Map as MapIcon,
  HeartPulse, TrendingDown, PiggyBank, Skull, MessageCircle, Moon, Coffee,
  Droplet, Croissant, Car, ChevronRight, Camera, Fuel, Wrench, AlertTriangle,
  Gauge, Wine, Pizza, Cigarette, HeartHandshake, Settings as SettingsIcon,
  RotateCcw, Send, Wand2, Scale, Ruler, Shirt, Footprints, Gem,
  Backpack, HandMetal, Package, Compass, Sunrise, Sunset, Layers, CalendarClock,
  Utensils, BedDouble, Smartphone, BookMarked, Save, AlertCircle,
  Download, Upload, Copy, ClipboardPaste, TrendingUp as TrendingUpIcon, PauseCircle,
  Swords, Search, BarChart3, Youtube, User,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// 14.0  Архитектура навигации: 5 разделов Home / Действия / Цели / Прогресс / Профиль.
//      Финансы, Гараж, YouTube, Магазин, Инвентарь, Настройки убраны из нижнего меню
//      и живут внутри Профиля (Моя жизнь / Моё / Система). Home остаётся эталоном UI.
//      Старые вкладки не удалены — перенесены внутрь новой карты.
// 14.2  Home как референс: сцена на весь экран, панели поверх, персонаж меньше в центре.
// 14.1  Home visual: новый фон комнаты, полный рост персонажа (чёрное худи), левое меню с подписями, меньше виньетки.
// 14.3  Убрана левая панель с Home. Персонаж HQ + ночной цветокор + тень на полу.
// 14.4  UI kit: неон-палитра, кнопки/табы/бары/нижняя навигация по референсу.
// 14.5  Motion/SFX/Haptic: gameFeedback + canvas VFX. YouTube/AI не трогали.
const APP_VERSION = '14.8.1';

const COLORS = {
  bg: '#0B0F14',
  bgCard: '#121826',
  bgCardAlt: '#161D2E',
  border: '#243044',
  borderLight: '#33415C',
  text: '#E8EEF8',
  textMuted: '#8B97AD',
  gold: '#F6C445',
  goldSoft: 'rgba(246,196,69,0.16)',
  teal: '#00E5FF',
  tealSoft: 'rgba(0,229,255,0.16)',
  crimson: '#FF6B6B',
  crimsonSoft: 'rgba(255,107,107,0.16)',
  violet: '#6C63FF',
  violetSoft: 'rgba(108,99,255,0.18)',
  orange: '#FF8A4C',
  orangeSoft: 'rgba(255,138,76,0.16)',
  green: '#4ADE80',
};

// ===================== FEEDBACK SYSTEM (motion / sfx / haptic / vfx) =====================
const FEEDBACK_STORAGE = 'liferpg_feedback_v1';
function loadFeedbackPrefs() {
  try { return { sfxOn: true, volume: 0.7, batterySaver: false, ...JSON.parse(localStorage.getItem(FEEDBACK_STORAGE) || '{}') }; }
  catch { return { sfxOn: true, volume: 0.7, batterySaver: false }; }
}
let FEEDBACK_PREFS = loadFeedbackPrefs();
function saveFeedbackPrefs(p) {
  FEEDBACK_PREFS = { ...FEEDBACK_PREFS, ...p };
  try { localStorage.setItem(FEEDBACK_STORAGE, JSON.stringify(FEEDBACK_PREFS)); } catch {}
}

const FeedbackBus = {
  listeners: new Set(),
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(event) { this.listeners.forEach(fn => { try { fn(event); } catch {} }); },
};

const HapticManager = {
  fire(kind = 'light') {
    try {
      const tg = window.Telegram?.WebApp?.HapticFeedback;
      if (tg) {
        if (kind === 'success') tg.notificationOccurred('success');
        else if (kind === 'error') tg.notificationOccurred('error');
        else if (kind === 'heavy' || kind === 'medium') tg.impactOccurred(kind === 'heavy' ? 'heavy' : 'medium');
        else tg.impactOccurred('light');
        return;
      }
      if (navigator.vibrate) {
        const map = { light: 8, medium: 18, heavy: 32, success: [10, 40, 18], error: [30, 40, 30], legendary: [20, 40, 20, 40, 40] };
        navigator.vibrate(map[kind] || 8);
      }
    } catch {}
  },
};

const SoundManager = {
  ctx: null,
  master: null,
  unlocked: false,
  unlocking: false,
  _bound: false,
  ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = FEEDBACK_PREFS.volume;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.bindUnlock();
    return ctx;
  },
  bindUnlock() {
    if (this._bound || typeof window === 'undefined') return;
    this._bound = true;
    const kick = () => { this.unlock(); };
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(ev => {
      window.addEventListener(ev, kick, { passive: true });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.unlock(); });
    window.addEventListener('pageshow', () => this.unlock());
  },
  async unlock() {
    const ctx = this.ensure();
    if (!ctx || this.unlocking) return ctx;
    this.unlocking = true;
    try {
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') await ctx.resume();
      if (!this.unlocked && ctx.state === 'running') {
        const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.master);
        src.start(0);
        this.unlocked = true;
      }
    } catch (e) {}
    this.unlocking = false;
    return ctx;
  },
  setVolume(v) {
    const vol = Math.max(0, Math.min(1, v));
    saveFeedbackPrefs({ volume: vol });
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
  },
  mute() { saveFeedbackPrefs({ sfxOn: false }); if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02); },
  unmute() { saveFeedbackPrefs({ sfxOn: true }); this.unlock(); if (this.master && this.ctx) this.master.gain.setTargetAtTime(FEEDBACK_PREFS.volume, this.ctx.currentTime, 0.02); },
  playSound(name) {
    if (!FEEDBACK_PREFS.sfxOn) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      this.unlock().then(() => { if (this.ctx && this.ctx.state === 'running') this._emit(name); });
      return;
    }
    this._emit(name);
  },
  _emit(name) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.18;
    const beep = (freq, dur, type = 'sine', gain = 1, delay = 0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, now + delay);
      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.exponentialRampToValueAtTime(vol * gain, now + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      o.connect(g); g.connect(this.master || ctx.destination);
      o.start(now + delay); o.stop(now + delay + dur + 0.02);
    };
    const table = {
      ui_click: () => beep(420, 0.05, 'triangle', 0.6),
      ui_back: () => beep(280, 0.06, 'triangle', 0.5),
      ui_open: () => { beep(360, 0.06, 'sine', 0.5); beep(520, 0.07, 'sine', 0.4, 0.05); },
      ui_close: () => { beep(520, 0.05, 'sine', 0.4); beep(320, 0.07, 'sine', 0.35, 0.05); },
      success: () => { beep(520, 0.08, 'sine', 0.7); beep(780, 0.12, 'sine', 0.55, 0.07); },
      error: () => beep(170, 0.16, 'square', 0.45),
      locked: () => beep(140, 0.12, 'square', 0.35),
      xp_gain: () => { beep(660, 0.07, 'sine', 0.55); beep(880, 0.1, 'sine', 0.4, 0.06); },
      quest_complete: () => { beep(480, 0.08, 'triangle', 0.6); beep(720, 0.1, 'sine', 0.5, 0.08); beep(960, 0.12, 'sine', 0.4, 0.16); },
      coin_gain: () => { beep(880, 0.05, 'square', 0.28); beep(1170, 0.08, 'square', 0.22, 0.05); },
      purchase: () => { beep(400, 0.06, 'triangle', 0.45); beep(600, 0.1, 'sine', 0.4, 0.06); },
      achievement: () => { beep(392, 0.1, 'sine', 0.5); beep(523, 0.12, 'sine', 0.5, 0.1); beep(659, 0.16, 'sine', 0.55, 0.2); },
      level_up: () => { beep(330, 0.1, 'sawtooth', 0.28); beep(440, 0.12, 'sine', 0.45, 0.1); beep(660, 0.16, 'sine', 0.5, 0.22); beep(880, 0.2, 'sine', 0.4, 0.36); },
      item_common: () => beep(500, 0.08, 'sine', 0.35),
      item_rare: () => { beep(500, 0.08, 'sine', 0.4); beep(750, 0.1, 'sine', 0.35, 0.07); },
      item_epic: () => { beep(420, 0.1, 'triangle', 0.4); beep(640, 0.12, 'sine', 0.4, 0.08); beep(860, 0.14, 'sine', 0.35, 0.16); },
      item_legendary: () => { beep(300, 0.12, 'sawtooth', 0.22); beep(500, 0.14, 'sine', 0.4, 0.1); beep(800, 0.18, 'sine', 0.4, 0.24); },
    };
    (table[name] || table.ui_click)();
  },
};

const EVENT_MAP = {
  BUTTON_PRESS: { sound: 'ui_click', haptic: 'light' },
  MENU_OPEN: { sound: 'ui_open', haptic: 'light' },
  MENU_CLOSE: { sound: 'ui_close', haptic: 'light' },
  QUEST_COMPLETE: { sound: 'quest_complete', haptic: 'medium', vfx: 'quest' },
  XP_GAIN: { sound: 'xp_gain', haptic: 'light', vfx: 'xp' },
  COIN_GAIN: { sound: 'coin_gain', haptic: 'light', vfx: 'coins' },
  LEVEL_UP: { sound: 'level_up', haptic: 'success', vfx: 'level' },
  ACHIEVEMENT_UNLOCK: { sound: 'achievement', haptic: 'success', vfx: 'achieve' },
  ITEM_UNLOCK: { sound: 'item_rare', haptic: 'medium', vfx: 'item' },
  ERROR: { sound: 'error', haptic: 'error', vfx: 'error' },
  LOCKED: { sound: 'locked', haptic: 'light', vfx: 'error' },
  PURCHASE: { sound: 'purchase', haptic: 'medium', vfx: 'coins' },
};

function gameFeedback(type, payload = {}) {
  const cfg = EVENT_MAP[type] || EVENT_MAP.BUTTON_PRESS;
  SoundManager.playSound(cfg.sound);
  HapticManager.fire(cfg.haptic);
  FeedbackBus.emit({ type, vfx: cfg.vfx, payload, at: Date.now() });
}

function FeedbackLayer() {
  const [toasts, setToasts] = useState([]);
  const [flash, setFlash] = useState(null);
  const canvasRef = useRef(null);
  const parts = useRef([]);
  const raf = useRef(0);

  useEffect(() => { SoundManager.ensure(); SoundManager.unlock(); }, []);
  useEffect(() => {
    const un = FeedbackBus.on(ev => {
      if (ev.vfx === 'error') setFlash({ c: 'rgba(255,80,80,0.18)', id: ev.at });
      if (ev.vfx === 'level') setFlash({ c: 'rgba(108,99,255,0.22)', id: ev.at });
      if (ev.vfx === 'achieve') setFlash({ c: 'rgba(246,196,69,0.16)', id: ev.at });
      const label = ev.type === 'QUEST_COMPLETE' ? `+${ev.payload.xp || 0} XP`
        : ev.type === 'XP_GAIN' ? `+${ev.payload.xp || 0} XP`
        : ev.type === 'COIN_GAIN' ? `+${ev.payload.coins || 0}`
        : ev.type === 'LEVEL_UP' ? `LEVEL ${ev.payload.level || ''} UP`
        : ev.type === 'ACHIEVEMENT_UNLOCK' ? (ev.payload.title || 'Достижение')
        : null;
      if (label) setToasts(t => [...t.slice(-4), { id: ev.at + Math.random(), label, kind: ev.vfx }]);
      const n = FEEDBACK_PREFS.batterySaver ? 8 : (ev.vfx === 'level' ? 36 : ev.vfx === 'quest' ? 22 : 14);
      const col = ev.vfx === 'coins' ? '#F6C445' : ev.vfx === 'level' ? '#C7C4FF' : ev.vfx === 'error' ? '#FF6B6B' : '#00E5FF';
      const cx = window.innerWidth / 2, cy = window.innerHeight * 0.42;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.8 + Math.random() * 2.4;
        parts.current.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.2, life: 1, size: 1.5 + Math.random() * 2.5, col });
      }
    });
    const tick = () => {
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (c.width !== window.innerWidth || c.height !== window.innerHeight) {
          c.width = window.innerWidth; c.height = window.innerHeight;
        }
        ctx.clearRect(0, 0, c.width, c.height);
        parts.current = parts.current.filter(p => p.life > 0);
        parts.current.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= 0.018;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { un(); cancelAnimationFrame(raf.current); };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 280);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts(s => s.slice(1)), 900);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 80 }} />
      {flash && <div style={{ position: 'fixed', inset: 0, background: flash.c, pointerEvents: 'none', zIndex: 79 }} />}
      <div style={{ position: 'fixed', left: 0, right: 0, top: '18%', pointerEvents: 'none', zIndex: 81, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: t.kind === 'level' ? 16 : 13, fontWeight: 800,
            color: t.kind === 'coins' ? '#F6C445' : t.kind === 'level' ? '#fff' : '#7CFFC4',
            background: 'rgba(10,14,22,0.55)', border: '1px solid rgba(108,99,255,0.35)',
            animation: 'lrpg-float-up 0.9s ease-out both',
          }}>{t.label}</div>
        ))}
      </div>
    </>
  );
}

function FeedbackSettingsCard() {
  const [sfxOn, setSfxOn] = useState(FEEDBACK_PREFS.sfxOn);
  const [volume, setVolume] = useState(Math.round(FEEDBACK_PREFS.volume * 100));
  const [saver, setSaver] = useState(FEEDBACK_PREFS.batterySaver);
  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Sound Effects</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12 }}>SFX</span>
        <button className="lrpg-btn" onClick={() => { const n = !sfxOn; setSfxOn(n); n ? SoundManager.unmute() : SoundManager.mute(); gameFeedback('BUTTON_PRESS'); }} style={{
          background: sfxOn ? COLORS.violet : COLORS.bgCardAlt, color: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 800,
        }}>{sfxOn ? 'ON' : 'OFF'}</button>
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Громкость {volume}%</div>
      <input type="range" min={0} max={100} value={volume} onChange={e => { const v = Number(e.target.value); setVolume(v); SoundManager.setVolume(v / 100); }} style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 12 }}>Battery saver</span>
        <button className="lrpg-btn" onClick={() => { const n = !saver; setSaver(n); saveFeedbackPrefs({ batterySaver: n }); gameFeedback('BUTTON_PRESS'); }} style={{
          background: saver ? COLORS.teal : COLORS.bgCardAlt, color: saver ? '#042018' : COLORS.textMuted, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 800,
        }}>{saver ? 'ON' : 'OFF'}</button>
      </div>
    </Card>
  );
}


// ===================== АРТ: спрайты персонажа (8 типов телосложения) и фон комнаты =====================
// Сгенерированы отдельно и встроены как data URI — не требуют внешнего хостинга.
// Каждый спрайт — консистентный персонаж (тот же дизайн лица/одежды) в one из 8 типов телосложения.
const CHARACTER_SPRITES = {
  "v1_very_slim": "data:image/webp;base64,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",
  "v2_slim": "data:image/webp;base64,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",
  "v3_lean": "data:image/webp;base64,UklGRrR8AABXRUJQVlA4WAoAAAAQAAAABwEAMwMAQUxQSIhMAAABCViS7MZt6r0HK2IA3f/AXAAoy3dE/ycAyasyY5/CowAMALNH+zJpZ08f1AXWjCPU+AlVA6GN1GZUAZtbdTYWy++a0AkrIro4vwoVUpMCMCTNTiQZYMYWFaAgfxJVsBdxLsGG/wF24C3RN9qCba4WkOD2J1lf9DyDCLXwLWgwafISmhmgCWLBfZODt1YGo2WMcF3aAARTdl+Xx8GTW7ofwK1C68UTQI44dxSmHKAD8AhfMEEShssdCKpsJgF43/angKNJH+qEFdDDKmzAE68hySb08S8ABrlhEfkbPF0YZb4ix0O1gPN7Rh/P8DewLfr4nkGSPcuaWOFo9DFxr/TUYQX23QeWMpv40WVaDGW+JACQrliRGZAX4NJlEgAVhLQQXAhAKWnCRAEgU+4TSY5RE7EASark0bwhC0I/beCUpFbjIHgUJVnOAKTck2AUbEMAIKlu+4JjCoNGksLcrn/XDwe0BiJiAjIFey4mSSX/THLy2ioTLW7bJ7HHT3J2kc9xUT1wVlmuHNd1qBZKZsPhHZ8lgSSpRHWn4tF6g8onqBcmeaZ2dCBwAILsVZTWbZEkomQCCNgI2mwBvA2ptq3nyX3fl0RDLybiI5k1MIQEXKACCYwZ9d7r9wTckyFrRUzABHjDtk2xrWbbzququnv4mGPqElwWLguSoEEDQUIcAsFdQkhwElwDAeI4IZBFCO5OcHdbsJzlMn3O4d1dVdePOddcc805utf9694iYgKw4f9nSJKt3/8fEZmFru6aHu1ZPjq2bdu2bXN1fe+xbdu27XPu2piZHjSrMjMi/q/OdFT8+5l4GxEToPKPuhBrcFI5DggcVAGVTCqhaM1MZFO2BAJEtpD0WtcWieZCck2MVHt628uMNOLjE6XT3Ca7Musi07QGBtmUSbTBtj5AfLmj6rqabHut2zbpNS9yXGFc4ZT3uNY5/4D1qzpvDr5rUT2thyMuISGhGZDJNDFc2XWLwDVTdtB03O5/KAMMuNG28XiufDiVAIxQyg4ks2C3FQHVs+f0eDPvuGDTLwvaW1xsJ5OIbZDCqVrabXeVRG3ns7y/Pp93w6IGGI5d0r/fT5oGcslm7Yz//d+33OXKumycFGSi/6ALQ8e0dqCnk7zHEwQDgdS3N38JZ/ybdrqpvhlO6+r/qlRjAq+ZkMqjq5Ba/1GrAECTBICTZ36w7J9w0L39L6478a59XvRv+nPT3IyyFSZhfb0mQonEgok7XTLJTN/GCAYRmIkFMulUC8By9oMXHbzgwyd+/J3+Zbu/bdjQ2m69q8QQYk1Ash2BTGaO2Qo3HEt3nG8kRvmeg//1lx//asZ7l/9OE4Lb89ItD0jPc+Kfl3FKNbsSCLPNTe8fd8YEjDZbCfxp+90BWAEAN+PN+1P51o52JeKezDdXLA+GlkDSdctdJ+38+CZgo0YJgJaEwDHWCQGQg9pb3hF1hfifDH93yqGfJRiQItB1mIPOQOBi9YaksFJjn19+Evc8vFwrG/eoBTcffPiM+hIX7rrp6h+21bAJjOUqbn7i9u8+WXLTcQ9O8+CdO2w0+zeT7NpXYCgTxvwRHz+68OxifTCMd3BbihN/u9tWACxAhLHPLM7fauuTPsg0BW25poSIb3AK3uLt9wn56gTGq5F456tc90WmmjGFvIhvwsvm+nvl3b8kGi8ISQH4uP7y1FsneG5sU1nhmJN/v2xDjGtrCFA73HXYrXUZ0ygja1P2+svH6btO2Bg0jsDUdUDQfNBGR7j1WEaqpT5l03u++Ojl4JqNrcB4fyu7UPT3mzhGXrtOPZl/9vfXHgcwYVwz9T1+3EuFhQmBOM66L9Gy7MyeKfn2Q/x73xHv2nOzIVP8kjZz29I/u1evI0VXAAAWvJDcdIIlzbErb86ePL/sTEEQRq1aQ1M8xzFxi1I5/qbmftNjgMnI+BfP1n3GN7HKmzz/ownqpT2eI40BAj5Mr9hnnSppQDhEsYjaB49tsbq7SRBI6xtPD4q7P70M8LIJNxOLUnL/X29RMx4YDVW/cQKefadFJlwHVmbdGESpwqaDJcotuQq6oUDtyxPc9hYInX0xPeDFovbQun7r0n7ixqKBU2bp6Y/9ye/71YKEikNue/unPeWPC5LQYCXQBODDzGmfOg7isJPP9N+z1rlgNFzGc7PWf/e6vGtKFIu8FtX+zX9ADciK/35yY0t+oBgiDks3lypYeXeV0YAF8OCxrfVynWMOQQiZaypzcOYuSUIjDn2X7jnPqTsVRXGGnKSspXofePmVn11FhAYc4oZ1Xp8Cfft/eoImEWdkvim7XZ+wdzcBWPhKAwLjmY9fWCu5IHF6V5uKMcSL28f3rQ8A93vPnngquPEYcXv7zvc+/+3vdlayFGNAg3nf9mMjnf57+7bcGdSAwNTR+nzzT7xiUSLWcjWUZWiRkj86DGczGpHWmTcqPyj6g4i75LU6E2338r/jqgVozPdXJv35z3mL+JtqCf9z9acnXS03QINeZwNaPqWdKfZwc6bQO7jhxwbgxmTlw+XqIesFIvYM8k2pPnPOrwBCg0KJU+d+nuK4Q6O2RDlMzkXjthDgNNds3OEhEuRvGXIDEzO/k++3gYk7VPcF3r9bJBrZ7J28eoWMiDmgrqLzxgAaeV188LNa02A658Yc+M783bJMDQzAc7d+ufWb6+dlvLEy97dvXgjQwO9J/AJ4a9d/5FpErKFetrll+6P8xsW0zdIjQrPBMmsyFGvQw2v29H2dBob9vhoEiANGzOXwf0f8yCVuWMDyrZP9JGz8ge8uVxU0bMb8uZvkebDkI/6KwcMWlRqXwZkvfFxZz0EcJtOS7mhcsHyz/WW6JQYRRNM/6ezbqVFJcUV779GpdhV/ZDrtu3dOIoTGNiS6Jjf4D0zMxSCvgy45iN2t1iq/D9NwDKZdfOa5U7yBRJJiDyXTe337gv+0d//gzTnv2kbD8puL1gq3WiE5EIi/Kv/Kd1ItZsJPZ7y0VSe4sYDlH748/tJTB9odxGCihFM3dOBjm//jH/OowZBdd6Ob3jqhemWyjWLQsORutMFT+10/n2xjAbjY0jbt2RObWlVcgsxUzvrLlYsFGi3JIL/9Hb3ZlIhNaC7+/q5igMXgxgKkbtjS0UYgNov0Oldu/Ht8dB10Y+EVP3/hvzAG8dlJT/3zDeh6gzDUGiijGgJtfte9zS7is1Rpb8KtL3/9xpHQQxomi8E/5VRZxCdKZxNLfnvaI/zyIcoCRr7xt8Jlt15pxbgDLalfMdcgNpPIr+Vvc8IvRXvh337dsgy33+ze+vGMcU9o2+P9FWmOTxDpvJAoFkvG/9/dgphUKnX4etQAyKmf25VGnJauQ74ZtL2HH3javC4rH72syXwIHndQ31//hawTq1bK8Oz7B9Ykdbhy0TGw447ly8+0KDeGEYQnXl9wo11+S2Hw6luYx5sW7+02wVMqhjGFNPPete5G73Mt9OPdMN61/NBbu25djmHkcvvgl5QXntCm34w7I6fvWOuDiWOuSlTnepqDmfStjkCON2Ou9s5ULELE8FRhcn8voem575euf/Sv6/P4suLTfX7/9q5oQgwnt9BU9XvyTZ/vVK/a809zxhdYZNxNd/CaKIZBeJ6tmmzTT17rysueFRjfZHOFOz5O5zzEciILuK06o5UJv3ePGVcw9M6AqEgRz4YlL6kt5dPJd2HHF6YvljWLWE9gmStg7UGY8UTOl5UC1gDdQra496Ax42jg81m9k2kNAInmtvX3rxk7XhjfHL/ZVi3tScdRIuZJpXosJySYkwNQm7HdNZevVWcLGAaYQl9bsjEMhKpPrCAoWFjxycfy4slBX5arBACBttayDEJt4hbAsFALZi6/0DgAdfYCwZbAIGh1zvSAmRZVQI6vfROvALDbeeouC08kOYzy5Z8mlnzk6iYd1IJ45YY/PPjrY++CANphBDD3llR4R80mE4OxSrZQYu47kQAwvGY4AB4ccP/zv7WzxPFJNHc/tHFfVxJSq0EOsHDueZWcE5+QcLe9bm0loAzVYAddZ8zq8MAxiVw5r3bqkBBblnsuPX6wQHFIqpSzcMm2m4ydkQQEsFZTNyEn/lAq6SyoX9m+Cc7NCbTy99mv4sUdcnLJ+uI/b4e/XbHPkRNUIFuER7FGpVxJ1ePPuurJO/e+fcmSYDt84dRQxhiZ9cJ8+pXSXTu/uuNmE4E/v7CI18lbxNdMHpnWaeu/dME+jwOApQ4B51DJuJJoKoe5/+zz2jbn7PAzAEwC6JSWbjyhpmDeme17LXxx49YHoSWB0OjrnKA44rTOO/Qw4BRc8kOElEDjl/h9MyGGus1zfnIAzlz60loIlYsoJOzisBM/ZGbgp4dWzvzf9wHrISrNujIROyhdE3fi7mmAJYmoZHkfp2KH65qDwScDEIhS4wk3bmTD9DmAhUC0yozw4kaeesJ2CESuESJuyIGbWywheiViJ+mNJCKYyxQ7QDVEsbMdROyAiSCymT8szFPcsK0RBDL5I5YXYobJ/a5CHD1i4u2Hhal4Eah3AkL0kp/ctpZ14oWxBlHsBaf9hnIiTmhjENHyhvWRjhNgiirY47NJESNIIqqFOF44qRiRkVJEFFjfUsqKuECJQjCtyVI0Ee07rZyPCeROXPqXPaxAVHNHNSXigWytbbWZJUS14JY9dCIWUB7t/57KMrJIb3RafzoWuEL9dytGhAuupYSMAeSkX9xcI9IpqYhiABxvilGRxrpUtSYGMLEWgY0yobJacwwAYMhFGOrIqk57Mx8iBhLDm3/2oKNgbSQx9PxF1RYnBjDK12V7f3DJsX8QADh6CIVL7txtUXvBiTz4tRdr8297+TuznrsDIazliAHgF+77ZIJqbnairq6WntyRFGtvcqNfEEsnA1pFDaxAZcGBFaWLQaSxKi0v5IwdPD2Z2n/aEf5maWPZRAuYBb4+e8m81qqMLnKbvvHOmvcSwlQ9qeQN5/YdvfPPAJeiZfgXnniqP+lFlZfxZlwyGZe/UOmnXEJmVqyd6+86rWXwY4SRw9rBI59U6p6IIPIyVFz6Z+CASaneoiE36WaszORWGH1/AJc5WgCjPexySinpUtSQRyiddAZOmr/hBto3wgQ+u4mEktILT/r1mf1EUQNogT2KGc56kUKJLDfv908Grj58ajdLIbUNqla5YIeEePAGt1aFJpCMEsAieedWVXajg1TG1DN/TQKM1k0fW5dyonfCYJnZ0YFfRiosDfpzT/cBwMhIgQSpdbcIVGQkUjx11xAaAMisu+v/EumD7p5QWCAmlWu2b0CREFA176WH738dISMMTWSAYJwLS0qKKKBkgvtLR7WxhBqinRP+l04fMO3tRyb1pJupxy/yupOVMaye/dWJVwZIMBwZHQBCWC0kNT6Z8PSka1PwsXILAEZ2zbrqkmVnTwz7Qm5Jq1xrOsy3NOXErTNw3i/ugo4QKDhpFdjGx/l0dgM4NAIoQ1Chg55W/PvSJhStssVBL9ncBpsxi+ecm11+oJZRAkK+LP0GJ1zVe/GOsIRRZCutce6ahoVloQ2H+5wxp4iC05rsfXdSB1OkACgvUXVuYNJVPWykFQKjywQAe28yELIkmZl2Zthd61u2IlkLGRHLNHg61xqZEokjHVisVoNpx5TLRLlJ/bv9/ty/t009a/N8CRQ1YGGQCRoVgSicdDDGoO95REm97FtXncqnHPT0wGc9hOjVeOPZrM/EzMxAI7PzvTf/Zvq4HPR2nfryfl/vuskeawURxOh6qaUoGpLVoAC2yNDUF/x9kfXac/kl9g9fvnLU1FNEBAFu8zzfbUh+TTMIeXJ64TX/WDIxkGv5/jN4KP+MF0kaF37mNCId5KvgXGCQ/O6juqena+nBT3mH7eoXQBEEifeUajxcF//CWBY4827lpPIdG/3Q+LitFxxFlrdJphpPTXf/13BGMCjfZlROiWsOJLG5AkURi1crKdlouAbfYeTMzodnX9Kdls9+uIsU33YR1Q/4qUZTbDrvC5gxBdJb3LGodYN3J4JQvBkqkpi3qKYbjKmXpguLMW/kxWc1gRDdDLuNcBrLYNtRdzjh2AMTIt6sc/2ylsbS3/L4LGHHAYygaGMz6ee1ZCMR9NojUiOO240OqqYbiee80Q2OZbBhxpENJPvx5a5GLHf00UdVko1DZb6AQFxXOvAaRzq1tbBxTdr9NyTZMBJ4VHBcgxF3L62YBiGFBiG2a/mTV6neIDJ+roIYL/u/pmJjkMkFL4JjHNMxg+XGkCx+vzvWAeEXRjSEROeNsIj1Ax2sGgEJ6mw2sY7De2W2EXgUuIh3lpZd4InxR+nFfww04p2YuSe540+6pYkI4h0sZg9mxp9X21hbJ+Zp9VglIccbed0nIPBiHtPcg+qJ8Sa92kBWIu4Hcv/yuHMHd9hTu7EvdHwv6YwvkapvDk2xD3zKAQOp8eUFuauti/ivvX1apRxPYkSPAKEAJdzhaIFmzyycVgatefUf5kVT1rYHUYQxvPZ6k0pTy9rbFmIRQK55XKhJUYdcjVGGFLe7CnrlxPV1FKLhdx8VFGWTDzxKqAwAucKyGmoffObuUApCr5GeGumIQ0IoxmegVpPoO/Nu3pTDXmvVKHQMBOVo1p1VQl5YRkHK4C6+r0SF2+0eTDGQjP5rraelvtPOvhwALLEhD0cWDaEka3bOQjhehywJ9tf9r/19D3+jf/euIACnHUqHEUJhVuoJ1lDzHKgohPnWPrVaAdVoUJZCb7ZvySiALL4RXBQgW3JJAbG7GqgsIIyuFFRcRRSm4E0mss2v5o5LQ4WHf29DQUVPQXnamjXZsfXPgpQGiZypKLeaBwdQoIrq7BztqMvDMddes8muOvjecaTSAFIVc2Zk0aJIl1FlZs2wKhGBVw5cZs51KFHCg/ucWW//664ZuDyAabSUFVXxxFpQotaxy8pV0qFMKXKdVX9606tFLpMHS15zB+93va5IhF85dZyVW42EMt0/x1VO8zEwCrUesMuIxvO7hIqEwu53Hagyqtbv95zOFQlAlm1GVDcRxRrWK5uPZeJS4XCtZ6z0sqGKKlChUNx5u0mVDYdrvT64QgFkrbKUC6iaR7ES1VKbXNiSFEw88eqdzaXGGpWL6W79wEPZuOH/gIsFFJdtLmTrO4AKhkemojyc4QZFu9BznEfNsCXjuuffbr3Kw8Z7UskAGLDLw3VnspRNIz3KgY3sQdEaeekxIYvajHplw3KjEbKYu/zTEqhkgMjsMjBu304IypaF6wzqQ/e9IJqyITzQ2hz2PQedK52XOGRo475FQukuC8/OsnMoX2eMnVl/z4tiOygeYlPPrF6lOqJ4zS1iNavWrRpC8Ur1hg0zK3/gypMjFw+wxDQrPvv9iChgExzPRkR3D+YSqnegmo3c+PwQVD4UTnjHwcFsUgfeCEERs7GzaRbLKGO/UZlZiI6v3ZiohDjc+CkrvVnkuj/cCEqY4q5bTM0MpNd7oxqFLOuOZ5CobQ8pJfJNj5JRatmtx0YqI443up53yYQqVVHKprvd3dZtslT3r3oCFxIorhqXihLduyJQMfG8rTiRtC1VSyhl50+91dQkcivPfFSLgq4tIbFFFBS1cCLqrbVUVkQ2jY03en5wRQWqKUkVd1/NU0EZeffRSEp03MeDRUETjnKUhPtVT1DWwpZTVLyM0qYVrlL0+HRQWRFO5zqF40eguB9BJoE12F9e+4kS1DSuy8uyoc1ZIyjwFes2R4Tylv4zmt7mBCVWP3tSbc4HkuIClhibD+yguwZmkTA0du4aWNqqPSLk/xOoh46D/xPUwYobYf4vAEHxabJrWlYkRZiYeYMTFhWvPWE0SWHrtU/7ICWFyYVoU0Dlgx0Kvqh2uuCTINd52xkoaAnvjC3SOrTtViaWE8ybQ5MIzb2XsBRTwCs3qE2VdKecb6SUhP6yuh5SiUL/AKUsdPGGbZC8EH41lJKnN/+hiuk879UTKiThBUxnENL8HMrYU3dZHzO0NHkkYhGFk0+8qBdmAGAehXy9W8JglmweDSqh4MIvt2GmFH+IMuZnTqrZoDoVVEDC+w+wi7NImm4ZRUwHzhpill66a1ddSAe9jTMQ2d719ouUEE0fYUlm4JkNryJBETcHjUd6yn99FjqU8YKtZQap/v0rYSwiwf82FdLLTO/OCFBG8pGOZpDs++4eQaaMQAsi6WRCfwsGRSy4bCNQOjdY7zhWa0Zenn8BZuiFCSOxhixTHKwGZYzDa0ZGPvGR668GhrByDUm89g3r1RA4kMWwIAUE5JWP1ei7K6oLxV6+fJj6lpJeHaHo+cOCj2ZBikerR6bl/dXB5dZZs6cmEIuHqUCBXR0I1Pwv/glG6Vo196Z8BauVa1ngd3+CFA5vdElPQawe+C23y4NvFVC0NtTtG6s0VrOpt53ZegWkZCzEFggSYnVx1fN/vlQ0GovvvSLlKKx2KwYupIjDl1ASIZZvvy05Wax+BerisAmYcmCgZ8vH97eZ5BhIL7vGFxx++6UbXIJYBha1gw7abZN/B0mx+ijR1472cER++ZTFS1ZQhgG6jjr79Fl4lwirP1HblKweCZVOpPk75ZnWAJhFxbthYilQJgdyBo5GgBHn5ZKpd6y1JsDQVxT6uwKEgRHMnomKKTUSxp+WbPfQRCOwBkDXsyMc4pCRpWHhhCMB3VM+8OMnpY19TDhm6UslTWCM0Xr7He6h4cq0Omfh9/f8gQDHHKsBMxJjRwGo/OC+d/wwYBorxlbmbzQCxmz1/hOnFhF7BWHkcpXY9J757lr1pcY3jLHKpfXPOgh6JYDDmWnVtphj8c1TqHwBWkn92W9gVyEULz67cI4oCozlsNZ2W9GOAOBkKtTxxuDaKZ2lXUrhcAZrXwfQyADMOnG2W8LYdicu6wSPBDBZRbEGyE247Oq+Nxw9hER/YelhX8OOgLHg9k22H3Q0xnoh/XOLlVMoy4kbD6/GC161zmum3rTuky85BjD07tNLT9znU8kjAO29Xs92ocSYd1ond5qV+LyxF9L8V1zWmk1MCEJataa/DbSbL/vJgsROofvZA59d+DHbEeDe9U9cnB0HVNj2+7DGAoFzybMvbsOV8KDZUIpkLLB44+R+vSqWOsMafb9cZgR9ry5GcXApfqHEyqj/62MuLGYwDp3pW3zEAnAldjmu9W/lRGmX39Ezj/e958cBpuKZ2aylEVmRE46Rj3z1rAhz4rN0d0+9k2tPYYTBYW02o8YDdX7vENz3GZPED296cLms0wn1Cw8+Ytb1A3EAVg7WshhR4C5/pmkg/dW+U7YjSvgyDAa6B7U+DLwy/LnJy9J4gP/eZslal7CADqYJNoPrf/nR/VSYlGfmyCOdaXp4lzxoZez2HvtFpminvNS6Udi25afpECb0TcuTWDmLv3jpFMbl8t5f3t9x4WJYSDdjcyJYTn0PFn7z4RlEFHmgcELr2ykxAhx1zIL2HpC//dWfS2dOkwZUKqvqe4HMcLCv1fJqfMBNFraofpzoCKU4vD6rUg1ILHrLWzq7d+FCHXGMRaeLP32+2GB4a6BfOXuwQusFJ4i9k249J0Uyl897MF/ur1gDYHXBcXYMrUlRbb9hzhNbgum1w0KGE1Ydm6vufNaRb8NEGhifFd6ZeLCk4QB8dEgokjV55BOPXnb2ZCcN6bqZQsWitO1EQmgtbv90VA3USAniXN+UndcT3hFJVzpU1yIryluv24eIZ3z9/kX7z3tFM3Qo8fXXyd9W06WmdXdcqM/4RRgkhCWVzdsKrOO8ccmzQgG4nkZGDQgUNm+ffeKH14fT13u5QxMLl/qdGws/gYg2aPHBq4dOPl8ZKKeWvPvYCQkVnjvnjavwwW7phCNhy6h1l9MDNiy2HNP24Ip74Rs7gGYyLRvt17Szv8lG+ZedkBkOFdEWnNpHHG2Mnoc6tlh0u8Tlp97y5bFFXUthdpfEgt9tJt0kcS7om3L9z+cd+1n7nYX8jbt9OdOQ7LEqG4aVbbpbN1je55rr19aEXJsy3tuPl5k40qCdf3TrgU9hT/5IVRe4ZZtPv5hP/ri6rKk/l3MHysk/bnDq2vmjvVP2Ok60Llh2d7sWBrptLYUUtPKwzPlNr2OT63pUog1+9OMiKNJCdf2v5mddKlP+E7deC+HmkwZzRbavooq1tTc/uwN0VvcOFx+y8MkL/vi7ngHBIGUAkfJcItSC/rmlos9NDoKKmnnMgI4254pis0n4J603F2zrftW4TcVsprhEePbI7XZ9GJ+//+WFr+9nsfXm1y1YoWHA2DK7Su3nFCu/OPWxsItMvuWbaUpHmZEvv9Yx5xAufNJCHLTnJaz0XNWf8BLn3V9q5RkH3nHot2/7tXA2vLBtnX5UCI2UkM3p487faaHM6FqhmkO0G/H0olLy8UdaHHHwb/1QMZNQRqWNOPenyfaZtx8x4/lKJm1Nv6wOCjRYMfA334bnfXr2URMr9ZS1ERfKk55Ph8JLrZ3g+V82SQkGG8Eh+krXO7P7drsDbm/I1jAaLteRqFw39dSTsDDnDqjOIOqcs19qqup6uHCL378ZZHwhQwasNUL5/Vo4vUsrRYMGrdF11KlYv+co/ZsDT+4pdoAiDRJVZ4Jo3nTLg3Z/JF9LOq4JGIDKeMnJpOEKY9ConUBuZ4kJwx8FFW0QWH/2SXd9+fKdU5ehy5dJGVjLomliukU4i3fY8bOksI1Kun//BSuCgSADWEQ+4zzsv5MOzJyBPAZllR03kWhqdYNKabt3D/11WYYNSoj2Q7XECEX0QQMG7Lx8+KCXT4XJuh7krILvZuffd27nVDTuhJqqmEYQH7X/97vy3Yzw+ql6+jltGuneQ84plDYrAhWp9I4ANEk2BMBojgkh3XTBxmgOl7200SFTzrpu91323vVGQeWdb1VUQjrNldL6EkZiqFQUD4x898rkX9cC8PVaKSEwLFP/rpKoIMIL5766eSGx24IZioGXnukBx4GVa3XjT9dnEJgwdK30A8u6yWZ18yvZezt/tlkNdNohxbjABpKwquauy7/9wTJw6y0klfeHT+/MW5vb4uqSiAcr15JWxrR57yfhDgRqbXVkM03TjbAV+SrDN4C1cWGkTJfcbb6A2YpyVHOX8oO1yqHxF98V7vvzx5YNCBE7wuC6e1RfAwbIQrJJaC+oZ3RNWXH00Tf8t7v8+mxwvOD0Nt2UVsLuZBzXDhYq2mkWVU3i9Zs+m/nkuTCxQoUHHV8VEvAET+2+/X9a+uySBQsHBHP6/kMndiBWMrl+WQg0fjeY8oO+LQDdP4D2lqamieteMxAnGAQWMhq8xZse/XTHIscYpy3pJlze/naQjQeWJQAmS4hCFya72eB958wySScJa9lCV6SIBwAWuRcTIxqTMomTznMfm2G9pCMgtC1u89tPnxrQ0cf0Re3LC5O+joomW4Z/DsLNZLrLOtC1gfK6nxz4WJPiyDPye5+HhaAeWIoE4U44lF0tXa1mvHk5rM9eIinsUSLLNuqA1slt9Z4+RKQjm7ayUgDKCrx1mO8EoVKOw8EGQkSfGQhZIypTlDQSwxrrrHjrt9JylZJua+q7t0BHnb43obzISELCQksCACuAmy8GZcG5xLw+cLQRtluPpYqMhDAG0mUMa+RnHffP7HxZpj1KOYh44v3YEkWGEB4EnvxRSGqYJ1t2gX9j4r5ZmygRdUzvGWVtZNjUgntXnPv503eCAQIAzQ7wxewrl5aiTvCvE0UTRIZ2Sw/jlZ1m/fMHv8JQayWg4WD6ayeyijZA68CGkYFEITlxrsi/e11bRvy7mTMANAAoAJbBQkSYIjBHB/U4TVzoK6AioRLBCYfY9DoAQoMuWhtDjXWiCuQIFR0IqbZfse2dVMWEITnVarb1eugDJPCMWHdeufatrQFYlghJRY9IMEUIUj2nvHj2nuT1Vga9jJseNF2y/quNUDlGHNB3ybKp+97Ze77CUDYAycZieHSEWIkpwUSIVKmKPq2eYR4c9LyCUyvmSqqzrqq78+zJ+++/M97rPuj9bw7j09c5H42Qh6GVrFZmACCKEheu82Izc1AybjOHwiTLxRavTwxSMuycuDnWT8/Z6uS18X6+95qOyqQ/w65MjJ14GAKreNtzQQiwI2A1HAITF9zu438CAAQrssKJEOKUa8kmnCU+Oc1eAlz0e9uc/tQggbxaxUJQU3NdNG9zdo8jSkecfdLK9EhIWojhNElYOzLmwyhqYhXi81+lmE2JBuqThMm6i40RBa74UoAqCZvNorbXtV0k0opUhKieM77bKfoP+tZP2oNc/cLjUNrVdk9MojyoCk5ve7FqtdZaCiKlOO+sOORoLYUDsLPxSBC4CIiHuAjgYhX/WnXBwWrGUcsdtyebsWU/RG4qq9y9Apj/m7dbLzkce82upIyz6/sWIZOVm9w781PDOkKktSD2+xgm1TJvANy/L9XqWjUHTUvE/k9MaBW1zp6BvgFPCSF7hKpXiUWW2WauG0JJgHR2t8VqIoZ9Mf9dfD0naUF1TQCYVlzYVA6KUDlyCk51ycHvhaWt9+pzNjwJANiIO64/aPsjAuePL+6gCZeRzrZKmVH53+1zhK4F0UGJYgiR3PxHK0Q63zdlL616t8wMHj+l/4Z036lbHnrBk4AkZhuUQEIoRVKQUEIK2M5h0gwKC6e8rnaxYsh0uRnm1AggJouhqr3qJG8sTH9os8Vhcc/dTnh1cbD7FgBCYlKAFc8cCCuAfV8EUCxSkMrlciawhFLRRofj73wq6qW2Xe4R6Wr+nxtYEb6lKnu5+J9X3UfY6T9woBwCAOEkuF4CZMKBYQAOhFKSiCB0Zw6XEQ9Zr/t6mrhhWVAgmRmAyA+evn95b1TPufefHdXN1jUSQAgWCsNrpaGA2pfbMrH6U5D308l+EfT2dA1qRKdrJm2srytJQ27de7TDSAwbSgGg7r12/GCgCkkCQN6kYNCXriMCx1prg8DmPAhdDVXKdU2QCjF0scol6hXB5QDDq2rLc87ePrn1+ZsBCJVhCIkRa4WVW7FnVSvfiJwjaoFFhCakb3kCgMz6zakOKwEYQBAMIKx861jd1JrKCQDw6pQGS8pvNH+AYKxmWSgnKrVyzlVNtbItDQNBMu8jVyGEmgGQJH9AS8UEtiCB0TcSgJ5w36d/2a+vUEsmCZGaE64AA/TT9wAWWEUjXzms1UGCJABJyWRfvloolf7ye19ys9tTyeWKOt0jbIdf7hhwnXCIEFmzdC39STrXxqUQAOTgUVtDEpgFxqBWYnL2ur3DnRzHiRRq5SxAAJgBgVW1PP+MriyFIADEqhjIlsGdNuhthhWPL0oH2VxPsz+YsrKcz0IShnVdXrJg0u/q6WkrWosGIM5+tnA7KzFGNXp/s5W56aJT52UoWiaEjGFJYDSNXLL+J1VpDAAd1qzkWu/t+2Hoy+V5V62N4x/vgydWcApauULAciK5YOG5Uxke2v60xKkB0pt/yPaBi7FqwL1s3J+3/XRARgqAlYz+sq9OrHEPA1AikMrKYqgVgL3vOtjXtSN+siTlFasELZwwUGQonHX4BT4QhPWd1gk8wC+2/G8BGGOWse9J5IjKxruURMSQWk0kMOegcq0cAmBNXgbkDGMeu7Z+1ozZ95tXrm62nfteioufSaS9zmDiaxUgpJTjGqskUEo8c6+rMZYnbgCCY0uKIoVqG/zNOqsF1jhPnJCrV4kBkWhOrH36kztYAch2ZTukngiEonbeTQTeqbOpr6XlBsAIF4CQ92VBVEst714BHktsAUAQi0gBSGK1V49fUCtrRwo3k8vmK3tNYAKAbhLFzZuZBYaylVt+tfXky7/NDIXh3ZLyXLzbNu8u0mOJxBB4SlK0jEErOjfaKNdPDlKFtBQLT0pYAYAPdpyeMzC8FWC6c/b39oVRGCGdgky6a8vdjoPCmCcIUnGDqfO11x5szbr1Wku2c8uTlmjJQ45cwNIYd5iVBw5hhCzOLKUz3f+BMRj7DIZEDB2YmXghsGhy5/zixwAIADRgJWGkIQuFEZOVf+5Xl4ZSYBwSPCVFpNDY0AqoPJpOuEHi/YAUYagicrGaObVN2LzDCuLxACghEKXEkgWYIRA6Jz7wnf9ZgZWG/ooKrZ5gfvyAYw4RVLr2lIN6ZZTUpsoDAJOR/3xvgwtAwxGnfvSH96FXS+SzXr+40dcBgASitKJRNqtOZtLZfkLJ1fKvSQmEipLctSVnZQD3UfKfg6tJOoIlKLU2ESWNrGS1quSx+3J9NWl29sottIyQNnR6uFhDLcENi3itlBARIhFeTW2Py0RtQ6dhAUzSjRBEZ9Vwf9IrXtjcwKggvQiRau9XKOjg5Ikma4xtYABUhMDt+yRFJe7xVZuTaOQDjCht7Hao7ay1nLdMgRuVwB1ZEyHSdvv14OAP1ttl317iBkVYT3GEoI2iRWCDX+fW6spe8aW1jQkwjCgVgVaLr454rjP9yLnvy4ZFiMttMw+dnr5qrROgGlV87vzFJfP1vzjEGn/m7bfXQRs5a3ycqX2RdecfPWh4zU7w+o9t0hmmH/kLgjU7kM5uWk+TE0hvDc+q9+9pdlW5+YMPYdfogEzKUUHzS6f3gtcIJOrp/PVPB0Vi3oomizVBqVhP7u+vZgxzGApqTDpapLriPBIdFp+fOmCqZasnfBU0JpeiZf5XH7FeB4z86pfL0lRXD59Rb0SMx+oiShD6C1Cr1cwT5qWVc9OKpkZk8bdqtLCf6kE9ceT7eaL8ny+F5QHaBKKUD93x+Z1TwgQc+rXD5K/3ZQBiRrTG3hBKGZieOWOusTY49PWj+QfQAESkIEJpyO4Vf88a9NaK1vz6MCm4hH2TEJGiNQpccUe2Gvh9AxVT3Gbw/aKhETiX4cUfxh33ve6Wq/3lmjUBn33MYyJoNODwBpuIFJH8LEvYf3zi1mpVC4BrbI89h7jhwNmXnQiJC794n/WZMeH5W1rYDQJKugAQcDnVSmjA/XVHRQcv3+rJ3ubFmCuq/T4blSy0ZwkAG0L3CnDD4ezO2osOxB4ja9YonV11iJBMOE7acRUA42/47OUUNhqyzdcPJqJDhn/7sQk5AXU3XSNrdSFbCPuzaYdg65lng0/INhoA/YoiZHDW9zkjKxbf1RZCmESLJ/QA2yapANRTr/UrQgOW1qHIQBhuB2XD6Dl4bk4y8k5SoRRwkMBQE6Qm3f4GbKMheBnpRAav3vxx3uZDy/YBld2tPk2lJAmbclW+DgBkN+suo+GKcLtrupORERd++i7rc9p2wv1vv/3LZ3o+ywuq1pqctAXAsr6VU+OGAwgPFBkQY5EvU/nSn+0MXLj3G/8wJAiccDHU5uflv0PUeGBIRQdEMhqWDVUncLtrawSSYhh03L/Jl53EjYaQSCgZHZlzKCXTJ5dddJeudkrrZgqkDSAom7y3B43YeNERMxveH+g4f7C6rMTpbIsngxDG8edfvwmo0cjwB8f2qqiInQQFRj5wSs5WAlChHZargJl41QlzmRsNcbpZU2Q07SokN9YD1902IR+Gkh3HERXLQKr73str1GgAaEJkehCy1+rDHTfXtYrblO1sDktkAe27d9QJDZdDi+iUiOwZfWc9NTmznG1Wnf5fAyIgDJy/dicbDiuZDjgyNDItXO8vA9PId9s6PzhcZIQC4IdrVS6GbRwMFqBFv+1K+7Fm8UEb9i1VVkjz5G+lVEPqpq/2ieWGYQWE9n+4fAUFJsYAMHzT8wWjuq7csWZABEBry00CjXNhzbvo0e2K2d464vKzxBjWsjPwJdnGwPTiD0NLv7lmaoURe60lgCVtqYS1Q4xNvfE3mMYA3uRMt149tyeUKv6s/HtBGWaIH+IfTQKN4v0dAVhNiNFV6VkaEnD/Wy88pHRjAELAuoSIjaKI8R/rWAy1fvBecQlxgzASYELExgEpAvJ+kYMhqHO9mkSMl8FfL2ZRVABpHib0W3Yv2hgXtn3lRzYoulVYi2GptPmVgWgwMlIQ5ofQS7heYKXsfv7HFz+VppHYwVSkUIiKGM9j5YZXvDFnkeDGQbbtbyeqKNFNdp3rBuRw8GUi66GRstooTMUlYLNzmsxKwgr6K9xIgBohPl8tsHJr+qdsR6KhEGIzEwytDLz87L6ZghtJjGb0YKRh6z1HDmANjXrAvDJOv3bet41oKBQlEon0GDtwiNR6ZSZ01pGMRsqQERK64PUAP/28Zv2VhbrazWioyhEyQvx0AtFhxVefPLAYgVkZtGmlRkIgISg60BFBqcZjR/XWtY8R+tl/rhDcOBjMUkYIIrQ6+qRTlnrW0AjqqYc6GwlBuSJS9JJtL5TqIplSK9N+NmQ0UuEQ4nDoTru5qSYL7WlaCfzs0SXROEQ49aqTkzGIqfsT1/Nkh+c5wwgBy4TGKhCHrXrn1nQ6D7IODZGpXFKbethYOBYBk9JJgWBAMgCQ2zQ5x6bSBG4kEStGhxULz5uQFIt3uazLHQJHeYq0PA3UUChSzHpQAaovn+Ro98t7CoaGGLaWA/OpQSNliAhpj3rdH1xQILDJjBf3KiXMMgkJgINSZzX0jZENRUpHRAdABKUa/QEbR0mHAEK1r2xDqrwPbhiEVMJR0SHBqBH2pxPTxxWzjitBqXw2CYbovRKmYQDMiqKjCxutFsn7TM4cXyFWgEhOmJRxCaHoQFz3vvNawKbH9AsMlaoqicC+7m0obKMEnkgNpLPg5GYNgJKu7qmHjHrmnWtU2ChU8KOT/qEiBAK9BrJEAOAmCq6paICtLlk0TifBiMfSzUkigJJumBACAAw3iQYCi1hsxHMLkvDrwiRSyk0pD4Ctp1/6WJrGEZOteHpxIHRIMpcoKAMFgOvJtz4Qdg0LyCfvqvq1uhJCWcKwRmfSaJzM8YjRS1Pgtam818KElVvbQCjBsQjGcrczNYDMd5UFD8dGWtsoWHTP9zgOsVQ/Xv+SMwcLMnfiThUHeogN60nBDcKoF++bpGOQUe+//PtbfzSrq7zU/90PS3UTMABTS/97rrKNAUjnAkQqKwncG86dVdp6YJZn1NYPhPAwbJB9fb7gxsCoVLWOEmpFR+jcctaXd16LYR/WycRwHOZdRqPUOrAR0u142h4jDlo9eP0j195smdjwXdpVNIzVQZIaBVuyiNAYI7Qb+eqPUxA8TBjaN2rUIKhJU5R0sY1a2EorAFgsuTRMCQzLtdYrlwomYNH5bE5HSRvW1YxQq+cHsiuBqbcrNESW8//TZKJEPEOfvN8kVhbYgRBMADgtvo2SLTF0/lXyeCXahCEaIoMGbBCzAOZwZTAoNAbU54nAxi5ii5Wz+p8hAJZ8ar6M+M08Ap2+0G8E4NvdIIhhI7Z6AgGQcLPSNt753GMaAdDGjKgNW0xoTKoxaESubNsKiEbAhqc3Bo4csV8TfRZqBODgNCQCaW3ERHeqkBmhdh0xAp/dhsBV60dMCFeB/tpx1EhsibEVRk8j+0RftIJGYK2kLcBCGhsxbQzQbtsHH9+lRgDogS1ACMOIWAmkDrAeY4SsFv6WO2WCBRWJyBXZAmDFSBBYqG9xypcZjpyt0cAZAfu2FLVFnL9hjWIYIes4tDIY47I2YM+2ALHcEa4YAZo+eZf12oyheMYQGCE71StJtEkiiqBuC1hFJqxHdYCVInKot9UAPOItICm8qOHJO9HAcNN3fueiNsoKN3KazyK5yarY/B//yepQFk7UgBbhLqQ44BEJM42ijGmadlTUIGgT5+fYwI4EeudrfuuCLmASlBM52tkWbzhrEZsMBPUsvhu6ESPqjHz1l7uZDk9824gysoVLB6PGg9XN+h45HH4IkyEpA7hHSIqWNizrYvQfM5utHB4mO16+xKKLKOUpJ1qa2Cmzc/fPEDYr9u9TgnY3J1S0SCRdwE6VARs3FUYRykW4zZWdbrRAoFrbd88ulwmbbeNku3hdAFjJiFG/11K/5jfV+e5t5NTpekLGJoOnf6USCLHp2FUfueidCKqU3vcXRTc2WUy/d1CZUUDXHX3gB4iqyE7ePBARI0GNdp791za9vbqeoMFFN/xodKoArjsRI86oAfxqYPw+k6CL/m89hnLyQy9aqqXfUFRDatAUA04gWH/Rnj8iqpJ2rymsokR6F76LvZqhjFH18ZTfvAGtLr3fdjURKY3bAdJjs9KlUWlw/m1eA1EFMjVFkdJiP0SNEJ7wRklWt10d2qUQTpSgdQFqu/s8+dKKkVRChU4dmpRHURIj6SG6Zr1BaWBWzzGiTkJEimobH/w/VUgj9Xn/zl5dzWobk2Da+53QURJ0blGgncvGR2w2vjE2SWzbNRJt5Fodn2C3cy8JpuOvvd95VVrd9krexiisU50mxMlBElVM/VVEbQyKCLc1hpPEBgLl1pBvoyUOjOhhvG671Gm6biWKKiuo5nCkxNGvvueCGqAZcpUEPswzNFvnk+dziNZoz/k9R0Vuw7g03eJHfuqCIiM+edvjaBHPBNEj/LFpZZMEvnAPiSJCR5MvogXeOJAe4CrzXCXxnUwFmmsztEW0xtiuQzS1YmwS8d2YFFn1xVXt9YiBB0E1IXU3/4U9LGoAN+ebqJGIrdkvfPoSRYygYsOoAbMyGi0K2ypo1qHWUaMnvO3blVfEVUokEFFFpBG1jGkLxexuHlIa770uCBk5JoxREdnWG3ptmi5srKuyZU9GjQ6nU0UA90tKI13cqUiYjY4uJ6MGmkgVSesoCfz8aaskWshOOKikIgcSVSGRMy5N6348JejlAZciaKjL+s4k8hKhmDjwKGry9d/WSQ9x0yZdIh8iFAvecDPrRk1y8b/ONVGNCDc9c28/DaJoksHuhw6oqHHaGpoF+31r0ignW3EoaihsdJpASeuSsSYIgooaBCZVAJhSdZoIWdeTUSPidflTQtroHgnSA0hyKGoQt2siu87JHaUBWqhmCERtHHy6IT0y3O1B++tUrCuKw/AtayRqIGysHSXx8cjL7zbQLAam5iRNXD7SauL+ThVEGEm76I+0fIjQbRhpJdKRFiI6XStTTgMRXVJEEOJuTcLe8ZQJpdHNGKyJCLKngvRIfacbrplUokiZQ7YvUeRE+ioUa/X+H4xDKlIk7Bbr1aOnC9s0WbH3gJUk4g4+BUENYH1C5DaypIhdf2kQkVgOQLMgRG8XSA+bzt99YTGkglUVzVH0GNV194mdT1bQLPuu32Cfb2PxgcKX3bZppBTc0pPglaCYWdY2LYpR1qCUzAHNWYGUA4wW0M+XZHvOJuMYppbpD8eW2HAa0izjmCghaw8rGUJa9m0RHLNaYVICUJ8jSO3bEDFbGrniEESHNDtdfqVLxZbiFprBH8+wXgcgXEFyRuyWaHtQzOliuYii6rorCQCkROr9HrLUT0axLIoSsu3Xl4pTGR27QjzxbSMEFSAOtqI0NvPZhSqMV+Ldyg07kA7Q6tQisQUjZktbn/ccgHUIe6eTG5eGfevHLXhsxwRKpb7jzac9ShPoKjhmhR0fiI/2SkABtkJazQLjWlIE8aH7DjqjBQYwicBsxxORG0Gg0GErjj3W1KQ8ih4//uLHnN96pHfeeRz1MJwIio0h6I2SLMz96Cs26AGII6hrNxRxJani1BmIpkj2cGq0fN/P50Oqrp3iSFtordNixN4l2yZCAGkiWIqg7qjX/8gFFezV93VtK4mAEBVpDjiCIIahks2K87+yvWmROiyw6ClqP4rEM+kwqvfebcKSKi58/RwbbQQ0ItiHyRSigGXPhRt3TEjdDX54ltFjoaIodL6DRuLcwcsMxWS+sVFgm5eSIghBhipY9PwZEiRZ9E1NeiqsOIqk+suEFABN3QoB6X391w2yyUlJUdTuOOMiExXYhzzjMIsdZ15oGheGiiQKYwuFFF6b5P4sEMYWxsRRBAqiAV7rAI17lC5EEU1RzVBo7Mm9YXJxYNK1YbU54uK1qABiWb9SsJwuBD8+0uLJTeaEcrP0QaXVzQaHGXa9L3TBhSPK7X/VMSE7pq/LxEJAM4C5PIqrhKYoEnNAkL20x6xvnUHXxRmwzJNNxfo2iiCW8gN0qXu/ky9BSMc0eP0kmHDNBIjNUt57f27rVYnpqip+Z74xIceY+AQ0r9O3YECUzlQrYxJLpp5BiRjNWLp5x4mwM5jeciDBQqtb32imaOKogwb+9c1Kxens/pceEzxgIRSimGxDKgArXl+uKR2Z/QJPK+ArjiKLOoI0WPrktO2tS0aWLOkw3uv35RlRbMyGgUojn/ns1Mm8TWWdqaDTmunzYCOJ2pNWhTQMffwtV+eSyfGLQg7W+fSKtcuI5OryU+FZiZYH7OyZVPuecYvOOIBDW/ejycTlEdTKkxbiMBHsukAlU65sdSSxRQ295P+36psk5IRIBYuBKws1jiRjOtJk7zSuhknY9UYgDaDa655BNMuARQ8kfHxpziSpOw+lIhvqaDJ7n9ZvnR7wjlv5OgWFo44T0qH7bRBN4Kkx0Es4+nWHein4wD0f0FolZExEhXl4RVj+0sjHFDCTSNDZwRbRHBc/E+/rFY3OOH1+IwURM1QSn+xyRAV3QXMN0cI+Pr35mWtTOIJSpmOtjChUG/e4OZSG6q3PPO46chAJuaq2gVQAW5UcFVGME04h0aBZn/R1M1iKkgK9bgVKmb5nkhEVF34JGxSQp2QiHn9xh6TUXuVukVWQbb66nKZokqp5OkQBbr8saU68BIlpetIDolEBoDdwZDQBvfP325if+e/dCXFFTAXbeCiVervfD6YjKtZXPjByXkaHTnGTvJwwQUxUEVst4MyUapKiSXx11jk+LzjruJWgNphbQBuTUM07QVoEF9YlJ5oQIj/OSlZveccvVuRJ0KBrksBhH9TKcL/jiomIgpXlbyPmNLWX81UzubrjXvWkGBWRweNAWgAe0AmKKLR7X4+Q03bFdLqrnpt75179CRoVCnOPAatR9ugdAxVVG1gg5PwFXr+huTzxr2sv94QzOgYeeoXZYrKWUeXnfv5G6zMCXj5jkr2/7Ykbp1CCRsPyxCoCWddTUQWzejnFjCwEANhnNodJidHo8y2h2cG/toCIKGqOuXk0GY3wxZMqSI4CDfx7IIoArPBUVK1d/yFeA4fH/5lSYtUqmluBasJZbmTZJhA0OvoI4aZGwbZW28kJJ6IcvIFOMlsOOnqV3PIbx5E0AWWoaKKqOhGkAzL/bga8KtRd3UK5QkQzjnurWB1k09vOc/SqgCY4QreWBXqDpclVQ9gCRDQNaZ3UUNi+wQxnleIOUWeFjKRt9m0gLVbNPubDhFyFsPA6IdFFOXIiaTvfFloZ02/pWM5iFVr7y0cJqbKeB4omRDWgb97a4BnBq9LhHA6KOMSyHg4jqeA9JMaJDTPbXvN6IqBVIE+4D0CMHyl7XfYoktKqfUceH8rxZvV60FjlJHtdIY8TS53PvoYkolllshcBduwZvPj3N+/PsRkFla3tu7MV44KEvermilIRhYRbHIQjwDzWXr5hZiEIbbhqlKb19occH/Wnwg6rKKpIBqkH915oQGOLkKlCwIwGZNLvV6D8CGrP5WmDCGff+J8tP3VRfWw54enejNALAh4FOCqbrJqYncWpj+SYogwIA+GUn7+4oscSeIt6l60HAUaTEgKb7478D5HlwMBEGkwV4c4HbNvCNHaMWvRVIUAdo5trNrMejblFTPxJyhcaUZ8Mtznuc4cxdi2uLFBzW2J0CJqOuk1y68RtJ7WbWhh1lMX524Awlv0X9718cnNudNzEkut7fGSHCYcvQg2R7+IU7WNs3/Ttd/+rWkeFsvPOcy7cNTuYq00vguiTfJwXjiGm0oqbtzh3g0R+VDxqWge/5/yQE7AcfUh875uAORwrRr5zYIb9XCYxGjI/69Amvxn5E/ZQJKLP5ra+nnwHrHlMBOKDY4wuIyFGI1nfYhOTwDgUuGAie9EH+4/tZmDwKkVYVaEkwPQfIlCM0SRvcJv1tBwPQFhTbgwwc/faYOnF02d+9z2YkQGRD4MBhgDOWaznTSoUXBoVoprrYFyyc7P2YgBKtvjj72264K1O8Ii+/fWNkg3JIUZi2B7383mplHU7KiTJ0y7TBg14HABbVBwVA1CqD86YeMmPCqCR8OHvnXrYNkBA7LAI5+V1n/vqtR0yWzZAzySBm6vs9MJd0g/HAfO3jRcHuDqoeK/Hd4McAQOPP+peOXniTgDTuzs9veUlzxecyVUzKDoDUlOyNvU3zy4AzJgj03p3XyIOgEMDXwcYMXNw/LMDtPkJRp//lzvOyNrbKwFK5TBbqU1CKlBSt70+Mf0ctDFsxpIR5T9nw1gwlBSNDCyLb6fO/aoK90evhG6/05IIapxudjnEDB0PvM+OhWlSksRqZFolKQZuT9ZiA2PVCVjSm3v8JjPl4n1vmfUADfy2cNkULdUsSFhadN4uCx/c//hFl0GPGpgFALuSEBfNy2ZDHQ+osuW1xlkltjCXXMtVic93fH7WlU3bzl+yluMzzwIwdbHoiOv3Of/oX007H+FoDTQhlLBqOIXKIvolVTkegKWHUWWyAvB/+PHjr737IS794IYel/VsOCyJRX875LOtL3v8EWVGp3NH/HibjQHM42F09/nn4XOuIS4yjQ6YACt6Xjrsp9e8PuOdo3avv8U8GwAix10Hfx6evwl4dIBf37vxb/cw71z5hQBg7Bt2MOGkEZfta5tMBsyiP53wlZoZSrp43o3vPgcKRuv0V2vdP+x94V9HsbQM2fd8qu7KGMG0OtgoIGRyLk+XpJyd0X5/5VLa3uXROvbNhF+v/vtADOVTZs9wAovYyAKiZkcPgBEEYEsYjMX6xDNungoQRtfG3mNWhMXgW87g986/7uHUdIk6IzYy/G8enTKf7WoYPiQaE9b9ooWNwCgTIcCHB6/VXa4hA8tcCxAbiRzv43v2GyTGanfAY0JWfpCEpNECmMW7O8+5/44DO3MzFg7WGbGRHDc566/bJCGxuo18dCeXOQPyt0mxwGq04pu/b3FbaSZw0R9VDfFRqAmf3YSALMagYMEmA91xzWcbMa2GoW9/PXG9D7Y/dtmAHx/C+t6ehThGnpuV+jMg3eFgNXPgAW3f+XCmYxAf5VDvJX91AVma0nkv+GEGIM2rCzCM9i0D6ccIstL9CRFZanXxwZcs+macAStafQB0ZQUFHBtirK73tA+5Lo9hF/5gfjQ72avHgnHeuKGpgtgo7T/tR/7KMRcrAnf29ba5WYnyz3MW1q4uDUu+iQlkKzHve4IzgozriReZhVmpvjPbGAKrD9AcC8jOjSgMn3ANEHIO5Uuxk2ZUK5x9TJ0e+S/M6nIMYqLDeHeLtkPm4RW3HlYzqtNn/wu+880g82qxYsFZ7UEsIDNXPfHFkArZ92vCbLkywPdOmL+XIKxGq6Ws9nAYC4D9d3tx5wgKI2ZtytVX7hmExmq0AtoWajYumC5giyYpZ+1EWI1GLrn7Itzp1Wws4GGE6ZQYmpGbGDAbGKxGi69P/eSglr+6ZcRBGtUUodSLm410gr/3bShpNbAp/+2+vsHsoI4DPDSjYz8pTseJvYpmkuAdLjrAYLUyYdD9cU1Iij4zGB79lWOg04mvPzHMgKhXbfs2J+TqGdb3mhPRx9Uxe756TOd0ACKM5Ozc3JyQCGOx6Hoi+gCmfdsYWsmkIx7uOmQMIY+lZWMjL8apmYeowTLZVCJV81lEZMnmpqrkyEM0toNaxhd6dSqITO+MTK3Y16RU9I3POSN2fS3AKcYlI6qW8+n1cymKuoHvHyNQPAElM1SbXBgte8MREdd3+z4CXysipCd0yFZPvuCbrBNtpr/3S+j62JKZOSP0JHKuiLT5lc+hG0A3JSPq8mG9xymLm9zIIgjhJ0xJoJuZUlXL7x/FXMCF9VVGiYgiJ+FN+GwIlK8bm6obvWKdswH6A0JUO9lsxw2nVqDc3if2UkVzlke2ZLdoHTQ2msjL9e92MzCUS/VfkyqVmz5nINmo8Mc/7UY0k5vWPtop9C8xpepNnlXnAzJlFVVNije9oJYtwCI1GV5CzlJwROUM1r0bhC3cxFE/q6imjL9O5k4YbOWRV7sjH4EM39DBAozEqYyi2EMyPfdxVAkNUkydBk5fEHvg5D7+2LFokOLG1iRJDZ6/gaEjG3LV29e7Gg2z8SxJkuG+TZwVU/SkbKK3JNAgKZzywUtsTCFc04MxTg5FCAGcSjbfmVVonDwGIaVjN12XKS+VdyKDyHM47X/+EDQaqec03sApO4QyK1PwHNobaVmof7HriTOZG0qMllJIVWaMZUK6apj3AQkBlU3NyD3ehUZb941NIDxWNKaAdKg1+IVUqVSNEguf3ggIHGosxrkUTuXHx4fOWGL0G3AEpAuJgfyEFb89FdAigYZqulu/Yq9L4GqvydJYAjgriehEQVJ16jrTAIAdNFzTE2yaPK95MyswlhnFbriAz2aXbfqTnj82GSICoQFHbF5mEtufa50xJe1+a8uMYisE6oqt9gRCB5FJcGixwdhW9pebO44MZHlz7Va7IYBDiE5mK2+XcmwB2h8IdQLzmvvenVpXCo3d0SZkUuS+BRprKqhXrXCzk/5um3HR4EXWHRnXi/svC4LMCeu6jgpYLDsLW0Ohwdt8WokRwY6vto+yk/jXhHS2wgqdko/GT7WQeUTcX3rNKrIDLAqqJ1BhYGAzKyKg6I+oGs9dfhkJ8he2hCDMJJJz/wmLhi+oZjBCM9jZnnkwQiNXDJXMeuEBQjQ4w6gZgxHyYHzZo17DokIVTAWVzHsfpUANzQTS/ddVbfWR2NHC0KKFSjMQCrPIti79OQiNm0NI98Pbz5xctiMgsu3wpiHoIF2HAjldRUKjtgaK8P4bnyfXme5hhBI7/z/3FyhlC2XV8mvS3JAYxATYU3J1WqtjjqKRwEznH9haLUSBCSo4WKJBMg8RKxn68K3ZytvItczEKlJv/AHvoJRlomCSoD40QGsBKAxblJZZqzNn+DTQ11ykcq2GVbW1v54lLbLgVkwOAnf8hXAAIJzh2MB94h9t6FJKG5twS9LUyxqr3q9u6aFV635Au+XvZ3l8hSAlFn8mffXGX5JIVLNNJlOyTQPVELYeEBuM4ujSt1nRopwkCian65o2S+MpMvB38fLL1tpkcypwSwllU5VSoMshkWWM6mD6bI6kw9ppg66tmFitYIxfoWA++6PEg/1N+WLdWsoHVRaek6xWqtoyRpvG+5+4PUKnEbf09deFuVB9bk8jxwmzAB75HYDYrEw6wBkJgW1FYRIxw+T+M0/qrA7CoeullYXK+v85SI0PNgqLu05y6t4S1ZetBQAECACQYKYJPnEMlcwQRdXsAVp0DMxvMUqOvdDBksUPPWOkKCM0G21EtuS1K1DJDKklu9SokPUuPR0IHBpTxsAtPfPwI/ddFBgbbngEQb5OcPMbR6PCV9KDS2jYouCfGxy0AwyJMWNZAn+b90B7OLsQ+FYjc7d6z5t1rAHoS4hMCg1ctVXFhmvdsCGG8hBKwsPQEOCp+9qfQbJWqpcYY9/hPZGgkOmSS73CpIxoYPBac4MDmzvrT7MCYojEBIKGgQF6js1/cuUdc9xKvRwyxr6j9zo1OhXYcmttCi41MiEUKeM5eSL/yRYmfzxSLvG01c7z500OmDjhDNTqlcBiPCbI2RFJgVYnPdEdhkqg4QvhKCVlSKQOvv/EyIcjxOD5p67dH3qhbU+EzgBVi1QLMT5J5b8rDIWMzsDrASEiSSWUEO6QEP4lgVwogoxIOhRkSypZ0VlTrwd1jFeyk88WqwGQ3I+o5YEj+ldmrnZRzJneZFjWKifKCLmK8SyMhk5mS5GzSe73s6aq2RqrmRyhQ4x3UkpIccSBrGM1MwMMEBjRrOVf30mWI+4IUYsVfSH+D9A4A3Oc+v8BWK4f+axcA7FjjrgSqgnFyWOO2Q2NQXFaCT22WKBZrqpeeehwEHoshQjnDP3ivCsOi6UnLEZtzGgL9c+njl4Wx8WBurtku6XQ2owB1kjgZt+hqQQUKJeapu5zipEYysMQ08p4ZQRA4a4Pn8rIiSMnJQLuf/+hpn32umHICO1wAiOet8P/3vY38rvluIdSVSmWmWboyfcPo0wTDVcJ7TChe8WjrbXlTa7RYV0TFwugPAdKCBBA1NJ98o+1Aqz4zeI6GACYKR9k+lD3A42IsiVSniIBIYWq1jGUc2TMEGuMdGUY1DVjDVq50hFMALMOA4PhBQk2jP/fJFZQOCAGMAAA0DcBnQEqCAE0Az49HoxFIiGhI6GSSOhwB4lpbstbuddTU8ljUvzy7Mfw65gVUlT/44k7UO2bXCz7E/T+KXW/7cXc/+2eJBkZ3MfTf7/xneIH36vmq/i/RJ/1vpFaQHrb2EP1v33T9sw59NyGkChuepI8gg1NAjjAWAsBX7m+7Z/00TPejS64aIG5TDLmBt2DcynubFkjez4r6Jr3RiA4CtvLndVyh/e3KL2de5R8yZmOhOP1xk6pTdHaNd0V+mPOblhslJGBA6B0Dj57SZrlMuZ+kmVtJHMOwGICdNjfVoklFQ6NYkgkw/xC2qzez9E3U2ptTFDM/FhO884tSZL+zjwf1qTffuTmEp3aUawAh1iR8TomK7TtabwHsJfUgXJuTckaewDULagiNymN3+OzPvVNoZ389uV769wNPLEwF7VN/oQ6xGIDoHLbkX6REjva9GT+IyT+Z3pF2aubfFMBKO7ociKYcaVVVondzOzi/Xo0HX5/PJ+TrenmGo42XDTJ+E7DAyXlZ2eeAnl5F2PqeK5yy/hl+8XhTaYVI7CASU7EG2S/Ng405o/WAsBNobM9v93e5EgJz7W1OJqrKs13iNbGwrec0MdA3eUemwr/l8jl+71sKXxQiX/ds0KormlExPyfO1qQkVJf94JrbIKP1DGM9BJm8mpSxVn/l66wWqjOqo3z6y6rH1LMakj8e6Aw8TwRN04raEC7/hVNtYbJPtjWUxCFdiadVCWzWRk2L5d4gtG1yKE8v055zoLLfTvBWSbRuy1AslobYYQQIiCnTbs25jEKUYbPhWkPrtJD0VwxPMEjhWt1MLZWKMe+fziP7dEusbJRmpKGfq/VPFR5ascnL5wi/cMoT19p3DV1xHeMszLfRGOpJjtAfITENJPcgeLBzikej4YJpQFk4szxnlvtL7hCFHr2w28jY+gMk2BbV1SphG1vEb908QbP9MM72AknFCtq4lHmz4SGKQl8KhVMuPPppABadPzZZghoBMWSC9nOgtoucGW7be6V7jO1IXLm2JJ3C8cdYYsO0LYCCYvJXZCB5EsFpCw/mIM85fI2HllMVDXUv7K5U/5lId6kBIx+FSVGs2i4Chqtl182OF+MAU6lpl4vu2tPWj9VA8s//JeieeRGsfS5Pk/JGDOHLIL3Nj4e9Mz8+Ds6Ty4WhKERVgt+P9riHDLAOJwZUL7G4uuvFeuVFxo44ulk4d83BIa+/Cff4ja5H6F24CJS7yeFYqoBZ2fpNfRJw4PyCCxFTTfEx6OyyQH6nZ7e4YR+COuV2tGfh4BfgUfb2E3Jblzx97KtVpwCP5r5FjJLGPYMt47NmgqFYoF0VT2aAX7MewdctL8nm9untApzO2EhYX8OdZuRdB8DKau1QVpzXp8VsLKv6AKpAcVctO9du1l6IVTyRzN68npc/tsfBrw1ieIAu9vNKyKIkpPeFLq7WZSa8s1euwJJg0HXQxXQoPzpETHb7ipT9Fq9M6cR2zxIXD/CKpecntDOBw//w7mOphDcrfS8klDBpFni+3zcWUwGnyBHsC8AeBWSlm3ePU+F1kq9oRQ99gDk+1SCIsMyI7JyhOMEPn7R+zTqGEXj4JVs67Itv5VeAPhi9w8YIL3AaPl0Fqx2Xivl18X/9df5ZAgP3a2u+vdq94ofGudIUmGVjDft/VZRtuPHxK3svSfjhjQgKDG8fjaw0eF5pLnJttW0e84GaSlkBFsQOrzjJp1hgdivdlsiMyQ/t6+s4I9pcg1kGUTUXMhZrEYc43CkQlTZtC/y7BCBPE/a1KPffDA2gm/LwtOZr/8zhT9UuiwZAoqcuWhwvH3SusKsgc1ictoY9TRoju7GVNSjK3//hBoYoIEfHCwiRqr+jf/f6SwaT4lS7pGjFHbTkjPxp0mq0U27UFHRqlshn5WGCuzJdIVwtELKwnRkBsFBCAc4MfvQtQOgFXEriqFVT0I3Tj4GMOc/LHXvtwAm4eqtKkFI9oBacclwJUyzX8iFa4ZdZSxlKELTSWTB6HZY+Po8PAmaneFaIvgtcItlUVBBMx2ojH2ybC9NK0q3oc0bmNt7b2z6Jt1WeCriQQ2aL1WJptuMoLS9ys/WYehY7jBMaQMHX74nk4gaS0lJ1CQ7RkPvbxQjDgZLyyKCIha2oXLkzuquo7usyITu/3paNgdACljNp78yt2Ix78onkoILQPOEVKGvNxH6bQ3XW4scOLd2Hb5mmjSwcWBC06Xo1Qb9SvSCc/Dh02hmx6ZwsMisML8moqL2I6QrifDIIALOHQdA3IHqIanz2hkK8eO+e/nYtJfqXvAuWeSTHlKG496VpTapYP8D5Rx+IUK5pqmem0Si7bfk4hRdZzDprOFR7cPruJqBWklFhKZxKSWI525bDN+WVwdz2+q7FMKliuxczwtQyca4ElSSlnHfmGQHPbyAxf6/XNfz3K08XvC18xtUBz5oTxARJIrP7LTnutud2Cw5wOq6GBIQA/oRPyLnt5WAX5U1hwZGKhVowtTlomC53ZDTwdNtaeTHZbOfcmBUPZb7RawENUKLvznsxxmnnKN+DjO7qkx7z6Na6fRMOm5fmuUyMdulppIjtDGd0qKxL0qsE/W2Mai2y39kr/hPd3a2eAsIybU2YWqEQX7s8vEx8KhT43yabSvAumLpCdQxJz2pXTZcrWpjGkj2vzTN8onk/JJiSYGsnsx05s3V1GQxjQpFjjBPX76Wc0H+FPvjJKpegneXjNPImMgFJTrXcDwy9p2QDLvc5OruLluz9quse+lryl/OiSoTWeduUECl5CG1SmjKPjSAnsLjvZVKE74EYPtTalo7ja4fAuiz1z/CrrenzlhI9OIAW7GZyF95AjQXqI9Kv5N2Ok4nk+Bh66GcyPqr8RsHN8/TAzMTCufbNrz87hGmUvQAL3EI8wZThZE1OzXMEjraJCWU4nk9/YAWvke0yPx1DCB/hnhoZhYJ6YGCBkuYlJw3g/rinUpGKFykCLxpO/iG2gfzgIAxFRaTP9zrmyhwSyvAdOp/TpK34rak7/9R3egB45ngSudhOuhaCZOguJagnqd48v6z6mzrvaE8Q56bhMprIAQlvXTnxhRPupB/D+FnBO8Y582uwcO8X3mUkWH7G5jDeAs+zXnUQCx53uHJgo9ZB3EDGxnPwQAykKxDWP+xX6YgvKj7Q6bgO8uXHR6NzDK63y2YhLqK3qna5jOfBeRUf5C7MJarXxmjMU6bl/nO52ObeDGPj7UR4zrp1VqFNL1nJjdxg3PFR1bwboQgqRHknsDEN473p7PfFRVI+SbU505ZOKnCIHhn2eyhqAfX2HPpLxcQ9yIGzbXk/J+T8ofr0z8l4AD+/QEIHh/5ur121NYYozQ5/TYFvEGhGE5lZvZFduU9YGRw/RRuBlU19FqAz9GXFsw1z0AA0zlFvHkvKG05HzY5gqZlR1r6PmqePx9YIWVXra8W+C6HehtA5FboTjBcAUuQNIaSHnyj+wID0/KbULzCWpR7YXp/ZIlo0E9bolNtVIljZrXObp5Be7/H5VfbjIlSkqsF3pKEpMoi42OvCLJyW/rWV3DFwP/DZbNR8bcVzA79nQ7u/Rvz70jNPzLOQj6PfRdqFfx62cpaT2VhPpA6bGipeUoPST6G43/9wpysy0dGXgs7/Ba/YaSC697vBFxvt+uX3Ne4miXqX4t5CHHlwpYFDbSCqaewPGASul9MCVVNfCTODljXxIZqOiVonwoG8zuyU4bkn6RZvPg0xt1Cu349LWcVcLhxRU6NF4jTgV6cFs1itqmCzgfQYnPxVTTtKeqPjSVsgQCkIXunHgEZr+tu2Go1EdRNPuyxkYKipMVwqoPxfvGWKJEnn/M7A69t/uj07Ed4HqmAs6r8xI/8gWfF2A3H9FaxRT5DDORnGRGCAQiKuN+vk8SFUXcnqd140o3ifI/jBAJg2iftjMKKtn8FlzhCk+V2VNiDa1H1UtXD5G8hXb6rwh6l+4JLSn5tjbF60p83/4BeFjEQTQKerI6/YsCBCkRxzu3J3jGdNB96s+sJi4sAI6wd8rtSsM+XnLfAB6m1JT5C7IVMIYNKifx73srGumpu+zpNZ0aSuqO4C4v/H2Qm9o/QLHHJx8QBlE/3ebFUwG+8j8q2da6kWFO+GJH5UeuM7l/hiT7dmSvaKJ6gBqezSwu98o9uZ7OMdXTPrTi3i6dG0fIlsUiUncq4nSFY3NFJZktWM9S/RNzCv91iWJb4b9HN7mwpVf0FCvf/sjNsS6mRRUn9owB8n5GyfIQGsxFc4ZL31UT+NzWV2eJR4hXPq5OeV5jotmlYIncPhnjHY8oh5isXnrX0kuzNmxFJ8pn0h6IjTKTQHu9OQATbEYY0nrQNTsZRNUF4bPcaqEcVzxb2WjLvvyWUSyve9WmiqtzU2+GYsUkyfqnI229ZqN8T+LxzbML1TYZlhE+7RPy0dkq2+feTA3TQlOyz+ZsFGGqw0At4pBWkw7N8nbgZQF8NzmZ8zLaqi+0xqxtn/spcXCIELZIX/2QbFTWdkhFAvrXvpLa2tBIDBjP02G4pTu5DvPs6yJ/q6HBaYpCYbE6BvtadVNqvnAW8eIlhc+QqbPatLrfyGFZWpVeBpGu41SxTqbhy7c+nYCRfpx31GM5q318lYYf9o19MO8Q/Rr2Vx223y9B80Uh5e6/yGSHVlsYAgxMq8M8WmvJ1qxDqVCdp96f27fh9eZKYIFiR7QPnG0XRDRx3VxDJniF05alUV/YJEXynlFkrstSOqIFwI8j56swQ+/qT31uYggc6dVxxa0lhzmLlHYtOya2aAQiQGMpMn+lszCrGEPGzrDBn2xqpDZfU9jPOtd0MmaJVRI6lvahmAs0TzP+YILs9wcsPSKUdecb+kQyZzaFlyWFwS2Dg6cpjYo9BY+9SPvMGa7l1xyKJGOC96p+6mDq/lGsS1CN0tdNFl+ZCqPBRNsN088DRZo0ZFjiXnwIYSzruNgveIurMCfSqLG5s11dPfNk/aTfA/GblQCZe+Hw6xTddEqmru757MV2AyYqRlf+/VucbLDPGdjkqqxo11o7iVNPrudvTNzbZTZ+/kAOTih//NA5MXl00QjmTGbpmPVV4XV/jdDDTs1px2hv9zISBvWGzqzfcvu85vkG/Ip6iO4I36luQ1eilj7z/buWxDIwxaYpuqVC+GxAMD0somhsj76y1SzRLeFTipv5wf+mChRuN6PQnYt+lxREzA4qeNio7RHwkCvx+AABoMHXcnqKVTNicsGSRFVJjHhbT5B2lYoo/Jx8eLCov2BEZmYZ8X+aiIi4L9J1GllMEIMv5fkr2M/VRZkz/xMe7WQLEsIPj2rcMiMvS9y93/0l9S8u6ndnwXHy+foU30WJugb50OB+Fk3hbMv91//MpIGS4/2KuNqXdoH7MFDq7uVElYK25Wcj8LCPFrx9x/Tt1/Z/LTT1/snSK7cI3hEpxOJCn8Of1GHW47un9cyvO7NEehBgZFXJcxdtua+Ng1qoQhY/ncXWWE1NZFs/IqWbGbrY/lrAAvULMuR/KAKwMUrs0I4bC32/i52cilBk7y8evcvq70l0WbjobvshiR6e95yyPCAKi0CDej04wyxxspPg2nEv6r3iHxVIE6sinDmwvOT+w3oTiK47C8D/OYzjs4JpgBv0gsCkYpDjOZMKVGrr8EKeyD9qCrd70rK3XL6j1Vy0OA6hPT0qhh12Mv4GDiq4mkTidE04eeLM6xTo1Dl/nMmrMDOh/RTz60xXasl0TITK3omH1pP2lWR82fceUYkTILuEV/8/OupDz4QYbYrBXYIdHgpCWZmcl838zpsqYfs+pok2qpr6nfc5reXnC0V6eaGR7xes1SKA5w3gcXYfIdiN//ouQ958oDh/urkrTnSIRAm5nvt11yDIKkDBDvXQ7OKUWu2HNbRC8o2ktKq2kMpqNt9gufkL46Cm2CEy6Qq2LU/1YfAsWwisQF5zXKxNGy1ZSiirZ0pa1exzOfiDdiNhPCp4ehSJBBQksCrjeT8D8vuJgkQjDpvgnoDw1WpNwzWu2hyFxMvqTERRcObDKSOt85C6ZsBZxIGn7H8PFkRl94PySy/flwZSMnG3CuxGD0CZCdxKN0ZXmjE4+0/6zEjgLNxhCv01S1Z+bZ5XVtQU0e+aqIFn+y4ClChsdk1ZVp1ag5tP1fDW0xjbMp8WLT//Hj2fDTPt4T6UBJH8RnKT38U9+6IXrhSDFPW/1ov57KBXVe+5HYiPJFqb+NUE/tHqBi/tQYweP798wecXeOrjEKy5I9/72XNDQ+wmESkAZCuAg3gBQD4eXMhI+Wd8iU0cNpaS3QTtBxqQPq3HYc8tPvlwHGJjnud7+43Za07Nb/JQMNlsLh3HHNCD8nD6s24B/ev6y8vVzHuxkSl84SqmUK8Te+89JYlIINeXwM2Kis+Z2SQWjaRjAK2CoELGgugjw7GFYPmOHplQjXBUE90RoD2+KfvP3TqonuokC3UlSSRPF0vsjgELmPrsbRiZs8tg16CmJZnx6AsUiC/BiWNwVwxG8rF69pgG+4LY2Sxnf7SjMZclj23gkJQ3uJFgA51ndLX3HOJlj6WNPkE5xIqkxKRN4+PyGBMMgkacFHKgY1D81jvqvhUTtijZGYGJ72PK1AkwTYA4cQehTH2CqxmCddf4T7lBPxL//kERLoiikG0c4uzaTt4mYW1wJ4hYfh4vVqGzD5FoSm/pve1EiKVXfHOyAEKprlgNt6WzK7xtvLR4RDp1yxVCluKKm+BxUPwpQETC5hfga6lA4yd0Xy29MQh0OqcVndpHiBCfqU4A0AitZRL436UT7s4MsUfvtRxhAj+rgxK/3jLEgdwbzlKUYBdNlOWl6m13oVBlqZ1CHKI5xdOqCnkVDMb1c96npAMHof10J6oyzmC/Wq5YdxC52mT/xobFyfGxOaXexqI0tkxsXB/tgYfKsP5/BDqymQ0qxT/90hfy5uDrIYXvdnysBgAsMYetgj7lyhYVbHzgdyK5nY831a0dXuVBWJxj/a5YRLVvNpMT2wt5DXkaCcUFAYQ+0JnMjYiJYNwhovxD30gPIpKQHrTmVKSdzNWS9RKNaILGzG8Ij2F0FfoZYycMsC8Z/CtB9Tub+rao4bnqNOOMBj2wFrbdu5Kv9u8dmHqxrg++XwnGb/zAsnWOC8sudLe7wHC7hEvrjFsvUkZwbJ125n+VJDeyOLGt+sSF2GKWnl1VlKCynqKz7MELDD3YOP7n34SVUaVM614ctus9kYVWzhxYvXHxNxygyK34gTfjdFV6uVtCeMqvS41uI5c/lhj4qEVbfi5H0fc4H5l8vNG/Dnp3CMBGuZ/pEm9L1M3uyMJeq+yhQ0EPWQFOovG0kXVOV3itq7qOrYZUm6xvf7Jr7QYF/XXc1ueZfHquTks0T1f7xqNt8vjvdwqFmo7svlYaEJqm5JqynZoabalYeRXmWvcVufqNvC+ebSDkrNWLSX5z6pFNsGwM1zT2m6lBtxdNj5eyTRbIiKL4E4MrqcUdiPrwivspx9xqtlo1UZcfEU7T6rC6M9mg5RQXUeX7g+l9/W0o4BmmMeDccE9HPtEYuRO+mFD9kr5XTMxn2LCz6rxhNJ4eMrxq2Fa3A2fhn5QAUbbjlFU4UIx4kuDEUhdRpzz2POhGE2duzabS41QiS9m8i557ocUq7wBtzYTkojhkfjnr/ho5GNk6m59+/EdeD5XTDmxSlsAoWFvulKVr8yoh5udK9LvU+Mo8kxu4vcRtZsJAB6RQv9LV/hxsYU7e4idWk+3SuypElsU/fUaN7iGOIbnjz8q4oFeKnCCi7jWzZqUWoX0kzdh9jKqahrzNrjr3dEOf3wFkKr7VRVQY1X31M/Nsn4T3+YZG9LiExiGNDWeksDd2S4kYzWlnDyswpbNWVxXcii3V4x4tdp/cVByLtjYNcVOC01UNi0WR5A7F78DN+i62K27dgfDvb2aJLH6WEdZe8Fcz4+vJeY3Wz1SXV9hv/XHVC9AXnW75CUQnibV0TAfznI2vZJX8TF8WQcldBJO12ZEq7k3cou4VY9NHjMd4vcuJn5d089ORgNtSrkKT0jP5y3wJtFhWiZYkwpeYfRyFbWSDX9AtX6Gx1MPxXHO4W9vLwTpjCMLrrkjQXhP0boZj2SvNJSSADZ43hX5/AD7QKQltRwkjnBn++g209389ORgbKPJAEMWH14AuoK/BElWlBoNrODJ6BFOP4HKBa8n3Ynk0CH4KxfgAbCOpSHzICffNvdf3MsuQ9EQKtTJgKZ3Qm+dZHs461U2VH3+xZo5mpbd5okoDcuaM3bvaoHQn/py1JJsGUhTGML8tsc+dsnQIDq024H6l3BwcfxT5hDokroZTdC6MIiCT6UYdxVCqkmAwW7c3CTBJ8tOheBRYxM8Tjh0AWyaJzC2ptmPWngkvmPzHxVABjgBe3u9RNsPS1cbejo5co7tOGaA8uR3mh6g6wVZEwS6+1ksZofCBYU/9G5FmSq7fQMLbItD3Y2NnL6Dp0WUV8I4Ut+7oyWS8u5YMy0JEtI0XTCo1/taewBcBNJE4B38v4JtPr3+Iu7BJBC83EMxuqh+6C2YtRwYAeYfY3qEehe8hi+Fj8KkcaDb5+svXtkKJCMIfsEe9VtI8Hsji1ds8lTnGoEPmqS0G6vD3FqXSiycex+kY5AqGvnkEA7uoAisZ37vcDpNb5uF9ieGssquHD4p1qomaa1/l1OAb3QymzT6MHqzOxwy6rFi+M4NBKjO7Qtyk24Cnew9+k9iy/075ONgwDx/ZmZFde9B9iiIByCf2gFy7a/WImijcZGoOjDC5UY4NVJ3uEK/ll9sM1i0ezH9awIDIGB/OTZAK//CYA2wxhUvKQeFkbnBnojTYHhQo4+E2lNewEhYFQPg3MF8LN9TctOIOmUvXArOHVGccytGntaB2hJgwvZxX/Mq7cmGYTURoNyjw8+UhKzg4OztB9evv9YaMxvRtWHXQt+2g+cDsqAtdT8iTfIa7BER/CyvS/PYR9uWzlcDBZvcUgt9qCKqefuj86GoyUNYlVdRCz6m7Gdx4rgZaHRbz8gQJz6I9cMb5pTTIcvwpR3PVUy6jJ9M1k/8T1tcg222mfYRJ6MfHrmSZAcrmBu0T9p28pC6m429EWVFCc7Qw2XScVeQqZDmKYCIVxMNSywYPagVw7ZrXcS+x8FPkeoTkLsZUxEHvdv5P2mzD6+bhxioiLzlOd0q3gGTyEFREX9jf+WIFnRPBA2wo8J4DYz6bHhUvsXhw41wUsKPk7PKHlj/yvdy19+ka6ljRMtt5UCgGGRFgsUFYgD31s690hmhrYTQRkqwp6TZ/rImKKnjwVSKwNLwWdVXG1MzBudmUKLcdidf77LZBMdDMpNldXCVP3YHd/9cwfXHSg3Hnglu/XzFDfM3OU4kHrlvxhSUdin/CgkartG9HwiptGa/qaJYKo0857/9U2HjSWNbCfHduHyXbfKvBE92j1OGPFUvCteFyfpgz/7d9dd0Mw8tx1u7L/6gSO25MzBKdWThr4XuZk0E3oUQ8t2NYKggXtaOumWNNwqWIrGS5yKH7vZkZsLCuCH9RuJ2D8Sa3Rg0RYoXGqeMaO+6+We9iMDCPY/gCcWX8dATo6mgQ0sjzGLRr16ZBY4/RyS02rop5C0AfXJOR4t1PPLao/28y5KqP43c8D39ltQt1D1pE6pI07oqBxRVnE1UIF9ftQWU34/mvmD/BZqKlzDyRlCcPOGBsxn2w1P/unQd/StheCeDwxfnpg3V/SF2wNGSBgDtgyTlioi0OmOMrFiGBgOEC4XNjuaptvNyj+Ge/y4aY+MCYNqfMwL+Iq/38jeLmX3dYhQmS2UmngQrCQI2d3Ed6HBKhqEzzulrzbiV5rOQk7PYpr67ai8EMUWg9lMqh36qV0yNl/LLn/aDHhnwP0YGn5lX5yGpzlzavsD6FWrYSENlwPXu7KWtLuXQ+fnGTsPZ6rp5Yg+kmm9iWURqI6IkUCakakpZJ8gacl59QvCsd//4uZxXxrCHtS3W3+5dk2TbUiGHJCMwr9HM9+wQLhxsh2Xl8COvsh9UvY4dw5itgb5yu7QdFatMVR0yu7JYrm6/xDfucEpdfexLi3OKscofxkLVgYLC17G6uL5EWGm9eARWAn0NCNb+eCJdELvwg54tyr1RCxvPydB+if0F9+IphHQi5yXNlg+NLnwNL2+jvLs/SzvaTifK+9QeCrCroEJXahm4Wwi5M8eVZGe26iAuNvDYs7ZsN3jUl4PqPCYx8oCcooPYOpwE0Su0rzmvtMQBaorX3lxeIFoD8WKxytriP67ZGtlBagougBvNYmTj2jPebX+DCIDeopZYIyJx7wVK2HzlA/AMJK+QDxKd7j8hgi6pxgprIgadzN+zRCIFjorqQyg3Rsvdho7fosPhmHLqapka3NJmYmPdbn9Ilp6Zwa1guF7vCHRWbPix222ACWrU/GVDCz0mnfiUip5E913UCjNvKnf7CYlI2he3dpyIjCwWMVGASYz4aO2if1CIbcenpu9tgu/+fbAqiBO7CgD7YB5eKsXlp8wb04yUhEThloaVAsyBww5sB7HkhA5PL72aHdSw/CUwK/heHknHr+bt9Sq2TN7tnSU5kN64qhKjQALQoaTwdg55G2Us9iT91uACb9NNl5IZYn2rZkXWp0Xr3cMZ8k+N1DFxpzFjVuTFzMWcM1qT8/yJDe1hf/w05CWLZLFpNyVgDFlJGjW1mCOlouPQOEgAfxRQGIpckRf+wxnr1zcV+KKzuEW0wuDm7QHZGzbJDhFDtIdSyT3HmZ+nH07ISl0Oz51MmKFjdE9swI6QX+Bw53G486DHHjG22L0XL7pKfUPBguaiFmnR6cWg8ng1MbIrtw1xl2TsCWCC7oWAH2lrs2mh70o+F1ez+xbaiGf6dtYdS53FlhaOEU8T9Av3lSY1KgIYmh4FaibR+EGUmnHbJjxrqB8xqiyROOwHXkoY+aScZr8QAtb2qz5E/BQJjdTDAsyNiyc/Vw3W65Vrnlt5epqiljnEnGkIfisw4bq7E8esgTBYRGv8fFcTkS5R7aInQ11pLFASlxSSW0SDLlhKvIxcDn44pnmnpelcrCG/tb2IwVXxRu1f80MMBbkfC34ygyaJQE+2QcZrFhiRVxgJBAdByejeUgP6UZFf3b8KFt8tpD7iHZgpPphyoAVaTCC6vq+1MaEHYlX8jLwmc36Zb9csYPgNuhz0ZEipzs2MSMHSaoyJDXaN4FnBaBpDfolOOptw4Oac11p1OX4xi3D1vy2LSL+OBzR3J0K0ZMNROsbF1ErvC3ksNORf+/poimqkiPqDdE2cgOGpaaJLL5l+lwhG/drNot/Z6zTsh3W3qOi/r4xrT4NdjEQAmEx0+sOpxaifYOYggRSijBOWafIEu59aWPt5pb5q2Sqh6+O7haJCrW7gCrYb72grG1yyEe+SAgLaEaVfgl7nS5Zv/OzLuSXQWMMP4pPiFAERhVvah0Z3nOqnXPPc7lo9rw4VgkOJub8YjgetANm6wiNKCbK52M0GFsWTIq0csF+iHWWRIVHS9U/dKJPnQnhEEP4wkPZCLHs7Grmyg4Nu1kLZNmvRLQ+SrqNccS9BBRD6GLnXCjf/NsgOLKDMZ5/JFsK7CL0+mG74c9MuMo9SzL1ocDkhNMuy6kTLJIqZoWToXOGd41PP/oQO8nO6AP3EIHdT3FAmWZ6CPn1QVi/UStlEwW848jghZsc135mXHiNwGyZk65aEOEiNabWfbMCopKVGkgDW0G0i+SFXCU6dw2YALJSuEOnqqzIHVJDRQ9WW/GmE+d6SMsp/wZITKawQEmdH5Vhh/k5HEaWd1e0dzkw7n8lWnGI/U/rqtlUx8fJ0WxmlBmve1+fPcsVOLq2woO2aQ8BrL+bqQiT7VKPrtIVedin2W7reS5x32JgFgQWk4nnMmEx+D8ASeFmvjPfR/K3Y4y8ouuIsPYdGedGCF/rkdH2TEzKmNlWEmI5jOQsVQsnKbt5ykgh/vg7oOusjeWpzCC6MmDY03HIvks8XSd6hs56zDPU+/xhqhMwXyYKETAmttqfHNo/7fVqTVSPWmaNPmld0sASJJcdAo3rZcHDyO4QS2hHZBRs7WeXjrbYABVoksra19PICPub8n9zRQXuILNc3xSU+S+SSriRJan8pixK/d3rkQCKoaxncbZZ5ZWQzeBLG2uLxOoiPuKnsoJRJXFroymr4qc1ytq7ok61BPi/hA/fl/p1jlGGmnywpEMMT/+sDDprbX995ZfxCruRkhKuN7CRrJ1tyyIAFmSKVTk0GgoPu4A5WLpZjAFjYvWtUdXlVSTpCrBmGyvje6bvokz2eBCyC8x0Qo+lbMTK5oKMGwiLqDMFD+cGBT8w8wQtkHLWC3Ddsm2y8t/+41BWEsa7LUQmt3fJFbcZkptVVRIyYOuQlsZQjQsPcu4emhcq1Zuk7Pvq7H1t40XXKGipdhpcYbyEt7PdVLIdfOQCtwTJd6PgV+nxOLMiCadByc2su2CsJl6MfJEVR7gU9NWxcw113TGT3wcoBMVAuHwrLcuQ5/MvJdwaE2M1kW6iKv9aXC1Pe/WqRJ79msvr1JJ3ddsTMlmHyo02ZC7+u0xDSI0E55J8I5ZvQdQuM1301/hMCZ1+QjWpI4BDwQlgxORgv51MHQ39NIOfeGOGq4LMSFZh7MbNz+dL8McrIGUU936CQfxP1hotazbmMP+bWj3jRFIxMYl97Vuu3gJeYUYDDCPZr/33v02zjhvO82JlUg+j0ssB/0nsMhp9ORtGVLXE4D/9e3TLkdWftAr1zGSRryxafF/0T750bfLZ53zzqI91rqf9C322BaEYAH/8zob1XTaOUt/zTvlAqR1sFbFADGKjXZhfyR2Qthhld7DLh/QVqJlvmvpi6s3UefKau1qU4AFRmAR59hvw1t+gqq1ctFNQtwLYOT+89bwPNmur3xMG4II5p4D1Hx/p4CHOtOHxbfltiTzAJYyh3IDH5AjVEt4JVVDYSBFmIQar5NJK4o//bGM8qKgbw4DEnAVgc92vO+DQBUXE4X6RPWMj/g6eo4qgMsI0X3Ni2rqravpj9bsEKlF3ocZsgDbSFYgW84u3CDuWcWveV1msldg3YnnxeH+1TZP5U4adRkIEOwftUBjYpU6TkfIQ+Zj+PmfcvIGG/GLfYhoYdUXk0y2UcgtHNpZYBo/O8h2lunCFNzs6SaNHnNqOGLkeG2lpQ6glsYsQjQiuE7oKH5f07ZDwv4EE8RXw3r6x3iDCTxV0Y8P642q5TDnLdfPfHaOxQwboOCS4oqlSH7/IDT+ZApMQVBYkYw87nw5jUEa5rYIjUIAqyGmpb7M7B1dHfHvrKfU39VBasSUou4wDPLFS+ss5lb/5RsQiBDCkQIKFBk9lyToASI3FbD5XIMKRIzDFs/ySLPWlektROKR3xT85Q2j3M6BXLO4Dym4wUAAUljSxEbN803egKnUhvDDTMDXwUQfV6oKFcUe3Oitky8+/17Kk5LBGXD5GR0XqqDMWyxZfp5griQqbabAVWVfQruVsxQuhofgz6Ewowb+B0Loj9BJ/vCezvlbeLVXJY7seB6Rlu/mr4lEOxuT2hwqxDhCBXPePiQ+tDz+TifaAPsedGEh5gc3i0M0dpCXuzXlNy8jDmNbr1M9AMoyvG9qOelSumpgW/vN1nZAUh4RZI+oP90/VphR54cIheK3eAuvD3W/ZnLeBNvVIjvATYmAtzwXH53jd+RzOaez3pJcjRGSGOXJEc9/wB/MbPyGDrWSk1+kqMnze9FlAkWCd8bIl2Lz9uTDPS3sW57pUWXeq9GEYdZfueFDDeChqKy0lbGhFFelodha6vVYwCH9e8Su6UNUHfsLjVuI6KhKdP09DlO46cEzzp3t9FROTNl3Nil+Nw+bTePf0R6sYJkw3ZdH/6sRpOsxL0dmGT1SU/u1eOftCTx6xfTh39w/XjuAJPPznB/EHEeLTDAclX/arnaQxCldHN7SaoaXe4eEaINP6JHFLDZhbIZL156v6fi6jX62wad6mBQiEWP/T79ePJ/UWLmh0mVxbyYsAYqSrkXcF2faS8Y9vI962wd5lpzerPhHCEE5cv3iLjh8myX6WMVa1k5r1uRhIEEzSTDX/S3h1Uog3afbGJprX8L6+oVWu+s4qz+5WBlVcxR2O8lnGlNOLBso9pnI7wveR1GET8z18hEoInHtx5Ud8vJVI8yvF9zv8dRNnEeggXN/SHv/Gtf3vG+OjgzPPii6yWn4BA8arOSS6HckGxixL8a9qRN16nt6KoM+oJtI38tz4QqVxv6xNjMWE9BAsWXflxKC9G2+6U8DkRNbhODk+36UNTMzgSJ8X9pZNL03naUNIbovYAuwjj+qxgZl73jJr8S+neg8NnWz4GM0sBfEP9DA18Ke2Mr15+ImtTP1K71dceqZ4fYHd+RogPiTVaEIf2DGyPL0pO1JeQym9R4i1z/uXFJFXk0o6dmoyk+HS5MKzcLEdR8houyjduxR7mUaSCNec0JqjQ/r2JBC+UOm6GnDTNWL9Y62iGaKFuHTFwUuA2QXky2kdiz+Pd1hHkYvi2/iSqUYotN3Ku/S1W00UcmgSdijru8gUtVyAQg6lLjjp0Ispj5zXE3jlLbg2YMXa2BHI898naywaEgsVN2Ncsaqb42Zm8eUP9mITBqywNrCmTFJvvFJsGWkeL8FCToZgXpP9rDjs/Wd6sEqsxoJOodUVNY8rHaE7f5IKJ4xaqa3rIxvmuC+zqjL8tQ7qlxSePPjzkZc8xh30j84iSXJBFQUNL7N8ptVr5eHodz//CFvsZaVMQtLzTaAIx2peYl87n7iAIaO78U10UnLGSqOM5eOs02ZKcXjOuE7rCGhsEMNxRBAJafJrAeps5tWrHdDPLbI99w3KwIOO8Vfp+DptAnli7zBpSlqf+XyBog5RI9pIuDWPCFoBli9T8wx+H+MbZ1vxgJcoI47+R5MStQZPi7+FjSQxoalzJd9xsFchzf4blmAHO672vTLeq3kfgKTJxTIekAZIZ5qCjyQ+XKmeNy+hu1cmRiQy5/phlJF56hjGlvJF0goi7tVgceyGdrfqykWNu+uyPD3y0wjmrXFbO3h1FG/b+E9EouLjVTxKFpq7gOBtw82Sj+iK8KLbs7pg7Ut1K4zlkIOL3PN3GUnYMCzaQ4a+Q/gAOHs//fubnb18r0260yH7uDDVkYHrBCeIqlwq5EVm1e8z7oJAfFlvp2RoJzVCl9yk3cWeyC/qmwFDn6GGpXRoxmZNefGo1ehnUHNS19SglQIvetBi8AyqcS23cqoblJBnN8BFO9LAMeLp10IbZ9R9rYQ0n+cQCmTrDavq/rdOE5kkEMN4z10F2xAolaAEsf+XWH64nEn4vajy5YTd70SW4L62jnwGHC0FIa5uenMLwCXWYWn/QHb/bAbvZhY1cpR3xlq4g5FOw9al2/T1HgE/KO5EBft4/aCyzPlYD+yDthfqzG4hbQd/1tsHOV5ZNQfsv18l5vj2IlNq/D9yXpDqTCWUnz2rncycA5PBya6SR704uPdtueOysXNiU+TYfbxA3dB11kaWPIv0pFZFqQHDfkDN6lfuqf8TortES6MU13XXe5AE+LTSM7lm2qtj0Sw0T8EGT5Y61OH0/M7hoHnjKd5rjnnTTb1sYwL7pAO2rLmE/+R8WQH4jT6fai/3C5Je7xLFZadiLeo//BpiLymfL9bfZd04IlXzSWvXm5f+qPRwh932MJjbJa6V/h2OhzsPKzfhU8zc0FJmdYZBsKSWaFa+jRBeR1AsB2oekhMMbyNuKX+b6yRf4ONprfKITwkxYUV+1oHnkIO4y8mDg8+yvGwMW18BGeGw2UKU3X0P1rsokRbT33Taz5x02vSF03UgJ2m/PYQYcsUHcQ2Nr29X4JsM5A4Ow1M5gtemIhlnpHKwhZl+bdGHYzqDm8CHvezBZTVIaIfWrYf2h46FFfUjSqTgvh8lXWMdNxaNv2uAb7N0l8N09CG9bP4bYC1GqxnY+eyNzfWdF5cbQ2pzIASa24f8NntCN/7+G5hSMRGap4EBeRz4CkYNjsTdddqNcEseCbl0emrGW2tKu1Z6E0tADsegRb0xPJbX/cPfZoBFidczbT5S2VIv5kW1YR3VHWvN5Tzm1WDEz4HWGrBtx24WmPcZ0ejV1PGRGQAAAQHtmIj7JFQeuuhcQ2zIR07x+Ghgekj5fPc8HZtudvD2aIAGlSPMfwXacDeqXgvA96T7VDa7X5C24GDdf6Z+2xHjJZfDpeWL5CkDmYef9ZVUAtpZ/Jq+KphoITlPFXuCd7qa9j1mAdaYvqOXa/iD6etONLepRhVL2ga4DFVQX3r6Qk7LoJhWNNl7NARSSmjMI0r1FEoLRGvxTTsuuUaUaTWns4AAAAAAAAA",
  "v4_fit": "data:image/webp;base64,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",
  "v5_athletic": "data:image/webp;base64,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",
  "v6_stocky": "data:image/webp;base64,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",
  "v7_overweight": "data:image/webp;base64,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",
  "v8_very_heavy": "data:image/webp;base64,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"
};
const CHARACTER_SPRITE_LIST = [
  CHARACTER_SPRITES.v1_very_slim, CHARACTER_SPRITES.v2_slim, CHARACTER_SPRITES.v3_lean, CHARACTER_SPRITES.v4_fit,
  CHARACTER_SPRITES.v5_athletic, CHARACTER_SPRITES.v6_stocky, CHARACTER_SPRITES.v7_overweight, CHARACTER_SPRITES.v8_very_heavy,
];
const ROOM_BACKGROUND_IMAGE = "data:image/webp;base64,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";

// 8 тиров телосложения (вместо прежних 5) — привязаны к реальному BMI из Роста/Веса.
const BODY_TIERS = [
  { label: 'Очень худой', maxBmi: 16, color: COLORS.violet },
  { label: 'Худой', maxBmi: 18.5, color: COLORS.violet },
  { label: 'Поджарый', maxBmi: 20.5, color: COLORS.teal },
  { label: 'Подтянутый', maxBmi: 23, color: COLORS.teal },
  { label: 'Атлетичный', maxBmi: 25.5, color: COLORS.teal },
  { label: 'Плотный', maxBmi: 28.5, color: COLORS.gold },
  { label: 'Полный', maxBmi: 32, color: COLORS.gold },
  { label: 'Очень плотный', maxBmi: Infinity, color: COLORS.crimson },
];

const STATS_DEF = [
  { key: 'physical', label: 'Physical', icon: Dumbbell },
  { key: 'discipline', label: 'Discipline', icon: ShieldCheck },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { key: 'focus', label: 'Focus', icon: Crosshair },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'career', label: 'Career', icon: Briefcase },
  { key: 'creator', label: 'Creator', icon: Sparkles },
  { key: 'social', label: 'Social', icon: Users },
  { key: 'mental', label: 'Mental', icon: Brain },
];

const STAT_LABEL = Object.fromEntries(STATS_DEF.map(s => [s.key, s.label]));

const TYPE_LABELS = {
  Routine: 'Routine', Daily: 'Daily', Weekly: 'Weekly',
  Bonus: 'Bonus', Monthly: 'Monthly Challenge', Goal: 'Goal Quest',
  Event: 'Event Quest', Recovery: 'Recovery Quest', Boss: 'Boss Task',
};

const TYPE_COLOR = {
  Routine: COLORS.textMuted, Daily: COLORS.violet, Weekly: COLORS.teal,
  Bonus: COLORS.gold, Monthly: COLORS.crimson, Goal: COLORS.gold,
  Event: COLORS.violet, Recovery: COLORS.teal, Boss: COLORS.crimson,
};

// Группировка активных квестов в списке — чтобы дневные дела не шли вперемешку
// с месячными вехами (иначе список нечитаем, когда там всё сразу).
const QUEST_GROUPS = [
  { key: 'daily', label: 'Сегодня / рутина', types: ['Routine', 'Daily', 'Bonus'], color: COLORS.violet },
  { key: 'weekly', label: 'На этой неделе', types: ['Weekly', 'Event'], color: COLORS.teal },
  { key: 'monthly', label: 'Месяц и крупнее', types: ['Monthly', 'Goal', 'Boss', 'Recovery'], color: COLORS.crimson },
];

const TYPE_XP_RANGE = {
  Routine: [5, 20], Daily: [30, 100], Weekly: [60, 150],
  Bonus: [50, 200], Monthly: [500, 1500], Goal: [100, 300],
  Event: [40, 140], Recovery: [10, 30], Boss: [250, 700],
};

const PENALTY = {
  Routine: { coins: 10, stat: 1 }, Daily: { coins: 25, stat: 2 },
  Weekly: { coins: 35, stat: 2 }, Bonus: { coins: 0, stat: 0 },
  Monthly: { coins: 60, stat: 3 }, Goal: { coins: 40, stat: 3 },
  Event: { coins: 0, stat: 0 }, Recovery: { coins: 0, stat: 0 }, Boss: { coins: 50, stat: 3 },
};

const DIFF_MULT = { Easy: 0, Normal: 0.5, Hard: 1 };
const SKIP_REASONS = ['Работа', 'Поездка', 'Болезнь', 'Форс-мажор', 'Другое'];
const SPHERES = ['Career', 'Finance', 'Knowledge', 'Physical', 'Relationships', 'Creator', 'Personal Development'];

const BONUS_POOL = [
  { title: 'Выпить 2 литра воды', stat: 'physical' },
  { title: 'Прогулка 20 минут', stat: 'physical' },
  { title: 'Прочитать 10 страниц', stat: 'knowledge' },
  { title: 'Записать 3 идеи для проекта', stat: 'creator' },
  { title: 'Позвонить близкому человеку', stat: 'social' },
  { title: '10 минут тишины / медитации', stat: 'mental' },
  { title: 'Разобрать 5 мелких задач', stat: 'discipline' },
  { title: 'Записать сегодняшние траты', stat: 'finance' },
  { title: 'Прибраться 15 минут', stat: 'discipline' },
  { title: 'Изучить что-то новое 15 минут', stat: 'knowledge' },
];

const MONTHLY_POOL = [
  { title: 'Career Trial: завершить один крупный проект', stat: 'career' },
  { title: 'Creator Trial: выпустить одну крупную работу', stat: 'creator' },
  { title: 'Discipline Trial: 25 дней без пропусков рутины', stat: 'discipline' },
  { title: 'Knowledge Trial: закончить курс или книгу', stat: 'knowledge' },
  { title: 'Physical Trial: пройти месячную программу тренировок', stat: 'physical' },
];

const RARITY_COLOR = {
  Common: '#9CA3AF', Rare: '#5B8DEF', Epic: '#A855F7', Legendary: COLORS.gold, Hidden: '#E0B0FF',
};

const EVENT_RARITY_WEIGHTS = [
  { rarity: 'Common', weight: 50, xpMult: 1 },
  { rarity: 'Rare', weight: 30, xpMult: 1.6 },
  { rarity: 'Epic', weight: 15, xpMult: 2.4 },
  { rarity: 'Hidden', weight: 5, xpMult: 3.5 },
];

function pickWeighted(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    if (r < it.weight) return it;
    r -= it.weight;
  }
  return items[items.length - 1];
}

function buildRandomEvent(s) {
  const weakest = STATS_DEF.reduce((min, st) => s.stats[st.key] < s.stats[min.key] ? st : min, STATS_DEF[0]);
  const openGoal = s.goals.find(g => g.progress < 100);
  const tier = pickWeighted(EVENT_RARITY_WEIGHTS);
  const templates = openGoal ? [
    { title: `Rare Opportunity: свободный час на «${openGoal.title}»`, stat: SPHERE_TO_STAT[openGoal.sphere] || weakest.key },
    { title: `Момент фокуса: продвинь «${openGoal.title}» прямо сейчас`, stat: SPHERE_TO_STAT[openGoal.sphere] || weakest.key },
    { title: `Внезапный прилив энергии — используй его на ${weakest.label}`, stat: weakest.key },
  ] : [
    { title: `Момент фокуса: прокачай ${weakest.label} прямо сейчас`, stat: weakest.key },
    { title: `Внезапный прилив энергии — самое время для важного дела`, stat: weakest.key },
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  const baseXp = 40;
  const xp = Math.round(baseXp * tier.xpMult);
  const coins = Math.round(xp * 0.4);
  return { title: t.title, stat: t.stat, rarity: tier.rarity, xp, coins };
}

const TERRITORIES = [
  { key: 'career', label: 'Career Kingdom', stat: 'career' },
  { key: 'knowledge', label: 'Knowledge Lands', stat: 'knowledge' },
  { key: 'finance', label: 'Finance District', stat: 'finance' },
  { key: 'creator', label: 'Creator Realm', stat: 'creator' },
  { key: 'physical', label: 'Physical Lands', stat: 'physical' },
  { key: 'social', label: 'Social Isles', stat: 'social' },
  { key: 'mental', label: 'Mind Sanctuary', stat: 'mental' },
];

const TERRITORY_STAGES = ['Пустошь', 'Поселение', 'Городок', 'Город', 'Столица', 'Легендарные земли'];

const EQUIPMENT_SLOTS = [
  { slot: 'weapon', label: 'Оружие', theme: 'Меч Дисциплины', statKey: 'discipline', icon: Sword },
  { slot: 'armor', label: 'Броня', theme: 'Доспех Тела', statKey: 'physical', icon: Shirt },
  { slot: 'helmet', label: 'Шлем', theme: 'Шлем Фокуса', statKey: 'focus', icon: Package },
  { slot: 'gloves', label: 'Перчатки', theme: 'Перчатки Мастера', statKey: 'creator', icon: HandMetal },
  { slot: 'shoes', label: 'Обувь', theme: 'Сапоги Карьериста', statKey: 'career', icon: Footprints },
  { slot: 'accessory', label: 'Аксессуар', theme: 'Амулет Общения', statKey: 'social', icon: Gem },
  { slot: 'artifact', label: 'Артефакт', theme: 'Свиток Знаний', statKey: 'knowledge', icon: BookOpen },
];

const EQUIPMENT_TIERS = [
  { roman: 'I', label: 'Новичок', rarity: 'Common', min: 0 },
  { roman: 'II', label: 'Опытный', rarity: 'Rare', min: 30 },
  { roman: 'III', label: 'Мастер', rarity: 'Epic', min: 60 },
  { roman: 'IV', label: 'Легенда', rarity: 'Legendary', min: 85 },
];

function equipmentTierFor(value) {
  let t = EQUIPMENT_TIERS[0];
  for (const tier of EQUIPMENT_TIERS) { if (value >= tier.min) t = tier; }
  return t;
}

const ITEM_SETS = [
  { key: 'body_set', label: 'Комплект Дисциплины', slots: ['weapon', 'armor', 'shoes', 'gloves'], xp: 100, coins: 80 },
  { key: 'mind_set', label: 'Комплект Разума', slots: ['helmet', 'accessory', 'artifact'], xp: 90, coins: 70 },
];

function setCompletionTier(set, stats) {
  const tierIndexes = set.slots.map(slotKey => {
    const slotDef = EQUIPMENT_SLOTS.find(s => s.slot === slotKey);
    return EQUIPMENT_TIERS.indexOf(equipmentTierFor(stats[slotDef.statKey]));
  });
  return Math.min(...tierIndexes);
}

const LEVEL_UNLOCKS = [
  { level: 5, title: 'Boss Tasks', desc: 'Теперь можно создавать Boss Task — квесты со своей полоской HP.', coins: 30 },
  { level: 10, title: 'Ветеран', desc: 'Открыт статус ветерана — держись, дальше будет глубже.', coins: 60 },
  { level: 15, title: 'Мастер деталей', desc: 'Ты явно не бросаешь начатое.', coins: 90 },
  { level: 20, title: 'Легенда пути', desc: 'Немногие доходят так далеко.', coins: 150 },
];

const ACHIEVEMENTS = [
  { id: 'lvl5', label: 'Adventurer', desc: 'Достигни 5 уровня', rarity: 'Common', xp: 40, coins: 30, check: s => s.character.level >= 5 },
  { id: 'lvl10', label: 'Veteran', desc: 'Достигни 10 уровня', rarity: 'Rare', xp: 80, coins: 60, check: s => s.character.level >= 10 },
  { id: 'lvl25', label: 'Master of Life', desc: 'Достигни 25 уровня', rarity: 'Epic', xp: 150, coins: 120, check: s => s.character.level >= 25 },
  { id: 'lvl50', label: 'Legend', desc: 'Достигни 50 уровня', rarity: 'Legendary', xp: 400, coins: 300, check: s => s.character.level >= 50 },
  { id: 'quest1', label: 'First Step', desc: 'Заверши первый квест', rarity: 'Common', xp: 15, coins: 10, check: s => s.quests.filter(q => q.status === 'completed').length >= 1 },
  { id: 'quest25', label: 'Doer', desc: 'Заверши 25 квестов', rarity: 'Rare', xp: 60, coins: 40, check: s => s.quests.filter(q => q.status === 'completed').length >= 25 },
  { id: 'quest100', label: 'Relentless', desc: 'Заверши 100 квестов', rarity: 'Epic', xp: 150, coins: 100, check: s => s.quests.filter(q => q.status === 'completed').length >= 100 },
  { id: 'goal1', label: 'Goal Getter', desc: 'Заверши первую цель', rarity: 'Common', xp: 30, coins: 20, check: s => s.goals.filter(g => g.progress >= 100).length >= 1 },
  { id: 'goal5', label: 'Visionary', desc: 'Заверши 5 целей', rarity: 'Epic', xp: 120, coins: 90, check: s => s.goals.filter(g => g.progress >= 100).length >= 5 },
  { id: 'streak7', label: 'The Consistent', desc: 'Streak 7 дней в привычке', rarity: 'Rare', xp: 50, coins: 30, check: s => s.habits.some(h => h.bestStreak >= 7) },
  { id: 'streak30', label: 'Iron Discipline', desc: 'Streak 30 дней в привычке', rarity: 'Epic', xp: 130, coins: 100, check: s => s.habits.some(h => h.bestStreak >= 30) },
  { id: 'streak100', label: 'Unbreakable', desc: 'Streak 100 дней в привычке', rarity: 'Legendary', xp: 350, coins: 250, check: s => s.habits.some(h => h.bestStreak >= 100) },
  { id: 'shop1', label: 'Treat Yourself', desc: 'Соверши первую покупку в Reward Shop', rarity: 'Common', xp: 10, coins: 0, check: s => s.chronicle.some(c => c.type === 'REWARD_PURCHASED') },
  { id: 'debt_slayer', label: 'Debt Slayer', desc: 'Победи первого Debt Boss', rarity: 'Rare', xp: 100, coins: 80, check: s => s.finance.debts.some(d => d.remaining <= 0) },
  { id: 'debt_free', label: 'Debt Free', desc: 'Победи всех Debt Boss', rarity: 'Legendary', xp: 300, coins: 200, check: s => s.finance.debts.length > 0 && s.finance.debts.every(d => d.remaining <= 0) },
  { id: 'first_order', label: 'On the Road', desc: 'Залогируй первый заказ', rarity: 'Common', xp: 15, coins: 10, check: s => s.finance.taxi.orders.length >= 1 },
  { id: 'order_grinder', label: 'Road Grinder', desc: 'Залогируй 50 заказов', rarity: 'Rare', xp: 90, coins: 70, check: s => s.finance.taxi.orders.length >= 50 },
];

const DEBT_STRATEGIES = [
  { key: 'avalanche', label: 'Avalanche', desc: 'Сначала самый дорогой долг (% ставка)' },
  { key: 'snowball', label: 'Snowball', desc: 'Сначала самый маленький остаток' },
  { key: 'cashflow', label: 'Cash Flow', desc: 'Сначала самый большой платёж в месяц' },
  { key: 'custom', label: 'Custom', desc: 'Порядок как добавлял' },
];

function sortDebts(debts, strategy) {
  const arr = [...debts];
  if (strategy === 'avalanche') return arr.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0) || b.remaining - a.remaining);
  if (strategy === 'snowball') return arr.sort((a, b) => a.remaining - b.remaining);
  if (strategy === 'cashflow') return arr.sort((a, b) => b.monthlyPayment - a.monthlyPayment);
  return arr;
}

const LIFE_EVENTS = [
  { id: 'workout', label: 'Тренировка', icon: Dumbbell, color: COLORS.teal, effects: [{ stat: 'physical', delta: 3 }] },
  { id: 'good_sleep', label: 'Хорошо выспался', icon: Moon, color: COLORS.teal, effects: [{ stat: 'physical', delta: 1 }, { stat: 'mental', delta: 1 }] },
  { id: 'meditation', label: 'Медитация', icon: Sparkles, color: COLORS.teal, effects: [{ stat: 'mental', delta: 2 }] },
  { id: 'helped_friend', label: 'Помог другу', icon: HeartHandshake, color: COLORS.teal, effects: [{ stat: 'social', delta: 2 }] },
  { id: 'read_book', label: 'Читал книгу', icon: BookMarked, color: COLORS.teal, effects: [{ stat: 'knowledge', delta: 2 }] },
  { id: 'healthy_meal', label: 'Здоровая еда', icon: Utensils, color: COLORS.teal, effects: [{ stat: 'physical', delta: 1 }] },
  { id: 'early_rise', label: 'Ранний подъём', icon: Sunrise, color: COLORS.teal, effects: [{ stat: 'discipline', delta: 2 }] },
  { id: 'family_time', label: 'Время с семьёй', icon: HeartHandshake, color: COLORS.teal, effects: [{ stat: 'social', delta: 2 }, { stat: 'mental', delta: 1 }] },
  { id: 'cleaned_up', label: 'Навёл порядок', icon: ShieldCheck, color: COLORS.teal, effects: [{ stat: 'discipline', delta: 2 }] },
  { id: 'alcohol', label: 'Алкоголь', icon: Wine, color: COLORS.crimson, effects: [{ stat: 'physical', delta: -3 }, { stat: 'mental', delta: -1 }] },
  { id: 'junk_food', label: 'Фастфуд', icon: Pizza, color: COLORS.crimson, effects: [{ stat: 'physical', delta: -2 }] },
  { id: 'smoking', label: 'Курение', icon: Cigarette, color: COLORS.crimson, effects: [{ stat: 'physical', delta: -2 }, { stat: 'mental', delta: -1 }] },
  { id: 'conflict', label: 'Конфликт/скандал', icon: AlertTriangle, color: COLORS.crimson, effects: [{ stat: 'social', delta: -2 }, { stat: 'mental', delta: -1 }] },
  { id: 'bad_sleep', label: 'Недосып', icon: BedDouble, color: COLORS.crimson, effects: [{ stat: 'physical', delta: -2 }, { stat: 'mental', delta: -1 }] },
  { id: 'skipped_meal', label: 'Пропустил приём пищи', icon: Utensils, color: COLORS.crimson, effects: [{ stat: 'physical', delta: -1 }] },
  { id: 'doomscroll', label: 'Залип в телефоне допоздна', icon: Smartphone, color: COLORS.crimson, effects: [{ stat: 'mental', delta: -1 }, { stat: 'discipline', delta: -1 }] },
  { id: 'procrastination', label: 'Прокрастинировал весь день', icon: Clock, color: COLORS.crimson, effects: [{ stat: 'discipline', delta: -2 }] },
];

const HABIT_LIBRARY = [
  { title: 'Пить 2 литра воды', stat: 'physical' },
  { title: 'Медитация 10 минут', stat: 'mental' },
  { title: 'Читать 15 минут', stat: 'knowledge' },
  { title: 'Тренировка', stat: 'physical' },
  { title: 'Ложиться спать до 23:00', stat: 'discipline' },
  { title: 'Планировать день с утра', stat: 'discipline' },
  { title: 'Звонить близким', stat: 'social' },
  { title: 'Записывать траты', stat: 'finance' },
];

// Единые категории расходов для Finance (раздел 3 ТЗ) — сгруппированы, как в разделе.
const EXPENSE_CATEGORIES = [
  { key: 'housing', label: 'Жильё', group: 'essential' },
  { key: 'utilities', label: 'Коммунальные услуги', group: 'essential' },
  { key: 'phone', label: 'Связь', group: 'essential' },
  { key: 'internet', label: 'Интернет', group: 'essential' },
  { key: 'food', label: 'Еда', group: 'life' },
  { key: 'transport', label: 'Транспорт', group: 'life' },
  { key: 'clothes', label: 'Одежда', group: 'life' },
  { key: 'entertainment', label: 'Развлечения', group: 'life' },
  { key: 'other_life', label: 'Прочее', group: 'life' },
  { key: 'fuel', label: 'Бензин', group: 'car' },
  { key: 'carwash', label: 'Мойка', group: 'car' },
  { key: 'repair', label: 'Ремонт', group: 'car' },
  { key: 'service', label: 'Обслуживание', group: 'car' },
  { key: 'insurance', label: 'Страховка', group: 'car' },
  { key: 'other_car', label: 'Прочее (машина)', group: 'car' },
  { key: 'debt_credit', label: 'Кредит', group: 'debt' },
  { key: 'debt_micro', label: 'Микрозайм', group: 'debt' },
  { key: 'debt_installment', label: 'Рассрочка', group: 'debt' },
  { key: 'savings', label: 'Накопления', group: 'fin' },
  { key: 'investments', label: 'Инвестиции', group: 'fin' },
];
const EXPENSE_GROUP_LABELS = { essential: '🏠 Обязательные', life: '🍔 Жизнь', car: '🚗 Машина', debt: '💳 Долги', fin: '💰 Финансовые' };
// Источники дохода (раздел 5 ТЗ)
const INCOME_SOURCE_TYPES = [
  { key: 'salary', label: 'Основная работа', icon: '💼' },
  { key: 'taxi', label: 'Такси', icon: '🚕' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'business', label: 'Бизнес', icon: '💼' },
  { key: 'loan', label: 'Кредит/долг получен', icon: '🏦' },
  { key: 'other', label: 'Другое', icon: '➕' },
];
const DEBT_CATEGORY_OPTIONS = [
  { key: 'debt_credit', label: 'Кредит' },
  { key: 'debt_micro', label: 'Микрозайм' },
  { key: 'debt_installment', label: 'Рассрочка' },
  { key: 'debt_simple', label: 'Долг другу / по карте' },
];
// Человекочитаемые подписи источников операций с Coins — откуда/почему начислено или списано.
const COIN_SOURCE_LABELS = {
  quest: 'За квест', levelup: 'Level-Up бонус', penalty: 'Штраф за пропуск',
  shop: 'Покупка в магазине', refund: 'Возврат покупки', shop_cosmetic: 'Покупка косметики',
  finance_goal: 'Финансовая цель достигнута', taxi: 'Заказ такси', achievement: 'Ачивка',
  set_bonus: 'Бонус за комплект экипировки', migration: 'Перенесено со старой версии',
};
// Карта категорий Гаража -> единая категория Finance, чтобы расход машины
// попадал в общий Cash Flow с правильным ярлыком (раздел 6 ТЗ).
const GARAGE_TO_FINANCE_CATEGORY = { fuel: 'fuel', service: 'service', tires: 'other_car', fines: 'other_car', other: 'other_car' };

// Раздел 16 ТЗ — типы активов. Cash/Savings/Car считаются автоматически из
// остальной системы (не дублируются вручную), остальное пользователь добавляет сам.
const ASSET_TYPES = [
  { key: 'investments', label: 'Инвестиции', icon: '📈' },
  { key: 'property', label: 'Недвижимость', icon: '🏠' },
  { key: 'other', label: 'Другое', icon: '➕' },
];
const SAVINGS_GOAL_TYPES = [
  { key: 'goal', label: 'Обычная цель' },
  { key: 'emergency', label: 'Финансовая подушка' },
];

// Раздел 16-18 ТЗ: единый расчёт активов/обязательств/капитала.
// Cash и Savings НЕ дублируются вручную — берутся из Cash Balance и целей накоплений,
// чтобы деньги не считались дважды при переносе Cash -> Savings.
function computeNetWorth(state) {
  const f = state.finance;
  const savingsTotal = f.savingsGoals.reduce((s, g) => s + (g.saved || 0), 0);
  const carValue = state.garage?.currentValue || 0;
  const customAssets = f.assets || [];
  const customTotal = customAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const assetBreakdown = [
    { key: 'cash', label: 'Наличные', icon: '💵', value: f.cashBalance, liquid: true, auto: true },
    { key: 'savings', label: 'Накопления', icon: '🏦', value: savingsTotal, liquid: true, auto: true },
    ...(carValue > 0 ? [{ key: 'car', label: state.garage?.name || 'Машина', icon: '🚗', value: carValue, liquid: false, auto: true }] : []),
    ...customAssets.map(a => ({ key: a.id, label: a.name, icon: (ASSET_TYPES.find(t => t.key === a.type) || {}).icon || '➕', value: Number(a.value) || 0, liquid: !!a.liquid, auto: false, id: a.id })),
  ];
  const totalAssets = f.cashBalance + savingsTotal + carValue + customTotal;
  const totalLiabilities = f.debts.reduce((s, d) => s + Math.max(0, d.remaining || 0), 0);
  const netWorth = totalAssets - totalLiabilities;
  return { assetBreakdown, totalAssets, totalLiabilities, netWorth };
}

// Раздел 13-15 ТЗ: показатели финансового здоровья, никогда по одному изолированному числу.
function financialHealth(state) {
  const fm = financeMonthSummary(state.finance);
  const th = state.finance.debtLoadThresholds || { low: 20, medium: 36, high: 50 };
  const debtLoad = fm.income > 0 ? (fm.debtPay / fm.income) * 100 : 0;
  const savingsRate = fm.income > 0 ? (fm.savingsContrib / fm.income) * 100 : 0;
  const emergencySavings = state.finance.savingsGoals.filter(g => g.type === 'emergency').reduce((s, g) => s + (g.saved || 0), 0);
  const emergencyMonths = fm.essentialExpenses > 0 ? emergencySavings / fm.essentialExpenses : (emergencySavings > 0 ? Infinity : 0);
  const plan = (state.finance.budgetPlanByMonth && state.finance.budgetPlanByMonth[fm.monthKey]) || state.finance.budgetPlan || {};
  const plannedTotal = Object.values(plan).reduce((s, v) => s + (Number(v) || 0), 0);
  const budgetHealth = plannedTotal > 0 ? Math.max(0, Math.min(100, 100 - Math.max(0, (fm.expenses - plannedTotal) / plannedTotal * 100))) : null;
  let debtZone;
  if (fm.income <= 0 || fm.debtPay <= 0) debtZone = { label: 'нет данных', color: COLORS.textMuted, emoji: '⚪' };
  else if (debtLoad < th.low) debtZone = { label: 'низкая', color: COLORS.teal, emoji: '🟢' };
  else if (debtLoad < th.medium) debtZone = { label: 'умеренная', color: COLORS.gold, emoji: '🟡' };
  else if (debtLoad < th.high) debtZone = { label: 'высокая', color: COLORS.orange, emoji: '🟠' };
  else debtZone = { label: 'очень высокая', color: COLORS.crimson, emoji: '🔴' };
  return { ...fm, debtLoad, savingsRate, emergencySavings, emergencyMonths, plannedTotal, budgetHealth, debtZone };
}

const YT_METRICS = [
  { key: 'subs', label: 'Подписчики', short: 'подписчиков' },
  { key: 'views', label: 'Просмотры', short: 'просмотров' },
  { key: 'videos', label: 'Видео', short: 'видео' },
];
function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}
function withYtSnapshot(ch, stats) {
  const today = todayStr();
  const merged = { ...ch, ...stats, subs: stats.subs ?? ch.subs };
  const snap = { date: today, subs: merged.subs, views: merged.views, videos: merged.videos };
  return { ...merged, history: [...(ch.history || []).filter(h => h.date !== today), snap].slice(-120), lastSync: Date.now() };
}
function ytValue(youtube, link) {
  const ch = (youtube.channels || []).find(c => c.id === link.channelRef);
  return ch && ch[link.metric] != null ? ch[link.metric] : -1;
}
async function fetchYouTubeStats({ handle, channelId }) {
  const qs = channelId ? `id=${encodeURIComponent(channelId)}` : `handle=${encodeURIComponent(handle)}`;
  let r;
  try { r = await fetch(`/api/youtube?${qs}`); } catch (e) { throw new Error('NETWORK: ' + e.message); }
  if (!r.ok) { let t = ''; try { t = (await r.text()).slice(0, 200); } catch (_) {} throw new Error(`HTTP ${r.status}: ${t}`); }
  return r.json();
}

function monthKeyOf(dateStr) { return (dateStr || todayStr()).slice(0, 7); }

const RU_MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
function monthRuLabel(mk) {
  const [y, m] = mk.split('-').map(Number);
  return `${RU_MONTHS[(m || 1) - 1]} ${y}`;
}

// Единый расчёт месячных финансовых итогов из транзакций (раздел 4 ТЗ:
// нельзя суммировать за всё время, только за конкретный месяц).
function financeMonthSummary(finance, monthKey) {
  const mk = monthKey || monthStr();
  const txs = (finance.transactions || []).filter(t => monthKeyOf(t.date) === mk);
  const isDebtCat = c => c === 'debt_credit' || c === 'debt_micro' || c === 'debt_installment';
  const isFinCat = c => c === 'savings' || c === 'investments';
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const debtPay = txs.filter(t => t.type === 'expense' && (t.source === 'debt' || isDebtCat(t.category))).reduce((s, t) => s + t.amount, 0);
  const savingsContrib = txs.filter(t => t.type === 'expense' && (t.source === 'savings' || isFinCat(t.category))).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense' && !isDebtCat(t.category) && !isFinCat(t.category)).reduce((s, t) => s + t.amount, 0);
  const essentialExpenses = txs.filter(t => t.type === 'expense' && t.essential && !isDebtCat(t.category) && !isFinCat(t.category)).reduce((s, t) => s + t.amount, 0);
  const cashFlow = income - expenses - debtPay - savingsContrib;
  return { income, expenses, debtPay, savingsContrib, essentialExpenses, cashFlow, monthKey: mk };
}

const GARAGE_EXPENSE_CATEGORIES = [
  { key: 'fuel', label: 'Топливо/газ', icon: Fuel },
  { key: 'service', label: 'Масло/ТО', icon: Wrench },
  { key: 'tires', label: 'Шины', icon: Gauge },
  { key: 'fines', label: 'Штрафы', icon: AlertTriangle },
  { key: 'other', label: 'Другое', icon: Car },
];

const DEFAULT_REWARDS = [
  { id: 'r1', title: '30 минут игры', cost: 90, category: 'reallife', description: '', icon: '🎮', enabled: true, custom: false },
  { id: 'r2', title: 'Любимая еда', cost: 260, category: 'reallife', description: '', icon: '🍔', enabled: true, custom: false },
  { id: 'r3', title: 'Фильм вечером', cost: 260, category: 'reallife', description: '', icon: '🎬', enabled: true, custom: false },
  { id: 'r4', title: 'Поспать на час дольше', cost: 200, category: 'reallife', description: '', icon: '😴', enabled: true, custom: false },
  { id: 'r5', title: 'Пропустить одну рутину', cost: 340, category: 'reallife', description: '', icon: '⏭️', enabled: true, custom: false },
];

// Раздел 15 ТЗ Coins Economy — каталог косметики. Хранится как статичный каталог (не в save),
// покупка добавляет id в cosmetics.unlocked. Никогда не влияет на Stats/XP/Level.
const COSMETIC_CATALOG = [
  { id: 'frame_common', name: 'Обычная рамка', type: 'frame', cost: 100, rarity: 'Common', preview: '⬜' },
  { id: 'frame_rare', name: 'Редкая рамка', type: 'frame', cost: 500, rarity: 'Rare', preview: '🟦' },
  { id: 'frame_epic', name: 'Эпическая рамка', type: 'frame', cost: 1500, rarity: 'Epic', preview: '🟪' },
  { id: 'title_adventurer', name: 'Титул: Авантюрист', type: 'title', cost: 300, rarity: 'Common', preview: 'Авантюрист' },
  { id: 'title_legend', name: 'Титул: Легенда', type: 'title', cost: 1000, rarity: 'Rare', preview: 'Легенда' },
  { id: 'bg_dusk', name: 'Фон: Сумерки', type: 'background', cost: 500, rarity: 'Common', preview: '🌆' },
  { id: 'bg_void', name: 'Фон: Пустота', type: 'background', cost: 2000, rarity: 'Epic', preview: '🌌' },
  { id: 'name_gold', name: 'Золотое имя', type: 'nameColor', cost: 400, rarity: 'Common', preview: COLORS.gold },
  { id: 'name_violet', name: 'Фиолетовое имя', type: 'nameColor', cost: 400, rarity: 'Common', preview: COLORS.violet },
];
const REWARD_CATEGORIES = [
  { key: 'reallife', label: 'Реальные награды', icon: '🎁' },
  { key: 'cosmetic', label: 'Косметика', icon: '✨' },
  { key: 'collection', label: 'Коллекции', icon: '🏺' },
];

// Раздел 7+21 ТЗ Coins Economy: единая точка изменения баланса Coins — ВСЕ операции
// (заработал/потратил/вернул/скорректировал) проходят сюда и попадают в Coin Ledger.
// amount для earn/spend/refund всегда положительный (направление задаёт type);
// для adjustment amount — со знаком (штрафы за пропуск квеста и т.п.).
function applyCoinLedger(prev, type, amount, source, title, sourceId) {
  const noop = { coins: prev.coins, coinsEarnedAllTime: prev.coinsEarnedAllTime, coinsSpentAllTime: prev.coinsSpentAllTime, coinTransactions: prev.coinTransactions };
  let coins = prev.coins, earned = prev.coinsEarnedAllTime, spent = prev.coinsSpentAllTime, amt;
  if (type === 'adjustment') {
    amt = Math.round(amount);
    if (amt === 0) return noop;
    coins = Math.max(0, coins + amt);
  } else {
    amt = Math.abs(Math.round(amount));
    if (amt <= 0) return noop;
    if (type === 'earn') { coins += amt; earned += amt; }
    else if (type === 'spend') { coins = Math.max(0, coins - amt); spent += amt; }
    else if (type === 'refund') { coins += amt; spent = Math.max(0, spent - amt); }
  }
  const entry = { id: uid(), type, amount: amt, source, sourceId: sourceId || null, title, timestamp: Date.now() };
  const coinTransactions = [...prev.coinTransactions, entry].slice(-300); // храним последние 300 операций, чтобы не раздувать save
  return { coins, coinsEarnedAllTime: earned, coinsSpentAllTime: spent, coinTransactions };
}

const STORAGE_KEY = 'liferpg_state_v1';
const LOCAL_BACKUP_KEY = 'liferpg_local_backup_v1';
const SAVE_TIMEOUT_MS = 25000; // операция может состоять из десятка+ последовательных сетевых
// запросов (по чанку) к CloudStorage — на LTE это легитимно может занять больше 8 секунд,
// это не обязательно "зависание". У нас уже есть локальный бэкап как подстраховка, так что
// можно позволить себе подождать облако подольше, вместо того чтобы объявлять его сломанным
// раньше времени.

// window.storage (в среде запуска этой игры вне artifact-превью Claude) иногда
// не отвечает вовсе — ни успехом, ни ошибкой — например если бэкенд отклоняет
// слишком большое значение молча. Без таймаута await зависает навсегда и кнопка
// "Сохранить" крутится бесконечно. Оборачиваем любой вызов storage в гонку с таймером.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}: нет ответа за ${Math.round(ms / 1000)}с (похоже, хранилище недоступно или значение слишком большое)`)), ms);
    promise.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

// Локальная резервная копия (localStorage) — не зависит от window.storage и от того,
// что именно произошло с игрой при обновлении/переразвёртывании. Пишем её при каждом
// успешном сохранении и читаем как fallback, если основное хранилище недоступно/пусто/битое.
function writeLocalBackup(jsonString) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_BACKUP_KEY, jsonString);
      return true;
    }
  } catch (e) { /* тихо игнорируем — это лишь подстраховка */ }
  return false;
}
function readLocalBackup() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(LOCAL_BACKUP_KEY);
    }
  } catch (e) { /* тихо игнорируем */ }
  return null;
}

// "Ядро" состояния для облачной синхронизации: всё, КРОМЕ неограниченно растущей финансовой
// истории (transactions, taxi.orders, история платежей по долгам). Полная версия этих списков
// остаётся только в локальной копии на устройстве (writeLocalBackup) и в Экспорте — см. saveNow().
function buildCloudPayload(fullState) {
  const finance = fullState.finance || {};
  return {
    ...fullState,
    finance: {
      ...finance,
      transactions: [],
      taxi: { ...(finance.taxi || {}), orders: [] },
      debts: (finance.debts || []).map(d => ({ ...d, history: [] })),
    },
  };
}

function xpNeeded(level) {
  return Math.round(90 + level * 25 + Math.pow(level, 1.5) * 3);
}
function computeEnergy(checkin) {
  if (!checkin) return 50;
  const sleepScore = Math.max(0, 40 - Math.abs(8 - (checkin.sleepHours || 0)) * 7);
  const breakfastScore = checkin.breakfast ? 15 : 0;
  const waterScore = Math.min(20, ((checkin.waterGlasses || 0) / 8) * 20);
  const stepsScore = Math.min(15, ((checkin.steps || 0) / 8000) * 15);
  const cups = checkin.coffeeCups || 0;
  let coffeeScore;
  if (cups === 0) coffeeScore = 8;
  else if (cups <= 2) coffeeScore = 17;
  else coffeeScore = Math.max(0, 17 - (cups - 2) * 6);
  return Math.round(Math.max(0, Math.min(100, sleepScore + breakfastScore + waterScore + stepsScore + coffeeScore)));
}

function energyLabel(val) {
  if (val < 40) return { label: 'Низкая', color: COLORS.crimson };
  if (val < 70) return { label: 'Средняя', color: COLORS.gold };
  return { label: 'Высокая', color: COLORS.teal };
}

// Correct annuity formula: PMT = P * r / (1 - (1+r)^-n)
// P = principal, r = monthly rate (annual% / 12 / 100), n = term in months
function annuityPayment(principal, annualRatePct, months) {
  if (!principal || !months) return 0;
  if (!annualRatePct || annualRatePct <= 0) return principal / months;
  const r = annualRatePct / 100 / 12;
  return principal * r / (1 - Math.pow(1 + r, -months));
}

function buildAmortizationSchedule(principal, annualRatePct, months) {
  const payment = annuityPayment(principal, annualRatePct, months);
  const r = (annualRatePct || 0) / 100 / 12;
  let balance = principal;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPart = payment - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: m, payment, interest, principalPart, balance });
  }
  return rows;
}

// Дифференцированный график: тело долга гасится равными частями каждый месяц (P/n),
// а проценты считаются от текущего остатка — поэтому платёж со временем уменьшается
// (в отличие от аннуитета, где платёж всегда фиксированный).
function buildDifferentiatedSchedule(principal, annualRatePct, months) {
  if (!principal || !months) return [];
  const r = (annualRatePct || 0) / 100 / 12;
  const principalPart = principal / months;
  let balance = principal;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const payment = principalPart + interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month: m, payment, interest, principalPart, balance });
  }
  return rows;
}

// Текущий "боевой" ежемесячный платёж по долгу: для аннуитета он фиксирован, для
// дифференцированного — пересчитывается от текущего остатка (со временем падает),
// у простых долгов (друзьям/по карте) ежемесячного платежа нет вовсе — есть только срок.
function currentMonthlyDue(d) {
  if (!d || d.loanType === 'simple') return null;
  if (d.loanType === 'differentiated') {
    if (!d.termMonths) return 0;
    const principalPart = d.total / d.termMonths;
    const monthlyRate = (d.interestRate || 0) / 100 / 12;
    return principalPart + Math.max(0, d.remaining) * monthlyRate;
  }
  return d.monthlyPayment || 0;
}

function addMonthsToKey(monthKey, delta) {
  const [y, m] = (monthKey || monthStr()).split('-').map(Number);
  const dt = new Date(y, (m - 1) + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
function monthKeyLabel(monthKey) {
  const [y, m] = (monthKey || monthStr()).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

// Переносит старую плоскую финансовую структуру (monthlyIncome + expenses без дат)
// в новую систему транзакций, ничего не ломая для пользователя (раздел "ВАЖНО" ТЗ v12).
function migrateFinance(rawFinance) {
  const f = { ...(rawFinance || {}) };
  const alreadyMigrated = Array.isArray(f.transactions);
  if (!alreadyMigrated) {
    const today = todayStr();
    const transactions = [];
    const legacyIncome = typeof f.monthlyIncome === 'number' ? f.monthlyIncome : 0;
    if (legacyIncome > 0) {
      transactions.push({ id: uid(), type: 'income', title: 'Основной доход (перенесено)', amount: legacyIncome, category: 'salary', date: today, recurring: true, essential: false, source: 'migration', ts: Date.now() });
    }
    (Array.isArray(f.expenses) ? f.expenses : []).forEach(e => {
      transactions.push({ id: uid(), type: 'expense', title: e.title, amount: e.amount, category: 'other_life', date: today, recurring: true, essential: false, source: 'migration', ts: Date.now() });
    });
    f.transactions = transactions;
    f.incomeSources = legacyIncome > 0 ? [{ id: uid(), name: 'Основная работа', type: 'salary', fixed: true, amount: legacyIncome, frequency: 'monthly' }] : [];
    f.cashBalance = 0;
  }
  if (!Array.isArray(f.incomeSources)) f.incomeSources = [];
  if (!Array.isArray(f.transactions)) f.transactions = [];
  if (typeof f.cashBalance !== 'number') f.cashBalance = 0;
  if (!f.mode) f.mode = 'simple';
  if (!f.emergencyFundGoalMonths) f.emergencyFundGoalMonths = 3;
  if (!Array.isArray(f.assets)) f.assets = [];
  if (!Array.isArray(f.netWorthHistory)) f.netWorthHistory = [];
  if (!f.budgetPlan || typeof f.budgetPlan !== 'object') f.budgetPlan = {};
  if (!f.budgetPlanByMonth || typeof f.budgetPlanByMonth !== 'object') {
    // Раньше план бюджета был один на всё время (f.budgetPlan). Теперь план — по месяцам
    // (f.budgetPlanByMonth[monthKey]), чтобы можно было готовить план на следующий месяц заранее.
    // Если у пользователя уже был старый плоский план — переносим его в текущий месяц, ничего не теряя.
    f.budgetPlanByMonth = Object.keys(f.budgetPlan).length > 0 ? { [monthStr()]: f.budgetPlan } : {};
  }
  if (!f.debtLoadThresholds) f.debtLoadThresholds = { low: 20, medium: 36, high: 50 };
  f.debts = (Array.isArray(f.debts) ? f.debts : []).map(d => ({
    ...d,
    history: Array.isArray(d.history) ? d.history : [],
    category: d.category || 'debt_credit',
    // Раньше был только isAnnuity (bool). Теперь у долга есть loanType: 'annuity' | 'differentiated' | 'simple'.
    // Для уже существующих долгов восстанавливаем его из старого поля, ничего не ломая.
    loanType: d.loanType || (d.isAnnuity ? 'annuity' : (d.termMonths ? 'manual' : 'simple')),
    monthsElapsed: d.monthsElapsed || 0,
    paymentDueDay: d.paymentDueDay || null,
    dueDate: d.dueDate || null,
  }));
  f.savingsGoals = (Array.isArray(f.savingsGoals) ? f.savingsGoals : []).map(g => ({ ...g, type: g.type || 'goal' }));
  return f;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStr() { return new Date().toISOString().slice(0, 7); }
function uid() { return Math.random().toString(36).slice(2, 10); }

const AI_PROVIDERS_META = [
  { id: 'gemini', name: 'Gemini' },
  { id: 'grok', name: 'Grok' },
  { id: 'groq', name: 'Groq' },
  { id: 'cerebras', name: 'Cerebras' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'nvidia', name: 'NVIDIA' },
  { id: 'huggingface', name: 'Hugging Face' },
  { id: 'cloudflare', name: 'Cloudflare' },
];
const AI_DEFAULT_ORDER = ['groq','gemini','grok','cerebras','openrouter','mistral','nvidia'];
const AI_HEALTH_KEY = 'liferpg_ai_health_v1';
function loadAIHealth() {
  try { return JSON.parse(localStorage.getItem(AI_HEALTH_KEY) || '{}'); } catch { return {}; }
}
function saveAIHealth(h) { try { localStorage.setItem(AI_HEALTH_KEY, JSON.stringify(h)); } catch {} }
function pushAILog(entry) {
  const h = loadAIHealth();
  const log = Array.isArray(h.log) ? h.log : [];
  log.unshift({ ts: Date.now(), ...entry });
  h.log = log.slice(0, 30);
  h.stats = h.stats || { requests: 0, success: 0, fallback: 0, errors: 0 };
  h.stats.requests += 1;
  if (entry.ok) h.stats.success += 1; else h.stats.errors += 1;
  if (entry.fallbackUsed) h.stats.fallback += 1;
  saveAIHealth(h);
}

async function callClaudeAPI(system, messages, extra = {}) {
  const started = Date.now();
  let response;
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, taskType: extra.taskType || 'CHAT', order: extra.order || AI_DEFAULT_ORDER, jsonMode: !!extra.jsonMode }),
    });
  } catch (networkErr) {
    pushAILog({ taskType: extra.taskType || 'CHAT', provider: 'network', ok: false, error: 'network' });
    throw new Error('NETWORK: ' + (networkErr && networkErr.message ? networkErr.message : 'fetch failed'));
  }
  if (!response.ok) {
    let bodyText = '';
    try { bodyText = (await response.text()).slice(0, 300); } catch (_) {}
    let short = bodyText.replace(/\s+/g,' ').slice(0, 140);
    try { const j = JSON.parse(bodyText); short = (j.error || '') + ' ' + (Array.isArray(j.details) ? j.details.slice(0,3).join(' | ') : ''); } catch {}
    pushAILog({ taskType: extra.taskType || 'CHAT', provider: 'router', ok: false, status: response.status, latency: Date.now() - started, error: short.trim() });
    const err = new Error(`HTTP ${response.status}: ${bodyText || response.statusText}`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  if (!text) throw new Error('EMPTY: no text block in response');
  pushAILog({ taskType: extra.taskType || 'CHAT', provider: data._provider || 'unknown', model: data._model, ok: true, fallbackUsed: !!data.fallbackUsed, latency: Date.now() - started });
  return text;
}

// AI calls inside an artifact draw on the person's own Claude usage — a 429/529 here usually
// means their normal message limit is temporarily used up, not a bug in the app.
function friendlyAIError(e) {
  if (e && e.status === 429) return 'Похоже, на сегодня закончился лимит сообщений Claude — AI-функции используют твою же квоту. Вернутся, когда лимит обновится.';
  if (e && e.status === 529) return 'Серверы Claude сейчас перегружены. Попробуй ещё раз через минуту.';
  return e && e.message ? e.message : String(e);
}

// Transient proxy/network hiccups happen — retry a couple of times with backoff before giving up.
async function callClaudeAPIWithRetry(system, messages, attempts = 2, extra = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callClaudeAPI(system, messages, extra);
    } catch (e) {
      lastErr = e;
      if (e && e.status === 429) break; // quota exhausted — retrying instantly won't help
      if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('no JSON array found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const MENTOR_NAME = 'Мастер Кайлен';
const MENTOR_TITLE = 'Страж Дисциплины';

const MENTOR_SYSTEM_PROMPT = `Тебя зовут ${MENTOR_NAME}, ${MENTOR_TITLE} — RPG-наставник в приложении Life RPG, которое геймифицирует реальную жизнь пользователя. `
  + 'Ты держишься как серьёзный, опытный мастер-наставник в мире тёмного фэнтези — сдержанный, немногословный, с лёгким налётом архаичной речи, но НЕ ряженый шут и не комик. '
  + 'Твоя роль — мудрый, тёплый, но требовательный наставник: поддерживаешь, но не льстишь и не потакаешь. '
  + 'Отвечай по-русски, на "ты", коротко (2-5 предложений на обычное сообщение). '
  + 'Опирайся на переданные в контексте реальные данные персонажа (уровень, статы, квесты, долги, энергия) — не выдумывай цифры, которых там нет. '
  + 'Если пользователь просто здоровается или пишет нейтрально — ответь в характере наставника и мягко предложи, с чем можешь помочь сегодня. '
  + 'Если видишь тревожные признаки (крайне низкая энергия, много пропусков подряд, растущие долги) — мягко обрати на это внимание. '
  + 'Ты не заменяешь врача, финансового или психологического консультанта — при серьёзных темах советуй обратиться к специалисту.';

const GOAL_ENGINE_SYSTEM_PROMPT = 'Ты — Goal Engine в приложении Life RPG. Пользователь даёт крупную жизненную цель, '
  + 'а ты разбиваешь её на 3-6 конкретных выполнимых квестов-шагов с учётом срока цели. '
  + 'КРИТИЧЕСКИ ВАЖНО про логику сроков: шаги идут по возрастанию dueInDays, и тип должен соответствовать сроку — '
  + 'если dueInDays до 14 дней, тип "Weekly"; если больше 14 дней, тип "Monthly"; последний шаг ближе к дедлайну цели '
  + 'обычно "Goal". НЕЛЬЗЯ давать простому короткому действию (например "сделать 10 отжиманий", "выпить стакан воды") '
  + 'срок в 1 месяц — это разовые квесты-шаги на пути к цели, а не повторяющиеся привычки. Если шаг по смыслу должен '
  + 'повторяться каждый день (тренировка, чтение, диета) — сформулируй его как ОДНОРАЗОВОЕ действие вида "составить и '
  + 'начать план тренировок 3 раза в неделю" или "пройти первую неделю по плану питания", а не как саму ежедневную '
  + 'повторяющуюся активность — регулярные действия относятся к привычкам (Habits), а не к квестам цели. '
  + 'Отвечай СТРОГО JSON-массивом, без пояснений, markdown или текста до/после. '
  + 'Формат каждого элемента: {"title": string, "type": "Weekly"|"Monthly"|"Goal", "difficulty": "Easy"|"Normal"|"Hard", '
  + '"stat": одно из [physical,discipline,knowledge,focus,finance,career,creator,social,mental], "dueInDays": number}. '
  + 'dueInDays — через сколько дней от сегодня стоит завершить этот шаг; шаги должны идти по возрастанию и укладываться в срок цели.';

const GOAL_REALITY_SYSTEM_PROMPT = 'Ты — Reality Check Engine в приложении Life RPG. Пользователь даёт крупную цель с дедлайном и текущим прогрессом. '
  + 'Оцени реалистичность и предложи РОВНО 3 сценария: "Агрессивный" (быстрее исходного срока, выше риск не удержать темп), '
  + '"Реалистичный" (сбалансированный, ближе всего к здравому смыслу) и "Безопасный" (более мягкий срок, ниже риск выгорания). '
  + 'Отвечай СТРОГО одним JSON-объектом без пояснений и markdown, формат: '
  + '{"scenarios": [{"name": string, "pace": string, "probability": string, "risks": string, "deadlineDays": number}]}. '
  + 'pace — краткое описание темпа в 1 фразе, probability — вероятность успеха словами ("высокая"/"средняя"/"низкая"), '
  + 'risks — главный риск в 1 фразе, deadlineDays — предлагаемый срок в днях от сегодня для этого сценария.';

const DAILY_QUEST_ENGINE_SYSTEM_PROMPT = 'Ты — Daily Quest Engine в приложении Life RPG. '
  + 'По статам персонажа (особенно слабым местам), активным целям и уже существующим квестам придумай от 1 до 3 '
  + 'НОВЫХ заданий. Главное правило: задания должны быть конкретными и однозначно выполнимыми — НИКАКИХ размытых '
  + 'фраз вроде "внезапный прилив сил, самое время для важного дела" или "момент фокуса". Формулируй как чёткое '
  + 'действие с понятным результатом ("прочитать 15 страниц книги по specialty", "сделать 20 отжиманий", '
  + '"написать план на завтра перед сном"). Если есть активная цель — минимум одно задание должно двигать именно её. '
  + 'Не повторяй уже существующие активные квесты по смыслу. '
  + 'Отвечай СТРОГО JSON-массивом без пояснений, markdown или текста до/после. '
  + 'Формат каждого элемента: {"title": string, "type": "Daily"|"Weekly"|"Monthly", '
  + '"stat": одно из [physical,discipline,knowledge,focus,finance,career,creator,social,mental], '
  + '"secondaryStat": одно из того же списка ИЛИ null (если задание реально качает второй аспект — например бег качает и physical, и discipline)}. '
  + '"Daily" — выполнимо сегодня за 5-40 минут. "Weekly" — рассчитано на несколько дней в течение недели. '
  + '"Monthly" — крупная веха на месяц вперёд. Обычно давай 1-2 Daily и не больше одного Weekly/Monthly за раз — не выдумывай лишнее ради количества.';

async function aiDailyQuestSpecs(state) {
  const activeTitles = state.quests.filter(q => q.status === 'active').map(q => `${q.title} (${q.type})`);
  const userMsg = `Контекст персонажа:\n${buildContextSummary(state)}\n\n`
    + `Активные квесты сейчас:\n${activeTitles.length ? activeTitles.map(t => `- ${t}`).join('\n') : '(нет)'}`;
  const text = await callClaudeAPIWithRetry(DAILY_QUEST_ENGINE_SYSTEM_PROMPT, [{ role: 'user', content: userMsg }]);
  const specs = parseJsonLoose(text);
  if (!Array.isArray(specs) || specs.length === 0) throw new Error('EMPTY: no quests returned');
  const validStats = new Set(STATS_DEF.map(s => s.key));
  const validTypes = new Set(['Daily', 'Weekly', 'Monthly']);
  return specs
    .filter(s => s && typeof s.title === 'string' && s.title.trim() && validStats.has(s.stat) && validTypes.has(s.type))
    .map(s => ({
      title: s.title.trim(), type: s.type, stat: s.stat,
      secondaryStat: validStats.has(s.secondaryStat) && s.secondaryStat !== s.stat ? s.secondaryStat : null,
    }))
    .slice(0, 3);
}

const HABIT_SUGGEST_SYSTEM_PROMPT = 'Ты — Habit Engine в приложении Life RPG. По статам персонажа (особенно слабым местам) и '
  + 'уже существующим привычкам предложи от 2 до 4 НОВЫХ привычек, которых пока нет в списке и которые реально помогут '
  + 'именно слабым сторонам. Формулируй конкретно и коротко (3-6 слов), без воды. '
  + 'Отвечай СТРОГО JSON-массивом без пояснений, markdown или текста до/после. '
  + 'Формат каждого элемента: {"title": string, "stat": одно из [physical,discipline,knowledge,focus,finance,career,creator,social,mental], '
  + '"secondaryStat": одно из того же списка ИЛИ null (если привычка реально качает второй аспект)}.';

async function aiHabitSuggestions(state) {
  const existing = state.habits.map(h => h.title);
  const userMsg = `Контекст персонажа:\n${buildContextSummary(state)}\n\n`
    + `Уже существующие привычки:\n${existing.length ? existing.map(t => `- ${t}`).join('\n') : '(нет)'}`;
  const text = await callClaudeAPIWithRetry(HABIT_SUGGEST_SYSTEM_PROMPT, [{ role: 'user', content: userMsg }]);
  const specs = parseJsonLoose(text);
  if (!Array.isArray(specs) || specs.length === 0) throw new Error('EMPTY: no habits returned');
  const validStats = new Set(STATS_DEF.map(s => s.key));
  return specs
    .filter(s => s && typeof s.title === 'string' && s.title.trim() && validStats.has(s.stat))
    .map(s => ({
      title: s.title.trim(), stat: s.stat,
      secondaryStat: validStats.has(s.secondaryStat) && s.secondaryStat !== s.stat ? s.secondaryStat : null,
    }))
    .slice(0, 4);
}

function parseJsonObjectLoose(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildContextSummary(state) {
  const weakest = STATS_DEF.reduce((min, s) => state.stats[s.key] < state.stats[min.key] ? s : min, STATS_DEF[0]);
  const activeQuests = state.quests.filter(q => q.status === 'active');
  const aliveDebts = state.finance.debts.filter(d => d.remaining > 0);
  const checkin = state.dailyCheckin && state.dailyCheckin.date === todayStr() ? state.dailyCheckin : null;
  const energy = computeEnergy(checkin);
  return [
    `Персонаж: ${state.character.name}, уровень ${state.character.level}, XP ${state.character.xp}, Coins ${state.coins}`,
    `Energy: ${energy}/100`,
    `Статы: ${STATS_DEF.map(s => `${s.label} ${state.stats[s.key]}`).join(', ')} (слабее всего — ${weakest.label})`,
    `Активных квестов: ${activeQuests.length}`,
    `Целей в работе: ${state.goals.filter(g => g.progress < 100).length}`,
    aliveDebts.length ? `Активные долги: ${aliveDebts.map(d => `${d.title} (осталось ${Math.round(d.remaining)})`).join(', ')}` : 'Долгов нет',
    state.recoveryMode ? 'Recovery Mode включён' : null,
    state.availableHoursPerWeek ? `Свободное время: ~${state.availableHoursPerWeek} ч/неделю` : null,
  ].filter(Boolean).join('\n');
}

const SPHERE_TO_STAT = {
  Career: 'career', Finance: 'finance', Knowledge: 'knowledge', Physical: 'physical',
  Relationships: 'social', Creator: 'creator', 'Personal Development': 'mental',
};

const FALLBACK_STEP_TEMPLATES = [
  { verb: 'Сделай первый конкретный шаг', type: 'Weekly', difficulty: 'Easy' },
  { verb: 'Закрепи регулярность', type: 'Weekly', difficulty: 'Normal' },
  { verb: 'Пройди контрольную точку на середине пути', type: 'Monthly', difficulty: 'Normal' },
  { verb: 'Сделай финальный рывок', type: 'Goal', difficulty: 'Hard' },
];

function ruleBasedGoalSplit(goal) {
  const days = goal.deadline ? Math.max(7, Math.ceil((new Date(goal.deadline) - Date.now()) / 86400000)) : 30;
  const steps = FALLBACK_STEP_TEMPLATES.length;
  const per = Math.max(1, Math.floor(days / steps));
  return FALLBACK_STEP_TEMPLATES.map((t, i) => ({
    title: `${t.verb} — «${goal.title}»`,
    type: t.type, difficulty: t.difficulty,
    stat: SPHERE_TO_STAT[goal.sphere] || 'discipline',
    dueInDays: per * (i + 1),
  }));
}

// Защитная нормализация шагов цели — не доверяем AI на 100%, даже если промпт
// просит логичные сроки. Гарантируем: сроки строго возрастают, не превышают
// срок самой цели, и тип квеста (Weekly/Monthly/Goal) реально соответствует
// тому, через сколько дней шаг должен быть закрыт — иначе получается ерунда
// вида "10 отжиманий" со сроком в месяц.
function normalizeGoalSteps(specs, goal) {
  const goalDays = goal.deadline ? Math.max(3, Math.ceil((new Date(goal.deadline) - Date.now()) / 86400000)) : 30;
  const cleaned = specs
    .filter(s => s && typeof s.title === 'string' && s.title.trim())
    .map(s => ({
      title: s.title.trim(),
      difficulty: DIFF_MULT[s.difficulty] !== undefined ? s.difficulty : 'Normal',
      stat: STATS_DEF.some(st => st.key === s.stat) ? s.stat : 'discipline',
      dueInDays: Math.max(1, Math.min(goalDays, Math.round(Number(s.dueInDays) || 7))),
    }))
    .sort((a, b) => a.dueInDays - b.dueInDays);

  let prevDue = 0;
  cleaned.forEach(s => {
    if (s.dueInDays <= prevDue) s.dueInDays = Math.min(goalDays, prevDue + 1);
    prevDue = s.dueInDays;
  });

  return cleaned.map((s, i) => {
    const isLast = i === cleaned.length - 1;
    let type;
    if (isLast && goalDays > 21) type = 'Goal';
    else if (s.dueInDays <= 14) type = 'Weekly';
    else type = 'Monthly';
    return { ...s, type };
  });
}

// --- Body / calories math ---
const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Сидячий образ жизни', mult: 1.2 },
  { key: 'light', label: 'Лёгкая активность', mult: 1.375 },
  { key: 'moderate', label: 'Умеренная активность', mult: 1.55 },
  { key: 'active', label: 'Высокая активность', mult: 1.725 },
  { key: 'very_active', label: 'Очень высокая активность', mult: 1.9 },
];

function computeBMR(weight, heightCm, age, sex) {
  const base = 10 * weight + 6.25 * heightCm - 5 * (age || 25);
  return sex === 'female' ? base - 161 : base + 5;
}

function computeTDEE(bmr, activityLevel) {
  const lvl = ACTIVITY_LEVELS.find(l => l.key === activityLevel) || ACTIVITY_LEVELS[2];
  return bmr * lvl.mult;
}

// Раздел «Калории»: дневная цель по ккал с учётом того, худеет/набирает/держит вес пользователь.
function dailyCalorieTarget(body, currentWeight) {
  if (!currentWeight || !body.heightCm) return null;
  const bmr = computeBMR(currentWeight, body.heightCm, body.age, body.sex);
  const tdee = computeTDEE(bmr, body.activityLevel);
  const floor = body.sex === 'female' ? 1200 : 1500;
  if (body.targetWeight && body.targetWeight < currentWeight - 0.5) {
    return { calories: Math.max(Math.round(tdee - 500), floor), tdee: Math.round(tdee), mode: 'cut' };
  }
  if (body.targetWeight && body.targetWeight > currentWeight + 0.5) {
    return { calories: Math.round(tdee + 300), tdee: Math.round(tdee), mode: 'bulk' };
  }
  return { calories: Math.round(tdee), tdee: Math.round(tdee), mode: 'maintain' };
}

// Ориентировочные цели по БЖУ, отталкиваясь от целевых калорий и веса: белок — под сохранение
// мышц при дефиците (~1.6 г/кг), жир — ~27% калорий, углеводы — остаток.
function macroTargets(target, weight) {
  if (!target) return null;
  const proteinG = weight ? Math.round(weight * 1.6) : Math.round((target * 0.3) / 4);
  const fatG = Math.round((target * 0.27) / 9);
  const carbsCal = Math.max(0, target - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(carbsCal / 4);
  return { proteinG, fatG, carbsG };
}

// --- AI: подсчёт калорий по тексту или по фото еды ---
const FOOD_TEXT_SYSTEM_PROMPT = 'Ты — нутрициолог-ассистент в приложении Life RPG. Пользователь словами описывает, что съел '
  + '(порция может быть не указана явно). Оцени по обычным взрослым порциям примерное количество калорий и БЖУ. '
  + 'Отвечай СТРОГО одним JSON-объектом, без пояснений, markdown или текста до/после: '
  + '{"title": string (кратко, по-русски), "calories": number, "protein": number, "fat": number, "carbs": number}';

const FOOD_PHOTO_SYSTEM_PROMPT = 'Ты — нутрициолог-ассистент в приложении Life RPG. Пользователь прислал фото еды. '
  + 'Определи, что на фото, оцени размер порции на глаз и посчитай примерные калории и БЖУ (если еды несколько — сложи всё в одну оценку). '
  + 'Отвечай СТРОГО одним JSON-объектом, без пояснений, markdown или текста до/после: '
  + '{"title": string (кратко, по-русски, что на фото), "calories": number, "protein": number, "fat": number, "carbs": number}';

function normalizeFoodSpec(spec) {
  return {
    title: (spec && typeof spec.title === 'string' && spec.title.trim()) || 'Приём пищи',
    calories: Math.max(0, Math.round(Number(spec && spec.calories) || 0)),
    protein: Math.max(0, Math.round(Number(spec && spec.protein) || 0)),
    fat: Math.max(0, Math.round(Number(spec && spec.fat) || 0)),
    carbs: Math.max(0, Math.round(Number(spec && spec.carbs) || 0)),
  };
}

async function estimateFoodFromText(description) {
  const text = await callClaudeAPIWithRetry(FOOD_TEXT_SYSTEM_PROMPT, [{ role: 'user', content: description }]);
  return normalizeFoodSpec(parseJsonObjectLoose(text));
}

async function estimateFoodFromPhoto(dataUrl, note) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) throw new Error('bad image data');
  const [, mediaType, base64] = match;
  const content = [
    { type: 'text', text: note ? `Комментарий пользователя: ${note}` : 'Оцени калории и БЖУ по этому фото еды.' },
    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
  ];
  const text = await callClaudeAPIWithRetry(FOOD_PHOTO_SYSTEM_PROMPT, [{ role: 'user', content }]);
  return normalizeFoodSpec(parseJsonObjectLoose(text));
}

// bmiTier теперь маппит реальный BMI на один из 8 спрайтов CHARACTER_SPRITE_LIST (см. BODY_TIERS выше).
function bmiTier(bmi) {
  if (bmi == null) return null;
  for (let i = 0; i < BODY_TIERS.length; i++) {
    if (bmi < BODY_TIERS[i].maxBmi) return { label: BODY_TIERS[i].label, index: i, color: BODY_TIERS[i].color };
  }
  const last = BODY_TIERS[BODY_TIERS.length - 1];
  return { label: last.label, index: BODY_TIERS.length - 1, color: last.color };
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
function fmtDeadline(dl) {
  if (!dl) return null;
  const d = new Date(dl);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function defaultState() {
  const stats = {};
  STATS_DEF.forEach(s => { stats[s.key] = 20; });
  return {
    character: { name: 'Герой', level: 1, xp: 0, title: null, photo: null },
    firstOpenedAt: null, // дата первого запуска — для счётчика "дней в игре"
    playLog: [], // ['2026-09-01', ...] — уникальные дни, когда открывали игру, для календаря
    coins: 50,
    // Coin Ledger — раздел 7+21 ТЗ Coins Economy. Игровая экономика полностью отделена
    // от реального прогресса (XP/Stats/Level/Finance) и от реальных денег (UZS).
    coinsEarnedAllTime: 50,
    coinsSpentAllTime: 0,
    coinTransactions: [], // {id,type:'earn'|'spend'|'refund'|'adjustment',amount,source,sourceId,title,timestamp}
    cosmetics: { unlocked: [], equipped: { frame: null, background: null, title: null, nameColor: null } },
    lastRefundAt: null, // раздел 14 ТЗ — ограничение: один refund за период
    lastPurchase: null, // {id,rewardId,title,cost,ts,isCustom} — для Refund
    dailyCheckin: null,
    stats,
    quests: [],
    goals: [],
    habits: [],
    unlockedAchievements: [],
    unlockedSets: [],
    unlockedLevels: [],
    dismissedEvolutions: [],
    customEvents: [],
    recoveryMode: false,
    availableHoursPerWeek: null,
    finance: {
      mode: 'simple', // 'simple' | 'advanced' — раздел 11 ТЗ
      cashBalance: 0, // реальный баланс наличных UZS, раздел 10 ТЗ — отдельно от Gold
      transactions: [], // {id,type,title,amount,category,date,recurring,essential,source,ts} — раздел 3 ТЗ
      incomeSources: [], // {id,name,type,fixed,amount,frequency} — раздел 5 ТЗ
      debts: [],
      savingsGoals: [],
      assets: [], // {id,name,type,value,liquid} — раздел 16 ТЗ, кастомные активы сверх Cash/Savings/Car
      netWorthHistory: [], // {month, netWorth} — раздел 18 ТЗ
      budgetPlan: {}, // legacy — раздел 12 ТЗ (оставлено для обратной совместимости чтения старых сохранений)
      budgetPlanByMonth: {}, // {'YYYY-MM': {categoryKey: plannedAmount}} — план бюджета по месяцам, можно готовить план на следующий месяц заранее
      debtLoadThresholds: { low: 20, medium: 36, high: 50 }, // раздел 14 ТЗ
      strategy: 'avalanche',
      taxi: { dailyTarget: 10000, commissionPct: 9, orders: [] },
      emergencyFundGoalMonths: 3,
    },
    youtube: { channels: [], activeChannelId: null, goals: [], ideas: [], contentItems: [], settings: { defaultPlanningPeriod: 7, defaultPublishFrequency: 3 } },
    garage: {
      photo: null,
      name: 'Моя машина',
      carDebtId: null,
      currentValue: 0, // ориентировочная рыночная стоимость машины — раздел 16 ТЗ, для Net Worth
      expenses: [],
    },
    body: {
      heightCm: null,
      age: null,
      sex: 'male',
      activityLevel: 'moderate',
      targetWeight: null,
      weightLog: [],
    },
    nutrition: {
      entries: [], // {id,title,calories,protein,fat,carbs,date,source:'text'|'photo'|'manual',ts}
    },
    rewards: DEFAULT_REWARDS,
    chronicle: [{ id: uid(), ts: Date.now(), type: 'SYSTEM', text: 'Персонаж создан. Путь начался.' }],
    lastBonusDate: null,
    lastMonthlyDate: null,
    lastEventDate: null,
    lastNutritionCheckDate: null,
    lastAIQuestDate: null,
    lastOpenDate: null,
    hasSeenOnboarding: false,
    difficultyMode: 'normal',
    statsHistory: [],
    lastStatsSnapshotDate: null,
    nextOrder: 1,
    ai: { order: AI_DEFAULT_ORDER, enabled: Object.fromEntries(AI_PROVIDERS_META.map(p => [p.id, true])) },
  };
}

function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / 86400000);
}

function resetBrokenStreaks(s) {
  if (s.recoveryMode) return s;
  const today = todayStr();
  const habits = s.habits.map(h => {
    if (h.lastDoneDate && daysBetween(h.lastDoneDate, today) > 1) {
      return { ...h, streakCurrent: 0 };
    }
    return h;
  });
  return { ...s, habits };
}

function ensureDailyContent(s) {
  let ns = resetBrokenStreaks(s);
  const today = todayStr();
  const month = monthStr();
  let quests = [...ns.quests];
  let order = ns.nextOrder || 1;
  let chronicle = [...ns.chronicle];

  if (ns.lastBonusDate !== today) {
    const pool = [...BONUS_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
    pool.forEach(t => {
      const [lo, hi] = TYPE_XP_RANGE.Bonus;
      const xp = Math.round(lo + (hi - lo) * 0.3);
      quests.push({
        id: uid(), title: t.title, type: 'Bonus', difficulty: 'Normal',
        xp, coins: Math.round(xp * 0.4), stat: t.stat, status: 'active',
        deadline: today + 'T23:59', order: order++, createdAt: Date.now(),
        source: 'pool', genDate: today,
      });
    });
    ns.lastBonusDate = today;
    chronicle.unshift({ id: uid(), ts: Date.now(), type: 'BONUS_QUESTS', text: 'Новые Bonus Quests на сегодня.' });
  }
  if (ns.lastMonthlyDate !== month) {
    const t = MONTHLY_POOL[Math.floor(Math.random() * MONTHLY_POOL.length)];
    const [, hi] = TYPE_XP_RANGE.Monthly;
    quests.push({
      id: uid(), title: t.title, type: 'Monthly', difficulty: 'Hard',
      xp: hi, coins: Math.round(hi * 0.35), stat: t.stat, status: 'active',
      deadline: month + '-28T23:59', order: order++, createdAt: Date.now(),
    });
    ns.lastMonthlyDate = month;
    chronicle.unshift({ id: uid(), ts: Date.now(), type: 'MONTHLY_CHALLENGE', text: `Новый Monthly Challenge: ${t.title}` });
  }

  if (ns.lastEventDate !== today) {
    ns.lastEventDate = today;
    if (Math.random() < 0.45) {
      const ev = buildRandomEvent(ns);
      quests.push({
        id: uid(), title: ev.title, type: 'Event', difficulty: 'Normal',
        xp: ev.xp, coins: ev.coins, stat: ev.stat, status: 'active',
        deadline: today + 'T23:59', order: order++, createdAt: Date.now(), rarity: ev.rarity,
      });
      chronicle.unshift({ id: uid(), ts: Date.now(), type: 'RANDOM_EVENT', text: `✨ Random Event (${ev.rarity}): ${ev.title}` });
    }
  }

  let welcomeBackDays = 0;
  const daysAway = ns.lastOpenDate ? daysBetween(ns.lastOpenDate, today) : 0;
  if (daysAway >= 3) {
    welcomeBackDays = daysAway;
    const recoveryTitles = ['Сделай один маленький шаг сегодня', 'Заполни чек-ин и оцени состояние', 'Выбери одну лёгкую задачу и закрой её'];
    recoveryTitles.forEach(title => {
      const [lo, hi] = TYPE_XP_RANGE.Recovery;
      const xp = Math.round(lo + (hi - lo) * 0.5);
      quests.push({
        id: uid(), title, type: 'Recovery', difficulty: 'Easy', xp, coins: Math.round(xp * 0.4),
        stat: 'discipline', status: 'active', deadline: null, order: order++, createdAt: Date.now(),
      });
    });
    chronicle.unshift({ id: uid(), ts: Date.now(), type: 'SYSTEM', text: `Возвращение после ${daysAway} дн. отсутствия — старые задания не сгорели, добавлено несколько лёгких Recovery Quest.` });
  }

  // Итог вчерашнего дня по калориям -> реально влияет на Discipline (раз в день, один раз за переход даты).
  const closingDay = ns.lastOpenDate;
  if (closingDay && closingDay !== today && ns.lastNutritionCheckDate !== closingDay) {
    const dayEntries = (ns.nutrition && ns.nutrition.entries || []).filter(e => e.date === closingDay);
    if (dayEntries.length > 0) {
      const totalCal = dayEntries.reduce((sum, e) => sum + e.calories, 0);
      const sortedW = [...(ns.body.weightLog || [])].sort((a, b) => a.date.localeCompare(b.date));
      const weightOnDay = sortedW.length ? sortedW[sortedW.length - 1].weight : null;
      const calTarget = dailyCalorieTarget(ns.body, weightOnDay);
      if (calTarget) {
        const stats = { ...ns.stats };
        if (totalCal <= calTarget.calories * 1.05) {
          stats.discipline = Math.min(100, (stats.discipline || 0) + 1);
          ns.stats = stats;
          const res = applyXP(ns.character, 15);
          ns.character = res.character;
          chronicle.unshift({ id: uid(), ts: Date.now(), type: 'SYSTEM', text: `🥗 Вчера уложился в лимит калорий (${totalCal}/${calTarget.calories}) — +1 Discipline, +15 XP` });
        } else {
          stats.discipline = Math.max(0, (stats.discipline || 0) - 1);
          ns.stats = stats;
          chronicle.unshift({ id: uid(), ts: Date.now(), type: 'SYSTEM', text: `🍔 Вчера перебор по калориям (${totalCal}/${calTarget.calories}) — -1 Discipline` });
        }
      }
    }
    ns.lastNutritionCheckDate = closingDay;
  }

  ns.lastOpenDate = today;
  if (ns.lastStatsSnapshotDate !== today) {
    ns.lastStatsSnapshotDate = today;
    ns.statsHistory = [...(ns.statsHistory || []), { date: today, stats: { ...ns.stats } }].slice(-90);
  }
  ns.quests = quests;
  ns.chronicle = chronicle.slice(0, 300);
  ns.nextOrder = order;
  return { state: ns, welcomeBackDays };
}

// Quest Evolution: an Easy quest crushed 5+ times suggests leveling up; a Hard quest skipped
// 3+ times suggests easing off. Purely advisory — nothing changes automatically.
function computeQuestEvolutionSuggestions(quests, dismissed) {
  const groups = {};
  quests.forEach(q => {
    const key = q.title.trim().toLowerCase();
    if (!groups[key]) groups[key] = { title: q.title, stat: q.stat, type: q.type, easyCompleted: 0, hardSkipped: 0 };
    if (q.status === 'completed' && q.difficulty === 'Easy') groups[key].easyCompleted += 1;
    if (q.status === 'skipped' && q.difficulty === 'Hard') groups[key].hardSkipped += 1;
    groups[key].stat = q.stat || groups[key].stat;
    groups[key].type = q.type || groups[key].type;
  });
  const suggestions = [];
  Object.entries(groups).forEach(([key, g]) => {
    if (g.easyCompleted >= 5 && !dismissed.includes(key + ':up')) {
      suggestions.push({ key: key + ':up', title: g.title, direction: 'up', count: g.easyCompleted, stat: g.stat, type: g.type });
    }
    if (g.hardSkipped >= 3 && !dismissed.includes(key + ':down')) {
      suggestions.push({ key: key + ':down', title: g.title, direction: 'down', count: g.hardSkipped, stat: g.stat, type: g.type });
    }
  });
  return suggestions;
}

// Anti-farm: repeating the exact same quest title for rewards the same day gives sharply diminishing returns.
const DIFFICULTY_SETTINGS = {
  easy: { antiFarmCurve: [1, 0.7, 0.5, 0.3], penaltyMult: 0.5, label: 'Easy' },
  normal: { antiFarmCurve: [1, 0.5, 0.25, 0.1], penaltyMult: 1, label: 'Normal' },
  hardcore: { antiFarmCurve: [1, 0.3, 0.1, 0], penaltyMult: 1.5, label: 'Hardcore' },
};

function antiFarmMultiplier(chronicle, title, difficultyMode = 'normal') {
  const todayStart = new Date(todayStr() + 'T00:00:00').getTime();
  const count = chronicle.filter(c => c.type === 'QUEST_COMPLETED' && c.ts >= todayStart && c.text.startsWith(title + ' —')).length;
  const curve = (DIFFICULTY_SETTINGS[difficultyMode] || DIFFICULTY_SETTINGS.normal).antiFarmCurve;
  return curve[Math.min(count, curve.length - 1)];
}

function applyXP(character, xpGain) {
  let { level, xp } = character;
  let need = xpNeeded(level);
  let newXp = xp + xpGain;
  let bonusCoins = 0;
  let leveledUp = false;
  while (newXp >= need) {
    newXp -= need;
    level += 1;
    bonusCoins += level * 10;
    leveledUp = true;
    need = xpNeeded(level);
  }
  return { character: { ...character, level, xp: newXp }, bonusCoins, leveledUp };
}

function Bar({ value, max = 100, color, height = 8, bg = COLORS.border }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, borderRadius: height, background: bg, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div className="lrpg-card" onClick={onClick} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, ...style }}>
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color, background: color + '22',
      padding: '2px 8px', borderRadius: 999, border: `1px solid ${color}55`,
    }}>{children}</span>
  );
}

function SubNav({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: COLORS.bgCardAlt, padding: 4, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
      {options.map(o => (
        <button key={o.key} className="lrpg-btn" onClick={() => onChange(o.key)} style={{
          flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
          background: active === o.key ? COLORS.violet : 'transparent',
          color: active === o.key ? '#100E1C' : COLORS.textMuted,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function CheckinForm({ initial, onSubmit }) {
  const [sleepHours, setSleepHours] = useState(initial ? initial.sleepHours : 7);
  const [breakfast, setBreakfast] = useState(initial ? initial.breakfast : false);
  const [coffeeCups, setCoffeeCups] = useState(initial ? initial.coffeeCups : 0);
  const [waterGlasses, setWaterGlasses] = useState(initial ? initial.waterGlasses : 0);
  const [steps, setSteps] = useState(initial ? (initial.steps || 0) : 0);

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Moon size={12} /> Сон, часов: {sleepHours}</div>
        <input type="range" min={0} max={12} step={0.5} value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} style={{ width: '100%', accentColor: COLORS.violet }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Croissant size={12} /> Завтракал?</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lrpg-btn" onClick={() => setBreakfast(true)} style={{ background: breakfast ? COLORS.gold : COLORS.bgCardAlt, color: breakfast ? '#1a1305' : COLORS.textMuted, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>Да</button>
          <button className="lrpg-btn" onClick={() => setBreakfast(false)} style={{ background: !breakfast ? COLORS.gold : COLORS.bgCardAlt, color: !breakfast ? '#1a1305' : COLORS.textMuted, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>Нет</button>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Coffee size={12} /> Кофе, чашек: {coffeeCups}</div>
        <input type="range" min={0} max={6} value={coffeeCups} onChange={e => setCoffeeCups(Number(e.target.value))} style={{ width: '100%', accentColor: COLORS.gold }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Droplet size={12} /> Вода, стаканов: {waterGlasses}</div>
        <input type="range" min={0} max={12} value={waterGlasses} onChange={e => setWaterGlasses(Number(e.target.value))} style={{ width: '100%', accentColor: COLORS.teal }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Gauge size={12} /> Шаги (вручную): {steps}
        </div>
        <input type="range" min={0} max={20000} step={500} value={steps} onChange={e => setSteps(Number(e.target.value))} style={{ width: '100%', accentColor: COLORS.violet }} />
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Автотрекера шагов нет — вбей число из телефона вручную</div>
      </div>
      <button className="lrpg-btn" onClick={() => onSubmit({ sleepHours, breakfast, coffeeCups, waterGlasses, steps })}
        style={{ background: COLORS.teal, color: '#0B1F1D', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13 }}>
        Сохранить чек-ин
      </button>
    </div>
  );
}

function StatusStrip({ state, energy, weakestStat }) {
  const fm = financeMonthSummary(state.finance);
  const hasFinanceData = state.finance.incomeSources.length > 0 || fm.income > 0 || fm.expenses > 0 || state.finance.debts.length > 0;
  const free = fm.cashFlow;
  let financeChip;
  if (!hasFinanceData) financeChip = { label: 'Нет данных', color: COLORS.textMuted };
  else if (free < 0) financeChip = { label: 'Слабый', color: COLORS.crimson };
  else if (free < 300) financeChip = { label: 'Средний', color: COLORS.gold };
  else financeChip = { label: 'Сильный', color: COLORS.teal };

  const eLabel = energyLabel(energy);
  const aliveDebts = state.finance.debts.filter(d => d.remaining > 0);
  const bestStreak = state.habits.reduce((m, h) => Math.max(m, h.streakCurrent), 0);

  const chips = [
    { icon: Wallet, label: 'Finance', value: financeChip.label, color: financeChip.color },
    { icon: Zap, label: 'Energy', value: eLabel.label, color: eLabel.color },
    { icon: weakestStat.icon, label: weakestStat.label, value: `${state.stats[weakestStat.key]}/100`, color: COLORS.violet },
  ];
  if (aliveDebts.length > 0) chips.push({ icon: Skull, label: 'Debt Boss', value: `${aliveDebts.length} активн.`, color: COLORS.crimson });
  if (bestStreak > 0) chips.push({ icon: Flame, label: 'Streak', value: `${bestStreak}д`, color: COLORS.gold });

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
      {chips.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="lrpg-card" style={{
            flex: '0 0 auto', minWidth: 92, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: COLORS.textMuted, fontSize: 10 }}>
              <Icon size={11} /> {c.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginTop: 2, whiteSpace: 'nowrap' }}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// ===================== v14 NAV SHELL — 5 разделов =====================
function PillTabs({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {options.map(o => {
        const on = active === o.key;
        return (
          <button key={o.key} className="lrpg-btn" onClick={() => onChange(o.key)} style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
            background: on ? 'linear-gradient(180deg, #8B85FF, #6C63FF)' : 'rgba(255,255,255,0.04)',
            color: on ? '#fff' : COLORS.textMuted,
            border: on ? `1px solid ${COLORS.violet}` : '1px solid rgba(255,255,255,0.08)',
            boxShadow: on ? `0 0 14px ${COLORS.violet}55` : 'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function ScreenHeader({ title, icon: Icon, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && (
          <span className="lrpg-badge-icon" style={{ width: 28, height: 28, borderRadius: 9 }}>
            <Icon size={14} color={COLORS.gold} />
          </span>
        )}
        <div style={{ fontSize: 18, fontWeight: 800, color: "#E8EEF8" }}>{title}</div>
      </div>
      {extra}
    </div>
  );
}

function CompactStatusRow({ state, energy, xpNeed }) {
  return (
    <div className="lrpg-glass lrpg-chamfer" style={{
      display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '8px 10px', marginBottom: 12,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        border: `2px solid ${COLORS.gold}66`, background: COLORS.bgCardAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {state.character.photo
          ? <img src={state.character.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 11, color: COLORS.textMuted }}>Lv</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lrpg-display" style={{ fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>
          Lv.{state.character.level} {state.character.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 10, color: COLORS.textMuted }}>
          <span style={{ color: COLORS.crimson }}>HP {state.stats.physical}/100</span>
          <span style={{ color: COLORS.teal }}>EN {energy}/100</span>
          <span style={{ color: COLORS.gold }}>XP {state.character.xp}/{xpNeed}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: COLORS.gold, fontWeight: 700, fontSize: 13 }}>
        <CoinsIcon size={14} color={COLORS.gold} /> {state.coins}
      </div>
    </div>
  );
}

function BackRow({ label, onBack }) {
  return (
    <button className="lrpg-btn" onClick={onBack} style={{
      background: 'none', color: COLORS.textMuted, fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, padding: 0,
    }}>
      <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> {label || 'Назад'}
    </button>
  );
}

const TRAINING_PRESETS = [
  { key: 'strength', label: 'Силовая тренировка', stat: 'physical', energy: 15, xp: 50, hint: '+Сила · каркас тела' },
  { key: 'cardio', label: 'Кардио', stat: 'physical', energy: 12, xp: 40, hint: '+Выносливость' },
  { key: 'run', label: 'Бег', stat: 'physical', energy: 14, xp: 45, hint: '+Выносливость' },
  { key: 'stretch', label: 'Растяжка', stat: 'mental', energy: 6, xp: 25, hint: '+Восстановление' },
  { key: 'walk', label: 'Ходьба', stat: 'physical', energy: 8, xp: 20, hint: 'Лёгкая активность' },
];

function ActionsHub({
  state, energy, completeQuest, completeHabit, addHabit, addQuest,
  activeQuests, laterQuests, postponeQuest, skipQuest, skipTarget, setSkipTarget,
  movePriority, reactivateQuest, deleteQuest, showAddQuest, setShowAddQuest, addQuestForm,
  dismissedEvolutions, dismissEvolution, hitBossQuest,
  habits, deleteHabit,
  sub, setSub,
}) {
  const today = todayStr();
  const dailyGoals = computeDailyGoalsStatus(state);
  const doneCount = dailyGoals.filter(g => g.done).length;

  const physicalHabits = state.habits.filter(h => h.stat === 'physical');
  const studyHabits = state.habits.filter(h => h.stat === 'knowledge' || h.stat === 'focus');

  function startPreset(p) {
    const existing = state.habits.find(h => (h.title || '').toLowerCase() === p.label.toLowerCase());
    if (existing) {
      if (existing.lastDoneDate !== today) completeHabit(existing);
      return;
    }
    addHabit({ title: p.label, stat: p.stat, xp: p.xp, period: 'daily' });
  }

  const todayActions = [
    ...state.habits.filter(h => h.lastDoneDate !== today).slice(0, 6).map(h => ({
      id: h.id, kind: 'habit', title: h.title, bonus: `${STAT_LABEL[h.stat] || h.stat}`,
      done: h.lastDoneDate === today, action: () => completeHabit(h),
    })),
    ...activeQuests.filter(q => q.type === 'Daily' || q.type === 'Routine' || q.type === 'Bonus').slice(0, 4).map(q => ({
      id: q.id, kind: 'quest', title: q.title, bonus: `+${q.xp || 0} XP`,
      done: q.status === 'completed', action: () => completeQuest(q),
    })),
  ];

  return (
    <div>
      <ScreenHeader title="Действия" icon={Sword} extra={<span style={{ fontSize: 11, color: COLORS.textMuted }}>{doneCount}/4 сегодня</span>} />
      <PillTabs
        options={[{ key: 'all', label: 'Все' }, { key: 'training', label: 'Тренировки' }, { key: 'habits', label: 'Привычки' }, { key: 'quests', label: 'Квесты' }]}
        active={sub} onChange={setSub}
      />

      {sub === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Сегодня</div>
          {todayActions.length === 0 && (
            <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 14, fontSize: 12, color: COLORS.textMuted }}>
              На сегодня действий нет — добавь привычку или квест.
            </div>
          )}
          {todayActions.map(a => (
            <div key={a.kind + a.id} className="lrpg-glass lrpg-chamfer" style={{
              borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: COLORS.teal, marginTop: 2 }}>{a.bonus}</div>
              </div>
              <button className="lrpg-btn" onClick={a.action} style={{
                background: 'linear-gradient(180deg, #8B85FF, #6C63FF)', color: '#fff',
                borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                boxShadow: '0 0 12px rgba(108,99,255,0.4)',
              }}>{a.kind === 'habit' ? 'Выполнить' : 'Начать'}</button>
            </div>
          ))}

          {activeQuests.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 6px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>Квесты</span>
                <button className="lrpg-btn" onClick={() => setSub('quests')} style={{ background: 'none', color: COLORS.violet, fontSize: 11, fontWeight: 700 }}>Смотреть все →</button>
              </div>
              {activeQuests.slice(0, 2).map(q => (
                <div key={q.id} className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{q.isBoss ? '⚔️ ' : ''}{q.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>+{q.xp || 0} XP · {TYPE_LABELS[q.type] || q.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sub === 'training' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {TRAINING_PRESETS.map(p => {
            const habit = state.habits.find(h => (h.title || '').toLowerCase() === p.label.toLowerCase());
            const done = habit && habit.lastDoneDate === today;
            return (
              <div key={p.key} className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="lrpg-badge-icon" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }}>
                  <Dumbbell size={16} color={COLORS.violet} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{p.hint} · {p.energy} энергии · +{p.xp} XP</div>
                </div>
                <button className="lrpg-btn" disabled={done} onClick={() => startPreset(p)} style={{
                  background: done ? 'rgba(255,255,255,0.06)' : 'linear-gradient(180deg, #8B85FF, #6C63FF)',
                  color: done ? COLORS.teal : '#fff', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 700,
                }}>{done ? 'Готово' : 'Начать'}</button>
              </div>
            );
          })}
          {physicalHabits.length > 0 && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Твои физические привычки тоже здесь — отмечай их во вкладке «Привычки».</div>
          )}
        </div>
      )}

      {sub === 'habits' && (
        <div style={{ marginTop: 12 }}>
          <HabitsTab habits={habits} addHabit={addHabit} completeHabit={completeHabit} deleteHabit={deleteHabit} aiContextState={state} />
        </div>
      )}

      {sub === 'quests' && (
        <div style={{ marginTop: 12 }}>
          <QuestsTab
            activeQuests={activeQuests} laterQuests={laterQuests}
            completeQuest={completeQuest} postponeQuest={postponeQuest} skipQuest={skipQuest}
            skipTarget={skipTarget} setSkipTarget={setSkipTarget} movePriority={movePriority}
            reactivateQuest={reactivateQuest} deleteQuest={deleteQuest}
            showAddQuest={showAddQuest} setShowAddQuest={setShowAddQuest} addQuest={addQuestForm}
            allQuests={state.quests} dismissedEvolutions={dismissedEvolutions} dismissEvolution={dismissEvolution}
            characterLevel={state.character.level} hitBossQuest={hitBossQuest}
          />
        </div>
      )}
    </div>
  );
}

function GoalsHub({ state, goals, showAddGoal, setShowAddGoal, addGoal, updateGoalProgress, deleteGoal, addQuestsFromGoal, setGoalDeadline, resolveAbandonedGoal, sub, setSub }) {
  const todayGoals = computeDailyGoalsStatus(state);
  const doneCount = todayGoals.filter(g => g.done).length;
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const openGoals = goals.filter(g => g.progress < 100);
  const weekGoals = openGoals.filter(g => g.deadline && new Date(g.deadline) <= weekEnd);
  const monthGoals = openGoals.filter(g => g.deadline && new Date(g.deadline) <= monthEnd);
  const longGoals = openGoals.filter(g => !g.deadline || new Date(g.deadline) > monthEnd);

  const list = sub === 'week' ? weekGoals : sub === 'month' ? monthGoals : longGoals;

  return (
    <div>
      <ScreenHeader title="Цели" icon={Target} />
      <PillTabs
        options={[{ key: 'today', label: 'Сегодня' }, { key: 'week', label: 'Неделя' }, { key: 'month', label: 'Месяц' }, { key: 'long', label: 'Долгосрочные' }]}
        active={sub} onChange={setSub}
      />

      {sub === 'today' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: COLORS.textMuted }}>Прогресс дня</span>
              <span style={{ fontWeight: 700 }}>{doneCount}/4</span>
            </div>
            <Bar value={doneCount} max={4} color={COLORS.violet} height={8} />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayGoals.map(g => (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 99, flexShrink: 0,
                    background: g.done ? COLORS.teal : 'transparent',
                    border: `1px solid ${g.done ? COLORS.teal : COLORS.textMuted}`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{g.done ? 'выполнено' : 'не выполнено'}</div>
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{g.done ? '1/1' : '0/1'}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Мои цели</span>
            <button className="lrpg-btn" onClick={() => { setSub('long'); setShowAddGoal(true); }} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700 }}>+ Добавить</button>
          </div>
          {openGoals.slice(0, 4).map(g => (
            <div key={g.id} className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{g.title}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, margin: '4px 0 6px' }}>Прогресс: {g.progress}%{g.deadline ? ` · до ${g.deadline}` : ''}</div>
              <Bar value={g.progress} max={100} color={COLORS.violet} height={6} />
            </div>
          ))}
        </div>
      )}

      {sub !== 'today' && (
        <div style={{ marginTop: 12 }}>
          {list.length === 0 && sub !== 'long' && (
            <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 14, fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
              Нет целей на этот горизонт. Долгосрочные цели живут в последней вкладке.
            </div>
          )}
          {list.map(g => (
            <div key={g.id} className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{g.title}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, margin: '4px 0 6px' }}>{g.progress}%{g.deadline ? ` · ${g.deadline}` : ''}</div>
              <Bar value={g.progress} max={100} color={COLORS.teal} height={6} />
            </div>
          ))}
          <GoalsTab
            goals={goals} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal}
            addGoal={addGoal} updateGoalProgress={updateGoalProgress} deleteGoal={deleteGoal}
            addQuestsFromGoal={addQuestsFromGoal} state={state}
            setGoalDeadline={setGoalDeadline} resolveAbandonedGoal={resolveAbandonedGoal}
          />
        </div>
      )}
    </div>
  );
}

function ProgressHub({ state, energy, todayCheckin, setDailyCheckin, toggleRecoveryMode, sub, setSub }) {
  const xpNeed = xpNeeded(state.character.level);
  const daysPlayed = (state.playLog || []).length;
  const completedQuests = state.quests.filter(q => q.status === 'completed').length;
  const habitsDone = state.habits.filter(h => h.lastDoneDate === todayStr()).length;
  const skillRows = [
    { label: 'Тренировки', value: state.stats.physical, icon: Dumbbell },
    { label: 'Учёба', value: state.stats.knowledge, icon: BookOpen },
    { label: 'Работа', value: state.stats.career, icon: Briefcase },
    { label: 'Выносливость', value: state.stats.focus, icon: Zap },
    { label: 'Уверенность', value: state.stats.social, icon: Sparkles },
  ];

  return (
    <div>
      <ScreenHeader title="Прогресс" icon={Activity} />
      <PillTabs
        options={[{ key: 'stats', label: 'Характеристики' }, { key: 'skills', label: 'Навыки' }, { key: 'history', label: 'Статистика' }]}
        active={sub} onChange={setSub}
      />

      {sub === 'stats' && (
        <div style={{ marginTop: 12 }}>
          <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span className="lrpg-display" style={{ color: COLORS.gold }}>Lv.{state.character.level}</span>
              <span style={{ color: COLORS.textMuted }}>Опыт {state.character.xp}/{xpNeed}</span>
            </div>
            <div style={{ marginTop: 8 }}><Bar value={state.character.xp} max={xpNeed} color={COLORS.violet} height={8} /></div>
          </div>
          <StatsTab
            stats={state.stats} energy={energy} todayCheckin={todayCheckin}
            setDailyCheckin={setDailyCheckin} chronicle={state.chronicle}
            recoveryMode={state.recoveryMode} toggleRecoveryMode={toggleRecoveryMode}
            statsHistory={state.statsHistory}
          />
        </div>
      )}

      {sub === 'skills' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {skillRows.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Icon size={14} color={COLORS.violet} />
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{s.value}/100</span>
                </div>
                <Bar value={s.value} max={100} color={COLORS.violet} height={6} />
              </div>
            );
          })}
        </div>
      )}

      {sub === 'history' && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Статистика</div>
            {[
              ['Дней в игре', daysPlayed],
              ['Выполнено заданий', completedQuests],
              ['Привычек сегодня', habitsDone],
              ['XP сейчас', state.character.xp],
              ['Монет', state.coins],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.textMuted }}>{l}</span><span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
          <CalendarTab playLog={state.playLog} firstOpenedAt={state.firstOpenedAt} />
        </div>
      )}
    </div>
  );
}

function ProfileRow({ icon: Icon, label, onClick }) {
  return (
    <button className="lrpg-btn" onClick={onClick} style={{
      width: '100%', background: 'none', display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 0', color: COLORS.text, textAlign: 'left',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Icon size={14} color={COLORS.violet} />
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <ChevronRight size={14} color={COLORS.textMuted} />
    </button>
  );
}

function ProfileHub({
  state, energy, xpNeed, setTab, setSubTab, openProfile,
}) {
  const currentWeight = latestWeight(state.body);
  return (
    <div>
      <ScreenHeader title="Профиль" icon={User} extra={
        <button className="lrpg-btn" onClick={() => openProfile('settings')} style={{ background: 'none' }}>
          <SettingsIcon size={16} color={COLORS.textMuted} />
        </button>
      } />

      <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 16, padding: 14, marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${COLORS.gold}66`, background: COLORS.bgCardAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {state.character.photo
            ? <img src={state.character.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <User size={24} color={COLORS.textMuted} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lrpg-display" style={{ fontSize: 16, color: COLORS.gold, fontWeight: 700 }}>{state.character.name}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>Уровень {state.character.level}{state.character.title ? ` · ${state.character.title}` : ''}</div>
          <div style={{ fontSize: 10, color: COLORS.crimson, marginBottom: 3 }}>HP {state.stats.physical}/100</div>
          <Bar value={state.stats.physical} max={100} color={COLORS.crimson} height={4} />
          <div style={{ fontSize: 10, color: COLORS.teal, margin: '5px 0 3px' }}>Энергия {energy}/100</div>
          <Bar value={energy} max={100} color={COLORS.teal} height={4} />
          <div style={{ fontSize: 10, color: COLORS.gold, margin: '5px 0 3px' }}>Опыт {state.character.xp}/{xpNeed}</div>
          <Bar value={state.character.xp} max={xpNeed} color={COLORS.gold} height={4} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, marginBottom: 4 }}>Персонаж</div>
          <ProfileRow icon={Shirt} label="Внешность" onClick={() => openProfile('body')} />
          <ProfileRow icon={Ruler} label="Рост / Вес" onClick={() => openProfile('body')} />
          <ProfileRow icon={Activity} label="Характеристики" onClick={() => { setTab('progress'); setSubTab(s => ({ ...s, progress: 'stats' })); }} />
        </div>
        <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, marginBottom: 4 }}>Моё</div>
          <ProfileRow icon={Backpack} label="Инвентарь" onClick={() => openProfile('inventory')} />
          <ProfileRow icon={CoinsIcon} label="Магазин" onClick={() => openProfile('shop')} />
          <ProfileRow icon={Trophy} label="Достижения" onClick={() => openProfile('achievements')} />
        </div>
      </div>

      <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, marginBottom: 4 }}>Моя жизнь</div>
        <ProfileRow icon={Wallet} label="Финансы" onClick={() => openProfile('finance')} />
        <ProfileRow icon={Car} label="Гараж" onClick={() => openProfile('garage')} />
        <ProfileRow icon={Youtube} label="YouTube" onClick={() => openProfile('youtube')} />
        <ProfileRow icon={BookOpen} label="Учёба" onClick={() => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); }} />
        <ProfileRow icon={Briefcase} label="Работа" onClick={() => openProfile('finance')} />
      </div>

      <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 14, padding: '10px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, marginBottom: 4 }}>Настройки</div>
        <ProfileRow icon={SettingsIcon} label="Основные" onClick={() => openProfile('settings')} />
        <ProfileRow icon={Save} label="Сохранение" onClick={() => openProfile('settings')} />
        <ProfileRow icon={ScrollText} label="Хроника" onClick={() => openProfile('chronicle')} />
        <ProfileRow icon={MessageCircle} label="Наставник" onClick={() => openProfile('mentor')} />
        <ProfileRow icon={HeartHandshake} label="События жизни" onClick={() => openProfile('events')} />
      </div>

      <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 }}>
        {currentWeight ? `${state.body.heightCm || '—'} см · ${currentWeight} кг` : 'Заполни рост и вес — силуэт на Home изменится'}
      </div>
    </div>
  );
}


export default function LifeRPG() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [welcomeBackDays, setWelcomeBackDays] = useState(0);
  const [hasExportedThisSession, setHasExportedThisSession] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      if (!hasExportedThisSession) setShowExportReminder(true);
    }, 12 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [loaded, hasExportedThisSession]);
  const [tab, setTab] = useState('home');
  const [subTab, setSubTab] = useState({ actions: 'all', goals: 'today', progress: 'stats', profile: 'hub', more: 'shop' });
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [skipTarget, setSkipTarget] = useState(null);
  const [levelUpFlash, setLevelUpFlash] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [storageStatus, setStorageStatus] = useState('checking');
  const [storageError, setStorageError] = useState(null);
  const [localBackupOk, setLocalBackupOk] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      let cloudState = null;
      const hasStorage = typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function';
      if (!hasStorage) {
        setStorageStatus('unavailable');
      } else {
        try {
          const res = await withTimeout(window.storage.get(STORAGE_KEY, false), SAVE_TIMEOUT_MS, 'Загрузка');
          if (res && res.value) cloudState = JSON.parse(res.value);
          setStorageStatus('ok');
        } catch (e) {
          cloudState = null;
          setStorageStatus('error');
          setStorageError(e && e.message ? e.message : String(e));
        }
      }
      // В облако (см. buildCloudPayload в saveNow) уходит только "ядро" — без finance.transactions
      // и finance.taxi.orders (это была основная причина, почему сохранение разрасталось до 60+
      // чанков и переставало влезать в CloudStorage). Полная финансовая история хранится только
      // в локальной копии на этом устройстве и в Экспорте. Поэтому если локальная копия есть —
      // она главнее облачной: в ней данные полнее. Облако используется только как подстраховка
      // для "ядра" на случай, если это свежее устройство или локальные данные потеряны — тогда
      // полную финансовую историю можно будет вернуть только через Импорт.
      let s = null;
      const backup = readLocalBackup();
      if (backup) {
        try { s = JSON.parse(backup); } catch (e) { /* битая резервная копия — игнорируем */ }
      }
      if (!s) s = cloudState;
      const defs = defaultState();
      s = { ...defs, ...(s || {}) };
      // Coin Ledger — если сохранение старое (до этого ТЗ), инициализируем историю с текущего баланса,
      // а не с нуля/50, чтобы не занижать реальный накопленный прогресс игрока.
      if (typeof s.coinsEarnedAllTime !== 'number') s.coinsEarnedAllTime = s.coins || 0;
      if (typeof s.coinsSpentAllTime !== 'number') s.coinsSpentAllTime = 0;
      if (!Array.isArray(s.coinTransactions)) s.coinTransactions = [];
      if (!s.cosmetics) s.cosmetics = { unlocked: [], equipped: { frame: null, background: null, title: null, nameColor: null } };
      // Календарь "дней в игре": отмечаем сегодняшний день как сыгранный (без дублей) и
      // фиксируем дату первого запуска, если это самое первое сохранение.
      if (!Array.isArray(s.playLog)) s.playLog = [];
      if (!s.firstOpenedAt) s.firstOpenedAt = Date.now();
      const todayKey = todayStr();
      if (!s.playLog.includes(todayKey)) s.playLog = [...s.playLog, todayKey];
      s.rewards = (Array.isArray(s.rewards) ? s.rewards : DEFAULT_REWARDS).map(r => ({ category: 'reallife', description: '', icon: '🎁', enabled: true, ...r }));
      s.finance = { ...defs.finance, ...(s.finance || {}) };
      s.finance.taxi = { ...defs.finance.taxi, ...(s.finance.taxi || {}) };
      s.finance = migrateFinance(s.finance);
      s.garage = { ...defs.garage, ...(s.garage || {}) };
      s.body = { ...defs.body, ...(s.body || {}) };
      s.nutrition = { ...defs.nutrition, ...(s.nutrition || {}) };
      if (!Array.isArray(s.nutrition.entries)) s.nutrition.entries = [];
      s.youtube = { ...defs.youtube, ...(s.youtube || {}) };
      if (!Array.isArray(s.youtube.channels)) s.youtube.channels = [];
      const result = ensureDailyContent(s);
      setState(result.state);
      setWelcomeBackDays(result.welcomeBackDays);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded || !state) return;
    if (storageStatus === 'unavailable') return;
    saveNow();
  }, [state, loaded, storageStatus]);

  async function saveNow() {
    const fullPayload = JSON.stringify(state);
    // Всегда обновляем локальную резервную копию сразу — она не требует сети и не зависает,
    // так что даже если основное хранилище зависнет/откажет, прогресс не потеряется. Локальная
    // копия — единственное место (кроме Экспорта), где хранится ПОЛНАЯ финансовая история.
    const localOk = writeLocalBackup(fullPayload);
    setLocalBackupOk(localOk);
    if (typeof window === 'undefined' || !window.storage || typeof window.storage.set !== 'function') {
      setStorageStatus('unavailable');
      return false;
    }
    try {
      // В облако уходит только "ядро" — без finance.transactions/taxi.orders/истории платежей по
      // долгам. У пользователя эти списки растут без ограничения (в отличие от Хроники и
      // coinTransactions, урезанных до 300 записей) и раздували сохранение до 60+ чанков, из-за
      // чего CloudStorage систематически не успевал/не отвечал. Полная история остаётся только
      // локально на этом устройстве и в Экспорте.
      const cloudPayload = JSON.stringify(buildCloudPayload(state));
      const res = await withTimeout(window.storage.set(STORAGE_KEY, cloudPayload, false), SAVE_TIMEOUT_MS, 'Сохранение');
      if (!res) {
        setStorageStatus('error');
        setStorageError('set() вернул null — платформа отклонила запись (возможно, сохранение стало слишком большим)');
        return false;
      }
      setStorageStatus('ok');
      setStorageError(null);
      setLastSavedAt(Date.now());
      return true;
    } catch (e) {
      setStorageStatus('error');
      setStorageError(e && e.message ? e.message : String(e));
      return false;
    }
  }

  // Раз в день: пробуем заменить шаблонные Bonus-квесты на персональные от AI,
  // основанные на реальных статах/целях персонажа. Если AI недоступен — молча
  // оставляем то, что уже создал ensureDailyContent (пул готовых заданий),
  // и просто отметим сегодняшний день как "попытку сделали", чтобы не долбить AI каждый рендер.
  useEffect(() => {
    if (!loaded || !state) return;
    const today = todayStr();
    if (state.lastAIQuestDate === today) return;
    (async () => {
      try {
        const specs = await aiDailyQuestSpecs(state);
        setState(prev => {
          if (prev.lastAIQuestDate === today) return prev; // уже подхватили в другом эффекте/вкладке
          const keepQuests = prev.quests.filter(q => !(q.status === 'active' && q.source === 'pool' && q.genDate === today && q.type === 'Bonus'));
          let order = prev.nextOrder || 1;
          const aiQuests = specs.map(spec => {
            const [lo, hi] = TYPE_XP_RANGE[spec.type];
            const xp = Math.round(lo + (hi - lo) * 0.5);
            return {
              id: uid(), title: spec.title, type: spec.type, difficulty: 'Normal',
              xp, coins: Math.round(xp * 0.4), stat: spec.stat, secondaryStat: spec.secondaryStat,
              status: 'active', deadline: spec.type === 'Daily' ? today + 'T23:59' : null,
              order: order++, createdAt: Date.now(), source: 'ai', genDate: today,
            };
          });
          return {
            ...prev, quests: [...keepQuests, ...aiQuests], nextOrder: order, lastAIQuestDate: today,
            chronicle: pushChronicle(prev.chronicle, 'BONUS_QUESTS', `🧠 ${MENTOR_NAME} подготовил персональные задания на сегодня (${aiQuests.length}).`),
          };
        });
      } catch (e) {
        setState(prev => prev.lastAIQuestDate === today ? prev : { ...prev, lastAIQuestDate: today });
      }
    })();
  }, [loaded, state && state.lastAIQuestDate]);

  // Раздел 18 ТЗ: раз в месяц (при первом заходе в новом месяце) фиксируем снимок Net Worth в историю.
  useEffect(() => {
    if (!loaded || !state) return;
    const mk = monthStr();
    const hist = state.finance.netWorthHistory || [];
    if (hist.some(h => h.month === mk)) return;
    const { netWorth } = computeNetWorth(state);
    setState(prev => {
      const prevHist = prev.finance.netWorthHistory || [];
      if (prevHist.some(h => h.month === mk)) return prev;
      return { ...prev, finance: { ...prev.finance, netWorthHistory: [...prevHist, { month: mk, netWorth, date: todayStr() }] } };
    });
  }, [loaded, state && monthStr()]);

  function pushChronicle(list, type, text) {
    return [{ id: uid(), ts: Date.now(), type, text }, ...list].slice(0, 300);
  }

  function addManualChronicleEntry(text, dateStr) {
    setState(prev => {
      const ts = dateStr ? new Date(dateStr + 'T12:00:00').getTime() : Date.now();
      const entry = { id: uid(), ts, type: 'MANUAL', text, isManual: true };
      const chronicle = [...prev.chronicle, entry].sort((a, b) => b.ts - a.ts).slice(0, 300);
      return { ...prev, chronicle };
    });
  }

  function editChronicleEntry(id, newText) {
    setState(prev => ({
      ...prev,
      chronicle: prev.chronicle.map(c => c.id === id
        ? { ...c, text: newText, edited: true, originalText: c.originalText || c.text }
        : c),
    }));
  }

  function deleteChronicleEntry(id) {
    setState(prev => ({ ...prev, chronicle: prev.chronicle.filter(c => c.id !== id) }));
  }

  function completeQuest(q) {
    setState(prev => {
      const mult = antiFarmMultiplier(prev.chronicle, q.title, prev.difficultyMode);
      const awardedXp = Math.max(1, Math.round(q.xp * mult));
      const awardedCoins = Math.max(0, Math.round(q.coins * mult));
      const { character, bonusCoins, leveledUp } = applyXP(prev.character, awardedXp);
      const stats = { ...prev.stats };
      if (q.stat && stats[q.stat] !== undefined) {
        stats[q.stat] = Math.min(100, stats[q.stat] + 2);
      }
      if (q.secondaryStat && stats[q.secondaryStat] !== undefined) {
        stats[q.secondaryStat] = Math.min(100, stats[q.secondaryStat] + 1);
      }
      const quests = prev.quests.map(x => x.id === q.id ? { ...x, status: 'completed', completedAt: Date.now() } : x);
      const statParts = [
        q.stat && stats[q.stat] !== undefined ? `+2 ${STAT_LABEL[q.stat]} (основной)` : null,
        q.secondaryStat && stats[q.secondaryStat] !== undefined ? `+1 ${STAT_LABEL[q.secondaryStat]} (побочный)` : null,
      ].filter(Boolean).join(', ');
      const farmNote = mult < 1 ? ` [anti-farm ×${mult}]` : '';
      let chronicle = pushChronicle(prev.chronicle, 'QUEST_COMPLETED', `${q.title} — выполнено (+${awardedXp} XP, +${awardedCoins} Coins${statParts ? `, ${statParts}` : ''})${farmNote}`);
      if (leveledUp) {
        chronicle = pushChronicle(chronicle, 'LEVEL_UP', `Level Up! Теперь ты ${character.level} уровня.`);
        setLevelUpFlash(character.level);
        gameFeedback('LEVEL_UP', { level: character.level });
        setTimeout(() => setLevelUpFlash(null), 3200);
      }
      const ledger1 = applyCoinLedger(prev, 'earn', awardedCoins, 'quest', q.title, q.id);
      const ledger2 = bonusCoins > 0 ? applyCoinLedger({ ...prev, ...ledger1 }, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus') : ledger1;
      return { ...prev, ...ledger2, character, stats, quests, chronicle };
    });
    gameFeedback('QUEST_COMPLETE', { xp: Math.max(1, Math.round(q.xp)), coins: Math.max(0, Math.round(q.coins)) });
    if (q.xp) gameFeedback('XP_GAIN', { xp: Math.max(1, Math.round(q.xp)) });
    if (q.coins) gameFeedback('COIN_GAIN', { coins: Math.max(0, Math.round(q.coins)) });
  }

  function hitBossQuest(id, amount) {
    setState(prev => {
      const q = prev.quests.find(x => x.id === id);
      if (!q || amount <= 0) return prev;
      const remaining = Math.max(0, (q.bossHPRemaining ?? q.bossHP) - amount);
      const defeated = remaining <= 0;
      let quests, chronicle = prev.chronicle, character = prev.character, ledger = { coins: prev.coins, coinsEarnedAllTime: prev.coinsEarnedAllTime, coinsSpentAllTime: prev.coinsSpentAllTime, coinTransactions: prev.coinTransactions };
      const stats = { ...prev.stats };
      if (defeated) {
        const mult = antiFarmMultiplier(prev.chronicle, q.title, prev.difficultyMode);
        const awardedXp = Math.max(1, Math.round(q.xp * mult));
        const awardedCoins = Math.max(0, Math.round(q.coins * mult));
        const res = applyXP(character, awardedXp);
        character = res.character;
        ledger = applyCoinLedger(prev, 'earn', awardedCoins, 'quest', q.title, q.id);
        if (res.bonusCoins > 0) ledger = applyCoinLedger({ ...prev, ...ledger }, 'earn', res.bonusCoins, 'levelup', 'Level-Up Bonus');
        if (q.stat && stats[q.stat] !== undefined) stats[q.stat] = Math.min(100, stats[q.stat] + 2);
        if (q.secondaryStat && stats[q.secondaryStat] !== undefined) stats[q.secondaryStat] = Math.min(100, stats[q.secondaryStat] + 1);
        quests = prev.quests.map(x => x.id === id ? { ...x, status: 'completed', completedAt: Date.now(), bossHPRemaining: 0 } : x);
        chronicle = pushChronicle(chronicle, 'QUEST_COMPLETED', `💀 Boss Task «${q.title}» повержен! (+${awardedXp} XP, +${awardedCoins} Coins)`);
        if (res.leveledUp) {
          chronicle = pushChronicle(chronicle, 'LEVEL_UP', `Level Up! Теперь ты ${character.level} уровня.`);
          setLevelUpFlash(character.level);
          setTimeout(() => setLevelUpFlash(null), 3200);
        }
      } else {
        quests = prev.quests.map(x => x.id === id ? { ...x, bossHPRemaining: remaining } : x);
        chronicle = pushChronicle(chronicle, 'SYSTEM', `⚔️ Удар по «${q.title}»: -${amount} HP (осталось ${remaining})`);
      }
      return { ...prev, quests, chronicle, character, stats, ...ledger };
    });
  }

  function skipQuest(q, reason) {
    setState(prev => {
      const stats = { ...prev.stats };
      let text, ledger = { coins: prev.coins, coinsEarnedAllTime: prev.coinsEarnedAllTime, coinsSpentAllTime: prev.coinsSpentAllTime, coinTransactions: prev.coinTransactions };
      if (reason) {
        text = `${q.title} — пропущено (уважительная причина: ${reason})`;
      } else {
        const base = PENALTY[q.type] || { coins: 0, stat: 0 };
        const diffMult = (DIFFICULTY_SETTINGS[prev.difficultyMode] || DIFFICULTY_SETTINGS.normal).penaltyMult;
        const recoveryMult = prev.recoveryMode ? 0.5 : 1;
        const finalMult = diffMult * recoveryMult;
        const pen = { coins: Math.round(base.coins * finalMult), stat: Math.max(base.stat ? 1 : 0, Math.round(base.stat * finalMult)) };
        const deduct = Math.min(prev.coins, pen.coins);
        ledger = applyCoinLedger(prev, 'adjustment', -deduct, 'penalty', `Штраф: ${q.title}`, q.id);
        if (pen.stat && q.stat && stats[q.stat] !== undefined) {
          stats[q.stat] = Math.max(0, stats[q.stat] - pen.stat);
        }
        text = `${q.title} — пропущено (-${deduct} Coins${pen.stat && q.stat ? `, -${pen.stat} ${STAT_LABEL[q.stat]}` : ''})`;
      }
      const quests = prev.quests.map(x => x.id === q.id ? { ...x, status: 'skipped', skipReason: reason || null } : x);
      return { ...prev, ...ledger, stats, quests, chronicle: pushChronicle(prev.chronicle, 'QUEST_SKIPPED', text) };
    });
    setSkipTarget(null);
  }

  function postponeQuest(q) {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(x => x.id === q.id ? { ...x, status: 'later' } : x),
      chronicle: pushChronicle(prev.chronicle, 'QUEST_LATER', `${q.title} — отложено`),
    }));
  }

  function reactivateQuest(q) {
    setState(prev => ({ ...prev, quests: prev.quests.map(x => x.id === q.id ? { ...x, status: 'active' } : x) }));
  }

  function deleteQuest(q) {
    setState(prev => ({ ...prev, quests: prev.quests.filter(x => x.id !== q.id) }));
  }

  function addQuest(data) {
    setState(prev => {
      const [lo, hi] = TYPE_XP_RANGE[data.type];
      const mult = DIFF_MULT[data.difficulty];
      const xp = Math.round(lo + (hi - lo) * mult);
      const coins = Math.round(xp * 0.4);
      const isBoss = data.type === 'Boss';
      const bossHP = isBoss ? Math.max(10, Number(data.bossHP) || 100) : null;
      const q = {
        id: uid(), title: data.title, type: data.type, difficulty: data.difficulty,
        xp, coins, stat: data.stat, secondaryStat: data.secondaryStat || null, status: 'active',
        deadline: data.deadline || null, order: prev.nextOrder, createdAt: Date.now(),
        isBoss, bossHP, bossHPRemaining: bossHP,
      };
      return {
        ...prev, quests: [...prev.quests, q], nextOrder: prev.nextOrder + 1,
        chronicle: pushChronicle(prev.chronicle, 'QUEST_CREATED', isBoss ? `⚔️ Новый Boss Task: ${q.title} (HP ${bossHP})` : `Новый квест: ${q.title}`),
      };
    });
    setShowAddQuest(false);
  }

  function movePriority(q, dir) {
    setState(prev => {
      // сортировка идёт только среди квестов ТОГО ЖЕ типа — иначе кнопки
      // "выше/ниже" в сгруппированном списке будут не глазами не совпадать с тем,
      // что реально произошло (порядок менялся бы с квестом другого типа).
      const active = prev.quests.filter(x => x.status === 'active' && x.type === q.type).sort((a, b) => a.order - b.order);
      const idx = active.findIndex(x => x.id === q.id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= active.length) return prev;
      const a = active[idx], b = active[swapIdx];
      return {
        ...prev,
        quests: prev.quests.map(x => {
          if (x.id === a.id) return { ...x, order: b.order };
          if (x.id === b.id) return { ...x, order: a.order };
          return x;
        }),
      };
    });
  }

  function addGoal(data) {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, {
        id: uid(), title: data.title, description: data.description,
        deadline: data.deadline || null, sphere: data.sphere, progress: 0,
        createdAt: Date.now(), updatedAt: Date.now(),
      }],
      chronicle: pushChronicle(prev.chronicle, 'GOAL_CREATED', `Новая цель: ${data.title}`),
    }));
    setShowAddGoal(false);
  }

  function updateGoalProgress(id, val) {
    setState(prev => {
      const goal = prev.goals.find(g => g.id === id);
      const wasComplete = goal.progress >= 100;
      const goals = prev.goals.map(g => g.id === id ? { ...g, progress: val, updatedAt: Date.now() } : g);
      let chronicle = prev.chronicle;
      if (val >= 100 && !wasComplete) {
        chronicle = pushChronicle(chronicle, 'GOAL_COMPLETED', `Цель достигнута: ${goal.title}!`);
      }
      return { ...prev, goals, chronicle };
    });
  }

  function setGoalDeadline(id, deadline) {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, deadline, updatedAt: Date.now() } : g),
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Срок цели обновлён по сценарию Reality Check.`),
    }));
  }

  function deleteGoal(id) {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }

  function resolveAbandonedGoal(id, action) {
    setState(prev => {
      const goal = prev.goals.find(g => g.id === id);
      if (!goal) return prev;
      if (action === 'resume') {
        return {
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, updatedAt: Date.now() } : g),
          chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Возвращаюсь к цели «${goal.title}».`),
        };
      }
      if (action === 'extend') {
        const base = goal.deadline ? new Date(goal.deadline) : new Date();
        base.setDate(base.getDate() + 30);
        return {
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, deadline: base.toISOString().slice(0, 10), updatedAt: Date.now() } : g),
          chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Срок цели «${goal.title}» продлён на 30 дней.`),
        };
      }
      if (action === 'reduce') {
        return {
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, progress: 100, updatedAt: Date.now() } : g),
          chronicle: pushChronicle(prev.chronicle, 'GOAL_COMPLETED', `Цель «${goal.title}» принята в уменьшенном объёме — засчитана как выполненная.`),
        };
      }
      if (action === 'abandon') {
        return {
          ...prev,
          goals: prev.goals.filter(g => g.id !== id),
          chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Цель «${goal.title}» отменена — это нормально, не всё должно быть доведено до конца.`),
        };
      }
      return prev;
    });
  }

  // Раздел 13 ТЗ: покупка — проверка баланса, списание через Ledger, запись в Chronicle,
  // фиксация последней покупки для возможного Refund (раздел 14).
  function buyReward(r) {
    setState(prev => {
      if (r.enabled === false) return prev;
      if (prev.coins < r.cost) return prev;
      const ledger = applyCoinLedger(prev, 'spend', r.cost, 'shop', r.title, r.id);
      return {
        ...prev, ...ledger,
        lastPurchase: { id: uid(), rewardId: r.id, title: r.title, cost: r.cost, ts: Date.now(), isCustom: !!r.custom },
        chronicle: pushChronicle(prev.chronicle, 'REWARD_PURCHASED', `Куплено: ${r.title} (-${r.cost} Coins)`),
      };
    });
  }

  // Раздел 14 ТЗ: ограниченный Refund — только для пользовательских наград, одна отмена в сутки,
  // не возвращает XP/Stats/Level (это Coins-only операция).
  function refundLastPurchase() {
    setState(prev => {
      const lp = prev.lastPurchase;
      if (!lp || !lp.isCustom) return prev;
      if (prev.lastRefundAt && Date.now() - prev.lastRefundAt < 86400000) return prev;
      const ledger = applyCoinLedger(prev, 'refund', lp.cost, 'refund', `Возврат: ${lp.title}`, lp.rewardId);
      return {
        ...prev, ...ledger, lastPurchase: null, lastRefundAt: Date.now(),
        chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `↩️ Возврат покупки: ${lp.title} (+${lp.cost} Coins)`),
      };
    });
  }

  function addReward(data) {
    setState(prev => ({
      ...prev,
      rewards: [...prev.rewards, {
        id: uid(), title: data.title, cost: Math.max(1, Math.round(Number(data.cost) || 0)),
        category: data.category || 'reallife', description: data.description || '', icon: data.icon || '🎁',
        enabled: true, custom: true,
      }],
    }));
    setShowAddReward(false);
  }

  function deleteReward(id) {
    setState(prev => ({ ...prev, rewards: prev.rewards.filter(r => r.id !== id) }));
  }

  function setRewardEnabled(id, enabled) {
    setState(prev => ({ ...prev, rewards: prev.rewards.map(r => r.id === id ? { ...r, enabled } : r) }));
  }

  // Раздел 15 ТЗ: покупка косметики — тот же Ledger, никогда не трогает Stats/XP/Level.
  function buyCosmetic(item) {
    setState(prev => {
      if (prev.cosmetics.unlocked.includes(item.id) || prev.coins < item.cost) return prev;
      const ledger = applyCoinLedger(prev, 'spend', item.cost, 'shop_cosmetic', item.name, item.id);
      return {
        ...prev, ...ledger,
        cosmetics: { ...prev.cosmetics, unlocked: [...prev.cosmetics.unlocked, item.id] },
        chronicle: pushChronicle(prev.chronicle, 'REWARD_PURCHASED', `✨ Косметика: ${item.name} (-${item.cost} Coins)`),
      };
    });
  }

  function equipCosmetic(type, id) {
    setState(prev => ({ ...prev, cosmetics: { ...prev.cosmetics, equipped: { ...prev.cosmetics.equipped, [type]: id } } }));
  }

  function setDailyCheckin(data) {
    setState(prev => ({
      ...prev,
      dailyCheckin: { date: todayStr(), ...data },
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', 'Чек-ин на сегодня обновлён.'),
    }));
  }

  function setCharacterName(name) {
    setState(prev => ({ ...prev, character: { ...prev.character, name } }));
  }

  function setCharacterTitle(title) {
    setState(prev => ({ ...prev, character: { ...prev.character, title } }));
  }

  function setCharacterPhoto(dataUrl) {
    setState(prev => ({ ...prev, character: { ...prev.character, photo: dataUrl } }));
  }

  function addHabit(data) {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, {
        id: uid(), title: data.title, stat: data.stat, secondaryStat: data.secondaryStat || null, level: 1,
        streakCurrent: 0, bestStreak: 0, lastDoneDate: null, createdAt: Date.now(),
      }],
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Новая привычка: ${data.title}`),
    }));
  }

  function deleteHabit(id) {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  }

  function completeHabit(h) {
    setState(prev => {
      const today = todayStr();
      if (h.lastDoneDate === today) return prev;
      const streakCurrent = h.streakCurrent + 1;
      const bestStreak = Math.max(h.bestStreak, streakCurrent);
      let level = h.level;
      let chronicle = prev.chronicle;
      let leveledHabit = false;
      if (streakCurrent % 7 === 0 && streakCurrent / 7 >= level) {
        level += 1;
        leveledHabit = true;
      }
      const stats = { ...prev.stats };
      if (h.stat && stats[h.stat] !== undefined) stats[h.stat] = Math.min(100, stats[h.stat] + 1);
      if (h.secondaryStat && stats[h.secondaryStat] !== undefined) stats[h.secondaryStat] = Math.min(100, stats[h.secondaryStat] + 1);
      const habits = prev.habits.map(x => x.id === h.id ? { ...x, streakCurrent, bestStreak, level, lastDoneDate: today } : x);
      chronicle = pushChronicle(chronicle, 'SYSTEM', `Привычка «${h.title}» — день ${streakCurrent} подряд${h.stat && stats[h.stat] !== undefined ? ` (+1 ${STAT_LABEL[h.stat]})` : ''}${h.secondaryStat && stats[h.secondaryStat] !== undefined ? ` (+1 ${STAT_LABEL[h.secondaryStat]})` : ''}.`);
      if (leveledHabit) {
        chronicle = pushChronicle(chronicle, 'SYSTEM', `Привычка «${h.title}» выросла до уровня ${level}!`);
      }
      return { ...prev, habits, stats, chronicle };
    });
    gameFeedback('QUEST_COMPLETE', { xp: 10, coins: 0 });
  }

  function toggleRecoveryMode() {
    setState(prev => ({
      ...prev, recoveryMode: !prev.recoveryMode,
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', !prev.recoveryMode ? 'Recovery Mode включён — нагрузка снижена.' : 'Recovery Mode выключен — нагрузка возвращается постепенно.'),
    }));
  }

  function setAvailableHours(hours) {
    setState(prev => ({ ...prev, availableHoursPerWeek: hours }));
  }

  function setDifficultyMode(mode) {
    setState(prev => ({
      ...prev, difficultyMode: mode,
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Режим сложности изменён на ${DIFFICULTY_SETTINGS[mode].label}.`),
    }));
  }

  function setFinanceMode(mode) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, mode } }));
  }

  function setDebtStrategy(strategy) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, strategy } }));
  }

  // Раздел 3+10 ТЗ: единая точка входа для любой операции — двигает Cash Balance
  // и попадает во все месячные расчёты Finance. Даёт немного XP за сам факт учёта (раздел 19).
  function addTransaction(data) {
    setState(prev => {
      const amount = Math.abs(Number(data.amount) || 0);
      if (amount <= 0) return prev;
      const type = data.type === 'income' ? 'income' : 'expense';
      const tx = {
        id: uid(), type, title: (data.title || '').trim() || (type === 'income' ? 'Доход' : 'Расход'),
        amount, category: data.category || (type === 'income' ? 'other' : 'other_life'),
        date: data.date || todayStr(), recurring: !!data.recurring, essential: !!data.essential,
        source: data.source || 'manual', ts: Date.now(),
      };
      const cashBalance = prev.finance.cashBalance + (type === 'income' ? amount : -amount);
      const { character, bonusCoins } = applyXP(prev.character, 8);
      const chronicle = pushChronicle(prev.chronicle, 'SYSTEM', `${type === 'income' ? '💰 Доход' : '💸 Расход'}: ${tx.title} — ${amount}`);
      const ledger = bonusCoins > 0 ? applyCoinLedger(prev, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus') : {};
      return {
        ...prev, character, ...ledger, chronicle,
        finance: { ...prev.finance, transactions: [...prev.finance.transactions, tx], cashBalance },
      };
    });
  }

  function deleteTransaction(id) {
    setState(prev => {
      const tx = prev.finance.transactions.find(t => t.id === id);
      if (!tx) return prev;
      const cashBalance = prev.finance.cashBalance - (tx.type === 'income' ? tx.amount : -tx.amount);
      return { ...prev, finance: { ...prev.finance, transactions: prev.finance.transactions.filter(t => t.id !== id), cashBalance } };
    });
  }

  // Раздел 5 ТЗ: источники дохода — профили, из которых можно быстро залогировать доход.
  function addIncomeSource(data) {
    setState(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        incomeSources: [...prev.finance.incomeSources, {
          id: uid(), name: (data.name || '').trim() || 'Источник', type: data.type || 'other',
          fixed: !!data.fixed, amount: Number(data.amount) || 0, frequency: data.frequency || 'monthly',
        }],
      },
    }));
  }

  function deleteIncomeSource(id) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, incomeSources: prev.finance.incomeSources.filter(s => s.id !== id) } }));
  }

  function addDebt(data) {
    setState(prev => {
      const loanType = data.loanType || (data.isAnnuity ? 'annuity' : 'manual');
      const total = data.total;
      const termMonths = loanType === 'simple' ? null : (data.termMonths || null);
      const interestRate = loanType === 'simple' ? 0 : (data.interestRate || 0);
      const alreadyPaidMonths = Math.max(0, Math.min(data.alreadyPaidMonths || 0, termMonths || 0));
      let remaining = total;
      // Если долг уже частично оплачен ДО того, как его добавили в игру (например, кредит
      // взят несколько месяцев назад) — пересчитываем реальный текущий остаток по графику,
      // а не берём всю сумму заново. Иначе тело долга и проценты дальше считаются неправильно.
      if (alreadyPaidMonths > 0 && (loanType === 'annuity' || loanType === 'differentiated')) {
        const scheduleFn = loanType === 'differentiated' ? buildDifferentiatedSchedule : buildAmortizationSchedule;
        const schedule = scheduleFn(total, interestRate, termMonths);
        if (schedule[alreadyPaidMonths - 1]) remaining = schedule[alreadyPaidMonths - 1].balance;
      }
      const monthlyPayment = loanType === 'annuity' ? annuityPayment(total, interestRate, termMonths)
        : loanType === 'manual' ? (data.monthlyPayment || 0)
        : 0; // differentiated считается динамически (currentMonthlyDue), у simple платежа нет
      const debtId = uid();
      // Взял кредит/занял денег = деньги реально пришли к тебе на руки — это доход, а не
      // ничего. Раньше добавление долга никак не трогало баланс, поэтому дальше, когда эти
      // деньги тратились (например, оплата штрафа), баланс уходил в минус на пустом месте.
      // Отмечаем поступление, только если это НОВЫЙ долг (ничего ещё не оплачено) и пользователь
      // явно подтвердил, что деньги пришли на баланс.
      const addToBalance = !!data.addToBalance && alreadyPaidMonths === 0;
      const transactions = addToBalance
        ? [...prev.finance.transactions, {
            id: uid(), type: 'income', title: `Получено: ${data.title}`, amount: total, category: 'loan',
            date: todayStr(), recurring: false, essential: false, source: 'debt_taken', mirrorSourceId: debtId, ts: Date.now(),
          }]
        : prev.finance.transactions;
      const cashBalance = addToBalance ? prev.finance.cashBalance + total : prev.finance.cashBalance;
      return {
        ...prev,
        finance: {
          ...prev.finance,
          transactions, cashBalance,
          debts: [...prev.finance.debts, {
            id: debtId, title: data.title, total, remaining,
            monthlyPayment, interestRate, termMonths, isAnnuity: loanType === 'annuity',
            loanType, monthsElapsed: alreadyPaidMonths,
            paymentDueDay: loanType === 'simple' ? null : (data.paymentDueDay || null),
            dueDate: loanType === 'simple' ? (data.dueDate || null) : null,
            createdAt: Date.now(), category: data.category || 'debt_credit', history: [],
          }],
        },
        chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Новый Debt Boss: ${data.title} (HP ${Math.round(remaining)})${addToBalance ? ` · +${total} на баланс` : ''}`),
      };
    });
  }

  function deleteDebt(id) {
    setState(prev => {
      const mirrored = prev.finance.transactions.find(t => t.mirrorSourceId === id);
      const cashBalance = mirrored ? prev.finance.cashBalance - mirrored.amount : prev.finance.cashBalance;
      return {
        ...prev,
        finance: {
          ...prev.finance,
          debts: prev.finance.debts.filter(d => d.id !== id),
          transactions: prev.finance.transactions.filter(t => t.mirrorSourceId !== id),
          cashBalance,
        },
      };
    });
  }

  // Раздел 7 ТЗ: платёж = проценты + тело долга, вычитать весь платёж из
  // основного долга нельзя. Проценты считаем от текущего остатка по годовой ставке.
  function payDebt(id, amount) {
    setState(prev => {
      const debt = prev.finance.debts.find(d => d.id === id);
      if (!debt || amount <= 0) return prev;
      const wasAlive = debt.remaining > 0;
      const monthlyRate = (debt.interestRate || 0) / 100 / 12;
      const interest = Math.min(amount, Math.round(debt.remaining * monthlyRate));
      const principal = Math.max(0, amount - interest);
      const remaining = Math.max(0, debt.remaining - principal);
      const paymentRecord = { id: uid(), date: todayStr(), totalPayment: amount, interest, principal, remainingAfter: remaining };
      const debts = prev.finance.debts.map(d => d.id === id ? { ...d, remaining, history: [...(d.history || []), paymentRecord] } : d);
      const tx = {
        id: uid(), type: 'expense', title: `Платёж по долгу: ${debt.title}`, amount, category: debt.category || 'debt_credit',
        date: todayStr(), recurring: false, essential: true, source: 'debt', ts: Date.now(),
      };
      const cashBalance = prev.finance.cashBalance - amount;
      const { character, bonusCoins } = applyXP(prev.character, 20);
      let chronicle = pushChronicle(prev.chronicle, 'DEBT_PAYMENT', `Удар по «${debt.title}»: -${principal} к HP боса (проценты ${interest}, осталось ${remaining})`);
      if (remaining <= 0 && wasAlive) {
        chronicle = pushChronicle(chronicle, 'DEBT_DEFEATED', `💀 Debt Boss «${debt.title}» повержен!`);
      }
      return {
        ...prev, character, ...(bonusCoins > 0 ? applyCoinLedger(prev, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus') : {}), chronicle,
        finance: { ...prev.finance, debts, transactions: [...prev.finance.transactions, tx], cashBalance },
      };
    });
  }

  function addSavingsGoal(data) {
    setState(prev => ({
      ...prev,
      finance: { ...prev.finance, savingsGoals: [...prev.finance.savingsGoals, { id: uid(), title: data.title, target: data.target, saved: 0, deadline: data.deadline || null, type: data.type || 'goal', createdAt: Date.now() }] },
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Новая финансовая цель: ${data.title}`),
    }));
  }

  // Раздел 9 ТЗ: деньги в накопления реально уходят из Cash, а не появляются из воздуха.
  function contributeSaving(id, amount) {
    setState(prev => {
      const goal = prev.finance.savingsGoals.find(g => g.id === id);
      if (!goal || amount <= 0) return prev;
      const wasComplete = goal.saved >= goal.target;
      const saved = goal.saved + amount;
      const savingsGoals = prev.finance.savingsGoals.map(g => g.id === id ? { ...g, saved } : g);
      const tx = {
        id: uid(), type: 'expense', title: `Накопление: ${goal.title}`, amount, category: 'savings',
        date: todayStr(), recurring: false, essential: false, source: 'savings', ts: Date.now(),
      };
      const cashBalance = prev.finance.cashBalance - amount;
      let chronicle = pushChronicle(prev.chronicle, 'SYSTEM', `Отложено ${amount} к цели «${goal.title}» (${saved}/${goal.target})`);
      let character = prev.character, ledgerState = prev;
      if (saved >= goal.target && !wasComplete) {
        const res = applyXP(character, 60);
        character = res.character;
        ledgerState = applyCoinLedger(ledgerState, 'earn', 40, 'finance_goal', `Цель достигнута: ${goal.title}`, goal.id);
        if (res.bonusCoins > 0) ledgerState = applyCoinLedger(ledgerState, 'earn', res.bonusCoins, 'levelup', 'Level-Up Bonus');
        chronicle = pushChronicle(chronicle, 'GOAL_COMPLETED', `💰 Финансовая цель «${goal.title}» достигнута!`);
      }
      return {
        ...prev, finance: { ...prev.finance, savingsGoals, transactions: [...prev.finance.transactions, tx], cashBalance },
        character, chronicle, coins: ledgerState.coins, coinsEarnedAllTime: ledgerState.coinsEarnedAllTime,
        coinsSpentAllTime: ledgerState.coinsSpentAllTime, coinTransactions: ledgerState.coinTransactions,
      };
    });
  }

  function deleteSavingsGoal(id) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, savingsGoals: prev.finance.savingsGoals.filter(g => g.id !== id) } }));
  }

  function setTaxiTarget(val) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, taxi: { ...prev.finance.taxi, dailyTarget: val } } }));
  }

  function setTaxiCommission(pct) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, taxi: { ...prev.finance.taxi, commissionPct: Math.max(0, Math.min(100, Number(pct) || 0)) } } }));
  }

  // grossAmount — сумма заказа целиком; комиссия таксопарка (по умолчанию 9%) вычитается
  // автоматически, в Cash Balance и Coin-подсказку идёт уже чистая сумма на руки.
  function logOrder(grossAmount) {
    setState(prev => {
      if (!grossAmount || grossAmount <= 0) return prev;
      const commissionPct = prev.finance.taxi.commissionPct ?? 9;
      const commission = Math.round(grossAmount * commissionPct / 100);
      const net = grossAmount - commission;
      const today = todayStr();
      const todayBefore = prev.finance.taxi.orders.filter(o => o.ts >= new Date(today + 'T00:00:00').getTime())
        .reduce((s, o) => s + (o.net ?? o.amount), 0);
      const oid = uid();
      const orders = [...prev.finance.taxi.orders, { id: oid, amount: grossAmount, commission, net, ts: Date.now() }];
      // Раздел 6 ТЗ: доход такси не изолирован — зеркалим в общие транзакции и Cash Balance (уже за вычетом комиссии).
      const tx = { id: uid(), type: 'income', title: `Заказ такси (${grossAmount} − ${commissionPct}% комиссия)`, amount: net, category: 'taxi', date: today, recurring: false, essential: false, source: 'taxi', mirrorSourceId: oid, ts: Date.now() };
      const cashBalance = prev.finance.cashBalance + net;
      const { character, bonusCoins } = applyXP(prev.character, 8);
      const tipCoins = Math.max(1, Math.round(net * 0.03));
      let ledgerState = applyCoinLedger(prev, 'earn', tipCoins, 'taxi', 'Заказ такси', oid);
      if (bonusCoins > 0) ledgerState = applyCoinLedger(ledgerState, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus');
      let chronicle = pushChronicle(prev.chronicle, 'SYSTEM', `🚕 Заказ: ${grossAmount} − ${commission} комиссия = +${net} (сегодня: ${todayBefore + net})`);
      if (todayBefore < prev.finance.taxi.dailyTarget && todayBefore + net >= prev.finance.taxi.dailyTarget) {
        chronicle = pushChronicle(chronicle, 'SYSTEM', '🎯 Дневная цель по заказам выполнена!');
      }
      return {
        ...prev, character, chronicle, coins: ledgerState.coins, coinsEarnedAllTime: ledgerState.coinsEarnedAllTime,
        coinsSpentAllTime: ledgerState.coinsSpentAllTime, coinTransactions: ledgerState.coinTransactions,
        finance: { ...prev.finance, taxi: { ...prev.finance.taxi, orders }, transactions: [...prev.finance.transactions, tx], cashBalance },
      };
    });
  }

  function deleteOrder(id) {
    setState(prev => {
      const mirrored = prev.finance.transactions.find(t => t.mirrorSourceId === id);
      const cashBalance = mirrored ? prev.finance.cashBalance - mirrored.amount : prev.finance.cashBalance;
      return {
        ...prev,
        finance: {
          ...prev.finance,
          taxi: { ...prev.finance.taxi, orders: prev.finance.taxi.orders.filter(o => o.id !== id) },
          transactions: prev.finance.transactions.filter(t => t.mirrorSourceId !== id),
          cashBalance,
        },
      };
    });
  }

  function setGaragePhoto(dataUrl) {
    setState(prev => ({ ...prev, garage: { ...prev.garage, photo: dataUrl } }));
  }

  function setGarageName(name) {
    setState(prev => ({ ...prev, garage: { ...prev.garage, name } }));
  }

  function setGarageCarDebtId(id) {
    setState(prev => ({ ...prev, garage: { ...prev.garage, carDebtId: id || null } }));
  }

  function setGarageCurrentValue(value) {
    setState(prev => ({ ...prev, garage: { ...prev.garage, currentValue: Math.max(0, Number(value) || 0) } }));
  }

  // Раздел 16 ТЗ: кастомные активы (инвестиции, недвижимость, другое) — Cash/Savings/Car считаются автоматически.
  function addCustomAsset(data) {
    setState(prev => ({
      ...prev,
      finance: { ...prev.finance, assets: [...prev.finance.assets, { id: uid(), name: (data.name || '').trim() || 'Актив', type: data.type || 'other', value: Number(data.value) || 0, liquid: !!data.liquid, date: todayStr() }] },
    }));
  }

  function deleteCustomAsset(id) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, assets: prev.finance.assets.filter(a => a.id !== id) } }));
  }

  // Раздел 18 ТЗ: история Net Worth по месяцам — одна запись на месяц, перезаписывается при повторном вызове в том же месяце.
  function recordNetWorthSnapshot(netWorth) {
    setState(prev => {
      const mk = monthStr();
      const hist = prev.finance.netWorthHistory || [];
      const existing = hist.findIndex(h => h.month === mk);
      const entry = { month: mk, netWorth, date: todayStr() };
      const netWorthHistory = existing >= 0 ? hist.map((h, i) => i === existing ? entry : h) : [...hist, entry];
      return { ...prev, finance: { ...prev.finance, netWorthHistory } };
    });
  }

  // Раздел 12 ТЗ: план бюджета по категориям.
  function setBudgetPlanItem(category, amount, monthKey) {
    const mk = monthKey || monthStr();
    setState(prev => {
      const monthPlan = { ...(prev.finance.budgetPlanByMonth[mk] || {}), [category]: Math.max(0, Number(amount) || 0) };
      return { ...prev, finance: { ...prev.finance, budgetPlanByMonth: { ...prev.finance.budgetPlanByMonth, [mk]: monthPlan } } };
    });
  }

  function removeBudgetPlanItem(category, monthKey) {
    const mk = monthKey || monthStr();
    setState(prev => {
      const monthPlan = { ...(prev.finance.budgetPlanByMonth[mk] || {}) };
      delete monthPlan[category];
      return { ...prev, finance: { ...prev.finance, budgetPlanByMonth: { ...prev.finance.budgetPlanByMonth, [mk]: monthPlan } } };
    });
  }

  // Раздел 14 ТЗ: пороги Debt Load должны быть настраиваемыми.
  function setDebtLoadThresholds(thresholds) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, debtLoadThresholds: { ...prev.finance.debtLoadThresholds, ...thresholds } } }));
  }

  function addGarageExpense(title, amount, category) {
    setState(prev => {
      const eid = uid();
      // Раздел 6 ТЗ: расход машины не изолирован — зеркалим в общие транзакции и Cash Balance.
      const tx = { id: uid(), type: 'expense', title: `Машина: ${title}`, amount, category: GARAGE_TO_FINANCE_CATEGORY[category] || 'other_car', date: todayStr(), recurring: false, essential: false, source: 'garage', mirrorSourceId: eid, ts: Date.now() };
      const cashBalance = prev.finance.cashBalance - amount;
      return {
        ...prev,
        garage: { ...prev.garage, expenses: [...prev.garage.expenses, { id: eid, title, amount, category, ts: Date.now() }] },
        finance: { ...prev.finance, transactions: [...prev.finance.transactions, tx], cashBalance },
        chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `🚗 Расход по машине: ${title} (-${amount})`),
      };
    });
  }

  function deleteGarageExpense(id) {
    setState(prev => {
      const mirrored = prev.finance.transactions.find(t => t.mirrorSourceId === id);
      const cashBalance = mirrored ? prev.finance.cashBalance + mirrored.amount : prev.finance.cashBalance;
      return {
        ...prev,
        garage: { ...prev.garage, expenses: prev.garage.expenses.filter(e => e.id !== id) },
        finance: { ...prev.finance, transactions: prev.finance.transactions.filter(t => t.mirrorSourceId !== id), cashBalance },
      };
    });
  }

function addYouTubeChannel(data) {
  setState(prev => ({
    ...prev,
    youtube: { ...prev.youtube, channels: [...prev.youtube.channels, withYtSnapshot({
      id: uid(), name: data.name, handle: data.handle || null, channelId: data.channelId || null,
      thumb: data.thumb || null, subs: null, views: 0, videos: 0, history: [],
    }, { subs: data.subs ?? null, views: data.views || 0, videos: data.videos || 0 })] },
    chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `📺 Добавлен канал: ${data.name}`),
  }));
}

function updateYouTubeStats(id, stats) {
  setState(prev => {
    const ch = prev.youtube.channels.find(c => c.id === id);
    if (!ch) return prev;
    const next = withYtSnapshot(ch, stats);
    const dSubs = (next.subs ?? 0) - (ch.subs ?? 0);
    const chronicle = dSubs !== 0 && ch.subs != null
      ? pushChronicle(prev.chronicle, 'SYSTEM', `📺 ${ch.name}: ${dSubs > 0 ? '+' : ''}${dSubs} подписчиков (${next.subs})`)
      : prev.chronicle;
    return { ...prev, chronicle, youtube: { ...prev.youtube, channels: prev.youtube.channels.map(c => c.id === id ? next : c) } };
  });
}

function deleteYouTubeChannel(id) {
  setState(prev => ({
    ...prev,
    youtube: { ...prev.youtube, channels: prev.youtube.channels.filter(c => c.id !== id) },
    quests: prev.quests.filter(q => !(q.ytLink && q.ytLink.channelRef === id && q.status === 'active')),
  }));
}

// Квест «+N подписчиков/просмотров/видео»: цель = текущее значение + N, закрывается сам.
function addYouTubeQuest(ch, metric, delta) {
  setState(prev => {
    const cur = ch[metric] || 0;
    const target = cur + delta;
    const m = YT_METRICS.find(x => x.key === metric);
    const type = delta / Math.max(cur, 1) <= 0.05 ? 'Weekly' : 'Monthly';
    const difficulty = type === 'Monthly' ? 'Hard' : 'Normal';
    const [lo, hi] = TYPE_XP_RANGE[type];
    const xp = Math.round(lo + (hi - lo) * DIFF_MULT[difficulty]);
    const q = {
      id: uid(), title: `${ch.name}: +${fmtNum(delta)} ${m.short} (до ${fmtNum(target)})`, type, difficulty,
      xp, coins: Math.round(xp * 0.4), stat: 'creator', secondaryStat: 'discipline', status: 'active',
      deadline: null, order: prev.nextOrder, createdAt: Date.now(),
      ytLink: { channelRef: ch.id, metric, target },
    };
    return { ...prev, quests: [...prev.quests, q], nextOrder: prev.nextOrder + 1,
      chronicle: pushChronicle(prev.chronicle, 'QUEST_CREATED', `📺 Новый YouTube-квест: ${q.title}`) };
  });
}

  function patchYoutube(mut) {
    setState(prev => ({ ...prev, youtube: mut(normalizeYoutube(prev.youtube)) }));
  }
  function onCreatorAction(kind, title) {
    setState(prev => {
      const xp = kind === 'stage' ? 15 : kind === 'plan' ? 20 : 10;
      const { character, leveledUp } = applyXP(prev.character, xp);
      let chronicle = pushChronicle(prev.chronicle, 'SYSTEM', `📺 +${xp} XP за ${kind}: ${title}`);
      if (leveledUp) {
        chronicle = pushChronicle(chronicle, 'LEVEL_UP', `Level Up! ${character.level}`);
        gameFeedback('LEVEL_UP', { level: character.level });
      } else gameFeedback('XP_GAIN', { xp });
      return { ...prev, character, chronicle };
    });
  }

  function setBodyProfile(patch) {
    setState(prev => ({ ...prev, body: { ...prev.body, ...patch } }));
  }

  function logWeight(weight) {
    setState(prev => {
      const today = todayStr();
      const existing = prev.body.weightLog.find(w => w.date === today);
      const weightLog = existing
        ? prev.body.weightLog.map(w => w.date === today ? { ...w, weight } : w)
        : [...prev.body.weightLog, { date: today, weight }];
      return { ...prev, body: { ...prev.body, weightLog }, chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Вес зафиксирован: ${weight} кг`) };
    });
  }

  // Раздел «Калории»: запись в дневник питания — небольшой XP за сам факт учёта,
  // без Coins и без бонуса за число, чтобы не превращать это в фарм.
  function addFoodEntry(data) {
    setState(prev => {
      const entry = {
        id: uid(), title: (data.title || '').trim() || 'Приём пищи',
        calories: Math.max(0, Math.round(Number(data.calories) || 0)),
        protein: Math.max(0, Math.round(Number(data.protein) || 0)),
        fat: Math.max(0, Math.round(Number(data.fat) || 0)),
        carbs: Math.max(0, Math.round(Number(data.carbs) || 0)),
        date: data.date || todayStr(), source: data.source || 'manual', ts: Date.now(),
      };
      const { character, bonusCoins } = applyXP(prev.character, 5);
      const ledger = bonusCoins > 0 ? applyCoinLedger(prev, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus') : {};
      return {
        ...prev, character, ...ledger,
        nutrition: { ...prev.nutrition, entries: [...prev.nutrition.entries, entry] },
        chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `🍽️ ${entry.title} — ${entry.calories} ккал`),
      };
    });
  }

  function deleteFoodEntry(id) {
    setState(prev => ({ ...prev, nutrition: { ...prev.nutrition, entries: prev.nutrition.entries.filter(e => e.id !== id) } }));
  }

  function addQuestsFromGoal(goal, specs) {
    setState(prev => {
      let order = prev.nextOrder;
      const newQuests = specs.map(s => {
        const type = TYPE_XP_RANGE[s.type] ? s.type : 'Weekly';
        const [lo, hi] = TYPE_XP_RANGE[type];
        const difficulty = DIFF_MULT[s.difficulty] !== undefined ? s.difficulty : 'Normal';
        const mult = DIFF_MULT[difficulty];
        const xp = Math.round(lo + (hi - lo) * mult);
        const coins = Math.round(xp * 0.4);
        const stat = STATS_DEF.some(st => st.key === s.stat) ? s.stat : 'discipline';
        const deadline = new Date(Date.now() + Math.max(1, s.dueInDays || 7) * 86400000).toISOString().slice(0, 16);
        const q = {
          id: uid(), title: s.title, type, difficulty, xp, coins, stat, status: 'active',
          deadline, order: order++, createdAt: Date.now(), goalId: goal.id, goalTitle: goal.title,
        };
        return q;
      });
      return {
        ...prev, quests: [...prev.quests, ...newQuests], nextOrder: order,
        chronicle: pushChronicle(prev.chronicle, 'QUEST_CREATED', `🤖 Цель «${goal.title}» разбита на ${newQuests.length} квестов`),
      };
    });
  }

  function logLifeEvent(event) {
    setState(prev => {
      const stats = { ...prev.stats };
      event.effects.forEach(e => {
        if (stats[e.stat] !== undefined) stats[e.stat] = Math.max(0, Math.min(100, stats[e.stat] + e.delta));
      });
      const desc = event.effects.map(e => `${e.delta > 0 ? '+' : ''}${e.delta} ${STAT_LABEL[e.stat]}`).join(', ');
      return { ...prev, stats, chronicle: pushChronicle(prev.chronicle, 'LIFE_EVENT', `${event.label}: ${desc}`) };
    });
  }

  function addCustomEvent(title, effects) {
    setState(prev => ({
      ...prev,
      customEvents: [...prev.customEvents, {
        id: uid(), label: title, effects,
      }],
    }));
  }

  function deleteCustomEvent(id) {
    setState(prev => ({ ...prev, customEvents: prev.customEvents.filter(e => e.id !== id) }));
  }

  function resetAllData() {
    setState(defaultState());
  }

  function dismissEvolution(key) {
    setState(prev => ({ ...prev, dismissedEvolutions: [...prev.dismissedEvolutions, key] }));
  }

  function dismissOnboarding() {
    setState(prev => ({ ...prev, hasSeenOnboarding: true }));
  }

  function importSaveData(jsonString) {
    try {
      let parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !parsed.character) {
        return { ok: false, error: 'Похоже, это не сохранение Life RPG (нет поля character).' };
      }
      const defs = defaultState();
      parsed = { ...defs, ...parsed };
      if (typeof parsed.coinsEarnedAllTime !== 'number') parsed.coinsEarnedAllTime = parsed.coins || 0;
      if (typeof parsed.coinsSpentAllTime !== 'number') parsed.coinsSpentAllTime = 0;
      if (!Array.isArray(parsed.coinTransactions)) parsed.coinTransactions = [];
      if (!parsed.cosmetics) parsed.cosmetics = { unlocked: [], equipped: { frame: null, background: null, title: null, nameColor: null } };
      if (!Array.isArray(parsed.playLog)) parsed.playLog = [];
      if (!parsed.firstOpenedAt) parsed.firstOpenedAt = Date.now();
      parsed.rewards = (Array.isArray(parsed.rewards) ? parsed.rewards : DEFAULT_REWARDS).map(r => ({ category: 'reallife', description: '', icon: '🎁', enabled: true, ...r }));
      parsed.finance = { ...defs.finance, ...(parsed.finance || {}) };
      parsed.finance.taxi = { ...defs.finance.taxi, ...(parsed.finance.taxi || {}) };
      parsed.finance = migrateFinance(parsed.finance);
      parsed.garage = { ...defs.garage, ...(parsed.garage || {}) };
      parsed.body = { ...defs.body, ...(parsed.body || {}) };
      parsed.nutrition = { ...defs.nutrition, ...(parsed.nutrition || {}) };
      if (!Array.isArray(parsed.nutrition.entries)) parsed.nutrition.entries = [];
      parsed.youtube = { ...defs.youtube, ...(parsed.youtube || {}) };
      if (!Array.isArray(parsed.youtube.channels)) parsed.youtube.channels = [];
      const result = ensureDailyContent(parsed);
      setState(result.state);
      setWelcomeBackDays(0);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  useEffect(() => {
    if (!loaded || !state) return;
    const toUnlock = ACHIEVEMENTS.filter(a => !state.unlockedAchievements.includes(a.id) && a.check(state));
    const toUnlockSets = ITEM_SETS.filter(s => !state.unlockedSets.includes(s.key) && setCompletionTier(s, state.stats) >= 2);
    const toUnlockLevels = LEVEL_UNLOCKS.filter(l => !state.unlockedLevels.includes(l.level) && state.character.level >= l.level);
    if (toUnlock.length === 0 && toUnlockSets.length === 0 && toUnlockLevels.length === 0) return;
    setState(prev => {
      let ledgerState = prev;
      let character = prev.character;
      let chronicle = prev.chronicle;
      const unlocked = [...prev.unlockedAchievements];
      toUnlock.forEach(a => {
        if (unlocked.includes(a.id)) return;
        unlocked.push(a.id);
        ledgerState = applyCoinLedger(ledgerState, 'earn', a.coins, 'achievement', a.label, a.id);
        const res = applyXP(character, a.xp);
        character = res.character;
        if (res.bonusCoins > 0) ledgerState = applyCoinLedger(ledgerState, 'earn', res.bonusCoins, 'levelup', 'Level-Up Bonus');
        chronicle = pushChronicle(chronicle, 'ACHIEVEMENT_UNLOCKED', `🏆 Achievement: ${a.label} (${a.rarity}) — +${a.xp} XP, +${a.coins} Coins`);
      });
      const unlockedSets = [...prev.unlockedSets];
      toUnlockSets.forEach(s => {
        if (unlockedSets.includes(s.key)) return;
        unlockedSets.push(s.key);
        ledgerState = applyCoinLedger(ledgerState, 'earn', s.coins, 'set_bonus', s.label, s.key);
        const res = applyXP(character, s.xp);
        character = res.character;
        if (res.bonusCoins > 0) ledgerState = applyCoinLedger(ledgerState, 'earn', res.bonusCoins, 'levelup', 'Level-Up Bonus');
        chronicle = pushChronicle(chronicle, 'ACHIEVEMENT_UNLOCKED', `🛡️ Set Bonus: ${s.label} собран целиком — +${s.xp} XP, +${s.coins} Coins`);
      });
      const unlockedLevels = [...prev.unlockedLevels];
      toUnlockLevels.forEach(l => {
        if (unlockedLevels.includes(l.level)) return;
        unlockedLevels.push(l.level);
        ledgerState = applyCoinLedger(ledgerState, 'earn', l.coins, 'levelup', `Уровень ${l.level}: ${l.title}`, l.level);
        chronicle = pushChronicle(chronicle, 'ACHIEVEMENT_UNLOCKED', `🔓 Уровень ${l.level}: ${l.title} — ${l.desc} (+${l.coins} Coins)`);
      });
      return {
        ...prev, coins: ledgerState.coins, coinsEarnedAllTime: ledgerState.coinsEarnedAllTime,
        coinsSpentAllTime: ledgerState.coinsSpentAllTime, coinTransactions: ledgerState.coinTransactions,
        character, chronicle, unlockedAchievements: unlocked, unlockedSets, unlockedLevels,
      };
    });
  }, [loaded, state]);

const ytDoneRef = React.useRef(new Set());
useEffect(() => {
  if (!loaded || !state) return;
  state.quests
    .filter(q => q.status === 'active' && q.ytLink && !ytDoneRef.current.has(q.id) && ytValue(state.youtube, q.ytLink) >= q.ytLink.target)
    .forEach(q => { ytDoneRef.current.add(q.id); completeQuest(q); });
}, [loaded, state && state.youtube, state && state.quests]);


  if (!loaded || !state) {
    return (
      <div style={{ background: COLORS.bg, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.gold, fontFamily: 'Cinzel, serif' }}>
        Загрузка мира...
      </div>
    );
  }

  const xpNeed = xpNeeded(state.character.level);
  const todayCheckin = state.dailyCheckin && state.dailyCheckin.date === todayStr() ? state.dailyCheckin : null;
  const energy = computeEnergy(todayCheckin);
  const activeQuests = state.quests.filter(q => q.status === 'active').sort((a, b) => a.order - b.order);
  const laterQuests = state.quests.filter(q => q.status === 'later');
  const mainQuests = activeQuests.slice(0, 3);
  const restCount = Math.max(0, activeQuests.length - 3);
  const weakestStat = STATS_DEF.reduce((min, s) => state.stats[s.key] < state.stats[min.key] ? s : min, STATS_DEF[0]);
  const sortedGoals = [...state.goals].filter(g => g.progress < 100)
    .sort((a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity));
  const topGoal = sortedGoals[0];

  const TABS = [
    { key: 'home', label: 'Главная', icon: HomeIcon },
    { key: 'actions', label: 'Действия', icon: Sword },
    { key: 'goals', label: 'Цели', icon: Target },
    { key: 'progress', label: 'Прогресс', icon: Activity },
    { key: 'profile', label: 'Профиль', icon: User },
  ];

  function openProfile(section) {
    setTab('profile');
    setSubTab(s => ({ ...s, profile: section || 'hub' }));
  }

  return (
    <div className="lrpg-root" style={{ background: `radial-gradient(ellipse at top, #171325 0%, ${COLORS.bg} 55%)`, minHeight: 640, color: COLORS.text, fontFamily: 'Inter, sans-serif', paddingBottom: 76, position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

        /* ===== LIFE RPG — design tokens ===== */
        .lrpg-root {
          --gold: ${COLORS.gold}; --gold-soft: ${COLORS.goldSoft}; --gold-glow: rgba(217,165,75,0.55);
          --violet: ${COLORS.violet}; --violet-soft: ${COLORS.violetSoft}; --violet-glow: rgba(139,124,216,0.5);
          --teal: ${COLORS.teal}; --crimson: ${COLORS.crimson};
          --ink: ${COLORS.text}; --ink-muted: ${COLORS.textMuted};
          --panel: ${COLORS.bgCard}; --panel-alt: ${COLORS.bgCardAlt}; --line: ${COLORS.border};
        }
        .lrpg-display { font-family: 'Cinzel', serif; letter-spacing: 0.02em; }
        .lrpg-root ::-webkit-scrollbar { width: 6px; height: 6px; }
        .lrpg-root ::-webkit-scrollbar-thumb { background: var(--gold); opacity: 0.4; border-radius: 3px; }
        .lrpg-btn { cursor: pointer; border: none; font-family: inherit; transition: transform .12s ease, filter .12s ease, box-shadow .12s ease; }
        .lrpg-btn:active { transform: scale(0.96); filter: brightness(1.12); }
        @keyframes lrpg-float-up { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: translateY(-18px) scale(1); } }
        @keyframes lrpg-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes lrpg-cloud-a { 0% { transform: translate3d(-40%,0,0); } 100% { transform: translate3d(55%,0,0); } }
        @keyframes lrpg-cloud-b { 0% { transform: translate3d(50%,8px,0); } 100% { transform: translate3d(-45%,-6px,0); } }
        @keyframes lrpg-cloud-c { 0% { transform: translate3d(-20%,4px,0); } 100% { transform: translate3d(30%,-10px,0); } }
        @keyframes lrpg-trees { 0%,100% { transform: translateX(0) scaleY(1); } 50% { transform: translateX(6px) scaleY(1.015); } }
        @keyframes lrpg-bg-drift { 0% { background-position: 48% 62%; } 50% { background-position: 52% 60%; } 100% { background-position: 48% 62%; } }
        @keyframes lrpg-leaf { 0% { transform: translate(0,0) rotate(0deg); opacity:.0; } 10%{opacity:.55} 100% { transform: translate(40px, 70px) rotate(80deg); opacity:0; } }
        .lrpg-cta {
          border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 800; color: #fff;
          background: linear-gradient(180deg, #8B85FF, #6C63FF);
          box-shadow: 0 0 16px rgba(108,99,255,0.45);
        }
        .lrpg-cta-ok {
          border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 800; color: #042018;
          background: linear-gradient(180deg, #7CFFC4, #4ADE80);
          box-shadow: 0 0 16px rgba(74,222,128,0.35);
        }
        .lrpg-panel-neon {
          background: linear-gradient(180deg, rgba(18,24,38,0.88), rgba(11,15,24,0.82));
          border: 1px solid rgba(108,99,255,0.35);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(108,99,255,0.12);
          border-radius: 18px;
        }
        .lrpg-input { background: var(--panel-alt); border: 1px solid var(--line); color: var(--ink); border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%; box-shadow: inset 0 1px 4px rgba(0,0,0,0.35); }
        .lrpg-input:focus { outline: none; border-color: var(--violet); box-shadow: inset 0 1px 4px rgba(0,0,0,0.35), 0 0 0 2px ${COLORS.violet}33; }

        /* ===== Panels — glass / card ===== */
        .lrpg-glass {
          position: relative;
          background:
            radial-gradient(120% 140% at 15% 0%, rgba(255,255,255,0.09), transparent 55%),
            linear-gradient(160deg, rgba(36,32,58,0.92) 0%, rgba(14,12,22,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -12px 20px -14px rgba(0,0,0,0.7), 0 10px 26px -8px rgba(0,0,0,0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .lrpg-glass::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 30%);
          mix-blend-mode: overlay; opacity: 0.7;
        }
        .lrpg-card {
          position: relative;
          background: linear-gradient(165deg, var(--panel-alt) 0%, var(--panel) 65%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.35), 0 3px 10px rgba(0,0,0,0.28);
        }

        /* ===== Chamfered panels — clipped opposite corners + inset outline, the signature ===== */
        /* LIFE RPG HUD panel shape (replaces plain rounded rects for primary HUD elements). */
        .lrpg-chamfer {
          --chfr: 14px;
          clip-path: polygon(0 0, calc(100% - var(--chfr)) 0, 100% var(--chfr), 100% 100%, var(--chfr) 100%, 0 calc(100% - var(--chfr)));
          box-shadow: inset 0 0 0 1.25px ${COLORS.gold}99, inset 0 0 16px -8px ${COLORS.gold}55;
        }
        .lrpg-chamfer-sm { --chfr: 9px; }
        .lrpg-chamfer-violet { box-shadow: inset 0 0 0 1.25px ${COLORS.violet}99, inset 0 0 16px -8px ${COLORS.violet}55; }
        .lrpg-chamfer-corner { position: absolute; width: 6px; height: 6px; opacity: 0.9; pointer-events: none; }

        /* ===== Divider with center ornament ===== */
        .lrpg-divider { position: relative; height: 1px; margin: 10px 0; background: linear-gradient(90deg, transparent, ${COLORS.gold}66 50%, transparent); }
        .lrpg-divider::before {
          content: ''; position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; transform: translate(-50%, -50%) rotate(45deg);
          background: var(--gold); box-shadow: 0 0 6px var(--gold-glow);
        }

        /* ===== Icon badge (unified icon treatment) ===== */
        .lrpg-badge-icon {
          display: flex; align-items: center; justify-content: center; border-radius: 10px;
          background: radial-gradient(120% 130% at 30% 20%, rgba(255,255,255,0.16), transparent 60%), linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -3px 6px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.35);
        }
        .lrpg-badge-icon-active {
          background: radial-gradient(120% 130% at 30% 20%, rgba(217,165,75,0.45), transparent 60%), linear-gradient(160deg, rgba(217,165,75,0.18), rgba(0,0,0,0.25));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -3px 6px rgba(0,0,0,0.4), 0 0 10px var(--gold-glow);
        }

        /* ===== Gauges — HP / Energy / XP ===== */
        .lrpg-gauge-track { position: relative; border-radius: 99px; background: rgba(0,0,0,0.45); box-shadow: inset 0 1px 3px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.04); overflow: hidden; }
        .lrpg-gauge-fill { height: 100%; border-radius: 99px; position: relative; transition: width 0.35s ease; }
        .lrpg-gauge-fill::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%); opacity: 0.55; }
        .lrpg-gauge-ticks { position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background-image: repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 12.5%);
          opacity: 0.7;
        }

        /* ===== Buttons ===== */
        .lrpg-btn-gold {
          background: linear-gradient(160deg, #ecc789, var(--gold) 45%, #a8792f); color: #1a1305;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.25), 0 3px 10px rgba(217,165,75,0.35);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .lrpg-btn-violet {
          background: linear-gradient(160deg, #a99bea, var(--violet) 45%, #5c4fae); color: #100E1C;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.25), 0 3px 10px rgba(139,124,216,0.35);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .lrpg-btn-ghost {
          background: rgba(255,255,255,0.05); color: var(--ink-muted); border: 1px solid var(--line);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* ===== Home scene — character stage sits directly on the full-bleed room photo, no boxed frame ===== */
        .lrpg-scene { position: relative; }
        .lrpg-ground-shadow {
          position: absolute; left: 50%; bottom: 6%; width: 62%; height: 15%; transform: translateX(-50%);
          background: radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 72%); pointer-events: none;
        }
      `}</style>


      {levelUpFlash && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          background: `linear-gradient(135deg, ${COLORS.gold}, #a8792f)`, color: '#1a1305',
          padding: '14px 28px', borderRadius: 14, boxShadow: `0 0 40px ${COLORS.gold}88`,
          fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 18, textAlign: 'center',
        }}>
          ⚔ LEVEL UP — {levelUpFlash} уровень
        </div>
      )}

      {tab === 'home' ? (
        <HomeTab
          state={state} editingName={editingName}
          setEditingName={setEditingName} setCharacterName={setCharacterName}
          setCharacterTitle={setCharacterTitle} unlockedAchievements={state.unlockedAchievements}
          setCharacterPhoto={setCharacterPhoto}
          energy={energy} todayCheckin={todayCheckin} setDailyCheckin={setDailyCheckin}
          setTab={setTab} setSubTab={setSubTab} openProfile={openProfile}
          setBodyProfile={setBodyProfile} logWeight={logWeight}
        />
      ) : (
      <>
        <div style={{ padding: '12px 14px 88px' }}>
          <CompactStatusRow state={state} energy={energy} xpNeed={xpNeeded(state.character.level)} />

      {!state.hasSeenOnboarding && (
        <div style={{ marginBottom: 10, background: `linear-gradient(135deg, ${COLORS.violetSoft}, ${COLORS.bgCard})`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: '12px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <MessageCircle size={16} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
              Я Master Kaylen. Это твоя жизнь в виде RPG: делай реальные действия, получай XP, расти.
            </div>
          </div>
        </div>
      )}

          {tab === 'actions' && (
            <ActionsHub
              state={state} energy={energy}
              completeQuest={completeQuest} completeHabit={completeHabit} addHabit={addHabit}
              addQuest={addQuest} addQuestForm={addQuest}
              activeQuests={activeQuests} laterQuests={laterQuests}
              postponeQuest={postponeQuest} skipQuest={skipQuest}
              skipTarget={skipTarget} setSkipTarget={setSkipTarget} movePriority={movePriority}
              reactivateQuest={reactivateQuest} deleteQuest={deleteQuest}
              showAddQuest={showAddQuest} setShowAddQuest={setShowAddQuest}
              dismissedEvolutions={state.dismissedEvolutions} dismissEvolution={dismissEvolution}
              hitBossQuest={hitBossQuest}
              habits={state.habits} deleteHabit={deleteHabit}
              sub={subTab.actions || 'all'} setSub={k => setSubTab(s => ({ ...s, actions: k }))}
            />
          )}

          {tab === 'goals' && (
            <GoalsHub
              state={state} goals={state.goals}
              showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal}
              addGoal={addGoal} updateGoalProgress={updateGoalProgress} deleteGoal={deleteGoal}
              addQuestsFromGoal={addQuestsFromGoal} setGoalDeadline={setGoalDeadline}
              resolveAbandonedGoal={resolveAbandonedGoal}
              sub={subTab.goals || 'today'} setSub={k => setSubTab(s => ({ ...s, goals: k }))}
            />
          )}

          {tab === 'progress' && (
            <ProgressHub
              state={state} energy={energy} todayCheckin={todayCheckin}
              setDailyCheckin={setDailyCheckin} toggleRecoveryMode={toggleRecoveryMode}
              sub={subTab.progress || 'stats'} setSub={k => setSubTab(s => ({ ...s, progress: k }))}
            />
          )}

          {tab === 'profile' && (subTab.profile || 'hub') === 'hub' && (
            <ProfileHub
              state={state} energy={energy} xpNeed={xpNeeded(state.character.level)}
              setTab={setTab} setSubTab={setSubTab} openProfile={openProfile}
            />
          )}

          {tab === 'profile' && subTab.profile && subTab.profile !== 'hub' && (
            <div>
              <BackRow label="В профиль" onBack={() => openProfile('hub')} />
              {subTab.profile === 'finance' && (
                <FinanceTab
                  finance={state.finance} garage={state.garage} setFinanceMode={setFinanceMode} addTransaction={addTransaction}
                  deleteTransaction={deleteTransaction} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource}
                  setDebtStrategy={setDebtStrategy} addDebt={addDebt}
                  payDebt={payDebt} deleteDebt={deleteDebt} addSavingsGoal={addSavingsGoal}
                  contributeSaving={contributeSaving} deleteSavingsGoal={deleteSavingsGoal}
                  setTaxiTarget={setTaxiTarget} setTaxiCommission={setTaxiCommission} logOrder={logOrder} deleteOrder={deleteOrder}
                  addCustomAsset={addCustomAsset} deleteCustomAsset={deleteCustomAsset}
                  setBudgetPlanItem={setBudgetPlanItem} removeBudgetPlanItem={removeBudgetPlanItem} setDebtLoadThresholds={setDebtLoadThresholds}
                />
              )}
              {subTab.profile === 'garage' && (
                <GarageTab
                  garage={state.garage} debts={state.finance.debts} taxiOrders={state.finance.taxi.orders}
                  setGaragePhoto={setGaragePhoto} setGarageName={setGarageName} setGarageCarDebtId={setGarageCarDebtId}
                  setGarageCurrentValue={setGarageCurrentValue}
                  addGarageExpense={addGarageExpense} deleteGarageExpense={deleteGarageExpense}
                />
              )}
              {subTab.profile === 'youtube' && (
                <YouTubeHQ
                  youtube={state.youtube} quests={state.quests}
                  addYouTubeChannel={addYouTubeChannel} updateYouTubeStats={updateYouTubeStats}
                  deleteYouTubeChannel={deleteYouTubeChannel} addYouTubeQuest={addYouTubeQuest}
                  patchYoutube={patchYoutube} onCreatorAction={onCreatorAction}
                />
              )}
              {subTab.profile === 'inventory' && (
                <InventoryTab stats={state.stats} unlockedSets={state.unlockedSets} />
              )}
              {subTab.profile === 'shop' && (
                <ShopTab
                  rewards={state.rewards} coins={state.coins}
                  coinsEarnedAllTime={state.coinsEarnedAllTime} coinsSpentAllTime={state.coinsSpentAllTime}
                  coinTransactions={state.coinTransactions} cosmetics={state.cosmetics}
                  lastPurchase={state.lastPurchase} lastRefundAt={state.lastRefundAt}
                  buyReward={buyReward} buyCosmetic={buyCosmetic} equipCosmetic={equipCosmetic}
                  refundLastPurchase={refundLastPurchase}
                  showAddReward={showAddReward} setShowAddReward={setShowAddReward}
                  addReward={addReward} deleteReward={deleteReward} setRewardEnabled={setRewardEnabled}
                />
              )}
              {subTab.profile === 'achievements' && (
                <WorldTab stats={state.stats} unlockedAchievements={state.unlockedAchievements} state={state} />
              )}
              {subTab.profile === 'body' && (
                <BodyTab
                  body={state.body} setBodyProfile={setBodyProfile} logWeight={logWeight}
                  nutrition={state.nutrition} addFoodEntry={addFoodEntry} deleteFoodEntry={deleteFoodEntry}
                />
              )}
              {subTab.profile === 'settings' && (
                <SettingsTab
                  character={state.character} setCharacterName={setCharacterName} resetAllData={resetAllData}
                  availableHoursPerWeek={state.availableHoursPerWeek} setAvailableHours={setAvailableHours}
                  storageStatus={storageStatus} storageError={storageError} lastSavedAt={lastSavedAt} localBackupOk={localBackupOk}
                  state={state} importSaveData={importSaveData} saveNow={saveNow}
                  onExported={() => { setHasExportedThisSession(true); setShowExportReminder(false); }}
                  difficultyMode={state.difficultyMode} setDifficultyMode={setDifficultyMode}
                />
              )}
              {subTab.profile === 'chronicle' && (
                <ChronicleTab
                  chronicle={state.chronicle}
                  addManualChronicleEntry={addManualChronicleEntry}
                  editChronicleEntry={editChronicleEntry} deleteChronicleEntry={deleteChronicleEntry}
                />
              )}
              {subTab.profile === 'mentor' && <MentorTab state={state} />}
              {subTab.profile === 'events' && (
                <EventsTab
                  logLifeEvent={logLifeEvent} customEvents={state.customEvents}
                  addCustomEvent={addCustomEvent} deleteCustomEvent={deleteCustomEvent}
                />
              )}
            </div>
          )}
        </div>
      </>
      )}

      <FeedbackLayer />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, display: 'flex',
        background: 'linear-gradient(180deg, rgba(12,16,26,0.55), rgba(8,11,18,0.96))',
        borderTop: '1px solid rgba(108,99,255,0.22)',
        padding: '8px 8px calc(10px + env(safe-area-inset-bottom, 0px))', backdropFilter: 'blur(14px)',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} className="lrpg-btn" onClick={() => setTab(t.key)} style={{
              flex: 1, background: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, color: active ? '#fff' : COLORS.textMuted, padding: '0',
            }}>
              <span style={{
                width: 42, height: 42, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'linear-gradient(180deg, rgba(108,99,255,0.35), rgba(108,99,255,0.08))' : 'rgba(255,255,255,0.03)',
                boxShadow: active ? '0 0 16px rgba(108,99,255,0.45), inset 0 0 0 1px rgba(140,160,255,0.45)' : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                color: active ? '#C7C4FF' : COLORS.textMuted,
              }}>
                <Icon size={18} />
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', color: active ? '#C7C4FF' : COLORS.textMuted }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===================== ГЛАВНЫЙ ЭКРАН — GAME HUD (без вертикального скролла) =====================
// Архитектура слоёв и зон — по референсу: GameShell (фикс. высота 100dvh, overflow hidden)
//   -> GameHUD (верхняя строка: CharacterStatus слева, CoinsTimeBlock справа)
//   -> средняя строка: LeftGameMenu (узкая рельса) | GameSceneCenter (фон+перс.) | RightStatsColumn
//   -> BottomGameNav (нижняя строка, grid из 6 кнопок, без overflow-x)
// Всё, что раньше требовало отдельного экрана (редактирование персонажа/параметров/чек-ин),
// теперь открывается модалками поверх сцены — функциональность не потеряна, просто не занимает
// постоянное место в layout. Персонаж и настоящий фон — заглушки: пользователь заменит одним ассетом.

function latestWeight(body) {
  const log = body && body.weightLog;
  if (!log || log.length === 0) return null;
  return [...log].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].weight;
}

function heightScaleFor(heightCm) {
  const h = heightCm || 175;
  const clamped = Math.max(155, Math.min(200, h));
  return 0.85 + ((clamped - 155) / (200 - 155)) * (1.17 - 0.85);
}

function spriteIndexFor(weight, heightCm) {
  if (!weight || !heightCm) return 3; // дефолт — "Подтянутый", нейтральный силуэт, пока рост/вес не заданы
  const bmi = weight / Math.pow(heightCm / 100, 2);
  const tier = bmiTier(bmi);
  return tier ? tier.index : 3;
}

// Реальный арт персонажа (см. CHARACTER_SPRITE_LIST) — растёт/меняется вместе с реальными
// ростом/весом из state.body. heightScaleFor управляет общим масштабом фигуры на сцене.
function PlayerCharacter({ heightCm, weight }) {
  const scale = heightScaleFor(heightCm);
  const idx = spriteIndexFor(weight, heightCm);
  const src = CHARACTER_SPRITE_LIST[idx];
  return (
    <div style={{
      position: 'relative', height: '100%', width: '100%',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      transform: `scale(${Math.min(1.05, scale)})`, transformOrigin: 'bottom center', animation: FEEDBACK_PREFS.batterySaver ? 'none' : 'lrpg-breathe 3.6s ease-in-out infinite',
      pointerEvents: 'none',
    }}>
      <img src={src} alt="Персонаж" draggable={false} style={{
        height: '100%', width: 'auto', maxWidth: '58%', objectFit: 'contain', objectPosition: 'bottom center',
        filter: 'drop-shadow(0 18px 10px rgba(0,0,0,0.55)) drop-shadow(0 2px 2px rgba(0,0,0,0.4))',
        WebkitUserSelect: 'none', userSelect: 'none',
      }} />
    </div>
  );
}

function MiniHudBar({ icon: Icon, value, max = 100, colorFrom, colorTo, showValue }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon size={9} color={colorFrom} style={{ flexShrink: 0 }} />
      <div style={{
        flex: 1, height: 6, minWidth: 0, borderRadius: 99, overflow: 'hidden',
        background: 'rgba(0,0,0,0.45)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          boxShadow: `0 0 8px ${colorFrom}88`,
        }} />
      </div>
      {showValue && (
        <span style={{ fontSize: 8, fontWeight: 700, color: '#d8d2e6', flexShrink: 0, minWidth: 34, textAlign: 'right' }}>
          {Math.round(value)}/{max}
        </span>
      )}
    </div>
  );
}

function GameModal({ title, icon: Icon, color = COLORS.violet, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,3,10,0.65)', backdropFilter: 'blur(2px)' }} />
      <div className="lrpg-glass lrpg-chamfer lrpg-chamfer-violet" style={{
        position: 'relative', width: '100%', maxHeight: '82dvh', overflowY: 'auto', borderRadius: '18px 18px 0 0',
        padding: '14px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color, textShadow: `0 0 8px ${color}44` }}>
            {Icon && <span className="lrpg-badge-icon" style={{ width: 24, height: 24, borderRadius: 8 }}><Icon size={13} color={color} /></span>}
            {title}
          </div>
          <button className="lrpg-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color={COLORS.textMuted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ParamRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

// ---- Верхняя строка HUD ----

function CharacterStatusCard({ state, xpNeed, energy, hp, onOpenIdentity, onOpenCheckin }) {
  return (
    <button className="lrpg-btn lrpg-glass" onClick={onOpenIdentity} style={{
      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
      borderRadius: 16, padding: '7px 10px 7px 7px', minWidth: 0, flex: 1,
      border: '1px solid rgba(217,165,75,0.32)',
      boxShadow: 'inset 0 0 0 1px rgba(217,165,75,0.12), 0 8px 18px rgba(0,0,0,0.35)',
      background: 'linear-gradient(160deg, rgba(24,20,38,0.78), rgba(12,10,20,0.72))',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        border: '1.5px solid rgba(217,165,75,0.55)', background: '#1a1628',
      }}>
        {state.character.photo
          ? <img src={state.character.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={16} color={COLORS.textMuted} style={{ margin: 10 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lrpg-display" style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Lv.{state.character.level} {state.character.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          <MiniHudBar icon={HeartPulse} value={hp} max={100} colorFrom="#ff4d6d" colorTo="#ff9aa8" showValue />
          <div onClick={e => { e.stopPropagation(); onOpenCheckin(); }}>
            <MiniHudBar icon={Zap} value={energy} max={100} colorFrom="#3b82f6" colorTo="#67e8f9" showValue />
          </div>
          <MiniHudBar icon={Sparkles} value={state.character.xp} max={xpNeed} colorFrom="#f5c15d" colorTo="#ffe7a3" showValue />
        </div>
      </div>
    </button>
  );
}

function CoinsTimeBlock({ coins, dayNumber, onOpenShop }) {
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
      <button className="lrpg-btn" onClick={onOpenShop} style={{
        display: 'flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '5px 8px',
        background: 'linear-gradient(160deg, #3a2c14, #1c1608)',
        border: `1px solid ${COLORS.gold}66`,
      }}>
        <CoinsIcon size={11} color={COLORS.gold} />
        <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.gold }}>{coins}</span>
        <Plus size={11} color={COLORS.textMuted} />
      </button>
      <div style={{
        borderRadius: 999, padding: '4px 9px', fontSize: 10, color: COLORS.textMuted,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(12,10,20,0.62)', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Moon size={10} color={COLORS.violet} /> {timeStr} · День {dayNumber}
      </div>
    </div>
  );
}

// ---- Левая рельса (постоянно видна, не drawer) ----

const GAME_MENU_ITEMS = [
  { key: 'character', label: 'Характеристики', icon: User, go: (setTab) => setTab('progress') },
  { key: 'params', label: 'Параметры', icon: Ruler, special: 'params' },
  { key: 'inventory', label: 'Инвентарь', icon: Backpack, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'inventory' })); } },
  { key: 'quests', label: 'Задания', icon: ScrollText, go: (setTab, setSubTab) => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); } },
  { key: 'achievements', label: 'Достижения', icon: Trophy, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'achievements' })); } },
  { key: 'shop', label: 'Магазин', icon: CoinsIcon, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'shop' })); } },
  { key: 'settings', label: 'Настройки', icon: SettingsIcon, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'settings' })); } },
];

function HudCard({ children, style }) {
  return (
    <div style={{
      borderRadius: 16,
      background: 'linear-gradient(165deg, rgba(18,16,32,0.72), rgba(10,9,18,0.66))',
      border: '1px solid rgba(108,99,255,0.38)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(108,99,255,0.12)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      ...style,
    }}>{children}</div>
  );
}

function LeftGameMenu({ setTab, setSubTab, onOpenParams }) {
  return (
    <HudCard style={{ width: 124, padding: '8px 8px 6px' }}>
      {GAME_MENU_ITEMS.map(item => {
        const Icon = item.icon;
        return (
          <button key={item.key} className="lrpg-btn" onClick={() => item.special === 'params' ? onOpenParams() : item.go(setTab, setSubTab)} style={{
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8,
            background: 'transparent', padding: '6px 2px', borderRadius: 8, width: '100%',
          }}>
            <Icon size={13} color="#c4b4ff" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 650, color: '#efeaf8', lineHeight: 1.1, textAlign: 'left' }}>{item.label}</span>
          </button>
        );
      })}
    </HudCard>
  );
}

// ---- Правая колонка: Параметры (read-only, редактирование по карандашу) + Цель на сегодня ----

function RightStatsPanel({ body, currentWeight, onEdit }) {
  const rows = [
    { icon: Ruler, label: 'Рост', value: body.heightCm ? `${body.heightCm} см` : '—' },
    { icon: Scale, label: 'Вес', value: currentWeight ? `${currentWeight} кг` : '—' },
    { icon: CalendarClock, label: 'Возраст', value: body.age ? `${body.age} лет` : '—' },
    { icon: Users, label: 'Пол', value: body.sex === 'female' ? 'Женский' : 'Мужской' },
  ];
  return (
    <HudCard style={{ padding: '8px 10px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.gold }}>Параметры</span>
        <button className="lrpg-btn" onClick={onEdit} style={{ background: 'none', padding: 0 }}>
          <Pencil size={11} color={COLORS.textMuted} />
        </button>
      </div>
      {rows.map(r => {
        const Icon = r.icon;
        return (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
            <Icon size={11} color={COLORS.textMuted} />
            <span style={{ fontSize: 10, color: COLORS.textMuted, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{r.value}</span>
          </div>
        );
      })}
    </HudCard>
  );
}

function computeDailyGoalsStatus(state) {
  const today = todayStr();
  const completedTodayByStat = stat => state.quests.some(q => q.status === 'completed' && q.stat === stat && q.completedAt
    && new Date(q.completedAt).toISOString().slice(0, 10) === today);
  const training = completedTodayByStat('physical') || state.habits.some(h => h.stat === 'physical' && h.lastDoneDate === today);
  const study = completedTodayByStat('knowledge') || state.habits.some(h => h.stat === 'knowledge' && h.lastDoneDate === today);
  const todayNutrition = state.nutrition.entries.filter(e => e.date === today);
  const cw = latestWeight(state.body);
  const calTarget = dailyCalorieTarget(state.body, cw);
  const eaten = todayNutrition.reduce((s, e) => s + e.calories, 0);
  const nutrition = calTarget ? (eaten > 0 && eaten <= calTarget.calories * 1.05) : todayNutrition.length > 0;
  const checkin = state.dailyCheckin && state.dailyCheckin.date === today ? state.dailyCheckin : null;
  const sleep = checkin ? checkin.sleepHours >= 6.5 : false;
  return [
    { key: 'training', label: 'Тренировка', done: training },
    { key: 'study', label: 'Учёба', done: study },
    { key: 'nutrition', label: 'Чистое питание', done: nutrition },
    { key: 'sleep', label: 'Сон', done: sleep },
  ];
}

function DailyGoalsPanel({ state, setTab, setSubTab }) {
  const goals = computeDailyGoalsStatus(state);
  function goTo(key) {
    if (key === 'training') { setTab('actions'); setSubTab(s => ({ ...s, actions: 'habits' })); }
    else if (key === 'study') { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); }
    else if (key === 'nutrition') { setTab('profile'); setSubTab(s => ({ ...s, profile: 'body' })); }
    else { setTab('progress'); setSubTab(s => ({ ...s, progress: 'stats' })); }
  }
  const done = goals.filter(g => g.done).length;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
      borderRadius: 999, background: 'rgba(10,14,22,0.55)', border: '1px solid rgba(108,99,255,0.28)',
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: COLORS.teal, whiteSpace: 'nowrap' }}>{done}/4</span>
      {goals.map(g => (
        <button key={g.key} className="lrpg-btn" onClick={() => goTo(g.key)} title={g.label} style={{
          background: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 99, flexShrink: 0,
            background: g.done ? COLORS.teal : 'transparent',
            border: g.done ? 'none' : `1px solid ${COLORS.textMuted}`,
          }} />
          <span style={{ fontSize: 8, color: g.done ? COLORS.teal : COLORS.textMuted }}>{g.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Центр сцены ----

function GameSceneCenter({ body, currentWeight }) {
  return (
    <div style={{
      position: 'absolute', left: '10%', right: '10%', top: '16%', bottom: '0%',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ height: '70%', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', left: '18%', right: '18%', bottom: '1%', height: '16%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 42%, rgba(0,0,0,0) 72%)',
          filter: 'blur(6px)',
        }} />
        <div style={{
          position: 'absolute', left: '32%', right: '32%', bottom: '3%', height: '5%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 70%)',
        }} />
        <PlayerCharacter heightCm={body.heightCm} weight={currentWeight} />
      </div>
    </div>
  );
}

// ---- Нижний игровой нав: 6 крупных кнопок, всегда помещаются по ширине ----

const BOTTOM_GAME_NAV = [
  { key: 'character', label: 'Персонаж', icon: HandMetal, go: (setTab) => setTab('home') },
  { key: 'training', label: 'Тренировка', icon: Dumbbell, go: (setTab, setSubTab) => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'habits' })); } },
  { key: 'quests', label: 'Задания', icon: ScrollText, go: (setTab, setSubTab) => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); } },
  { key: 'skills', label: 'Навыки', icon: Brain, go: (setTab, setSubTab) => { setTab('progress'); setSubTab(s => ({ ...s, progress: 'stats' })); } },
  { key: 'inventory', label: 'Инвентарь', icon: Backpack, go: (setTab, setSubTab) => { setTab('progress'); setSubTab(s => ({ ...s, progress: 'inventory' })); } },
  { key: 'shop', label: 'Магазин', icon: CoinsIcon, go: (setTab, setSubTab) => { setTab('more'); setSubTab(s => ({ ...s, more: 'shop' })); } },
];

function BottomGameNav({ setTab, setSubTab }) {
  return (
    <div className="lrpg-glass lrpg-chamfer" style={{
      display: 'grid', gridTemplateColumns: `repeat(${BOTTOM_GAME_NAV.length}, 1fr)`, borderRadius: 15, padding: '6px 3px',
    }}>
      {BOTTOM_GAME_NAV.map((item, i) => {
        const Icon = item.icon;
        const active = i === 0; // «Персонаж» — мы уже на Home
        return (
          <button key={item.key} className="lrpg-btn" onClick={() => item.go(setTab, setSubTab)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            background: 'transparent', padding: '4px 1px', borderRadius: 10, minWidth: 0,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? COLORS.goldSoft : 'rgba(255,255,255,0.04)',
              boxShadow: active ? `0 0 10px ${COLORS.gold}55, inset 0 1px 0 rgba(255,255,255,0.12)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              border: active ? `1px solid ${COLORS.gold}55` : '1px solid rgba(255,255,255,0.06)',
            }}>
              <Icon size={16} color={active ? COLORS.gold : COLORS.textMuted} />
            </span>
            <span style={{ fontSize: 8, fontWeight: 700, color: active ? COLORS.gold : COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---- Модалки: личность (фото/имя/титул), параметры тела, Energy-чекин ----

function IdentityModal({ state, editingName, setEditingName, setCharacterName, setCharacterTitle, setCharacterPhoto, unlockedAchievements, onClose }) {
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeImageFile(file, 300, 0.85);
      setCharacterPhoto(dataUrl);
    } catch (err) { /* ignore */ }
    setUploadingPhoto(false);
  }

  return (
    <GameModal title="Персонаж" icon={HandMetal} color={COLORS.gold} onClose={onClose}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label className="lrpg-btn" style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: COLORS.bgCardAlt, border: `2px solid ${COLORS.gold}66`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.character.photo ? <img src={state.character.photo} alt={state.character.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color={COLORS.textMuted} />}
          {uploadingPhoto && <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,10,18,0.6)' }} />}
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>
        <div style={{ minWidth: 0, flex: 1 }}>
          {editingName ? (
            <input className="lrpg-input" autoFocus defaultValue={state.character.name} style={{ fontSize: 15, fontWeight: 700 }}
              onBlur={e => { setCharacterName(e.target.value || 'Герой'); setEditingName(false); }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} />
          ) : (
            <div onClick={() => setEditingName(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span className="lrpg-display" style={{ fontSize: 16, fontWeight: 700 }}>{state.character.name}</span>
              <Pencil size={12} color={COLORS.textMuted} />
            </div>
          )}
          <div onClick={() => setShowTitlePicker(v => !v)} style={{ fontSize: 12, color: COLORS.violet, marginTop: 3, cursor: 'pointer' }}>
            {state.character.title ? `«${state.character.title}»` : 'Выбрать титул'} ▾
          </div>
        </div>
      </div>
      {showTitlePicker && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 6 }}>
          <div className="lrpg-btn" onClick={() => { setCharacterTitle(null); setShowTitlePicker(false); }} style={{ fontSize: 12, padding: '4px 6px', color: COLORS.textMuted }}>Без титула</div>
          {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).map(a => (
            <div key={a.id} className="lrpg-btn" onClick={() => { setCharacterTitle(a.label); setShowTitlePicker(false); }} style={{ fontSize: 12, padding: '4px 6px', color: RARITY_COLOR[a.rarity] }}>{a.label}</div>
          ))}
          {unlockedAchievements.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted, padding: '4px 6px' }}>Пока нет разблокированных достижений</div>}
        </div>
      )}
    </GameModal>
  );
}

function ParamsModal({ body, currentWeight, setBodyProfile, logWeight, onClose }) {
  const [weightDraft, setWeightDraft] = useState(currentWeight || '');
  return (
    <GameModal title="Параметры" icon={Ruler} color={COLORS.teal} onClose={onClose}>
      <ParamRow label="Рост, см">
        <input className="lrpg-input" type="number" min={100} max={230} value={body.heightCm || ''}
          onChange={e => setBodyProfile({ heightCm: Number(e.target.value) || null })} />
      </ParamRow>
      <ParamRow label="Вес, кг">
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="lrpg-input" type="number" min={0} value={weightDraft} onChange={e => setWeightDraft(e.target.value)} />
          <button className="lrpg-btn" disabled={!weightDraft} onClick={() => logWeight(Number(weightDraft))}
            style={{ background: `linear-gradient(160deg, ${COLORS.teal}, #2a8f85)`, color: '#0B1F1D', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 700, opacity: weightDraft ? 1 : 0.5 }}>✓</button>
        </div>
      </ParamRow>
      <ParamRow label="Возраст">
        <input className="lrpg-input" type="number" min={0} value={body.age || ''}
          onChange={e => setBodyProfile({ age: Number(e.target.value) || null })} />
      </ParamRow>
      <ParamRow label="Пол">
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 3 }}>
          <button className="lrpg-btn" onClick={() => setBodyProfile({ sex: 'male' })} style={{ flex: 1, background: body.sex === 'male' ? `linear-gradient(160deg, ${COLORS.violet}, #5f4fb8)` : 'transparent', color: body.sex === 'male' ? '#fff' : COLORS.textMuted, borderRadius: 6, padding: '7px 0', fontSize: 12, fontWeight: 700 }}>Мужской</button>
          <button className="lrpg-btn" onClick={() => setBodyProfile({ sex: 'female' })} style={{ flex: 1, background: body.sex === 'female' ? `linear-gradient(160deg, ${COLORS.violet}, #5f4fb8)` : 'transparent', color: body.sex === 'female' ? '#fff' : COLORS.textMuted, borderRadius: 6, padding: '7px 0', fontSize: 12, fontWeight: 700 }}>Женский</button>
        </div>
      </ParamRow>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.5 }}>
        Рост и вес сразу меняют силуэт на сцене. Мышечная масса, % жира и остальной профиль тела — во вкладке «Прогресс → Тело».
      </div>
    </GameModal>
  );
}

function CheckinModal({ energy, todayCheckin, setDailyCheckin, onClose }) {
  const eLabel = energyLabel(energy);
  return (
    <GameModal title="Energy-чекин" icon={Zap} color={eLabel.color} onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
        <span>Текущая энергия</span><span style={{ color: eLabel.color, fontWeight: 700 }}>{energy}/100 · {eLabel.label}</span>
      </div>
      <CheckinForm initial={todayCheckin} onSubmit={data => { setDailyCheckin(data); onClose(); }} />
    </GameModal>
  );
}

// ---- Home: GameShell (фикс. высота, без скролла) ----

function HomeTab({ state, editingName, setEditingName, setCharacterName, setCharacterTitle, setCharacterPhoto, unlockedAchievements, energy, todayCheckin, setDailyCheckin, setTab, setSubTab, openProfile, setBodyProfile, logWeight }) {
  const [modal, setModal] = useState(null);
  const currentWeight = latestWeight(state.body);
  const dayNumber = state.firstOpenedAt
    ? Math.max(1, Math.floor((Date.now() - state.firstOpenedAt) / 86400000) + 1)
    : ((state.playLog || []).length || 1);
  const xpNeed = xpNeeded(state.character.level);

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 62, zIndex: 5, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: '-4%',
        backgroundImage: `url(${ROOM_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 62%',
        animation: FEEDBACK_PREFS.batterySaver ? 'none' : 'lrpg-bg-drift 28s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', left: '12%', right: '12%', top: '8%', height: '42%',
        pointerEvents: 'none', overflow: 'hidden', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', width: '70%', height: 70, borderRadius: '50%',
          left: '-10%', top: 10,
          background: 'radial-gradient(ellipse at center, rgba(230,240,255,0.55) 0%, rgba(180,200,230,0.18) 45%, rgba(180,200,230,0) 70%)',
          animation: 'lrpg-cloud-a 22s ease-in-out infinite alternate',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', width: '55%', height: 54, borderRadius: '50%',
          left: '30%', top: 36,
          background: 'radial-gradient(ellipse at center, rgba(210,225,255,0.42) 0%, rgba(160,190,230,0.14) 50%, rgba(160,190,230,0) 72%)',
          animation: 'lrpg-cloud-b 28s ease-in-out infinite alternate',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', width: '48%', height: 44, borderRadius: '50%',
          left: '8%', top: 58,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.28) 0%, rgba(200,215,240,0.1) 48%, rgba(200,215,240,0) 70%)',
          animation: 'lrpg-cloud-c 34s ease-in-out infinite alternate',
          willChange: 'transform',
        }} />
        <div style={{
          position: 'absolute', left: 0, bottom: 0, width: '40%', height: '55%',
          background: 'linear-gradient(180deg, rgba(20,50,28,0) 0%, rgba(18,48,26,0.22) 100%)',
          animation: 'lrpg-trees 8s ease-in-out infinite',
        }} />
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(8,7,14,0.28) 0%, rgba(8,7,14,0.00) 18%, rgba(8,7,14,0.00) 62%, rgba(8,7,14,0.38) 100%)',
        pointerEvents: 'none',
      }} />

      <GameSceneCenter body={state.body} currentWeight={currentWeight} />

      <div style={{
        position: 'absolute', zIndex: 3, left: 8, right: 8, top: 'calc(8px + env(safe-area-inset-top, 0px))',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <CharacterStatusCard
          state={state} xpNeed={xpNeed} energy={energy} hp={state.stats.physical}
          onOpenIdentity={() => setModal('identity')} onOpenCheckin={() => setModal('checkin')}
        />
        <CoinsTimeBlock coins={state.coins} dayNumber={dayNumber} onOpenShop={() => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'shop' })); }} />
      </div>

      <div style={{ position: 'absolute', zIndex: 3, left: 8, top: 86 }}>
        <DailyGoalsPanel state={state} setTab={setTab} setSubTab={setSubTab} />
      </div>
      <div style={{ position: 'absolute', zIndex: 3, right: 8, top: 92, width: 128 }}>
        <RightStatsPanel body={state.body} currentWeight={currentWeight} onEdit={() => setModal('params')} />
      </div>

      {modal === 'identity' && (
        <IdentityModal state={state} editingName={editingName} setEditingName={setEditingName}
          setCharacterName={setCharacterName} setCharacterTitle={setCharacterTitle} setCharacterPhoto={setCharacterPhoto}
          unlockedAchievements={unlockedAchievements} onClose={() => setModal(null)} />
      )}
      {modal === 'params' && (
        <ParamsModal body={state.body} currentWeight={currentWeight} setBodyProfile={setBodyProfile} logWeight={logWeight} onClose={() => setModal(null)} />
      )}
      {modal === 'checkin' && (
        <CheckinModal energy={energy} todayCheckin={todayCheckin} setDailyCheckin={setDailyCheckin} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function QuestCard({ q, priority, completeQuest, postponeQuest, skipTarget, setSkipTarget, skipQuest, movePriority, canMoveUp, canMoveDown, showDelete, deleteQuest, compact, hitBossQuest }) {
  const skipping = skipTarget === q.id;
  const [hitAmount, setHitAmount] = useState('');
  const isBossActive = q.isBoss && hitBossQuest;
  return (
    <Card>
      <div style={{ display: 'flex', gap: 10 }}>
        {!compact && movePriority && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button className="lrpg-btn" disabled={!canMoveUp} onClick={() => movePriority(q, -1)} style={{ background: 'none', opacity: canMoveUp ? 1 : 0.25 }}><ChevronUp size={16} color={COLORS.textMuted} /></button>
            <span style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700 }}>#{priority}</span>
            <button className="lrpg-btn" disabled={!canMoveDown} onClick={() => movePriority(q, 1)} style={{ background: 'none', opacity: canMoveDown ? 1 : 0.25 }}><ChevronDown size={16} color={COLORS.textMuted} /></button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{compact ? `#${priority} ` : ''}{q.isBoss ? '⚔️ ' : ''}{q.title}</div>
            {showDelete && <button className="lrpg-btn" onClick={() => deleteQuest(q)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
            <Tag color={TYPE_COLOR[q.type]}>{TYPE_LABELS[q.type]}</Tag>
            <Tag color={COLORS.textMuted}>{q.difficulty}</Tag>
            {q.stat && <Tag color={COLORS.violet}>{STAT_LABEL[q.stat]}</Tag>}
            {q.goalTitle && <Tag color={COLORS.gold}>🎯 {q.goalTitle}</Tag>}
            {q.rarity && <Tag color={RARITY_COLOR[q.rarity]}>✨ {q.rarity}</Tag>}
            {q.secondaryStat && <Tag color={COLORS.teal}>+{STAT_LABEL[q.secondaryStat]}</Tag>}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: COLORS.textMuted, alignItems: 'center' }}>
            <span style={{ color: COLORS.gold, fontWeight: 600 }}>+{q.xp} XP</span>
            <span style={{ color: COLORS.gold, fontWeight: 600 }}>+{q.coins} Coins</span>
            {q.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{fmtDeadline(q.deadline)}</span>}
          </div>

          {isBossActive ? (
            <div style={{ marginTop: 10 }}>
              <Bar value={q.bossHPRemaining} max={q.bossHP} color={COLORS.crimson} />
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>HP {q.bossHPRemaining} / {q.bossHP}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input className="lrpg-input" type="number" min={1} placeholder="Сила удара" value={hitAmount} onChange={e => setHitAmount(e.target.value)} />
                <button className="lrpg-btn" onClick={() => { hitBossQuest(q.id, Number(hitAmount) || 0); setHitAmount(''); }}
                  style={{ background: COLORS.crimson, color: '#fff', borderRadius: 8, padding: '0 16px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                  Атака
                </button>
                {!compact && (
                  <button className="lrpg-btn" onClick={() => setSkipTarget(skipping ? null : q.id)} style={{ background: COLORS.bgCardAlt, color: COLORS.crimson, borderRadius: 8, padding: '0 12px', fontSize: 12, border: `1px solid ${COLORS.border}` }}>Skip</button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="lrpg-btn" onClick={() => completeQuest(q)} style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Check size={13} /> Готово
              </button>
              <button className="lrpg-btn" onClick={() => postponeQuest(q)} style={{ background: COLORS.bgCardAlt, color: COLORS.text, borderRadius: 8, padding: '7px 12px', fontSize: 12, border: `1px solid ${COLORS.border}` }}>Later</button>
              <button className="lrpg-btn" onClick={() => setSkipTarget(skipping ? null : q.id)} style={{ background: COLORS.bgCardAlt, color: COLORS.crimson, borderRadius: 8, padding: '7px 12px', fontSize: 12, border: `1px solid ${COLORS.border}` }}>Skip</button>
            </div>
          )}
          {skipping && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>Причина пропуска (уважительная — без штрафа):</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SKIP_REASONS.map(r => (
                  <button key={r} className="lrpg-btn" onClick={() => skipQuest(q, r)} style={{ background: COLORS.violetSoft, color: COLORS.violet, borderRadius: 999, padding: '5px 10px', fontSize: 11, border: `1px solid ${COLORS.violet}55` }}>{r}</button>
                ))}
                <button className="lrpg-btn" onClick={() => skipQuest(q, null)} style={{ background: COLORS.crimsonSoft, color: COLORS.crimson, borderRadius: 999, padding: '5px 10px', fontSize: 11, border: `1px solid ${COLORS.crimson}55` }}>Без причины</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function QuestsTab({ activeQuests, laterQuests, completeQuest, postponeQuest, skipQuest, skipTarget, setSkipTarget, movePriority, reactivateQuest, deleteQuest, showAddQuest, setShowAddQuest, addQuest, allQuests, dismissedEvolutions, dismissEvolution, characterLevel, hitBossQuest }) {
  const evolutionSuggestions = computeQuestEvolutionSuggestions(allQuests, dismissedEvolutions);
  const [searchText, setSearchText] = useState('');
  const search = searchText.trim().toLowerCase();
  const matches = q => !search || q.title.toLowerCase().includes(search);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button className="lrpg-btn" onClick={() => setShowAddQuest(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>
        <Plus size={16} /> Новый квест
      </button>

      {showAddQuest && <AddQuestForm onSubmit={addQuest} onCancel={() => setShowAddQuest(false)} characterLevel={characterLevel} />}

      {evolutionSuggestions.map(s => (
        <Card key={s.key} style={{ border: `1px solid ${COLORS.violet}55`, background: COLORS.violetSoft }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {s.direction === 'up' ? <TrendingUpIcon size={15} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} /> : <TrendingDown size={15} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} />}
            <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
              {s.direction === 'up'
                ? `«${s.title}» ты закрываешь на Easy уже ${s.count} раз — повысить до Normal?`
                : `«${s.title}» ты пропускаешь на Hard уже ${s.count} раз — снизить до Normal?`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className="lrpg-btn" onClick={() => { addQuest({ title: s.title, type: s.type || 'Daily', difficulty: 'Normal', stat: s.stat || STATS_DEF[0].key, secondaryStat: null, deadline: '' }); dismissEvolution(s.key); }}
              style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 700 }}>
              {s.direction === 'up' ? 'Создать на Normal' : 'Создать полегче'}
            </button>
            <button className="lrpg-btn" onClick={() => dismissEvolution(s.key)} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>Скрыть</button>
          </div>
        </Card>
      ))}

      {(activeQuests.length > 4 || laterQuests.length > 4) && (
        <div style={{ position: 'relative' }}>
          <Search size={14} color={COLORS.textMuted} style={{ position: 'absolute', left: 10, top: 10 }} />
          <input className="lrpg-input" placeholder="Поиск по квестам..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Активные ({activeQuests.length})</div>
      {activeQuests.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Пока пусто. Добавь квест выше.</div></Card>}
      {activeQuests.filter(matches).length === 0 && activeQuests.length > 0 && <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '10px 0' }}>Ничего не найдено.</div>}
      {QUEST_GROUPS.map(group => {
        const items = activeQuests.filter(q => group.types.includes(q.type) && matches(q));
        if (items.length === 0) return null;
        return (
          <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{group.label} ({items.length})</div>
            {items.map((q, i) => (
              <QuestCard key={q.id} q={q} priority={i + 1} completeQuest={completeQuest} postponeQuest={postponeQuest}
                skipTarget={skipTarget} setSkipTarget={setSkipTarget} skipQuest={skipQuest} movePriority={movePriority}
                canMoveUp={i > 0} canMoveDown={i < items.length - 1} showDelete deleteQuest={deleteQuest} hitBossQuest={hitBossQuest} />
            ))}
          </div>
        );
      })}

      {laterQuests.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginTop: 8 }}>Отложенные ({laterQuests.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {laterQuests.filter(matches).map(q => (
              <Card key={q.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{q.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}><Tag color={TYPE_COLOR[q.type]}>{TYPE_LABELS[q.type]}</Tag></div>
                  </div>
                  <button className="lrpg-btn" onClick={() => reactivateQuest(q)} style={{ background: COLORS.goldSoft, color: COLORS.gold, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}>Вернуть</button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AddQuestForm({ onSubmit, onCancel, characterLevel }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Daily');
  const [difficulty, setDifficulty] = useState('Normal');
  const [stat, setStat] = useState(STATS_DEF[0].key);
  const [secondaryStat, setSecondaryStat] = useState('');
  const [deadline, setDeadline] = useState('');
  const [bossHP, setBossHP] = useState(100);
  const bossUnlocked = characterLevel >= 5;

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input className="lrpg-input" placeholder="Название квеста" value={title} onChange={e => setTitle(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="lrpg-input" value={type} onChange={e => setType(e.target.value)}>
            {Object.keys(TYPE_LABELS).map(t => (
              <option key={t} value={t} disabled={t === 'Boss' && !bossUnlocked}>
                {TYPE_LABELS[t]}{t === 'Boss' && !bossUnlocked ? ' (ур. 5)' : ''}
              </option>
            ))}
          </select>
          <select className="lrpg-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="Easy">Easy</option><option value="Normal">Normal</option><option value="Hard">Hard</option>
          </select>
        </div>
        {type === 'Boss' && (
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>HP босса (сколько "ударов на 1" нужно, чтобы победить)</div>
            <input className="lrpg-input" type="number" min={10} value={bossHP || ''} onChange={e => setBossHP(e.target.value === '' ? 0 : Number(e.target.value))} />
          </div>
        )}
        <select className="lrpg-input" value={stat} onChange={e => setStat(e.target.value)}>
          {STATS_DEF.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="lrpg-input" value={secondaryStat} onChange={e => setSecondaryStat(e.target.value)}>
          <option value="">Побочный эффект: нет</option>
          {STATS_DEF.filter(s => s.key !== stat).map(s => <option key={s.key} value={s.key}>Побочный: {s.label}</option>)}
        </select>
        <input className="lrpg-input" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="lrpg-btn" disabled={!title.trim()} onClick={() => onSubmit({ title: title.trim(), type, difficulty, stat, secondaryStat: secondaryStat || null, deadline, bossHP })}
            style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: title.trim() ? 1 : 0.5 }}>
            Создать
          </button>
          <button className="lrpg-btn" onClick={onCancel} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 8, padding: '9px 14px', fontSize: 13, border: `1px solid ${COLORS.border}` }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function GoalProgressControl({ goal, updateGoalProgress }) {
  const [draft, setDraft] = useState(goal.progress);
  const [confirming100, setConfirming100] = useState(false);

  useEffect(() => { setDraft(goal.progress); }, [goal.progress]);

  function commit(val) {
    val = Math.max(0, Math.min(100, Math.round(val)));
    if (val >= 100 && goal.progress < 100) {
      setDraft(100);
      setConfirming100(true);
      return;
    }
    setConfirming100(false);
    updateGoalProgress(goal.id, val);
  }

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="range" min={0} max={100} value={draft}
          onChange={e => setDraft(Number(e.target.value))}
          onMouseUp={e => commit(Number(e.target.value))}
          onTouchEnd={e => commit(Number(e.target.value))}
          style={{ flex: 1, accentColor: COLORS.violet }} />
        <input className="lrpg-input" type="number" min={0} max={100} value={draft === 0 ? '' : draft}
          onChange={e => setDraft(e.target.value === '' ? 0 : Number(e.target.value))}
          onBlur={e => commit(Number(e.target.value) || 0)}
          style={{ width: 56, padding: '4px 6px', textAlign: 'center' }} />
      </div>
      {confirming100 && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, background: COLORS.goldSoft, borderRadius: 8, padding: '6px 8px' }}>
          <span style={{ fontSize: 11, color: COLORS.gold }}>Отметить цель как полностью завершённую?</span>
          <button className="lrpg-btn" onClick={() => { updateGoalProgress(goal.id, 100); setConfirming100(false); }} style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>Да</button>
          <button className="lrpg-btn" onClick={() => { setDraft(goal.progress); setConfirming100(false); }} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 6, padding: '4px 10px', fontSize: 11, border: `1px solid ${COLORS.border}` }}>Отмена</button>
        </div>
      )}
    </div>
  );
}

function GoalsTab({ goals, showAddGoal, setShowAddGoal, addGoal, updateGoalProgress, deleteGoal, addQuestsFromGoal, state, setGoalDeadline, resolveAbandonedGoal }) {
  const [breakingId, setBreakingId] = useState(null);
  const [fallbackNoticeId, setFallbackNoticeId] = useState(null);
  const [fallbackReason, setFallbackReason] = useState(null);
  const [checkingId, setCheckingId] = useState(null);
  const [realityResults, setRealityResults] = useState({});
  const [realityError, setRealityError] = useState({});

  async function handleRealityCheck(goal) {
    setCheckingId(goal.id);
    setRealityError(e => ({ ...e, [goal.id]: null }));
    try {
      const userMsg = `Цель: "${goal.title}"\nОписание: ${goal.description || '—'}\nСфера: ${goal.sphere}\nТекущий дедлайн: ${goal.deadline || 'не указан'}\nТекущий прогресс: ${goal.progress}%\n\nКонтекст персонажа:\n${buildContextSummary(state)}`;
      const text = await callClaudeAPIWithRetry(GOAL_REALITY_SYSTEM_PROMPT, [{ role: 'user', content: userMsg }]);
      const parsed = parseJsonObjectLoose(text);
      if (!parsed.scenarios || !Array.isArray(parsed.scenarios) || parsed.scenarios.length === 0) throw new Error('EMPTY: no scenarios returned');
      setRealityResults(r => ({ ...r, [goal.id]: parsed.scenarios }));
    } catch (e) {
      setRealityError(er => ({ ...er, [goal.id]: friendlyAIError(e) }));
    } finally {
      setCheckingId(null);
    }
  }

  function acceptScenario(goal, scenario) {
    if (scenario.deadlineDays) {
      const d = new Date(Date.now() + scenario.deadlineDays * 86400000);
      setGoalDeadline(goal.id, d.toISOString().slice(0, 10));
    }
    setRealityResults(r => { const next = { ...r }; delete next[goal.id]; return next; });
  }

  async function handleBreakdown(goal) {
    setBreakingId(goal.id);
    setFallbackNoticeId(null);
    setFallbackReason(null);
    try {
      const userMsg = `Цель: "${goal.title}"\nОписание: ${goal.description || '—'}\nСфера: ${goal.sphere}\nДедлайн: ${goal.deadline || 'не указан'}\nТекущий прогресс: ${goal.progress}%\n\nКонтекст персонажа:\n${buildContextSummary(state)}`;
      const text = await callClaudeAPIWithRetry(GOAL_ENGINE_SYSTEM_PROMPT, [{ role: 'user', content: userMsg }]);
      const specs = parseJsonLoose(text);
      if (!Array.isArray(specs) || specs.length === 0) throw new Error('EMPTY: model returned no valid steps');
      addQuestsFromGoal(goal, normalizeGoalSteps(specs, goal));
    } catch (e) {
      setFallbackNoticeId(goal.id);
      setFallbackReason(friendlyAIError(e));
    } finally {
      setBreakingId(null);
    }
  }

  function useOfflinePlan(goal) {
    addQuestsFromGoal(goal, normalizeGoalSteps(ruleBasedGoalSplit(goal), goal));
    setFallbackNoticeId(null);
    setFallbackReason(null);
  }

  const activeWithDeadline = goals.filter(g => g.progress < 100 && g.deadline);
  const intensities = activeWithDeadline.map(g => {
    const daysLeft = Math.max(0.5, (new Date(g.deadline) - Date.now()) / 86400000);
    const perWeek = (100 - g.progress) / (daysLeft / 7);
    return { goal: g, perWeek };
  });
  const highIntensity = intensities.filter(i => i.perWeek > 40);
  const estimatedHoursNeeded = Math.round(intensities.reduce((sum, i) => sum + i.perWeek / 10, 0));
  const overBudget = state.availableHoursPerWeek && estimatedHoursNeeded > state.availableHoursPerWeek;
  const hasConflict = highIntensity.length >= 2 || overBudget;
  const abandonedGoals = goals.filter(g => g.progress < 100
    && daysBetween(new Date(g.updatedAt || g.createdAt || Date.now()).toISOString().slice(0, 10), todayStr()) >= 14);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button className="lrpg-btn" onClick={() => setShowAddGoal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>
        <Plus size={16} /> Новая цель
      </button>
      {abandonedGoals.map(g => (
        <Card key={g.id} style={{ border: `1px solid ${COLORS.gold}55`, background: COLORS.goldSoft }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <PauseCircle size={15} color={COLORS.gold} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
              Цель «{g.title}» не двигалась 14+ дней ({g.progress}%). Что делаем?
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="lrpg-btn" onClick={() => resolveAbandonedGoal(g.id, 'resume')} style={{ background: COLORS.bgCardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>Продолжаю</button>
            <button className="lrpg-btn" onClick={() => resolveAbandonedGoal(g.id, 'extend')} style={{ background: COLORS.bgCardAlt, color: COLORS.teal, border: `1px solid ${COLORS.teal}55`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>Продлить срок</button>
            <button className="lrpg-btn" onClick={() => resolveAbandonedGoal(g.id, 'reduce')} style={{ background: COLORS.bgCardAlt, color: COLORS.gold, border: `1px solid ${COLORS.gold}55`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>Принять как есть</button>
            <button className="lrpg-btn" onClick={() => resolveAbandonedGoal(g.id, 'abandon')} style={{ background: COLORS.bgCardAlt, color: COLORS.crimson, border: `1px solid ${COLORS.crimson}55`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>Отменить цель</button>
          </div>
        </Card>
      ))}
      {hasConflict && (
        <Card style={{ border: `1px solid ${COLORS.crimson}55`, background: COLORS.crimsonSoft }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color={COLORS.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
              {highIntensity.length >= 2 && <div>Сразу {highIntensity.length} цели требуют высокого темпа одновременно: {highIntensity.map(i => `«${i.goal.title}»`).join(', ')}. Рассмотри приоритизацию или сдвиг сроков.</div>}
              {overBudget && <div style={{ marginTop: highIntensity.length >= 2 ? 6 : 0 }}>Нужно примерно {estimatedHoursNeeded} ч/неделю на все цели, а указано свободного времени — {state.availableHoursPerWeek} ч. Это грубая оценка, но стоит свериться.</div>}
            </div>
          </div>
        </Card>
      )}
      {showAddGoal && <AddGoalForm onSubmit={addGoal} onCancel={() => setShowAddGoal(false)} />}
      {goals.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Целей пока нет.</div></Card>}
      {goals.map(g => {
        let realityText = null;
        if (g.deadline) {
          const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline) - Date.now()) / 86400000));
          const remaining = 100 - g.progress;
          if (daysLeft > 0 && remaining > 0) {
            const perWeek = (remaining / (daysLeft / 7)).toFixed(0);
            realityText = `Нужно ~${perWeek}% прогресса в неделю, чтобы успеть к сроку.`;
          } else if (daysLeft === 0 && remaining > 0) {
            realityText = 'Срок наступил, а цель не завершена — стоит пересмотреть план.';
          }
        }
        const linkedQuests = state.quests.filter(q => q.goalId === g.id);
        return (
          <Card key={g.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{g.title}</div>
                {g.sphere && <Tag color={COLORS.violet}>{g.sphere}</Tag>}
              </div>
              <button className="lrpg-btn" onClick={() => deleteGoal(g.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
            </div>
            {g.description && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>{g.description}</div>}
            <div style={{ marginTop: 10 }}>
              <Bar value={g.progress} color={g.progress >= 100 ? COLORS.gold : COLORS.violet} />
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{g.progress}%{g.deadline ? ` · до ${fmtDeadline(g.deadline)}` : ''}</div>
              <GoalProgressControl goal={g} updateGoalProgress={updateGoalProgress} />
            </div>
            {linkedQuests.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Квесты этой цели ({linkedQuests.filter(q => q.status === 'active').length} активных)</div>
                {[...linkedQuests].sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0)).map(q => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: COLORS.bgCardAlt, borderRadius: 8, padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {q.status === 'done'
                        ? <Check size={12} color={COLORS.teal} style={{ flexShrink: 0 }} />
                        : <span style={{ width: 8, height: 8, borderRadius: 99, border: `1px solid ${COLORS.textMuted}`, flexShrink: 0 }} />}
                      <span style={{ fontSize: 11, textDecoration: q.status === 'done' ? 'line-through' : 'none', color: q.status === 'done' ? COLORS.textMuted : COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                    </div>
                    <Tag color={TYPE_COLOR[q.type]}>{TYPE_LABELS[q.type]}</Tag>
                  </div>
                ))}
              </div>
            )}
            {realityText && <div style={{ fontSize: 11, color: COLORS.gold, marginTop: 8, fontStyle: 'italic' }}>{realityText}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button className="lrpg-btn" disabled={checkingId === g.id} onClick={() => handleRealityCheck(g)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: COLORS.bgCardAlt, color: COLORS.teal, border: `1px solid ${COLORS.teal}55`,
                borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 11, opacity: checkingId === g.id ? 0.6 : 1,
              }}>
                <Compass size={12} /> {checkingId === g.id ? 'Проверяю...' : 'Reality Check (AI)'}
              </button>
            </div>
            {realityError[g.id] && (
              <div style={{ fontSize: 10, color: COLORS.crimson, background: COLORS.crimsonSoft, borderRadius: 8, padding: '5px 8px', marginTop: 6 }}>
                AI не ответил. Причина: {realityError[g.id]}
                <button className="lrpg-btn" onClick={() => handleRealityCheck(g)} style={{ display: 'block', marginTop: 4, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700 }}>Повторить</button>
              </div>
            )}
            {realityResults[g.id] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {realityResults[g.id].map((sc, i) => (
                  <div key={i} style={{ background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold }}>{sc.name}</span>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>Вероятность: {sc.probability}</span>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{sc.pace}</div>
                    <div style={{ fontSize: 10, color: COLORS.crimson, marginTop: 2 }}>Риск: {sc.risks}</div>
                    <button className="lrpg-btn" onClick={() => acceptScenario(g, sc)} style={{ marginTop: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 700 }}>
                      Принять этот срок
                    </button>
                  </div>
                ))}
              </div>
            )}
            {g.progress < 100 && (
              <button className="lrpg-btn" disabled={breakingId === g.id} onClick={() => handleBreakdown(g)} style={{
                marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: COLORS.bgCardAlt, color: COLORS.violet, border: `1px solid ${COLORS.violet}55`,
                borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12, opacity: breakingId === g.id ? 0.6 : 1,
              }}>
                <Wand2 size={13} /> {breakingId === g.id ? 'AI собирает план...' : linkedQuests.length > 0 ? `Разбить ещё раз (уже ${linkedQuests.length} квестов)` : 'Разбить на квесты (AI)'}
              </button>
            )}
            {fallbackNoticeId === g.id && (
              <div style={{ marginTop: 6, fontSize: 10, color: COLORS.crimson, background: COLORS.crimsonSoft, borderRadius: 8, padding: '6px 8px' }}>
                <div>AI сейчас не ответил. Причина: {fallbackReason}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button className="lrpg-btn" onClick={() => handleBreakdown(g)} style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '5px 0', fontSize: 10, fontWeight: 700 }}>Повторить</button>
                  <button className="lrpg-btn" onClick={() => useOfflinePlan(g)} style={{ flex: 1, background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 6, padding: '5px 0', fontSize: 10, fontWeight: 700, border: `1px solid ${COLORS.border}` }}>Взять простой план</button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AddGoalForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sphere, setSphere] = useState(SPHERES[0]);
  const [deadline, setDeadline] = useState('');
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input className="lrpg-input" placeholder="Название цели" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="lrpg-input" placeholder="Описание (необязательно)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <select className="lrpg-input" value={sphere} onChange={e => setSphere(e.target.value)}>
          {SPHERES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="lrpg-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="lrpg-btn" disabled={!title.trim()} onClick={() => onSubmit({ title: title.trim(), description, sphere, deadline })}
            style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: title.trim() ? 1 : 0.5 }}>
            Создать
          </button>
          <button className="lrpg-btn" onClick={onCancel} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 8, padding: '9px 14px', fontSize: 13, border: `1px solid ${COLORS.border}` }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

const CONSISTENCY_RANGES = [
  { key: '7', label: '7д', days: 7 },
  { key: '30', label: '30д', days: 30 },
  { key: '90', label: '90д', days: 90 },
  { key: 'all', label: 'Всё время', days: Infinity },
];

function dayHasGoodActivity(chronicle, dayStart, dayEnd) {
  let hasCompleted = false, hasBadSkip = false;
  for (const c of chronicle) {
    if (c.ts < dayStart || c.ts >= dayEnd) continue;
    if (c.type === 'QUEST_COMPLETED') hasCompleted = true;
    if (c.type === 'QUEST_SKIPPED' && !c.text.includes('уважительная')) hasBadSkip = true;
  }
  return { hasCompleted, hasBadSkip };
}

function computeConsistencyForRange(chronicle, rangeDays) {
  if (chronicle.length === 0) return 50;
  const earliestTs = Math.min(...chronicle.map(c => c.ts));
  const daysSinceStart = Math.floor((Date.now() - earliestTs) / 86400000) + 1;
  const windowDays = rangeDays === Infinity ? daysSinceStart : Math.min(rangeDays, daysSinceStart);
  let score = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayStart = new Date(d.toISOString().slice(0, 10) + 'T00:00:00').getTime();
    const { hasCompleted, hasBadSkip } = dayHasGoodActivity(chronicle, dayStart, dayStart + 86400000);
    if (hasCompleted && !hasBadSkip) score += 1;
    else if (hasCompleted && hasBadSkip) score += 0.5;
  }
  return Math.round((score / windowDays) * 100);
}

function computeStreakInfo(chronicle) {
  if (chronicle.length === 0) return { current: 0, longest: 0 };
  const earliestTs = Math.min(...chronicle.map(c => c.ts));
  const daysSinceStart = Math.floor((Date.now() - earliestTs) / 86400000) + 1;
  let current = 0, longest = 0, running = 0, stillCounting = true;
  for (let i = 0; i < daysSinceStart; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dayStart = new Date(d.toISOString().slice(0, 10) + 'T00:00:00').getTime();
    const { hasCompleted, hasBadSkip } = dayHasGoodActivity(chronicle, dayStart, dayStart + 86400000);
    const good = hasCompleted && !hasBadSkip;
    if (good) {
      running += 1;
      if (stillCounting) current = running;
      longest = Math.max(longest, running);
    } else {
      running = 0;
      stillCounting = false;
    }
  }
  return { current, longest };
}

function StatsTab({ stats, energy, todayCheckin, setDailyCheckin, chronicle, recoveryMode, toggleRecoveryMode, statsHistory }) {
  const [showCheckin, setShowCheckin] = useState(false);
  const [expandedStat, setExpandedStat] = useState(null);
  const [consistencyRange, setConsistencyRange] = useState('30');
  const [historyStat, setHistoryStat] = useState(STATS_DEF[0].key);
  const eLabel = energyLabel(energy);
  const rangeDef = CONSISTENCY_RANGES.find(r => r.key === consistencyRange);
  const consistency = computeConsistencyForRange(chronicle, rangeDef.days);
  const streakInfo = computeStreakInfo(chronicle);
  const historyData = statsHistory.map(h => ({ date: h.date.slice(5), value: h.stats[historyStat] }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Card>
        <div onClick={() => setShowCheckin(v => !v)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textMuted, marginBottom: 6, cursor: 'pointer' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={13} color={eLabel.color} /> Energy</span>
          <span style={{ color: eLabel.color, fontWeight: 700 }}>{energy}/100 · {eLabel.label} {todayCheckin ? '▾' : '· заполнить ▾'}</span>
        </div>
        <Bar value={energy} color={eLabel.color} />
        {showCheckin && <CheckinForm initial={todayCheckin} onSubmit={data => { setDailyCheckin(data); setShowCheckin(false); }} />}
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
          <span>Consistency</span>
          <span>{consistency}/100</span>
        </div>
        <Bar value={consistency} color={COLORS.gold} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {CONSISTENCY_RANGES.map(r => (
            <button key={r.key} className="lrpg-btn" onClick={() => setConsistencyRange(r.key)} style={{
              flex: 1, background: consistencyRange === r.key ? COLORS.gold : COLORS.bgCardAlt,
              color: consistencyRange === r.key ? '#1a1305' : COLORS.textMuted, borderRadius: 6, padding: '5px 0', fontSize: 10, fontWeight: 700,
            }}>{r.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 11, color: COLORS.textMuted }}>
          <span>Streak сейчас: <b style={{ color: COLORS.text }}>{streakInfo.current}д</b></span>
          <span>Лучший: <b style={{ color: COLORS.text }}>{streakInfo.longest}д</b></span>
        </div>
      </Card>
      {historyData.length > 1 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} color={COLORS.violet} /> История стата</span>
            <select className="lrpg-input" value={historyStat} onChange={e => setHistoryStat(e.target.value)} style={{ width: 140, padding: '4px 8px', fontSize: 11 }}>
              {STATS_DEF.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={26} />
                <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: 11 }} labelStyle={{ color: COLORS.text }} />
                <Line type="monotone" dataKey="value" stroke={COLORS.violet} strokeWidth={2} dot={{ r: 2, fill: COLORS.violet }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><HeartPulse size={14} color={COLORS.teal} /> Recovery Mode</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Снижает штрафы вдвое, если сейчас тяжело</div>
        </div>
        <button className="lrpg-btn" onClick={toggleRecoveryMode} style={{
          background: recoveryMode ? COLORS.teal : COLORS.bgCardAlt, color: recoveryMode ? '#0B1F1D' : COLORS.textMuted,
          borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, border: `1px solid ${recoveryMode ? COLORS.teal : COLORS.border}`,
        }}>{recoveryMode ? 'Включён' : 'Выключен'}</button>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {STATS_DEF.map(s => {
          const Icon = s.icon;
          const val = stats[s.key];
          const expanded = expandedStat === s.key;
          const relevant = expanded
            ? chronicle.filter(c => c.text.includes(s.label)).slice(0, 3)
            : [];
          return (
            <Card key={s.key} style={{ cursor: 'pointer', gridColumn: expanded ? '1 / -1' : 'auto' }}>
              <div onClick={() => setExpandedStat(expanded ? null : s.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon size={15} color={COLORS.violet} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
              </div>
              <Bar value={val} color={COLORS.violet} />
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 5 }}>{val}/100</div>
              {expanded && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}` }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Последнее, что повлияло:</div>
                  {relevant.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted }}>Пока нет связанных записей в хронике.</div>}
                  {relevant.map(c => (
                    <div key={c.id} style={{ fontSize: 11, marginTop: 3 }}>{c.text}</div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ShopTab({ rewards, coins, coinsEarnedAllTime, coinsSpentAllTime, coinTransactions, cosmetics, lastPurchase, lastRefundAt, buyReward, buyCosmetic, equipCosmetic, refundLastPurchase, showAddReward, setShowAddReward, addReward, deleteReward, setRewardEnabled }) {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(100);
  const [category, setCategory] = useState('reallife');
  const [icon, setIcon] = useState('🎁');
  const [shopTab, setShopTab] = useState('reallife');
  const [showWallet, setShowWallet] = useState(false);

  const weekAgo = Date.now() - 7 * 86400000;
  const weekTx = coinTransactions.filter(t => t.timestamp >= weekAgo);
  const weekEarned = weekTx.filter(t => t.type === 'earn' || t.type === 'refund').reduce((s, t) => s + t.amount, 0);
  const weekSpent = weekTx.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0);
  const spends = coinTransactions.filter(t => t.type === 'spend');
  const largestPurchase = spends.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, null);
  const purchaseCounts = {};
  spends.forEach(t => { purchaseCounts[t.title] = (purchaseCounts[t.title] || 0) + 1; });
  const mostPurchased = Object.entries(purchaseCounts).sort((a, b) => b[1] - a[1])[0];
  const avgDaily = coinsEarnedAllTime > 0 ? Math.round(weekEarned / 7) : 0;
  const canRefund = lastPurchase && lastPurchase.isCustom && (!lastRefundAt || Date.now() - lastRefundAt >= 86400000);

  const shopTabs = [['reallife', '🎁 Реальные'], ['cosmetic', '✨ Косметика'], ['collection', '🏺 Коллекции']];
  const customInCategory = rewards.filter(r => r.category === shopTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ cursor: 'pointer' }} onClick={() => setShowWallet(v => !v)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>🪙 Coin Wallet</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.gold, fontWeight: 700, fontSize: 16 }}><CoinsIcon size={16} /> {coins}</span>
        </div>
        {showWallet && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>Earned All Time</div><div style={{ fontWeight: 700, color: COLORS.teal }}>{coinsEarnedAllTime}</div></div>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>Spent All Time</div><div style={{ fontWeight: 700, color: COLORS.crimson }}>{coinsSpentAllTime}</div></div>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>За неделю: заработано</div><div style={{ fontWeight: 700, color: COLORS.teal }}>{weekEarned}</div></div>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>За неделю: потрачено</div><div style={{ fontWeight: 700, color: COLORS.crimson }}>{weekSpent}</div></div>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>Среднее в день</div><div style={{ fontWeight: 700 }}>{avgDaily}</div></div>
              <div style={{ background: COLORS.bgCardAlt, borderRadius: 6, padding: 6 }}><div style={{ color: COLORS.textMuted }}>Крупнейшая покупка</div><div style={{ fontWeight: 700 }}>{largestPurchase ? `${largestPurchase.amount} (${largestPurchase.title})` : '—'}</div></div>
            </div>
            {mostPurchased && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Чаще всего покупаешь: <b style={{ color: COLORS.text }}>{mostPurchased[0]}</b> ({mostPurchased[1]}×)</div>}
            {canRefund && (
              <button className="lrpg-btn" onClick={refundLastPurchase} style={{ marginTop: 8, width: '100%', background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '7px 0', fontSize: 12, color: COLORS.teal, fontWeight: 700 }}>
                ↩️ Вернуть последнюю покупку: {lastPurchase.title} (+{lastPurchase.cost})
              </button>
            )}
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>История начислений и трат</span>
              <span>{coinTransactions.length} записей</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
              {coinTransactions.slice(-60).reverse().map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 5 }}>
                  <div style={{ overflow: 'hidden', maxWidth: '72%' }}>
                    <div style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 1 }}>{COIN_SOURCE_LABELS[t.source] || t.source} · {fmtTime(t.timestamp)}</div>
                  </div>
                  <span style={{ color: (t.type === 'earn' || t.type === 'refund') ? COLORS.teal : COLORS.crimson, fontWeight: 700, flexShrink: 0 }}>{(t.type === 'earn' || t.type === 'refund') ? '+' : (t.type === 'adjustment' ? (t.amount >= 0 ? '+' : '') : '-')}{t.amount}</span>
                </div>
              ))}
              {coinTransactions.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted }}>Операций пока нет.</div>}
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: 4 }}>
        {shopTabs.map(([k, l]) => (
          <button key={k} className="lrpg-btn" onClick={() => setShopTab(k)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, fontWeight: 700, fontSize: 11,
            background: shopTab === k ? COLORS.violet : COLORS.bgCardAlt, color: shopTab === k ? '#100E1C' : COLORS.textMuted,
          }}>{l}</button>
        ))}
      </div>

      <button className="lrpg-btn" onClick={() => setShowAddReward(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>
        <Plus size={16} /> Своя награда
      </button>
      {showAddReward && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="lrpg-input" placeholder="Название награды" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="lrpg-input" type="number" min={1} placeholder="Стоимость в Coins" value={cost || ''} onChange={e => setCost(e.target.value === '' ? 0 : Number(e.target.value))} />
            <select className="lrpg-input" value={category} onChange={e => setCategory(e.target.value)}>
              {REWARD_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
            </select>
            <input className="lrpg-input" placeholder="Эмодзи-иконка (необязательно)" value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} />
            <button className="lrpg-btn" disabled={!title.trim()} onClick={() => { addReward({ title: title.trim(), cost, category, icon }); setTitle(''); setCost(100); }}
              style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: title.trim() ? 1 : 0.5 }}>
              Добавить
            </button>
          </div>
        </Card>
      )}

      {shopTab === 'cosmetic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COSMETIC_CATALOG.map(item => {
            const owned = cosmetics.unlocked.includes(item.id);
            const equipped = cosmetics.equipped[item.type] === item.id;
            return (
              <Card key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.type === 'nameColor' ? '🎨' : item.preview}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.rarity} · {owned ? 'куплено' : `${item.cost} Coins`}</div>
                  </div>
                </div>
                {owned ? (
                  <button className="lrpg-btn" onClick={() => equipCosmetic(item.type, equipped ? null : item.id)} style={{
                    background: equipped ? COLORS.teal : COLORS.bgCardAlt, color: equipped ? '#0B1F1D' : COLORS.textMuted,
                    borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 11, border: equipped ? 'none' : `1px solid ${COLORS.border}`,
                  }}>{equipped ? 'Надето' : 'Надеть'}</button>
                ) : (
                  <button className="lrpg-btn" disabled={coins < item.cost} onClick={() => buyCosmetic(item)} style={{
                    background: coins >= item.cost ? COLORS.gold : COLORS.bgCardAlt, color: coins >= item.cost ? '#1a1305' : COLORS.textMuted,
                    borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, border: coins >= item.cost ? 'none' : `1px solid ${COLORS.border}`,
                  }}>Купить</button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {shopTab !== 'cosmetic' && customInCategory.length === 0 && (
        <Card><div style={{ fontSize: 12, color: COLORS.textMuted }}>Пока пусто в этой категории — добавь свою награду выше.</div></Card>
      )}
      {shopTab !== 'cosmetic' && customInCategory.map(r => (
        <Card key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: r.enabled === false ? 0.5 : 1 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.icon} {r.title}</div>
            <div style={{ fontSize: 12, color: COLORS.gold, fontWeight: 600 }}>{r.cost} Coins</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {r.custom && (
              <button className="lrpg-btn" onClick={() => setRewardEnabled(r.id, r.enabled === false)} style={{ background: 'none' }} title={r.enabled === false ? 'Включить' : 'Скрыть'}>
                {r.enabled === false ? <Plus size={13} color={COLORS.textMuted} /> : <X size={13} color={COLORS.textMuted} />}
              </button>
            )}
            <button className="lrpg-btn" disabled={coins < r.cost || r.enabled === false} onClick={() => buyReward(r)}
              style={{ background: (coins >= r.cost && r.enabled !== false) ? COLORS.gold : COLORS.bgCardAlt, color: (coins >= r.cost && r.enabled !== false) ? '#1a1305' : COLORS.textMuted, borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, border: (coins >= r.cost && r.enabled !== false) ? 'none' : `1px solid ${COLORS.border}` }}>
              Купить
            </button>
            <button className="lrpg-btn" onClick={() => deleteReward(r.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
          </div>
        </Card>
      ))}
    </div>
  );
}

const CHRONICLE_COLOR = {
  QUEST_COMPLETED: COLORS.gold, LEVEL_UP: COLORS.gold, QUEST_SKIPPED: COLORS.crimson,
  QUEST_LATER: COLORS.textMuted, QUEST_CREATED: COLORS.violet, GOAL_CREATED: COLORS.violet,
  GOAL_COMPLETED: COLORS.gold, REWARD_PURCHASED: COLORS.teal, BONUS_QUESTS: COLORS.violet,
  MONTHLY_CHALLENGE: COLORS.crimson, SYSTEM: COLORS.textMuted, ACHIEVEMENT_UNLOCKED: COLORS.gold,
  DEBT_PAYMENT: COLORS.teal, DEBT_DEFEATED: COLORS.gold, LIFE_EVENT: COLORS.violet,
  MANUAL: COLORS.teal, RANDOM_EVENT: COLORS.violet,
};

const CHRONICLE_FILTER_GROUPS = [
  { key: 'all', label: 'Всё', types: null },
  { key: 'quests', label: 'Квесты', types: ['QUEST_COMPLETED', 'QUEST_SKIPPED', 'QUEST_LATER', 'QUEST_CREATED', 'BONUS_QUESTS', 'MONTHLY_CHALLENGE', 'RANDOM_EVENT'] },
  { key: 'goals', label: 'Цели', types: ['GOAL_CREATED', 'GOAL_COMPLETED'] },
  { key: 'finance', label: 'Финансы', types: ['DEBT_PAYMENT', 'DEBT_DEFEATED', 'REWARD_PURCHASED'] },
  { key: 'achievements', label: 'Достижения', types: ['ACHIEVEMENT_UNLOCKED', 'LEVEL_UP'] },
  { key: 'events', label: 'События', types: ['LIFE_EVENT'] },
  { key: 'other', label: 'Прочее', types: ['SYSTEM', 'MANUAL'] },
];

function ChronicleTab({ chronicle, addManualChronicleEntry, editChronicleEntry, deleteChronicleEntry }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState(todayStr());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [searchText, setSearchText] = useState('');

  function startEdit(c) {
    setEditingId(c.id);
    setEditText(c.text);
  }

  function saveEdit(id) {
    if (editText.trim()) editChronicleEntry(id, editText.trim());
    setEditingId(null);
  }

  const activeGroup = CHRONICLE_FILTER_GROUPS.find(g => g.key === filterKey);
  const filtered = chronicle.filter(c => {
    if (activeGroup.types && !activeGroup.types.includes(c.type)) return false;
    if (searchText.trim() && !c.text.toLowerCase().includes(searchText.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} color={COLORS.textMuted} style={{ position: 'absolute', left: 10, top: 10 }} />
        <input className="lrpg-input" placeholder="Поиск по записям..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ paddingLeft: 30 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {CHRONICLE_FILTER_GROUPS.map(g => (
          <button key={g.key} className="lrpg-btn" onClick={() => setFilterKey(g.key)} style={{
            flexShrink: 0, background: filterKey === g.key ? COLORS.violet : COLORS.bgCardAlt,
            color: filterKey === g.key ? '#100E1C' : COLORS.textMuted, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700,
          }}>{g.label}</button>
        ))}
      </div>
      <button className="lrpg-btn" onClick={() => setShowAdd(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.bgCardAlt, color: COLORS.violet, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: 12 }}>
        <Plus size={14} /> Добавить запись задним числом
      </button>
      {showAdd && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="lrpg-input" placeholder="Что произошло" value={newText} onChange={e => setNewText(e.target.value)} />
            <input className="lrpg-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} max={todayStr()} />
            <button className="lrpg-btn" disabled={!newText.trim()} onClick={() => { addManualChronicleEntry(newText.trim(), newDate); setNewText(''); setShowAdd(false); }}
              style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: newText.trim() ? 1 : 0.5 }}>
              Добавить
            </button>
          </div>
        </Card>
      )}
      {filtered.length === 0 && <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '20px 0' }}>Ничего не найдено.</div>}
      {filtered.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: CHRONICLE_COLOR[c.type] || COLORS.textMuted, marginTop: 5, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {editingId === c.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="lrpg-input" value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                <button className="lrpg-btn" onClick={() => saveEdit(c.id)} style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 6, padding: '0 10px', fontSize: 12, fontWeight: 700 }}><Check size={13} /></button>
              </div>
            ) : (
              <div style={{ fontSize: 13 }}>{c.text}{c.edited && <span style={{ fontSize: 10, color: COLORS.textMuted }}> (отредактировано)</span>}{c.isManual && <span style={{ fontSize: 10, color: COLORS.teal }}> · добавлено вручную</span>}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{fmtTime(c.ts)}</div>
              {editingId !== c.id && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="lrpg-btn" onClick={() => startEdit(c)} style={{ background: 'none' }}><Pencil size={11} color={COLORS.textMuted} /></button>
                  <button className="lrpg-btn" onClick={() => deleteChronicleEntry(c.id)} style={{ background: 'none' }}><Trash2 size={11} color={COLORS.textMuted} /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HabitsTab({ habits, addHabit, completeHabit, deleteHabit, aiContextState }) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [stat, setStat] = useState(STATS_DEF[0].key);
  const [secondaryStat, setSecondaryStat] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const today = todayStr();

  async function handleSuggest() {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const result = await aiHabitSuggestions(aiContextState);
      setSuggestions(result);
    } catch (e) {
      setSuggestError(friendlyAIError(e));
    } finally {
      setSuggestLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button className="lrpg-btn" onClick={() => setShowAdd(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>
        <Plus size={16} /> Новая привычка
      </button>
      <button className="lrpg-btn" disabled={suggestLoading} onClick={handleSuggest} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.bgCardAlt,
        color: COLORS.teal, border: `1px solid ${COLORS.teal}55`, borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: 12,
        opacity: suggestLoading ? 0.6 : 1,
      }}>
        <Sparkles size={14} /> {suggestLoading ? 'Мастер думает...' : 'Предложить привычки (AI)'}
      </button>
      {suggestError && (
        <Card><div style={{ fontSize: 11, color: COLORS.textMuted }}>{suggestError}</div></Card>
      )}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>Исходя из твоих слабых статов и текущих привычек:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 12 }}>
                  {s.title} <span style={{ color: COLORS.textMuted }}>({STAT_LABEL[s.stat]}{s.secondaryStat ? ` +${STAT_LABEL[s.secondaryStat]}` : ''})</span>
                </div>
                <button className="lrpg-btn" onClick={() => { addHabit({ title: s.title, stat: s.stat, secondaryStat: s.secondaryStat }); setSuggestions(list => list.filter((_, idx) => idx !== i)); }}
                  style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 6, padding: '5px 10px', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  Добавить
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {showAdd && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Быстрый выбор:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {HABIT_LIBRARY.map(h => (
                <button key={h.title} className="lrpg-btn" onClick={() => { setTitle(h.title); setStat(h.stat); }} style={{
                  background: COLORS.bgCardAlt, color: COLORS.violet, border: `1px solid ${COLORS.violet}55`,
                  borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                }}>{h.title}</button>
              ))}
            </div>
            <input className="lrpg-input" placeholder="Например: лечь спать до 23:00" value={title} onChange={e => setTitle(e.target.value)} />
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Основной стат:</div>
            <select className="lrpg-input" value={stat} onChange={e => setStat(e.target.value)}>
              {STATS_DEF.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Второй стат (необязательно) — если привычка качает сразу два аспекта:</div>
            <select className="lrpg-input" value={secondaryStat} onChange={e => setSecondaryStat(e.target.value)}>
              <option value="">— нет —</option>
              {STATS_DEF.filter(s => s.key !== stat).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button className="lrpg-btn" disabled={!title.trim()} onClick={() => { addHabit({ title: title.trim(), stat, secondaryStat: secondaryStat || null }); setTitle(''); setSecondaryStat(''); setShowAdd(false); }}
              style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: title.trim() ? 1 : 0.5 }}>
              Создать
            </button>
          </div>
        </Card>
      )}
      {habits.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Привычек пока нет. Добавь первую — например, ежедневное чтение.</div></Card>}
      {habits.map(h => {
        const doneToday = h.lastDoneDate === today;
        return (
          <Card key={h.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{h.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Tag color={COLORS.violet}>{STAT_LABEL[h.stat]}</Tag>
                  {h.secondaryStat && STAT_LABEL[h.secondaryStat] && <Tag color={COLORS.teal}>+{STAT_LABEL[h.secondaryStat]}</Tag>}
                  <Tag color={COLORS.gold}>Level {h.level}</Tag>
                </div>
              </div>
              <button className="lrpg-btn" onClick={() => deleteHabit(h.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: COLORS.gold, fontWeight: 700, fontSize: 13 }}>
                <Flame size={15} /> {h.streakCurrent}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Best: {h.bestStreak}</div>
              <button className="lrpg-btn" disabled={doneToday} onClick={() => completeHabit(h)} style={{
                marginLeft: 'auto', background: doneToday ? COLORS.bgCardAlt : COLORS.gold, color: doneToday ? COLORS.textMuted : '#1a1305',
                borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, border: doneToday ? `1px solid ${COLORS.border}` : 'none',
              }}>
                {doneToday ? 'Сделано сегодня' : 'Отметить'}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AddInlineForm({ fields, onSubmit, submitLabel = 'Добавить' }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default !== undefined ? f.default : (f.type === 'checkbox' ? false : '')])));
  const valid = fields.every(f => !f.required || String(values[f.key] || '').trim());
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(f => {
          if (f.type === 'select') {
            return (
              <select key={f.key} className="lrpg-input" value={values[f.key]}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}>
                {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            );
          }
          if (f.type === 'checkbox') {
            return (
              <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: COLORS.textMuted }}>
                <input type="checkbox" checked={!!values[f.key]}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.checked }))} />
                {f.label || f.key}
              </label>
            );
          }
          return (
            <input key={f.key} className="lrpg-input" type={f.type || 'text'} placeholder={f.placeholder}
              value={f.type === 'number' && !values[f.key] ? '' : values[f.key]}
              onChange={e => setValues(v => ({ ...v, [f.key]: f.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value }))} />
          );
        })}
        <button className="lrpg-btn" disabled={!valid} onClick={() => onSubmit(values)}
          style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: valid ? 1 : 0.5 }}>
          {submitLabel}
        </button>
      </div>
    </Card>
  );
}

function ObligationsSummaryCard({ debts }) {
  const alive = (debts || []).filter(d => d.remaining > 0);
  if (alive.length === 0) return null;
  const loans = alive.filter(d => d.loanType !== 'simple');
  const simple = alive.filter(d => d.loanType === 'simple');
  const totalMonthly = loans.reduce((s, d) => s + (currentMonthlyDue(d) || 0), 0);
  const monthLabel = monthKeyLabel(monthStr());
  return (
    <Card style={{ marginBottom: 8, border: `1px solid ${COLORS.gold}44` }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertCircle size={14} color={COLORS.gold} /> Обязательства — {monthLabel}
      </div>
      {loans.length > 0 && (
        <div style={{ marginBottom: simple.length > 0 ? 10 : 0 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Платежи по кредитам</div>
          {loans.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
              <span>{d.title}{d.paymentDueDay ? ` · до ${d.paymentDueDay} числа` : ''}</span>
              <b style={{ color: COLORS.crimson }}>{Math.round(currentMonthlyDue(d) || 0)}</b>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${COLORS.border}`, fontWeight: 700 }}>
            <span>Итого в месяц</span><span>{Math.round(totalMonthly)}</span>
          </div>
        </div>
      )}
      {simple.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Простые долги</div>
          {simple.slice().sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')).map(d => {
            const overdue = d.dueDate && d.dueDate < todayStr();
            return (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                <span>{d.title}</span>
                <span>
                  <b style={{ color: COLORS.crimson, marginRight: 6 }}>{Math.round(d.remaining)}</b>
                  <span style={{ color: overdue ? COLORS.crimson : COLORS.textMuted }}>{d.dueDate ? (overdue ? `просрочен (${d.dueDate})` : `до ${d.dueDate}`) : 'без срока'}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AddDebtForm({ onSubmit, onCancel }) {
  const [loanType, setLoanType] = useState('annuity'); // 'annuity' | 'differentiated' | 'simple'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('debt_credit');
  const [total, setTotal] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('');
  const [alreadyPaidMonths, setAlreadyPaidMonths] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [addToBalance, setAddToBalance] = useState(true);

  const totalNum = Number(total) || 0;
  const rateNum = Number(rate) || 0;
  const monthsNum = Number(months) || 0;
  const alreadyPaidNum = Math.max(0, Math.min(Number(alreadyPaidMonths) || 0, monthsNum || 0));
  const isLoan = loanType === 'annuity' || loanType === 'differentiated';
  const schedule = isLoan && monthsNum > 0 && totalNum > 0
    ? (loanType === 'annuity' ? buildAmortizationSchedule(totalNum, rateNum, monthsNum) : buildDifferentiatedSchedule(totalNum, rateNum, monthsNum))
    : null;
  const remainingNow = schedule && alreadyPaidNum > 0 ? schedule[alreadyPaidNum - 1].balance : totalNum;
  const firstPayment = schedule ? schedule[0].payment : 0;
  const currentPayment = schedule && alreadyPaidNum > 0 ? schedule[alreadyPaidNum - 1].payment : firstPayment; // до пересчёта после следующего платежа — для дифф. это платёж ПОСЛЕ уже внесённых месяцев
  const overpay = schedule ? Math.max(0, schedule.reduce((s, r) => s + r.payment, 0) - totalNum) : 0;
  const valid = title.trim() && totalNum > 0 && (isLoan ? monthsNum > 0 : true) && (loanType === 'simple' ? true : true);

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'annuity', label: 'Аннуитет' },
            { key: 'differentiated', label: 'Дифференцир.' },
            { key: 'simple', label: 'Простой долг' },
          ].map(o => (
            <button key={o.key} className="lrpg-btn" onClick={() => setLoanType(o.key)} style={{
              flex: 1, minWidth: 90, background: loanType === o.key ? COLORS.violet : COLORS.bgCardAlt, color: loanType === o.key ? '#100E1C' : COLORS.textMuted,
              borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 700,
            }}>{o.label}</button>
          ))}
        </div>
        <input className="lrpg-input" placeholder={loanType === 'simple' ? 'Кому/за что должен (например: Другу Ивану)' : 'Название'} value={title} onChange={e => setTitle(e.target.value)} />
        <select className="lrpg-input" value={category} onChange={e => setCategory(e.target.value)}>
          {DEBT_CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {isLoan ? (
          <>
            <input className="lrpg-input" type="number" min={0} placeholder="Сумма кредита при выдаче (изначальная)" value={total} onChange={e => setTotal(e.target.value)} />
            <input className="lrpg-input" type="number" min={0} step={0.1} placeholder="Ставка, % годовых" value={rate} onChange={e => setRate(e.target.value)} />
            <input className="lrpg-input" type="number" min={1} placeholder="Срок, месяцев (общий)" value={months} onChange={e => setMonths(e.target.value)} />
            <input className="lrpg-input" type="number" min={0} placeholder="Уже оплачено месяцев (0, если кредит новый)" value={alreadyPaidMonths} onChange={e => setAlreadyPaidMonths(e.target.value)} />
            <input className="lrpg-input" type="number" min={1} max={28} placeholder="День платежа в месяце (необязательно)" value={paymentDueDay} onChange={e => setPaymentDueDay(e.target.value)} />
            {schedule && (
              <div style={{ fontSize: 12, background: COLORS.bgCardAlt, borderRadius: 8, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: COLORS.textMuted }}>Остаток основного долга сейчас</span><b style={{ color: COLORS.gold }}>{Math.round(remainingNow)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ color: COLORS.textMuted }}>{loanType === 'annuity' ? 'Платёж в месяц (фикс.)' : 'Ближайший платёж'}</span>
                  <b style={{ color: COLORS.text }}>{Math.round(currentPayment)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}><span style={{ color: COLORS.textMuted }}>Переплата за весь срок</span><b style={{ color: COLORS.crimson }}>{Math.round(overpay)}</b></div>
                {loanType === 'differentiated' && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Платёж будет уменьшаться каждый месяц — тело долга гасится равными частями, а проценты считаются от остатка.</div>}
              </div>
            )}
          </>
        ) : (
          <>
            <input className="lrpg-input" type="number" min={0} placeholder="Сколько должен (остаток)" value={total} onChange={e => setTotal(e.target.value)} />
            <input className="lrpg-input" type="date" placeholder="Вернуть до какого числа" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Без графика платежей и процентов — просто сумма и срок, как долг другу или задолженность по карте.</div>
          </>
        )}
        {loanType === 'simple' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: COLORS.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={addToBalance} onChange={e => setAddToBalance(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0 }} />
            Деньги реально пришли ко мне сейчас (добавить {totalNum || 0} на баланс). Выключи, если это старый долг, который просто записываешь.
          </label>
        ) : alreadyPaidNum === 0 ? (
          <div style={{ fontSize: 11, color: COLORS.teal, background: COLORS.bgCardAlt, borderRadius: 8, padding: 8 }}>
            ✅ {totalNum || 0} автоматически добавится на баланс — это новый кредит, деньги реально приходят тебе.
          </div>
        ) : (
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>Долг уже частично оплачен раньше — деньги на баланс сейчас не добавляем, это просто перенос существующего кредита в игру.</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="lrpg-btn" disabled={!valid} onClick={() => onSubmit({
            title: title.trim(), category, total: totalNum,
            interestRate: isLoan ? rateNum : 0, termMonths: isLoan ? monthsNum : null,
            alreadyPaidMonths: isLoan ? alreadyPaidNum : 0,
            paymentDueDay: isLoan && paymentDueDay ? Number(paymentDueDay) : null,
            dueDate: loanType === 'simple' && dueDate ? dueDate : null,
            loanType, addToBalance: loanType === 'simple' ? addToBalance : (alreadyPaidNum === 0),
          })} style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: valid ? 1 : 0.5 }}>
            Создать
          </button>
          <button className="lrpg-btn" onClick={onCancel} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 8, padding: '9px 14px', fontSize: 13, border: `1px solid ${COLORS.border}` }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function FinanceTab({ finance, garage, setFinanceMode, addTransaction, deleteTransaction, addIncomeSource, deleteIncomeSource, setDebtStrategy, addDebt, payDebt, deleteDebt, addSavingsGoal, contributeSaving, deleteSavingsGoal, setTaxiTarget, setTaxiCommission, logOrder, deleteOrder, addCustomAsset, deleteCustomAsset, setBudgetPlanItem, removeBudgetPlanItem, setDebtLoadThresholds }) {
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [showAddIncomeSource, setShowAddIncomeSource] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [budgetMonthOffset, setBudgetMonthOffset] = useState(0); // 0 = этот месяц, 1 = следующий
  const [payAmounts, setPayAmounts] = useState({});
  const [saveAmounts, setSaveAmounts] = useState({});
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [orderAmount, setOrderAmount] = useState('');

  const today = todayStr();
  const todayStart = new Date(today + 'T00:00:00').getTime();
  const todayOrders = finance.taxi.orders.filter(o => o.ts >= todayStart);
  const todayTotal = todayOrders.reduce((s, o) => s + (o.net ?? o.amount), 0);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const start = new Date(key + 'T00:00:00').getTime();
    const end = start + 86400000;
    const sum = finance.taxi.orders.filter(o => o.ts >= start && o.ts < end).reduce((s, o) => s + (o.net ?? o.amount), 0);
    return { key, sum, label: d.toLocaleDateString('ru-RU', { weekday: 'short' }) };
  });

  const fm = financeMonthSummary(finance);
  const health = financialHealth({ finance, garage });
  const { assetBreakdown, totalAssets, totalLiabilities, netWorth } = computeNetWorth({ finance, garage });
  const thisMonthTx = finance.transactions.filter(t => monthKeyOf(t.date) === fm.monthKey).slice().sort((a, b) => (b.date + b.ts) > (a.date + a.ts) ? 1 : -1);
  const incomeBySource = {};
  thisMonthTx.filter(t => t.type === 'income').forEach(t => { incomeBySource[t.category] = (incomeBySource[t.category] || 0) + t.amount; });
  // Δ обязательств за месяц: сколько добавилось за счёт новых кредитов/долгов (source 'debt_taken')
  // минус сколько реально погашено телом долга (принцип из history платежей всех долгов).
  const debtGrowthThisMonth = thisMonthTx.filter(t => t.source === 'debt_taken').reduce((s, t) => s + t.amount, 0);
  const debtPaidThisMonth = finance.debts.reduce((s, d) => s + (d.history || []).filter(h => monthKeyOf(h.date) === fm.monthKey).reduce((s2, h) => s2 + h.principal, 0), 0);
  const actualByCategory = {};
  thisMonthTx.filter(t => t.type === 'expense').forEach(t => { actualByCategory[t.category] = (actualByCategory[t.category] || 0) + t.amount; });
  const sortedDebts = sortDebts(finance.debts, finance.strategy);
  const budgetMonthKey = addMonthsToKey(fm.monthKey, budgetMonthOffset);
  const isNextMonth = budgetMonthOffset !== 0;
  const budgetPlanForMonth = (finance.budgetPlanByMonth && finance.budgetPlanByMonth[budgetMonthKey]) || {};
  const plannedTotalForMonth = Object.values(budgetPlanForMonth).reduce((s, v) => s + (Number(v) || 0), 0);
  const isAdvanced = finance.mode === 'advanced';
  const txCategoryOptions = txType === 'income' ? INCOME_SOURCE_TYPES.map(t => ({ key: t.key, label: t.label })) : EXPENSE_CATEGORIES.filter(c => c.group !== 'fin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={15} color={COLORS.gold} /> Обзор Finance</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['simple', 'advanced'].map(m => (
              <button key={m} className="lrpg-btn" onClick={() => setFinanceMode(m)} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                background: finance.mode === m ? COLORS.violet : COLORS.bgCardAlt,
                color: finance.mode === m ? '#fff' : COLORS.textMuted,
              }}>
                {m === 'simple' ? 'Просто' : 'Подробно'}
              </button>
            ))}
          </div>
        </div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: COLORS.textMuted }}>💵 Cash Balance</span>
            <span style={{ fontWeight: 700, color: finance.cashBalance >= 0 ? COLORS.text : COLORS.crimson }}>{finance.cashBalance}</span>
          </div>
          <div style={{ borderTop: `1px dashed ${COLORS.border}`, margin: '6px 0 8px' }} />
          {[
            ['Доход за месяц', fm.income, COLORS.teal],
            ['Расходы за месяц', fm.expenses, COLORS.crimson],
            ['Платежи по долгам', fm.debtPay, COLORS.crimson],
            ['Накопления', fm.savingsContrib, COLORS.gold],
          ].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
              <span style={{ color: COLORS.textMuted }}>{label}</span><span style={{ color }}>{val}</span>
            </div>
          ))}
          {Object.keys(incomeBySource).length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Доход за месяц по источникам</div>
              {Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 2 }}>
                  <span style={{ color: COLORS.textMuted }}>{INCOME_SOURCE_TYPES.find(t => t.key === cat)?.label || cat}</span>
                  <span style={{ color: COLORS.teal }}>{amt}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 13, fontWeight: 700 }}>
            <span>Свободный остаток</span>
            <span style={{ color: fm.cashFlow >= 0 ? COLORS.teal : COLORS.crimson }}>{fm.cashFlow}</span>
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: fm.cashFlow >= 0 ? COLORS.teal : COLORS.crimson, fontWeight: 700 }}>
            {fm.cashFlow >= 0 ? 'SURPLUS — профицит' : 'DEFICIT — дефицит'}
          </div>
        </Card>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <HeartPulse size={15} color={COLORS.teal} /> Финансовое здоровье
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Card style={{ padding: 10 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>💳 Долговая нагрузка</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: health.debtZone.color, marginTop: 2 }}>{health.income > 0 ? `${health.debtLoad.toFixed(1)}%` : '—'}</div>
            <div style={{ fontSize: 10, color: health.debtZone.color, marginTop: 2 }}>{health.debtZone.emoji} {health.debtZone.label}</div>
            {isAdvanced && (
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                {[['low', 'до'], ['medium', 'до'], ['high', 'до']].map(([k]) => (
                  <input key={k} className="lrpg-input" type="number" min={0} max={100} defaultValue={finance.debtLoadThresholds[k]}
                    onBlur={e => setDebtLoadThresholds({ [k]: Number(e.target.value) || 0 })}
                    style={{ width: 40, fontSize: 10, padding: '3px 4px' }} title={`Порог "${k}", %`} />
                ))}
              </div>
            )}
          </Card>
          <Card style={{ padding: 10 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>📈 Норма накоплений</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gold, marginTop: 2 }}>{health.income > 0 ? `${health.savingsRate.toFixed(1)}%` : '—'}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>от дохода за месяц</div>
          </Card>
          <Card style={{ padding: 10 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>🛡️ Финансовая подушка</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal, marginTop: 2 }}>
              {Number.isFinite(health.emergencyMonths) ? health.emergencyMonths.toFixed(2) : '∞'} / {finance.emergencyFundGoalMonths} мес.
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>покрытие обязательных расходов</div>
          </Card>
          <Card style={{ padding: 10 }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>📊 Здоровье бюджета</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: health.budgetHealth === null ? COLORS.textMuted : (health.budgetHealth >= 80 ? COLORS.teal : health.budgetHealth >= 50 ? COLORS.gold : COLORS.crimson), marginTop: 2 }}>
              {health.budgetHealth === null ? '—' : `${Math.round(health.budgetHealth)}%`}
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{health.budgetHealth === null ? 'план не задан' : 'факт vs план'}</div>
          </Card>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Gem size={15} color={COLORS.violet} /> Активы и капитал
        </div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>NET WORTH</span>
            <span style={{ color: netWorth >= 0 ? COLORS.teal : COLORS.crimson }}>{netWorth}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
            <span>Активы</span><span style={{ color: COLORS.teal }}>{totalAssets}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
            <span>Обязательства</span><span style={{ color: COLORS.crimson }}>{totalLiabilities}</span>
          </div>
          <div style={{ borderTop: `1px dashed ${COLORS.border}`, margin: '8px 0' }} />
          {assetBreakdown.map(a => (
            <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
              <span>{a.icon} {a.label}{!a.auto && <button className="lrpg-btn" onClick={() => deleteCustomAsset(a.id)} style={{ background: 'none', marginLeft: 6 }}><Trash2 size={11} color={COLORS.textMuted} /></button>}</span>
              <span>{a.value}</span>
            </div>
          ))}
          {garage.currentValue === 0 && (
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>Укажи стоимость машины во вкладке «Гараж», чтобы она попала в Net Worth.</div>
          )}
          {finance.netWorthHistory.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto' }}>
              {finance.netWorthHistory.slice(-6).map(h => (
                <div key={h.month} style={{ fontSize: 10, textAlign: 'center', flexShrink: 0, background: COLORS.bgCardAlt, borderRadius: 6, padding: '4px 8px' }}>
                  <div style={{ color: COLORS.textMuted }}>{h.month.slice(5)}</div>
                  <div style={{ fontWeight: 700, color: h.netWorth >= 0 ? COLORS.teal : COLORS.crimson }}>{h.netWorth}</div>
                </div>
              ))}
            </div>
          )}
          <button className="lrpg-btn" onClick={() => setShowAddAsset(v => !v)} style={{ marginTop: 10, background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить актив</button>
          {showAddAsset && (
            <div style={{ marginTop: 8 }}>
              <AddInlineForm
                fields={[
                  { key: 'name', placeholder: 'Название (напр. «Депозит в банке»)', required: true },
                  { key: 'type', type: 'select', options: ASSET_TYPES.map(t => ({ value: t.key, label: t.label })), default: 'investments' },
                  { key: 'value', placeholder: 'Стоимость', type: 'number', default: 0, required: true },
                  { key: 'liquid', type: 'checkbox', label: 'Ликвидный (легко обналичить)' },
                ]}
                onSubmit={v => { addCustomAsset(v); setShowAddAsset(false); }}
              />
            </div>
          )}
        </Card>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={15} color={COLORS.gold} /> Бюджет — {monthKeyLabel(budgetMonthKey)}</span>
          <button className="lrpg-btn" onClick={() => setShowBudgetEdit(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700 }}>{showBudgetEdit ? 'Готово' : 'Настроить'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button className="lrpg-btn" onClick={() => setBudgetMonthOffset(0)} style={{
            flex: 1, background: budgetMonthOffset === 0 ? COLORS.violet : COLORS.bgCardAlt, color: budgetMonthOffset === 0 ? '#100E1C' : COLORS.textMuted,
            borderRadius: 8, padding: '6px 0', fontSize: 11, fontWeight: 700,
          }}>Этот месяц</button>
          <button className="lrpg-btn" onClick={() => setBudgetMonthOffset(1)} style={{
            flex: 1, background: budgetMonthOffset === 1 ? COLORS.violet : COLORS.bgCardAlt, color: budgetMonthOffset === 1 ? '#100E1C' : COLORS.textMuted,
            borderRadius: 8, padding: '6px 0', fontSize: 11, fontWeight: 700,
          }}>Следующий месяц</button>
        </div>
        <Card>
          {Object.keys(budgetPlanForMonth).length === 0 && !showBudgetEdit && (
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{isNextMonth ? 'План на следующий месяц ещё не задан. Нажми «Настроить», чтобы спланировать заранее.' : 'План не задан. Нажми «Настроить», чтобы задать план по категориям.'}</div>
          )}
          {EXPENSE_CATEGORIES.filter(c => c.group !== 'fin' && c.group !== 'debt').map(c => {
            const planned = budgetPlanForMonth[c.key];
            const actual = isNextMonth ? 0 : (actualByCategory[c.key] || 0);
            if (!showBudgetEdit && planned === undefined) return null;
            const diff = (planned || 0) - actual;
            return (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, flex: 1 }}>{c.label}</span>
                {showBudgetEdit ? (
                  <input className="lrpg-input" type="number" min={0} placeholder="План" value={planned || ''}
                    onChange={e => e.target.value ? setBudgetPlanItem(c.key, e.target.value, budgetMonthKey) : removeBudgetPlanItem(c.key, budgetMonthKey)}
                    style={{ width: 90, fontSize: 11, padding: '4px 6px' }} />
                ) : isNextMonth ? (
                  <span style={{ fontSize: 11, color: COLORS.text, width: 60, textAlign: 'right' }}>{planned}</span>
                ) : (
                  <>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, width: 60, textAlign: 'right' }}>{planned}</span>
                    <span style={{ fontSize: 11, width: 60, textAlign: 'right' }}>{actual}</span>
                    <span style={{ fontSize: 11, width: 60, textAlign: 'right', color: diff >= 0 ? COLORS.teal : COLORS.crimson }}>{diff}</span>
                  </>
                )}
              </div>
            );
          })}
          {!showBudgetEdit && !isNextMonth && Object.keys(budgetPlanForMonth).length > 0 && (
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: COLORS.textMuted, justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ width: 60, textAlign: 'right' }}>План</span><span style={{ width: 60, textAlign: 'right' }}>Факт</span><span style={{ width: 60, textAlign: 'right' }}>Разница</span>
            </div>
          )}
          {plannedTotalForMonth > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 12, fontWeight: 700 }}>
              <span>Итого план</span><span>{plannedTotalForMonth}</span>
            </div>
          )}
        </Card>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingDown size={15} color={COLORS.violet} /> Операции</span>
          <button className="lrpg-btn" onClick={() => setShowAddTx(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить</button>
        </div>
        {showAddTx && (
          <Card style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[['income', 'Доход'], ['expense', 'Расход']].map(([k, l]) => (
                <button key={k} className="lrpg-btn" onClick={() => setTxType(k)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  background: txType === k ? (k === 'income' ? COLORS.teal : COLORS.crimson) : COLORS.bgCardAlt,
                  color: txType === k ? '#0B1F1D' : COLORS.textMuted,
                }}>{l}</button>
              ))}
            </div>
            <AddInlineForm
              key={txType}
              fields={[
                { key: 'title', placeholder: 'Название (необязательно)' },
                { key: 'amount', placeholder: 'Сумма', type: 'number', default: 0, required: true },
                { key: 'category', type: 'select', options: txCategoryOptions.map(c => ({ value: c.key, label: c.label })), default: txCategoryOptions[0]?.key },
                ...(isAdvanced ? [
                  { key: 'date', type: 'date', default: today },
                  { key: 'essential', type: 'checkbox', label: 'Обязательный расход' },
                  { key: 'recurring', type: 'checkbox', label: 'Повторяющийся' },
                ] : []),
              ]}
              onSubmit={v => {
                addTransaction({ type: txType, title: v.title, amount: v.amount, category: v.category, date: v.date, essential: v.essential, recurring: v.recurring });
                setShowAddTx(false);
              }}
            />
          </Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {thisMonthTx.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>За этот месяц операций пока нет.</div></Card>}
          {thisMonthTx.slice(0, 30).map(t => {
            const catLabel = t.type === 'income'
              ? (INCOME_SOURCE_TYPES.find(c => c.key === t.category)?.label || t.category)
              : (EXPENSE_CATEGORIES.find(c => c.key === t.category)?.label || t.category);
            return (
              <Card key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{catLabel} · {t.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: t.type === 'income' ? COLORS.teal : COLORS.crimson }}>{t.type === 'income' ? '+' : '-'}{t.amount}</span>
                  <button className="lrpg-btn" onClick={() => deleteTransaction(t.id)} style={{ background: 'none' }}><Trash2 size={13} color={COLORS.textMuted} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={15} color={COLORS.gold} /> Источники дохода</span>
          <button className="lrpg-btn" onClick={() => setShowAddIncomeSource(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить</button>
        </div>
        {showAddIncomeSource && (
          <AddInlineForm
            fields={[
              { key: 'name', placeholder: 'Название источника', required: true },
              { key: 'type', type: 'select', options: INCOME_SOURCE_TYPES.map(t => ({ value: t.key, label: t.label })), default: 'salary' },
              { key: 'amount', placeholder: 'Сумма (для фикс. дохода)', type: 'number', default: 0 },
              { key: 'fixed', type: 'checkbox', label: 'Фиксированный доход (не переменный)' },
            ]}
            onSubmit={v => { addIncomeSource(v); setShowAddIncomeSource(false); }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {finance.incomeSources.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Источников дохода пока нет.</div></Card>}
          {finance.incomeSources.map(s => {
            const typeInfo = INCOME_SOURCE_TYPES.find(t => t.key === s.type) || INCOME_SOURCE_TYPES[4];
            return (
              <Card key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{typeInfo.icon} {s.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{s.fixed ? `${s.amount} / ${s.frequency === 'monthly' ? 'месяц' : s.frequency}` : 'переменный доход'}</div>
                </div>
                <button className="lrpg-btn" onClick={() => deleteIncomeSource(s.id)} style={{ background: 'none' }}><Trash2 size={13} color={COLORS.textMuted} /></button>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Car size={15} color={COLORS.teal} /> Такси / Заказы
        </div>
        <Card style={{ background: `linear-gradient(135deg, ${COLORS.tealSoft}, ${COLORS.bgCard})` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Сегодня заработано</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal }}>{todayTotal} / {finance.taxi.dailyTarget}</span>
          </div>
          <Bar value={todayTotal} max={finance.taxi.dailyTarget} color={COLORS.teal} />
          {todayTotal >= finance.taxi.dailyTarget && (
            <div style={{ fontSize: 12, color: COLORS.gold, marginTop: 6, fontWeight: 700 }}>🎯 Дневная цель выполнена — можно закрывать смену или бить рекорд!</div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input className="lrpg-input" type="number" min={0} placeholder="Сумма заказа" value={orderAmount}
              onChange={e => setOrderAmount(e.target.value)} />
            <button className="lrpg-btn" onClick={() => { logOrder(Number(orderAmount) || 0); setOrderAmount(''); }}
              style={{ background: COLORS.teal, color: '#0B1F1D', borderRadius: 8, padding: '0 16px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
              + Заказ
            </button>
          </div>
          {Number(orderAmount) > 0 && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Комиссия {finance.taxi.commissionPct ?? 9}%: −{Math.round(Number(orderAmount) * (finance.taxi.commissionPct ?? 9) / 100)}</span>
              <span style={{ color: COLORS.teal, fontWeight: 700 }}>На руки: {Number(orderAmount) - Math.round(Number(orderAmount) * (finance.taxi.commissionPct ?? 9) / 100)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Цель на день:</span>
            <input className="lrpg-input" type="number" min={0} value={finance.taxi.dailyTarget || ''}
              onChange={e => setTaxiTarget(e.target.value === '' ? 0 : Number(e.target.value))} style={{ maxWidth: 110, padding: '4px 8px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Комиссия таксопарка, %:</span>
            <input className="lrpg-input" type="number" min={0} max={100} value={finance.taxi.commissionPct ?? 9}
              onChange={e => setTaxiCommission(e.target.value === '' ? 0 : Number(e.target.value))} style={{ maxWidth: 70, padding: '4px 8px' }} />
          </div>
        </Card>

        <div style={{ height: 100, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7.map(d => ({ label: d.label, sum: d.sum }))}>
              <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={30} />
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: 11 }} labelStyle={{ color: COLORS.text }} />
              <RBar dataKey="sum" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {todayOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {todayOrders.slice().reverse().map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 10px', background: COLORS.bgCardAlt, borderRadius: 8 }}>
                <span style={{ color: COLORS.textMuted }}>{new Date(o.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{o.amount}{o.commission ? ` − ${o.commission}` : ''}</span>
                <span style={{ fontWeight: 700, color: COLORS.teal }}>+{o.net ?? o.amount}</span>
                <button className="lrpg-btn" onClick={() => deleteOrder(o.id)} style={{ background: 'none' }}><Trash2 size={12} color={COLORS.textMuted} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Skull size={15} color={COLORS.crimson} /> Debt Bosses</span>
          <button className="lrpg-btn" onClick={() => setShowAddDebt(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Card style={{ flex: 1, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: COLORS.textMuted }}>У меня есть</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: finance.cashBalance >= 0 ? COLORS.text : COLORS.crimson }}>{finance.cashBalance}</div>
          </Card>
          <Card style={{ flex: 1, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: COLORS.textMuted }}>Всего обязательств</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.crimson }}>{totalLiabilities}</div>
          </Card>
          <Card style={{ flex: 1, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: COLORS.textMuted }}>Баланс минус долги</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: (finance.cashBalance - totalLiabilities) >= 0 ? COLORS.teal : COLORS.crimson }}>{finance.cashBalance - totalLiabilities}</div>
          </Card>
        </div>
        <Card style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Обязательства за этот месяц</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: COLORS.textMuted }}>Взято новых кредитов/долгов</span><span style={{ color: COLORS.crimson }}>+{debtGrowthThisMonth}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 3 }}>
            <span style={{ color: COLORS.textMuted }}>Погашено тела долга</span><span style={{ color: COLORS.teal }}>-{debtPaidThisMonth}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${COLORS.border}`, fontWeight: 700 }}>
            <span>Итого изменение</span>
            <span style={{ color: (debtGrowthThisMonth - debtPaidThisMonth) <= 0 ? COLORS.teal : COLORS.crimson }}>{debtGrowthThisMonth - debtPaidThisMonth >= 0 ? '+' : ''}{debtGrowthThisMonth - debtPaidThisMonth}</span>
          </div>
        </Card>
        <ObligationsSummaryCard debts={finance.debts} />
        {showAddDebt && (
          <AddDebtForm
            onSubmit={v => { addDebt(v); setShowAddDebt(false); }}
            onCancel={() => setShowAddDebt(false)}
          />
        )}
        {finance.debts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
            {DEBT_STRATEGIES.map(s => (
              <button key={s.key} className="lrpg-btn" onClick={() => setDebtStrategy(s.key)} style={{
                background: finance.strategy === s.key ? COLORS.gold : COLORS.bgCardAlt,
                color: finance.strategy === s.key ? '#1a1305' : COLORS.textMuted,
                borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700,
                border: `1px solid ${finance.strategy === s.key ? COLORS.gold : COLORS.border}`,
              }}>{s.label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {finance.debts.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Долгов нет — красота.</div></Card>}
          {sortedDebts.map((d, i) => {
            const defeated = d.remaining <= 0;
            const isLoan = d.loanType === 'annuity' || d.loanType === 'differentiated';
            const schedule = isLoan && expandedSchedule === d.id
              ? (d.loanType === 'differentiated' ? buildDifferentiatedSchedule(d.total, d.interestRate, d.termMonths) : buildAmortizationSchedule(d.total, d.interestRate, d.termMonths))
              : null;
            const scheduleFromNow = schedule ? schedule.slice(d.monthsElapsed || 0) : null;
            const monthlyDue = currentMonthlyDue(d);
            const totalInterest = isLoan && d.loanType === 'annuity' ? Math.round(d.monthlyPayment * d.termMonths - d.total)
              : isLoan ? Math.round(buildDifferentiatedSchedule(d.total, d.interestRate, d.termMonths).reduce((s, r) => s + r.interest, 0)) : 0;
            const overdue = d.loanType === 'simple' && d.dueDate && d.dueDate < todayStr() && !defeated;
            return (
              <Card key={d.id} style={{ opacity: defeated ? 0.6 : 1, border: overdue ? `1px solid ${COLORS.crimson}` : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{!defeated ? `#${i + 1} ` : ''}{d.title} {defeated && '💀'}</div>
                    {isLoan ? (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        Платёж {Math.round(monthlyDue)}/мес{d.loanType === 'differentiated' ? ' (уменьшается)' : ''}{d.interestRate ? ` · ${d.interestRate}% годовых` : ''}{d.termMonths ? ` · ${d.monthsElapsed || 0}/${d.termMonths} мес.` : ''}{d.paymentDueDay ? ` · до ${d.paymentDueDay} числа` : ''}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: overdue ? COLORS.crimson : COLORS.textMuted, marginTop: 2 }}>
                        {d.dueDate ? `${overdue ? 'Просрочен, ' : ''}вернуть до ${d.dueDate}` : 'Простой долг, без срока'}
                      </div>
                    )}
                    {isLoan && <div style={{ fontSize: 11, color: COLORS.crimson, marginTop: 2 }}>Переплата за весь срок: {totalInterest}</div>}
                  </div>
                  <button className="lrpg-btn" onClick={() => deleteDebt(d.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Bar value={d.remaining} max={d.total} color={defeated ? COLORS.gold : COLORS.crimson} />
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>HP {Math.round(d.remaining)} / {d.total}</div>
                </div>
                {!defeated && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input className="lrpg-input" type="number" min={0} placeholder="Сумма удара" value={payAmounts[d.id] || ''}
                      onChange={e => setPayAmounts(v => ({ ...v, [d.id]: Number(e.target.value) }))} />
                    <button className="lrpg-btn" onClick={() => { payDebt(d.id, payAmounts[d.id] || 0); setPayAmounts(v => ({ ...v, [d.id]: '' })); }}
                      style={{ background: COLORS.crimson, color: '#fff', borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                      Атака
                    </button>
                  </div>
                )}
                {isLoan && (
                  <div
                    onClick={() => setExpandedSchedule(expandedSchedule === d.id ? null : d.id)}
                    style={{ fontSize: 11, color: COLORS.violet, marginTop: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    {expandedSchedule === d.id ? 'Скрыть график платежей' : 'Показать график платежей'} <ChevronRight size={12} style={{ transform: expandedSchedule === d.id ? 'rotate(90deg)' : 'none' }} />
                  </div>
                )}
                {scheduleFromNow && scheduleFromNow.length > 0 && (
                  <>
                    <div style={{ marginTop: 8, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scheduleFromNow.map(r => ({ month: r.month, Остаток: Math.round(r.balance), Платёж: Math.round(r.payment) }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="month" tick={{ fontSize: 9, fill: COLORS.textMuted }} />
                          <YAxis tick={{ fontSize: 9, fill: COLORS.textMuted }} width={40} />
                          <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: 11 }} />
                          <Line type="monotone" dataKey="Остаток" stroke={COLORS.crimson} strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Платёж" stroke={COLORS.gold} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1fr', fontSize: 10, color: COLORS.textMuted, padding: '4px 8px', borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, background: COLORS.bgCard }}>
                        <span>#</span><span>Платёж</span><span>%</span><span>Долг</span><span>Остаток</span>
                      </div>
                      {scheduleFromNow.map(row => (
                        <div key={row.month} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr 1fr', fontSize: 11, padding: '4px 8px' }}>
                          <span>{row.month}</span>
                          <span>{Math.round(row.payment)}</span>
                          <span style={{ color: COLORS.crimson }}>{Math.round(row.interest)}</span>
                          <span style={{ color: COLORS.teal }}>{Math.round(row.principalPart)}</span>
                          <span>{Math.round(row.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {d.history && d.history.length > 0 && (
                  <div
                    onClick={() => setExpandedHistory(expandedHistory === d.id ? null : d.id)}
                    style={{ fontSize: 11, color: COLORS.teal, marginTop: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    {expandedHistory === d.id ? 'Скрыть историю платежей' : `История платежей (${d.history.length})`} <ChevronRight size={12} style={{ transform: expandedHistory === d.id ? 'rotate(90deg)' : 'none' }} />
                  </div>
                )}
                {expandedHistory === d.id && d.history && (
                  <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', fontSize: 10, color: COLORS.textMuted, padding: '4px 8px', borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, background: COLORS.bgCard }}>
                      <span>Дата</span><span>Платёж</span><span>%</span><span>Тело</span><span>Остаток</span>
                    </div>
                    {d.history.slice().reverse().map(row => (
                      <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', fontSize: 11, padding: '4px 8px' }}>
                        <span>{row.date}</span>
                        <span>{row.totalPayment}</span>
                        <span style={{ color: COLORS.crimson }}>{row.interest}</span>
                        <span style={{ color: COLORS.teal }}>{row.principal}</span>
                        <span>{row.remainingAfter}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><PiggyBank size={15} color={COLORS.teal} /> Финансовые цели</span>
          <button className="lrpg-btn" onClick={() => setShowAddSaving(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить</button>
        </div>
        {showAddSaving && (
          <AddInlineForm
            fields={[
              { key: 'title', placeholder: 'На что копим', required: true },
              { key: 'target', placeholder: 'Целевая сумма', type: 'number', default: 0 },
              { key: 'type', type: 'select', options: SAVINGS_GOAL_TYPES.map(t => ({ value: t.key, label: t.label })), default: 'goal' },
            ]}
            onSubmit={v => { addSavingsGoal({ title: v.title.trim(), target: Number(v.target) || 0, type: v.type }); setShowAddSaving(false); }}
          />
        )}
        {health.emergencySavings > 0 && (
          <Card style={{ marginTop: 8, border: `1px solid ${COLORS.teal}55` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>🛡️ Emergency Fund coverage</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.teal, marginTop: 2 }}>
              {Number.isFinite(health.emergencyMonths) ? health.emergencyMonths.toFixed(2) : '∞'} / {finance.emergencyFundGoalMonths} мес. обязательных расходов
            </div>
          </Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {finance.savingsGoals.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Финансовых целей пока нет.</div></Card>}
          {finance.savingsGoals.map(g => {
            const done = g.saved >= g.target;
            return (
              <Card key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{g.type === 'emergency' ? '🛡️ ' : ''}{g.title} {done && '✅'}</div>
                  <button className="lrpg-btn" onClick={() => deleteSavingsGoal(g.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Bar value={g.saved} max={g.target || 1} color={COLORS.teal} />
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{g.saved} / {g.target}</div>
                </div>
                {!done && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input className="lrpg-input" type="number" min={0} placeholder="Отложить сумму" value={saveAmounts[g.id] || ''}
                      onChange={e => setSaveAmounts(v => ({ ...v, [g.id]: Number(e.target.value) }))} />
                    <button className="lrpg-btn" onClick={() => { contributeSaving(g.id, saveAmounts[g.id] || 0); setSaveAmounts(v => ({ ...v, [g.id]: '' })); }}
                      style={{ background: COLORS.teal, color: '#0B1F1D', borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                      Отложить
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function computeTraits(state) {
  const traits = [];
  const completedEntries = state.chronicle.filter(c => c.type === 'QUEST_COMPLETED');
  if (completedEntries.length >= 5) {
    const morning = completedEntries.filter(c => new Date(c.ts).getHours() < 10).length;
    const evening = completedEntries.filter(c => new Date(c.ts).getHours() >= 20).length;
    if (morning / completedEntries.length > 0.6) {
      traits.push({ label: 'Жаворонок', desc: 'Чаще всего выполняешь квесты до 10 утра', icon: Sunrise });
    } else if (evening / completedEntries.length > 0.6) {
      traits.push({ label: 'Полуночник', desc: 'Пик активности после 20:00', icon: Sunset });
    }
  }
  const consistency30 = computeConsistencyForRange(state.chronicle, 30);
  if (consistency30 >= 75) traits.push({ label: 'Дисциплинированный', desc: `Consistency за 30 дней: ${consistency30}/100`, icon: ShieldCheck });
  const bestHabitStreak = state.habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  if (bestHabitStreak >= 14) traits.push({ label: 'Неудержимый', desc: `Лучший streak привычки: ${bestHabitStreak} дн.`, icon: Flame });
  const completedGoals = state.goals.filter(g => g.progress >= 100).length;
  if (completedGoals >= 3) traits.push({ label: 'Целеустремлённый', desc: `Завершённых целей: ${completedGoals}`, icon: Target });
  if (state.unlockedAchievements.length >= 5) traits.push({ label: 'Коллекционер', desc: `Разблокировано достижений: ${state.unlockedAchievements.length}`, icon: Trophy });
  const fm = financeMonthSummary(state.finance);
  if (fm.income > 0 && fm.cashFlow >= 0) {
    traits.push({ label: 'Экономный', desc: 'Бюджет не уходит в минус', icon: PiggyBank });
  }
  return traits;
}

function buildWeeklyRecapData(state) {
  const weekStart = Date.now() - 7 * 86400000;
  const chron = state.chronicle.filter(c => c.ts >= weekStart);
  const questsCompleted = chron.filter(c => c.type === 'QUEST_COMPLETED').length;
  const questsSkipped = chron.filter(c => c.type === 'QUEST_SKIPPED').length;
  const levelUps = chron.filter(c => c.type === 'LEVEL_UP').length;
  const achievements = chron.filter(c => c.type === 'ACHIEVEMENT_UNLOCKED').length;
  const rewardsBought = chron.filter(c => c.type === 'REWARD_PURCHASED').length;

  const weekAgoSnapshot = [...state.statsHistory].reverse().find(h => new Date(h.date + 'T00:00:00').getTime() <= weekStart) || state.statsHistory[0];
  let mostImproved = null;
  if (weekAgoSnapshot) {
    STATS_DEF.forEach(s => {
      const delta = state.stats[s.key] - weekAgoSnapshot.stats[s.key];
      if (!mostImproved || delta > mostImproved.delta) mostImproved = { stat: s.label, delta };
    });
  }
  const carExpenses = state.garage.expenses.filter(e => e.ts >= weekStart).reduce((s, e) => s + e.amount, 0);
  const taxiIncome = state.finance.taxi.orders.filter(o => o.ts >= weekStart).reduce((s, o) => s + (o.net ?? o.amount), 0);

  return { questsCompleted, questsSkipped, levelUps, achievements, rewardsBought, mostImproved, carExpenses, taxiIncome };
}

function buildMentorTips(state) {
  const tips = [];
  const active = state.quests.filter(q => q.status === 'active');
  const weakest = STATS_DEF.reduce((min, s) => state.stats[s.key] < state.stats[min.key] ? s : min, STATS_DEF[0]);
  const cutoff = Date.now() - 14 * 86400000;
  let completed = 0, skipped = 0;
  state.chronicle.forEach(c => {
    if (c.ts < cutoff) return;
    if (c.type === 'QUEST_COMPLETED') completed += 1;
    if (c.type === 'QUEST_SKIPPED' && !c.text.includes('уважительная')) skipped += 1;
  });
  const consistency = Math.max(0, Math.min(100, Math.round(50 + (completed - skipped) * 3)));

  const todayCheckin = state.dailyCheckin && state.dailyCheckin.date === todayStr() ? state.dailyCheckin : null;
  const energy = computeEnergy(todayCheckin);
  if (energy < 30) tips.push(`Энергия низкая (${energy}/100). Возможно, стоит включить Recovery Mode и снизить нагрузку на пару дней.`);
  tips.push(`Слабее всего сейчас ${STAT_LABEL[weakest.key]} (${state.stats[weakest.key]}/100). Добавь туда квест или привычку — это самый быстрый рост.`);
  if (active.length === 0) tips.push('Активных квестов нет. Начни с одного маленького — движение важнее масштаба.');
  if (active.length > 8) tips.push(`Активных квестов много (${active.length}). Раздели по приоритету и не пытайся закрыть всё за день.`);
  if (consistency < 40) tips.push('Consistency за последние 14 дней просела. Не гонись за идеалом — важна просто регулярность, а не количество за раз.');
  const aliveDebts = state.finance.debts.filter(d => d.remaining > 0);
  if (aliveDebts.length > 0) {
    const top = sortDebts(aliveDebts, state.finance.strategy)[0];
    tips.push(`Главный Debt Boss сейчас — «${top.title}» (осталось ${top.remaining}). Стратегия ${state.finance.strategy} — держись её, не распыляйся.`);
  }
  const closeGoals = state.goals.filter(g => g.progress < 100 && g.deadline && (new Date(g.deadline) - Date.now()) / 86400000 < 7 && (new Date(g.deadline) - Date.now()) > 0);
  if (closeGoals.length > 0) tips.push(`Цель «${closeGoals[0].title}» близка к дедлайну — стоит проверить темп сегодня.`);
  const streakHabit = state.habits.find(h => h.streakCurrent >= 3);
  if (streakHabit) tips.push(`Привычка «${streakHabit.title}» держится ${streakHabit.streakCurrent} дней подряд — не разрывай серию ради одного дня.`);
  if (state.coins > 300) tips.push(`Накопилось ${state.coins} Coins. Загляни в Reward Shop — небольшая награда сейчас поддержит мотивацию.`);
  const todayStart = new Date(todayStr() + 'T00:00:00').getTime();
  const todayOrdersSum = state.finance.taxi.orders.filter(o => o.ts >= todayStart).reduce((s, o) => s + (o.net ?? o.amount), 0);
  const target = state.finance.taxi.dailyTarget;
  if (target > 0 && todayOrdersSum < target) {
    tips.push(`До дневной цели по заказам осталось ${target - todayOrdersSum}. Ещё пара поездок — и цель закрыта.`);
  } else if (target > 0 && todayOrdersSum >= target) {
    tips.push('Дневная цель по заказам уже выполнена — можно спокойно закругляться или бить личный рекорд.');
  }
  if (tips.length < 2) tips.push('Всё выглядит сбалансированно. Продолжай в том же темпе и не забывай про отдых.');
  return tips;
}

function MentorTab({ state }) {
  const [seed, setSeed] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastUserText, setLastUserText] = useState(null);
  const allTips = buildMentorTips(state);
  const shown = React.useMemo(() => {
    const arr = [...allTips];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, state.chronicle.length, state.quests.length, state.habits.length, state.finance.debts.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLastUserText(text);
    setSending(true);
    setLastError(null);
    try {
      const contextBlock = `[Контекст персонажа]\n${buildContextSummary(state)}\n\n[Сообщение]\n${text}`;
      const apiMessages = [
        ...nextMessages.slice(-8, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: contextBlock },
      ];
      const reply = await callClaudeAPIWithRetry(MENTOR_SYSTEM_PROMPT, apiMessages);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      const errMsg = friendlyAIError(e);
      setLastError(errMsg);
      const fallback = buildMentorTips(state)[0];
      setMessages(m => [...m, { role: 'assistant', content: `[офлайн-режим] ${fallback}` }]);
    } finally {
      setSending(false);
    }
  }

  async function retryLast() {
    if (!lastUserText || sending) return;
    setSending(true);
    setLastError(null);
    try {
      const priorHistory = messages.slice(0, -2);
      const contextBlock = `[Контекст персонажа]\n${buildContextSummary(state)}\n\n[Сообщение]\n${lastUserText}`;
      const apiMessages = [
        ...priorHistory.slice(-8).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: contextBlock },
      ];
      const reply = await callClaudeAPIWithRetry(MENTOR_SYSTEM_PROMPT, apiMessages);
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: reply }]);
    } catch (e) {
      setLastError(friendlyAIError(e));
    } finally {
      setSending(false);
    }
  }

  async function handleWeeklyRecap() {
    if (sending) return;
    const recap = buildWeeklyRecapData(state);
    const userVisibleText = '📊 Разбор недели';
    const nextMessages = [...messages, { role: 'user', content: userVisibleText }];
    setMessages(nextMessages);
    setLastUserText(userVisibleText);
    setSending(true);
    setLastError(null);
    const recapBlock = [
      `Квестов выполнено за неделю: ${recap.questsCompleted}`,
      `Квестов пропущено: ${recap.questsSkipped}`,
      `Повышений уровня: ${recap.levelUps}`,
      `Достижений получено: ${recap.achievements}`,
      `Покупок в магазине: ${recap.rewardsBought}`,
      recap.mostImproved ? `Больше всего вырос стат: ${recap.mostImproved.stat} (+${recap.mostImproved.delta})` : null,
      `Расходы на машину за неделю: ${recap.carExpenses}`,
      `Доход с такси за неделю: ${recap.taxiIncome}`,
    ].filter(Boolean).join('\n');
    try {
      const contextBlock = `[Контекст персонажа]\n${buildContextSummary(state)}\n\n[Данные за неделю]\n${recapBlock}\n\n[Запрос]\nСделай короткий разбор моей недели по этим данным — что получилось хорошо, на что обратить внимание, 3-5 предложений.`;
      const apiMessages = [
        ...nextMessages.slice(-8, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: contextBlock },
      ];
      const reply = await callClaudeAPIWithRetry(MENTOR_SYSTEM_PROMPT, apiMessages);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setLastError(friendlyAIError(e));
      const fallback = `За неделю: ${recap.questsCompleted} квестов выполнено, ${recap.questsSkipped} пропущено${recap.levelUps ? `, ${recap.levelUps} ур. получено` : ''}${recap.mostImproved ? `. Сильнее всего вырос ${recap.mostImproved.stat} (+${recap.mostImproved.delta})` : ''}${recap.achievements ? `. Достижений: ${recap.achievements}` : ''}.`;
      setMessages(m => [...m, { role: 'assistant', content: `[офлайн-режим] ${fallback}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.violetSoft}, ${COLORS.bgCard})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MessageCircle size={16} color={COLORS.violet} />
          <span style={{ fontWeight: 700, fontSize: 13 }}>{MENTOR_NAME}</span>
          <Tag color={COLORS.violet}>{MENTOR_TITLE}</Tag>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>Пиши что угодно — наставник видит твои реальные статы, квесты и долги. История чата не сохраняется между открытиями.</div>
      </Card>

      {shown.map((t, i) => (
        <Card key={i}><div style={{ fontSize: 13, lineHeight: 1.5 }}>{t}</div></Card>
      ))}
      <button className="lrpg-btn" onClick={() => setSeed(s => s + 1)} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12 }}>
        Другие быстрые советы
      </button>
      <button className="lrpg-btn" disabled={sending} onClick={handleWeeklyRecap} style={{ background: COLORS.bgCardAlt, color: COLORS.gold, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: sending ? 0.6 : 1 }}>
        <BarChart3 size={13} /> Разбор недели
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%',
            background: m.role === 'user' ? COLORS.violet : COLORS.bgCard,
            color: m.role === 'user' ? '#100E1C' : COLORS.text,
            border: m.role === 'user' ? 'none' : `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
          }}>
            {m.content}
          </div>
        ))}
        {sending && <div style={{ fontSize: 12, color: COLORS.textMuted }}>Ментор думает...</div>}
        {lastError && !sending && (
          <div style={{ fontSize: 10, color: COLORS.crimson, background: COLORS.crimsonSoft, borderRadius: 8, padding: '6px 10px' }}>
            <div>AI недоступен — переключился на офлайн-совет. Техническая причина: {lastError}</div>
            <button className="lrpg-btn" onClick={retryLast} style={{ marginTop: 6, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 700 }}>
              Повторить запрос к AI
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, position: 'sticky', bottom: 0 }}>
        <input className="lrpg-input" placeholder="Напиши наставнику..." value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
        <button className="lrpg-btn" disabled={sending || !input.trim()} onClick={handleSend} style={{
          background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '0 16px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sending || !input.trim() ? 0.5 : 1,
        }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function WorldTab({ stats, unlockedAchievements, state }) {
  const traits = computeTraits(state);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {traits.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color={COLORS.teal} /> Черты характера
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {traits.map(t => {
              const TIcon = t.icon;
              return (
                <Card key={t.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <TIcon size={14} color={COLORS.teal} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>{t.desc}</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapIcon size={15} color={COLORS.violet} /> World Map
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TERRITORIES.map(t => {
            const val = stats[t.stat] || 0;
            const level = Math.min(TERRITORY_STAGES.length, Math.floor(val / 20) + 1);
            return (
              <Card key={t.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: COLORS.gold, fontWeight: 700 }}>{TERRITORY_STAGES[level - 1]}</span>
                </div>
                <Bar value={val} color={COLORS.violet} />
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={15} color={COLORS.gold} /> Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.includes(a.id);
            const color = RARITY_COLOR[a.rarity];
            return (
              <Card key={a.id} style={{ opacity: unlocked ? 1 : 0.4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{unlocked ? a.label : '???'}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{unlocked ? a.desc : 'Скрыто до получения'}</div>
                  </div>
                  <Tag color={color}>{a.rarity}</Tag>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventsTab({ logLifeEvent, customEvents, addCustomEvent, deleteCustomEvent }) {
  const [lastLogged, setLastLogged] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStat, setNewStat] = useState(STATS_DEF[0].key);
  const [newDelta, setNewDelta] = useState(2);
  const [addSecond, setAddSecond] = useState(false);
  const [newStat2, setNewStat2] = useState(STATS_DEF[1].key);
  const [newDelta2, setNewDelta2] = useState(-2);

  const netDelta = e => e.effects.reduce((sum, ef) => sum + ef.delta, 0);
  const normalizedCustom = customEvents.map(e => ({
    ...e, icon: Sparkles, color: netDelta(e) >= 0 ? COLORS.teal : COLORS.crimson, isCustom: true,
  }));
  const positive = [...LIFE_EVENTS.filter(e => e.effects.some(ef => ef.delta > 0)), ...normalizedCustom.filter(e => netDelta(e) >= 0)];
  const negative = [...LIFE_EVENTS.filter(e => e.effects.every(ef => ef.delta < 0)), ...normalizedCustom.filter(e => netDelta(e) < 0)];

  function handleLog(event) {
    logLifeEvent(event);
    setLastLogged(event.id);
    setTimeout(() => setLastLogged(null), 1500);
  }

  function handleCreate() {
    const effects = [{ stat: newStat, delta: newDelta }];
    if (addSecond && newStat2 !== newStat) effects.push({ stat: newStat2, delta: newDelta2 });
    addCustomEvent(newTitle.trim(), effects);
    setNewTitle('');
    setAddSecond(false);
    setShowAddEvent(false);
  }

  function renderGrid(events) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {events.map(e => {
          const Icon = e.icon;
          const desc = e.effects.map(ef => `${ef.delta > 0 ? '+' : ''}${ef.delta} ${STAT_LABEL[ef.stat]}`).join(', ');
          return (
            <div key={e.id} style={{ position: 'relative' }}>
              <button className="lrpg-btn" onClick={() => handleLog(e)} style={{
                width: '100%', background: lastLogged === e.id ? e.color : COLORS.bgCard, border: `1px solid ${e.color}55`,
                borderRadius: 12, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
                transition: 'background 0.2s',
              }}>
                <Icon size={16} color={lastLogged === e.id ? '#100E1C' : e.color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: lastLogged === e.id ? '#100E1C' : COLORS.text }}>{e.label}</span>
                <span style={{ fontSize: 10, color: lastLogged === e.id ? '#100E1C' : COLORS.textMuted }}>{desc}</span>
              </button>
              {e.isCustom && (
                <button className="lrpg-btn" onClick={() => deleteCustomEvent(e.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(11,10,18,0.6)', borderRadius: 999, padding: 3 }}>
                  <X size={10} color={COLORS.textMuted} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
          Отметь, что произошло сегодня — статы обновятся сразу же. Это не квесты, а честная фиксация реальных событий.
        </div>
      </Card>

      <button className="lrpg-btn" onClick={() => setShowAddEvent(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.bgCardAlt, color: COLORS.violet, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: '9px 0', fontWeight: 700, fontSize: 12 }}>
        <Plus size={14} /> Добавить своё событие
      </button>
      {showAddEvent && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="lrpg-input" placeholder="Название события" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>Стат 1:</div>
            <select className="lrpg-input" value={newStat} onChange={e => setNewStat(e.target.value)}>
              {STATS_DEF.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              {[-3, -2, -1, 1, 2, 3].map(d => (
                <button key={d} className="lrpg-btn" onClick={() => setNewDelta(d)} style={{
                  flex: 1, background: newDelta === d ? (d > 0 ? COLORS.teal : COLORS.crimson) : COLORS.bgCardAlt,
                  color: newDelta === d ? '#100E1C' : COLORS.textMuted, borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 700,
                }}>{d > 0 ? `+${d}` : d}</button>
              ))}
            </div>

            {!addSecond && (
              <button className="lrpg-btn" onClick={() => setAddSecond(true)} style={{
                background: 'none', color: COLORS.teal, border: `1px dashed ${COLORS.teal}55`, borderRadius: 6,
                padding: '6px 0', fontSize: 11, fontWeight: 600,
              }}>
                + Добавить второй стат (например: энергетик — Physical -2 и Discipline -1)
              </button>
            )}
            {addSecond && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Стат 2:</div>
                  <button className="lrpg-btn" onClick={() => setAddSecond(false)} style={{ background: 'none' }}><X size={12} color={COLORS.textMuted} /></button>
                </div>
                <select className="lrpg-input" value={newStat2} onChange={e => setNewStat2(e.target.value)}>
                  {STATS_DEF.filter(s => s.key !== newStat).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[-3, -2, -1, 1, 2, 3].map(d => (
                    <button key={d} className="lrpg-btn" onClick={() => setNewDelta2(d)} style={{
                      flex: 1, background: newDelta2 === d ? (d > 0 ? COLORS.teal : COLORS.crimson) : COLORS.bgCardAlt,
                      color: newDelta2 === d ? '#100E1C' : COLORS.textMuted, borderRadius: 6, padding: '6px 0', fontSize: 12, fontWeight: 700,
                    }}>{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
              </>
            )}

            <button className="lrpg-btn" disabled={!newTitle.trim()} onClick={handleCreate}
              style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: newTitle.trim() ? 1 : 0.5 }}>
              Создать
            </button>
          </div>
        </Card>
      )}

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COLORS.teal }}>Полезное</div>
        {renderGrid(positive)}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COLORS.crimson }}>Вредное</div>
        {renderGrid(negative)}
      </div>
    </div>
  );
}

function resizeImageFile(file, maxDim = 700, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image load failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function normalizeYoutube(yt) {
  const y = yt || {};
  return {
    channels: (y.channels || []).map(c => ({
      status: c.status || 'ACTIVE', niche: c.niche || '', language: c.language || 'ru', format: c.format || 'mixed', ...c,
    })),
    activeChannelId: y.activeChannelId || ((y.channels || [])[0] && y.channels[0].id) || null,
    goals: y.goals || [],
    ideas: y.ideas || [],
    contentItems: y.contentItems || [],
    settings: { defaultPlanningPeriod: 7, defaultPublishFrequency: 3, ...(y.settings || {}) },
  };
}

const YT_STAGES = [
  { key: 'IDEAS', label: 'Идеи' },
  { key: 'SCRIPT', label: 'Сценарий' },
  { key: 'PRODUCTION', label: 'Съёмка' },
  { key: 'EDITING', label: 'Монтаж' },
  { key: 'THUMBNAIL', label: 'Превью' },
  { key: 'READY', label: 'Готово' },
  { key: 'PUBLISHED', label: 'Вышло' },
];

function YouTubeHQ({ youtube, quests, addYouTubeChannel, updateYouTubeStats, deleteYouTubeChannel, addYouTubeQuest, patchYoutube, onCreatorAction }) {
  const yt = normalizeYoutube(youtube);
  const [sub, setSub] = useState('overview');
  const [busy, setBusy] = useState(null);
  const [aiText, setAiText] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const tabs = [
    { key: 'overview', label: 'Обзор' },
    { key: 'channels', label: 'Каналы' },
    { key: 'desk', label: 'AI Desk' },
    { key: 'plan', label: 'План' },
    { key: 'ideas', label: 'Идеи' },
    { key: 'analytics', label: 'Аналитика' },
    { key: 'goals', label: 'Цели' },
  ];
  const ch = yt.channels.find(c => c.id === yt.activeChannelId) || yt.channels[0];
  const pipeline = YT_STAGES.map(s => ({ ...s, n: yt.contentItems.filter(i => i.status === s.key).length }));
  const todayHint = yt.contentItems.find(i => i.status !== 'PUBLISHED') || yt.ideas.find(i => i.status !== 'archived');

  async function askAI(task, userMsg) {
    setBusy(task); setAiText('');
    try {
      const ctx = ch ? `Канал: ${ch.name}, подп. ${ch.subs ?? 'н/д'}, просмотры ${ch.views ?? 'н/д'}, видео ${ch.videos ?? 'н/д'}, ниша ${ch.niche || 'не указана'}.` : 'Каналов нет.';
      const text = await callClaudeAPIWithRetry(
        'Ты YouTube-наставник в Life RPG. Не выдумывай метрики, которых нет. Пиши по-русски коротко.',
        [{ role: 'user', content: ctx + '\n' + userMsg }],
        2,
        { taskType: task }
      );
      setAiText(text);
    } catch (e) {
      setAiText('AI временно недоступен. Резервный режим: выбери одну идею и напиши hook из 1 предложения.');
    }
    setBusy(null);
  }

  function addIdea(src = 'manual', title) {
    const t = (title || ideaTitle).trim();
    if (!t) return;
    patchYoutube(y => ({
      ...y,
      ideas: [...y.ideas, { id: uid(), channelId: ch?.id || null, title: t, hook: '', concept: '', format: 'Long', difficulty: 'Normal', status: 'new', createdAt: Date.now(), source: src }],
    }));
    setIdeaTitle('');
    onCreatorAction && onCreatorAction('idea', t);
  }

  function ideaToPlan(idea) {
    patchYoutube(y => ({
      ...y,
      ideas: y.ideas.map(i => i.id === idea.id ? { ...i, status: 'planned' } : i),
      contentItems: [...y.contentItems, {
        id: uid(), channelId: idea.channelId, ideaId: idea.id, title: idea.title, format: idea.format || 'Long',
        status: 'SCRIPT', publishAt: null, notes: idea.hook || '', createdAt: Date.now(),
      }],
    }));
    onCreatorAction && onCreatorAction('plan', idea.title);
  }

  function advanceItem(item) {
    const idx = YT_STAGES.findIndex(s => s.key === item.status);
    const next = YT_STAGES[Math.min(idx + 1, YT_STAGES.length - 1)].key;
    patchYoutube(y => ({ ...y, contentItems: y.contentItems.map(i => i.id === item.id ? { ...i, status: next, updatedAt: Date.now() } : i) }));
    onCreatorAction && onCreatorAction('stage', item.title);
  }

  function addGoal() {
    if (!ch) return;
    const target = Number(window.prompt('Цель по подписчикам', String((ch.subs || 0) + 1000))) || 0;
    if (!target) return;
    patchYoutube(y => ({
      ...y,
      goals: [...y.goals, { id: uid(), channelId: ch.id, title: `${target} подписчиков`, metric: 'subs', target, current: ch.subs || 0, status: 'active' }],
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>YouTube HQ</div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {tabs.map(t => (
          <button key={t.key} className="lrpg-btn" onClick={() => setSub(t.key)} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: sub === t.key ? 'linear-gradient(180deg,#8B85FF,#6C63FF)' : 'rgba(255,255,255,0.04)',
            color: sub === t.key ? '#fff' : COLORS.textMuted,
          }}>{t.label}</button>
        ))}
      </div>

      {sub === 'overview' && (
        <>
          <HudCard style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Каналов {yt.channels.length} · в работе {yt.contentItems.filter(i => i.status !== 'PUBLISHED').length}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 6 }}>Что делать сегодня</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{todayHint ? `Продолжи: «${todayHint.title}»` : 'Добавь идею или канал — появится задача дня.'}</div>
            <button className="lrpg-btn lrpg-cta" style={{ marginTop: 8 }} onClick={() => askAI('YOUTUBE_PLAN', 'Дай одну главную задачу на сегодня и почему.')}>Попросить AI помочь</button>
          </HudCard>
          <HudCard style={{ padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>PIPELINE</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {pipeline.map(s => (
                <div key={s.key} style={{ minWidth: 64, textAlign: 'center', padding: 6, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </HudCard>
          {yt.goals[0] && (
            <HudCard style={{ padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Текущая цель</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{yt.goals[0].title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{yt.goals[0].current || 0} / {yt.goals[0].target}</div>
            </HudCard>
          )}
          {aiText && <Card><div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{aiText}</div></Card>}
        </>
      )}

      {sub === 'channels' && (
        <YouTubeTab youtube={youtube} quests={quests} addYouTubeChannel={addYouTubeChannel} updateYouTubeStats={updateYouTubeStats} deleteYouTubeChannel={deleteYouTubeChannel} addYouTubeQuest={addYouTubeQuest} />
      )}

      {sub === 'desk' && (
        <>
          <button className="lrpg-btn lrpg-cta" disabled={!!busy} onClick={() => askAI('CONTENT_IDEAS', 'Предложи 5 идей роликов: название, hook, формат, почему подходит. Без выдуманной аналитики.')}>{busy === 'CONTENT_IDEAS' ? 'Думаю…' : 'Придумать идеи'}</button>
          <button className="lrpg-btn" onClick={() => askAI('CONTENT_PLAN', 'Собери план на 7 дней: дата, тема, формат, этап. Если данных мало — так и скажи.')} style={{ background: COLORS.bgCardAlt, borderRadius: 999, padding: '8px 12px' }}>{busy === 'CONTENT_PLAN' ? 'Думаю…' : 'Контент-план на 7 дней'}</button>
          <button className="lrpg-btn" onClick={() => askAI('YOUTUBE_ANALYTICS', 'По доступным цифрам (только реальные из контекста) скажи что проверить дальше. Не выдумывай CTR/удержание.')} style={{ background: COLORS.bgCardAlt, borderRadius: 999, padding: '8px 12px' }}>{busy === 'YOUTUBE_ANALYTICS' ? 'Думаю…' : 'Разобрать ситуацию'}</button>
          {aiText && (
            <Card>
              <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{aiText}</div>
              <button className="lrpg-btn" style={{ marginTop: 8, background: COLORS.violetSoft, borderRadius: 8, padding: '6px 10px', fontSize: 11 }} onClick={() => addIdea('ai', (aiText.split('\n').find(l => l.trim()) || 'Идея AI').slice(0, 80))}>Добавить первую строку в идеи</button>
            </Card>
          )}
        </>
      )}

      {sub === 'ideas' && (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="lrpg-input" placeholder="Новая идея" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)} />
            <button className="lrpg-btn lrpg-cta" onClick={() => addIdea()}>+</button>
          </div>
          {yt.ideas.length === 0 && <Card><div style={{ fontSize: 12, color: COLORS.textMuted }}>Идей нет. Добавь вручную или через AI Desk.</div></Card>}
          {yt.ideas.map(idea => (
            <Card key={idea.id}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{idea.title}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{idea.format} · {idea.source}</div>
              <button className="lrpg-btn" onClick={() => ideaToPlan(idea)} style={{ marginTop: 6, background: COLORS.violetSoft, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>В план</button>
            </Card>
          ))}
        </>
      )}

      {sub === 'plan' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {YT_STAGES.map(s => (
            <div key={s.key} style={{ minWidth: 150, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, marginBottom: 6 }}>{s.label}</div>
              {yt.contentItems.filter(i => i.status === s.key).map(item => (
                <div key={item.id} style={{ background: COLORS.bgCard, borderRadius: 8, padding: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{item.title}</div>
                  {s.key !== 'PUBLISHED' && <button className="lrpg-btn" onClick={() => advanceItem(item)} style={{ marginTop: 4, fontSize: 10, background: COLORS.violetSoft, borderRadius: 8, padding: '4px 8px' }}>Дальше</button>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {sub === 'analytics' && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Только реальные данные канала</div>
          {!ch && <div style={{ fontSize: 12, color: COLORS.textMuted }}>Нет канала.</div>}
          {ch && (
            <>
              <div style={{ fontSize: 13 }}>{ch.name}: {fmtNum(ch.subs)} подп. · {fmtNum(ch.views)} просм. · {fmtNum(ch.videos)} видео</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>CTR, удержание и доход не показываем — API их сейчас не отдаёт. Не выдумываем.</div>
              <button className="lrpg-btn lrpg-cta" style={{ marginTop: 8 }} onClick={() => askAI('YOUTUBE_ANALYTICS', `Подписчики ${ch.subs}, просмотры ${ch.views}, видео ${ch.videos}. Что проверить? Без выдуманных цифр.`)}>Объяснить аналитику</button>
            </>
          )}
          {aiText && <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 8 }}>{aiText}</div>}
        </Card>
      )}

      {sub === 'goals' && (
        <>
          <button className="lrpg-btn lrpg-cta" onClick={addGoal}>Новая цель по подписчикам</button>
          {yt.goals.length === 0 && <Card><div style={{ fontSize: 12, color: COLORS.textMuted }}>Целей нет. Это план, не обещание алгоритма.</div></Card>}
          {yt.goals.map(g => (
            <Card key={g.id}>
              <div style={{ fontWeight: 700 }}>{g.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{g.current || 0} / {g.target} · {g.metric}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}


function YouTubeTab({ youtube, quests, addYouTubeChannel, updateYouTubeStats, deleteYouTubeChannel, addYouTubeQuest }) {
  const [showAdd, setShowAdd] = useState(false);
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [manual, setManual] = useState({});   // {channelId: {subs,views,videos}}
  const [questDraft, setQuestDraft] = useState({}); // {channelId: {metric,delta}}

  async function addAuto() {
    if (!handle.trim()) return;
    setBusy('add'); setError(null);
    try {
      const s = await fetchYouTubeStats({ handle: handle.trim() });
      addYouTubeChannel({ name: s.name, handle: s.handle, channelId: s.channelId, thumb: s.thumb, subs: s.subs, views: s.views, videos: s.videos });
      setHandle(''); setShowAdd(false);
    } catch (e) { setError(`Авто-поиск не сработал (${e.message}). Добавь канал вручную.`); }
    setBusy(null);
  }
  function addManual() {
    if (!name.trim()) return;
    addYouTubeChannel({ name: name.trim() });
    setName(''); setShowAdd(false);
  }
  async function sync(ch) {
    setBusy(ch.id); setError(null);
    try {
      const s = await fetchYouTubeStats({ channelId: ch.channelId });
      updateYouTubeStats(ch.id, { subs: s.subs, views: s.views, videos: s.videos });
    } catch (e) { setError(`Не обновилось: ${e.message}`); }
    setBusy(null);
  }
  function saveManual(ch) {
    const m = manual[ch.id] || {};
    const stats = {};
    YT_METRICS.forEach(x => { if (m[x.key] !== undefined && m[x.key] !== '') stats[x.key] = Number(m[x.key]) || 0; });
    if (Object.keys(stats).length === 0) return;
    updateYouTubeStats(ch.id, stats);
    setManual(v => ({ ...v, [ch.id]: {} }));
  }
  function weekDelta(ch, metric) {
    const h = ch.history || [];
    if (h.length < 2) return null;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const base = [...h].reverse().find(x => x.date <= weekAgo) || h[0];
    if (base[metric] == null || ch[metric] == null) return null;
    return ch[metric] - base[metric];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button className="lrpg-btn" onClick={() => setShowAdd(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLORS.crimson, color: '#fff', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13 }}>
        <Plus size={16} /> Добавить канал
      </button>

      {showAdd && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="lrpg-input" placeholder="@handle канала (например @mychannel)" value={handle} onChange={e => setHandle(e.target.value)} />
            <button className="lrpg-btn" disabled={!handle.trim() || busy === 'add'} onClick={addAuto}
              style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: handle.trim() ? 1 : 0.5 }}>
              {busy === 'add' ? 'Ищу...' : 'Найти и добавить'}
            </button>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>или без API — введи название и вноси цифры сам</div>
            <input className="lrpg-input" placeholder="Название канала" value={name} onChange={e => setName(e.target.value)} />
            <button className="lrpg-btn" disabled={!name.trim()} onClick={addManual}
              style={{ background: COLORS.bgCardAlt, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: name.trim() ? 1 : 0.5 }}>
              Добавить вручную
            </button>
          </div>
        </Card>
      )}

      {error && <div style={{ fontSize: 11, color: COLORS.crimson, background: COLORS.crimsonSoft, borderRadius: 8, padding: '6px 10px' }}>{error}</div>}
      {youtube.channels.length === 0 && !showAdd && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Каналов пока нет. Добавь первый — по нему появятся квесты на рост.</div></Card>}

      {youtube.channels.map(ch => {
        const chQuests = quests.filter(q => q.ytLink && q.ytLink.channelRef === ch.id && q.status === 'active');
        const qd = questDraft[ch.id] || { metric: 'subs', delta: '' };
        const chart = (ch.history || []).filter(h => h.subs != null).map(h => ({ date: h.date.slice(5), Подписчики: h.subs }));
        return (
          <Card key={ch.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                {ch.thumb
                  ? <img src={ch.thumb} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: COLORS.crimsonSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Youtube size={18} color={COLORS.crimson} /></div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>{ch.handle || 'вручную'}{ch.lastSync ? ` · обновлено ${fmtTime(ch.lastSync)}` : ''}</div>
                </div>
              </div>
              <button className="lrpg-btn" onClick={() => deleteYouTubeChannel(ch.id)} style={{ background: 'none' }}><Trash2 size={14} color={COLORS.textMuted} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
              {YT_METRICS.map(m => {
                const d = weekDelta(ch, m.key);
                return (
                  <div key={m.key} style={{ background: COLORS.bgCardAlt, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtNum(ch[m.key])}</div>
                    <div style={{ fontSize: 9, color: COLORS.textMuted }}>{m.label}</div>
                    {d !== null && d !== 0 && <div style={{ fontSize: 9, color: d > 0 ? COLORS.teal : COLORS.crimson, marginTop: 2 }}>{d > 0 ? '+' : ''}{fmtNum(d)} за неделю</div>}
                  </div>
                );
              })}
            </div>

            {chart.length > 1 && (
              <div style={{ height: 100, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={34} />
                    <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: 11 }} labelStyle={{ color: COLORS.text }} />
                    <Line type="monotone" dataKey="Подписчики" stroke={COLORS.crimson} strokeWidth={2} dot={{ r: 2, fill: COLORS.crimson }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {ch.channelId && (
              <button className="lrpg-btn" disabled={busy === ch.id} onClick={() => sync(ch)}
                style={{ marginTop: 10, width: '100%', background: COLORS.bgCardAlt, color: COLORS.teal, border: `1px solid ${COLORS.teal}55`, borderRadius: 8, padding: '7px 0', fontWeight: 700, fontSize: 12, opacity: busy === ch.id ? 0.6 : 1 }}>
                {busy === ch.id ? 'Обновляю...' : 'Обновить статистику'}
              </button>
            )}

            <div style={{ fontSize: 10, color: COLORS.textMuted, margin: '10px 0 4px' }}>Внести цифры вручную:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {YT_METRICS.map(m => (
                <input key={m.key} className="lrpg-input" type="number" min={0} placeholder={m.label}
                  value={(manual[ch.id] || {})[m.key] ?? ''} style={{ fontSize: 11, padding: '6px 6px' }}
                  onChange={e => setManual(v => ({ ...v, [ch.id]: { ...(v[ch.id] || {}), [m.key]: e.target.value } }))} />
              ))}
              <button className="lrpg-btn" onClick={() => saveManual(ch)} style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '0 12px', fontWeight: 700, fontSize: 12 }}><Check size={14} /></button>
            </div>

            <div style={{ fontSize: 10, color: COLORS.textMuted, margin: '12px 0 4px' }}>Новый квест по каналу:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="lrpg-input" value={qd.metric} style={{ fontSize: 11, padding: '6px 6px' }}
                onChange={e => setQuestDraft(v => ({ ...v, [ch.id]: { ...qd, metric: e.target.value } }))}>
                {YT_METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <input className="lrpg-input" type="number" min={1} placeholder="+сколько" value={qd.delta} style={{ fontSize: 11, padding: '6px 6px' }}
                onChange={e => setQuestDraft(v => ({ ...v, [ch.id]: { ...qd, delta: e.target.value } }))} />
              <button className="lrpg-btn" disabled={!Number(qd.delta)} onClick={() => { addYouTubeQuest(ch, qd.metric, Number(qd.delta)); setQuestDraft(v => ({ ...v, [ch.id]: { metric: qd.metric, delta: '' } })); }}
                style={{ background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '0 12px', fontWeight: 700, fontSize: 12, opacity: Number(qd.delta) ? 1 : 0.5 }}>Создать</button>
            </div>

            {chQuests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {chQuests.map(q => {
                  const cur = ytValue({ channels: [ch] }, q.ytLink);
                  return (
                    <div key={q.id} style={{ background: COLORS.bgCardAlt, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{q.title}</div>
                      <div style={{ marginTop: 6 }}><Bar value={Math.max(0, cur)} max={q.ytLink.target} color={COLORS.crimson} /></div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{fmtNum(cur)} / {fmtNum(q.ytLink.target)} · +{q.xp} XP</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function GarageTab({ garage, debts, taxiOrders, setGaragePhoto, setGarageName, setGarageCarDebtId, setGarageCurrentValue, addGarageExpense, deleteGarageExpense }) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('fuel');
  const [uploading, setUploading] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const carExpensesThisMonth = garage.expenses.filter(e => e.ts >= monthStart).reduce((s, e) => s + e.amount, 0);
  const carExpensesTotal = garage.expenses.reduce((s, e) => s + e.amount, 0);
  const taxiIncomeThisMonth = taxiOrders.filter(o => o.ts >= monthStart).reduce((s, o) => s + (o.net ?? o.amount), 0);
  const linkedDebt = debts.find(d => d.id === garage.carDebtId);
  const monthlyLoanPayment = linkedDebt && linkedDebt.remaining > 0 ? linkedDebt.monthlyPayment : 0;
  const netThisMonth = taxiIncomeThisMonth - carExpensesThisMonth - monthlyLoanPayment;

  async function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setGaragePhoto(dataUrl);
    } catch (err) { /* ignore */ }
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 10, overflow: 'hidden', background: COLORS.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {garage.photo ? (
            <img src={garage.photo} alt="Машина" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: COLORS.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Car size={28} />
              <span style={{ fontSize: 12 }}>Фото не добавлено</span>
            </div>
          )}
          <label className="lrpg-btn" style={{
            position: 'absolute', bottom: 8, right: 8, background: 'rgba(11,10,18,0.75)', color: COLORS.gold,
            borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Camera size={13} /> {uploading ? 'Загрузка...' : garage.photo ? 'Заменить фото' : 'Добавить фото'}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
        </div>
        <input className="lrpg-input" style={{ marginTop: 10 }} value={garage.name} onChange={e => setGarageName(e.target.value)} placeholder="Название/модель машины" />
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Прибыль от машины (этот месяц)</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: COLORS.textMuted }}>Доход с заказов</span><span style={{ color: COLORS.teal }}>+{taxiIncomeThisMonth}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: COLORS.textMuted }}>Расходы на машину</span><span style={{ color: COLORS.crimson }}>-{carExpensesThisMonth}</span>
        </div>
        {linkedDebt && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: COLORS.textMuted }}>Автокредит «{linkedDebt.title}»</span><span style={{ color: COLORS.crimson }}>-{Math.round(monthlyLoanPayment)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 13, fontWeight: 700 }}>
          <span>Итого</span><span style={{ color: netThisMonth >= 0 ? COLORS.teal : COLORS.crimson }}>{netThisMonth}</span>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Автокредит (если есть)</div>
        <select className="lrpg-input" value={garage.carDebtId || ''} onChange={e => setGarageCarDebtId(e.target.value)}>
          <option value="">Не привязан</option>
          {debts.map(d => <option key={d.id} value={d.id}>{d.title}{d.remaining <= 0 ? ' (погашен)' : ''}</option>)}
        </select>
        {debts.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>Долгов пока нет — добавь автокредит во вкладке «Финансы», если он есть.</div>}
      </Card>

      <Card>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Ориентировочная рыночная стоимость машины (для Net Worth)</div>
        <input className="lrpg-input" type="number" min={0} defaultValue={garage.currentValue || ''} placeholder="напр. 12000000"
          onBlur={e => setGarageCurrentValue(e.target.value)} />
      </Card>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Расходы на машину (всего: {carExpensesTotal})</span>
          <button className="lrpg-btn" onClick={() => setShowAddExpense(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={13} />Добавить</button>
        </div>
        {showAddExpense && (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="lrpg-input" placeholder="Что оплатил" value={expTitle} onChange={e => setExpTitle(e.target.value)} />
              <input className="lrpg-input" type="number" min={0} placeholder="Сумма" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
              <select className="lrpg-input" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                {GARAGE_EXPENSE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <button className="lrpg-btn" disabled={!expTitle.trim() || !expAmount} onClick={() => {
                addGarageExpense(expTitle.trim(), Number(expAmount) || 0, expCategory);
                setExpTitle(''); setExpAmount(''); setShowAddExpense(false);
              }} style={{ background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, opacity: expTitle.trim() && expAmount ? 1 : 0.5 }}>
                Добавить
              </button>
            </div>
          </Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {garage.expenses.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Расходов пока нет.</div></Card>}
          {garage.expenses.slice().reverse().map(e => {
            const cat = GARAGE_EXPENSE_CATEGORIES.find(c => c.key === e.category) || GARAGE_EXPENSE_CATEGORIES[4];
            const CatIcon = cat.icon;
            return (
              <Card key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CatIcon size={14} color={COLORS.violet} />
                  <div>
                    <div style={{ fontSize: 13 }}>{e.title}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{cat.label}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.crimson }}>-{e.amount}</span>
                  <button className="lrpg-btn" onClick={() => deleteGarageExpense(e.id)} style={{ background: 'none' }}><Trash2 size={13} color={COLORS.textMuted} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TelegramDiagnosticsCard() {
  const [diag, setDiag] = useState(null);
  function refresh() {
    try {
      if (typeof window !== 'undefined' && typeof window.__telegramStorageDiagnostics === 'function') {
        setDiag(window.__telegramStorageDiagnostics());
      }
    } catch (e) { /* ignore */ }
  }
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000); // подхватываем данные о последнем сохранении, пока карточка открыта
    return () => clearInterval(t);
  }, []);
  if (!diag) return null;
  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
      <span style={{ color: COLORS.textMuted }}>{label}</span>
      <span style={{ color: COLORS.text, fontWeight: 600 }}>{String(value)}</span>
    </div>
  );
  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertCircle size={13} color={COLORS.violet} /> Диагностика Telegram-клиента
      </div>
      {row('Telegram.WebApp найден', diag.present)}
      {diag.present && row('Версия клиента (Bot API)', diag.version)}
      {diag.present && row('Платформа', diag.platform)}
      {diag.present && row('initData есть (реальный запуск)', diag.hasInitData)}
      {diag.present && row('Объект CloudStorage есть', diag.cloudStorageObjectPresent)}
      {diag.present && row('Версия поддерживает CloudStorage (6.9+)', diag.versionSupportsCloud)}
      {diag.lastSave && row('Размер последнего сохранения', `${diag.lastSave.bytes} симв.${diag.lastSave.gz ? ` → ${diag.lastSave.compressedBytes} сжато` : ' (без сжатия)'} / ${diag.lastSave.chunks} чанков`)}
      {diag.lastSave && row('Статус последнего сохранения', diag.lastSave.status)}
      {diag.lastSave && diag.lastSave.ms != null && row('Время сохранения', `${(diag.lastSave.ms / 1000).toFixed(1)}с`)}
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>Пришли скриншот этой карточки, если облачное сохранение всё ещё не работает — по этим данным можно точно понять причину.</div>
    </Card>
  );
}

function SaveManagerCard({ state, importSaveData, onExported }) {
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);

  const exportJson = JSON.stringify(state);

  function handleCopy() {
    try {
      navigator.clipboard.writeText(exportJson).then(() => {
        setCopied(true);
        onExported();
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (e) { /* clipboard may be blocked — manual selection is the fallback */ }
  }

  function handleDownload() {
    onExported();
    try {
      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-rpg-save-${todayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { /* download may be blocked — copy/textarea is the fallback */ }
  }

  function confirmImport() {
    const res = importSaveData(importText.trim());
    setImportResult(res);
    setConfirmingImport(false);
    if (res.ok) { setImportText(''); setShowImport(false); }
  }

  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Download size={14} color={COLORS.gold} /> Экспорт / Импорт сохранения
      </div>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>
        Самый надёжный способ не потерять прогресс — экспортируй его перед закрытием и импортируй при следующем открытии.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="lrpg-btn" onClick={() => setShowExport(v => !v)} style={{ flex: 1, background: COLORS.bgCardAlt, color: COLORS.gold, border: `1px solid ${COLORS.gold}55`, borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Download size={12} /> Экспорт
        </button>
        <button className="lrpg-btn" onClick={() => setShowImport(v => !v)} style={{ flex: 1, background: COLORS.bgCardAlt, color: COLORS.violet, border: `1px solid ${COLORS.violet}55`, borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Upload size={12} /> Импорт
        </button>
      </div>

      {showExport && (
        <div style={{ marginTop: 10 }}>
          <textarea readOnly value={exportJson} onClick={e => e.target.select()} className="lrpg-input" style={{ height: 90, fontSize: 10, fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="lrpg-btn" onClick={handleCopy} style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Copy size={11} /> {copied ? 'Скопировано!' : 'Скопировать'}
            </button>
            <button className="lrpg-btn" onClick={handleDownload} style={{ flex: 1, background: COLORS.bgCardAlt, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 700 }}>Скачать файл</button>
          </div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>Если кнопки не сработают — тапни по тексту выше, он выделится целиком, скопируй вручную.</div>
        </div>
      )}

      {showImport && (
        <div style={{ marginTop: 10 }}>
          <textarea placeholder="Вставь сюда сохранённый JSON..." value={importText} onChange={e => setImportText(e.target.value)} className="lrpg-input" style={{ height: 90, fontSize: 10, fontFamily: 'monospace' }} />
          <button className="lrpg-btn" disabled={!importText.trim()} onClick={() => setConfirmingImport(true)} style={{ marginTop: 6, width: '100%', background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 700, opacity: importText.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <ClipboardPaste size={12} /> Загрузить
          </button>
          {confirmingImport && (
            <div style={{ marginTop: 6, background: COLORS.crimsonSoft, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 11, color: COLORS.text }}>Это заменит весь текущий прогресс данными из вставленного сохранения. Продолжить?</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="lrpg-btn" onClick={confirmImport} style={{ flex: 1, background: COLORS.crimson, color: '#fff', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 700 }}>Да, заменить</button>
                <button className="lrpg-btn" onClick={() => setConfirmingImport(false)} style={{ flex: 1, background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 6, padding: '6px 0', fontSize: 11, border: `1px solid ${COLORS.border}` }}>Отмена</button>
              </div>
            </div>
          )}
          {importResult && !importResult.ok && <div style={{ fontSize: 11, color: COLORS.crimson, marginTop: 6 }}>Не получилось: {importResult.error}</div>}
        </div>
      )}
      {importResult && importResult.ok && <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 8 }}>Сохранение успешно загружено!</div>}
    </Card>
  );
}

function AICenterCard() {
  const [health, setHealth] = useState(() => loadAIHealth());
  const [pinging, setPinging] = useState(false);
  const [configured, setConfigured] = useState([]);
  async function ping() {
    setPinging(true);
    try {
      const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ping: true }) });
      const data = await r.json();
      setConfigured(data.configured || []);
      const h = loadAIHealth();
      h.lastPing = Date.now();
      h.configured = data.configured || [];
      saveAIHealth(h);
      setHealth(h);
    } catch {
      setConfigured([]);
    }
    setPinging(false);
  }
  const stats = health.stats || { requests: 0, success: 0, fallback: 0, errors: 0 };
  const log = health.log || [];
  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>🤖 AI CORE</div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Система AI активна. Ключи только на сервере. Если все провайдеры молчат — игра берёт резервный режим.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {AI_PROVIDERS_META.map(p => {
          const on = configured.includes(p.id) || (health.configured || []).includes(p.id);
          return (
            <span key={p.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: on ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)', color: on ? COLORS.green : COLORS.textMuted }}>
              {on ? '🟢' : '⚪'} {p.name}
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
        Сегодня: {stats.requests} запросов · {stats.success} ок · {stats.fallback} fallback · {stats.errors} ошибок
      </div>
      <button className="lrpg-btn lrpg-cta" disabled={pinging} onClick={ping} style={{ width: '100%', marginBottom: 8 }}>
        {pinging ? 'Проверяю…' : 'Проверить AI'}
      </button>
      {log.slice(0, 6).map((e, i) => (
        <div key={i} style={{ fontSize: 10, color: COLORS.textMuted, display: 'flex', gap: 6, padding: '3px 0', borderTop: `1px solid ${COLORS.border}` }}>
          <span>{e.ok ? '✅' : '❌'}</span>
          <span>{e.taskType}</span>
          <span>{e.provider}</span>
          <span>{e.latency ? `${e.latency} ms` : ''}</span>
          {e.error ? <span style={{ color: COLORS.crimson }}>{String(e.error).slice(0, 80)}</span> : null}
        </div>
      ))}
    </Card>
  );
}

function SettingsTab({ character, setCharacterName, resetAllData, availableHoursPerWeek, setAvailableHours, storageStatus, storageError, lastSavedAt, localBackupOk, state, importSaveData, saveNow, onExported, difficultyMode, setDifficultyMode }) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSaveResult, setManualSaveResult] = useState(null); // 'ok' | 'fail' | null

  async function handleManualSave() {
    setManualSaving(true);
    setManualSaveResult(null);
    const ok = await saveNow();
    setManualSaveResult(ok ? 'ok' : 'fail');
    setManualSaving(false);
    setTimeout(() => setManualSaveResult(null), 2500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
        <SettingsIcon size={15} color={COLORS.violet} /> Настройки
      </div>
      <Card style={{ border: `1px solid ${storageStatus === 'ok' ? COLORS.teal + '55' : localBackupOk ? COLORS.gold + '55' : COLORS.crimson + '55'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
          <Save size={14} color={storageStatus === 'ok' ? COLORS.teal : localBackupOk ? COLORS.gold : COLORS.crimson} />
          Облачное автосохранение: {storageStatus === 'ok' ? 'работает' : storageStatus === 'unavailable' ? 'недоступно' : storageStatus === 'checking' ? 'проверяю...' : 'ошибка'}
        </div>
        {storageStatus !== 'ok' && (
          <div style={{ fontSize: 11, marginTop: 4, color: localBackupOk ? COLORS.gold : COLORS.crimson }}>
            {localBackupOk ? 'Но локальная копия на этом устройстве сохраняется исправно — прогресс не потеряется при перезаходе здесь же.' : 'И локальную копию тоже не удалось сохранить — используй Экспорт прямо сейчас.'}
          </div>
        )}
        {lastSavedAt && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Последнее сохранение: {fmtTime(lastSavedAt)}</div>}
        {storageError && <div style={{ fontSize: 10, color: COLORS.crimson, marginTop: 4 }}>{storageError}</div>}
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>В облако синхронизируются уровень/квесты/цели/настройки. Полная история операций такси и финансов хранится только на этом устройстве — переноси её на новое устройство через Экспорт/Импорт.</div>
        {storageStatus !== 'ok' && (
          <div style={{ fontSize: 10, color: COLORS.gold, marginTop: 6 }}>Пока это так — используй Экспорт/Импорт ниже, это работает независимо от автосохранения.</div>
        )}
        <button className="lrpg-btn" disabled={manualSaving} onClick={handleManualSave} style={{
          marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: manualSaveResult === 'ok' ? COLORS.teal : manualSaveResult === 'fail' ? COLORS.crimson : COLORS.bgCardAlt,
          color: manualSaveResult ? '#100E1C' : COLORS.text, border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12, opacity: manualSaving ? 0.6 : 1,
        }}>
          <Save size={13} /> {manualSaving ? 'Сохраняю...' : manualSaveResult === 'ok' ? 'Сохранено!' : manualSaveResult === 'fail' ? 'Не вышло — используй Экспорт' : 'Сохранить сейчас'}
        </button>
      </Card>
      <TelegramDiagnosticsCard />
      <SaveManagerCard state={state} importSaveData={importSaveData} onExported={onExported} />
      <Card>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Имя персонажа</div>
        <input className="lrpg-input" value={character.name} onChange={e => setCharacterName(e.target.value || 'Герой')} />
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Swords size={14} color={COLORS.crimson} /> Режим сложности</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Влияет на штрафы за пропуск и на то, как быстро проседает награда за повторение одного и того же квеста (anti-farm).</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(DIFFICULTY_SETTINGS).map(([key, cfg]) => (
            <button key={key} className="lrpg-btn" onClick={() => setDifficultyMode(key)} style={{
              flex: 1, background: difficultyMode === key ? COLORS.crimson : COLORS.bgCardAlt,
              color: difficultyMode === key ? '#fff' : COLORS.textMuted, borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700,
            }}>{cfg.label}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><CalendarClock size={14} color={COLORS.teal} /> Свободное время в неделю</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Используется в Goal Engine и Reality Check, чтобы AI и предупреждения о конфликте целей учитывали реальный ресурс, а не только дедлайны.</div>
        <input className="lrpg-input" type="number" min={0} placeholder="Часов в неделю" value={availableHoursPerWeek || ''} onChange={e => setAvailableHours(Number(e.target.value) || null)} />
      </Card>

      <FeedbackSettingsCard />
      <AICenterCard />
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Интеграции</div>
        {['Apple Health / шаги', 'Экранное время', 'Календарь'].map(x => (
          <div key={x} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
            <span>{x}</span><span style={{ color: COLORS.textMuted }}>Не подключено</span>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: COLORS.crimson }}>Опасная зона</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Полный сброс прогресса — персонаж, статы, квесты, финансы, всё. Отменить нельзя.</div>
        {!confirmingReset ? (
          <button className="lrpg-btn" onClick={() => setConfirmingReset(true)} style={{ background: COLORS.bgCardAlt, color: COLORS.crimson, border: `1px solid ${COLORS.crimson}55`, borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RotateCcw size={14} /> Сбросить прогресс
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lrpg-btn" onClick={() => { resetAllData(); setConfirmingReset(false); }} style={{ flex: 1, background: COLORS.crimson, color: '#fff', borderRadius: 8, padding: '9px 0', fontWeight: 700, fontSize: 13 }}>Да, сбросить всё</button>
            <button className="lrpg-btn" onClick={() => setConfirmingReset(false)} style={{ background: COLORS.bgCardAlt, color: COLORS.textMuted, borderRadius: 8, padding: '9px 14px', fontSize: 13, border: `1px solid ${COLORS.border}` }}>Отмена</button>
          </div>
        )}
      </Card>

      <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Life RPG v{APP_VERSION}</div>
    </div>
  );
}

function CharacterAvatar({ tierIndex = 3, height = 190 }) {
  const src = CHARACTER_SPRITE_LIST[Math.max(0, Math.min(CHARACTER_SPRITE_LIST.length - 1, tierIndex))];
  return (
    <img src={src} alt="Персонаж" draggable={false} style={{
      height, maxWidth: 170, margin: '0 auto', display: 'block', objectFit: 'contain',
      filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.5))', WebkitUserSelect: 'none', userSelect: 'none',
    }} />
  );
}


function PreviewWeightCard({ heightCm, startWeight }) {
  const [previewWeight, setPreviewWeight] = useState(Math.round(startWeight));
  const bmi = previewWeight / Math.pow(heightCm / 100, 2);
  const tier = bmiTier(bmi);
  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Предпросмотр веса</div>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Просто чтобы посмотреть, как будет выглядеть силуэт — вес не сохраняется, пока не нажмёшь «Записать» выше.</div>
      <CharacterAvatar tierIndex={tier.index} color={tier.color} height={160} />
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: tier.color, marginTop: 4 }}>{tier.label} · {previewWeight} кг · BMI {bmi.toFixed(1)}</div>
      <input type="range" min={40} max={150} value={previewWeight} onChange={e => setPreviewWeight(Number(e.target.value))} style={{ width: '100%', marginTop: 10, accentColor: tier.color }} />
    </Card>
  );
}

// Раздел «Калории»: дневник питания с оценкой по тексту/фото через AI (тот же бесплатный
// провайдер, что и остальной AI в приложении) и обычным ручным вводом.
function NutritionCard({ target, currentWeight, nutrition, addFoodEntry, deleteFoodEntry }) {
  const [mode, setMode] = useState(null); // null | 'text' | 'manual'
  const [textInput, setTextInput] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // {title,calories,protein,fat,carbs,source}
  const [photoPreview, setPhotoPreview] = useState(null); // dataUrl, ждёт комментария перед отправкой в AI
  const [photoNote, setPhotoNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const today = todayStr();
  const todayEntries = nutrition.entries.filter(e => e.date === today).sort((a, b) => b.ts - a.ts);
  const eaten = todayEntries.reduce((s, e) => s + e.calories, 0);
  const remaining = target - eaten;
  const pct = Math.min(100, Math.round((eaten / target) * 100));
  const over = eaten > target;

  const macroT = macroTargets(target, currentWeight);
  const eatenProtein = todayEntries.reduce((s, e) => s + (e.protein || 0), 0);
  const eatenFat = todayEntries.reduce((s, e) => s + (e.fat || 0), 0);
  const eatenCarbs = todayEntries.reduce((s, e) => s + (e.carbs || 0), 0);

  // История по месяцам — итог по каждому прошедшему дню (не сегодня), сгруппировано по YYYY-MM.
  const dailyTotals = {};
  nutrition.entries.forEach(e => {
    if (e.date === today) return;
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.calories;
  });
  const historyByMonth = {};
  Object.entries(dailyTotals).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, cal]) => {
    const mk = date.slice(0, 7);
    if (!historyByMonth[mk]) historyByMonth[mk] = [];
    historyByMonth[mk].push({ date, cal });
  });

  async function handleTextSubmit() {
    if (!textInput.trim()) return;
    setLoading(true); setError(null);
    try {
      const spec = await estimateFoodFromText(textInput.trim());
      setPending({ ...spec, source: 'text' });
      setTextInput(''); setMode(null);
    } catch (e) { setError(friendlyAIError(e)); }
    setLoading(false);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeImageFile(file, 700, 0.75);
      setPhotoPreview(dataUrl);
      setPhotoNote('');
    } catch (err) { setError(friendlyAIError(err)); }
    e.target.value = '';
  }

  async function handlePhotoSubmit() {
    if (!photoPreview) return;
    setLoading(true); setError(null);
    try {
      const spec = await estimateFoodFromPhoto(photoPreview, photoNote.trim());
      setPending({ ...spec, source: 'photo' });
      setPhotoPreview(null); setPhotoNote('');
    } catch (err) { setError(friendlyAIError(err)); }
    setLoading(false);
  }

  function confirmPending() {
    if (!pending) return;
    addFoodEntry(pending);
    setPending(null);
  }

  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Utensils size={14} color={COLORS.gold} /> Калории сегодня
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: COLORS.textMuted }}>Съедено</span>
        <span style={{ fontWeight: 700 }}>{eaten} / {target} ккал</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: COLORS.bgCardAlt, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? COLORS.crimson : COLORS.teal, transition: 'width .3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        <span>{over ? 'Перебор' : 'Осталось'}</span>
        <span style={{ color: over ? COLORS.crimson : COLORS.gold }}>{over ? `+${-remaining}` : remaining} ккал</span>
      </div>

      {macroT && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            ['Белки', eatenProtein, macroT.proteinG, COLORS.teal],
            ['Жиры', eatenFat, macroT.fatG, COLORS.gold],
            ['Углеводы', eatenCarbs, macroT.carbsG, COLORS.violet],
          ].map(([label, val, tgt, color]) => (
            <div key={label} style={{ background: COLORS.bgCardAlt, borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ fontSize: 9, color: COLORS.textMuted }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{val}<span style={{ color: COLORS.textMuted, fontWeight: 400 }}>/{tgt} г</span></div>
              <div style={{ height: 4, borderRadius: 99, background: COLORS.bgCard, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.round((val / tgt) * 100))}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: COLORS.crimson, marginTop: 8 }}>{error}</div>}

      {pending && (
        <div style={{ marginTop: 10, background: COLORS.bgCardAlt, borderRadius: 10, padding: 10, border: `1px solid ${COLORS.violet}55` }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6 }}>{pending.source === 'photo' ? '📷 Оценка по фото' : '📝 Оценка по описанию'} — проверь и поправь при необходимости:</div>
          <input className="lrpg-input" value={pending.title} onChange={e => setPending(p => ({ ...p, title: e.target.value }))} style={{ marginBottom: 6 }} />
          <input className="lrpg-input" type="number" min={0} value={pending.calories || ''} onChange={e => setPending(p => ({ ...p, calories: e.target.value === '' ? 0 : Number(e.target.value) }))} style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Б {pending.protein} г · Ж {pending.fat} г · У {pending.carbs} г</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lrpg-btn" onClick={confirmPending} style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12 }}>Добавить в дневник</button>
            <button className="lrpg-btn" onClick={() => setPending(null)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: COLORS.textMuted }}><X size={13} /></button>
          </div>
        </div>
      )}

      {!pending && photoPreview && (
        <div style={{ marginTop: 10, background: COLORS.bgCardAlt, borderRadius: 10, padding: 10, border: `1px solid ${COLORS.violet}55` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <img src={photoPreview} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <textarea className="lrpg-input" placeholder="Комментарий (необязательно): без риса, маленькая порция, две штуки..."
              value={photoNote} onChange={e => setPhotoNote(e.target.value)} rows={3} style={{ resize: 'none', fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lrpg-btn" disabled={loading} onClick={handlePhotoSubmit}
              style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Смотрю...' : 'Посчитать (AI)'}
            </button>
            <button className="lrpg-btn" onClick={() => { setPhotoPreview(null); setPhotoNote(''); }} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: COLORS.textMuted }}><X size={13} /></button>
          </div>
        </div>
      )}

      {!pending && !photoPreview && mode === 'text' && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input className="lrpg-input" placeholder="Что съел? напр. «плов, большая тарелка»" value={textInput} onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()} autoFocus />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lrpg-btn" disabled={loading || !textInput.trim()} onClick={handleTextSubmit}
              style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12, opacity: loading || !textInput.trim() ? 0.5 : 1 }}>
              {loading ? 'Считаю...' : 'Посчитать (AI)'}
            </button>
            <button className="lrpg-btn" onClick={() => { setMode(null); setTextInput(''); }} style={{ background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: COLORS.textMuted }}><X size={13} /></button>
          </div>
        </div>
      )}

      {!pending && !photoPreview && mode === 'manual' && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input className="lrpg-input" placeholder="Название" value={manualTitle} onChange={e => setManualTitle(e.target.value)} autoFocus />
          <input className="lrpg-input" type="number" min={0} placeholder="Калорий" value={manualCal} onChange={e => setManualCal(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="lrpg-btn" disabled={!manualTitle.trim() || !manualCal} onClick={() => {
              addFoodEntry({ title: manualTitle.trim(), calories: manualCal, source: 'manual' });
              setManualTitle(''); setManualCal(''); setMode(null);
            }} style={{ flex: 1, background: COLORS.gold, color: '#1a1305', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 12, opacity: (!manualTitle.trim() || !manualCal) ? 0.5 : 1 }}>
              Добавить
            </button>
            <button className="lrpg-btn" onClick={() => setMode(null)} style={{ background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, color: COLORS.textMuted }}><X size={13} /></button>
          </div>
        </div>
      )}

      {!pending && !photoPreview && !mode && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button className="lrpg-btn" onClick={() => setMode('text')} style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <MessageCircle size={13} /> Текстом
          </button>
          <label className="lrpg-btn" style={{ flex: 1, background: COLORS.violet, color: '#100E1C', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Camera size={13} /> Фото
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
          <button className="lrpg-btn" onClick={() => setMode('manual')} style={{ flex: 1, background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: 11 }}>
            Вручную
          </button>
        </div>
      )}

      {todayEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
          {todayEntries.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, background: COLORS.bgCardAlt, borderRadius: 8, padding: '6px 8px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                {e.source === 'photo' ? '📷 ' : e.source === 'text' ? '📝 ' : ''}{e.title}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>{e.calories} ккал</b>
                <button className="lrpg-btn" onClick={() => deleteFoodEntry(e.id)} style={{ background: 'none' }}><Trash2 size={12} color={COLORS.textMuted} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {Object.keys(historyByMonth).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div onClick={() => setShowHistory(v => !v)} style={{ fontSize: 11, color: COLORS.violet, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            {showHistory ? 'Скрыть историю' : 'История по месяцам'} <ChevronRight size={12} style={{ transform: showHistory ? 'rotate(90deg)' : 'none' }} />
          </div>
          {showHistory && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(historyByMonth).map(([mk, days]) => {
                const avg = Math.round(days.reduce((s, d) => s + d.cal, 0) / days.length);
                const overDays = days.filter(d => d.cal > target).length;
                return (
                  <div key={mk}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: COLORS.text }}>{monthRuLabel(mk)}</span>
                      <span>в среднем {avg} ккал/день · перебор {overDays}/{days.length} дн.</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                      {days.map(d => (
                        <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, background: COLORS.bgCardAlt, borderRadius: 6, padding: '4px 8px' }}>
                          <span style={{ color: COLORS.textMuted }}>{d.date.slice(8, 10)}.{d.date.slice(5, 7)}</span>
                          <span style={{ fontWeight: 700, color: d.cal > target ? COLORS.crimson : COLORS.teal }}>{d.cal} ккал</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 10 }}>
        AI оценивает калории приблизительно по описанию/фото — сверяй с этикеткой, если важна точность. Уложился в лимит за день — +1 Discipline на следующий день, перебор — −1.
      </div>
    </Card>
  );
}

function BodyTab({ body, setBodyProfile, logWeight, nutrition, addFoodEntry, deleteFoodEntry }) {
  const [weightInput, setWeightInput] = useState('');
  const sortedLog = [...body.weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sortedLog.length ? sortedLog[sortedLog.length - 1].weight : null;
  const firstWeight = sortedLog.length ? sortedLog[0].weight : null;
  const bmi = currentWeight && body.heightCm ? currentWeight / Math.pow(body.heightCm / 100, 2) : null;
  const tier = bmiTier(bmi);
  const targetBmi = body.targetWeight && body.heightCm ? body.targetWeight / Math.pow(body.heightCm / 100, 2) : null;
  const targetTier = bmiTier(targetBmi);
  const bmr = currentWeight && body.heightCm ? computeBMR(currentWeight, body.heightCm, body.age, body.sex) : null;
  const tdee = bmr ? computeTDEE(bmr, body.activityLevel) : null;
  const floor = body.sex === 'female' ? 1200 : 1500;
  const calTarget = dailyCalorieTarget(body, currentWeight);
  const deficitCalories = calTarget ? calTarget.calories : null;
  const calTargetLabel = calTarget && calTarget.mode === 'bulk' ? 'Для набора веса' : calTarget && calTarget.mode === 'maintain' ? 'Для поддержания веса' : 'Для снижения веса';
  const delta = currentWeight && firstWeight ? +(currentWeight - firstWeight).toFixed(1) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        {tier ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <CharacterAvatar tierIndex={tier.index} color={tier.color} height={targetTier ? 150 : 190} />
              <div style={{ fontSize: 12, fontWeight: 700, color: tier.color, marginTop: 4 }}>{tier.label}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>Сейчас · {currentWeight} кг</div>
            </div>
            {targetTier && targetTier.index !== tier.index && (
              <div style={{ textAlign: 'center', opacity: 0.8 }}>
                <CharacterAvatar tierIndex={targetTier.index} color={COLORS.textMuted} height={150} />
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginTop: 4 }}>{targetTier.label}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>Цель · {body.targetWeight} кг</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: '20px 0' }}>Заполни рост и вес — тут появится твой аватар</div>
        )}
      </Card>

      {body.heightCm && (
        <PreviewWeightCard heightCm={body.heightCm} startWeight={currentWeight || 70} />
      )}

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Профиль тела</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="lrpg-input" type="number" min={0} placeholder="Рост, см" value={body.heightCm || ''} onChange={e => setBodyProfile({ heightCm: Number(e.target.value) || null })} />
          <input className="lrpg-input" type="number" min={0} placeholder="Возраст" value={body.age || ''} onChange={e => setBodyProfile({ age: Number(e.target.value) || null })} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button className="lrpg-btn" onClick={() => setBodyProfile({ sex: 'male' })} style={{ flex: 1, background: body.sex === 'male' ? COLORS.violet : COLORS.bgCardAlt, color: body.sex === 'male' ? '#100E1C' : COLORS.textMuted, borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700 }}>Мужчина</button>
          <button className="lrpg-btn" onClick={() => setBodyProfile({ sex: 'female' })} style={{ flex: 1, background: body.sex === 'female' ? COLORS.violet : COLORS.bgCardAlt, color: body.sex === 'female' ? '#100E1C' : COLORS.textMuted, borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700 }}>Женщина</button>
        </div>
        <select className="lrpg-input" value={body.activityLevel} onChange={e => setBodyProfile({ activityLevel: e.target.value })} style={{ marginBottom: 8 }}>
          {ACTIVITY_LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
        <input className="lrpg-input" type="number" min={0} placeholder="Целевой вес, кг (необязательно)" value={body.targetWeight || ''} onChange={e => setBodyProfile({ targetWeight: Number(e.target.value) || null })} />
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Scale size={14} color={COLORS.teal} /> Вес</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="lrpg-input" type="number" min={0} step={0.1} placeholder="Текущий вес, кг" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
          <button className="lrpg-btn" disabled={!weightInput} onClick={() => { logWeight(Number(weightInput)); setWeightInput(''); }}
            style={{ background: COLORS.teal, color: '#0B1F1D', borderRadius: 8, padding: '0 16px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', opacity: weightInput ? 1 : 0.5 }}>
            Записать
          </button>
        </div>
        {currentWeight && (
          <div style={{ marginTop: 10, fontSize: 12, color: COLORS.textMuted }}>
            Сейчас: <b style={{ color: COLORS.text }}>{currentWeight} кг</b>
            {delta !== null && delta !== 0 && <span style={{ color: delta < 0 ? COLORS.teal : COLORS.crimson }}> ({delta > 0 ? '+' : ''}{delta} кг с начала отслеживания)</span>}
          </div>
        )}
        {sortedLog.length > 1 && (
          <div style={{ height: 120, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedLog.slice(-30).map(w => ({ date: w.date.slice(5), weight: w.weight }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={30} />
                <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: 11 }} labelStyle={{ color: COLORS.text }} />
                <Line type="monotone" dataKey="weight" stroke={COLORS.teal} strokeWidth={2} dot={{ r: 2, fill: COLORS.teal }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {bmi && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Ruler size={14} color={COLORS.violet} /> BMI и калории</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: COLORS.textMuted }}>BMI</span><span>{bmi.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: COLORS.textMuted }}>Базовый расход (BMR)</span><span>{Math.round(bmr)} ккал</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: COLORS.textMuted }}>Расход с активностью (TDEE)</span><span>{Math.round(tdee)} ккал</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 13, fontWeight: 700 }}>
            <span>{calTargetLabel}</span><span style={{ color: COLORS.teal }}>~{deficitCalories} ккал/день</span>
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
            Ориентир на ~0.5 кг в неделю, с защитным минимумом {floor} ккал. Это не медицинская рекомендация — при хронических состояниях сверься с врачом или диетологом.
          </div>
        </Card>
      )}

      {deficitCalories && (
        <NutritionCard target={deficitCalories} currentWeight={currentWeight} nutrition={nutrition} addFoodEntry={addFoodEntry} deleteFoodEntry={deleteFoodEntry} />
      )}
    </div>
  );
}

function CalendarTab({ playLog, firstOpenedAt }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const log = Array.isArray(playLog) ? playLog : [];
  const totalDays = log.length;
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const monthIdx = viewDate.getMonth();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  // Понедельник — первый день недели
  const firstWeekday = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const playedSet = new Set(log.filter(d => d.startsWith(monthKey)));
  const todayKey = todayStr();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Текущая серия дней подряд (streak) — считаем от сегодня назад
  let streak = 0;
  {
    let cur = new Date();
    while (true) {
      const key = cur.toISOString().slice(0, 10);
      if (log.includes(key)) { streak++; cur.setDate(cur.getDate() - 1); } else break;
    }
  }

  const daysSinceStart = firstOpenedAt ? Math.max(1, Math.floor((Date.now() - firstOpenedAt) / 86400000) + 1) : totalDays;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Card style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.gold }}>{totalDays}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>дней сыграно</div>
        </Card>
        <Card style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.teal }}>{streak}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>дней подряд сейчас</div>
        </Card>
        <Card style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.violet }}>{daysSinceStart}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>дней с начала игры</div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button className="lrpg-btn" onClick={() => setMonthOffset(o => o - 1)} style={{ background: 'none', padding: 4 }}><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} color={COLORS.textMuted} /></button>
          <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{viewDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
          <button className="lrpg-btn" onClick={() => setMonthOffset(o => Math.min(0, o + 1))} disabled={monthOffset === 0} style={{ background: 'none', padding: 4, opacity: monthOffset === 0 ? 0.3 : 1 }}><ChevronRight size={16} color={COLORS.textMuted} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 10, color: COLORS.textMuted, marginBottom: 4, textAlign: 'center' }}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(w => <span key={w}>{w}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            const key = `${monthKey}-${String(d).padStart(2, '0')}`;
            const played = playedSet.has(key);
            const isToday = key === todayKey;
            return (
              <div key={idx} style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, fontSize: 11, fontWeight: isToday ? 700 : 500,
                background: played ? COLORS.teal + '33' : 'transparent',
                border: isToday ? `1px solid ${COLORS.gold}` : played ? `1px solid ${COLORS.teal}55` : `1px solid ${COLORS.border}`,
                color: played ? COLORS.teal : COLORS.textMuted,
              }}>{d}</div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.teal + '33', border: `1px solid ${COLORS.teal}55`, display: 'inline-block' }} /> — день, когда заходил в игру
        </div>
      </Card>
    </div>
  );
}

function InventoryTab({ stats, unlockedSets }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Backpack size={16} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Экипировка растёт вместе с твоими реальными статами — не нужно ничего фармить отдельно, просто развивайся.</span>
        </div>
      </Card>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={15} color={COLORS.gold} /> Комплекты
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ITEM_SETS.map(set => {
            const unlocked = unlockedSets.includes(set.key);
            const piecesReady = set.slots.filter(slotKey => {
              const slotDef = EQUIPMENT_SLOTS.find(s => s.slot === slotKey);
              return EQUIPMENT_TIERS.indexOf(equipmentTierFor(stats[slotDef.statKey])) >= 2;
            }).length;
            return (
              <Card key={set.key} style={{ opacity: unlocked ? 1 : 0.75, border: unlocked ? `1px solid ${COLORS.gold}55` : `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: unlocked ? COLORS.gold : COLORS.text }}>{unlocked ? '🛡️ ' : ''}{set.label}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{piecesReady}/{set.slots.length} на Mastery+</span>
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
                  {set.slots.map(slotKey => EQUIPMENT_SLOTS.find(s => s.slot === slotKey).label).join(' · ')}
                </div>
                {unlocked ? (
                  <div style={{ fontSize: 10, color: COLORS.teal, marginTop: 6 }}>Собран! Бонус уже получен.</div>
                ) : (
                  <div style={{ marginTop: 6 }}><Bar value={piecesReady} max={set.slots.length} color={COLORS.gold} /></div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {EQUIPMENT_SLOTS.map(slot => {
          const Icon = slot.icon;
          const value = stats[slot.statKey];
          const tier = equipmentTierFor(value);
          const nextTier = EQUIPMENT_TIERS[EQUIPMENT_TIERS.indexOf(tier) + 1];
          const color = RARITY_COLOR[tier.rarity];
          return (
            <Card key={slot.slot} style={{ border: `1px solid ${color}55` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon size={16} color={color} />
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{slot.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>{slot.theme} {tier.roman}</div>
              <Tag color={color}>{tier.rarity}</Tag>
              <div style={{ marginTop: 8 }}>
                <Bar value={value} color={color} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
                {nextTier ? `До уровня ${nextTier.roman}: ${STAT_LABEL[slot.statKey]} ${nextTier.min}` : 'Максимальный уровень'}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
