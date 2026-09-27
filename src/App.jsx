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
  Swords, Search, BarChart3, Youtube, User,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// 14.0  Архитектура навигации: 5 разделов Home / Действия / Цели / Прогресс / Профиль.
//      Финансы, Гараж, YouTube, Магазин, Инвентарь, Настройки убраны из нижнего меню
//      и живут внутри Профиля (Моя жизнь / Моё / Система). Home остаётся эталоном UI.
//      Старые вкладки не удалены — перенесены внутрь новой карты.
const APP_VERSION = '14.0';

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

// ===================== АРТ: спрайты персонажа (8 типов телосложения) и фон комнаты =====================
// Сгенерированы отдельно и встроены как data URI — не требуют внешнего хостинга.
// Каждый спрайт — консистентный персонаж (тот же дизайн лица/одежды) в one из 8 типов телосложения.
const CHARACTER_SPRITES = {
  "v1_very_slim": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v2_slim": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v3_lean": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v4_fit": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v5_athletic": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v6_stocky": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v7_overweight": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
  "v8_very_heavy": "data:image/webp;base64,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xzN/eJ49zx/74/njDz1/+rsG82tfpaNKKyJUqklPlz6T6/sf/Ev/wn/jj+f6x7Zne2z+sGG+iHMcDGPs9Xf8a//KP/I47ge72MU1xyC3EbYX2qW7+3/Ot/f1x7/x7rBO09BYgipFOaa6FNSTaxgh1sJ/9qf1i/o+7Bc97/4212WXyZrzzW2QIlSrcl0XLJ+2zBc4mY8n59WQzrKKIBWNnhcW3rE0eQp/fINeeN7JLHkui+UN5VxuS1RisdxnLatZPV+hLY1pMbdLcx+5z4cNF50yaSzXb5AXaznO/aLVjaKdRIokD2l4H7TGa631xxfoba21teb6Phc9uS33KZSoYl54XizXxbKwL5DXh+uwWJ53KakVUSHHkia7tO6aWNAfX6DeHdZapl1M04o153IMIWS6MLlttKz5BmWN1lyXtVybc5RjEIJoTSwfNlrTer5AyjJo7pe19p4sZG6LkjyvY9Pzno7L9RtUrsvHTw3eubaF/DzxblmTvZsOWQt9hd4n09pp2ru1Vius3KdTjm01LYtlXdBc9wUSWnPd+7xby1qzXDN1KeoiRC8lklrWclu+wGVu5342RAhBOXY5xkJK3rye6FGD9xsk1/rjHY1ZPi7kh10qikpHvY/Xel6e99AXqNPjfV7Xyl0Rk2t2o1zDG0KKWLBc8xXahbYow9ig8OaaXx6KKJPlyxzLdcxYDCvItfywLgWFUshkYvF+hXJ+XkaGaVtQrvmFBRWqdEUjs3emr0/qj1dPmg9zHAVb7vuAHHMMZWSkJ72+wTXPnzZ0M7NrOfb61R3URUFMjNDXqEfNphlhW46VD9NHyqCC0sgI8x1uSwwxm9mGXcqnFfUJdUFBDGHE+w0SRtgMF207fP7mWJ+oDlRZOS7X+hZdF2JLuFR9lJ2oD1BdrrWdwnyTM5jBbOanlc/rE1QHK+ac9Q3qMOfMTmwf5RfWR6jLsct8nWvMTtg+mfza+owq5tyhr1CnrYPE9oM3v7zsk3OY73QL5sdh/ix7+9G1w75Ke1m7/Djz57D62Tn0DarR49fG/Hmtfsn3O+bPd8fvWE8d5i9op32vwrLDX/QO+yrtPQyav0RDX6HQc/j//vfff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333///ffff//9999///3333//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",
};
const CHARACTER_SPRITE_LIST = [
  CHARACTER_SPRITES.v1_very_slim, CHARACTER_SPRITES.v2_slim, CHARACTER_SPRITES.v3_lean, CHARACTER_SPRITES.v4_fit,
  CHARACTER_SPRITES.v5_athletic, CHARACTER_SPRITES.v6_stocky, CHARACTER_SPRITES.v7_overweight, CHARACTER_SPRITES.v8_very_heavy,
];
const ROOM_BACKGROUND_IMAGE = "data:image/jpeg;base64,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";

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
    youtube: { channels: [] }, // {id,name,handle,channelId,thumb,subs,views,videos,history:[{date,subs,views,videos}],lastSync}
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
            background: on ? `linear-gradient(160deg, ${COLORS.violet}, #5b4cb8)` : 'rgba(255,255,255,0.04)',
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
        <div className="lrpg-display" style={{ fontSize: 18, fontWeight: 700, color: COLORS.gold }}>{title}</div>
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
                background: `linear-gradient(160deg, ${COLORS.violet}, #5b4cb8)`, color: '#fff',
                borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 700, flexShrink: 0,
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
                  background: done ? 'rgba(255,255,255,0.06)' : `linear-gradient(160deg, ${COLORS.violet}, #5b4cb8)`,
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
        .lrpg-btn { cursor: pointer; border: none; font-family: inherit; }
        .lrpg-btn:active { transform: translateY(1px); }
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
                <YouTubeTab
                  youtube={state.youtube} quests={state.quests}
                  addYouTubeChannel={addYouTubeChannel} updateYouTubeStats={updateYouTubeStats}
                  deleteYouTubeChannel={deleteYouTubeChannel} addYouTubeQuest={addYouTubeQuest}
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

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, display: 'flex',
        background: 'linear-gradient(180deg, rgba(20,18,31,0.72), rgba(11,10,18,0.96))',
        borderTop: `1px solid ${COLORS.violet}33`, boxShadow: `0 -8px 24px rgba(0,0,0,0.45)`,
        padding: '6px 6px calc(8px + env(safe-area-inset-bottom, 0px))', backdropFilter: 'blur(10px)',
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} className="lrpg-btn" onClick={() => setTab(t.key)} style={{
              flex: 1, background: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, color: active ? COLORS.gold : COLORS.textMuted, padding: '2px 1px',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? COLORS.goldSoft : 'transparent',
                boxShadow: active ? `0 0 12px ${COLORS.gold}55` : 'none',
                border: active ? `1px solid ${COLORS.gold}55` : '1px solid transparent',
              }}>
                <Icon size={16} />
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.label}</span>
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
      position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      transform: `scale(${scale})`, transformOrigin: 'bottom center',
    }}>
      <img src={src} alt="Персонаж" draggable={false} style={{
        height: '100%', width: 'auto', objectFit: 'contain',
        filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 26px rgba(139,124,216,0.18))',
        WebkitUserSelect: 'none', userSelect: 'none',
      }} />
    </div>
  );
}

