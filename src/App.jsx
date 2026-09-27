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
// 14.2  Home как референс: сцена на весь экран, панели поверх, персонаж меньше в центре.
// 14.1  Home visual: новый фон комнаты, полный рост персонажа (чёрное худи), левое меню с подписями, меньше виньетки.
const APP_VERSION = '14.2';

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
  "v1_very_slim": "data:image/webp;base64,UklGRkI2AABXRUJQVlA4WAoAAAAQAAAAkAAABwIAQUxQSLslAAABDAZtG0lK+MOef+8ARMQEmAJOSXuUK6t2C/sH0OHWGjCFjHvj5Fn1wLrzQb+zqVuWiZG+G5vm7+gojlBm7ZYb9S+Z+Eg+cMf2ESPADf5lmFnjRrRHNFhywOKVAirRYcsb//+qpfT/91xrz9DdoSCCovhWbLE7CcUOLMRWxMJWwu7GRN6K0gIGBkhj0CHdOHTnzJy9Xq/nhTkzc9Y6e+ZyREwApdu2TVvPmHM/frFt27Zt207+QGp2qk4pJZs12ygl/8BWiffufc69a516REwAcY0xKH9GBoAx5YZadQBYYwFTHjCo98KkiaN7NAeq9mkGA0AaNhtVbd+2aadp+149FFf83sQYaxl0G6FobeARbnux/g8jkQMst85SQ2WsRc5bD13XZdjGv/tUv7mAH17h2uKEzz56e7tS0KB4HIAzn1nL9Fv6/ek2v7yny92LXz5nF0CgAQEMYGy16wfM+k9VxKkIKcrCgrWc2WPwy3fd3gpRhLIzOhmwkUGPQb3fnOOUadWRSlKZdvuoPjVPr1JWyIz8rApge332+VKWVqlU55wTkuPOt8YYUyagyS9rfnv5U5IULUVJ1QlXn4Gy094xYgedOqXXmKubV6gclQ0WOOuHQqV35aoF6+YfCaVXDDoM3c4gRac+1aUu0jdn9f/2+VkiIajb0Qcw2Vl0+bvb/eupDPWPKrDJZtF+w1UfkMpANbXgAwOTZMY0HHnaFxRlMDJl6TsVEBmYpLJ4+47GdMpwhT9/0CsCel0DmxOq39H6L1GG7AoHvn7BhT/NaGlMSgbN+09Yn2Lo+/Nmv1ATiWysQb1uD/9HDUtc3r0WMIkEwJoj3qEwcJGpFyORxWU3V3z69ykUZuHWgVfCJI855/vfF+9eu4gamHLNH9/efmkSjTZvN+LOeZTAHAc1mVoRBklsLQY/8wYdA1duafLubdYmEzo9e8Iu0dDo+PK5vZFIQvM3cobTMXjl96fdZ6IkMk5p32yvahboIyecgoQ26EXHLOD+q9GoQSIZtFisEp5y68bC38afCJtR9NxO0fCES4684OxWSGRjmy6hhKfUEwGYZDK112kWMN74CSKDZAJmMQtFB/5yB5LqjE8279yZDYtbnGGR0Gc/2aHdckpwXFkbJqkA3PHPNmpYwumLP6mcWDbHnv/gVgnM8c/1rlwTJQVjGjzD0IVbVyBxY3L/z1G7qGE95xlldvTMAZ3ygxLOr4FI26DhlzfijHwNyek4mxkQATh8H1U1GGFXmNwjtOSK8QzWcVglo+Qszsi//cfVs1SDUC04Hpb0zroHn/78FgtDUG5c38okHhi2y2/XbKX4U+Ud31yLKD8sjnsMx06g88fUoY0OgRkAwMDUO3s5nS8Kb0eZaXHUGceto1M/qlvb25yyoujJD2ykZ9XVNyCKomJbA2BM05ZjNm5V9cJfB9ZFsSq2civ69E2L6Hnz8gUje7943ZF7bL3AaLFSMxGa/Xr7WlUfJdw7d9Dzl7YBAGsSDLA1n875ms6Hirg4jpl+9y+9z6oMmMRsVP2pRpctV/VQvKo4pyTdrAcrQVlZA9R549Fxu4TBqnMkh9aQUrIGOKrH73sZuroUH6EkZA1wRv+9JJ1oWKSTiUXKxhjg/FFCOqcMX7lxHbIRcN4oJZ0yK5UF2+JkgL4kHbNVWXhUwhhUHEZ1zGLRe5MmeplOmc2O42BMghg0PyDCrFZuaQabIBaH76Jm266WiRLhWhFmt+Mka0yi3E2XZao728AmSreso+PwitYkyT3ZR8eesMlhcU6Barap7D4OJjnMYXuYdXQcaxMEn9Ex+53cDJsQBufkqyYBJ0fGpGDQaCWFCai65xgkhPmMjokovBpRBgb1Nqgkg8rF1mZgcVEcu0QQrq6JHJMIpxwg1Wn2Ufe9cyQQmawzpvqSkb+SFM06ktueawJYk2XWoMOjh1w9bB/pnGabI9c+2wSITBbJAtcv4IvA/97fQNJJdlEduebZRoCNIoMjB3D3Mw3rHQMc/ND4faQ6zSZSHLn0+gqwQhjWfXkXd/94WtU7hvVArTr43wszSTrJJlIdOeU0QhZ89dekS3HFnJ3Ldl161/jqyDnxuv4HSHWRSBHmX12kaTMGbX4inbLYnfnsGR0/aeKD17/4J7Pekf1gAzPANVvolEVVVJWMU4/XvGkh5x3boUf/WZSsojreBhuUQdSbdCyxqiqf6dhfOGbub+f3p8suCrcdZGxABpWHU4SlFt3Rd+Jyxv9x2TBKltHxVQRkTN0xdMoMCqdO/X0mKX8NzT6VgnawwVjzBWNmVvjH7JH7hPNGZB8dv4EJxeJSOmZaC3/dWyicMTQBRDc1hw3DmJw/fHDLVjpO+D9d1tHxYURhWFxGoV/H70YkwziDqTSmwjg6H0oqV26kZp9q/mnwNFicIlQfLLI+Eej4ehgRetPRs3DSskQQzquCJmdQcUYIvyxMBGrqbDw5i3Ypqr9pa5LB8THKNPSio2/lxhQT0XFs0cQMKs0IYkVBMij3bIEnZdHmANUb3depZKDjQ4h8RbhHHf0feCtOjHE5MJ4MhtOf8r9HmZDKrQf7EuqsogSwdhglGeikF6yfgutVGMC6n5KD8yrBeJH5mS6EtT8mhuruo/yYljuoIaz/KTHo+D6sj8JdFPoXzvwuScYamMwZVJhGF8TP05JDuLSWD4t2hcogxi9ODmrqVNjMRbiZEsi/CSK8xYfF+3Rh/DwvQWK+gyhjxlSaHsrwldTEcPw9gskYDtpECUG5uIDJqdx8cOYsLhBlmIMPJAiV7WEz152uDIq1L6LMfco4DPlXksTxDwvTkzED6cLQzUxS4Yo6mTKouZwSRmpFoij1NNh+LNoVKkNUbvyZkiB0fBRRXzdRAskbkSwxX8vcR4wD2TI5WRzHAerDoMIMSiDbNlOTRLiiXmYsjt5LDWTt2mRRyglwP+cxUOHkeZSEOTMzER5SF8rEuclCxx4ofVh8wjiUacnzOdyDQe4MSiiDZyXOXxb1UXdZOI9MSxjl1kNxN4uTlBrK+yupCeOO76cjlWGqDMhnwop2o3SL8ALjMJTb7k0ljePTPRhjRtCFQR74LV/TGY3UCTmzwiGV6UydoZPFIZupwSiTVrljQ9ztbAaUvMqCHbtF6EHHstvphZQuFp+XbbwLdxDsX2XcS0htxqHbqGWY8PNl6XSCK9OU+1vDlqygqwrLcnFXIyqZ8Rpdmeb4bClENKnMGwFTInPIDmqZJpxSCaYkhatUWKYrdxxcmifpyjZq4UWISiJGlXmOD5TIoNE6Spn3NWwJInSmsMwbE5kSWLxGV9Yp19eHKcYgZ1J5YMcRsCU4ZDu1rKPwSkTFRLhChGW+Y68SPUpX9sUcBpPOIGd8eUC4tDpMMYdsp5Z9yp1HwaaJcIUIy4HCTojSWLxGVx5w7A5bxCCaWD6I2T+dxTF7qeUB4YxKMGNuobB8sKlZGpPzG125gMoLYIFB862U8oGwSxGLTlSWD2N+kO4lxuWGT4sYO5yunCCcWxkyqLaUUm5YXqNIjeXliKXVi1SYWo5YUh2CxVuMyw3L051RoFo+cBxhDYDJmaqufBDzVVgAi26U8oHKRWkMmv5HLQ8IF9eAAYDFx3TlAcd3YDEamfaxlAdEL0eUxqDRJmrZp9zWAiYNjB1NV/Y5Tso1xUToqlIe6IkI6Q1a76OWeerOhS1BrUWUsk44vwZMcQa/0ZV1joNhUaw1px1QLfueQlQCDKNjWa+pc2CLMbi8QLSsU66tD5POmKYbKCzrHccYg/QWfehYDngdNp1BnZUq5YC/z6WMszhflGW+8o8dcK0DywHCL5ZC4wwO36la5jk+iKkaM5yuHHA1pWZxVqxlnarbH9dgKk6mK+Oc/rUgNVicsV+1TNOY12JazOnFadmkwoEVpCZ8SceiSi2LhPpGJYhGixYbVIsoly+mcrOWLcL4HsDQGqEzhSSV6x4pUOZNo5QljmvOhTXocFU64bChFM5dVaYI17RFhFIatPyPQioLOv5Klz90LzVJtESqWsRpCVQ3n4sclNriZkmzp+bjyrwvKUx8LUYl1R4RSm+s/Y2OFLn6QnLN9GQ5sIVajHDxdXMoeuC3/dR0js8jQiYj3EghhUtPXqff/0SXICozCotTbmnyOgs5ITphObWIcGVdqReDessppPCcZ/jPOEqCCGePphajO+7drLKjHXDkOgpJx+dh+rV4U12RB5tvXDEpUajx+ztV08R894TfhJ/BAh+4FKmaamf6a5sSpXBl5VPXzUwWx9ED6EhqzEW1+i4v3P8/VGiBt0mlctNBUE8w0QDGpBacg1NfECaq7u65m6QqJ7Vpn0eOshVrvNnr+KfWUp1OtpmzaLKSKRfrBIume9fsSxLHz8ZTHOOvzhmz2LnUBfbK64cMb4FKr7KAH8LSu0G7lSz6URO88uNe1UR0/HNM8b8OOI8s5PfA1b//+9/Etx/9LsVdrX3AoGH3MUvy5vPfRtHR79PlodzWaSOn/w8Rbt3ODc3qfbmJxS5vD4NJGlhx7aW7fNfg4qcr/804OZR37viqKg6CxS3/vTBgDYu6rW88c8qKiMmqCKi+6p3BvPzIjdSkIPnsZZVq91x6qIlsvXP+2LB71u9vdT/v0FnATF5Wkz0bYv32pjvWUZJB165b/QrQn3wNOQaocsQxzR/oBABZTKXM66tVHbcM3KqlUM0O4ZTX3/76pSEU7m0NUyHnrg6H3T/ziSjXimk1zi1QpeOcOdRiRJjWOdHg0uaTqrv6vvJyDtCpz1XDeCciTK/xJmOSSlLFxeJESSU3rmRR50QkODqn3DJ/J6c81unKRydT7w1JMmO0CEVY/IZZdLrgm0fuHrRyM4uqKKnUYJTphWmd3BAU1ZeQjhQytXPRLx/2Htjt4mYNFjAmp97TptIhj38xf/JCkio8QKeBpFVROieqjvuOhA0H4621S6mF3Ld2yNHV6gA5AHDWMqaEXHAogJoPdO/x9xxyx0/zSRdQCUU3N4EJSGj4XfePOLY/WfAIWl76wFUdcnIsjlpNcY7zh1wC4Jy3Hun7wZKLTmr22B6KqDfV0ji+DYuQDVrPu6Qfe9w0jwWDL/lodJ0GQKWqFY79itSYLBjWGviYi3tf8dFxwNljSapzqhmRNMrSii5rZMKCQdv/9xw7uGGDgfnkU3cPvWjAoIev7tsMl0wjmRKu+fhCnDGNwpkvnQdz48z9LCoiWhqh5gsd86aoqFDTqWNXWARuUevnz2+uA5z7/h9Dzr13LDl/a96Ma1DzsveXsejaZ6rlXDp824xPTqhUEVWPuurJMbtSLOqcqKpTqroU5/QllZvG7GR6p6Rz7GstQjcWswqfr50btftu4eKFQ++/oW3FFkdf2igCTINrPptZQHJRM5iuv1z/+/JfqqJo/Wb3zV28rpDFCkluPaNx94n68xH9NmxavGDATdMLmLYvDMJDzbncfzVyouNGkOScW5HWVDjtqvtvv/X5p8cMH3oigPMfmTpp5qBnul1/0bldn+14/F2jpzwwMG/b9vW/kFs3jP2gDVD7obeufm3a7vwD+2c8+vT3w/NSbtbNMFlgcUys3H4tDOzXZEyOOhKoUBFA7YdHLIgXzBnc+/Kjq1dHlIsXRi1Zv27Fig0b3s85+86zgEYtWjTEGXe9cFGbzjWa91+8aS3T6+xf7rlnXd746jDIQosLRYXsnZMLdPqbseOmR2tXbmkqnVYLqNlrI0nuWPTvwBVzP//wgyfvur/rHfe0RNHcCEDVS9+elJq0Y3u/2SSpsRQhOXw8ubR6FCLC43QU5aQHHz8GTfeRjlxyJtDgpctq5ABN7xu4fQ1LrMJ/LqmBovXOfX21smiKVFFlsaKk09V1EMLgG0mJqnLv/s09m16/pIDquP+FKsDxDZH2oruuf2hV7CR2TqmkknM/PKfD5yMWkGQsFKUTltKJcFXtrDDAdJLUOEWS2wa9NXw7Vcg/L2z7Y+vTWjQ3yH2y8N9Fu1liIVnAoiLMfNbA4Jr5A6dtJ0lJFZKUmKQ6FvR/qam96KFzb3sjpSy9OKpzQq/ZA6Dxqb2u6PbujH0sGjtxoqSjm/vJfW+N/WsPqSKlIpWlVlVxxYpmlTGYu2lKe1Q6ukvPIYv2Ma06FyvDVBXnnAhLqy6VRag8d8+c52vVfq5fXbS544F+P/60dh/TamFhKhXHoqql0KLinBNRFiubN62ZO+qXUaN+GPXDqHkHSHJFtli03vv645817bB7+RE5X215yJ7drFrrq+4b8EveznyWUErOEu/ZsuD7oY8/2PO6mz4Z8uXdx77Yp/urt53Q6KCOb/3GzTWzJMKtB65f89RBX753NKJ53NojXn0+ijZocXzXO7t+NHrY9G1bhSWXbdu2bcv7ceTAHk88f/LFHdvc/tL4f+bkk+RqcicpJ1/U68IWl18ZIabFFxsf49gruHZyr0P+1MKxBeQLUa6tURnFVm1W56xbb77lxhtuvblLl5tvueW6Y+sf0qxZI+C2/89fMXfjhqVMq+KEzsXO8cN/2POHRjDZYWBnbZ2gk/sLyddmMCWMuaiixSn/nm5z0wDtIwANWiP9Zc+fCgCmRSHTqxMRJUklSeGiNW7MlJZR9sx0K7lnJ8WlvthNkqrbXwJwXrPIPtD/7uu6nFTrn0uaNK1/w2tnRE1b2MZv9N8z6shcG9lHNCUqqsLS7y/gvtVNkTUVZ3MvSSr33L2fSpJux0nW5ByO85QkVxz+47j1edOmsheA3GH5Y0cuHV8RFt/QMfPKzY2zxeKo/VRSqdz9wIFi2BdR4/NenJRKiZO9544aS86aoD/b9i1vyVuxRjm/Gkzd8RQvm7LoBFeEVG4fqMKiopMuBJ568yNVUqTHqIkpyd/MEXb0mCk7SRU935g7KUyo4+MSfM90ZL6+XrVarT5UUtlvPdPObzs+RarS8T3gB3V+NjZMhGEloPCrxj9+pkqSP8dplHPXOyFJx6mNL9lC9bOtZbZE6EZh+t1LqCWQhf12/UEhhX+voZKksljV3fd/7OhXeBWibHmWrpiCHSVRblu1fjm1yLj5lCIUTUfloF8pvq7OnieLUf63lFIcKZy2Md34hcWUUHX4aqofx2ezTzh7fsmoex1Z5Pf5pSO3peg55jew2WFxgagWUW7ez4wKZ62ils6/4w+RyZa2MYvZkiHlkmmU0qk34X91YYKcUAxZ4PoRjvlKXen8C9c3yZrjS5Bp4aA3KeFR5WLYpKgcvS4bhJ0RBTnBeRP98xlqNlyeNUfne1OufFskGzpniUHl2RRveadupATn+BxskOhvOm8bmv9DF5zwRkRBcv7x5nRO9Q8ZZ0Gn5FLObHIDJQuuSCrl3uVDcNROarmBGo/44Fg7jq78QE393hafMy5HUPkOOjsJ78oEczGPaLCDGpZy1zEwWQk5ozl+pQuLeuAU2KRi5n3bFrhHQ3PsnlCqnH4yEOGoA9TQxuYaJSTKV3KACkCVWZSwqPEpcD5CPoh2zzzxqIkwjC403pRAyv2dG71XyPE/ng70DC7meyhB/s6cMu/8W1aTo6+5v7pFx1g1tH5wkJmZk70vDiXd4ie+rYsIRxYwMOHsyigAYH7NmHLVCjqnz419EDkG9VZSQltSNUaEXox7KuqUeZ+/WAOAwRC6sJQbmuejSschXx6LS16LLJ4MjeQ5OBuSwumH4rpNO2oBHVU1LGHnjFT3PoNbU5xTHWi9n4GRd1ES4p5mrzvR+VWByrPoQlJd0yEiZIQXvIiO+pLquLA6DMaFJVxSAQrSxwt1I0WFa+sgB300DokanwUHeZTOB6mkcHUdRLiMqkGxfZZYnK5UH8piLA7ayMAuyZpTPI1Wor8oYV2aNe1CMRYfMy5fRHiIrvywtg6MRTuhBnVJos2rDmNQexklIMdnUYKcIiGsqlwkd3pQMfvBQU5jCBNPrwxYfMg4qPezptW2EL7rXsHA4gZKUB9miUHuLIon4Ybr70GRk1MM6t2sqTg3gJHnPgMDg9orKOE4/pqjKHO8Ud769B1YGFScHpJwRXWUk3DEE8M/yzHGWHzCOKTFicV4/NLpf1SDgcEDlJCWJJVy+4/rpiyqCpzUDOdRy4S5nqi6ZfqWvYehcrc6aLiaUgbk/uOLwu+X6dmo3iMHGEiXeLB4l7En5crdvADmglOA9xiHVCNIhJcDmBfzAnPEtd2AGykBLaoS5hVvlK9jXoyur55vcPJ+1VCU2w7Py/0lPLfKm18aizrrKKGQvAAHedlfvJn/1e6bv/0w2OgHumBUzw3zuj/G3H7qIq5shBz8n3E4zJ4n6LyR+x/bpROBCO8HdUEQi7MZ4r5vyJHGRLiaEooy/8QwZwURrxQ+jcig1XZqIMIl1VFipEonWIN66yjBLE44obSFhbE/0AWzPHvODmVZfRhYfBWM4/dWBDklpgbg+JeBQYQ7KYHEfBUlhkHNJZQgPoYFInQJRt3FcJTK/wYR81lEgMWxe6hBCFfXhaJUWRhIryIGTbYEs7Z2Fv0byAvpcifTBeE4voKJsySQ54vA4uVAYvaDJaiJRtIF0TdNhG7BfJE9Fm8wDsDx3mKujCWQz7Pp3RCUPAcWgEWrfdQwvsimd0JgzKcQATCov5ISxgfZ9F4gvdIZ/EoXgrBL9kR4KZAX0sDiizAc780ei/bUIJ5NF+FWDUJ4BaI4FwTh+C5sEYu2BdQgrsqmCwP5y8IAMGi+JQjHN2Cz+zunGDOBLojJOUZhLg7kn2IMfg9Cua0l4pycTw1hsk2DCH2CoPJiOIhBzWWUEH5FcfeH4fgESpgagcyK0lmcGlMDiDnAOLnRxjBus71BCOdVQrk9hmiMmJ9NF4Bya6vUlHoW7BjEd0FQeSHO7eTiCk+H4fRZSpilAQhX14epdQ8j5puBVgXxuynOtCM1AMf+Ugw08xudL+WBx2BRO2J3EMIFCyiG+YCxv/2XlkBUmE0XxPzFOP38Cdc3gSkG4etA5gX62F/MT2FRfEFvxkEsykzYFVEJjGtVg/hjJi/l3rYwJWpHqr+Y71CI0i+A/cfDlqj1jhCcPhzoFW9UXlMioeJcij/yfBzmJoqvmK8jKlHutACUe44OdCnV33uwJcDiHcbehNMroDAd/Amn5cKUIMJTdN5ifgYTpr0/5a7WsCWwuID+hd1R4lzmj+RFpTjuANWX8iI4TscAYn0OUQkMqi+l+Lsse0SbHVRvfLUUuZNDuDSbaq6i+Hu5RLB4h3Gi1VmTBR/4c3wGJU7d/7LgVoqvmN8Yh1GlP7PgAqov4cIqKAjGZ4yDOzMOYFnNSP1DeKlkBnVWUTyRhe1wnC9CeAO2ZNWX+VOeG+kOii/hFAvTAGMG0flyfJASpeDyEP6tVjKLjxj7ivlupGv8KQuPhm37IoQ34hjnFKovKq8qTW86f2/GERrkUXzF7IOorQM10RpuCuGZ0nRMuKqz/DkOgB0OLL6m8/ePhYbkW3/C+TVKcXnSDWTsSxkfCzedk0q0CPdT/KWOK5HBQRsoqV2bBa22UVPrkgV11lASszh5n6q3+PhS1F2baAaNNtFf/tGlWZNwTf05zq8CNdXLS7iDtgcwAoamytMTrsYCiqeYzyFqgcWXjBODwRA6b71KNSDZLEZ4c3ysVF8l3TBvwutghyTCI96Ul5aqf9Ld7C1mL0Qdvkm62wN4rlRP0OV2mzfHV2CbIlxBya1rABMN1HZNAK9Hsmh3QNXX3KqluSqAfjiOwcHb6UlZcBTcdp034Zx5FOjQXf7k7JJZnJGv3r5YDNV4gy86Po7SYlB/PcXX56EMxtB5e6I0jTYlGgxGh1d7WdL9GBoMBtEl26jgLIYkW4THA3iyVB8kXbcAHi1FhJsoyXafLyXPhIfE4qwCVS/C5XWhDl2SrsVu+nGcZkthcfweVS/KfdviSK33efs7txQGTbbSD8l9YzXb4m1mVKoG67zpXpEMzB90ngbD0GYwms4T9w5l8KunmM8gaoPB8KT7zdvLGRiZdL97cvwNpoPFIH/7RILBGG9jDdTlNU9K2SNUhKe9/ZNTGoPhnoQrV0ShHvT2d24pjLFjvI0twXp4mxaVBo03Ur3E+haFxISr65eqyRZPwltxrPs9UdkZpcnitP3qRbm7DYpk8aEvxzfgpgg3UuhTuLhqKGMw3t8koBaLBz05DrUi1hhfqnuOx23fMvbUHQ6Fesspfuj4SpvBUDovyguyy+Kw/VRvE41qBnVWUnwINx0MRYrQKRZ6Vm5bH7c03uTHcVxkgt1H5033b9FWL89Xb1hi3eXPcfPqqGbRdreqD+H1WXevN+Hu1xD1CNdS6NNxQJZZnB6renH8753rcVNnT8IVNaFIxlScos6HcNN5Uzo0WdzhSVnYDo6ECPfQhzLv1HOmV0FNXzL2QsfuWWZN43UqGVPm9/zg77dhmr7yFXOQUShYPEWXufzBC1euuBVlqoTLaqBYpuEaSqa4ZyPXb20Ft33hi5o6C4eCxat0GSNjzsqFGoyp/DfFk+Pr0SLzAuPMqdP+sLSgbp434fRZFMriKlXNGB2HGaOmRiGsb5x1Zyk9KHcfYtxgcaUqfSuvR5RVEXoypkdhd7R9yNhbrB/CZpXFADo/y2pJFYPKMyjeHP+0MFlkEE33Q2FfXLE4LVZ6F64/OKssWu+k+tHVK6DahQxAyXawWRShO4V+Ha/Bte6UENxJWWXwI523t+alMRHe1zgEbZdNFo3WUjwpf92QcRbXUwPQ37eIdYyjehJ+skzFoOV2UW/CGzFxDWotVufJ8XnEeIt3mfIlunFNFAgWd5LO1524Ykzz5RRPjr0woY19OUW/osdTKjA47FcVL8LFDaVYAI59b69q5hwXLI1qyEFnetIbYaJbNNvGzKnqXZhGa5+j8yFcVdMonj1L6dHxcTUZjPHj2BuW8ELtpRQfk1GDxfl7VX0IO5lEqLpMvLyDa8ZU+YuOPh3fRQJgzSeMNVMiu5u3WJynSq/CJbWgeAbNJzDDKmRPmJbO9ESVs+B4AKp0Xkztg9z/TgWjBoM2u0T9OD6FkoEBvqXrprpwXE+U0qIfC/3E8n4yIIqGZkC5feiap01UMmMOnUfnRDPneC2cgsWgDJBKXgJbMhgc/AN9xlzYxCgFY3/KCKmnlwozc9Ovn06lZEQd15wES4YGDdarZoRnlQ4JrZZvU80IOfZwWCTRZBczdFoGKPYYoTKTsuGxXFgkRf2/dmZE2TkTxv8OaCZUpTOMRVKY6gPWqmYglicQZYYZ4daW1iIpLV5lpi8wGTkmzojjFAOTECZCZ1HJhMrk2sigUHcpJSOfwCIhLRotpDAjbmWfFvUzUWOOxBl5AFFCGFzSewc1I0V/bgx1MY5kJpWpPXEKBrlfkspMiys8Be4Ccj9ZuKgUqkW2zcGYCk9SHTMv7IrSzdjDZlBKRFJ183opGIMb6ZQeHZ/JhMU9dCxeuXb1+v2OE5HiGTSt/X919NOzdLLNb54lUgJqalX/kf8Mb4tIsGabV3epenqqdMbtBVSWVlKzohRM9auESk8/GnWhxz4KS6lK8mpKPGOqvUxHX5OBmuRrSWEGHUfMSOEsjh+2j+pHuKZBm1jtLhFmUrhkGeKZik9MjZV+VfV83IL1EF1GVDftiaMZVPhbhL4dH6Y0iSczROGZlGg26nZANYDuXfRUppzeM6NgFoetojCAp9vEyq9kjJ8soFio2XWnaghjUNvs65kSfr5csGp1PqEyQMdxSC3Si5lS/rUljhRVvuBAKGM7sOJXlEz9tnkoi2oTRBjGb12abadman82mco4ZiKVgfw5R1uTzUlkoqMOn82YYQr/Xa7J4vR8ZcaOzB6Yho8UxhrMwqU6vEaXucOzQ7KtVe25TaoMVDX/qCaDkRmjuM6IwpMAHPdQTGU47ixcszh6m2qmHB/KBlh1YZU+ebspDNfxUkotMpdTmLkHw5PXnjv14S9JKrPF4iU6Dy/BBmaAw6/9jXSqDOs2XDGot5iSMeHEtjBhIfeqAXsowsAdX0YVi4uo9DCnfljWtJ1MUhi843NNj6jLnOOfTWBDAp5i7JTZ8HzNoOJ8SuaUeW3CqnH2JhFmo+NzDebKWOljX6ugTOW3VZiVKX1JNQyl87KrZVjVJtJlgYqQF+Ix1rTZqepld1AW91EYtFKURVd/tvVKjEM/OvppBRPSAMZhUUnndv3x+pG1N9oZAUabPap+dlxcMRyDmgspIaiSVBXn9nDNWv72yoUHRcCMGh/T0c/u1gip8RZqCKRzLLr44w+v+2bs6XUqWBgxao7ao+qrJWxALbf5U5U4fzfJPfvmvf3EY42qHFETJS70oaMf3dkMJpgI16gwxDHDfvroosOOqIn01pRAzMzwxh8qBXUFU+pHdVfejAG9ulZAUWtNUZTUnOFUvYj7o5lFuMbU/JN0TjOnyj9b1695cEVYa61BBsXjdPQpuva4CCEbNHp1H0mVWEREVVRURFSLaMw9459GUYMMi/kPPCnXNYYJCcFOVz73wz89OqdK7n23ZXVLEn1bdHRCPwcenDXTLQNbHHL13R8sXbo4P39V3opVyxbO+6eAJJe/eFwEzyb3DTovwnGHMG3gIoD5GtWrHn9C3WOefe/9p9556qXRn3c8rxUAYyZj8aUvHV5RRLSLSV+x9QWXnNP+OKSNLDwb2AmeyBcRY1TGGGsN0htjrbXwbtBsK9WHcvNJcJi6sdZYg0AtWu324/hFfaNwYVu02uVFU/HNlS2DanDQLpHMKTn6cJhhgTEfkM6JZsRx3fvnVTQYGlR6Yh9JqovjOHbOxU6KKMnto2qgbD7vheGrDrDkzqV0288/v1gnsmWRsQBqHd/+yc8+/fSLkYOH9/viXxYd1KQmymwbGZTYXvXL8IHv3VAZsKasAmCsjay11hhjI1sBRY1BOdIYaw3KkwbZCgBWUDggYBAAAHBsAJ0BKpEACAI+eTyZSqSjIimiEYj5MA8JaW5mZDHZz/ge9fAhQRMXP0QoYe/ZVJ4LstaymXf2j/eesbop+ufYI/l/9j64HolfsKIauFo6cOonjO/okC32m+V2aI3yrjnDyoNFefoictdF9ouYKpHabw+oykT48h+EELrPjalCJ6kf1qoDFpYZR4LtJCmiIaks+Onx/Z4/snYpnFTZdhgJE/Z+/3W1X3Q3BYIPLDL049wWHZZ9FAHCaLqCLesFUsX6sRxz3P7Xzoj7Ld81pI222YUTreXBZe3E0422vpog822FkNPFoD3I/uP4wxB/y4Z7jidH/vPvbMRwmN+awxKJxyULanaLDvAblrwlHQTmxcjGrhjxmrIycMd/aYo7MjzecqTq5Q0x2KSC2lL7bLN0TISfbnpjTJcT6FvdvNQQBjm+wr8Iy7riFxZW9j4ZyPtZOXS9iUdhB9IJ2mHnxIAF4RhVGdPF0GlrxTqQ/WtWgArr9l6uiy1HF4gD/FnoAX7WdsHvOFZdPfFzIcKLfY32uMxazr2x/KljI15Bqur+WfQ37Hj3Cik+YtLeBzgcRfQbK5oRmEdV8Chrhthx0pVSEGq3Efa3UUPK9ht7PqUP7MbpJrBaGNyXeXfXGA74Ds1fdCLeHxISFMO4smwqYWP7W88/7brFPdLqO4u0FYdN2ENYlMfoVslOZM1bP9GpaGa49LYtf3ICFdNYxi98XsZbIHfJjvrGQzk7T2v2XjIklQw77yOVIrcCGzx/kDNua8nd2Rp4yBn/HZTeUf2R8H5ZvYmhjArpFVInN+8OzS0I9xzbb2tfbQJIRTiOrhvWf9J/hX5+Sh9hm0V6YlwurMZOuYw3U6Tq1v3jxyv9Nnes/UF4IvI0/PBGdWRtB3Vk/V3DtpjRjJpdEF9OqpJmroxRUPjkpATG5Q6vEBZCkfu8DZyw96V0lPYdByhbIg3ve9DJCmNUfwPY3I/l16T6PaybvEPY/AVYrkS9C+LKCp9Sr6O9fULWvb1SRhE1XdspCHvxWfD+XWy0NmaAhlkVFsFbDbcDG4WkdSoY+uE3BuIMZFqAbMx3HTPTE2zMAUTMTNyqosPJVseJYo/+f/62LRcIjsh7k+zxQiQwtMxtRSna2EIlkWoCq4TOEezKdx8/rpXCHvXgEihQHuM/8AD+/FzTtCd6Pezkqp6qelKMeNiJ3IOwUjwMrrswvQcr8F04wd0HttI2e/WIZbTInO0L341jNaergU21FQhJSbCxwlGI2UIiQ9uUk10YIBGDBhAVy8U1s06StPfsCDk6ZxVMsHI8DADW7IZyMPjzULitDettcmJ1DHt2Zu8T/4KODMKopeJSUg7+9QmHXwAkQKZYU09haQ7Rb+y2NbveE+FnbzZPLzTLgK3DRnVp9lREJh/LTpbls5KWcm7wAID1fdsymEov3k5YKM+6B9EEQnTXvwreWfvp8gLK/QD6KYtP75Agh7myceonXBflb01RzL7ySFQVqd5JT4XdzAHPvMb+/ubDhwW9ivNh8dwGnLjPPISFFzLpQU0/ptx4G/O4HUOYeGZL/cZ5bHd6ojcV2Hzlvjqg1bhxMaWw2N42mz6XdyN1oya+8bjjC9lavnAoH1TjvrWfXvGw9zu5tkqILSiRAgKqSYq5B9BIrrYtcQSelJrxnRDYZOYF1pxTp066OwCdMqvNeRWT3Y5a5HlswfWvPOaeIIRPr495UrZtO95+VvhyCL+Wtf9wYD7fnWrMKwWanFxj9P8sLjvAXcwb+0oWgfkjhO6s2owl1raOqjecspIgaLuiM5SieSPbHEOIpgNXyAlTmhp9D7Ak6w2S2H0QO0WKlOzpa1BKpx4IAweAfmZHCIyRY9H14HaC56GXnQ7IiXlpXWYUW5wYnsO9su/vKQwnwhpEVVzoJn/Hypprj5nePnaAgRwekYNKxVDiGZofC0jo26guonRs1uLrgIE6LNvCYA2sEXY5mtvPe+3hPrlmD3VOagnH1F61Yk5px0TkMl6F5bdGHzX1gm9IhJCM4ISxPgHePCmAweBO28VT/fHfb+1MIGJ2QZICYUhLTCMZATKvZi9iAYls39lulsl9rU100lNFVowiogauKYjhuC1h80CwDYo4SA4lJADKAI6bUf3SZkqInxK+GPPQeEqpBCrY5wm1tDJygWv4mIKj2tcqFAGNvWtfrTzQhqKMhfp3rFOneiriNJePKB7AghCgvicAfQa8UnCfPKtcU6oJLwDOCBD6lLcY9AOVnJO/Yqjmgacd9fy7+yQsjTn2R1xTpS4ffX49rZNORrAnNELx0Fs9EjsFHsNNxBYhdeTXuL8F0Tq/mcWGI+6IR/uGF7s8mgECZ0IJBD3skYOL7g3MfzjCzZAjv+wNrwyaAZBHLBTsc+u7kEZWxuvU8wrztInG5PFsrmSxOoes7tWhPZuqOhyfHHgLssPwRRTJE5q4lxCbJTeMAkLR1nIRWAduIfSA4RqzLvnEbQMONIvcOnNVubLDkmMvkdIX5RQMdLz9rKvSbu5ZD13lZhMiPnkyjSR0BHb/4B8p0AibtTW/GMPn0f3Myty8vD/SIuP1+a5qchGxB+H+ev6/l98NfTdgQqEf65kl4rDJLmsTuoUs4JDam6gVB8WZ3z7Frl4dGLubJYCvPO21F/uILBElZBpU0SVTzcJOoI454v2mjslmBoDP3bUusP6PoePVNJe9TupTRdTYC9qxO3xr3fnmgm9iTZ5q271RSjVPXEWJ/rkuMCUWgOXosjUoQp5GgFoGA6ZF/q5Iur37Kc+vAqH2rYh9Cge492GSn9rmeuMe+aVF7cLgWGE2Uy9HdUihTYU5GnIqjxEsWixXjSKXw3xxpPOFglKjLTTsQI/fgdCJCrJ8yPBZaT9ro8JCslXt/pLTbSMS3XH2Sc01YoLANyGKA7SIy4pUPBIgbAl9t2puNoW6ouXYXcXf5Y1jYselKVJPzuGnZS0QuKwhAkWAhQXgf/5HbW8PX/WoBMC+Rbw87BPXOv49ARSlG1vjAf7vQ1Qpj0aLMEhhlhPm1l+0cQ8beW+b/v/sZ0+o/MkZQlsKvgnnstmK6LECJ2CI9w62DUSJZ8XSG1Gz9T7pkDPiy55KhTYkz+UyneKNBhTTySg45Ynr0iJdWmhUMhBzF7lJedYv6Uv84I2KV6F8rir86Cfu5Ljfi1ITAyOuu/5kybOS9HFLvMZOj01PzZw7zx2Fw7Tozv2s4sULhvVOC4AMbAdx0Yvy/1y9Q6M3+OzYl6AB3ECXaLtDoRm+F9cfSyFJhuCsAVeAlk0Y5nZkEd+fZX6w34dyizXkXcD6mkTTAcV0MOqnoluz8PqeShfx6SSAa6vJpsDYKABM0hvJzbEArAtISL3fboOpOPOTYsVFX99gFdax3YI0Kf58mkwYRQRA7fVxNfnwqpG3dRFF0niqQAvIcwiZE0FBHchL9ALDiQEe5KpioSCnwX66fOZOGwLJkIuDqQqXVRKAxTjfnkfNX8qvJdsTeFiymrevIbnDP7oqZmFIOD5xbb+wAL7OzuUVMX0MOQdakkDpc73YOuWd3f6al7FhZ9pxI4mEkor2DCuKq1uPFu+KKjyyaQA9+iXutWgcowHbusGC0mHnCpUt6RzboXMTQeK097nNBEtvbCXaTiMmgs4zX4NmwGPr2RFSq/n4+1qbJNndob47jyeewyGqBSyN9ePxYzODM2Byzr9WYse1yetmsOW0RDxPC9qERoawG/kZAE7RVgno9LZ8qa/AT1tn4Lc84ZjkgOR5YAQk1XTVOPaTJqOStxDVg1Xs6f/zGOK27I1lweVtpFKOzNXDLPeyuNPzQCY9EgHPj8Yk4TjvcMHpEmNdhdXw8WwgmhXyzv+mkbmSoyJm9BrPD1+dJmCQg1i6guQ0m/zkXbkF/P5rDczyT36KCdsrUqAVO73gMENcaA+3rWraQXBUyr95+5GhAG/qwyi79FammUzqKAp34zCrsYbdR/g2wRmFPJ3jRTvKaa5dP7pGvngRcA+TdMf8P/gtJZlSsrPCcz97O/e9xijB/7Ur1Fbvj3mNQiiyVTgRtMxs3pCD9LpM2RaccDu5osDmz28zZX86mY9ca/CpjJ7GG4f0gQ+zxbfd1WaBeLRgEYc3Z4dG8gfyAsmjDbHO/irp+zN+H+Cmlj9RGWu8sgAsfhoIZFA26o+CsbB3AjRSdMUkchaDDayNDM6mK3K+oC2yU7ybyqSZLRUJ1V7naUvz2LHfdROPz1N6Ey9YK7oxWIsGXlj6Ost9GdCIv1wWPx3HLoPyM/9fIaW6t1KummjW/x92c/2aE/58yF/74/Twvi1v+ui97g4LTRWRuRXcmSuoR/s6KaXQRfgRagzLiMI0Mfh806tdT223Qtj6S/Xux1jl5hE7iBZuO9fIrGbgD5tNzTW2rdwYqDf2mY3hnupYFvb3a5mBXKJ10R02qTigmqUfKtaek3yDriClpj8OyLbRzNKvLwHzuvCoaLlg5aLzQVP/zuVuXKylVlTmhHkx7IiaAHoNC7vwh+8Ag+mu5cXv8fh0snANoiG97+J+ODYJaT9VhXHuc76LDZLr/igihueMC5cfPPv4oLPTnpu0llfdxB+aHnl/OP67lz7ZgQgeqMEmvN05EnVGvlxuHy5+vGeMrS4oRu/qLS4AXOLNUjrJIXCY4yMPeck2I6Lfb70z2l1Nh7FtbXgiC8ZS4vNr8UxOS5NxxIPQxlV1W32jz2ilXJnjcBBxxpSnlJW2V5xcXhOzAQv1no6uLDH4nY8zjE6XnCrXjzGqHKeQgZHXHD2nInkfmJXr07CD95fZLNtZ8r3mhRTpf+jnZfjYwZGb1rDd36/T4v9E0Dh5Oh9UsdIqc44iRSSJTPdr0YdPCfNJ/a3n55b4cAku7SQdba6y+KjxYhQa7ivG+S6LRrNSQZiQgWp617CysvJ/CSWxFvaoAs6L7Ljl9mUf11sAE7tCnrX5h0obFhuIWVy3C/04kQIyYHweID0Y9XrHmlyiW4mC/KtITLYB8XRi+kvziutAdyNUJ9nA9tqdoahAqFZ3WwHXTVdfptWwbCghEN5m1PVIVnEtabNLNP4WGMBwDK+up7iWkJw0pslW2S4xfsLINcOmai+m8tUCYuybEyR+iBbo4aYNpVnKWxoRdB5cH+uaCiQcK6QstRcO+eiP4smd6/fqbf1DrxhpWzwx9fk3elkPPN5g7BE1awgZoEkQGzjm417H20zkHe0O6cM1eXQMBdCCS7kzmkCTMEwdQLadXkAKgvJkZY4KRnjX8hcpKOZtk5PzFVdxux5EmpMReXmVMUDbuVrboCvbiiWNowUM0EoBJQw1UP1+97Zp15Pe6iHDAGJGlMSJ4w6B+pLUm2zNO3nTkotO+9ohxMs+R9rex3KxheHodZ9bHmX4/okau99KzsPSnLboBtghxVVEffZqLzX5rtJRB+992LNjmh7ayLNTrSaiI62RwlU0rJyWZsZY9Lib6dcUkXXjI4pgz47vXJfO6WQAEVBJAgS5/0DMdS5pm0/TIgfiUHm1zJYn2Jyw23wanWegXepDSh+8JRUrPN/87CYCCZogDOgRqINuvJpshIlGbZv2zrvg31uZv9nx0vOkAAA=",
  "v2_slim": "data:image/webp;base64,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",
  "v3_lean": "data:image/webp;base64,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",
  "v4_fit": "data:image/webp;base64,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",
  "v5_athletic": "data:image/webp;base64,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",
  "v6_stocky": "data:image/webp;base64,UklGRuIuAABXRUJQVlA4WAoAAAAQAAAAxwAABwIAQUxQSIEaAAABwIZtm2q3rd7vG8mWIWbHEIeZmbkQdBgcaE6YoUzhMoaZT+MwM3PaMKdhZiaDbGnN970/bEl7z6w9us75FRETgLoWQX9QVQFVKT1RAAOHANCyU2C9ky599Lmpew6Elpxi0mmzOdfH14KWmoQ2bPk2GaNZjPx0HUiRSQCwzUxWzrlWfHdCCDqnlJQEYPzWJ81gZM8V90WPWkyiwOhfvEnS2Uvze0645OKLp562RRtUykiB4Tu8TFp0NvamVQDtQYoGY37+GhmNfY+xqmJ0dv5+MILOoShXUdn9LdKNTYzko+sCEkLAgdtBi0RCGw4lo7G5Hjn7TysCwMYvr1UoALadbpHNN3LWdXvtfUvXfhAUqMi8W07+gsYUPZLkd3tDUaABuJlGZ6JexU82g0qBKEZe2W10puv8+BCIFodg1X/TmbaTfwK0MATLfcaKqVvkRRNRloKFX2BkhsYPd4RCtBAEARvSmUX1+braFlCSR3jMg++OBiBragkofrPu4MH3Mw8aL1lzrR9dcX0QKYGfPLQQHvVM6Kz8vRNGoAgF5//nB3+lZcLvPjpjGApRBFfw2dc8F/LjtTWUARTrX/b0yVUu5o/MBy0ECPAwPZfIe1QBKQOE7W9xy8V99oYY144yVBxJY7bO93eZF4NaX4C0tYXzPGbkb5w48U/HQVubYJlfA1igk54P2fXZzHuXhLQ4GXTiDUf85gFnxu4f3binoADlBLrTMzI+CEBanwALbvhJVs7Ze0FRgKL4HSNzNk5bDFICGP0BLSvOfvUshZTA+E/oObnPWnuwogAFC32eF+3Fv6IIArahM2fjYTuOhxSAYvlvY2Y3LaaCIuw4dbZ7RvzGJ0OLIGAKnfka/7NXB8owYL84y/OJfBiQMlD88PytZ9Nz8e7PV4aWgWD0rZM/zsbZudFQQTGOXOoDWibsfPpoaCEIFvve4Z3meTinb7x1QCEqVn/6/idoeRhf7ICWAoAw+aUruj0HZ/cTgwCEoColIJiw6IgXGLOY+Y9BQ4ZgrhKCtDoIhpz59GfMsnrtvy+9dNuJB2+y2jAAEJXWBhm8750vfkDPoJez37z+b9tOAqDS2tDx6/WO7I709MzMYmXOOT+6/qDxgLSyuW7WzUh6aj27xWgkPzy6A9Lagi6094ucwbw9Gnn3GEhLm/OEC46rXs+KpFe8b7hIaxMZjt0em+qeF1nxBGhrg0DalnuGMTe3rpWgLU0CsM1Tnc7sI49GaGUKrHAla7Hyi6EtTDDpH9PpVgfGlwZDWpRg/PAVniEja9H42jwtCxp2/ZaVsx6dny3YsgKOqBhZn7Y+tDUpNpxBY31G/i+CtCKRSS8xsk6NxyK0IsXZrFirbrMnI7QewZAXzeqF7tN+AG05iiU66TXDyNcnQVrP9yuvHUY+MRLScjaNNcTIc9q05SzRyRpi5HbQFiOrd9WS+UvzQlpKwB401nHkoQitRDD8+brymyAtRGTQJTTWE++BSOtQ7MLIuro3hNYhGPCY1ZXxOYFqq1AsP8O9ppzfnLYaoNoq1q+cNd550aqAaisQGfUOrbY8krMuXAVQrT1pAx5irC3SI9l54SqASq1JAMaf9p17jZEeyZmnLg6o1FcARh/1PuvfI/nN0eMAlXoSRfuU58hYf6RH8p0ftaGeA7D5XWR0tkaP5B3LzDOkflQw8QTSjK3TjJ8eMqRDakaBKe/QIltrZLxgEYQ6UcVyV5ORLdeNNwyF1ocC+3xFM7Zgj3xwArQuAiZeSFZs0RVvGwuph4DFX6Q5W3bFR4ZBakACtnuPFVt5xRuHiNQAdu5iZGuv+BeE7EaFHWYzstVXvh80L9Eh+82kseWbf7kqNCvF5jNoLMDIx4aoZCRY+B1GFmHkcdB8RAfeysgy9DhjTWg2AUezYikaHxuikoliic/NioGRx0LzEB1wCyPL0e2rJSBZKKYwsiQjr4XmIDLvm25FQeteH5qB4khGFgYfHyySnMi4990Kg8Y9oMkpjmRkaUZ/ZrBIYoJ533crDhr3gCamOJDG8ox8ZpBIUiKDX/YSoXFPaFKKHd1YJm+PgiQkMuBRxiKhcQ9oQoqdaSzTyCcGQNKRcJfHQqF3bSiajGL+r+mlUvFcpPQjM5aq89OFIamI3MlYLIw8BpqIYo1OZ8H4o22QNAJ+z1gw7t0biyYhMvx5WsEw8kykodiEzpI1vjkSksbvGIuGxj0REhAMeJpWNpHXQhJQ/LBylq3zi/mhKZzPqnAYuSdC0wSj3qGVzzWQpgVsTffScX6+ALRZivMYWbzGPRGaJOh4jlY+kdeKNEmxVpd7+Rg/GA1p1u8YWcAeN4U2RdDxFK2EIk9rkmLpGfQSMr4+DNKMgIM8soidW0KbIXIbC6ni7xCaoFjiG3oZRV4DaULALjSWsfPrhaCNU7mQsZBo3BOhYYLBr9JKKfrZ0CYs+Q29mPjMAEijAg5jZCm7z14T2ijBpV4VEyN/itAgwbDXaCV1OaRBitUjvZyMT3VAGhPwE0aWs3PGctDGCO4oKhp3RmiIYuLHtJKK/EvDVjd6SVW8HNqQgJ97ZEkbnx0EaYBI+4MsK+dXizREsdg0elHRfHOEBgTs5MayjvxVQxQnsSqsihdD+yZof4SxsIzPd0D6pFjsW3pxvT+uAQE7ubG4fQNonxQnMRaXc9O+iQx8pMAqHonQF8Uqs+nFFXmJaF8CDmRkcRufa4P0QXERqxJ7ZWRfBGPfopWX01aG9k6xDovcuAdC7wIOZCyxisf0QQQ3l1nkn/qCed+nldndgPRGsQHpJWZ8a2xfzmVkiTu7l4P2QhAeLbbZK/VKsfBX9CJj5P4IvQjYzo2l9uNeKf7GWGyXQHsSDH6BVmy3Q3pSLD+TXmjGl0dCegj4CSML3Tl94Z5Ewj0F5zNWhs5NsfQ0eqnRfGeEuQX8hJHFHrlfT4IrWZXc36FzEYz/iF5yV/ag2JXGkru6F2eyKrrL5iZof5JWdI8NhgBQLDuDXnDGd0b2sBaLLvKuIT2s4YV352CZ2yrdhXcaFAAEQ1+hFd3eCHNAcZFX5eY+cw1oDzvRCo7fzA+Zi2CJ7+jFFvnowF60P0IruEugmLviPFbFZr4bQg8BxzCWmnPGYtBeTKaVWuTdbSK92KbcKv4OAb3YutyMu/YPnNMXh/YHIu8OIr3ZpuCOgKI3k4uN3Wv04VeMZWZ8bRikJ5H2f5daxcsh6Fmx0ix6mUUeitCr3zCyzJ0/7I0gPFxqxrfGQnpSrNflXmYVL4egN6cxsszND0ToSdD+RKk5py8B7Umx1Ax6mRmfHAjpzeLTSy3yDCh6Fug9HsvMfHeEXkAGnEArMufMpaG9kkW/dCuxyP8MgPQGgpNZaL9DQO9k/Ce08nLn5tDeQfFLj+VlfH0YpA8iw96mFVfF06Doq+L3jMXl3Ez6FmRHWmkZXx8O6ZPit4ylFXkGFH0VGf0WrbDcutdpgOIXjCzsyHvaBH0VDH7JrbDcpq0C7ZNicnSWtUf+DIo+B/yasazM+Tso+q7Yml5UkX48BA1ZaqZ5QUV+uzWkIVCcy+5i8sjnNoaisSKj76YVkpOnLwZFowWj7qMVkXP6n4CAxrfhQMYScp+5KUTRRJU/lpHxuaCCpuDiMoo8QRRNDTjGi8i5LZq2L6si6lq/WYpFP2VVPsZ3R0CaA8HGX9GiF070U6FotmLle1m8FbdAaBoUHVufP4NeLO6x4sWDBAkqgGsZS8VI8t5x0BQg7bqVu5eJ0z66bOcBSFUx35csE+NVa8wPQFKB4FqPpeFO7+YLHYCoINmAvWilQTrZuSPaBCkLFvyKXhb+4Sx+cuc6EKQt0Ps8lgV/sPwmCwCC1AP+zqokIu8cCACK5BVrTDcvCOOeaFMRZKjYjyXp3ASKTFV+02klsUU+AtzJWBCb5wPBjSXhGQnGvksrBuOWOY1+sxyMr06E5ALBTYyF4Pb1QRBkdHMpuHfvEtqQb8AxpUCzraFZfd/cyyByf4SMBENfppXCvllBcYrHfkGQXWn9AsGET2n9AQguY+wXKHah9RPWYxnWwUb/57Cu9RdWmkXvDwhGv03rHwx5ud/wav8AIpcw9gsUp7Aqg/3yO70U9szvzFL4AzS3fWhlcENuAZvRy+Dq/CaXwjX5bdlv2KIUrs1v61K4KjfBKtPdi+DxDkhmI9+lFYDx3dHZjXmvCJyfTcxu9If9BGm7k7E/AMVFrPoJU/sNF/+fwyX9hrP7CQF70PoJU/oNu/x/hfn6C5+Oz29KIXyzNDQvxdLf0lsfjTsh5CWY8Hl/Yb4v+guTvuovjH2vfwDBjYz9hOv6DTf2ExSXF8KU7AIOKwObXAP7lYDzi/kh2R1QBp9NqIG9C2FidooVZtL7B4tO7y8sPq0IPq+DJToLwPj+2OwEI16itbzIF4fmJ7iDsQCugyC/+4vgGmhuENzYTwj4db/h5/2GH/cTFGtX9My8FFbMrwYjr62FJafl1v0xPb8ra0DQ/gRjTs7pf+/OzvjsUEh+4dG8jP9d9Wt6Zs4vJ9bCk7m9OfJWxvwWzg+K8/KKnBoOpWVG8+0Qsgs4nlVOFU/A6t303DilFn7JmJNxNwx/mZbd9jWgWJ/0jLx7bWAqq8wifwetgbU9J+c3SwAH0TKreEktrM+cIm8VxWpd9NzOr4Ulv82p4kkIGPg4Y16RV4tkJ+h4gZaPcRcExcm5Gd8eDqmB5/LaESFgF1pu74zMD4LrGbNxn7YqVLHIF/TWpziXVTbGT8ZCILidsfUF/CmjyIcGQBBwXAkotqJndB4UCNgkWglsmtWBCIBgwsf0AlinKxv3rg2hACD3MrY8wch3aLnwi4kQAIpTi2Doq9lEPtDWww/dvdVBMZUxm6shmMvET2hZvTWiHs5jlc0vEeaA4HbGrF4YXAcBB9Aycduqh4A/epVR5A0qqIPtcnFOWwzaw260jCqeD62Fjbo8D+PboyFzUSwxk57Tv2pBsOBX9Cwib2yTuQnCXYw5nV0Tg5+lZfJrBMw94DhW+Rj3QKgBKK5izOSoXig2o+e0XV2cm82RvRCMf5+WTeQh9RCwTw1AcBmrjC6H1sNuXgMBRzBmY3xtKKQGFEtNo+dxVG8Ua832jD6ZvyYW+iaXmyA9CYa/QcuFzu9Da0AyekQgPUBwBatsIn+GUAvtDzPmcR96E3AEYzYVT6sFCG7Nw/jy8N4o1urybIz3tUNq4fY8nF3LQnsSDH+Dls/LHa1t5jK9geAKxlycny1SE7fl0rlkrwKOyIfketBauCsPWtwWoReKNbvcczHfH6EGFJdkEvmTPiw6jdlU/FMtBByezaG9Egx8gjGXyJtFauGIbA7rFRSn5vR0G6QODq+HgINzemJAPfy0HhRrRHomzmlLQfNTbBnda0Awz2u0bGzVelhqFjM5vHcQXMKYTbVSPSyXzcF9CDiKVSY07o1QB8tm809orxSbMNvI39TD8l25XAXplWDCR/TWtvCXudzWp/ZHadn8C5qfQB9mrAMoTmaVzX2A1IDUxxRamd3aF8Hi39Bb20O53NUnGfA4Yy731gEUl+ZyOrR3CDg6nwe1DgKOzeVghD5NoeXh/GohaB0cySqPw/ukWH26eyadS9XDMbkc2ifBhC+Zy4wl60CxlXseP2nA8P/SWtoqkZ6BxW36BMHVjC1tbebg7FwS2rfrW5pg0oe0HLqWb8RVLa7tqTw+mb9vAT9vcQOfzyHyYUD6tmVlLS38J4/bIX1SLDqN3roQcAKrHH6HgOL4Sx4HN0Aw8BHGlnZCBk5fE9o3wT0t7meMGcxeqQFQTG1pio2YvvGVIZC+Bfy8xW2cQeT1Ig050C2PzqVq4vsZVPwDAvquWKWbnsXn80NqYdVZ9NSc20MbsmxnFpH3oxYE87xKS8w5Y/mGCAa/wJjFvbXxVnLGN+aBNACCazN5qCak/X7GxCIfaJeGBBzLKot/QVGHitNZJVbxz1A0UrE1PYufIdTEGcm5b9WwZWbSc/hNbexOS8v5xQKQhggGvUTL4ac1ETA5tch7gjQGIlczJueM60JbU8VzoGhswO9YZVCtWBOK/0nNbCeEBim2pGcQV66N81gl5fxyfkiDBJM+paVmfGk4pA4Eg56jJfb1ok0Y+FR6kU9qPSiWm0lPiubbIzQIirNYpTdVBHUYsA+NaUeeDG1UwE601Cr+BqEmTmSVmPGlIZAGCca+Q0uM/AG0DgR6H2NizpkrNwyCGxiTW78eFAt/RU+Mkb+GNkpxvCfm/GZJSD1szBweHyTSsGU66Yl1rQWtg4CfesXknZtAGyQY/RYtKUaeXQ+KCxnTq/gnhAZBcBNjWsaPxkDyE+DfOUQ+0AZpjKD94dTo3AWan2LcO7T0nF0rQxujWOw7emKRt0PqYAWjp8fInyA0JmAHj0zcffpqotkJRr1Gy+IqSKOOZHKMPAd1gHs9ZvHMQEhDRG/LwP2DiZDcoDiQloFzxlLQRghGvU9Ljsb9EbITGfoyYw6zlm6MYtWZ7ulF//dAkdygmDI7enLRnx0EaUTAQYzM0LtWgWYHwWWM6fEXUDRScGMekX+WGkCYeAOrxIzvjhFphGCxr+k5GF/pgOSnWOQzempToGikYnM6c3SftRE0P+jg77/gllLkVKg0JOC3HrNgxb8h1IAsgeOZkvH9SRA0VDGV2fy1FhQHzjZPx/27TaFoqKDjJVom/s86UKw5i850jc+2izSq7SHGPCJ/VQMiC75NY8oWt4U2BopfZuL8ckFIDVzFyKQjH2oXaYxgga/NcoicCkXuir1YMXHzbaGNgeCfjBm4z14tP0F4jDG1ildCGiXDH2BML/IiKPIb8KJbas5P54c0BoIFPmFMzX3mSjUAlYsZUyO5MbRBUGz0JS0x4ykDBDWAFaaZ1wgUG3/snlTknQNRB1D8nJWnZf7eOEjDEHAOY0puvgsUdSgqf2VMK/IQKBquWPhTWlL8xcCAehTBX2kpRd7UJmi4KKbSmLDxxoVUagKi+IdbOsZ3x6MJirUq85Qq/mNQO2pTseh0eirm364NRcNFOu5lZMrOTxaB1siCX5gl4mYHI6Dxih8xMu3IS2sEin8yJhJ5IgKaKHqHp+Y+e3VobYgu+Ip7GuRaok0QzPcZPTFGXgSpC5F5Ru4TLQ3jQQhNUKw1y5m6+YfjIPUgmHDQXR/S06j4p6YI5vvCPTVn51LQetChBzPdypsDwUnsTm9GXUjHBk+yyxMxe2NLaFNk5AuMqfnXC9YEZOgNjEy0m88PgjQDgiVfZUwr8g4R1OKA1c7/0j2Rih+tDkFzA3b92i0lj92bQWtB8FvSmaTzw7u2hKLZoWOPSE+o4ilQ1KFg4U/cmKhVuyAgwY4pb9OTiXx6lEgNiCg2oDNV55PjIc0TYNOuZIzPzg9BLQp+45YMvXs9aPOgOv4LehrO71ZHQB2OGqdHd5on4/xgDUgCIgPuZ0zCrWsXBNTi8LHrvkNjssa3JiUBxbWeCL+dJFoHImM2eoXGhM0mI6SxJ6tEpi2OemjH2ayYFHdOQ2TA9azS+Hx+SHYCESz+olli26UBzLPU6fQEoj+kgjoM279OY2IHpTKgfdJ59KaZcR9ofmOHj72edKZd8SJoGhAs/h29WeQ5IpKdjFhnKs2Y3IXJqKw2s2n22bEiyD9gL6+cNYb9aGyq86uVAmogYJuvzJnBBclIuI2xOZH3AIrsBUu9T2P6kZdB0hAMeJzWrMcGieQmbe0LPMHIDI2PDoIkAZHLGJtjfG8UMpN24H/epzGP90YlIhj4Iq05kY91ZCUSMH7i775kZCZvDktm4sfNMn40NicB0L7v86QxT+fXSyUSsBuNTRuXjwQM1Q3uIKMzV+cW0CQUp3nVtA/H5CIBGPLbOyqaMV/nD9MQDP0vrUnuM1aHZiHAQoc/TTIy58ifI6Sg+J67N4nGnRByEAz7w8ekR2fWFU9P5SRGNtur72UhGHErGY25VzwpCUHbowlE2y+PcAG7nPlXPDkJleVn0JvHe9skPcVGHp2tA39hZNONbw2DZHAhI+sw+vEpiMz/tlvzIm+FJCcy8XN6LXTzhBQC/szI5htfGI7kFEcxMn83Y7UhtGmCoS+7JfHp/MkpVprmnplbjCTf3QWCZot0HEtjgs6PJyUXsCeNubrFqjLOOevpx9eEIoGJ76RBxvWgiSnWNXpyZmYxOuc+7c2pR68yYLUJKs1THMnIJJ2bZLCqp+UWo7HHt+879ZTdN15mNFIVLPGSWxLO75aHJBZ0Mp3Jeoyc88NXP3jk9F9st+YYwVw1qIikoDcwMtHutaCJteFIxmQiyZlP/uvCfbaYuOMGAzGnBlUVJKqyfKd7IsbdUxNs9aV7ItHZ9cgvluxAj0FVBEkrfsHIRCOPQkhKsM8MOlN0I/m/q7cDUFWZE8kLhr1IS8S92h2akmD4516x+R6N9Ae3BRBUkK3iGEYmWvGBJSEpQcLFjNGa4had5Cc3HjQAooKMRdrv9FSMXT8ZirQFI89wkjGae5/cPUYjye4H9phv4YEIyDtgrRnuaRgf3GOFEZCk5tz45Jc4V7NY9WzmnGvnUyfttP5gABDkJnvSmKT7WzsgQxFg2KaHTX3804p9/fzrj0/f93/W6ACAIILsFeewSsPi3durpgeoAkDH+HV23eFX/5r7xRfuu/M28y+yGObUoIIaFCz2Hj0J45vLjUOmokHRWA1BBTUZ8DNGpmj8eltkLaIhBO05hCCqqFPFSYnE+HsEyan2BQOfoaXgnLGMKoqm7fk0zF8ZBykZlTU+TCPyOASUbMAUOhN0n764aMkIht9LS6Hi2SIoWJHht9GYoPGrydCSURzHbiZoPuumDkjJCG6JsXkeOXuXcYKiVVzK2d4kj+SbJ64OLZ11vyWjNc7NyFl/X2CeJUXKBsCKF80kPUbzPrnFSPLbW/YLKGEBVj3/Hc5pcU5zi3MaSX7z6lW7KNoUUj5QBebd/qLb3pvFvn75/IX7Lz1ywhARlLIqAIxZdbejrrzyioff/+Sda6+46tLf7bjuKJS3BBXMvW3M+FGY66g2DSoiRQVARIOqKgCIqmpA4YuIYK5SCwBWUDggOhQAALCOAJ0BKsgACAI+eTqYSiSjIjSiskk6kA8JaW6Vx68Nanzvnm3xnlicB4l3MDiAogoJtKfdiUFefqtKffvUG/OX/U9ZPQ69a+wR+rn/Y7EPoxfrCKxq1F/hjPiQBeqk4ho9rsz83KsAdQQ+m3Peem6kO54WNZsSQkBWaWoadaxusl4IbryhJaZ6TsI0QueF9Os6GXnn5EFiI8yZFgF246TNQAcQd90Rz5QrzIafbtmz/MpIJY27IzuTllNVPjkKK1OO9ACqS/umc4FMffL+BI1roCMHk1p50TPtCiDEBqC6oidGQbTlRbXAdR1bjQzHbeRP/ld4AbJrBgZLw6U7SYd+uYzzxPKbmD/Dw7PY5p1e2KMN2zGX5nh219xMd5jqn+K02k0p8ZESH4CP9I/pv8ADcJAWhJe9l+AgFcsYnAVzMA3PwH06GfiVuEGpFhnbP9Gv9b64FgZ33oOA24wizQUIcVdLkGfgZ/AQZDuZhRd9GLtPt4LS/WXSy4XeQBpkyIqgI7Y+0AjM5NRoahaajGzBLfwEoVtNBy4DG4pITzAwy597gDcR1GKntwQqvqesJ2AhBzx1VmDiwH2iTqnSd/lcZvCGJk6LqXla0pR3DC2LLwvBTSacwfwcD4qP1iDvOMr2JuT0tWMumOivZO7OFcqnRt7Qrjj8f9XyhgfNEoVPhfR+y4JM7zbbcMJaUNSgmJXFtxdIjf1Dh0iPgtPtJpSoub+WZrQihZtSLmqU14mqaPKQ1PMnPteIRfIhaNx4ALP7ba35qWgMUYJ8ylrBkxwmv28HSSirirztZ/eLdTPrOkShjn40UgLBOcAHVVYPQpP2nPMPrpmIEg+vIRdeSpcPkKMsVVaJ99ERF4NDpFH/grMCA2KfVVxOKNBNG9Padct2TxYWP4uwctfo0F+a7h48IdXiI5bicmiXG935uSoYodmlLbAo4O2OcElrYEZJxw/FhXjMVS3Ro1SvSJpzKgWDSESwINSE1ywQHvZRh7mH1Vn+xfCGG1Xr8b43hZb9wGlRAYBXhXcdSypisJ/Ci1j41FQeHAwfpXFP99/cVhpL0fqvWTxe3Ef15iJwy7bLiVQRpoopb98kfr9zX4HGZTHi3n/OqVqKOxuFazSBA1YQg73FGYirH37+kF6vQFClp7ylJoVp5EFtWr6lI0h7KOW2RkaQBuJD3nczffQy43C9YvMjlbw2Z2C5cls9dcc49hxNNzLB63DQ5TrKHry8ZCNYhgqNaK3koOde6aQyYzV6wh+sjONHmH2MvIEqlW1qiJGCRCBax0a/Fss9HzXQSFa1PH/poqNH040va5wt/yk6SQEUuQE6lAn9kKs1hG+7SXXXNRGZjHvjGFtkQ//1lWPpq/QM1KqB8WBE1yrP2+uSRtCzgJtuGKyTZn7QqtM3o/grEHcequTdsFGeVYVk4li/zRCy7vpKxkDg8Z+pB7E3anryIE0bpm1Sh/5w23rrncXHizGT+RRt9ORWZMXy//myz8ixixts0vKPy4VveydIPI7RgqsAQrYcZpqYZUAA/tXKWlV1FGfsLDdzZnO1uku83OQI9M9eI1Su1x1v1SSiVS3CPTAoq+Mkn2hM29AKqHQTeMZ0Ty4+sBnUE0QHdXFnnQhJbtoYZ+pgiPu2WcZ8GRybZLkfSth6+D2fq1O6UgpeXUEKkEj91c3Zso7dusIlqktbcfFyYroCujio/kMvGIQ+GfZ8hdeFamnRZHJq+i0gUo8gH7ymWyQHb0xtg27VyEBuB0xrxXES+j1X1QuKZnuLWYwtDQ9s3ehgN8mEa3R4JE2ubppZ3QJissuBUiqA7HhGeG2W0KGwlolGpxXhi83DQdwuMaOfeVjllgCse88yNLfq6oe8/W89zbKcfhz/8BHqMWVZc7IvQ4DfebAgIh546yIq392ctSQqT9BiRxxGg5nIsQ/9exMdYpxauXpg6tQL0L7S32t+QbVB2h8f9il565WDDyBTv6TrMBhRwuxfG9E2F44cA1hb5ELSvgrJJ6qphJPCGeDD9v3Ve+QBtcNzIuvFwppsoiV9ettOMCjAKsB3ai5/OsFpNt2Ad3JGxLYP5eYcbmu7c33FpHzjI3OCDnFE0Tm7+TDs8tW37dIAf/jfmTcCfoLPQdzBt+FaxwP0Z05KCcyx7KpNCIe0YPVdKm8KK4iPiflz3KG3pD1jkQq0BdKvH1QYVmaoQQl89307/3EET1be2Fszy94K5DAPMDrQASVF49S2TjsA8nrdtkyEfDrVSOTo1+vN/3JCv4ohMzBxfPszg5httW7kwWQdIhygiQ9yLQSWso4BiIZgFaJlmXT0lMxl4C00O7hsrmfiXcUwasIAmGcMnIo0OjSbqMsCTGBcJ0DEwi86YmzfYumHLjX4esbYaqi755vafEZsHP+9fjcJa97Hb7CIjC8HyQEzH08Nxt5K+kiNqopndj0pIet56cBPv6b/JtyTmVeNLD0HukZ28tAU1WfxmI+ITuoaPRdGCb2MG1mjEAOlavF5I9iQO18loIRbG3GdgCVnd0QoNug1BT3P3gH2vfMMBATRTZCmYn7aL6rqpsH5Wg1LwstyURd42haNYBcGFQA810L8kzsfokE8jhR2DL7F3nZpXMT7GWcUERpWWr601FVPMHaI2Hg3ZsjNdX9ejho76M7Y2MxnfO6O8kw9DCtmIFsCVgXLuqGSmrXba+Vm6VFDjAketV5IfLjla451b0zAP3GSpIRVVBXrWRiTjNfG2uI1YxC990PaZqddptN4rG4TJET3h1r6WRWG83q43rzh3/kbzLhPUhsDXE34BluNVoE5EmvZwk+CTCe2NdpRKGJbczTTTQZzKGMlAJQ67660DhzX23utFfAAHX1tB/OTSj21lvbBBR1kyK9+GPOcY8gIvdvCSMsJUj1anVtuGX1zS8u/kaCuCYGFIrJBkjRG4BtWBoJmvcz6cI9dTiWnvscmXIvRotHaegERoYkmcoNa/2Gf+Y82CajBr+dsCOMHyUUNFOrd3bMg2iRqW2MK9nkkN/d7CbjM32cdZKFOcrfTduVQc8yALx04h1h9TSskJv2LqD2+mHJjBLkHHf4/ZW6mytXeVcDZaEUbWMUrqlAiNXiT2ANpkGOOUfVQDBsjCvp7WYAGzOVxB/gdPERXyX7FO8Ny2g749ybVrW1v9l1F43tQ7f3gRh+JL2tEuR/fQOgKSeV2L+UpAtV21qEfcrixULAc/lc9i0iPB5pDEjs/UhfkSuzmwaGrqBqfP8zb90vJy4cZdz26N5HB3Add/5ZlvagjpMYBwU/HqAnD3say0bI6+BinYYR/QXrB9w+RGb0YJGuA3FkdcmE55Q9xghGpR3o+eAZ7kqloFT+NKdTiFa90t0V/iu7SZrxPRjxQKMuX0iWiXOMAQEYNGUHjMqZjX2vetVuKGU9ivS3+ox0Qug18J1yMMrABuYwttPwe6JVbfbO+w46DQm0O9wPtMT3KrZ3O92JyLZwoWrap9XhjNApmGZh9UIH3YaBDqXrwcq396CD/Ly93ITdqgLfY5OVz2cJXPHjmPLLjjxbw0yrmPIpXBsfytcSbojiOsF/vEGD1mIiatxC31lXqc8Matm0rM1CYfp+KGb65Wcq+dQhcVK01PixBbdOisMxdvm4JCX7g+lwCEgsdrr+DOEdip0S2xH84oyBm6RaiUvOugCq13PReCOlKXJ3EFYblXQCImLp6udatEAgFlC503RhbYo7Owh6Iva5IevISy4RDxt92xQGXhQlfm/4q9ulE8YcfDbzlLRfDQhsbNUAwsIlisY3RsDzjQujJaEGVH47F24apznM6/YKqSuGtkdsXttw5jH4qqir51aSW+gDa2ju9OksCRqmk5RxrgreXDm5OcJoNZANlIRRfkjWf2uMAYr76j8ii2l0RnbigcRJiBzHQbLd8R/llp5vHdEvz6Og1XTcA/RqOs7+qX/2ThqKJa4peAVce7ypQROK0pjb47yLqIpti1aJIfW0B1SjKEGmWkr9y9IC7M0HPMAAqSHVnF9TgFXHBr4WMykDPjdNW9LuK+9wdWfnHmf6TPWE6kw6Bb3BGy7CHvFYPr5MX05NVjzgJaTlm0DZNW9q5i8jjp6I0MAJjqnAS3EVZxOinptxlboSbArupLB1HQwVzXin4zr4zldELWj0+uZF42AKOqCGtp+/k275jLUJ+0bVEinS5E26QDFLKopBTysVZcaJMiW+4H5I6MGKnjBYK0Ad1C9r13zV9EdXb2HKRoFO3JEpZh4WK1IYLOicKmWFdp7p1ElcPbemodLDqHmn3Jdq8gIXSsQph8gTRxNkSz9B0AiBVsDzg6RK0wcFXns1xgbgDERC75KRaX/5/4wMsaFsA8T9XNsx0YaKIXEnpNj4eC1XQ+5HE48kqjazcvBmjLU5rO8VRuwfm5zLrd8kCO4CAX8mu+/Yv5jAOuq0Qb81I/vAvG3eABgDSMvmvmt3h/X4X0OuibafaQsiSsx5iXr7D64HRI58nFeAnpdh77X59Ru83Ssg0DATbeEYZdd+6jaLSekrOj7RxpxGR5PbFCA9p4I/NcnRkeT6znsTVeaa+fujy1bYteS6FBEBbMZYo05K+qoJHIw9pWRTNLL9BzzSfDrkv79HLGu6aNOxlJTfsAkenAuhsqxqXBK4SXGmY++PLe0MgHr04kBC8uzhCBOc5yWolgE88ViReGdX77XmV6w2PnZwoyWMgjvjt8Aixprv9CxwXDtFNqx2paUbd+RlJin06Xq7vRrezS/9TXgDlvPuoapahFPJHUdPa5lJsH+Jk4LxPV4KThoKCUr3So9gsVev1PqsF3hjs+3Zzgj44kkcQEggOcz0GXX7VoJFJ/nnUpWwRX/e7Dmv/AUPyxrtYWhaXFJqIQkxTDVZqjXylxqOkEd618nw3yAXqNO29udGLGRq2LMbdn/9OMirypdO45ye54YPIWF8lsDwiu+mjXi1qeC8dU4POuN35myzpTHMqqD82NQv9+7uRSibmeu7w/SHD5sJ2z8uyr+azbKBrc1VkhOq/Zb6vqne2XZH+zlbG+Qxj4Bej5cZrbT2dtcbWweaoKDXNeEvSny8JwA+Thc9ymZb6vHQqne0HmJYNSIkzyL6XrYniusKMWhRns4AmwZUoWS70KdX80QOZ3OXDS4kjcgZt4wwuhGh/8lZDRUX20lB0dZaP2jDzZf5VANoRigtbcSCSgyWHb4pKBq/OqfPW80lZsZAfKAK8IrjvMpyFk0x3p5QtpoEDloHm98kBIUJMEs4R69Fi5w9kmh4e1Vr692Bx8w1cvkVTNX5rH7iKTTnDsRtj/XS01/TOfSEQGi8LPkZLMZIpJgIcp2jIuo/NolRbD3Z6BGmTC6jIqPRS/2gZvmmIfhON7JZs2bhZ7ci+vY4Lu3CsR+HpXhsNeLZBFxJ9aWRAUu/SYOIN5B1d/Mci4DeiI2cLPBS6yMrXKPaQXvGbBLW+icvN8GizOm1BMlJ30CMIU4YoAs6hDBM/gacuRbd1z5mU2LSwlx8SyK/eNMFVcxVjEAfRO3VnyZ6f7hqUqPKPfm3HYTf1ojKoesSoOM3I74WQ3TBJmECp9bKEqnFr1CSJYy6TN0rxA6Jvq1SHx5h1fqOGEl5icEf/rxS8n0pHGtfwueaY2iEBNlGwpokux8r/qiD5njwG8RQXWxZxsQxwZ55PlGM0VzrkMtUTgBWmIZG4+dh93NceXO0f7zS9FybAZ4RclaJaxa87C4S7io8/vG4AyUxWPn2S1ETdFYz7soIPnYOj45tKK9UteUVA9oCm7oD1azsxWj+ug+JWD36eTqrYfzhQw96Wp4LGD9Q5ZrQqEk41u3O0ZsoQ+7qUMaM4wEsCsz9Ltuw7eZyGo+wzIzv4B8t+D5bcpA82zglAGpNVoHyTxg49pfeUPbhXfHeTx4GItMwrX3PScHpv/P8v7931jPVnc6qTq3+nlqLSycrSLsWgNsIxuDBN307QIMtgdx60nP9fvmvPJBslQ5A/aQ3/+hS+PwFHqHkxjuNxydGRTwrpW/JifS949pEWwLBiOAcdty6EQyx+GRhRn5TLPO3rhoPaGJg/mw5c3sUZinSsgx+qhmqXwb+PkQlb7akKIlr5C+DEhRHkHgPSfO3AzHOYxH7SlrqJYTIkA5mhgKBKyhfkESV90unNWRCbjyXGPFBFO7A0Y5SIMp+nJXwqqkv5ik04SYVYjO3wWTncwFjyt5D1dhGRnuF6TgT2xVaAPpI8ApYNt/C8h+hcQxCJjcjjK1J3SIZv9f06Cgf6OXvDy5lsRr5rt1ZPWUynTvBXAlRIdkbx/bUdC7oDrLyS/YjSRmzgWcW15qcUxL6HjTwWNowvuj4f9nEEttqwAw6F8rGXdeGpghHPuzUW5lUP0vnEy36J9Oa6beD/3KeLjgQI9MWlsxeh5tXJWF+nVz48bwVUSyJr3i4C/RuouBY/nfmc0eMY/Iq9LRO3she4eAvzu3Ruug6lOzPcUyus8CIDeUKyHsQSlNAZ07iZRY4t4t2m0lm+K0VAJjfGNWM2Xzojy5ZapE1Tg+cu8LimZuwZn4MSP/YLGpEG+zZpbOqjVNzug1EgPSzr8mDS2vATttynr5wJ/+191Fwdj85RtZzZMuWnAf08oRDA6IKN48EUvfzappwtQ1QfvtMER5H+LA183xv3YOGaEVQCi32ut62BJ8KdQeAvhR1sOFK73v2r9Zo+Nqwiw/waxzkmKPQGw5g2A0VptI1yESTDYM5/DuXOC2xpTeT4AtK8PNzgKRspfxv0wOrv5Bvdg0sjG55oje7Sud00TPgDR1vR2ewnePbeXn3LCEs0olt702j2QRO9e5AS9yt357dK/lmr9OT4vX3/szvV8ugnf9KnYE/6unYclUzI+DkE8LC4f/r6vy3+JK2HQOpSVKDsctx/5ngPgAAAAA==",
  "v7_overweight": "data:image/webp;base64,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",
  "v8_very_heavy": "data:image/webp;base64,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"
};
const CHARACTER_SPRITE_LIST = [
  CHARACTER_SPRITES.v1_very_slim, CHARACTER_SPRITES.v2_slim, CHARACTER_SPRITES.v3_lean, CHARACTER_SPRITES.v4_fit,
  CHARACTER_SPRITES.v5_athletic, CHARACTER_SPRITES.v6_stocky, CHARACTER_SPRITES.v7_overweight, CHARACTER_SPRITES.v8_very_heavy,
];
const ROOM_BACKGROUND_IMAGE = "data:image/webp;base64,UklGRhKpAABXRUJQVlA4IAapAABw2wOdASrQAqMEPp1Kn0ylpDe2IrJKyvATiWduLSBd2WPgXAz84axn/q/Zf1mUJO8/6FP4h/kfWVTGiMa18xwz9P2s7fXG78RkLbUNKXm90EPP4/PelZ4oAwsc8d563knHrZ+XSOdH7t3wPUR/WfSL6Vn+A9Hvmxebtv5fRRekBkYnubuEw3O4/zu/6Xin/EffF6in7V5h8VLtFQR+gf4HwYNWXw97Af68eo//Z8ff7F/4PYL/nv+c/an3jf+XzZK5SNh7gq1iUuNvyUoF6e5+VhK2O9/xD6jqWAd7mg+FLvQ0QeIO5q4EM9ha+hC6NlT4FNdL6VdhSK7MN95yca63rsKqxyyVFRYvRXgmSQhCoSyvyQSet/9zvBLpTfq7NThV2hW/b5Hk6ZUyz9uldAsyaP++VvYggJJTwArud/QIhsYwcgSUksm/E1nLGSOxvcYaVocm6zYpW8DWchNst2C7i/Nxl9bRbcz6IZL/W7L9HzM7hf2wfQ9y9gIUa/JHl54SZ/DXZp6hylMXafL+xiP+F3sIEF1bB9JEoZYOFwyfpiR0mJdMrlfZyd/KgozuzjiFRxT5KItKDKnen/NN5APSCIQ/ENoGyrbtNmIvSy+FmbujpElX2FgW3LN8vqd4qvMUFAF3P286wfAJ7x+lrSeMBb0nbITMMDOE7D3r06Ya42n2qKgo4adYEAiOJxdXm1kFJsLPjDAlwDlNL9K82Ctnss09TFWH7ielRjjUke8+oVGFMPhlSsduFOEu0NW7UwZGlt3Fl6JA8DLqcWVuW/Z6IJ6r2/+zlkUZKSkei1yE/8m9zyxCBwfUIRG9O11KVH938ZA0ktEAfa//RUni8ZVqSmZX7sGs05CZq4pYP//6U16mSUVuTTsDz2yG91Fi8vNtPt8HGyuakPPzhAZNjkIZuAX9JFBunu2nmYPdd7OQqTIRd2oTnid2U96NUzCEz0/4qfv7beuLdbskA1ms+xzaeWUkmr2zuxEhopdo2nfBaEgd6KZSnYToP2I5VwVbQJ1kz1+XBQa4azOOg/YWbhu3IMg2I/956+BqDWycPaDb//aW3zKn2pFJF3zjRNxOCbnfft0V7kIJoiOEcoXM4pRUk1nyj8CPOg2XCEir3x/Zc8F61q7BM5cS+fVOVVmbk2mlZ5lnEBvYHge/SWj0ubQUcdfKTooRe7/7F/Y6jmE0v9iYQ3gOIxPm69lPDI+IKvWAsK9l8Esw6bcyhLz6OOtZaPvCdB827IqON9+nEZ2wJ+X/f4V1rxR6XKdoE9AJ6kR8peUbGzIt6pmPWf9ttbCHQHQfoTBqqQVBr1X3Bl3vQAQvCdB+hHA33BV/YnG0ErEcqqLNqanBORLKhv+tsd46CIDJ8ngbygKY6dTieloYKm/NoDKppiQ30VZbpxkpZWSJL2rEf47vEp+lk4gUHwewA6jdprkqgjFVa2EkhtsaKBhVSdz4e9oNZVcHoPug9s/Thv0iBxIhKTs4nwKrQERmB6MqBVZPtumpj5H60cWvHKWyn/oPL1wxYnMOGLXFR8/2X2mzW36QsGwdRDiYi4X55hX+k9tS57ym5F/oWSGR8RBfRILWW05rQZVfB7BKsSEdI1bcLfuvnlLAMmKezHhnBJ558M15pkgayQPPd48wajpbQ1p5Jvk6zvYDAURyiJ8+ZnaDKRB8Xbd06akGB/f4g2GoD0wDRkLqTjefVPXMjChu5UrnMtVLKSFzJkriSSQ0uzFAliDKQ/q20sWSb/YjmHSqLoLHu3hM1qP0Sj3NS5UDg4q5K+8kORUsbKWGwCUvTQIKqpS0f2z0GumtiSGD0wcaK5o0MBpRvyKVBKiH7JPMLQB/lLGqVstpOGsk4I8X2WT0R4rE4fvdn8iID0JGT52MaY7xtsnc8po9VuVxjg2KGLQfM93mtQHtY/YNfYk3hfvSqDyXw49w9gVFvQL9QhNs8w7O8H6alXWfE7ggk2jRPdFqRv1g2ecdZI0a23fvailddRklLAdTwBTOVFdpcPXZL/JK5iWcyx2i6ckR8Bn5VhsxNCxA57vtIU+KdlAEDZS9xtjnwu+V6s6a5KRpFgYnFLxcsrfxsAQtZeoaGKlcxBL4CaipC8oc/OUn88buJgqWX2E/hKVe8Kr6jRJgnsXmVyuPWQbnIyDJzYegnA24oF635TGd+P1WNZMTE7mEq14nfTUaXiQuS3SqnTv1hECUqo9PqocTrd9yy2a7eT8MBEihDRBDubty97FlBzlHsxce8ajro/M9yWPJ+WW++mncSLA7pbhhnRdgbzFq6H6Oj1GItup6/8+u8tNhWyImcEHxCJfSKOERTBU2q6kviQ0uaMQp2udv6AvFyjo3uox6j91uapeUujHgcm/rasQdCEdLE54MzkqfxrwfQgzMdry/98gAElreMo355R7yPvCxIVDwVi5phHQdXkuViDKomNWyi6oiGAowW8jrge3kNUq+dyOJEuO06Z0dIJbzLIWunJ80qpSK3ukBX9COIVprWRLw5z3aySw8KVekUX/n6QdmoCWhHaGXdLIc5SFKNxlorlNQKpZ+IvCA2EdiZ3Kvt4b36kNuzHEpOLnK5qW16DFV2ZSP6zHGTMu8iH+uKxmPeuYHcIjuWBQDKI8Gn4HW47XQv7qKkdMlo7f3Pvyur+U+X1XF2gxb2KN9YMzqymZXoQGy8X87Hk3QbRYr7sg3FBztmk3V5Nn0mK5NwHL4+mCWq9kh/kYVvcEgtb53o3tZUMYH5+oJ3uG+DMP9VGpeu7geahpP8XBtC6xozb5M84dDQFGHD+QP3mSzvf3IQ+QJqJZcpYWooZqnu5O95uZvWV1kWmfHLfmru/huH/zb2twkiEFhRz4doX+0nxzSvCrOkdMoCmuPrax4CTaUyzsSYYg1iSaaTHGiONud6+phlk/2jy6dF8jRgJOgwnz/fAtHBVLfsrfeO0QylXuPkuE0L27FuEw5/4dA53gCSZzlCBr/OPpdMGhO2XDUUuM8d2/7k0Sqm1RvgR2BeEYtIV7sZdF5vuT+eSA19Ca9MUO5Jam8Isf9kIagzKk5NNzNk1ijpoOseFnSTHdBkQm19Nb0JhubfqcfUTwF2+So1ZI3/unEht0+8sGqrCbSyNTSP9UXVneEBNb85CW1FIYwTEBYScM5v9L7mZpIzM9kcC0xACipjlyRC5XYxW/NBRA/U+j9adPSkdYgmjjTBuZml607fkYDa+4HDPnqmogd3qHGerTsopm2D5ooWf0+2xsWTna5eh/SpMAbp7xYWk3PmJk2+uWXbCWGer0MEUGah97xYTQyfvbwlQdBpFaEiA20TJhxSbwL3GRVBb/nSn+vtFjdgqKIK1+jb6M6aJOt8YFwojpERAGzFq+Vf4HOSSxMbic4s+WqD/fOLaIqR+zlmXBf5GZOuc0n8+BHPVJ/Horu+IL23HpwtA+5ORzX2xIkzHnlWfFL5ue7LoDrhavp7UVZcTvlpssUFWHdD3YXphq94iF8SSWijaKuNOnqqGWxkTlUJ5eD5y2tHbygS5mOVYnpYvXEujbxsDi/kePt2xIi0fBNFgER7EsePwwjxFvfCSoJ8tSifRn48CeSk5VdTca4zOLFpqVnvfwgtru+aLW63PmdqBQlcQkTut9fGyC5wfF8I/aBENiKplxoC81xprytZpWHSSGVa983BBdNctoPgdtfvi9HkFN4sy6nIWyUrLCDgyMdVk+XD/Ey/vHKwsGMLd0i4qJtRiLTKX3QbJCpy1gDkT/t1DR5VpqdzqdjXTnABi6C16/DllZFEykGgMP2YLFRwHUgs160v0wqgfju50Q1rJmFqmYYk5RekZ4MyBXhZYf1RuKg8GeMGAouS0M/ULA8ZJ/+3Ea5pUJ7vKo/hnFq2KAIKS2lJsmNzWJDWfnyGBoVERNc2XGJFCKplLHfl8vXEMkA25f7cFwImlMRar98HiD2VXQVM7wBWNHU9X0Vxg9cJUya8XLK4cYHEjKxnPtKWg40rdVRc417i7sdiXninhunhXRpoqlXRfCw9gBM76+369DVuuDRYzxnaLKt5hRaSQ7g5kP1yRVhSXWo9hFPliDYgVloiCP/hR8wv1F3yFSgqWgoOsWy322MZY1vnQGudPnUCEVcJcy4wav6ZWW9Cy63ABtIJjSb88bcw2Nxp3+HYSuy7iJ4YoB8QDmKNAy6m+Et4q9b23V9ZMs/iPeHIUqsR9xDvzQxN/Azs5o1uAIaWzfhKSh9FalQHdu0KEr7zBVD5T7zMR3u8JYda5gXbf/jzr/xOS4/f6wh4F0rYdTX+XaG3AHliT/S3MINeVpgq4peyqBvW3RcBv3bsU8ftRSqWFL8LVgPBt7vDPosKJnRxwMGw4/yZ1NVjewj4PdsW+2l7qhlx5OlXTTmP+ZWjHw6S+r0bM7VrKOgFsswIV/mEikR3cMH12CgYCYl8opGAY4yVzBpjWyARB0RUdNMO1CdorCEDSDkBVSOtOsgqKUuuALHHFSavBIemMoohRiq+yljZTVl5FT6jLcyeDgsJwUfnFxPdOk/y7tgJBp1d8sYPNDBXQ3RKq4SvBV4HscAYb84WjJH0SndqTqib/20bp3Ui/446bbemfJ/yqpa1lxdkarbggqebOngj/KxKVUb2UOT5Dl4B0bCFdgC2v8vqgpuWXk/lzCrbloMx7fY2smsqy9ztkSXIdyaZnrHZulHYfxIzQ0lzIGDwxSjqmW86J/7oBbsGjIvfcO9+MoY0oBoQmn0p8wCM4CYFkCaJU2iPJho+iFdhvYNifAZMFVFXD+YbKu3TvNASMMdfXYNJi5Hi1Rru7c35O4sgZqve8MiDOi3FKSTWKiYMhm8HeDsvoFGmRwDmvV/CaP+u/wUjLs0PB0adj9m4EDRLVPDrlGTLHIv44955v7YzXmKvTcTfMwygKFc+rvE1KCay5zg1cRrgpp2l2Np2VbO1Xq5HBvBQkOsAhPtkPEkzb/btCjVfNFnV4ZmITKKvsQQ4C5Sn5W55hh3VtboI5p4F1SEWh08lsysIa2AaNF72rrlIGw7uv8D5x2a2JekjqjAUumyrm1eYRTcpU64gA2UX3BOKGREThePx9zpBPmh7/+NlcjKfLPYr1Jja1vL2Suvf/bZjQCgHRrNSUJf/99sO8r4udXxUenSa+w8331flHSIdaLNkV+k9z2NNKGYOekVQqIMUEWYVaeqyag+0sYXzSl1a24CtPmnbxVRkbllrRjCKxa7cPZ9kKwFE3q17f+0WKB41sR9vL5zYqJ0pWwdwQHNO9GNkLYwi91nI65JivdADGLhZ6NWzkb8a6iZW8pzUpNOmciYDhzXB9mwXW51+A1nOii/mE2dYcPbonFdptiSGrcGV/F7/PHc9MnUmZV/HPkDBTGvzy/hX5pHWN07H2bNEptBHyPH2usGKMDJk3hqL4U1bsH60DRSk9ReNutQP+3Dp2T8zStOt2EB63QsunL28RPIVuDZxHKcliqRjDAXOOfy7jsTnG1DI/1glSsjP2kqbnm150AIFwnstQ3ztVjarIsdMH0UebsWyKwF6ncVSR/5J4OlaGEGTJv3sirZut+afLROhbwz4/9kh/Umo1zz+BWjue3G/B3xtbX6TiZpA2BuHuBwtSiAKziqAaRGe4Od+bfjYf9sKaMFS9vWQYn/iVxdwLUaLHAMT2LQ1F7EFvznjQVtO0Wlt5nZqYMnPVnbaIgUMLUSvCaY7nDMtXNSRg64ZU+UmFKvKDpfEaJET7foDQjm1iJJdizCRpfSXRDjRqPeh80p057xrIplWy1VRtMu2tMo7asFyNV0X5WrrFPg/lwciHwU1zJbykj9WedCAfj48YVGL64wHZjd/+PrbeNZ2WZ8Mzc6rkKymGhw0q9SvmE/GUDlOWWkLrDAi7pmk6ZKN29YYt602EuT2pDVW9Nc0a5Hd2YCrsEcprRkG8QD9eMUMWp685MQJEUVuf65PlWWoMxLkZ4zj53XIL/2d9bpZ4FneY6zGriYnD/Ry/02uZ2ITHSUTZ9luKVmCLXlZjY9S94v+F/mJQb/xen+ctOw74ZHur8zfDB7aBP8wP9UFRz3ytRgaA1/0jVW9osV3r4+fsApW0z1Uz24uHoT7cTG6JlwHiqmTEIojQm5YZh48cTd7Zx28q1Y/ccu/VJE3PCJPK6Lo3WG3M1XVJWGQeeG72mqmexVZ0OCmNLLeZIgFyrc/w4b/aKH++D80jWgzwYv8BwOh/Y0HltfZ4ub0u7mzxmf+Ptd1jwoYgdk7q3+VfktDEtlPHnmYQekx2RkFOFaiAxwau6tU1jeImFKvxe4EWr/uGgp3nehjB757NXyVBkZxDkLAtmelGYnNKPEZt0l4Js2MaokOFBu9FjC2DhC71nrJ1cpOnyrkYc8Rqw38PcOQx45J6WlCKkRg6vKGrBJxGI2XyI3b6yRy8vHYlDClT+mR61gyxXbWqRXOrfFohdwE7ehmXwaJo0fHmVpqDDnXdeOrPccutZaPS5TXZvIADFNmA0p0qXJNh0jWqXyMJGtbqS7WB0/5NgjW4fjlQUl9bbK8t19x9haw5Dw516LMrGKAdzalSL6thU/mPG/YRgd2TDvnjQXExQS5LLCMhwJmtqwJfcMspaFZJtCszqxXanfkY9X1uVfFGlhRBOvikZAAWpHC5B4Nyos4RLiMtSUJQqd1xyEMVkEzlyG94gfHAbabq9TIWSRDYancbuJ/TE+ML70zo2e39vYIjQ7r9KAwCy5BWyNRUNfNkRl4qG8/h7RdKlh2OdkT/3fjb3nZtptwzyVVZbkayeuHq92kXh+4bb3p9ZNN0IladdERQOVBzg4yGb653eAXAlgigbn4g1lzktOOlvtRg0V0/jl0B1hGxsEyAkZzvtsV8k/dghbHCFbriC9pwOgO7oWDvYQZC0CigIrhkJxqFv0Oz+u5nD456i2J192pEQS1fZNciQluB7pOj+/UOr9zTU68hR8CMvB7N3shRAfDGlfvdgjC7ZJiLS3+ewinYnpXHbZopBp3VZZR/tK4oVmdUZiu7ePIQ1ez+K3wiy4YQG9+Ku+smlpltGWw/h7KpYSxnJJsf+Q5lhrYzyhO7KSfPWZ+//R8bcuqPyTVnNnjKg98HLLrE53xl9flY87fPvWlzhx6+AhRySM152F/ZPEroZE5HingW+wgA73E7qk1RjEQTuc4vK/1vMu2i+IRenqK38xMCbt0WgPE8pxP7CkvEmr8w3dPMUND4IsvtGV23mo9YzdbtvpNHyrv9/tzFMkSzEyAnNGWqPcQRyjFpZUbjVYgotF3QGcq59pSCg+G4bPk9duvWKemz3S6lwKZj+29e+vD6g5VFOdorVKivFJ94FBmD4z8pyv6uZPLLNeTKmsQGfcyLfTeBvWDcYk+VD3kraM6liJmMZ7i0ffygp+EsRYF+6UDdO3x4DIXKrvXlMId2sRzOLoxyvGzmHZJjohLHAYr8SA7IajqoZNq1mDpY2spYIoTJh0SC3ja+zg7/BkUvbYl9MTkkdtNOY1CXt8uojiYiwnSE89Z3xpqQAb5tW7dgMUJS5tV5iQ3SCAPkmYfjea+Z6CVMDY/mR00c5ILvScbbwfw3afBxWdjOOAxlFnIgRElsB3AjHtzHllaNvdVJGA5KIMCG+ok988fGo16F1Fkb1r+1N08A+E0Oi+6CeVFQ/xmI4J4CvjSLoOcnvGRmaqc/+JKLMcpbnQVnCV8rzXzggrtvcURdjsykZ8MPZB4vfmNUzAqz3ayO9X/kgKUDQsO61LYV9pjpQ/+JlmXm8sypw86XJeEaQtV3kjHGLYg3G97qwcsmhtGiVemGzCDUUFKcQvkhiUNygsgtxzkSrvqg60jGlrSVOiYoBf5S4NA4CMFDha1PtNWv/vBGYSrHesDFiKcgBKMNlFHW3+wqf1M7lLa87y8pBE2XJaQEnN6G+OYbITBlr9YDANQPuCBuD2GiRi3Sn41D/fmMP3c0qUsh1z8wZs1r9RyoOhsqR4NLCHVez4v9iEGiCmrDS6F39fxrxlefTNbWCUz+2Luw3dkgmZmU17PSE8kPtKlsoENcmER9LowaMZQVuQxXIKfBrSSGhPbnvksaC7Xv2VV95j8lhdnW5QdndQPvXDu+I8BDVursyR1n5uBpxfyjAlVDT3jrqnhJ1pm016SXYq1aWV8SneIxvT4O33TPu/O1GgciKGnv1j+LVe9ea0WUIAdJEHYzeOTwbc/OH4GzVOym4ETNPQZI85af/75Axk07rRdcSFxjV/YAIGialmLa6fWZn4Lpu78p6Qrym+k56uj+/DOkebCsWN2f9oEoL7xdgLlmBk/KL0qI2sMp7oLUrAvjGytmk08L8co5xvkwvhMxHzSRWcQ22cC/vxEDe+QjJWJlUvEIJALPxJo65vXNkbOoFeHzEfRPOoiUEhtKPvbOzD/4Vl22TATVfXnwLnkAeZQIkYVaGxsbyd8pI7M1r/ED0xFVctfTQc/UUN8uPTulOf3YFyR0GZXh7FHfJWLy8a+5TMlKcDxUmWyKSMkvM7BVXo2P+5xPmKZcui3yi9fk/8TEBna2hNFAy7N6824H2BKf14URyB5wUohRHOvMtm38Y4W8wORHMp/Hhav0WDpilk19SolatuPaoSezozOOwATY3g5la8Rc6i9uvM6UU+2t5eJDvtPXV+kcIZQozQjHonXjdcOtRSqSVdXU5f5+H4v4RRGoNi0c7v9gJo+DzNUjSjMviH9Pn0ktnIxLWvC19sUQfY+JSNsirDiYrOU8yWqKekFbqVeFBdmWHvQXqSiqlO7aucsFF4nalwsRLhTk/eU+0KHckGvD8z2TsGIYPqOw+bZn00ZiWVs8S0CktmTnWmAXp8P76NL1Ji3ni+fgupzpCTIktT/qkESnHjfiEOx4i4Rrp/xvnRroFezonnPzwF/iSUxrerjVKCnJBKf4Y7AzS5uwGDAgHe1ha1P0Dd8OP/Ybap7VqUhYOas5PIfJiBqrZtAINUkSZysUDVJm0SLMxRnXiNd4t/W5BkNd+ayAF5VIhatKvFgdH7e1MiBShRXu6gGIuqqo6IBgDm8aQOO0P08DqP9PN9l2fAa9G5LkNbRNK1T82rIvyArofFT6MysmdYxVYYVwIEqCG6w1Gaj5dLPeKeIT0Ui8m+4DmrUb3wQAeLm/CIgA1DCHS1PmHsOPEtribovUfySt87AuRdd1LZpwadksqqPME5IDGcykyWnh1y5+RXo4xiUs8GieIU0IRyf3H8aQ6vaz0YxqwJOJsH7Zvl+emENDkmTM5fraZTWAd7uxTL9FwaeIZ6YqMYi1MnIbHZhkTiehiWmjKFQeU84aGJJMFAjU0l2lZjc1BL3wB8nHoR/0PsdgS1m9sDppbOkQmdJQaLeFtHuTbCQCentXY2WJ+LHiYd8dPboK+w1hX7xSfx7NDBFb32PT2NSliFoDCfthB/La9YXOXcRRHnqiLtDFk6A8yAVI8i3TjI43xHpobSzI0qPRjGcSsuaK85biBzDr4Sj+secyMCwrPMxPulnbZyxd6PcGIaGQHTUrEFbTmU4N7teLjEvbolZkNkbxcui/xZhGtXhFzmEJEzq11gZ5vAXO5bCbGAS6Wu68U3IAiZ7FI77fS03oOIVcwd0UWZYs8ZF8grp+1d+TMQEKygg1etDSyf5MfFjlggqa46WMjHiLKMkt7QSscA57WRUrg6dAoZe2oB8zWz7xvajHb/lSoxZ8F1vXA6kxzQtoZ1mlIgn3uhyjQIbSu+zK+eUzJ+H0VbN2zLmIznC/upASCrkIzDMLRwF9/tUmzzn6uNVMkcJYrRXhiRrXgu3GeHICsb6owtm47yWP2JdDuQOuzx+g66Nj8XYoB+i1BDjf10vKKp7zZC3Lz/V6YTBo8W7AQ8+Fe/qFnilwSoAQyQ2DuSLE+801rtwLwOjwp8GPzp0Qa0ZnvGPOQTRiiP1sof7n4cz56XxqgwoktrmsIz1pwAMRWEq4GtV13yY9ETQ0GgyBk6HadfwKloCHpcY1iC0uyeiQyjGm5g1CD876qJSlOqPp9EXI/5jLLIki6Gv9TEGIPJF5ldQ7ZNsmUioTwkgFGGS1pLAwpV9rHiUzemCDmfKTFD08LGMwcCImkkHUJPawHOpDvFAI0AsXn32HCxrBd+Ev7NQ/Ccykqx46tZorAuAVUWmTDbdQ3uydH/FKw8fQ/MUSi5Qko3LwRqbVdSM4N8rjxgEF6yY/zd4R8EWP1gq/Q9woJWz9s9+uF5oJ9k5r4uFXfxdguKMicigQsKHnsw30r2VVWleKXmvwZrOI0Aiucmm94mlWlBFsTU/e5MHAvkJymWLeLbX/PhSyZi7b8V15uiVcVidSIT1Edp+674q2nwKIkPYqjvFoB/CAe9W2FAoFiSFp2qhl7Iy5Mw9PI9Ss/mlZqeWI1Q+8+4Z7n+jWu7wmzY7S1HVqmZMJmfbEj/ph8HHnwBwTDV2zisGDMCXDe9j2/ZUDvfMj8JjgtI0eHjwUgXOb5nBxCPSpXnkyrQ+rcRhVrZzBv25wWUaD0gImGQlavjBmQnEg6+Q/onZEKHHQFyYs/qGaYITQdujwXULwd9oOmsjz+rtXAA/ub7BPhrF1ULqi+/MPHtHPwcozhmxxiPKSZS7Tn4o1XUP6jPBXfknIhe6nMkt4cyZIedYrwdWAOEgkh9h40Z0xPr+4ORc8jGU2PmnYjv2Sre8dCpjshmBq3P8oq+bcdidRMRjk7FbWnGTVu32Q0ac3stgzyR0nzKEtbhqiufR2lSaGbO0m0ulIBjT7yJ0xmwgzbIkGJYSQd2WEIOLI3uVP5F3LRqZ2iaf4NUyWaPcAGlek/cgjU6u1mMfmS3A5qQXOmQJc/syzTxBX0O50GlZsqVfOkq3sQs1+GVR0Gui3gs9gF6aSr143TLbu2QAIS9CegfjX/dRhAjRDN5yg236h+NZpwAzuRfvMVVAYUJCloQQLfMJALXr7eiqrwQS9pdCmpXntqSi/JwZ2QhNflgIgLxETtNQFqTKlVTZYfgHWLApgkxviyQwMFvC8tPx+lnHKP30IHxW8Xv3DUGlgxaDoTNGpvTaT5Y6F0Uhp2hcs6qUf7XF3K+f6V2R+yL6yZkcA3ISIAUTk1UiI1x2AeqKU0DYwzS9fqpl1wTYB6YVs8e+o8OI4j/XW/VsSYEsHqsvq4LsI2XhBHeECX1gL2Aze5Ik5vi7daAfyJZJW/8qsmxszt4RcPmkm+bvLaJJtFRMFWVyOoE5hKSg0BIZDFf3Uy6XRdNR9dqfBlnU8fCegro8QtyeS3tZChqdoYZiDgGqvVqPFNz/DCq421zXh+samOM2Oa1engXA7QgmLsjozZbrdhoF0Gtv3XRk8n6H20tHHiR61tXoQlw9BCkSkhYSIuBFg2UnhADFf3MHTu0oYJ+4tNK23RDXJFG+2xkAg1PCNJXy+st7qAYxv0OEH032e/DF/VFbENsXWeADZmb2xbymRvfEHzo10zVVHDvtNbZHgAnwBH9AL41H8XwP46h27eUZ2SQpITXrdutyF2Ii6LRmge80qo4CfPsPjLubdWzvywRzeclOYw6D/fbtyGhDGPjR2osEoSO3RkFLYMyusKZ4K8e+oGdd6EQS/xqNIKN0UdBG929DP2urrloZFQptG1ylWC2ZdDK8F777zCYu+ETBG79kSlPQzxMOieZ/4UFA+RjELGBrQ0EvU4UMgyV33bwaE4BR23VCeP29YiiTAknDNmlzF/lOovH/m0xy+Y65PhVVqqy57bx++icTxUCdCKWcK6o/TC3GU36D+TTLeigsm4uo2vatjfQHT2gPPqX8kAQQQvVGnH/gLs546bf2NMNMOns3ub0fwxtgZthmdrsVNbKuepZSoBHkTmkdsYFyl+8k0VjbmwnAcOgiy5hwd0gE1ipMI+tFFz9CRvpzcl27Qtw/AILU/z9iDV59pvH4M8tyS+5gYDODRXuPnBvY55V0bxBubbwrP7eMA/BXZrb+RvE+LWt8eeE9EAD6iRV6vKcGgrHF/GRWKwteV0MIFwU4mueDk7xXh0boCrwhgei1WfQ1orjjCCIMGVYL2PuHxVE+s91nzVMASDhhrPw/GGhfsGMU6W5n5h5pEkSlsCRjhm57VtSHLzDCftBjcEz4KgL/eiB30kjj6FR2atCGdcv1lKtuD8pwA3jhdQ4C/W9DgU8c4FxN5a7RJ0wZpapzBVyKLM5mcyxRo9/XjVXZDCo8b2dA80Io/HABKvy9eVwPbrNAJYA+BWWpqwyJJ23wygkfOSW1uh2/ht5ORqm3BKRAiD3npSita35PmMTLcvNjJQQwAYD+IOx9D4mzp4xuR6IajVumTMMgnUf7X5fAA2GcIJwn+MciCOU8wkFAo0AkGYQUBQPGAbV4uCr5nW6fV3PEJ6cQD31wy+TndcAsEVAw8mrEU04kgsQBqjzaPUFklu4ti7QX7nlq5XLxOS3RaWMN5aRiWBKj19aHII8Mc6ljsYvQnJ8vt5oHfNjFeAABnyNn+Wu4bmVzWnpTw1GTYF6iwhlUfK8is+1D+S9Twv86gWNca4SpsGyBjb/6y/mBIdMWdsIkFqd2uDHAQ2JJtMiX4kBPSj82x9BRVMJFFAO9TV5h6yihroLT37GFJRAJ59PuYhk9cHoQHCqIQpjHhz3LGdInZtyY+pj0Yo/iNaGhUHAvRvQypF7k+6PFCw+wcAHDP9xkA5/daMo/D9sdo8AAD/aUr7ZW3aj8pRg7fp/OW8UtvdNhCeaN+NSaqQ0fY2I2DLeoeja4zTWNyiRs+OR21ooA0gawLu/3YI/z2RaaDXdZ2c5pPfy5Xy4YhzBs818cO/W0EpSygyMzGn4Bp2+iG0jhMHnLI+4vBPtVe1zCrc51rG4or5+1oPNzCS9plpG/qf30n/vy4e/AAdJni4kJphGp9UzFlTuUzfRhWWhJ8l7LSu+V3tMDxJowkahFt4QhzgD5AzRyc9JzhJxUoN2xvUE+nTAnQnNUE3DNGPHDX6KPa2USpiiXncTUnyslhMZ3uPFmQGcog0SPIiLp9ccHHthFv+0ubWD9qPH+6OCwTDd4sj1rFdoGjAHJ4WiwgEeeX+eram/YF/Si+ZxGPTjlPtNoqbDw+b3BNP1IPqAb0a/SZsIHzT20kbdQ3mHnvW9Q82cloBubFf8farQRzha2lyW8sPnGpZ1z6F2Z2lzYQ63mlEF+BY5JllNpNny9T8F0Ta6eqoGVOYwqvEBo8wfLVtfRB+wUDQ3eESox7Yg5SFnViB15UTxozbRyiDmFBM7L7rYe0EAiOGtrMtGPurydY7s+zclW5Alvhinf+qiPpMo+X6MXpXnMV2/vr0YJccY0rp+kB5VGcwoGzkZB69+F/IdaYllAdom5hRIoVcKGAaZeLdhfPLJ1MX+UsxuuKxcwviyRvFKk9qHF9dEk161VchkNAeBOrcHDrEOWJrz2u2b6grPFxxR4KEhp5JXfgC7SoBvtaO/8nqXDJTtNqzoesswW1jU2X9f66IwUiXJSt/vKZ1lnd2dENZ4/CvEcnDWzJ4tuVYaQayNesjrVOGweVaGc94bq2N4kXGx95sAKeFpCgg1rPyM6RA8Yboo/xVYo4dS9sne0pu5DJW/elnE9+ZVSTPDhqEPSMdArq7ryPr7urY3iRcbi3gmTWl2AAUbFKZOsaafNDCtAtftVmNpmHdFSLDnVQnTtW6bl8k0RXv4hRYFQm0owoHbBqNS4snoVkQxwtejfB3BJshTKuUZw6JU54bknj4i4h4vnqiaO2NexPDQ3QMVy7NjNgu29bIShTGvHG3svQBe0FRANQ39c+xJrZtv1JO46LFwVIs9pexkyz4zi3x9qQve+QTj0u6U7oTkvMfUwIDAlgT9Qz1iiKcQIEJyleNMSN8DMko1kxzPp8KJhC4dS93TtMZa/dr+G7f90IZYJ8AxVzwTMpoMb3u5Updew/Bo9nByDr0SUsM9G5f6OWe9w/nCLVljWU3DHtE4R/P6Ee3KMAMW0Jql2lsqkBOqKKodlA+VX73SuxiaJgG/PP055DeaYmf/OhdeEepfQ9FyqhXZ8OMGhGuOZ4WLrpVoLToJpcnVog2AmaL6Zl1p0UXbVchDXMHzgtHk5GxgxikpwJfQR3M1erg3z9ncM9gGB2raexlBWo2YWIGQMIlnf04bV3+uuCWw/M7IgsHPTFc7ngYYC/jX8cCTFjD3f5yWtNtFTOzQu+RvfI3vUG6jwA9yuZclVVGlDYZCDIrlZqwhBeBu69e/wLO+dlXWal80jE+VdAr9eTHUnv5PZRghPmy2sAm0K/IC3Wrw6ABt4bIfL/m//Ty9IMfzwG2E6+L2bhvTFqFuXamBrJ2Zmujzwip7ztA5ujc468gI+YFt5Pf0rBudAFNXZ7892HMW53NPkQP3TZIts7t8dLUlvWMkwV+nFEwwFTjypYynI9NGIx0CCivGSrIR7orqsQQDEvqg6E+4GN3ubKt10asohk0DL2q0hEYeIGiZnvboVqa/Gg78pwG7+3i7HvrpuBEbWR3ziDI+J3wTBITXejzGgpVHX/RkaxjDDO4dY6/fYQvwcPIO/fc8nsD9/+Tls/mBJIM/m8uHNaAryoP2PM/DNeYB/BRdANZwFozWiHiFOHXzb3spdm9wN1YR5M4+kt+S0HzYTf2XtoEqur2Pc9HUVbxTv0vBD4fZIPqKTGc4y6sToxQIcDO8lBAZG/He7kuaCJj0/8kFnHDxrgUL0D+VzKNAmj2CxGCe9UTHesZWKjvYpRF9nspONqeVeHJW6iW4TlF7m/VYVBRxaVywD26yIYcO9E2I6F8CNzBneX/hKlfXghCnjxv3FtUL3yhMn8Rbm0lN0zex7UjHMj/v9GnL2kzgkxxKetKgHJcs5+BR8n6AReGUX2HvTSmCyRunnZ8o6pdzrhoPVY2gSPsJT+0YOHOqCz/sCw9r8Lt5M6a1PL4P0PN8550FfkSZIo1EzvqfyRBQBlGYo7ByvGXovAhDdsNa3+VQDKun6UcluRdU46825BTouSSye7rFFSCDgV8uGNg0Kyrk5w3hTVB0FwVFmXqECrDjvYqJS2uhOpCeo/eZOqOlu81B4iC7lDFkS67QYtjae+ICFxiPpS0uyccvifOULPLu4jEklhEvycjdbMxoVUCy6sVl9ujUfvVwfSzUkrx1vyK05c7A3Le2AvRaj9K3PVCyStOyccu+FOJNFcLXqVMc88ejrBlC7NCzhW/pRtQS/1uN1Ql3h9zXnmmqjIKNjbI3zy5lphiY2R17wyJ+6t33StxCWLGRT1NVSUBwTN1q8IaLp6iykTnjCxoRSB9QVQlpS3eRUQVDYw/1ZzTAUjO1VrkBVARasm1E2Ww6d+iwUT/4UYkThwqrAHlfiyYv1Vgvcr35NINfHb4464WNla2RiQX1OaaEOKWwtLhbnmMJjP8+Ldh3rvupnl8YoXiadK4OLIi1kPZIJuXCL2bbAil93qRlOkaIbR+PyyZXBZVopA8ZIE4NrhyZlVf5U/qYyI3JrjOzy5pRYJSXg7p6G47fFjKQER2iDi03hg14i3jvfUEwULansH5a/u3K90dpnypRGdeWBIcUJdHQhma+lx0A0df6fTpjTq0FSCyhY4zef2EI4kwjz60xVU7ywLDHJ3vmd+4j6LQGQDggibjWMVUWkul0C7gCp7+J89abnt44myot5xscu9V+R0ODhHnc0w6WxEO6mJscRqBlerOESgiHSuWGYOnRL9l5nI3gq8QdCW6ueRiSviMRmXCbIqlJTCaXbBwOKOax45Kn+mZz8ivspd8v80j7WU0VZ3/TpD4ZXJIlcY4vZumB3N150hLyJuEhdLflww66E9r76km2QeIw+9EbPphjNoHHiXDGX4x7DC4p0iVeoQxN5yzv5OV/Po6J3PPBXrRsqRBDDpDZ60ffUvpQleoOeqPm18bdSVzyAnTD69hId0pbt+8xei6bgEm4UwMRqTf0KTTaGwJqYxw9uhv2huZIzDggDCS7DDbCSGk0X+fnj+CW2GGUdBUyWmuW/qDdQdMJGpx8/yHYRMRpCrxTK5YwBry32C8S4rALKzRVVgepKIuSvXfxiNB52BS9s9MNqVxPcsso/axw0Y7+pNkFXX/+Jp83XtJc3QIkF8dU6l/aja0IiOOa9UpsaWUkVqWZL9cs6MAiDplOjvEyNpcFeEx6RGk2WSIokbT02Z832WUjUgkHZ3D4HBzd9PYvRpMbIivXNFEkRJdVL8uD6AN/jk8/Sr2rjsmMDyrYQmXUM3xI/g+2554S+NQklcOCF+h0RSJVv0LIRTsKa+tipuc1VlKOZR42H7rCQ4A1AUWzehOheL8W1VgIhSKXmFYq+F18FyVv7QKEN+/sACKzylElkvIGTyAY+Nrb8/6/Y45rMWLky9NKV15uESQ6JVrknjRmNF4RUmq+SfwYy6AWPvoyaFQHfGp+FjtQ31LWvY6m2Bdn51A5ebf5UycLg9N/4WSoUXu4YC+WSOTddVGcczYsXdRX02d8E1B+rJj4wPFbrrH7aDWOSLph0Eq8C5AZF6gU9ammI+h/1BcARtOWaAQffAPIweegCBVRZnUOwq9M27lnw5TY/pDuHd2EzEgaeC3QBkyJwS9bxKlOdxP4ThzJ/1ErOhMSKTLIszFomqQJiUoZMaThMfEADdHjkWwbvzl8UyZ6Mg0+8khhXTWabe8/fsYsBxcRosgtJL2QJd+k6Kgan8eGXMVzjWLcXESpCvpBu5EiCOHbMWsaPglAQudKsn6wD0FTBN0TE4tqoPj2D+dWU5vwke/5rL3i/SrmdOAf2HRYWDxOveoMMXV175CLSxghziqrPzYXzbjO+un9St0KwlqIGW7cInD80y94CGlXdeCVmhHsAnN7ZbA3C8jlcZf1RIBNAqrT+a2xHXwR8XCujqiaXDNdtBIKu7yVHTot2KgN6OYxFcjeKH8+CvzUffpdznDnLbqPskxjfpExL8SWgAK93e4L1ai8a/j/borqaOl7Dicxeq1AJOw6wOYSkbuxGg+0SI5S6lNYkKHk7Dm4RVL68dx59mNGKf4PfkKKIsybvp0Tr0EzmgNn+0aI7xqBCXIvemxiMAx9H9PKCDxk7D0c2EZLGaVqGod9TNwKZt9FwEG6H97ARyCxBSOny4YLUY5m1p4ySDtRUou9JKsyPMbTR1dVrrn89xRFYEso75EqKgVNKZ6p5Rs/O3Z8B6+2JTF14F7RrPNJ1rYVFtEGZh0XsB5s+3ZS+J1VS3oY9ogCSgCIGn3Y8N1XsnlNuCF+tkqrQw8qXIOy/KM+QewrgqzIbSaHBreeIJ0LgvFQezLvy+VtNnWM9SV59oWciV/PZ2DlYxK2zSVY63l8gPc2JqG6eEn7M7tUJCo8NXnLdWIZVelUDsNnS/lI5wM1lVhW3PDZAdFpyrqFMC0mzPSK/tAk+ghxotZog1USQXAG36Fzy0H2ypt4d+47YLstpS5p+1xH+lEvCUkrwmGwni0EPBOR3GMoXWyP1+e1oOWKQF/yA0R2VsKrM2sBCsqqBZ/0tvzb27cfx4s9LFjr4CBl0xb+xJjJIBpJfOKXjhnpSqXdGZs3d+Pzc13t69LrSbVKRmzornXXbDQLhCm8BRbB8kx82rHjVlmDwrOYcFkNRO2ZwOVk6OjLsw9BW+cjg2irSpjMFGwTXV0uJUCcQpBq/gFH6ExRNaFJv7iYjTOz5MCq7+OfmmRYdVrYdW2uwvxpQXknpfgj2ixOF4kLuURtCJATQvdg5AneOblkK+fhNkOUVvooCIKHyQrEsmi1NbCIi5FwjmDyzLNfw5lO9nx8ajhPrxON/JkXlvOHajcjrc6Pom9HtX6njc/JzY/Kt2VtW0Gaw0nibLkd5dbhCMtn0fprrHov2mT60Oiv5dJD6IUCYudXiwSN6i50IS/HrgOJM1ER4kpOLsWiBQZekc2mWg1Fb4UCdzp6Lez8U6w7baWw5WJuerBpgmszWMN4tZuavKOLzvL60HzkRgHE3g+AohjnUygZ/FbcXHxVLwjLjPAsqmsCd04FbL/a/GG8xRXUUAEtm34tTvXkDLqFK/V7giyeTnon99cklY/wjMcVV3Pia3K7ncBHeQF6q5Gz5uoneLxJNuv4ECjB9BQ/UlXJE81gqun/0VnrPhoKtyB5W2xQsRgeeoPMI3uWrudCujkeGLSaB8BUndpU5MJCqwi6HfmVqkWrdBwvJiSnrFfIGCf8JcqiS3llymuSpIXLpzPgYyj+V4S8jzzpItyn40GPMv9DiuUtpwx5pWvN9NxdIiwpFlXTR41kyDwPdlgX83VfTWphOGLj3LDd3KJWMNk6bi7CFF8lp4P0/mSTcsnGOa4t2tLux92wcl5Zh/dc87Zt1Pq9kt6ObNbUBn/5mW4tJ3QlJsCj6YssLp64cP12CQFQC0NsDwC1S/LuhUfKyvQ5vKN0P611A4DJ9mr9/G3DnlSO84a3kkvTWzlmaSV90OFDMChnErBGNKSswvou8vpn1mfH6Aqke4k4jn3bQp9hqTR+5O+lrEm142RjVxkB1W6q5Uu7/NH5Tke8+lWhxbMQSJ2s9SDLJyWzX8YP15XnQcPqlBTN4jGxh/LVl6KQFa7Bq0hZZEJ+5RYG/Jbl6CFBNh3utYJRn8e6WQKvfGxKhquaW3H63jtWcxZ1MgsbytWlxMZldqcSi0iSsrQVCC4ID324M08i/jtDntxoGZEDFuAB257OiPZ7siOe+bNRWMvqo8+p6o6gh5F4CmYvWly05julJg0BWhSX/A15M+tYgKsSKqj9YU6Pq4RXS8cN0E0wI3XIiaxB4GpA4nJSmLy1y1higPl2rvDQFBlHSLLfb+QPLbSZj+vF02c8FArVSXcqdVVBLWkUDZhQ2toylSI7uOmrUbyOVPhzBBtqir54vs5mHRWhedZf+9sr6LD1kqMypZgXSN1qunZmHo5zldqM6L91+15boEVrgYVpFXSkf2lYHzHLxJlZMoCa64UeKHzrYzQIzCKMKJ8IMB3SdwDPsKopATs9TBu+2nAhvIMUAzWnRGIQ/G/+wbnvbmxwXS/12o4TsOViyILXeir35PFr/Me+9EX/4dv15Ty43tgfwem8xpkmeTOZ2LMbD0id4Afv9oXrePHS3dMxoKSOWL4SZ64J0OCzv1o7be0geACo9VLBuysC5TMUQRftbdjZzjWUYB3A+kBpG1Jc/+6Xr4FqYVY6no68d2HJdP4c/QRgpwYVtbxFM4UIPBtuJ6KqlB1Rv+xT2b8muDZUdskE1UGBOB+tWTMg1vVdhycb/1SNYlYjTNmY3fk5HwuF60IqvM6yuKgEqoImpgLCqf0qVMROJzpeSiEWMtfebbLSfHEvfDFuo4MhDSR3Td+lP1Ds4x1Rd+U0dVmsYq27v8y6/YWjNrRGR365NtF8qbbBncK5k0Vq+AZQuEEzLUx8D5s2FiXhje1v2cPACi0u2whqaCCz5LJ/HvmwZXtKanUez9z4SuZ3vzD0fRlF4a2CqJsiJGecM7dvxcTFHWGRiUvbt6ugWcumQ0ByokLFW8Iuc0e14GJU3QCiH3Wmifm8/PEUcQdIirvXvyamCwQhMf7P66DxUqS7e24mrzV6Kyna7N06h7T2rzGRSh7Ri9rKLK2o/wPD9tcji1lqibAtVDfXnHwB/0myuDFy3b1Tdyr47j7/Jc/SkWuuak0z3lHU19i1Y4FU2O9pou5cr5bbUrjlwAezopdRraPdPIRr+rLrqIe9K1YKDyOCPipaZOumos5yMAbMWMX1hvqD/KlYLlra1ckh5RQb2e7fBZOrEbT4Oguxymniq4Ie7OtP8pFFaiCwNIpLW8ctasIKlQKPhKhQ0zHfa7WANcR+fz4dPh5zz8ZXvcb1tQuDDZESo2AnEJBezw1MrYg+/C9W80KkjOvQEoiELiTigAaoq3cZWUer2iYtHVCKl6UB2Lii1Eig4Rq5pcdXMRkLgLI0Wga2EVU5EWIvzabZ1dM0BVE0U4qs3ckHyJsn8e6oc/KvxjVP0Ws3dhss1z6I14rAQQivr3z6mtFNI6T0l6rCRBbaqVMyDNWascdFO4schE0X8ma4xNTw9/y7FgxzLQMCpBu/IXWAhRQuyQThkJlCeffEmeJiFQqsry9EFfwDhNiRX3J1h/zYXmpf+crX2l29yZ+lzEaj+faEl6jdiv1oiNCHJ4dNGQNhuimd9IhqX/jJfsNQ+/0UJColXmStj+xLD7SFqWDPiSv12KWJ6NuAGQ+ln7gGRrRbQHtG/MIpypqJFzU33gMhDPkOL8XbAsUHZt/FZUuvR0+Uu6nAC0WPOZ8PMEPcajevdVtY+hXxAhv+lCvwoR5OFu8sKGHfg1BMUpNJHbgAMNSo3uYopDv967N/NV2CeUsRTSIEpZ5ATSbQEYCkUrnOH74N7+gpA1BIsLCRZ1z1kQUynKQ7df5/eALPAWMLHq+RRZgv/F6uVO8FArwxZ1jqxw4qzv0UALecHMhP4Ra5dQM8m5/M707oISdZ7fLDumUc6osaoANAf8I89OWgfGZs1Bs8PdpWEL76G6JAoxkAxTMYWMuSknWzgeWKEpSiayadELf7NmLGIYNBi0tgST8HKq8+szXjI1Y7lt/E0rJDRGni1VrQJTsuciTTSxxnb6G0ePHR56Z4qaV+rV/iHW/6nM52qadpHkHeNttP6Z6iN9fq+F/TKMvsY/K5llU+L5KO6ZpRtE6l2xKYfg/Fh8YIjW92H11Z9kM64nku8FtimCC9pe0pyuE4+v4wHSLmTBFgBTBp8BsRWg8zVD1SK0QWrP6GoGh7FKDB/HrVvYthpr7oEUwoYJBVLa/Uh3ICFAe3PD3xFFphg1j8FcoksFoF9KXAb9G89M5MRAl9xoEhXHsT6U1Cv49wq7PEySHCzDDI1pBkOF+vSOl/XjmGzvRARULd42dp/E8TjVp0lmpsSBfJNf8EDcnX6nMB1GFynapF7MxFvgS0JstbFhGNCsZdIq+XTwqidveooHKgzga4RTn44UEWUf+rILk7GjUFg4Q0kScl6pE2QvduRGkOF0IXjk2qc5hlH+MznmE6YBEZ5CVa2PmoYbBRHcq3i0/7OAevSZNeezM5ttVDzA3CgI+ZLkiav2RuY/lE8/ecM1gDyFBaKVTwKokXdTyjolmlAcPKN+W7VNLAX8bSchLhP/M8I/gHYRNx0dDsisYnaabnh9Kc6NG9gAzx6oliLeS2PA/DmdKTZVZSyaLOftDzczM56iLLJeLyHR1cRqQcnJY6E+R/w+jb3GegOLNmm3VBh6XtrnD8XtGFJCunNQ5mG9JVpaBJ30F6dwLhFysja3qw4EtH/6NimT6Lm0DKH29r19SYLcrXfzPuu6oGDZblvQlZr4gYU5kfomyOQnWrEM6hmka2I+IVrk4c1asG+BHGF0MA8fJAhX5isJLPKKY282LQT9pBPNMpHnbvfhgxifnl7nYjbcqp4+FNs3T1lQ26cNTtLa3/cMDrpKc/xTSoqoMBI6qbGiwv77Rv6ust5ZlGcn5jja81bKlBTtZPXLHGFU4mNIbaY+N8VAq+yaEtuIoD9Ihy5ZAc/KRhcOLSN8kJDLYu+aavzzH+RaZkeggPSzrt47B5T47tqocapvFB6YENSNHiZjFuh0wfcBm6SoN8ZBxU37A6FThcwI28orWLN4523gmrSEQbZMgTjgaLmvR7biuXf5T+vXw4sRY7UhdZxrjeuV07prYHxushyOY7fJow6g/NIZWfs6BCx9QhYzbn4INA97661lnLoruGjh4NGb2Zr27pD7buCoh8P+VIq8fm/Yu70yGbZFXwZpoYGbixa+T139dh6ef+6HfkLAzST2TLQ7nVrWe+vfKCbtTXFEZKqDGHe2oaMWHm9b75WeIbqpFyBNJGmOIdL9iHVlmeivwM1/b+7jqVFeopr80qrOzvdtzHaxCgUb7mlYAoKmnBCx4qiDWvppQ5ke3eUWj0xQ0vuMHU7n5ItAvZ9c2q/VaflILf/810SeVRJkxJUH9neoYmvzKQfqqMcfLBtG3na1Pi4bC13fwrKhXBiy+YWnprkGtyxazc2Eu7+gvE7LM9Q8uN6t++m4htXtB9ygINCyjRP0OXHfZJCZ15+dRM0eXpmG9GNSh+yF1WTEOAdL21tZ8OmcnLMfAanx/d2xNbVVtkLW/RytoDeT3fXZbN0h0q5Jk3s4HQGpFH5JtylGRroP0srY2wveLEDhxjUfMei3xCCwEFaXahE/EnaFgGNXT0Lrx6xiROys/TP48iDzQpHnorOlxvr0twzIFZpnYwAH4CwKrVJFi2ZB5yWZzSpyTWALf09bBhYUgXaSu7z99P+aNs3IXsUamGGtmqvu3no35Vn07W6EGp2NUf6jtlHq3z2dbwk9udkpuLRxjGw23gc7H/jLKCyjO2tj9JRNpHJW158y8+DuO6d6as3J2HF10kpV0AgonOBtJmRuIH6hiNVYHoUbEPQClHvIBmhiyJURLYONRYfN0H3PhvKriyPnXY4WuM9AsOUY/m9dQGv9FQPIqYHhZe9yV2vCICU0y1bdWg/ps1qwrw97Cd1LTZN4taWYnTHj5OVRy3zI7Rwpez0RnD/pLTdKPW4UxBeFzDy/QxiCfVhfX5nsvjzr1/txcLqcPn+KuWHO2l9QM2IECeEaouxJ/7maQw73MaKHtLWjbL3ChzJRdNZxAYz6lps2IA1jBi5ovFLqpt1NzdMZ2HE1KWQ4pKaE5chi4+rzq7+XqbDYiNM9em9snP3pd5lkG1/P3hTLj1f03pTOgHHJLd1YNn6S35qwfrKiAjf0hAskoDn6U2aKwULHBo6lRhTcxYIFpqWZJkYiF/n93DJ/DJEfe6x0oMEM7vutQQKxtxm4AHWJZd4BvGfHaz75+EupukPKJ7styMpFTQPEXykXX16ciwM+XbCPC767n2JF0A9MQq6WB0qBRjHcXdIWbLKDCoJNX+jiSKOAlIVnvFVu3pW015vB8Idka9tqyLfvbsWZPx7bi/5s5wDIS57rSKVgv01OFfuxWCNVZ1/iE/uGGvA6wCj1XQgUQusZXpJC07c07lMMSQ43MJ4SBA6wiG2AVmgyH2QOgeHy4Pkw0O/CHcui1OgDgTJKSs8/EYY7M699cdvYZl5EMW9WPW+IinqgmDrrrtSUJuhbFUIrY8hsjqwo2VOBUyskv0v2MtqoXfi+yenRfHnqC2KZGW+qfhFNKiEvdaf6gIwRybtcr5H1mX5jm2dvlQMKS8odkLqnq1zadNQuDJ/dwP/+JofZs7qtyus5smVECLSPo0yNAoLx5Mai5vEWIUg0ntmSfxAfbPNihBc2wn11Vg/O1Q1CWox2d76RaG415f5Av8tny0XwTBBG47UDWhP5PR0EWsNG0VGt4L3OpXPp6s9mBKAsm6MtphTLXKp5zYNO7JFLI/zA3xZclFbDE5DlCp52jt89M6WA/tb5E9O/JpqMHrXgLNAeMLAZxD8ijOnOH+EVma6IstcKpEWC8x3zvfMxWxD+9OE1z20+bO6cwn0x+bju4OJRq7EYHnZxEIdMnxKtHanWdgjqK9gns2PNHMnqv6JN7lNNg0B+V7eP+FOw8JuF4Ab96aSLbwScgQnJYQi91ciNVCou1XY4+GQ++w8PNwO/RGUMdvVL/pLD5TqGWdOfnlFjEc0EfnXNyPw2iwwpAb3hCInCqLDwDUVAaVAQyjMh+vSSUu92lOkOIGcqGCqR9La9Rm0bR3UZ0TtwB3FWbSPkyzuS6rAOEeefEHi0cWqtabBhzZXhrWgxIxVpjoVroYbJ1SwfajCERoA83eqU27bEQbRrVfnfof0Lc0JqIvHF+SbwAnmqwtwj/8wpp3ryO8C77NuvuFARHpoioC0O4+kSThq5mFb3+7ZP1m6adLxVzS4G5JChKx999hPVxmeU8eFCY4U4z4s/lXsUfgtum5PNjh3B7rHvWAY77h59KWGooOIK68QiF4IUpzPUlPE+h7K6EV3m2VGEXonmb/TU4br2hgSRf2Am+i7x0NzYCGlb9nfMdnFHjq9GlkSJAkoxMT8f+QZ/JPf2EhGlCXdPsBVWTlmjogaW9iNLCPsbYUBYQYKEbmNo4oJbX6M3/RlVAij53GVbajBilBp6ENPlo+0fvEfGQGcdzIL7rq6xkb17fXHSxk7QO/PT46bbnIWGTBxz73uCKbhImFGWx7+cNOwPw/LucFfU+z9TXvp/1dsu0w2elHXELlNGkgbeY+UJwK4BKjQNm74MCQ6mIGplffYg/FTugXPO/GVXjYEKpbmJQ3Zkedg2Z22e/X8lf/AkWaFsT3J8UNsZwReuENO2hQaLstsnUcgekdyGo130EuQDNOyuul4xok+m1gc8ak2Z2sE2D+AxV03PSqLSbWl39nMXXtNE2312Lg/mQsWkcSOJbH0mNW5HvBLHz/JGRJrSDKBLG0VpR0H64UIbtw5LJ7pa8tVUnn5a42TyqDu9n92jrV7Il9BRzp9v1RnrauHMzwNaKFsRHfYsAyx8o0XMNXkRFrlcmZCslmvjmvDMZD4w+J6yafHXTMDHL0I30v8/K/9yIw98PBehCBB7UTDk2gW8TNQwajSJ7T436pmArO5uY4Bq4emFcn45eS/mfwrpH+3hOexk4FqoyIEydqlxd0VJ6fuChHkMY2ok9Zi33cfCDAL4+Ts/ge0aWTpXSK8k/Z99UwCYW3xtEYVsHcXZanrthDY2nNGpwRQxndSjJpQPQwVvSaxfw8BM5fG636XxI/3bqE3B6PvVLLGVeo0GaYiaIiOcRskGguKqh+L0UixYJ8Ib0OkQlaXaRk3PmPz5A6Jd395oCETX8mNdlDjMRwcRxLBDN0vI/EAOF4ree9+fvvXu+CVtmO7UYZ+FpwqHpWUgFc7/DDUW/hk2yZ4mvilaU7XOTkKys4WVonItmcLv4PLl5fIFed+6RdcWuRg8aZrdqKsa9bi9LRe+7EaG5xpCdWdEeWPLdfmj7YLDsNa+VF9sJ97HRFZ4xvK8xpPQIs2q7OXCUaTPP3iAn/F6SfesDHrQnLxJNDy0osDaBrYt8KbQEh16F2uNWQ0+9b7FIU9uHeaP481Xq94FipsfrkJow/XBm4HmB7mnJsUbTjBOQmraQC8CcpJ4JQv98TsDPtAqeqgCTBuucHgSbFj+1qCZv4aQM3TLr6gvzOISXsRYqxtmBmkFBBcoJtiAymnBcgTcRpf5ZSsXgdYdo0Mgl8JWWdSjQfCXGX87r5bYSXF9rc0SHincmCveq9yE7jwKk+Tc5UD14GLKuaNs5CyJKy4T/4gQTkfAAOYGEi72iW8D83gWqjwCzRsiWjpoCR62Jw1DJHVSlmN+RLBKPETx3adKlqalwcPCvkFcV+J/RA0gmZt1md+sDuSkfkX4DJIo3QxVSBElIEUgF/TBT3/8HDowd0S0/Q3BaEJwU7i4go2pn6Q3DR0ldB+k6U6b6TEO0KsLmFRskdSonG0dxjIdylvqOGC+2czTSBsBet+gkKqQ0j+1aT6iGC42VXCsmOog4hoJ8grdnRIOnUqbS90pq0eaRPAC1eXBi4tJmRCZkGThlBA5ZEfAkw8eUjbpnjDK9jiv/CpC5Weo+yPuRay7Wf1iK3fwmSRusyxnuCIfNnZMLT7sVkfePX6N7oFReqvLlr03lUmaUL0gB/lBV2p/D0KM2XcUEw/ol9MAcLYF+CfTaS99z392slotMXfWFvpyX+g0ZQnxYJNl0t0y4UNoP1HgXGbgr+d63DpgAItWIIeT0tKR+OugIxBZKz3bQNtwiL1v7hKNVVWIY+D4RizAMyyJKeROi/OfLkkKreTec+N5MzQzmHUsPYevWBePJbPaENuDbj4US0xGJYJsao24Hrhem/kT8Bd0sLVPv0a+fNmqxaKdwzsBKFCgxEqsv6gh/MXIQd05mnkfi3+yPSKpEs8x/5Klu7Cq5Xze43U61c1nbwZEjTQxuTecJZ/YpwhRWIlXaArP21/zlyY9HX8tKECh0UJs25dD/A3v6bvReHvD70f9zW96V1l7DpgXN8Oe2hUBLOoqN2TkVCSmSASH0YJlz+k2Sjhp19eDLUEkXuiStyN5M896m2inWND6vf3VaAi79LBbeADF0fDXGO67vwKL58a6IdjkYPvuYQ6ON1rUAtwIh4aofe/vhcOJ2ur+pnIN3UBsEMMl7c+GFLR30OG7M6dr/yH5156F6nWQMtuWj6DwXKs+qb1h+3p6nPIDVGyqYZ7pbZGGooWnBiY8a1Z82m1xPA/y1jP7sIJ6oRubRwA99M0BSF6b3kzhi/YvXFwmgMW4Q7TRjnjQ2TYvmd0y12NOREyyijmhnjcu+pEBgWzGVfmzyb1cve5ZGzQhzPGNEzmuJbJCFALh6tTjFhmBh7zOCCni6jOwzQ1Er8cR2Z5+6AfVrycWK5RBSvmDRTTz6I7HEMShALZzxej6zd1RdVFV5PPX2jT+SPnj0csYBlyB6m4YeRr4VWzV6JiNGS7aRDulN42Z6jiBO496o07ZlxnoZoVu6xB+LQ8p2QEEWyTGaJsK3+F8G5TrPzDpr61Ea4Lv1SPwQrpG93eXrp5XbmuiAgSvmUZT0anu34sVWG5OdPTYruWm+/fcFVQfupn2YTD5xDJq/eoBH3hvExzvgn4g56jt+/VNvQ3q1eFZoQtlQk7AVPHAgOtzsUomyWgoEt8UM3BOy7U4LH2UrEy9yhQbkgrU+SqrTTgvmQGOHNt2qD4p/W7Hvry3jHUO3FsvS8qAGwHJU3wtBPZDJTh9NHihhwt65pHqxFoYD8NRDnPP5A+wwyCWB2OIFPsAvJ99DoW6x10Vinxh9ycoHI+Rn+6PA6ylDwmJIYGXEyMsaOm/3cjtY/VXqS/wvnn8rzcdNxmNakyd+95IyF9DAqA1e5zNHCxLRapDtwFfqVxa+GHMYXFZenVpUUVW12cznZt8GKVf3isp8nZNY2V1lNW1W6ICC01VGDWkx1+s7pJkBhv1wM0pUj/fXQyo0UjUbapN+uo2LWWYmfPJqnl+mL0qPtk1LvcHrFxCT4n4e6cdk9sf9j8hSwWWqiYR7dWW4ObUsmqpV4HVTzWyXFnu2AIx1LnawPMmYuBmuC+cKp6vXaTY9afVRJt6HSrZ0jqYZ9JItUwGdB2EGAhLVTpFi5g07wEvHLdlY2dru9uGL4HTLilWAQ6sw0U9nmw1CpHV7PFUVCOrk4mDViyuOfayoxnjyI+ikCyllvz4DdE8yT9qz1Zupr5xvGbZ47BGezZoOnEragUNCmtLJWt1rooeDCO6y5skfDQcJHDZYiTY3AsaXDYNZSxrWbPhBb+PyBqlNImLyWqKK9BD1ETcCwBWG6P3Hx1FFc6e/Msmw4qvKh3rCzD1gaXcWUv3M+hgrt9AzwJ+ZLiFV4LwwZox7ZLd7FcbbdMhWY4OdN9oWL15oTbo68z2eA4vUcuQsG0B08aEcT8Aiy7Jz+3MHS/L7/WB+fVJhypbe0wkobTfpp5Gl8DCg/OGcMF+cAP2QdUOca/kQWo41Qi+k3/ksKY6stiFamGZB7mBVD5Xdhoc0GVYHrXDUvHcC8v4Ahqe2YC0AtijBopwt+vdRYkzSdqvNm1PHNQ/lYxsGwRVwpVlBAtTE4F+AiVqshXJog1rH3H2tb0d4G0M0r27nOE2JLK27YbJ2D9mchHuZTQsBCN3rS6HILnhWmvewaEygLTf742OXlsSDNWQm/DEaTOgD02nnn+zfDcPMfEL6CBdf5egH5iSYo0XPu4W1AP9jmEEwbxakfCbxQjEfofhJY1s+2rST03yKINjD1qopqBCofAapL41ok6cf2n7fWhZPim0EO3TjG9iMhR0VqHVimPRiS9aDppN3DL43dCFikNJEHSbs3ZhM8O6IhptMogDQG9UuBpBawRzvXNOhvtrGMGNBhZzHWCdzYecWPoYueQ04NOfHPQQQD/n+Kmbr77JVOrZ5wwCgG3ifvBCWVA+NSgIz7tESrqFMKqXhhMzwiw/WcLHou7YPtFVp2S8hxDdamMRuROsbxmOE8zxeBVsK04HZfWEb7LW0D3T+n30rVhICOdWXBYJ8ug2JGLEJmtLZK72FlJpJrdZjRR08GJceyVJoler9g0N6VSfYA7n/cHc3mEEIEtgJnXZktxqfa8Isw0X7bJaIccXNGhlI0KwPWaoEtmHChWbntjFbWJvn1M1NzMRT7QniO1Xtn0e4Na75yl0cCbwQ1wH71mBFhsZLLDl0eBheb6uxgnc5X/zo6NkX3vBKE+3THwiiSXdIM5lpdT0XR3CoNYyabGLOsexxm7wlVbFeGg703OEx9vkR+2J5edu6R8cR4hClKiTiNlQDoAug2w0aPWcs2DKcqGcMdHfFVauXbpeB5hy4UjoYBp6OgrtbqHyum5SLmP2pZgsbZNGwCkRYpcnC/5YHUrdVYO+s21z8Vt8Gbsa0akO89kI6W4pLuluLmHM7LhaIM2TQz7C8RlhScZdqQQcsLPem5WyT0lNh13OOvCbAzZkL7iHY6qEPdaca2IPUa3Lk6rP4VuLOtNjx2I2HyE8sU8hqQRqVZKzwb3tLv7F9QGdzkDg57j3qYVAR7tbVw6+PUfXWdUTKQMUVNexl7SuJZRz+Ege9RuJjfzOKNamEeKJR6jOjLYo/RQgsTzfRHjm6zW4w0lKidnunwV94OojFmUTEzZQscycSGYWxZ3yy+ks76e1OaIvwmBHxpOFi5Wcqv5e5yxSBDiH+Tn6jrktXiNByH3SO5Rbpr66GC8H8knIIw0jpwuAEneQUtUXHRZXN2YrYhnS3DAjOXxMFXVhUIxYoNiTj+iEfpW+MJ3WEcvYMoE0xTwqC1MYk9nvyEzL3mjRiCDf1hAmaXF5msbh2sRzp+VK4lJStt8wY6PoGkChSO4h6a9uB+r8wdwestR+XhMd1kF5MPlvbdIRc0YxjfYEh8I/SmIj8L+1sK31x+ROU3tuT76EQoMeHPLHRvo3nlksosyKdiKv8HqCx2pknWhshszA6xq33Ux8YVbNpQyFQIp34MMtMz61/3N3T+imLoO+2Q+CvfD/PBK3HS23SGAe7Qtw9EBzN0UK3mC1x32+cqATbIMRKezuff4YkZTVHo+io1/IrZZyg1IogbsICdkAfNIIi6kwoAaiHQfE7RiR0CvSqNrIOpwLdD6EVkS0qVz7iu2xeHtncnUI7PQH9zNJmtegN2WzgKQU38YkCt5IBqVBeA2nbDRe0XvZZ+GAnC7rL4scodzAyKgH8OHpB7bLAPaJy70Kk+Uzw8V8Bx9vp0oBb+ghh9jypib6xzB7uFwZrvgsiF41eMqWgueSzucY/dVm+CRM/soFFyE8VmhgVlVC9cLPrs06bmm/QmBlF5FNd4wEu77+R0RRSli/wAcHCDhpLDk9H1JMUepN4K47f5mnfRLd/RBqffiWHdJ7roLsLbSc+Btq/PRT8T+XsOETFlUPcCX43xLapmt8JP5tYvyzI3XbZIdp5pA07Cwc09PDkYVbTl5ivS93wxm9bv6UF20KmbJWbqajFdGIO7vD0wFZ7HDVaoJ74Ar+wEQakSV0ogxWEWqb+j6ZkEFyBSbAsumZ6dwb+YHstY7VoaTQR5YUl9KJBA1DgEeiBcu/sS6BlGz/buBJo5jtkB/dQKMB0DtQH2BXmWpF6Lpb7c3cHiRMMuALUlXzCMRGt1SAyiHUF9jY/gvDkl97oZF+bEDVQLmAEMAKOdRJGO4tfVk5Yucz/haB3uMOOXPF6mj2qdYrB0oNLhJ3tPzzpSMLD2X5vN853G3SZ3D+LDu5An5Z9L6Hjy2zPybrOnYzZoHd2JczMIjcJPo5hQjhE2HRv7Cz88c3K7azPN19/uSsEGG3yuylBn9QgF5Vo2uCExnWgfXNrPF6gtKlzKddlz63a9vh9vGHmknjFUId1UZalZml0ra9XKCl6/P5WtK3pBElOq0kSu/8npvewWBkTFdXj+PVkk96qCvOmW9LilxgrMyV+zcraGIrsUd/vI2osC3Q49R87Vwltx8a6cXNCsx4KloUXLpqy02aDmWFBsBsFrOITRWZIg+OGfJvNl6OO2JubyDngZz9hDQbEQ5zkWy6D1h5edxw9DVnzWXV/KgaE7uvVJRQUK8MREC86RfhG4TvcC263we2+Hl74by+HLsoJcWtavCEte7w1knBev2rz1rNBNcVeYTYKBHT/ZY9pDoB94zkolondpRDBu/QUzfime5hF9LW30XaL/PX4knMCSKjo5ffm+A0VuYEeOpH9wosY9FQkiZ7CYxedJ08hDRRelO0ENt2XtxzvgO0B7jvoXnCwrgQBQRFfhQr1VvXf47t9s6lkiaVgzuiNnipDjCPB83QCPGyOx+eqjZ7vFDAg5PvsPYFB4C+bU0L54ZA7wort6+57mIMi1KxoYFlvqoUTqTKaNbaC6sW2N1NEnxbmPKWo1ws9t/vGfic7F5O6XL0ZVvR+WgEHvsg9sWDnUElUKHPnbTtsDuGO8+v91vP0ynutsklwENxBYnlK079MIGPCwkh3U5tIJ1J3R77iJ44mX5UoAsrFRykvZs0sgsE5GpHxuVF8QQkROXEsZdqoAHAa6tduCncu6FxF8M0OKXNy4+iB9XXxrOl9qYC7TNGAHPMk49up+zobOgO8GJEXO3CAN+YF90YXMU3uDofV2/yIKOeImna0O2NOde2PnIydqczrLJRqoUZTiSI0MRxjTUNGX0kz8Mma3iZke6a40k07fweiMWVLM62k1ZBNdJHX7RmNb5P8R1ifmmQ8uSix30RKgUoNQSRIRIi5+EstPQ7PPFkVv3MNB4S5en8LI0wVgPi3IozvcMYFPQam+8fEnmsCPUQP65hrRZFtG0ub/VzKr/Lomct+hUikwIVUS6LORbKVjg1HFh2PLN8IoaiWQdD9W/mVS6iWE/puGnNRxC3/Q5AwcvL/lrwlcfCoUfnEKd9HTzg97Fdo2A/HtoAJJbRJVBojJwMOikNmFenELLFuTc1J1/Tzmt/fQ3uzLf6AQ6E9f6XmCTk+P0ANxrYGU7o8A0AXInp8t0Kz9XkwRLAilOauvFD7UYuFM5gOH614qB2SpKjJ+F7ncV42mcnFOMsjFNVu+cS36ZNYt3J1W9Vu+19jLQmi7VMxtzn5n123ZSGFLOEhSA7ScoU6ACN7Pn0WZEvLAc4J/thA5hFnLth0H0DDgHyHr/yJmFEXFl8n+Ffb7YQsfMrQ/7uwNap+/aLeXowWWI0NCWqDPJj7K0XykQLhCHx2GyS4VaQAMyiEJkqZ5SYvw4hLY601ueE1awBkpQ1Kz+TamPYXkjAyZZDyGhhSc30pVAmbjXH4I/T7a1BjjUjXdJI0x2hZ4fUC+rnasDU9Ybyphid1WNnnrzzVX+V3mtNJdodOgpUiUiIi8dFXo8tb78M+qGQ80cQYTSbf4p+HIIgQe4T4VzWz0wyheP/qhLeRecGF/HvqH8tiSxPh2XDImg+Gq9QBIKYEEdcRNjeMVwaw4qNcXGbvwbXy7ewgkJfun7dvV8gJbH1sPn76HY2OiqlK1138seRFOdjeRosFRBn4q5Oi3T9Lv1Bu7nFbYM/r8ocbEevC/uHlRrxUFbadSMAPFEbGGJ15Ao0c9xBHlfdH9yKGzciUwsTAdTPvP+m5p1pE69M/QgotcBG1SF2U4MOqOhovdbOMoOHK6pSyf+nb9Y4JL/5JlHkM2CrsQ0NsisfbS//up6FSSCxr3Kp0Y884lZ8CbOPIAPM+d6o6HH6jxB08sqhmNBmvpOYO+wgNB2zp9hmbFoLK6l4bjzpgOilBPUl3dcgY10lLU9taR+Sh23eR1eVzYQjriaELMpj/qaYeTlH4zk6GzmDODwwHFjSrRsz2ZJJnKjZGGYRWsi7jmrA8pQWwQ9n2Hoxg6XR/RGzlp/G0mqnnxkBcFe7P6rAV2m+1DZ8Q9Us2fRJOJA1tPL0Z4lgwW3DfECuXuYRqqa56fijPuzOnoaMxHr+hJ2JOlMRK/XYEun639o0nw8ZhVnHtovkexqc5FRNPtq1Dyz52i04x6eXw9TkYmrg3h7hnerFVNsw59w3rmSmaZTiGiiT0OayOFDs6fsbXPke/IWJblDqR7p25uaOcYhaC43z+i5SmbmgPfJOe+7I5NOWKAiC2XDJwHUWoJVGQoX8W2ebuqZ5gV2aGu3pW5OW5X1lVm1HySWPVO3Bx6JhcCQy2mnDk42Q17I0wh97Xz2/myiay5e8/IbsSZIXFTuytf2U4WGhag3D7WYuAOJq02qWDdgIFqFf10mL9ZXQRGUD2CznIpiIAgPpeYevpCUDujRXC9PBymJ5brOI8gCEO9TDSpVbF45QlQf/WrfI3N361W9bYTF4vAMj9Azskqp/X9C4dGC7jwCFouTcBtjV4DdyxLmb2tcBM+3JuTm++Nig8Ly2k8hpPzSvEl3LgvfxBvZHENMEFF3n42Y85UvPyJX2A8tUckKF7WsEaYqtPznj1oZ8XeTN9AmQPe3wDMfmtJY8rX0y51m39W6rVR4umMihGysvRSxMs2mKXWejhxWX5i7h6DgAT8T3ggDXP9KXlnDiPO4CBT2Fdex+gmKpTkr8lw3vKyt/aTIm8QdGnBT7ayFNI/YViSzJqazmyhZnX9lhHDwEyo6ZXMG7ut0n+O6tCxCWtA5DAgB2ZKOoCZssm9qTiRbR4uK8dwnvjsZVK4FjsiCC5NQ5FiLrR+sgIUzMjbfgKUteZ2FRJZblZbSOqLP6KBbHudILB2TDzbyHRobVOR1i1w4VhoZ+7tafC/3ayMbQxr8m6hxuhBvjdUg9nKCmkCwI6zhn6aMWbu6tpL+wCRu6gwaZQjY83qVzOh3tEFD3HU274QkdVq1rYp5EAxe/vsI5V8qw5vO3PkumL0pLH+whtAsPYvd36x+x7jFfJvrOfdj80dAvms4Gyv4becWjINWYYnP+NqBe/zAb172pKHLJWJAYTAUTTeGEb3XmFdUtdrcUtZB+Un7zNsdY7ggKIxxsQtDTMuJajjMQ4EaEoo7aV1H7/62bE9sgT0hvpqj2p1ljiJuX2j5plKK+CKdshvOxOE4EKpqiqN+5WmjpWblaTSMcOtMUjD8AtkmLtns8/IkKNkX6xaIEhIsMCIMWtU3Kmw9i4K8DdTMIqoXNbSaQ8QwVUn6Vpnke3zOj/kbctseq1C44n/1dHBDztk/0p7ao4v3jw5L01+K0BMG2SxMLNG0kkvDk2CZDAcSXlUNA7NhhTf8pdU3bSMfcAtffMrrY55OOabeytosLIIFk213n9oIDBFIkTugCxr7sdWtXCmWNMryO8dgPfNHqgQw/Ll7ze4IupBPLzBo0vfVpkwxw0/2FcDvT4PxniZ5xvUKSHNLdUQVf0wa4AGGPfAbghT4aOQR5GfMxRYqG1sq5h2/n0VCy85xiKYd+ZGKurm59qFJFqDTAvVA+O1Sz+tlZXkE13QDP76GCpeZMtEY4Y5eyXFikaYYJpN2yeMRhQB/gq2evEXoINUX3paIoNhosbAfGAhHAdWajbp2yOjaAUgTN+CxvsD5MgPcIWhljL++W0jTzT630yO168U/6UY1cqNw9yGpwpXh8vODQ+ma5+hPu+JULqEccuxjE79BAV3wGekO9LCv3K4rrHDDgU8iKo7be7RzvF0p84zMTXSHL0EkAdsIVbuh9drUP4Rbb1RACLCA6VZ18pS8sx1aiE4Pn4g/OvxJtZycWjlZYdYUnJFVloo5GU737cuozVvLu+L7C6mZF+EFYQaDzy+qs40Z4K2+jjMgpZyKDXeLNG2Svi3W2p5SZKUgiFfg8dx6OX1aZas34wADI1piN4F9i+WysnfZwxQ4mzCV5Yfm0t69wE+M4NB8N7isYSXi4n8yg/QvRZkwMPvZ5zlsagdt0MfGa8OFCpa2o5IUirWeb76Or/rZg1nWb8Qmr0KotqaWMmB8GV8g/nMwWE3ExQGAPnimf4Ip2lQUk4FTZ/g0gl4FqSeYZWIOgb9K0yuFPB++ZqEXhJxWyR5yB5RM/JPy7nYWoFUDE8ig1i0ECc3TUdqdgLo8qsRJqwfw/Q3uw2/kUUGH4qMfQCd4mB7JDDSHyCYD2iLVu1QxsTuwfO4GLwZ06z+cAPL72SiPRMO6yRRf0A+avFUoyrmc2yWy2q0jIXCYwsiqO2Q4ExuLuN1HrNFto/Wa73ldRQI0cr+3SB7BLxSligB0ML5M8GI681pCqYx9KMFyXbdiGR40U93hIRUnC6ySR4++D2mhaTCvoBji//3zCNCa3Y0WdYIwfWGKkjLeQ5WNFA9GzkgWIlAz82jdqi3dk8wa49YUO8J2o2KjLF65thPlp/ntBbsPitMnsGyJ8zE9kQWrjtkmGZeTZCNJPhJhhDno1s0WQXMSOkp++5jVn8rJuQyYQntAecGWBrCmFDL73NlWUX55WQlG980j3iHwWK1HerNK5dB9qXXJqhqrqFbpo8Dnpk3+3DLjbYuoMuuDEcD/30ph78rGpN5w9eNPXS6dFCpL1aA3Mx3zoRGT30v6yRncGcrPTAVu+DkGaxmC3+I5tcvoyPmAO/YuoyDCv8maWLOrqclaiUcloFAGzYolh5gFXo3X2O/5V/lKp7AnTXRw4aIx0aJmaP5dpTm8ChFCs1QF46jJFRTSJKTzh6KClwOScwl+1YK40lKfLWy7HAdj5s2CXmbw+503GwCkx61YqpE64YxVXklDEEr8sthBPbbML38KH+Dm9spiklr5qaTRWhaI+mPa+hAAA3IDRHaMujLT5xEUpxiwJLzGEsBNAzzclR+zO5vLQqBert3GqcoIkGojLZ3Ma7PkrcB8bvNoUW6kD+hX0Zzc5h3ScjAir1tkrjEwtXCCSk84WplhHp8vPPalQP/9YuW2aELAg+vNpYEgxKGdDQCb5lHZvQnscqa8uMx+YqRh54TyPf1JnXBvqPg2TE+68fRuW2qBHpu6zNciXlVzS4v5XxDNDM8NnnWAXHzC3QC7OJ5uG/8NeGsP7OdHk933/nXPrnvmEiLZSGTzl8WjgU+ecWn2sLs38eSt5f3zypY1G9+wBzrMbLp1uGdBxKeqvOrGGon5gAi5SkvdZRBlVuwOPfqqcKDuYQpl59bfvCAvVZrPv+AT+0BT3EAkRN/23hHZ+17tv6XI89S1S/S0pJ25l70Eey9Y+TC7fDGJYD/0d/vjhjzdPnmfL9XdXWg9z7TC0jcGx//kEMzNcLZOvH5bT0gOT0t5+qJZXmYjJC7FK/iRui6IqV8vIol9iTmo7VuvmKpgeVemjyqLmatESEseq1JUlsu5zBVaNgK2Xa7eAj6V3CsvFXurxn21NGS7oTBzmjwiQE0pvNEvTjJoaB4TgY9pyCMjHZcK/8LELC6D/Xcj1e3oeGT1KF6dYn03euvKrFB0Tv0F9pvZa6TcGThkjVC19bIKV3ltqsjSt/zrrPP/4aruIvxjiVrm9tHLPSrDM4XVBYGr0Wq7SrxptaGmjR4ghGzU+nb7LUZNphCREUYZV1z5hRDmKI+cslDVAG+WQQmokClRaITzS+L4YBJxyTGBQCbdTw2J2+An5K99spU5ZvNmRA6RTywLXwXNGDOVgfgPyGl1Fo/PZYljtiE7mFBQJte/Vz2YDPFEP8lD3nrFsXWhA9h6WYJ5M0TdBYKIYLatdVgi4kkM1oZWvt3h2GcKt4HNVb9G9Xp9TEZLuWpFF0VmCCP1J3NDAcggvhUczwDIgYT1VXRdMxsYdpR37neR7BBL4MW3xeFE1SLp5eAXBORo1bdm4sFDgBBx4+ypeowgSMo8gJcXcHRjXc72sE8FDBKjQCrK+INa7aN8pn/LheK4hClisJTGGpCiMjO8n6eM41MJsiruyBz0fdw7kOBbRw6o1Zh2N3NNAURBHm6RTWJyRylrSg+bdmElhhtLkn3qZg6xc2mMl0Mvl6pcBX0VUgKbJyxriQLyFJYMAlR6iNYVMy/dtnHFsCroIDG+RlPi1IskbdKr2RdCNGg9fprQpGQreEwl/nXlDzck2udmSaClRoj4IfkUNyABoqcd7XlwVl80OoSFmqSy/nKIgM7RliWd9R3qFbpSWKNrN2AbEMkRDUBu61cCZFH0OFp4v1QfL1U3Q+YNokTg+Le047G5UH2a5UJ/MXYdkdFRpQUXmetZsh6MlPfjndqLsqTCTHUgtUgGL5xq64HLOkOUZpGTxin4/xyp+mbqHffjHj/cB194ekd00oOHOxS5cH2u/HsksKyj1HtAEtiTitk1L56ux+QwG3OicyEZ32FsdR3/lR3gkykkuYiyrSgyEuApibQ/rdWNqRr6wFMgNjab6nzjwbY5h0IumE9mHmxitvdhl7zRsMVNvvQ8ik1h2WQV46ENJFCfcHJy1nNbZ9McvMNP7OK3Q3KaCl3bJ6WLCEDH44TbE8q87AymOpSVvuY0KWdLqQCn2tlKRzX33irASm54OE/oIE3xeRW8/yG/TKZMioZjD8rWLEd3lhfFz/J3a0wo2PtXA4PrAab1e9m3vupuppqSkAeyQ1CEwsdDeVFr/E/JuTeKI278f9U49LHSeVDlcNjaxLmZS5Zw8uOujwNPPSUAIw5sZ6Tf8GPse7/Qj7skvjJU9ye5y7DcHZF5CfylE0zft2czKFUN95KL8JZGYR/CfH2j+yYatUNiejnRUkj1DR/+nyymlKr8MJo+Z8mK7kqjoCJP0Ox5+8wx44uQ3XcYfta6Qjf2gzrL19gJRNVzrHOb9xMclLH6AZ587HnPArWtqVvKSKWj0xwVc/TjVr1J8EJVvbclGKKYxxRc2TgDsbFVMgf+Xramtij1YbnWZYjRQNA5iIAKL6I+EdgFSo4Kakad1kN8RWLYty6yhQ4F9kxOsqThmvFUZhijcu6WkdTrJ3ZPyNxAHVLKC7OqpliLmQ/rgqKBohOQ5FH6q5b3DBPF/+vgIaiRhuzWW3aVMWgGhOtYKdpragj8dKsJ9KHcZ65US/nzudGw/lcBX1789EPrTFyoV0cmLIPs306ctDERCfsIw4+LbneLUL9NAvOuNaPj3WlSZPui15QEyQPv0gnLnG41CH22gXQBxHmMzKLm2ATStXUzXzl7m4rnimkJ62TuxA634SfV0ljPRY0Aa6R59347C+XywDwOZV72J2RCmVZcMGR//QB9doJygNw32jbGKxQPXo/vCyVy6vOuaG72ea1IsRj0WDvoIao/IzfPOY73eO/ia5FuP+IyL9aD61oY3l320Uo7zthqcgIO24q6zM6IfzlQcLg/UvgtnibgFVKF9lpVnYi5OjuGQ03u8SwLDryror0sO/QsMRzKjAvYEIEuzPReQMBkYkoRzgwqt8JDY3GYOf44/kMuaqPMA9p5NaLriWGJWKAz7AzwqwxYQmsPD91T5lx8ICVCP1ZbqSFpnmUDdEQTG1ltP/pI7wd8IiBYlnHLinnYG/IgsCoH9HhJ6hZjxHmhl9t35ZLLdUsQwmoK25P9lFZ7qjxP/hGLX/dkkxV3XzicmnHDnkLl3LKfHxTWumNUae4QVJpFyDUJEhmOQZzpTV0JKq8MEdtV/L7BU4aHYkkDNmvyJmRii9NHwQza+6tVCWU2WbwDkVlT7EpApaVi5DWDOnZxZ+K5M44c7IVTQBknPo2UU0QU55yitn4nBZWnRaVPBw0zshuK5+FDq+OTu3E4pRL3PYjPkdxh5tMoOAgtNB8Awp7rX8Z56fGAoWoLZZppOFvxdldBr5v00W6dHJL1TvLKxZJY7dUoW17JM0V3Anyrg5QmdtKGE+czKs0Ic6yXiYwqocjA0Lzr5KxflCQlX0f77VFNeMedZPtT+bMwaW5RZXTcwkXocTamh1vBCPJ1tnIE/n4H8x2kaYgF+C15BNaFUoES6l4629eO9kxYfJbtIHCJIkOZfjErDReZJ6FoycaW7ypK1BoK6ZfNjQ5LJzm39s+chJiszZHMpCunozscZUeeBhQ1zqio5JpfRvr53nIg0/4KV9Q285ty+UG62+56OOsx8Kud6Ns1wbXW75CdQGs4hvezv1+743mYHpFo6A3KVRNJa1MAQj4KVm6aQFbOeFvPChqD6gUPl69dHYwsSielf5OrDu4RgHMBmbj4al0brvBZ4dNOh7dNXXMCthobKeShoY6GxKlY6nksivYcnNbTnJfPq3IVMRjsRRqACI9UKQa4L3RhBqa9CTO5XDSojheaEKCY6X/RZehXYIC1RoKkgdpkfRg6yF6p1qoa+JQK6GwqQ93/3Xdd9JGn+gpp8+mVqOpSoAiw59hZhZeOyBI3e5h+fIr6JyyCBhbibNfsROz12O5kVciwnnKoU2YFacMmwQytifsFBFn+nEvlbbUWRkcA1GsrPyoEDkX1NtMSaQewajxc7oqMN02MqQNBKor9MjJl4pli8oVy0NtsgdfktbinboXPZ/ZRl2ciFHCCqnidp2OkH6sZ0atFyU4F1r3uD3GqmF3iJM/pqu9GtX1jGisfwU6Gqm/jAq2QzWzB1mExQfzLZSG4kpB2OPMpbC+1GYRaIzEJ24Q10qGjqlENbMsus75Yh1bT3w6dRK/McogFIUII+ExSld4tU0w4dzS4sT1+p7TnE87TYvqxSaSD6Cr0xYtyZvukrO4PnnxBA5rCKq1FOqpv+22INHKvdZh1M1e2oaQTyKPYSADqbxQJiL1hpeeC8vhy6Xijd1Iv5GbbqAJdARZwryKtQef7xnUnXZscqzlp1J0fdWOG4k86JfDUaBRkWiDbtSYMmUOIQoCsA+Vg/LqK9forqCxjoFhWXahPBXy3XGTTMtd8VX23mlGFxTl6U7aUnwOQxgOeseQ2VrK+LfNPBgbVpHRIlmmB8dsrxxGMu7HBDBZeLadizU3aDU0NF9QjCWeZYnMMV4QQMyvc/pntLDHOfFNS+wKSN8ginn+UlY7pIAi6RCIGAmUkbaHurTC5aasqK8JFD22UnAMbuQfnNxo7UkaObFzp+vib0Gg3YLFWQlI6XzmQqVbPWuBlCKFsZmjMS3qxY9mKXRWeKyuLM/sek/Fu4RPN0he2OlYJRHcCiFbr1ATJkWJ3N9KPJQ4UsmT4s37fsqJkc9MRi1r62zXjjSLETL5xmFi1i/nONG2hT+2Bymm64rj6UlrtCG3uWkEMcu2JA/osKi9zE/Ev61kGenwAZdqmiNfFR3rORDLt52bzd02BQ4pPkfw/fpwbFNTiWJxUL/0CDe56bp8/msO4smK/rliuKO/mu6BgYFRfZ269vEdHyjHzEq1LfhrgWK+XJJglfUz5N7MfEcj2GwGqT9r4Il9QOmLZgfQR0Hkzc1apIk0wx6FjCiy/MtawE5ypDDrFHO34g+m8Mtu7RqRBhNlOlE2VHVqz6JhMtw80DGv0ZtKld+cPK9mQxb4yEAt7A5AmS9jF4YqjnxUjv0bG5xz9/bbBooFG0frs7jKJ57eilFB6kdD/i2LVV5s0PVGQU5nQc2HLPJE1vcso+99W3LgtITz+Ao6xZ0D+9wB3/wi/zDMUTf2Dpd4rxsTIMqrk28q6YSqi2XaXhz1zEjaNfnC5xZaemMS4b7t2h8ogTh9KSd76GcIgYAOtEMGNFrFq7dH9O54QUog/4uB5QlAK1veZnTpDpG0PfxkeoQzn7hxX6WAcV1oCwwSErb3gp0Xob+ogSTzMTwTgU5CIAFT1mcY49oT68hLZoRcJWax8jaeV1Hf2g34P4XUPTdogiyOH8dLgVEgHj1TCcDHNw2E6mwo9UcZepiRrAAX+SGpuEkE79XHprhOseQh7FrNjbBp5zOM7iyJEtKcsmqG/Sw/ZGH4FafJy03vB2vthuQqRlfIiER7ktUUrPMyBdu7NC+lM64j+o2p80r5iNu5m4zWD7kbCBXdvUgSmpjgflw/l5LVJUaQ7g2FbiHIIh6XZfFVf2aUEGIzjq2Ax41HS8qPTX7uxSn7CgKe4xeKb23IE3IiNd5w201HZh5awRkN41C1YJYCVWWBLtZEuolFGhvBGQrW3EU+807YXFHIMSPgH1SjaNT/fKBrexIArfLD3G23Ea1lUjU1YO3z3I5ZLG0AZWCrnubDzmD9JFSOwa0ApbBiqA+I3GcZl3GSq9R9A40ANFpdYntCvjICIhFslwrqCvuCKZeb8MaZsVi/vu/ZGv4sG+6176QIVLjTYZd9Hpri+iG83fJPPw1Ph6vcMcgVTetkm2TJ9yBHiXSdeH401+acdorRKNu3V9RC2VGBaD63vFA0ie7IQquaPPVRJp/1ePjGP+7iAY0nku12DhkVOpCfxvuKFoa6JA8gC+O78Q94DEfT/605+2m6ULRywW3Ijg97TYFc/7cYl3lRmjPutG1MayuFT7DcOVxksXrU1hHySGwmVLxa7zaTPdBX/bLNaVyZsjibDE1RRoUGy4rG3127XtkzcUKULXe+X9cJKYATel9uEmQb4dhi1HukO5No98bVTHPHzH3IDjbbVBOaNEsHUOabvDidExQ0lJy+Valrce5J21MEQXMZdo58okkAAACtKuVhQAJNrkQa45DSZPIhC+q21Y1kkpNwhf1/cTw2+0wrl7CBSbkW9FGYLaiWhnTtWusSECixWI2bBIViyl/7dNhd6PmABBSe3o9QirBwatqLHgrh1SETFDw+BXZUyaCj3rHwDKbhvWWnMUVyCq4RUwPIey+zQXN73AJFwoHgqU5GlJgXFgxxv0FR7lK8+tzmnGdQwPj/LxP275ySxRz8SOwoZzcuLH4ExvWdfyQ2M50v66N2gLHuLBCYeu3SrzJy8hjPh72kzCEYx8Vx9hyqNXuZyc/IY7OTi+1zCy5x4DY4I/As0j4VplhdYjM9gKthHp4rZvCkXQ2ZqFVPriOEcbU2XvK8UoD1ONPZLn34PmGAWx4sygLUht/Nkoc41mwL7EXgmQyGXh4Tq0E6YIE0aY3g2NyWcHdC1aSk9rpuY13Zyl6ilpEdndadOk9NqjMmAYjY0XQuOa81WmwBVzAjBOdOoFbikn8iSY7ms7ucLKH5PMWD/2BXdBWVDSBbxgOiSHq0niW1JXYdia8yZx/L+dUmbFfujAgedjYZ50gx/oXANlXeSXbCYgFkUqULZzq6RB0KEGKtFin5gGVCU6bA/egzCNvCtbajYql5x6A3RAGtL/ykvCQSvS9sGrGD6RaVrBVqT1Qq1fpCDvzwcaFDWY0WYOfHSMtYdbHmgpObqF4ifCVvBxD/IfgGUiJB4OAg5zjCOUaV3s8dDfMgvzOlhK22Ry4r+9QlhgaFxjeSML9UZc5tiqQNDFm/ntBqSh8grtr19SKd9XqpIaCbxZ/TEjtIQDOXtuuQgT1Ps3UFuzbVmILzquuYlPF2LELwCVWv0POS1hWxaxfKWBepTk8LFykalLr7WASEacWY1zsAstxJczvyYWYZrgHAlCoObFLusxAckz2eaAJCiVPuN+1mss+abKA0jV8ithappwVgNyQJjYT8NqV3+0wGllI90mL4s81r0+xTm58yAA+S5lkyYaR8M/t+GGk+nXaH01nr3mfTocN1UmNBEuiiLghfn1SkMDO2BX40G/MHoJmKLhX9ZaWRfbWIZLqDAVEAldRvvOa8n4KnJllTtraRZejrFS5IclS1Ug1emlGiCr3ylTO5ruXHDlzhTLV8FonvuSWixVrOt2GXL3biKTzBDlKTjcPU+WgEwwEm6UkAVfeEuuQkCNvAtQ3QeZTT/9i7RiF0UvSD8xR4x2lHtfX7+Z53g8xws3dtmK3GvR4zKCqQXaRHYPXbdl0FeOBCdnpq5IMRKEMrAAWsaflnT8D9OZaD8SroHeb0mSk8oIA5l7v2RE12AUlu0wVVCCJdaN1T6DvdFJOqaf6nS3yNJBR0125VgjalxV2WtCSzEEWnm8yA7WPrmabdDULmO4rzWW9D/XAOlhjtn7yc3u06ShiMdw+kDeYPh7Bje/hSm+aJnAI0I1alZLmyjAUbhZrzEsrwOqi0lGQqvvD0J4XGvTGgfxxC/NMYo2fBuxIQDhdEBRIUHR/vQchVhdLOLd6TvJOilYRfBaO7UlRjMOKcVlDvcQiHB1EEZl7qirvE9OfBqqrrn3iHZdlqzvuc9cjFU4iOlhElycmPwDegsy/0p0lRT2I23+G45LF2YdcrTJTo0O43jEjwUYBibpQrhgrdtssr8jl/mxMxKSFMiQDAOT9vJZIN10vBuWJ+YnUJ9cvHW11cTtGVRYwsqBW+9IoknTPH68MaZAxhuA0kJCcKTYpuaoDIv2Xb05MQhCokp6jr9Lf+H/BJyWAuPYbFuHHrMMqRVzTqSmAPu407nwDQFBc39oEWvS6ojqosDUXScpaxHUj/Ylf51sYyku7MlhiF7aqlG/rCFaXzphQBip+Q9sMuU+JRDHtCUFNs2ukE86R+yl3QOUAFXGOMkcRGMcQ0mHwCCylQwG/rgMDglDrUB8rsP+dOsH+37nXSK9CwGm8cEsEmLF2UV9re61dZ7Oi/XDfvgm/Nkb5L+Yw48eL5sGT1Nc068RsHtFaVcvQR6eOsweZZzhJcEmMK3rPlrKFPY85CEAYOQuSleBaE1P1daugPidSppxbJ5VMoJqg+bpRyPYcG2LA+AHOuRbbtoWvWsA9cIHaKIYU+fEDiD731WpgxFQeGz8nr/X/ck+iGt97gmF2JLQ0Ds/71h3NbpWf889Kx1DXrz/ehWzcc5krHj3BxsaPa+Iap6lAr5DLhpbvjcDxFr5w/DnH/DC/RKd1P5GjH2DGhpjBep+nLxLQCNauk23IyyL/egFToPgek8I3uNPDc6E4+oasrdWHF2uqGN3t18tb20M5muLy6cJaENmtGf8i0KlZ6srUW37MV7+3IStM4Joz+cP4DOWfC18oJBKVHF1FexyvjvGWVnU2YOnE+JmfOjZ7a2njevkMAHFQsRM+noN1n+yiODs7txVDKEUzLC5llFYPjgJ2vSY6Fot5DeJ0mBs9kIdPzraAVjAPSabUbYT+WU6tABEREMOFOlsUJ8onlk3FCrYUkzS8bDhnsVj8UFK9HXrCIB7UuWwZJ1PaVf2/VA9CYVFWE23Qnse9HGky7cUWuanz0vNw2/dtihy05t3i3ofgeE3Sc1xDeUHkhDjrFYGgxuYeNK/gSTUD6UBucZGqGSCju+SCJQc8Cib37USF3Mw5QaJB/mmDrXHVsBu5aH4hgsABkAWa4CD4Sbh7mH60AWX1+tql752a2/ZNPvqs656mHVJNRZ/AIpOsQJSNaPjz8r682s27m8bC5XA9nez6O4JZgvWmbAuGBPyyc0lldIXkVyKUb1xJIQE+V6yoQ0eS+rg+HWxcrQmMMnbXRipRSQDZsqD0D9X+ndEv53mcsKro3aDlO9f74xpQDsCKlO+wG5RbGNr/PozPMMVf7zAzb6Y4pSo+Dt68p/faaFJnvacqlzgGsUaI20AG3cAAUgoXiDoVeMe9y3SFgvAvn+tqNu7apuIpS8icCNCZtQe8re8WBf51fJ3MB7fpdh2Jgna47p+NiJuEe+mR09alfhyPf+KwLBG6uqNcazqhCugQPwttkATJAwDwcHAn7Ae2TG//5V4YaxHv7yl5mu3Ix3wevh7iwDD9QnBS4jiYSFJWlO0mQVCizkTVOA/S4DH3E3vg3jQkh8kx4QwdWCku5EIcWv4bpOQkd1d25B+jR/c+wmgOgYfVGoZgoW0W9mMjeafqJhynt+qtoTFaBQKu6SCWTa0HdVze9j6Gxfvt7oiGMaajB0sZmlCBgrwbfdhN4wlGI8eLFMJcICXLVcX1FhRwMIfYZG3JldGpmhwFUK0hIbKawPTRN52C1/ewHwECmY07td08gwm7jGFt0gUZTgogmOduhsiTIu55pNtWsSjRM2mOw38FRsDgOxpZknrXgMpeeKU8+Xuo5pHEBQhzxGOUrEYdJXEQDbhF7amxQC0hRNLBdw4yaRvi7D/QEuckygzYJs5y63g38fNPCUl+g8p8Ri7MTyNJX0V6RLti1z52mY91RT1MJG0oq+WIo1ao8FKV87JTC3D78B3Z29h8G1NcQ2uDiP4VNhO/NM/FmN9KZ3VNw7qdq3359PeNWzHC/E7NRAZipVFXdy0kjLGQ+SpJpt1hD8nDF+AP+RUAjY52ckHAdy2uemR9KCmYVcOyxPKqeT2HEiTQ1v5bd1Pe5UPYopZ+RIhtzt4g2qzn9opX/XmBz/GN25yt785fDjTFyKM4ecGtjgAMqz4KEqZq/BNY7yFPEYKnM79GMPBo4n0uYol/ey74RsA1lasmjCl4iEbGzoa70SMB3ONvBgGWK5m6oAl9u3gssuLpWHejr0LVpx1anbh5A6pO55nULLi3Pa1Xr2CeFD9vz0hamhO6pGqDW6A7NPJUKum57o3ErYGQf9o8H9tiqqZbfGd03/GC50ahVk+/whv0ArAAKbJBGQV7xAMVwmL9Todc0FA2GKpD3oWKVE5cB/Q6/NA1L323bIu8dDKOMd+QIj9r3LmkwUvAIktvO/IJaTi864MbBJgSsA7XPkXUJTff7PdQ2bqHq0nKoVpAiwQe8U9KeHqAbvtcyWwU3JNUXaDxDzm0W376v2fE1kMlbyPrX/g5gRXP2WUVmXjIkolr4HmBgI4e9Cb248bVwedFOyD2A45xkP8qVnIXwgeRxbo8OvpAmKnKiZaEyseRhvcB5XM8LITjW5HPgydwZ4AHg+NCVUlL6LHJvz97BvKLGugEBNWoddcSfJPFXLxL893kNAlOacGp4KV4AAACv6gTnQAAAAhf2WgdW7VvxF+BCmOvIN9Jk6r4/nDNMMv3VHlfANHeQF3OvKWbMVbAoy5V/a1qs8nHzz/KOBjX6JSbZI1veZ6VHoa1yoiCNtBrbhXN92pqqoaidfY+eBl0r0y8qqSjNA92HcklA9OXM374V7javbJdFpArZRSTcsNNl7Yz++wZRYRC92IeLZa1cAxONHrxnDWQD0ur8m0Q/qEgxbnYS844TsZQJ/Yhcgs3xi3OJjSmalmE3pUxAksE2DS9IJ7p4OX9bbERlY+EiZc0Bs+5Djxy35QvGCi8vbdVitzcUEJ6E1uFoEIOiUw5zkH6l42D+Mvrmbtjwnp94f8jaeHj42fgTBv39eDjTWXl2A11uNxAM1NgFPjndvXNtYvX/fBWarAPJsM17UDFUkstEeI2e4/X8F3KPKw09hVjNNHF0gX/OkPfJuSyMoWklcjFUa+kWoWBJqOnNhI4/E9MQKfuAKHisroOx6kj09yYGjB8mmffM8S3vuefh5vCDCu1qaQqGzkL30vtlEHQTx/lpn4aoOU1HbUmhs7RJeknzOxEig2eqlHsphA9ZULHgAAA6UAEKAAAbsIRTCznS539LMQJKURa4ZZOkDfyuSPkIRP3MpLwJacMp0PLZkzPCo3Gzx1GB9sBJE4HV/FODWaPUINgqK9XlOwqt0EApEfUArXDyj76L0GYv6qKZxL1R5hckYC638Gs8+w/d3IGwOFDmrOcQCJUy0TVzPzxobWXIGjE4og+Er7EUVXhz/ti4xtRITfX+h/R+zLVuxFLNkeUzNP8G5w+mw1rJjdh9tezj0ZnDG2/V8VxGB/waPSWuyOzGeLoo1n3qRUAeeuRHnnyLtrMQEPxhhV/CypxPQ300tPrTn0NrNSjd8LfqCthDRl9nPH4PpVT3s1ttyHX9iJ0QVKNLXcXVCmFr9Wbz4b0oGQZqmNgqLotv04VmeqEgAcfyZCQkrrCwi3aT9lcjNYe3Cl7XfvKwcji8pG2B6wEv1fOH19NM7LaVEwKPOoK0A1YTwK/nRGZvsUvcXI7pG9T26pWRMNl+jVksg5djRjEywoeYruZTfBXWD5WlDwp5nUQ/PrjjqzGtLs/vblpaCoppqEuZfG8b6kIRv0h+mYAu6NpL//BhG1yvgflkxpg4MApJUcv7aSq/7spjiosuQTaO5BQ4AAOkn7biMQQxGdqWXiqy7oSnIywC2K2f6rPqKVU3GIWUrNC5Xm3q5MELsRXe5kTjjBNx7eBqShcd6+GWaXpEvjpf+KpkICqeuOi+CuBtoMKDnYOp0ritmGI65BYRn0qhNGwHeEt9RDDy524S9cVHbWdpET5+azhjiOA63vfix6P8+5M66rkilxjnonKnEWU8RDd00698/pkfAEN3BO09jH72CsIg78VUdRw4ANs2N63qgV/FGy/fNsIhu7DOLoavwLya/bjfTXiV7CV/5Ttn4y0GvOWr51/zar9PdnYrlTCj4ZxAdM8sDn/2a4l7vD909R16Ie6vy/IuhDhQ3u74sUOe14tJjomd+TTr8ZYFNXooj3Klb2+jIfBuQ7obf+XJfjPLH/H/CRVxXQ0UUvPurF8BfdH0gTzPZLWhclDKge5ow+HiOC40Gs66FKw05tWuKRBbvpNdpNFgMCjRkl5XYlboyJ+MHowDci/uti1S4/AmqHj7BtLS9bh/plimOEq3BeelDfDlSwu0cBWB1BZkxfvtPSAeuvtwIQVABN7XLstDsBfwo/EG6ltbqOKU9oWLGkmBon+fGIxhM9+ns9kQpTOooZXmFcDFQoM/rRuxV0uzIr84f63f6ADHs9qP7yPdzX7RmmJ4+0pyijFCAR8Vmr/UD9vXaoiytr+6ENdFJEXP3O4urzcAmuZ6VtLZ2T9ebHoj6yN4yI59m0zOn1HMGPqMu4ofTxzCZQ5AT5HMMncIt2CKvyn5aVFsujUBE2drnkIf3ZaBABu8U5CwC5gAEajwrJdCsnAlvDGFZLvHSBZKHeqtjPaZIXxgjwQR43VsrJPmF3en13hA+1nSTublDQx57MYULrZ6LkqkskmyGLT7pqo6xkKVhrvuUX523REEBCXTaLT+WPBGLetJyVhLNbootNA5sIqxrD9TK2AI/OTsU8kZPJwI94KJNHzAvrrD6hwMjPuIgFES2c4boPsNBgOYHKcAMMG2FE4pUHgvKdFpRkMWYaPftgmpJacnwAIeAABlwAAA2T98lVu6eM/XkyqFlN1LKDhZfuxM88Q2/a0mIAE8tZtwalJgyPpuZ3HR/xh16ss9bCFtMkgp6NOSnBpW/Okou45e6Kt/cTmED0dy5xWP+euNnPztlkWlWfiDqEapugzmfm4jna7bACVAvGz6sHRgCI/8fbFM7NHzS/tMSdHpIkOPr9SeBkIuqoZRrpjEOdJc3rmVuL05jZBaEzueM4WX6kVAZcBF2UOlgj2gh7pHKxji1P4IQAi/P2hgJVtT4pYTd1P/G/oFC/8Dw1/5Pe41cMUSH67bXFp6cHrTs4F5sa1+PJ1z8Hvl86hOuHIGjNjcCk5yRoJoaR60N6ghpWorjQLrOSW4JsbAqe3BcVULlUTFY87L3ypN6QLfA3oAiSFJ3Lzs2zTXwZdEogpRLU6oAWJcx6Q3iZUQkSUcaZkSwNWoOiM5X26jOeBr+wrLpxRL696WD3srA0IbzofFrNQikRXhgVxP+AueAxnEioRkJxfBqKyqI9DCm+esU4j4Sj8AAAhoAAAAOsA5pvQI1OQNkTxiwRywHtvJ9Uo2d1yvbErXFTn5+CgxmSLAfNWTsGUMCAuQlMf0hGCrTLT2DZz6C5vczhoQSJbHHhavK0O3WLnpBJv0G96kgGFFP9BD1l/UYchLqColwXNB8oIRJT8CiFShHuLxyV4rwjFXCQqQWRcEBBWvHcb28skvXVCZCDcHkbzjCTC8Y2zundf2G5CfXPNObRdqpbC+WyCQfJSBawsxv1GVbft/ShpuPeOVO8yml5zE5j8g1cqO1IKNhR29nOvwne5TtqMT/M7q4QgDLScWeuUlOk4meSe6La0WJfNDXR5Gpc2jrWE95UQJ2CoFCj7dvD7OcwOz1tInRAyYa81nywA8objszimf+V6Mbp0cqv5OjUmL7zFy73FkAu0uW+9dEBgfk2uylZNzyXe/MmRsNUMqt200To4agbfJzSWOMV9AlfCpr12cq/r5Iul7zhzd2bH+9LBqi01hBPaTql/fh8pQZGDXXAuyzpZjYG0uGt33+NYdKdEhdL2Z6OSgw6XYQeLQYlbbzDa6+HWABfjb11Bv78YGOFeW/tS7g87XraABEALJ+rPJw2nO8cER01XiMQrS2cLf5cLYhv7Ap5UGB+SjjDDAChU8F//ZijELDzuNOkUYHxepznYFQSfCbyNySMkRDSNJFP/xS8PyBnoKdBAYiaKx6UTieWdiP5japEqEI6EiB2+lgvBYHRCC921bnCpIDVemzEMN317xD7bLDlw2ak+t5DbygsiKeGQN4e5yL0EjA606iNvr3J1unqWz2gkBZOoVae0TiIWewgFtGIxd0sL+gvDgu0c5FRi9M3gjG3hEdooiem34vSuRyyENMP+0RhsxHbqoHXc6idpkCmMdOto8bA0+NmYS2tPaw3JBm2myNx2aSNPBu+vW67eEGlH5TqseRnhGZMHbgYsijX81LlDJfRZmqI8E0LbkYtgLj8aP84yWgJISg8GqwvgD7E0rMDYBM4SKQn3FwpBEedPZl52+K53Wb1t4QXLMe/ixYc0MNLEUNLhdio1ks8B06aWlNHrxVVzikbAaNlQ0ZxkMtxyi2lXRUBiWYkFZhZRw+JxpvLt4sgDm5CikJXnmhW36YIQlkVgRF4qMbita3o8rK0eUTL7VG0P7fE1oSchp+TVA8vO2iqBEe2h4CT5GairyEus6X0D92DJnBxSQ2mo0aLRzmSgEgkr92YlSerVT9PjTry4I8+yLYtiXLsFDGVfk+x+MKTqCWTovIIc1WnZMhK7gZrKJWX+2OwRCWMxOFCf6EkEcSBMyynxDlS9+0WRPiIxB8sce9A2tAOt4NAmufYG6/ZwmTWHYc45y/G9AERqMysKZz3WYcYPCOadfxZmq4ph8sz8zAKuKiQ9gNNXltfno1rZbxscHOiRrX8c8KYSkFoOwwD3uihXOuz7BPD3U02AmgS0NHJl703jqjJNchQvM2DrWgtW4dazwqEirfFQ9Ho3kD6fvRVz0UM/qaPAssT3Ld5iZyrCsP/sm5VjCPCUeLPnIdteJABFFk+j6BJPWWKHxpU3y1e7LXLUaThzl0h7EL02fyBQ8zpeuJct78utuhnqpP4QmG2qm0z+rBw82ePYZVuVZTer3BSQjJ9jJpNABRJ4dY1u2YPmydDVjZd9maP5kS1oQCbDPpBgIAqfE30a37tlpfTkGekMz5yD9Cj84V5K7AGmWZ+TaWrOzz7IbARbMt3EYXtmjeaibXLv7xk7BDK0J2D4hf6nuzZHljMuy17D1H3aU4WPP7lEuZSzcKgtPzTeQaf6x2zjdinyouEkyRC+Qjm3/lJXtTDutpEwtYwQLeWMrJvYGYsrekohsU+fL2AVf/JGfclR8lPZIoMy1XraytaCXL+5BAQXxw3SapamYtVkwGqrf1caHv0NUokoymjdUCkVFJCAmNuoh0eCqKl895SnzTBCh2cxBQwFw88v14SN3QI4c3t+NcWhQd143foQVv6fEeaSpQ70DdJ3gHkC2e9ktp3qCASHNhFpG9MwmO2WWmXejbiK88NBrjk42fd5jKwZbEFOk9GCfC33YR54xjjF5xtY8kNgyK/TfmsVTrh4lQy5ct0cLNmaD8qfWHA5OMAUG2BJgY5pB6WYRlanCnoNVolJ6SW4rPOfJNZYBy/tNPk+KzsCGbrTSMXl4RnycZhxBe7gQOj840ALLUHrBVOUMdaynxDCowhm3k/RrXFlPSfYLDdZ5Dnn0x+ZBPUxMG3mO4tlwIaEetxXYA/n+2DqpXgk0Z4RCOPoPrRYTvgdG+pgauE8H19JMfy/Ee7/Z0EC7gGlfQMRzPxrEaulDdSnrPpUfu7yYUCM7LjIanPBYfGedg4zeyRzwcvsoBM0Y2fFeVwDeNpyYy+f4XluN4Ll2zR5prDjT7NfQFySdScDn8+XntjGUQYYjswqz68zEeAutoQSPiT6j/nmm402FKqUMCM3D61q/vS0GbYJBqG4rixrkWNJuVMzohMp3pMb4nczEGaSmF6jWpWv2AbChgQ384lK0PnTfsN2IwzWY4QV2w66alYKQiZLjsVodRbSo+Fu8wLb1iJI26V/SPNKi4plpEAYwvBokKb+Pabz7A2WSor+LvvvFJpgnBVZ7UZRnqCyUJrl5UTQ3KU2ZgrMRmiYFG566zcU7THuLyyBvx0ZxsToAvT+btuDC73xGAM++Fg1BLk1DQIMXDG+Q3EReQ+I9Y5NXrct1QU53vNWba0CiTORHi1GE6y/DdiZrpAI4Y4rtmAREGQk2hkeDdqDtaUgE0H6u0NAFSTiDgJgTO+LxXzH3sRhP0VBxhqD2Wskxbo18eBugD6pfXXm6wKyzEZ/dG+x0c6ItyXzWHOgoocQIELePP2pTEQViMTH4qLGHgfmNL4n1SFFlzdV50GD2pGz62k6zqdO2FoSToloRE6SC0jMX1fPAZJaq8PqwwkZ3vl1YpKyvwp/JMItKsaiOVwxSDcpX6u3jYgh0KyWdgjNJ/ZD7RCUicFVr4ZyBaVE6QN2TY9c5JCuA4gDKVdvF/x7eHG5L2CwAijqorZsw8WRRQGDQ3zxKBQkMqJZ2bluCPfSsuZz6c2ZUn+oKdzOorbCl5pQzfzlOndIP7lkH+myM1JPfG7xLLL4z3i/Qd/6CLtbV8iAs23itxeHE+6GFHREL2u8whyuGlLhC5zWZvPY/h7Seb2+e0Nlzjxv1hZHoSKphuxHvXeZVaxWUP1tFlVShk07lySNcSCtSjLbFl1CE39XleItut8ldPCsVVJG8kEo5jMRMxCcl1VL+ZYDrGJEMZL+Gs/gy89n0tX6gmr7iGBe3n7Km+etUF2XKv8uY8IKB73jM4gU6SnpO6yujHhK2rUbUZigk4EsRm0cVNAj69R4KG3TtNHEZ9TJmvndqqNk00v9HDKgK1mwdO9K58D+YrTcxi6J3HIJ5dDcyLVNb8WP65HzQ33rKvX4lJj+oHXGAKjLIoM04GM/qWiQM4xosAM6gtQaHwR8ghM+593elOXedK0xRkUyxDYXzCOPypDLQRij/iFERdKH5BCukxWOxyf4Sn8Hfa23i3bLunzZWjYQcvMwiXMM0drD3NzFVFLdbd0mS76sGIStNJCEspHMQPxn+E0N6FU8+YIBberB1jBPUhbmKZxzPguYwhaS2Ci/AOa1zVE6z574e/bpzmhJ0C/vTavGHYToocu+rNX+qT/OTg39d/hX/ymalhmwK605LlcLvvOWiUpPHv+DU+C2edwznRXaYO81SBGGqB8H2r+dllV7YQ4PfinYAZ70PR41xAFdTImMDZoR6JkTwUExCK1TSuwf+nwV0j3opUQ8vlU4wQV4ZlFh6c9D3+tc0g36o5g3BnaIP+5iTpRiw5asbYS7jyrSWe88xNGdOAVd+g/Zy2+LhzdaIOTVJKuhLk84ZH3a9ftTPkZG085yEsEVRxcjc61XUrExrRQJjMi53nBcf4C3BaQQDQa0yK1rnr/WJD8IH+ES2Nt0iWdNVmMrMBf2PrhGC32GM8qa95aPXtR1+ZXKpH0KyfGl0byGr1+GhjlogA11b7xu1DVPZPiRIsun0Ozy8DnYhQHOxcvkTyXlXBEn8fz/U3FJQCN8vABgy+dj5xoYPreGPZ2jcFPVUKgrDg0oY87XyEPuFls9NwVNyTNWKVHPUlnf8U7wgO//hkEKshnRT35mpl1HMVxSZ/Rr7ZzNHa+XlTqYPlryVEF68UmT4C0faWl1r1nNNUHYf/MA6xowGW/ptzQIp4KWOWUFpgwtaPXnc7mWfL9SKWpGGLtdlclCSniiLSjHSya1Dz0qLXFkKxNYXZe4DAkgfwlyqKZin6DOzP5iKhao2HW/tmiTWIHGIH+q/yzYYavj612re6B3s/I5xBH7SM99bvu0NvQpweBkNwuTJS8uvHEpKBLO1po4Vmz+8rqBpzqeSJWA2GbxkrqEwP7aFFWmF9XOAKDay7W8vvLdDxtCxFd+BJ9RYu/t7V+hYQPf7cOKTC4Kqcv0XrTBrEm7fgEfCyaBA5Hc23WKvAA9Sw/W4qedVBdLJwTTiWjpXj5CBv/AijPIKQsYMomaF+s95E9nh2P9bDtqf1wXP2mHXa0tZQtdXGo4aLbBhwPOPBKZnTxG124pznUm8uyrcbU82wlyjIhIEQ/zp+hhS+N8P6l6EAhKC0DcIG2Wo7wD51ySqLzQNSdihvYNVg7GYna8YNbNWMSXWZ4BwZlrSoRDeYQFjzKqeGdv2ApBqZ1OL+NUhIBikTzEJ0Z86A7MeKeeOLN8fMBUw/wIQCltBEuqdK56dIQJalP4z2xYQCC9F84s97eVLaXMgGUHJtYrSp372dMg8vAn9ULDSF5tcJ5VAbKnp46h4uP5aB7H8R4YTet+T6hlEzrOkl6U7/p5kWC2Pgs6h9fSF8/aoQNDtPOCLpU/41kUEUcRcs8JR8vVoBOMcmr30ZYk3RNta/zW5QRFTnegrp/QePmXm9ROvuuQmNhcOEM4CO3rygiYHWFgfE/YWowfBG2GaEA6rVqxa0hDMXPR+zJ+0HL2eR9raMw4y3YXznA6ouJFyh5HytQF0pCB+sIdY7hrJv9Ml3RRF2sRByvGHsWi3yK5aFfzAA1cRqLQJonn8SU81y9I2mUKbrdiEgAEEoZWDpvyfJgUTiqNQULXNYP6Fj+G3ei4Y+H+SGjsMgGXotoZl3qxvCGHoimZ5hRXGeEyD4Jzw+PHToD03hit59a2479OKSvXS6FgjAW3kAAeGP3m2stI4r3C8sdm8wSOZEG4HOS9Cy9FOohYi3JSENoq5yTvyD0EZHQm/qn3tVgWCOH9vTeleiAULi1ENx9hcImZDxfkicSmqL1tCjpIXTcSGukMsKlBw2FW3jqq+0y+X2xUC1hI2Ki+dqV/O/1oe8TYxrK0585S/2+q83/10N1V9rqIzwbzZHTEgmENWi6YeY+BeeWr3nlq2jtTQ017IVoKegi9yFmEEjymEzDO2UV+IqprPjBObLMq1u30Am5uDsMPq6Njumn2CfwOPu0wWgok3vQR/DHA+w4SMdwexc9HDSHSejJedRV+Vb0ajJFD5HLGFbNyBGaM4IT01YFS6TAIWg5Ct7PONRA2Fi64b5Eoj0UvQB7OceMn/rO3nfOPg5X7aiVp+Y+/PYPqv6KDVZjYNuml119xxLFcwo+dIT5u60ULOhi0NhQiwyRydrlE9AI2/BEaauc9dw2Qk/eeIHCfwuo5D60Y12DdVed2JUzEDWjm4v+g/6b5zhfCqJHbOV2kAoBObQtO+W7eQYmtMqX/A5EZdiZIhldxhSXePD1qC/wq0i8+80nfhp4WNbzctRMIiesgMkikxtS2eCB5QJqvQI4BjUaphkkhya/YYvtWgDNDymhwe/52iLe+olldeknr/hE5ypbYHiCgerbQloupe1gbb/HSIg19epyjSTtpDoPXdNpS9wrtiZe+m1FoxUqpJEKoLtgyxFdxb6VdpMtqUbRxE4KyxHuB2mFRr3BDk0kcaiC2TVnN3T+XB8YqVzFoVzBHwdUyAoz3uzaE5DLJP8FO0MyUbtN9ky+DVgLhFNJG0yW9Ygeo1OGU1EQ6sYl1CUcJnurDyv5QDN/iyDzrMBR2XMI4H5dyBqI9qRKVr/+0E3i9XRxHEcPJqcNSmGVwAEp6NwJJ3NJU35FM4EGV5EK6fuxQ69sJNYJbFftcGf83xyCFQ5wJH0nJDxYhea3k+y55EMXCwk5+ahQ9pnTTK+kpJw346xFm7dfmnfImq5jdEeXmFv9suf4iknb02hWimVYi2h3NdQqCmr10YVBagIV/PNcOrgLnOxStTmsZKE5vHQcqPE4VFzhB2prtrdt4d13i1lKf4UnNwDvEcTBn+K1N7FLnjRW7isEmw7MKzNSmXIc9vcXwzBYK+mM0Vbs/goInBdS7n+qvLz9PJNSP6/ELKEjPrDx/LMTbQV3hVVZ5IUH2rvwuQQWgQ6Jwu7VA6kDUFKRVgn/2eL0Msudfk+aQjK/Gzx2cRxEYCzENroqKrbrWXLvwt03f3QYSKkseXfdAj7d3+F3p7lKnH3s5kRhvJvDISH+CmTgblcPrQUNdPGGJB7YmHo9Y2Zk8k4pxr/AuJjJqLAu7w9zQ/03bVFBMcF6esoA8rEaf598/Owofezk6ClhHliz3YQ07heLOe6lJn/+SN9Z9DejYlfCrEHaO7n2xMebEjjJO+BO2XOcfQK9C2228ffflgHfGaiW+6othh6L8yptQSzT5CIH1KzA9KhvsQ5e0Zz/uYrusGcpUKhEUlDdTzRnBcQ4pz6hVsK6OCgsfsvov8hmdZSn8bRRzYgsndjxwmnU33hemLJ3EbZ32OHaIJoAOwP0NL8GKYCHobBmkX+Dz5ChIK9zYn+pXIIv1gS4Il0ygKNWFY0kW1oTjIIVZCxCRe0A9GbeDHjFRdL8F2gMiFXTmidBvPIpXXpzRBlaoERyJIkGZG+GpdFN4vf5Xaprbkk1aSjjwMtkGT6pvhen+kcRcwG/TR7sjZCoJO7JkNrBdRmwqdUpcrnpXCRZN7tD8IPtGiOolbVsgZZhQ8lsRUa+zvAPX8uIVZV0zrsnAsGqk8z5nO1itxjsu+rtkmRjYaeONyNORaQ02GQxufhAs2gn2qyKSEwk8EIUn7LDbXsnisJLj+3DaCrmCciKFkZl4Hw0twyWcQK/xSvwKJ56pV7DgGrEWLrnjP1GnrB/797CSjabTZDeGcH+UZo1CLnUJx/E0boXHfCovOT5oiT+YXb6QKjaemMeYwGkIG+4xtBDt/nG8o1H3KSJR14z/ABrOcrJW3XJhHN0vjiGERcVzbMwRYbnJsIBL+UeKpUQWej1QujCQVVNT8R44Axq1APmgFRDXF+YyxbuH1G9PvXPA9uaQv22bB2Vv5Yrf7iW64LI+aGeIgVGwKYDNmGSmgNeg42qr47CNsNn7Xam59fHT97KPTCAOzarLzw1U0jdD1Y/JC9o+AVWdZmO1FvP25QL7S7SsiP9sOCRa1B70s+mxmHIYGRJo7f3JiAjVPsiPccDfGguBrTYE+Bnm0jKRMHL6AnQN9Lz5X7qMNHNV/XrHSvHpLFfWuAqeWvvMtyMyEI+C2BtNwyEBZDZZzrTGj9JztRNxU7o9QdCvYnrtv874sRi/rDS0p5ov5M2YaVhOYUwA62kDBI7R3r8Do8TpLCJhdXUbeNUoji1KdBilsfk3OXCQmk26v6mhgCeWBQUFNRrkU3t7/BWqM+H6v71PkalGhcSBL2h/w3DtkFuTNTQHc82N+BE0HS6dASANKsfXBD6v+gaUrvLpTK14yCzf2VAgZ26NusHzeuDpUaKjXaQPYvu+THYKWvAgkIPUoGLx1RUFEH103PF7gvlAqKS7pTPWrFLZQCgKRf81KtFQqqdpX9z4pAvpP7nGQm3k2/F9wlZK3ugRTblV4wpIjOj79JXlrpOXNcSE8vRBJJhaM50MxLsk2k8RYfDETT5bYJYFM4lziP/BqctnsISujeEoYPROgJfIKyWZlBW6l5XcSlutBnyYxdRppMCo2+iu4asEjQOWZh8CkPnLs2tJSoE5wOdzthkqZnz5G0h2IyYueWH4+OIivPBQlQsO/XNOx+OQs80CNvVKX4uh03lz7CinIaDBlb76IEQ3kV4uhg/BudLxyDhKocKhCUlR9Mn9iajGtGi7S0OfJ8y2Fz6oxVDVSTwbW1BtFBYRLj+uwsAJjGLuEnM8NXwGc5pWlyJIRye2oGM1Q1esOEz5bPhu97hpWlTh5PqY4hiLAltAsh2POkB2kEQNP46M4XXCky+gatbJgUg5q/P2iv94RrOBzgwbVrQn1Gi/t4Zx5nOmshM2Wt1z+JpOJrrAL1x1WbosvmSlfBpIPZxheGqSMUcQpbaPSf1z2QSHdOXPLzcrBL/lfADE1X6IEVhpfTGFCfqelNWA4NLsIPxLtYJ4Q/KTEVPcM4QLr/zn0rNkLZv4jmql/qldOhaBm488YzISIBjw3pK174mcF5epR+/hhSkJt1+T27cBsJRTbqdMBVS7dM+r1VybiLQMcHrJvhL6nfjF4b/qxSj92Q78h4q3dV6YOwThpFgCpyBm7Zjb+Iw3+AFr4lNNottopYGV7nFkDT7BVR21iVAGHjQRTTEwsjPfyzNL4EmDvkSo8eWNk/gjIPMaBAuY3iMkp4HH3RudnkyF9GfWOKKUKA/Ip/UA5V2bJwjybyUr4E//+/erXMe8lPPjeE1SWFhuu5VZ/Jo/IpITmHWyXUUo2GU6IVFtEB7X8jRYopyWod/AJDSK2SiKtFkOX/Ve8eVEONdoZ8Zd2dG7QZdtQdSSpjfZeksEKA/GHIx5Vmw07FVOlrea+vUUszMbi1X7WscpnD8gG6mAWVAhRuBLv5aB58X4SSl70SrXx9VXgiSXpQsq0E9Jf6IPvWP5GnbfF5d4IioJ6Ucu8BlRLO8TDmj+vdBqAxv8ZSxowROtNaKf3Xq5pN2sGZM72Z7IpQn0TvbanrmPyDH0ryaW2XXSnLawIv0Ub+o9NxQJCSqG12qDOryhhicFj4uhQcuf3kioFucS72q5740WJf4BxdS94didt17SzVejKmoOXgfNWm7YEgi7Ts9ToBr93bEddLmpGrPMo0AiFAiDi5tG3sBay9vlGFdmoogZbM/wiL5DSOYxkVaXEM7lelI4xU1TCrHa6eoDLUQlsoD/XhWimg6ZNJvn0PnR6fUDs6NAa/1c0eMK6epVTIPq8DWqqfYKtgGepQt4BsrA8Zh44NvjVNfgW0FOp1G5H3Jph0PfzBIzTKveU5SNNzSTbehIOckQAgTbxrvmFDUOg5Sw5wUG0+ixewd9MHFBUSzcxXBJyu0NFxTtO/iO/78iCtypgV7EIomPrIkblE8PpAJKU93tkHPR5et0MonqitXsK3XeswQlb29z6GZlAYsLvMiIsm05OG0c2tZilmAe0y85LvR3M11I/bAI8IO2ZZ0yRsA9K46C9+JETnActvy9cPbX/lffcDU4gTAlF4/fRwwRqC95jS7lze3JFzLe9ZoVl8JNkLRDHmBbYMG3YIVJMI3k2RmaKV7dA9ZzBYpeAbBi5bFGNhbDt6aDfBYRuN1FboNgCKbwqxWFrI9Iz4ujNo+UfjhE8HIScoIEIAuXUHiCrDwO/Bc8wzricZAVuByC+QikTQNlSjHEOUbgskwoOEpMq9B2is2rymgkXJLVsFXCvzGcF2RH4pZBEDwb4zz3JQpASVELuZy63nVZfL3fIM+i3D+xdRhf13NyPg044Zos0hswysB/hc9XSxDYH+0/rXtuRy49hOJMbGPg1slm0SIcRHW0jzFli4k/reUN27x9JmJ1ftbXR/5t1iG8N9UxUJpswreTNYQ5JWMZVrB+6dNxTjtpDLuEk6Snw/cTW2sEPP7d9qlflFexFarp1kc0MV/KhnhPiYhaZSgodsCZA2SSfafaRRvHotf4d4EMkgr/ilfv3PQ66CLIc0GHUCfWILTEZuhyVVTVsajOTozYqhJyGv6VeJZe29u6gOD+4cD6L6vxdV3olobGqD4+RgKZZriMexV8XJKELVwEIbekLXwuHDiGKrvK405L5+27XuG2+0yr94eok74tKeWinV3f755UHVnYeWFDJNN6AOjNcR7sJy32GD8uWs7NOPHPTikfMD5hpRIP/ZN4AQnYo/xfKnPJNLa80nMNt6cip2nFAYq5n9GVetYNBBK0TlRxdMkDjTlvcKynSKDL7fo3z0Nwe7Yzf86hKjt7fXAmdR2JOdXnJSJuA+5gmabm0pMWdoOvVcM83L7x1ZWUT7QcIIFHzzj5PkyOrNL2UmK1BzRlK+MDymmSybydLyQ4+MIc3KdAoEkfccLDEm1KE5k8syKlzHY2TZYirTPQBDXe2FiDBSacIKdrBwNBr4H0/eEkQ/BKGJgorg+NTmTRU2tmeTnc50GnrAnoeTkDI4Xa9Lz1ORn2vl4B6QExEnx4yZF0+mQ1MUAAA";

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
      position: 'relative', height: '100%', width: '100%',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      transform: `scale(${Math.min(1.05, scale)})`, transformOrigin: 'bottom center',
      pointerEvents: 'none',
    }}>
      <img src={src} alt="Персонаж" draggable={false} style={{
        height: '100%', width: 'auto', maxWidth: '72%', objectFit: 'contain', objectPosition: 'bottom center',
        filter: 'drop-shadow(0 14px 16px rgba(0,0,0,0.55))',
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
      border: '1px solid rgba(217,165,75,0.38)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 22px rgba(0,0,0,0.35)',
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
    <HudCard style={{ padding: '8px 10px 10px', width: 132 }}>
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
  return (
    <HudCard style={{ padding: '8px 10px 10px', width: 132 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.gold, marginBottom: 6 }}>Цель на сегодня</div>
      {goals.map((g, i) => (
        <div key={g.key} className="lrpg-btn" onClick={() => goTo(g.key)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', background: 'none', width: '100%', textAlign: 'left',
        }}>
          {g.done
            ? <span style={{ width: 11, height: 11, borderRadius: 99, background: COLORS.teal, flexShrink: 0 }} />
            : <span style={{ width: 11, height: 11, borderRadius: 99, border: `1px solid ${COLORS.textMuted}`, flexShrink: 0 }} />}
          <span style={{ fontSize: 10, color: g.done ? COLORS.teal : COLORS.text, flex: 1 }}>{g.label}</span>
          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{g.done ? '1/1' : '0/1'}</span>
        </div>
      ))}
      <div style={{ fontSize: 8, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 7, lineHeight: 1.3 }}>
        «Маленькие шаги приводят к большим результатам»
      </div>
    </HudCard>
  );
}

// ---- Центр сцены ----

function GameSceneCenter({ body, currentWeight }) {
  return (
    <div style={{
      position: 'absolute', left: '18%', right: '18%', top: '18%', bottom: '2%',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', left: '22%', right: '22%', bottom: '2%', height: '10%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)',
      }} />
      <div style={{ height: '78%', width: '100%' }}>
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
        position: 'absolute', inset: 0,
        backgroundImage: `url(${ROOM_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 58%',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(8,7,14,0.28) 0%, rgba(8,7,14,0.00) 18%, rgba(8,7,14,0.00) 62%, rgba(8,7,14,0.38) 100%)',
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

      <div style={{ position: 'absolute', zIndex: 3, left: 8, top: 92, bottom: 10, display: 'flex', alignItems: 'flex-start' }}>
        <LeftGameMenu setTab={setTab} setSubTab={setSubTab} onOpenParams={() => setModal('params')} />
      </div>

      <div style={{
        position: 'absolute', zIndex: 3, right: 8, top: 92, bottom: 10,
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
      }}>
        <RightStatsPanel body={state.body} currentWeight={currentWeight} onEdit={() => setModal('params')} />
        <DailyGoalsPanel state={state} setTab={setTab} setSubTab={setSubTab} />
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
