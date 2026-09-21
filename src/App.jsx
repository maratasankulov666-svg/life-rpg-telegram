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
import React, { useState, useEffect } from 'react';
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
  Swords, Search, BarChart3,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const APP_VERSION = '12.0';

const COLORS = {
  bg: '#0B0A12',
  bgCard: '#14121F',
  bgCardAlt: '#191629',
  border: '#2E2A42',
  borderLight: '#3A3552',
  text: '#EDE7D9',
  textMuted: '#8A8496',
  gold: '#D9A54B',
  goldSoft: 'rgba(217,165,75,0.15)',
  teal: '#4FD1C5',
  tealSoft: 'rgba(79,209,197,0.15)',
  crimson: '#C24444',
  crimsonSoft: 'rgba(194,68,68,0.15)',
  violet: '#8B7CD8',
  violetSoft: 'rgba(139,124,216,0.15)',
  orange: '#E08A3C',
  orangeSoft: 'rgba(224,138,60,0.15)',
};

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
  { key: 'other', label: 'Другое', icon: '➕' },
];
const DEBT_CATEGORY_OPTIONS = [
  { key: 'debt_credit', label: 'Кредит' },
  { key: 'debt_micro', label: 'Микрозайм' },
  { key: 'debt_installment', label: 'Рассрочка' },
];
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
  const plan = state.finance.budgetPlan || {};
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
  if (!f.debtLoadThresholds) f.debtLoadThresholds = { low: 20, medium: 36, high: 50 };
  f.debts = (Array.isArray(f.debts) ? f.debts : []).map(d => ({ ...d, history: Array.isArray(d.history) ? d.history : [], category: d.category || 'debt_credit' }));
  f.savingsGoals = (Array.isArray(f.savingsGoals) ? f.savingsGoals : []).map(g => ({ ...g, type: g.type || 'goal' }));
  return f;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function monthStr() { return new Date().toISOString().slice(0, 7); }
function uid() { return Math.random().toString(36).slice(2, 10); }