function MiniHudBar({ icon: Icon, value, max = 100, color, showValue }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div className="lrpg-badge-icon" style={{ width: 14, height: 14, borderRadius: 5, flexShrink: 0 }}>
        <Icon size={8} color={color} />
      </div>
      <div className="lrpg-gauge-track" style={{ flex: 1, height: 6, minWidth: 0 }}>
        <div className="lrpg-gauge-fill" style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${color}, ${color}cc)`, boxShadow: `0 0 6px ${color}99` }} />
        <div className="lrpg-gauge-ticks" />
      </div>
      {showValue && <span style={{ fontSize: 8, fontWeight: 700, color, flexShrink: 0, minWidth: 26, textAlign: 'right' }}>{Math.round(value)}/{max}</span>}
    </div>
  );
}

// Модалка поверх сцены — общий каркас для редактирования (имя/фото/титул, параметры тела, чек-ин),
// чтобы функциональность осталась доступной без постоянного места в layout Home.
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
  const eLabel = energyLabel(energy);
  return (
    <div className="lrpg-glass lrpg-chamfer" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 13, padding: '7px 10px', minWidth: 0, flex: 1 }}>
      <button className="lrpg-btn" onClick={onOpenIdentity} style={{
        position: 'relative', width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: COLORS.bgCardAlt, border: `2px solid ${COLORS.gold}66`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {state.character.photo ? <img src={state.character.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={13} color={COLORS.textMuted} />}
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="lrpg-display" onClick={onOpenIdentity} style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: `0 0 8px ${COLORS.gold}55` }}>
          Lv.{state.character.level} {state.character.name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
          <MiniHudBar icon={HeartPulse} value={hp} max={100} color={COLORS.crimson} showValue />
          <div onClick={onOpenCheckin}><MiniHudBar icon={Zap} value={energy} max={100} color={eLabel.color} showValue /></div>
          <MiniHudBar icon={Sparkles} value={state.character.xp} max={xpNeed} color={COLORS.gold} showValue />
        </div>
      </div>
    </div>
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
        display: 'flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '5px 6px 5px 5px',
        background: 'radial-gradient(120% 160% at 25% 15%, rgba(255,224,160,0.35), transparent 55%), linear-gradient(160deg, #3a2c14, #1c1608)',
        border: `1px solid ${COLORS.gold}55`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 10px rgba(0,0,0,0.4)`,
      }}>
        <span className="lrpg-badge-icon" style={{ width: 17, height: 17, borderRadius: 999 }}><CoinsIcon size={10} color={COLORS.gold} /></span>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, textShadow: `0 0 8px ${COLORS.gold}55` }}>{coins}</span>
        <Plus size={11} color={COLORS.textMuted} style={{ marginRight: 2 }} />
      </button>
      <div className="lrpg-glass" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 10, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Moon size={10} color={COLORS.violet} /> {timeStr} · День {dayNumber}
      </div>
    </div>
  );
}

