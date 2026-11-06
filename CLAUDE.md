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
| `src/App.jsx` | The whole game: logic, state, UI, all tabs. Theme = `COLORS` (paper palette) + the CSS block in `LifeRPG` ("PAPER THEME" overrides at its end) |
| `src/actionsUI.jsx` | Game UI for the Actions section: `DayRoad`, `ActionTicket` (stamp «ГОТОВО»), `PixelIcon`/`StatTile`, `StreakFlame`/`FlameIcon` (8 flame tiers, `flameTier`), `ChestCeremony` (portal), `EnergyPips`, `TrainingSoon`; `STAT_RU`/`STAT_COLOR` |
| `src/progressUI.jsx` | Progress section UI: `WorldMapPixel` (9 lands = 9 stats, 6 stages, fog, roads), `LANDS`, `stageOf`, `StageMini`, `HeroRankCard` (`rankOf`), `StatRow` |
| `src/councilUI.jsx` | Kaylen HQ UI: `NpcPortrait` (16×16 pixel mentors), `RoundTable` scene, `NPC_BRAIN` (AI provider per mentor), `NPC_POWERS` (which section each mentor may edit), `npcPresence` (daily schedule), `AffinityHearts`; living meeting: `useWalkers`/`pathToSeat`/`NpcBody`/`CouncilStage` (walk-in with bubbles), `localBanter`, `speakLine` (TTS voices), `PortraitFrame` (hall gallery) |
| `src/pixelRoom.jsx` | Home scene: pixel room SVG (195×422 units) with the Tashkent window, time of day, the hero sprite; room catalog/slots (`ROOM_CATALOG`, `ROOM_SLOTS`, `SLOT_BOX`), `RoomItemThumb` |
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
- `RoomShopPanel` (room furniture shop, paper style), economy: crystals/tickets, shop, wheel of fortune
- 1299 `EconomyPanel`; 1465 `applyCoinLedger`
- 1459–1505 Backups and cloud payload
- 1543 `xpNeeded`, 1546 `computeEnergy`
- 1531–1640 Loans/amortization, `migrateFinance`
- 1660–1950 AI: `callClaudeAPI`/`WithRetry` (calls `/api/ai`), JSON parsing, habit plan, goal splitting
- 1952 Body/calories: BMR/TDEE/macros; 1997 AI calorie counting from text/photo
- 2058 **`defaultState`** — the state shape; 2186 `resetBrokenStreaks`, 2198 `ensureDailyContent`, 2292 anti-farm, 2299 **`applyXP`**
- `buildDayRoute` / `rollDayChest`: daily route frozen in `state.dayRoute` (chest progress), chest rewards; `claimDayChest` lives in `LifeRPG`
- 2315–2510 Basic UI: `Bar`, `Card`, `Tag`, `SubNav`, `PillTabs`, `ScreenHeader`…

**Navigation and hubs (v14, 5 sections)** — 2440
- 2564 `ActionsHub`, 2800 `GoalsHub`, 3016 `ProgressWorldMap`, 3107 `ProgressHub`, 4235 `ProfileHub`
- NPC council: `COUNCIL_NPCS`, `mentorBrief`/`npcDailyLine`/`pickMeetingSpeakers`/`mentorSystemPrompt`, `applyMentorActions`/`undoMentorItems` (mentor edits with undo), `CouncilTab` (hall / round-table meeting / DM); handlers `askMentor`, `askBanter`, `talkToNpc`, `approveMentorDecision` live in `LifeRPG`

**3746 `LifeRPG` — the main component** (state, effects, handlers; ~2000 lines, up to ~5840)

**Main screen / HUD** — 5837
- `PlayerCharacter` 5867, `GameModal` 5911, `LeftGameMenu` 6032, `RightStatsPanel` 6053, `DailyGoalsPanel` 6103, `GameSceneCenter` 6136, `BottomGameNav` 6170
- Modals: `IdentityModal` 6201, `ParamsModal` 6253, `CheckinModal` 6285
- Background: `WeatherCanvas` 6416, `LivingBackground` 6463; `HomeTab` 6499

**Tabs**
| Line | Tab | Line | Tab |
|---|---|---|---|
| 7541 | QuestsTab (+QuestCard 6546) | 9616 | MentorTab |
| 7716 | GoalsTab | 9775 | WorldTab |
| 8004 | StatsTab | 9850 | EventsTab |
| 8107 | ShopTab | 9219/9598 | YouTubeHQ / YouTubeTab |
| 8286 | ChronicleTab | 10682 | GarageTab |
| 8370 | HabitsTab | 11004 | SettingsTab (+SaveManager 9945, AICenter 10040) |
| 8696 | FinanceTab | 11403 | BodyTab (+NutritionCard 10249) |
| 11521 | CalendarTab | 11602 | InventoryTab |

## What's installed in `.claude/` (from Everything Claude Code, MIT — see `.claude/ECC-LICENSE`)
Picked selectively for this project.
- **Skills:** `react-patterns`, `react-performance`, `frontend-patterns`, `vite-patterns`, `frontend-design-direction`, `browser-qa`, `verification-loop`, `context-budget`, `strategic-compact`
- **Agents:** `planner`, `architect`, `code-architect`, `code-explorer`, `code-reviewer`, `react-reviewer`, `typescript-reviewer` (also covers JS and `api/`), `security-reviewer`, `silent-failure-hunter`, `react-build-resolver`, `performance-optimizer`, `code-simplifier`, `refactor-cleaner`, `e2e-runner`, `a11y-architect`, `doc-updater`
- `doc-updater`: in this project the code map lives in `CLAUDE.md` (the "Map of `src/App.jsx`" section), not in `docs/CODEMAPS`.