// --- Real AI calls (proxied through our own /api/ai backend, which holds the key; backend is Gemini, free tier) ---
async function callClaudeAPI(system, messages) {
  let response;
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages }),
    });
  } catch (networkErr) {
    throw new Error('NETWORK: ' + (networkErr && networkErr.message ? networkErr.message : 'fetch failed'));
  }
  if (!response.ok) {
    let bodyText = '';
    try { bodyText = (await response.text()).slice(0, 300); } catch (_) { /* ignore */ }
    const err = new Error(`HTTP ${response.status}: ${bodyText || response.statusText}`);
    err.status = response.status;
    throw err;
  }
  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  if (!text) throw new Error('EMPTY: no text block in response');
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
async function callClaudeAPIWithRetry(system, messages, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callClaudeAPI(system, messages);
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

const BODY_SHAPES = [
  { torsoW: 26, bellyR: 0, shoulderW: 40, limbW: 10, headR: 20 },
  { torsoW: 32, bellyR: 0, shoulderW: 44, limbW: 12, headR: 21 },
  { torsoW: 40, bellyR: 6, shoulderW: 50, limbW: 14, headR: 22 },
  { torsoW: 52, bellyR: 16, shoulderW: 54, limbW: 15, headR: 23 },
  { torsoW: 66, bellyR: 26, shoulderW: 58, limbW: 16, headR: 24 },
];

function bmiTier(bmi) {
  if (bmi == null) return null;
  if (bmi < 16) return { label: 'Очень худой', index: 0, color: COLORS.violet };
  if (bmi < 18.5) return { label: 'Худой', index: 1, color: COLORS.teal };
  if (bmi < 25) return { label: 'Подтянутый', index: 2, color: COLORS.teal };
  if (bmi < 30) return { label: 'Плотный', index: 3, color: COLORS.gold };
  return { label: 'Крупный', index: 4, color: COLORS.gold };
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
      budgetPlan: {}, // {categoryKey: plannedAmount} — раздел 12 ТЗ
      debtLoadThresholds: { low: 20, medium: 36, high: 50 }, // раздел 14 ТЗ
      strategy: 'avalanche',
      taxi: { dailyTarget: 10000, commissionPct: 9, orders: [] },
      emergencyFundGoalMonths: 3,
    },
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

function Card({ children, style }) {
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, ...style }}>
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
          <div key={i} style={{
            flex: '0 0 auto', minWidth: 92, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
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
  const [subTab, setSubTab] = useState({ actions: 'quests', progress: 'stats', more: 'shop' });
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [skipTarget, setSkipTarget] = useState(null);
  const [levelUpFlash, setLevelUpFlash] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [storageStatus, setStorageStatus] = useState('checking');
  const [storageError, setStorageError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      let s = null;
      const hasStorage = typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function';
      if (!hasStorage) {
        setStorageStatus('unavailable');
      } else {
        try {
          const res = await window.storage.get(STORAGE_KEY, false);
          if (res && res.value) s = JSON.parse(res.value);
          setStorageStatus('ok');
        } catch (e) {
          s = null;
          setStorageStatus('error');
          setStorageError(e && e.message ? e.message : String(e));
        }
      }
      const defs = defaultState();
      s = { ...defs, ...(s || {}) };
      // Coin Ledger — если сохранение старое (до этого ТЗ), инициализируем историю с текущего баланса,
      // а не с нуля/50, чтобы не занижать реальный накопленный прогресс игрока.
      if (typeof s.coinsEarnedAllTime !== 'number') s.coinsEarnedAllTime = s.coins || 0;
      if (typeof s.coinsSpentAllTime !== 'number') s.coinsSpentAllTime = 0;
      if (!Array.isArray(s.coinTransactions)) s.coinTransactions = [];
      if (!s.cosmetics) s.cosmetics = { unlocked: [], equipped: { frame: null, background: null, title: null, nameColor: null } };
      s.rewards = (Array.isArray(s.rewards) ? s.rewards : DEFAULT_REWARDS).map(r => ({ category: 'reallife', description: '', icon: '🎁', enabled: true, ...r }));
      s.finance = { ...defs.finance, ...(s.finance || {}) };
      s.finance.taxi = { ...defs.finance.taxi, ...(s.finance.taxi || {}) };
      s.finance = migrateFinance(s.finance);
      s.garage = { ...defs.garage, ...(s.garage || {}) };
      s.body = { ...defs.body, ...(s.body || {}) };
      s.nutrition = { ...defs.nutrition, ...(s.nutrition || {}) };
      if (!Array.isArray(s.nutrition.entries)) s.nutrition.entries = [];
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
    if (typeof window === 'undefined' || !window.storage || typeof window.storage.set !== 'function') {
      setStorageStatus('unavailable');
      return false;
    }
    try {
      const res = await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
      if (!res) {
        setStorageStatus('error');
        setStorageError('set() вернул null — платформа отклонила запись');
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
        setTimeout(() => setLevelUpFlash(null), 3200);
      }
      const ledger1 = applyCoinLedger(prev, 'earn', awardedCoins, 'quest', q.title, q.id);
      const ledger2 = bonusCoins > 0 ? applyCoinLedger({ ...prev, ...ledger1 }, 'earn', bonusCoins, 'levelup', 'Level-Up Bonus') : ledger1;
      return { ...prev, ...ledger2, character, stats, quests, chronicle };
    });
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
    setState(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        debts: [...prev.finance.debts, {
          id: uid(), title: data.title, total: data.total, remaining: data.total,
          monthlyPayment: data.monthlyPayment, interestRate: data.interestRate || 0,
          termMonths: data.termMonths || null, isAnnuity: !!data.isAnnuity, createdAt: Date.now(),
          category: data.category || 'debt_credit', history: [],
        }],
      },
      chronicle: pushChronicle(prev.chronicle, 'SYSTEM', `Новый Debt Boss: ${data.title} (HP ${data.total})`),
    }));
  }

  function deleteDebt(id) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, debts: prev.finance.debts.filter(d => d.id !== id) } }));
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
  function setBudgetPlanItem(category, amount) {
    setState(prev => ({ ...prev, finance: { ...prev.finance, budgetPlan: { ...prev.finance.budgetPlan, [category]: Math.max(0, Number(amount) || 0) } } }));
  }

  function removeBudgetPlanItem(category) {
    setState(prev => {
      const budgetPlan = { ...prev.finance.budgetPlan };
      delete budgetPlan[category];
      return { ...prev, finance: { ...prev.finance, budgetPlan } };
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
      parsed.rewards = (Array.isArray(parsed.rewards) ? parsed.rewards : DEFAULT_REWARDS).map(r => ({ category: 'reallife', description: '', icon: '🎁', enabled: true, ...r }));
      parsed.finance = { ...defs.finance, ...(parsed.finance || {}) };
      parsed.finance.taxi = { ...defs.finance.taxi, ...(parsed.finance.taxi || {}) };
      parsed.finance = migrateFinance(parsed.finance);
      parsed.garage = { ...defs.garage, ...(parsed.garage || {}) };
      parsed.body = { ...defs.body, ...(parsed.body || {}) };
      parsed.nutrition = { ...defs.nutrition, ...(parsed.nutrition || {}) };
      if (!Array.isArray(parsed.nutrition.entries)) parsed.nutrition.entries = [];
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
    { key: 'home', label: 'Home', icon: HomeIcon },
    { key: 'actions', label: 'Действия', icon: Sword },
    { key: 'goals', label: 'Цели', icon: Target },
    { key: 'finance', label: 'Финансы', icon: Wallet },
    { key: 'garage', label: 'Гараж', icon: Car },
    { key: 'progress', label: 'Прогресс', icon: Activity },
    { key: 'more', label: 'Ещё', icon: ScrollText },
  ];

  return (
    <div className="lrpg-root" style={{ background: `radial-gradient(ellipse at top, #171325 0%, ${COLORS.bg} 55%)`, minHeight: 640, color: COLORS.text, fontFamily: 'Inter, sans-serif', paddingBottom: 76, position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        .lrpg-display { font-family: 'Cinzel', serif; }
        .lrpg-root ::-webkit-scrollbar { width: 6px; height: 6px; }
        .lrpg-root ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        .lrpg-btn { cursor: pointer; border: none; font-family: inherit; }
        .lrpg-input { background: ${COLORS.bgCardAlt}; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%; }
        .lrpg-input:focus { outline: none; border-color: ${COLORS.violet}; }
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

      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="lrpg-display" style={{ fontSize: 22, fontWeight: 700, color: COLORS.gold, letterSpacing: 0.5 }}>LIFE RPG</div>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>v{APP_VERSION}</span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Твоя жизнь — твоя игра</div>
      </div>

      {!state.hasSeenOnboarding && (
        <div style={{ margin: '0 16px 10px', background: `linear-gradient(135deg, ${COLORS.violetSoft}, ${COLORS.bgCard})`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: '12px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <MessageCircle size={16} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>
              <b style={{ color: COLORS.violet }}>{MENTOR_NAME}:</b> Приветствую, путник. Это Life RPG — здесь твои реальные дела превращаются в квесты, а прогресс — в рост персонажа.
              Начни с одного простого квеста во вкладке «Действия», а после загляни в Settings и сделай первый экспорт сохранения — на всякий случай.
            </div>
          </div>
          <button className="lrpg-btn" onClick={dismissOnboarding} style={{ marginTop: 8, background: COLORS.violet, color: '#100E1C', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 700 }}>Понятно, начнём</button>
        </div>
      )}

      {showExportReminder && (
        <div style={{ margin: '0 16px 10px', background: COLORS.goldSoft, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Save size={14} color={COLORS.gold} />
            <span style={{ fontSize: 12, color: COLORS.text }}>Давно не экспортировал прогресс — загляни в Settings, займёт секунду.</span>
          </div>
          <button className="lrpg-btn" onClick={() => setShowExportReminder(false)} style={{ background: 'none', flexShrink: 0 }}><X size={13} color={COLORS.textMuted} /></button>
        </div>
      )}

      {(storageStatus === 'unavailable' || storageStatus === 'error') && (
        <div style={{ margin: '0 16px 10px', background: COLORS.crimsonSoft, border: `1px solid ${COLORS.crimson}55`, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={16} color={COLORS.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
            {storageStatus === 'unavailable'
              ? 'Сохранение недоступно в этом окружении — прогресс пропадёт при закрытии. Открывай игру как артефакт прямо в чате Claude, а не как отдельный скачанный файл.'
              : `Ошибка сохранения: ${storageError}. Прогресс может не сохраниться — не закрывай вкладку, пока не увидишь это сообщение снова с "ок".`}
          </div>
        </div>
      )}

      {state.recoveryMode && (
        <div style={{ margin: '0 16px 10px', background: COLORS.tealSoft, border: `1px solid ${COLORS.teal}55`, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartPulse size={14} color={COLORS.teal} />
          <span style={{ fontSize: 12, color: COLORS.teal }}>Recovery Mode активен — нагрузка и штрафы снижены</span>
        </div>
      )}

      {welcomeBackDays > 0 && (
        <div style={{ margin: '0 16px 10px', background: COLORS.violetSoft, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Compass size={16} color={COLORS.violet} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5 }}>
                Ты отсутствовал {welcomeBackDays} дн. Мы не будем требовать все старые задания — вместо этого добавили несколько лёгких Recovery Quest, чтобы мягко вернуться.
              </div>
            </div>
            <button className="lrpg-btn" onClick={() => setWelcomeBackDays(0)} style={{ background: 'none', flexShrink: 0 }}><X size={14} color={COLORS.textMuted} /></button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        {tab === 'home' && (
          <HomeTab
            state={state} xpNeed={xpNeed} mainQuests={mainQuests} restCount={restCount}
            weakestStat={weakestStat} topGoal={topGoal} editingName={editingName}
            setEditingName={setEditingName} setCharacterName={setCharacterName}
            setCharacterTitle={setCharacterTitle} unlockedAchievements={state.unlockedAchievements}
            setCharacterPhoto={setCharacterPhoto}
            energy={energy} todayCheckin={todayCheckin} setDailyCheckin={setDailyCheckin}
            completeQuest={completeQuest} postponeQuest={postponeQuest}
            skipTarget={skipTarget} setSkipTarget={setSkipTarget} skipQuest={skipQuest}
            setTab={setTab} setSubTab={setSubTab}
          />
        )}

        {tab === 'actions' && (
          <>
            <SubNav
              options={[{ key: 'quests', label: 'Квесты' }, { key: 'habits', label: 'Привычки' }, { key: 'events', label: 'События' }]}
              active={subTab.actions} onChange={k => setSubTab(s => ({ ...s, actions: k }))}
            />
            {subTab.actions === 'quests' && (
              <QuestsTab
                activeQuests={activeQuests} laterQuests={laterQuests}
                completeQuest={completeQuest} postponeQuest={postponeQuest} skipQuest={skipQuest}
                skipTarget={skipTarget} setSkipTarget={setSkipTarget} movePriority={movePriority}
                reactivateQuest={reactivateQuest} deleteQuest={deleteQuest}
                showAddQuest={showAddQuest} setShowAddQuest={setShowAddQuest} addQuest={addQuest}
                allQuests={state.quests} dismissedEvolutions={state.dismissedEvolutions} dismissEvolution={dismissEvolution}
                characterLevel={state.character.level} hitBossQuest={hitBossQuest}
              />
            )}
            {subTab.actions === 'habits' && (
              <HabitsTab habits={state.habits} addHabit={addHabit} completeHabit={completeHabit} deleteHabit={deleteHabit} aiContextState={state} />
            )}
            {subTab.actions === 'events' && (
              <EventsTab
                logLifeEvent={logLifeEvent} customEvents={state.customEvents}
                addCustomEvent={addCustomEvent} deleteCustomEvent={deleteCustomEvent}
              />
            )}
          </>
        )}

        {tab === 'goals' && (
          <GoalsTab
            goals={state.goals} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal}
            addGoal={addGoal} updateGoalProgress={updateGoalProgress} deleteGoal={deleteGoal}
            addQuestsFromGoal={addQuestsFromGoal} state={state} setGoalDeadline={setGoalDeadline}
            resolveAbandonedGoal={resolveAbandonedGoal}
          />
        )}

        {tab === 'finance' && (
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

        {tab === 'garage' && (
          <GarageTab
            garage={state.garage} debts={state.finance.debts} taxiOrders={state.finance.taxi.orders}
            setGaragePhoto={setGaragePhoto} setGarageName={setGarageName} setGarageCarDebtId={setGarageCarDebtId}
            setGarageCurrentValue={setGarageCurrentValue}
            addGarageExpense={addGarageExpense} deleteGarageExpense={deleteGarageExpense}
          />
        )}

        {tab === 'progress' && (
          <>
            <SubNav
              options={[{ key: 'stats', label: 'Статы' }, { key: 'world', label: 'Мир' }, { key: 'body', label: 'Тело' }, { key: 'inventory', label: 'Инвентарь' }]}
              active={subTab.progress} onChange={k => setSubTab(s => ({ ...s, progress: k }))}
            />
            {subTab.progress === 'stats' && (
              <StatsTab stats={state.stats} energy={energy} todayCheckin={todayCheckin} setDailyCheckin={setDailyCheckin}
                chronicle={state.chronicle} recoveryMode={state.recoveryMode} toggleRecoveryMode={toggleRecoveryMode} statsHistory={state.statsHistory} />
            )}
            {subTab.progress === 'world' && (
              <WorldTab stats={state.stats} unlockedAchievements={state.unlockedAchievements} state={state} />
            )}
            {subTab.progress === 'body' && (
              <BodyTab
                body={state.body} setBodyProfile={setBodyProfile} logWeight={logWeight}
                nutrition={state.nutrition} addFoodEntry={addFoodEntry} deleteFoodEntry={deleteFoodEntry}
              />
            )}
            {subTab.progress === 'inventory' && <InventoryTab stats={state.stats} unlockedSets={state.unlockedSets} />}
          </>
        )}

        {tab === 'more' && (
          <>
            <SubNav
              options={[{ key: 'shop', label: 'Магазин' }, { key: 'chronicle', label: 'Хроника' }, { key: 'mentor', label: 'Ментор' }, { key: 'settings', label: 'Настройки' }]}
              active={subTab.more} onChange={k => setSubTab(s => ({ ...s, more: k }))}
            />
            {subTab.more === 'shop' && (
              <ShopTab
                rewards={state.rewards} coins={state.coins} coinsEarnedAllTime={state.coinsEarnedAllTime}
                coinsSpentAllTime={state.coinsSpentAllTime} coinTransactions={state.coinTransactions}
                cosmetics={state.cosmetics} lastPurchase={state.lastPurchase} lastRefundAt={state.lastRefundAt}
                buyReward={buyReward} buyCosmetic={buyCosmetic} equipCosmetic={equipCosmetic} refundLastPurchase={refundLastPurchase}
                showAddReward={showAddReward} setShowAddReward={setShowAddReward}
                addReward={addReward} deleteReward={deleteReward} setRewardEnabled={setRewardEnabled}
              />
            )}
            {subTab.more === 'chronicle' && (
              <ChronicleTab
                chronicle={state.chronicle} addManualChronicleEntry={addManualChronicleEntry}
                editChronicleEntry={editChronicleEntry} deleteChronicleEntry={deleteChronicleEntry}
              />
            )}
            {subTab.more === 'mentor' && <MentorTab state={state} />}
            {subTab.more === 'settings' && (
              <SettingsTab
                character={state.character} setCharacterName={setCharacterName} resetAllData={resetAllData}
                availableHoursPerWeek={state.availableHoursPerWeek} setAvailableHours={setAvailableHours}
                storageStatus={storageStatus} storageError={storageError} lastSavedAt={lastSavedAt}
                state={state} importSaveData={importSaveData} saveNow={saveNow}
                onExported={() => { setHasExportedThisSession(true); setShowExportReminder(false); }}
                difficultyMode={state.difficultyMode} setDifficultyMode={setDifficultyMode}
              />
            )}
          </>
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
        background: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}`, padding: '6px 2px 8px',
        overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} className="lrpg-btn" onClick={() => setTab(t.key)} style={{
              flex: '1 0 auto', minWidth: 46, background: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, color: active ? COLORS.gold : COLORS.textMuted, padding: '2px 1px',
            }}>
              <Icon size={17} />
              <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HomeTab({ state, xpNeed, mainQuests, restCount, weakestStat, topGoal, editingName, setEditingName, setCharacterName, setCharacterTitle, setCharacterPhoto, unlockedAchievements, energy, todayCheckin, setDailyCheckin, completeQuest, postponeQuest, skipTarget, setSkipTarget, skipQuest, setTab, setSubTab }) {
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const xpPct = Math.round((state.character.xp / xpNeed) * 100);
  const eLabel = energyLabel(energy);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.bgCardAlt}, ${COLORS.bgCard})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <label className="lrpg-btn" style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: COLORS.bgCardAlt, border: `2px solid ${state.cosmetics.equipped.frame ? (COSMETIC_CATALOG.find(c => c.id === state.cosmetics.equipped.frame)?.rarity === 'Epic' ? COLORS.violet : COSMETIC_CATALOG.find(c => c.id === state.cosmetics.equipped.frame)?.rarity === 'Rare' ? COLORS.teal : COLORS.gold) : COLORS.gold + '55'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {state.character.photo ? (
                <img src={state.character.photo} alt={state.character.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={18} color={COLORS.textMuted} />
              )}
              {uploadingPhoto && <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,10,18,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: COLORS.gold }}>...</div>}
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
            <div>
              {editingName ? (
                <input
                  className="lrpg-input" autoFocus defaultValue={state.character.name}
                  style={{ fontSize: 16, fontWeight: 700, maxWidth: 160 }}
                  onBlur={e => { setCharacterName(e.target.value || 'Герой'); setEditingName(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                />
              ) : (
                <div onClick={() => setEditingName(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span className="lrpg-display" style={{ fontSize: 18, fontWeight: 700, color: state.cosmetics.equipped.nameColor ? (COSMETIC_CATALOG.find(c => c.id === state.cosmetics.equipped.nameColor)?.preview || undefined) : undefined }}>{state.character.name}</span>
                  <Pencil size={12} color={COLORS.textMuted} />
                </div>
              )}
              <div style={{ fontSize: 12, color: COLORS.gold, marginTop: 2, fontWeight: 600 }}>Level {state.character.level}</div>
              <div onClick={() => setShowTitlePicker(v => !v)} style={{ fontSize: 11, color: COLORS.violet, marginTop: 3, cursor: 'pointer' }}>
                {state.character.title ? `«${state.character.title}»` : 'Выбрать титул'} ▾
              </div>
              {showTitlePicker && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, background: COLORS.bgCardAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 6, maxWidth: 220 }}>
                  <div className="lrpg-btn" onClick={() => { setCharacterTitle(null); setShowTitlePicker(false); }} style={{ fontSize: 12, padding: '4px 6px', color: COLORS.textMuted }}>Без титула</div>
                  {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).map(a => (
                    <div key={a.id} className="lrpg-btn" onClick={() => { setCharacterTitle(a.label); setShowTitlePicker(false); }} style={{ fontSize: 12, padding: '4px 6px', color: RARITY_COLOR[a.rarity] }}>{a.label}</div>
                  ))}
                  {unlockedAchievements.length === 0 && <div style={{ fontSize: 11, color: COLORS.textMuted, padding: '4px 6px' }}>Пока нет разблокированных достижений</div>}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.goldSoft, padding: '5px 10px', borderRadius: 999 }}>
            <CoinsIcon size={14} color={COLORS.gold} />
            <span style={{ fontWeight: 700, color: COLORS.gold, fontSize: 14 }}>{state.coins}</span>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>
            <span>XP</span><span>{state.character.xp} / {xpNeed}</span>
          </div>
          <Bar value={xpPct} color={COLORS.gold} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div onClick={() => setShowCheckin(v => !v)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginBottom: 4, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} color={eLabel.color} /> Energy</span>
            <span style={{ color: eLabel.color, fontWeight: 700 }}>{energy}/100 · {eLabel.label} {todayCheckin ? '▾' : '· заполнить ▾'}</span>
          </div>
          <Bar value={energy} color={eLabel.color} />
          {showCheckin && <CheckinForm initial={todayCheckin} onSubmit={data => { setDailyCheckin(data); setShowCheckin(false); }} />}
        </div>
      </Card>

      <StatusStrip state={state} energy={energy} weakestStat={weakestStat} />

      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.violet, textTransform: 'none', marginBottom: 6 }}>Morning Briefing</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.text }}>
          Слабее всего сейчас: <b style={{ color: COLORS.gold }}>{weakestStat.label}</b> ({state.stats[weakestStat.key]}).{' '}
          {mainQuests[0]
            ? <>Главный квест на сегодня — <b>«{mainQuests[0].title}»</b>: он прокачивает {STAT_LABEL[mainQuests[0].stat] || 'общий прогресс'} и даёт {mainQuests[0].xp} XP.</>
            : 'Активных квестов нет — самое время добавить один во вкладке «Квесты».'}
        </div>
      </Card>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COLORS.text }}>Сегодняшние приоритеты</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mainQuests.length === 0 && <Card><div style={{ fontSize: 13, color: COLORS.textMuted }}>Нет активных квестов.</div></Card>}
          {mainQuests.map((q, i) => (
            <QuestCard key={q.id} q={q} priority={i + 1} completeQuest={completeQuest} postponeQuest={postponeQuest}
              skipTarget={skipTarget} setSkipTarget={setSkipTarget} skipQuest={skipQuest} compact />
          ))}
        </div>
        {restCount > 0 && (
          <div onClick={() => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); }} style={{ marginTop: 8, fontSize: 12, color: COLORS.violet, cursor: 'pointer', textAlign: 'center' }}>
            ещё {restCount} в разделе «Квесты» →
          </div>
        )}
      </div>

      {topGoal && (
        <Card>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>Ближайшая цель</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{topGoal.title}</div>
          <Bar value={topGoal.progress} color={COLORS.violet} />
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{topGoal.progress}% выполнено</div>
        </Card>
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
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10, marginBottom: 4 }}>Последние операции</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
              {coinTransactions.slice(-15).reverse().map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{t.title}</span>
                  <span style={{ color: (t.type === 'earn' || t.type === 'refund') ? COLORS.teal : COLORS.crimson, fontWeight: 700 }}>{(t.type === 'earn' || t.type === 'refund') ? '+' : '-'}{t.amount}</span>
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

function AddDebtForm({ onSubmit, onCancel }) {
  const [isAnnuity, setIsAnnuity] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('debt_credit');
  const [total, setTotal] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('');
  const [manualPayment, setManualPayment] = useState('');

  const totalNum = Number(total) || 0;
  const rateNum = Number(rate) || 0;
  const monthsNum = Number(months) || 0;
  const computedPayment = isAnnuity ? (monthsNum > 0 ? annuityPayment(totalNum, rateNum, monthsNum) : 0) : (Number(manualPayment) || 0);
  const overpay = isAnnuity && monthsNum > 0 ? Math.max(0, computedPayment * monthsNum - totalNum) : 0;
  const valid = title.trim() && totalNum > 0 && (isAnnuity ? monthsNum > 0 : computedPayment > 0);

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="lrpg-btn" onClick={() => setIsAnnuity(true)} style={{
            flex: 1, background: isAnnuity ? COLORS.violet : COLORS.bgCardAlt, color: isAnnuity ? '#100E1C' : COLORS.textMuted,
            borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700,
          }}>Кредит (аннуитет)</button>
          <button className="lrpg-btn" onClick={() => setIsAnnuity(false)} style={{
            flex: 1, background: !isAnnuity ? COLORS.violet : COLORS.bgCardAlt, color: !isAnnuity ? '#100E1C' : COLORS.textMuted,
            borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700,
          }}>Обычный долг</button>
        </div>
        <input className="lrpg-input" placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} />
        <select className="lrpg-input" value={category} onChange={e => setCategory(e.target.value)}>
          {DEBT_CATEGORY_OPTIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input className="lrpg-input" type="number" min={0} placeholder="Сумма долга (основной долг)" value={total} onChange={e => setTotal(e.target.value)} />
        {isAnnuity ? (
          <>
            <input className="lrpg-input" type="number" min={0} step={0.1} placeholder="Ставка, % годовых" value={rate} onChange={e => setRate(e.target.value)} />
            <input className="lrpg-input" type="number" min={1} placeholder="Срок, месяцев" value={months} onChange={e => setMonths(e.target.value)} />
            {monthsNum > 0 && totalNum > 0 && (
              <div style={{ fontSize: 12, background: COLORS.bgCardAlt, borderRadius: 8, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: COLORS.textMuted }}>Платёж в месяц</span><b style={{ color: COLORS.gold }}>{Math.round(computedPayment)}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}><span style={{ color: COLORS.textMuted }}>Переплата за срок</span><b style={{ color: COLORS.crimson }}>{Math.round(overpay)}</b></div>
              </div>
            )}
          </>
        ) : (
          <input className="lrpg-input" type="number" min={0} placeholder="Платёж в месяц" value={manualPayment} onChange={e => setManualPayment(e.target.value)} />
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="lrpg-btn" disabled={!valid} onClick={() => onSubmit({
            title: title.trim(), category, total: totalNum, monthlyPayment: computedPayment,
            interestRate: isAnnuity ? rateNum : 0, termMonths: isAnnuity ? monthsNum : null, isAnnuity,
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
  const actualByCategory = {};
  thisMonthTx.filter(t => t.type === 'expense').forEach(t => { actualByCategory[t.category] = (actualByCategory[t.category] || 0) + t.amount; });
  const sortedDebts = sortDebts(finance.debts, finance.strategy);
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={15} color={COLORS.gold} /> Бюджет месяца</span>
          <button className="lrpg-btn" onClick={() => setShowBudgetEdit(v => !v)} style={{ background: 'none', color: COLORS.violet, fontSize: 12, fontWeight: 700 }}>{showBudgetEdit ? 'Готово' : 'Настроить'}</button>
        </div>
        <Card>
          {Object.keys(finance.budgetPlan).length === 0 && !showBudgetEdit && (
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>План не задан. Нажми «Настроить», чтобы задать план по категориям.</div>
          )}
          {EXPENSE_CATEGORIES.filter(c => c.group !== 'fin' && c.group !== 'debt').map(c => {
            const planned = finance.budgetPlan[c.key];
            const actual = actualByCategory[c.key] || 0;
            if (!showBudgetEdit && planned === undefined) return null;
            const diff = (planned || 0) - actual;
            return (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, flex: 1 }}>{c.label}</span>
                {showBudgetEdit ? (
                  <input className="lrpg-input" type="number" min={0} placeholder="План" value={planned || ''}
                    onChange={e => e.target.value ? setBudgetPlanItem(c.key, e.target.value) : removeBudgetPlanItem(c.key)}
                    style={{ width: 90, fontSize: 11, padding: '4px 6px' }} />
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
          {!showBudgetEdit && Object.keys(finance.budgetPlan).length > 0 && (
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: COLORS.textMuted, justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ width: 60, textAlign: 'right' }}>План</span><span style={{ width: 60, textAlign: 'right' }}>Факт</span><span style={{ width: 60, textAlign: 'right' }}>Разница</span>
            </div>
          )}
          {health.plannedTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}`, fontSize: 12, fontWeight: 700 }}>
              <span>Total Planned</span><span>{health.plannedTotal}</span>
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
            const schedule = d.isAnnuity && expandedSchedule === d.id ? buildAmortizationSchedule(d.total, d.interestRate, d.termMonths) : null;
            const totalInterest = d.isAnnuity ? Math.round(d.monthlyPayment * d.termMonths - d.total) : 0;
            return (
              <Card key={d.id} style={{ opacity: defeated ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{!defeated ? `#${i + 1} ` : ''}{d.title} {defeated && '💀'}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                      Платёж {Math.round(d.monthlyPayment)}/мес{d.interestRate ? ` · ${d.interestRate}% годовых` : ''}{d.termMonths ? ` · ${d.termMonths} мес.` : ''}
                    </div>
                    {d.isAnnuity && <div style={{ fontSize: 11, color: COLORS.crimson, marginTop: 2 }}>Переплата за срок: {totalInterest}</div>}
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
                {d.isAnnuity && (
                  <div
                    onClick={() => setExpandedSchedule(expandedSchedule === d.id ? null : d.id)}
                    style={{ fontSize: 11, color: COLORS.violet, marginTop: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    {expandedSchedule === d.id ? 'Скрыть график платежей' : 'Показать график платежей'} <ChevronRight size={12} style={{ transform: expandedSchedule === d.id ? 'rotate(90deg)' : 'none' }} />
                  </div>
                )}
                {schedule && (
                  <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr', fontSize: 10, color: COLORS.textMuted, padding: '4px 8px', borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, background: COLORS.bgCard }}>
                      <span>#</span><span>%</span><span>Долг</span><span>Остаток</span>
                    </div>
                    {schedule.map(row => (
                      <div key={row.month} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1fr 1fr 1fr', fontSize: 11, padding: '4px 8px' }}>
                        <span>{row.month}</span>
                        <span style={{ color: COLORS.crimson }}>{Math.round(row.interest)}</span>
                        <span style={{ color: COLORS.teal }}>{Math.round(row.principalPart)}</span>
                        <span>{Math.round(row.balance)}</span>
                      </div>
                    ))}
                  </div>
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

function SettingsTab({ character, setCharacterName, resetAllData, availableHoursPerWeek, setAvailableHours, storageStatus, storageError, lastSavedAt, state, importSaveData, saveNow, onExported, difficultyMode, setDifficultyMode }) {
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
      <Card style={{ border: `1px solid ${storageStatus === 'ok' ? COLORS.teal + '55' : COLORS.crimson + '55'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
          <Save size={14} color={storageStatus === 'ok' ? COLORS.teal : COLORS.crimson} />
          Автосохранение: {storageStatus === 'ok' ? 'работает' : storageStatus === 'unavailable' ? 'недоступно для этого артефакта' : storageStatus === 'checking' ? 'проверяю...' : 'ошибка'}
        </div>
        {lastSavedAt && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Последнее сохранение: {fmtTime(lastSavedAt)}</div>}
        {storageError && <div style={{ fontSize: 10, color: COLORS.crimson, marginTop: 4 }}>{storageError}</div>}
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

function CharacterAvatar({ tierIndex = 2, color = COLORS.violet, height = 190 }) {
  const s = BODY_SHAPES[Math.max(0, Math.min(BODY_SHAPES.length - 1, tierIndex))];
  const cx = 70;
  return (
    <svg viewBox="0 0 140 220" width="100%" height={height} style={{ maxWidth: 170, margin: '0 auto', display: 'block' }}>
      <rect x={cx - s.torsoW / 2 - 2} y={150} width={s.limbW} height={58} rx={s.limbW / 2} fill={color} opacity="0.85" />
      <rect x={cx + s.torsoW / 2 - s.limbW + 2} y={150} width={s.limbW} height={58} rx={s.limbW / 2} fill={color} opacity="0.85" />
      <rect x={cx - s.shoulderW / 2 - s.limbW * 0.7} y={62} width={s.limbW * 0.85} height={66} rx={s.limbW * 0.4} fill={color} opacity="0.75" />
      <rect x={cx + s.shoulderW / 2 - s.limbW * 0.15} y={62} width={s.limbW * 0.85} height={66} rx={s.limbW * 0.4} fill={color} opacity="0.75" />
      <path
        d={`M ${cx - s.shoulderW / 2} 58
            Q ${cx - s.torsoW / 2 - 4} 70 ${cx - s.torsoW / 2} 90
            L ${cx - s.torsoW / 2} 130
            Q ${cx - s.torsoW / 2 - 2} 148 ${cx} 152
            Q ${cx + s.torsoW / 2 + 2} 148 ${cx + s.torsoW / 2} 130
            L ${cx + s.torsoW / 2} 90
            Q ${cx + s.torsoW / 2 + 4} 70 ${cx + s.shoulderW / 2} 58
            Q ${cx} 46 ${cx - s.shoulderW / 2} 58 Z`}
        fill={color}
      />
      {s.bellyR > 0 && <ellipse cx={cx} cy={120} rx={s.torsoW / 2 + s.bellyR * 0.5} ry={s.bellyR + 20} fill={color} />}
      <circle cx={cx} cy={30} r={s.headR} fill={color} opacity="0.95" />
    </svg>
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
