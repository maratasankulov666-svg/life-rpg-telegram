# Life RPG — Telegram Mini App

React 18 + Vite 5, plain JSX (no TypeScript). Deployed on Vercel; `api/*.js` are Vercel serverless functions.
Commands: `npm run dev`, `npm run build` (the only check available — there are no tests or linter).

## Rules for saving tokens
- `src/App.jsx` is ~10.8k lines. **Never read it in full.** Find the right spot with Grep (`function Name`) or the map below, then read only that range (offset/limit, 100–300 lines).
- The line numbers below are approximate (they drift with edits): use them as a starting point, then confirm with Grep.
- Subagents from `.claude/agents` should run only when they are clearly needed (big review, refactor, build error): each run is expensive.

## Files
| File | What it is |
|---|---|
| `src/App.jsx` | The whole game: logic, state, UI, all tabs |
| `src/telegramStorage.js` | Storage: Telegram DeviceStorage → localStorage fallback |
| `src/main.jsx` | Entry point |
| `api/ai.js` | AI router across several providers (Groq, Gemini, Grok, OpenRouter, Mistral, Cerebras, NVIDIA); keys come from env |
| `api/youtube*.js` | YouTube stats and OAuth |

## Map of `src/App.jsx` (line → what)
**Systems and helpers**
- 171 Feedback (motion/sfx/haptic): `gameFeedback`, `FeedbackLayer`, `FeedbackSettingsCard`
- 440 Art: character sprites (8 body types), room background
- 549–700 Random events, equipment tiers, `economistPayout`
- 704–990 Finance: debts, `computeNetWorth`, `financialHealth`, `financeMonthSummary`; YouTube helpers (852–925)
- 996–1260 Room/decor (`RoomDecor`, `RoomShopPanel`), economy: crystals/tickets, shop, wheel of fortune
- 1262 `EconomyPanel`; 1428 `applyCoinLedger`
- 1459–1505 Backups and cloud payload
- 1506 `xpNeeded`, 1509 `computeEnergy`
- 1531–1640 Loans/amortization, `migrateFinance`
- 1660–1950 AI: `callClaudeAPI`/`WithRetry` (calls `/api/ai`), JSON parsing, habit plan, goal splitting
- 1952 Body/calories: BMR/TDEE/macros; 1997 AI calorie counting from text/photo
- 2058 **`defaultState`** — the state shape; 2147 `resetBrokenStreaks`, 2159 `ensureDailyContent`, 2292 anti-farm, 2299 **`applyXP`**
- 2315–2510 Basic UI: `Bar`, `Card`, `Tag`, `SubNav`, `PillTabs`, `ScreenHeader`…

**Navigation and hubs (v14, 5 sections)** — 2440
- 2526 `ActionsHub`, 2696 `GoalsHub`, 2912 `ProgressWorldMap`, 3000 `ProgressHub`, 3670 `ProfileHub`
- 3184–3670 NPC council: `CouncilTab`, `councilDue`, `parseCouncilJson`

**3746 `LifeRPG` — the main component** (state, effects, handlers; ~2000 lines, up to ~5840)

**Main screen / HUD** — 5837
- `PlayerCharacter` 5867, `GameModal` 5911, `LeftGameMenu` 6032, `RightStatsPanel` 6053, `DailyGoalsPanel` 6103, `GameSceneCenter` 6136, `BottomGameNav` 6170
- Modals: `IdentityModal` 6201, `ParamsModal` 6253, `CheckinModal` 6285
- Background: `WeatherCanvas` 6416, `LivingBackground` 6463; `HomeTab` 6499

**Tabs**
| Line | Tab | Line | Tab |
|---|---|---|---|
| 6620 | QuestsTab (+QuestCard 6546) | 8707 | MentorTab |
| 6795 | GoalsTab | 8866 | WorldTab |
| 7083 | StatsTab | 8941 | EventsTab |
| 7186 | ShopTab | 9219/9598 | YouTubeHQ / YouTubeTab |
| 7365 | ChronicleTab | 9773 | GarageTab |
| 7449 | HabitsTab | 10095 | SettingsTab (+SaveManager 9945, AICenter 10040) |
| 7787 | FinanceTab | 10494 | BodyTab (+NutritionCard 10249) |
| 10612 | CalendarTab | 10693 | InventoryTab |

## What's installed in `.claude/` (from Everything Claude Code, MIT — see `.claude/ECC-LICENSE`)
Picked selectively for this project.
- **Skills:** `react-patterns`, `react-performance`, `frontend-patterns`, `vite-patterns`, `frontend-design-direction`, `browser-qa`, `verification-loop`, `context-budget`, `strategic-compact`
- **Agents:** `planner`, `code-explorer`, `code-reviewer`, `react-reviewer`, `react-build-resolver`, `performance-optimizer`, `code-simplifier`, `refactor-cleaner`, `silent-failure-hunter`