// ---- Левая рельса (постоянно видна, не drawer) ----

const GAME_MENU_ITEMS = [
  { key: 'character', label: 'Перс.', icon: HandMetal, go: (setTab) => setTab('home') },
  { key: 'params', label: 'Парам.', icon: Ruler, special: 'params' },
  { key: 'inventory', label: 'Инвент.', icon: Backpack, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'inventory' })); } },
  { key: 'quests', label: 'Задания', icon: ScrollText, go: (setTab, setSubTab) => { setTab('actions'); setSubTab(s => ({ ...s, actions: 'quests' })); } },
  { key: 'achievements', label: 'Дост.', icon: Trophy, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'achievements' })); } },
  { key: 'shop', label: 'Магаз.', icon: CoinsIcon, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'shop' })); } },
  { key: 'settings', label: 'Настр.', icon: SettingsIcon, go: (setTab, setSubTab) => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'settings' })); } },
];

function LeftGameMenu({ setTab, setSubTab, onOpenParams }) {
  return (
    <div className="lrpg-glass lrpg-chamfer lrpg-chamfer-violet" style={{
      width: 54, borderRadius: 14, padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 4,
      alignItems: 'stretch', height: '100%', overflowY: 'auto',
    }}>
      {GAME_MENU_ITEMS.map(item => {
        const Icon = item.icon;
        return (
          <button key={item.key} className="lrpg-btn" onClick={() => item.special === 'params' ? onOpenParams() : item.go(setTab, setSubTab)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', padding: '6px 2px', borderRadius: 9,
          }}>
            <span className="lrpg-badge-icon" style={{ width: 30, height: 30, borderRadius: 9 }}>
              <Icon size={15} color={COLORS.violet} />
            </span>
            <span style={{ fontSize: 8, fontWeight: 600, color: COLORS.textMuted, lineHeight: 1 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
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
    <div className="lrpg-glass lrpg-chamfer" style={{ borderRadius: 13, padding: '9px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.teal, textShadow: `0 0 8px ${COLORS.teal}44` }}>Параметры</span>
        <button className="lrpg-btn" onClick={onEdit} style={{ background: 'none', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pencil size={11} color={COLORS.textMuted} />
        </button>
      </div>
      {rows.map(r => {
        const Icon = r.icon;
        return (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0' }}>
            <Icon size={10} color={COLORS.violet} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: COLORS.textMuted, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.text }}>{r.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// Цели на сегодня — честный срез реальных данных (квесты/привычки/чек-ин/питание), не отдельное состояние.
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
  return (
    <div className="lrpg-glass lrpg-chamfer lrpg-chamfer-violet" style={{ borderRadius: 13, padding: '9px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.violet, marginBottom: 5, textShadow: `0 0 8px ${COLORS.violet}44` }}>Цель на сегодня</div>
      {goals.map((g, i) => (
        <div key={g.key} className="lrpg-btn" onClick={() => goTo(g.key)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', background: 'none', width: '100%', textAlign: 'left',
          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          {g.done
            ? <span style={{ width: 12, height: 12, borderRadius: 99, background: `linear-gradient(160deg, ${COLORS.teal}, #1f8f82)`, boxShadow: `0 0 7px ${COLORS.teal}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={8} color="#0B1F1D" /></span>
            : <span style={{ width: 12, height: 12, borderRadius: 99, border: `1px solid ${COLORS.textMuted}`, background: 'rgba(0,0,0,0.3)', flexShrink: 0, display: 'inline-block' }} />}
          <span style={{ fontSize: 9, color: g.done ? COLORS.teal : COLORS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</span>
          <span style={{ fontSize: 8, color: COLORS.textMuted }}>{g.done ? '1/1' : '0/1'}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Центр сцены: фон (заглушка — сюда позже встанет ассет) + персонаж ----

function GameSceneCenter({ body, currentWeight }) {
  // Фон комнаты теперь на весь экран (рисуется в HomeTab, за этой колонкой) — тут только сам персонаж
  // и мягкая тень-пятно под ногами, чтобы он "стоял" на полу, а не висел вырезанным прямоугольником.
  return (
    <div className="lrpg-scene" style={{ height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', minWidth: 0 }}>
      <div className="lrpg-ground-shadow" />
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
  const [modal, setModal] = useState(null); // null | 'identity' | 'params' | 'checkin'
  const currentWeight = latestWeight(state.body);
  const dayNumber = state.firstOpenedAt
    ? Math.max(1, Math.floor((Date.now() - state.firstOpenedAt) / 86400000) + 1)
    : ((state.playLog || []).length || 1);
  const xpNeed = xpNeeded(state.character.level);

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 62, zIndex: 5, overflow: 'hidden',
      height: 'auto', maxHeight: 'none',
    }}>
      {/* фон — комната во весь экран, а не в отдельной коробке; персонаж и HUD стоят прямо на нём */}
      <div style={{
        position: 'absolute', inset: 0, backgroundImage: `url(${ROOM_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover', backgroundPosition: 'center 78%',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(11,10,18,0.62) 0%, rgba(11,10,18,0.12) 24%, rgba(11,10,18,0.08) 55%, rgba(11,10,18,0.88) 100%), radial-gradient(120% 70% at 50% 100%, rgba(139,124,216,0.16), transparent 62%)',
      }} />
      <div style={{
        position: 'relative', zIndex: 1, height: '100%',
        display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 8,
        padding: `calc(10px + env(safe-area-inset-top, 0px)) 10px calc(10px + env(safe-area-inset-bottom, 0px))`,
      }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <CharacterStatusCard
          state={state} xpNeed={xpNeed} energy={energy} hp={state.stats.physical}
          onOpenIdentity={() => setModal('identity')} onOpenCheckin={() => setModal('checkin')}
        />
        <CoinsTimeBlock coins={state.coins} dayNumber={dayNumber} onOpenShop={() => { setTab('profile'); setSubTab(s => ({ ...s, profile: 'shop' })); }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 116px', gap: 8, minHeight: 0 }}>
        <LeftGameMenu setTab={setTab} setSubTab={setSubTab} onOpenParams={() => setModal('params')} />
        <GameSceneCenter body={state.body} currentWeight={currentWeight} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflowY: 'auto' }}>
          <RightStatsPanel body={state.body} currentWeight={currentWeight} onEdit={() => setModal('params')} />
          <DailyGoalsPanel state={state} setTab={setTab} setSubTab={setSubTab} />
        </div>
      </div>

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
