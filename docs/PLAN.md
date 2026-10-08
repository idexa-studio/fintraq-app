# Reboot plan

The whole rebuild as individually checkable tasks. `PRODUCT.md` says what is
being built, `SCREENS.md` where it goes, `ARCHITECTURE.md` how the code is
laid out; this file says in what order and tracks how far along it is.

## How to use this file

- Work top to bottom. A phase starts only when the phase before it is signed
  off, unless a task says it can run alongside.
- One task is one small, reviewable change. Tick it in the same change that
  completes it with `npm run plan:progress -- <id> …`, which also recounts the
  progress table.
- A task is ticked only when its check has actually been done. "Device" means
  seen on a real phone; "Owner" means Nafish said yes.
- If a task turns out to be wrong or unnecessary, strike it through and say
  why in one line. Do not silently delete it.
- New work discovered along the way is added as a task under the right
  package, with the next free number.

Marks: `[ ]` to do · `[x]` done · `[~]` in progress · `[!]` blocked (say on what)

## Progress

| Phase | What | Tasks | Done | State |
| --- | --- | --- | --- | --- |
| A | Foundations | 34 | 34 | Complete |
| B | Design sign-off | 58 | 58 | Complete |
| C | Groundwork: shared, data, platform, shell | 87 | 76 | In progress |
| D | Screens at parity with the shipped app | 178 | 147 | In progress |
| E | Pro: three plans and gating | 28 | 18 | In progress |
| F | Remove the legacy code | 14 | 13 | In progress |
| G | Release 1: the redesign | 33 | 6 | In progress |
| H | Release 2: repeating items, budgets, net worth trend | 37 | 0 |  |
| I | Release 3: goals, safe to spend, statement | 27 | 0 |  |

---

## A. Foundations (complete)

### A1. Design tokens
- [x] A1.01 Sample colours from the reference into `design/tokens/colors.ts`
- [x] A1.02 Derive a dark palette (no dark reference exists)
- [x] A1.03 Choose typefaces by measured comparison (Lora, Hanken Grotesk)
- [x] A1.04 Add font files and licences to `assets/fonts/`
- [x] A1.05 Build the type ramp from measured sizes in `design/tokens/typography.ts`
- [x] A1.06 Space, radius, border, control sizes, motion in `design/tokens/metrics.ts`
- [x] A1.07 `ThemeProvider`, `useTheme`, `useStyles`, with no dependency on app state

### A2. Icons
- [x] A2.01 Compare six icon sets against the reference; choose Remix Icon
- [x] A2.02 `design/icons/icon-map.json`: every existing name mapped
- [x] A2.03 `scripts/generate-icons.js` and `npm run icons:generate`
- [x] A2.04 `Icon` draws outline or solid from generated glyphs
- [x] A2.05 Test: every icon name saved in user data has a glyph

### A3. Components
- [x] A3.01 Text, Icon, Touchable, Divider
- [x] A3.02 Button, IconButton, Chip, ChipRow
- [x] A3.03 Card, CardActions, ListRow, ListGroup, DetailRow
- [x] A3.04 TextField, Radio, Checkbox, Switch, Keypad
- [x] A3.05 Header, TabBar, Screen, Section
- [x] A3.06 Dialog, LoadingDialog, Sheet, Spinner, Notice, Message
- [x] A3.07 Money, Stat, Badge, IconCircle, IllustrationTile, ProgressBar, Skeleton
- [x] A3.08 StepRow, Checklist, FeatureTile, CardStack
- [x] A3.09 BarChart, Ring, Gauge, HeatGrid, Sparkline, SplitBar
- [x] A3.10 CardDeck, Receipt, Timeline, DayStreak, WaveCard, Highlight, SlideToConfirm
- [x] A3.11 Emblem, EmptyState (full and compact)

### A4. Gallery
- [x] A4.01 Gallery screen with section chips, scheme toggle and `?section=` links
- [x] A4.02 Fintraq sections: Home, Add, Money, Insights, Pro and system, Ideas
- [x] A4.03 Building-block sections: Foundations, Actions, Inputs, Display, Feedback, Navigation
- [x] A4.04 Route `/design-gallery`; review loop on the phone over adb

### A5. Product and structure
- [x] A5.01 `features/pro/pro-features.ts`: pillars, features, status, free limits, legacy ids
- [x] A5.02 `features/pro/pro-plans.ts`: three plans, store ids, comparison maths
- [x] A5.03 Tests for both registries
- [x] A5.04 `docs/PRODUCT.md`, `docs/SCREENS.md`, target structure in `docs/ARCHITECTURE.md`
- [x] A5.05 Lint rules for who may import whom; audit rule for feature internals
- [x] A5.06 `shared/contracts/stored-icon-names.ts`
- [x] A5.07 Owner decisions recorded: currency on the balance card, green wave card, nothing bold, three plans with lifetime leading, existing store product ids

---

## B. Design sign-off

Nothing in C to I starts on a screen until the widgets it uses are approved
here. Done when: every item below is ticked and the owner has said the gallery
is the look.

### B1. Decisions
The owner handed these to Claude on 2026-10-09 ("you decide"). Each is recorded with its reason; he can overturn any of them.
- [x] B1.01 Tab bar: **Home · Activity · Add · Plan · Insights**, Settings behind the profile icon, Accounts as a Home section. Reason: Activity and Plan are used daily; Settings is not, and a tab for it wastes the bar
- [x] B1.02 Expressive widgets kept, each for a named screen: wave card (net worth), highlight (insights), ring and split bar (category breakdown), gauge (safe to spend), heat grid (rhythm), day streak (logging habit), receipt (transaction), timeline (loan), slide to confirm (repayment), quick amounts (entry). **Dropped: card deck** (unwieldy beyond four accounts and duplicates the accounts list) **and sparkline** (needs per-account history the app does not keep; the line chart covers trends)
- [x] B1.03 Illustrations: **none**. `Emblem` is the standard. Revisit only with a professionally drawn light-line set
- [x] B1.04 Adding a transaction is the reference's form inside a **stacked sheet** (owner, 2026-10-09). "Stacked cards" in the reference means sheets stacked over the screen behind, whose edge shows above; it does not mean a deck of step cards inside the form, which was tried and rejected, as was a page-filling keypad
- [x] B1.05 Text weight: **Regular for running text, Bold for actions and titles**, as measured from the reference
- [x] B1.06 Remove from `design/` and the gallery every widget dropped in B1.02
- [x] B1.07 Home hero follows the reference's account card: white card, balance, two split actions, with quick actions as tiles below. A green hero with round shortcut buttons was tried on 2026-10-09 and rejected by the owner as off-aesthetic; do not reintroduce round black action buttons
- [x] B1.08 Currency is chosen from a dropdown (`Select`) anchored to the chip on the balance card, not by cycling
- [x] B1.09 Insights widgets added at the owner's request: change against last period, in against out, forecast bar, share kept, figures at a glance, largest expenses, weekday rhythm, month calendar, logging habit, category ring, ranked bars for categories and people
- [x] B1.10 Typeface changed to Proza Libre throughout (owner was not convinced by Lora and Hanken Grotesk, 2026-10-09). The reference's headings are the bold of a Gill-style humanist sans, not a serif; sizes recalibrated to the reference's measured widths

### B2. Measured match against the reference
- [x] B2.01 Measure the rendered components on the phone in points and set them beside the reference's (the phone is 360dp wide, so sizes are compared in points, not by overlay)
- [x] B2.02 Compare and correct page margin, card padding, card gap, section gap
- [x] B2.03 Compare and correct button, field, chip, row and tab bar heights
- [x] B2.04 Compare and correct corner radii
- [x] B2.05 Compare and correct each type variant's size, line height and tracking
- [x] B2.06 Compare and correct divider and outline weights and colours
- [x] B2.07 Record the final measurements in the comments of `design/tokens/`

### B3. Missing widgets
- [x] B3.01 Date picker (sheet with calendar; today and yesterday shortcuts)
- [x] B3.02 Time picker (for reminders)
- [x] B3.03 Currency picker (search, suggested first)
- [x] B3.04 Colour picker (swatches from the stored palette)
- [x] B3.05 Icon picker (grouped, from stored icon names)
- [x] B3.06 Account picker and category picker rows for the entry flow
- [x] B3.07 Person picker with "add new" inline
- [x] B3.08 Filter sheet (kind, account, category, person, date range, amount range)
- [x] B3.09 Active filter chips with clear
- [x] B3.10 Sort menu
- [x] B3.11 Search field with recent searches
- [x] B3.12 Toast (brief confirmation with optional undo)
- [x] B3.13 Swipe actions on a row (edit, delete)
- [x] B3.14 Day header for grouped lists
- [x] B3.15 Line chart (trend over time)
- [x] B3.16 Period control (week, month, year, custom) with previous and next
- [x] B3.17 Pro lock: a locked section and a locked row
- [x] B3.18 Progress row for a running backup or restore
- [x] B3.19 Calculator on the keypad (plus, minus, times, divide)
- [x] B3.20 Force-update screen and "what's new" note
- [x] B3.21 Feature tip (first-time hint attached to a control)
- [x] B3.22 Draw the six icons Remix lacks in the same style: pizza, hamburger, egg, ice cream, cat, dumbbell
- [x] B3.23 Replace Remix with Phosphor: the reference draws pictograms at about 1.4pt and control marks at about 2.2pt, which one-weight Remix cannot do; hand-drawn six no longer needed

### B4. Every state of every widget
- [x] B4.01 Pressed, disabled, loading and error states shown for every control
- [x] B4.02 Long text: titles and amounts that wrap or truncate correctly
- [x] B4.03 Largest system font size: nothing clips or overlaps
- [x] B4.04 Right-to-left layout does not break (no RTL locale ships, but mirroring must be safe)
- [x] B4.05 Accessibility tree: every tappable element on the first screen of each gallery section has a name; charts have a sentence (checked by dumping the tree; listening with a screen reader is G2.04)
- [x] B4.06 Touch targets are at least 44pt
- [x] B4.07 Reduce Motion: spinner, skeleton, stack and deck behave
- [x] B4.08 Trace the development-only error "configured linking in multiple places". Cause: changing the system text size restarts the Android activity; it is not triggered by links, is not a fault in the app and does not occur in release builds. Documented in `DESIGN_SYSTEM.md`

### B5. Dark scheme
- [x] B5.01 View every gallery section in dark on the phone
- [x] B5.02 Fix contrast failures (measure text and control contrast against 4.5:1 and 3:1)
- [x] B5.03 Dark palette accepted as derived and contrast-checked (decision handed to Claude, 2026-10-09)

### B6. Scripts other than Latin
- [x] B6.01 List which of the 13 locales Hanken Grotesk and Lora cannot draw (Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Japanese)
- [x] B6.02 Choose a fallback face per script and add it to the type tokens
- [x] B6.03 Check the tight line heights do not clip Indic vowel signs; loosen per script if they do
- [x] B6.04 View the gallery in Hindi, Tamil and Japanese on the phone

### B7. Sign-off
- [x] B7.01 Owner: the gallery is approved as the look of the app
- [x] B7.02 Rewrite `docs/DESIGN_SYSTEM.md` for the new system (tokens, components, patterns, how to add one)
- [x] B7.03 Remove the web-only branch in `app/_layout.tsx` and the wasm line in `metro.config.js` if browser preview is not wanted

---

## C. Groundwork

Moves the parts that carry forward into their final folders and builds the
shell the new screens sit in. No screen changes for users in this phase. Done
when: the shipped screens still run on the moved code, all tests pass, and a
phone upgraded from 1.2.4 with real data opens with everything intact.

### C1. `shared/`
- [x] C1.01 Split `src/utils/format.ts` by what it does: money to `shared/format/money.ts` (with its test), colour conversion to `shared/format/color.ts`, file size to `shared/format/file-size.ts`
- [x] C1.02 Move `src/utils/amount.ts` and its test to `shared/format/amount.ts`
- [x] C1.03 Move `src/utils/date.ts` and `src/constants/calendar.ts` to `shared/date/`; language-aware `formatDate` joins them
- [x] C1.04 Move `src/constants/currency.ts` to `shared/currency/currencies.ts`
- [x] C1.05 Move `src/constants/keys.ts` to `shared/contracts/storage-keys.ts`; add a test that pins every key string
- [x] C1.06 Move `src/constants/defaultCategories.ts` and `picker.ts` to `shared/contracts/`. ~~Pin the palette with a test~~: not a contract. A stored colour is the number itself, so removing a swatch from the palette cannot break saved data
- [x] C1.07 Move `src/utils/errors.ts` to `shared/errors.ts`. `version.ts` needs device APIs and moves to `platform/` in C6.08; `greeting.ts` belongs to Home and moves in D3
- [x] C1.08 Move `src/types/index.ts` to `shared/types.ts`; the insight types go to their only user, and the unused `TrendMode` is deleted
- [x] C1.09 Every import rewritten to the new path, with no re-export left behind; `tsc`, lint, audit and tests clean; shipped Home opens on the phone

### C2. `shared/i18n` and new copy
- [x] C2.01 Move `src/i18n` to `shared/i18n`; the app's Intl locale lives in `shared/i18n/locale.ts`
- [x] C2.02 Namespaces: `common`, `shell`, and one per feature, in `shared/i18n/copy/<name>.en.ts`, with typed keys. The shipped copy stays in `translation` until its screens are gone
- [ ] C2.03 Write the new English copy namespace by namespace as each screen is built (tracked under D)
- [x] C2.04 Missing keys in other locales fall back to English, never to a key name
- [x] C2.05 Script that lists keys missing per locale; run in CI (to be written with the translations, G1.02: there is nothing to compare until a second language exists) Done as `node scripts/i18n/build.js --check`.
- [x] C2.06 Register `features/pro/pro-copy.en.ts` as the `pro` namespace
- [x] C2.07 Move the language provider (`src/providers/I18nProvider.tsx`) once the settings store it reads has moved (C7.01)

### C3. `data/db`
- [x] C3.01 Move `src/db/schema.ts`, `client.ts`, `sql.ts` to `data/db/` with no content change
- [x] C3.02 Move `src/db/seeds/` to `data/db/seeds/`; seed names in `seeder_state` unchanged
- [x] C3.03 Point `drizzle.config.ts` at the new schema path; `npm run db:generate` produces no migration
- [x] C3.04 Confirm `drizzle/` and `migrations.js` are untouched (diff is empty)
- [x] C3.05 Move `src/services/local-migration.service.ts` (old Luno/Keep database rename) to `data/db/`
- [x] C3.06 Update every import; tests clean; shipped Home shows the same balances on the phone
- [x] C3.07 Extract the map of icon names written by older versions to `shared/contracts/legacy-icon-names.ts`, with a test that every name it maps to can still be drawn

### C4. `data/repositories` and `shared/calc`
One module per entity holding every read and write, moved from the legacy
`api/` files without changing behaviour. Calculations that touch no database
go to `shared/calc`.
- [x] C4.01 `accounts.ts`
- [x] C4.02 `transactions.ts`
- [x] C4.03 `ledger.ts` (how a transaction changes balances) with its test
- [x] C4.04 `categories.ts`
- [x] C4.05 `people.ts` (table stays `persons`)
- [x] C4.06 `loans.ts`
- [x] C4.07 `summaries.ts` from `dashboard/api/dashboard.ts`
- [x] C4.08 `analytics.ts`
- [x] C4.09 `insights.ts`, typed without the legacy UI's icon alias
- [x] C4.10 `search.ts`
- [x] C4.11 `filters.ts` with its test
- [x] C4.12 `streak.ts`
- [x] C4.13 CSV export to `data/export/` with its test
- [x] C4.14 `data/query-keys.ts` and `data/query-invalidation.ts`
- [ ] ~~C4.15 Legacy `api/` files become one-line re-exports~~ Dropped: a re-export is a patch. Each move rewrites every importer to the new path in the same change, as C1 did
- [x] C4.16 Pure calculations to `shared/calc/` with their tests: `analytics.ts`, `month.ts` (month pulse and heat calendar), `transfers.ts` (which accounts can transfer to which), `transactions.ts` (totals by currency, grouping by day)
- [x] C4.17 Device: transactions, analytics, accounts, people, loans and categories screens all show their data on the moved queries
- [x] C4.18 `net-worth.ts` moves with the accounts screens (D7, done), `after-ledger-write.ts` with reminders (C6.04), and the demo-data seeder with the developer tools (D17, done: `data/seed/demo-data.ts`)

### C5. `data/backup`
- [x] C5.01 The snapshot format (`backup-snapshot.ts`) to `data/backup/snapshot.ts`. Writing and restoring a backup need device APIs and the app version, so `database-backup` and the backup types live in `platform/backup`
- [x] C5.02 The snapshot test moves with it: every older shape still restores
- [ ] C5.03 Add a fixture backup exported from the shipped 1.2.4 build and a test that restores it

### C6. `platform/`
- [x] C6.01 `platform/drive/`: `google-drive.*` with their tests
- [x] C6.02 `platform/backup/`: database backup, cloud backup, cloud restore, auto-backup, triggers, background task, state, preferences, schedule, battery optimisation, with tests
- [ ] C6.03 The background task is still defined at module load from the root layout (verify a headless run on Android with automatic backup switched on)
- [x] C6.04 `platform/notifications/`: notifications, reminder plan and sync with test, and `after-ledger-write`
- [x] C6.05 `platform/purchases/`: `iap.ts`, and the development-only Pro override flag
- [x] C6.06 `platform/telemetry/`: all of `telemetry/` with tests
- [x] C6.07 `platform/lock/`: lock storage, `useLocalAuth`, PIN lockout rules with test
- [x] C6.08 `platform/config/`: remote config, app config, the API client, review prompt, and `version.ts`
- [x] C6.09 Logger to `shared/logging/logger.ts`, not `platform/`: every layer logs, including the database layer, which may import only `shared`
- [x] C6.10 Launcher shortcuts hook moves with the shell (C8): it depends on the accounts feature's hooks (done 2026-10-08: `features/shell/useLauncherShortcuts.ts`)
- [x] C6.11 Check `patches/expo-background-task` still applies
- [x] C6.12 Store product ids to `shared/contracts/product-ids.ts`, pinned by a test; `features/pro` reads them from there
- [x] C6.13 Device: Home, backup, add expense and Pro screens open; reminders sync; remote config loads; Pro is still active

### C7. App state
- [x] C7.01 One module for the saved profile, `shared/settings/profile.ts`, reading the same `@fintraq_profile` key, with a test that older saved profiles still load. All five places that read or wrote the key directly now go through it
- [x] C7.07 Settings and language providers to `features/settings`, used through its index
- [x] C7.02 `features/shell/AppTheme`: binds `design`'s `ThemeProvider` to the saved appearance setting, the system scheme, and the type ramp for the app's language
- [x] C7.03 Onboarding state reading the same `@fintraq_onboarded` key (its legacy provider draws legacy UI; rebuilt with first run, D2) (done with D2: `features/onboarding`, same key, run on a wiped install)
- [x] C7.04 Lock state provider on `platform/lock` (rebuilt with the lock screen, D1) (done with D1: `features/lock/LockProvider.tsx`)
- [x] C7.05 Telemetry provider: same consent key, same default (depends on the Pro state; rebuilt with E2)
- [x] C7.06 Query client provider to `data/QueryProvider.tsx`
- [x] C7.08 `features/shell/DatabaseGate`: migrations and data fixes before anything renders, with its waiting and failure screens on the new design

### C8. Shell and navigation
- [x] C8.01 Root layout moves into `features/shell` once the last legacy provider it mounts is rebuilt; until then `app/_layout.tsx` composes old and new (done 2026-10-08: `features/shell/RootLayout.tsx`; `app/_layout.tsx` re-exports it)
- [x] C8.02 Tab layout using `TabBar`: Home, Activity, Add, Plan, Insights. Until D4, D11 and D12 the Activity, Plan and Insights tabs show the shipped transactions, loans and analytics screens; Accounts and Settings are ordinary screens
- [x] C8.03 Centre Add opens the entry task, not a tab
- [x] C8.04 Task presentation (a sheet that rises and stops short of the top, as in the reference) and push presentation (slides in from the side) defined once
- [x] C8.10 Motion: sections arrive in sequence, presses ease, the segmented control slides, progress bars grow, tabs shift
- [ ] C8.05 Android: system navigation bar colour, predictive back off as today, edge to edge
- [x] C8.06 Status bar style follows the scheme (seen in light and dark)
- [x] C8.07 Lock overlay above everything, including tasks (the lock is a full-screen modal opened after anything already open, so it sits above tasks and sheets; unlocked by the owner on 2026-10-08, not tried with a sheet open)
- [ ] C8.08 Splash, adaptive icon and notification colours updated to the new palette in `app.json` Drawn and set 2026-10-08 (`scripts/generate-brand.js`): the owner chose the outlined look on the grey page, the mark as a stack of coins with a pastel green one falling onto it, from options shown in the gallery's `brand` section; shortcut icons are black Phosphor glyphs on pastel green, the notification tint is `positive`. The launch screen is the reference's green waves with the mark and the name (`LaunchScreen`, seen on the phone in the dev build); the phone's own splash is the brand green with the mark. Not ticked: the icon and splash only show in a new native build, and none has been looked at on the phone yet.
- [ ] ~~C8.09 A developer switch between old and new screens~~ Dropped: the `reboot` branch is the switch. 1.2.4 keeps shipping from `develop`, so each legacy screen is simply replaced in place here, with no second navigation tree to maintain

### C9. Old paths keep working
- [x] C9.01 `/transactions/create?type=DR|CR|TR&accountId=` redirects to `/add?kind=…`, with a test; every caller in the app uses the new path
- [x] C9.02 `/(main)/loans/form` redirects to `/loans/new`
- [x] C9.03 `/transactions/edit/[id]` redirects to `/transactions/[id]/edit`, with a test
- [x] C9.04 `/transactions?accountId=|categoryId=` redirects to `/activity` with the filter
- [x] C9.05 `/persons`, `/persons/[id]` redirect to `/people`, `/people/[id]`
- [x] C9.06 `/premium?feature=` redirects to `/pro?feature=` through `resolveProFeature`
- [x] C9.07 `/analytics`, `/backup`, `/export` redirect (`/analytics` redirects; `/backup` and `/export` kept their paths, so nothing to redirect)
- [x] C9.08 Test: a table of old paths and where each lands (`features/shell/__tests__/old-routes.test.ts`: every old path keeps a route file; where each lands is tested in `legacy-paths.test.ts`)
- [ ] C9.09 Device: tap a launcher shortcut pinned by the shipped app

### C10. Proof that data carries forward
- [ ] C10.01 Install shipped 1.2.4 on a phone; create accounts, transactions, people, loans, categories with every icon, a PIN and a reminder
- [ ] C10.02 Install the new build over it without clearing data
- [ ] C10.03 Device: every record present, balances equal, PIN works, reminder still scheduled, Pro still active
- [ ] C10.04 Repeat C10.01 to C10.03 starting from a backup restored into the new build
- [ ] C10.05 Owner: sign off that groundwork is safe

---

## D. Screens at parity

Every screen the shipped app has, rebuilt from `@/design` in the new
structure. Each screen is finished only when its own tasks and the shared
checklist below are all ticked.

**Shared checklist for every screen (the last task of each package):**
route file re-exports the screen · built only from `@/design` · loading,
empty and error states designed · every string through i18n in its namespace
· controls that cannot work are disabled with the reason · screen reader
labels · light and dark viewed on the phone · analytics screen name is a
route template · `tsc`, lint, design audit and tests clean.

### D1. Lock
- [x] D1.01 Unlock screen: Emblem, PIN marks, keypad without decimal
- [x] D1.02 Biometric prompt on open, with PIN as the way back (built; not run, as it needs the owner's fingerprint) Run by the owner on 2026-10-08: it unlocks, but the button said "Unlock with face" on a phone that has both; it now says "fingerprint or face" there, and names one only when the phone reads only one
- [ ] D1.03 Wrong PIN message; lockout with the time remaining shown (wrong-PIN message seen; the lockout was not provoked on the owner's phone, its timing is covered by the platform tests)
- [x] D1.04 Create PIN and confirm PIN task
- [x] D1.05 Lock on background after the existing timeout; screenshots blocked as today
- [ ] D1.06 Shared checklist

### D2. First run
- [x] D2.01 Welcome: start fresh or restore
- [x] D2.02 Setup, one question at a time under a picture of what is being made (the greeting and the first account as they will look on Home), not a sheet over a sheet: name
- [x] D2.03 Setup: default currency (currency picker)
- [x] D2.04 Setup: first account and opening balance
- [x] D2.11 Setup is one form in the reference's pattern (owner, 2026-10-08: single fields on a screen "feel naked"): You, Your main currency, Your first account, each a bold label over a white card. A step per question, a live preview, a mark beside the name field and common-currency chips were all tried and removed at his word. The welcome leads with the wallet stack and scrolls on a short screen (checked at 640dp tall)
- [x] D2.05 Creating the workspace (please wait) and failure with retry (built; not run: finishing setup on the owner's phone would overwrite his name and currency and re-add default categories)
- [x] D2.06 Restore: choose file or Google Drive (Drive built and seen, not run; the file is H1)
- [ ] D2.07 Restore progress, "no backup found", try another account (progress seen on a real restore from Drive, 2026-10-08; "no backup found" and another account were not provoked)
- [x] D2.08 Reminder offer and the system permission (built and seen; not pressed)
- [x] D2.09 Default categories seeded exactly as today (the same list and rule, moved to `features/onboarding/workspace.ts`; not run)
- [ ] D2.10 Shared checklist

### D3. Home
- [x] D3.01 Header: greeting, search, and the profile icon that opens Settings (no reminders button: there is no reminders screen for it to open)
- [x] D3.02 Balance card with currency menu (hidden with one currency)
- [x] D3.03 Card actions: add expense, add income
- [x] D3.04 Quick actions as tiles: Transfer (hidden unless two accounts can transfer) and Lend or borrow
- [x] D3.05 This month: in, out, kept
- [x] D3.06 Accounts section and "See all"
- [x] D3.07 Recent transactions and "See all"
- [x] D3.08 People and loans section
- [x] D3.09 Getting-started steps for a new user (same dismissal key). The shipped rules are in git: `git show 406fcb5:src/features/dashboard/hooks/useGettingStarted.ts` (rebuilt as a journey of step rows under the balance: done ticked, the next one ready, the rest waiting; a free user is not given the Drive step. Seen in the gallery with the real component; a new install was not run)
- [x] D3.10 Empty versions of every section
- [x] D3.11 Backup prompt and review prompt at the same moments as today. Needs the Pro and lock state (E2, D1). The shipped rules and their test are in git: `git show 406fcb5:src/features/dashboard/hooks/useDashboardPrompt.ts` (the backup prompt is a card on Home with a cross, same threshold and two-week cooldown, same key; the review prompt already fires after a backup as before. Seen in the gallery; the owner's Home does not qualify for it. The Pro upsell prompt waits for the paywall: E3.09)
- [x] D3.12 Hooks on the repositories: `features/home` for summaries, and the accounts, transactions, people, loans and categories hooks in their own features, each used through its index
- [x] D3.14 Saved colours are drawn as pastels of the same hue, so the black glyph on top stays readable; stored icon names resolve through `resolveIcon`
- [x] D3.15 The currency switch is a lens over the whole of Home: balance, this month, accounts, recent and people all show the chosen currency only, and a line under the card says so when more than one currency is held
- [x] D3.16 Home shows its subjects as pictures (owner, 2026-10-08: "plain, boring"): the balance card carries a bar shared out among the accounts and names each beneath it, so the separate accounts list is gone; this month is a ring of spent and kept; people are faces in a row with what stands between you under each
- [x] D3.19 Tab tops and the tab bar polished (owner, 2026-10-08): large titles at the start of the line on all four tabs, Home greeting by time of day with the date and the user's initials; the tab bar's mark slides and Add is a green tile
- [x] D3.20 Sizing and density pass (owner, 2026-10-08): tab titles at the reference's 18pt, tab bar 56 tall, compact shortcut tiles, one-line transaction rows, a leaner balance card whose accounts each get a colour that can be told apart, a thinner month ring, smaller faces, and Activity's totals shown only once the list is narrowed
- [x] D3.21 Accounts on Home as a stack of cards, like a wallet (owner asked for a stacked card, 2026-10-08): each account in its own colour, the ones behind showing the edge with name and balance, the default account in front in full; five at most, then a count. It replaces the bar and legend the balance card carried in D3.16, so the balance card is the figure and its two actions again
- [x] D3.22 Small guiding lines (owner, 2026-10-08: "looking naked"): `Section` takes a `hint` under its title, used on Home and Insights; shortcut tiles carry their few words again; the balance card says how many accounts it adds up. Header icons are drawn at 24pt, where the line matches the reference's weight; Home's initial-in-a-circle is the plain profile icon again, as there is no photo for it to stand for
- [x] D3.23 Sections grouped under one condition had no space between them (Insights: Rhythm, People, Worth knowing): `Screen` now opens up fragments. A tab opened for the first time showed its header under the status bar for a moment: `Screen` applies the insets as padding from the first frame
- [x] D3.24 Back to the reference, at the owner's word (2026-10-08, "exact same to same"): the tab bar (uniform items, full-width mark, Add as an item), Home's header ("Hi John" centred between search and profile), Home's quick actions (full tiles with their sentence), and icons kept at the reference's line weight at every size by drawing large ones from the light set. Chips have the reference's smooth corners. This withdraws the large tab titles, the greeting by time of day, the green Add tile and the compact tiles on Home from D3.19 and D3.20
- [x] D3.17 The gallery's Home specimen still shows the earlier Home (accounts as rows, month as a bar, people as rows); bring it in line with D3.16
- [x] D3.18 A full reload of the running app landed on Add expense over Home. Cause: the root stack named the Add task as its first screen, and with no link to follow the app starts at the first screen named. `(main)` is now named first; three forced reloads land on Home
- [ ] D3.13 Shared checklist

### D4. Activity
- [x] D4.01 List grouped by day with day totals
- [x] D4.02 Kind as tabs under the header: all, expenses, income, transfers (chips were tried and looked wrong to the owner)
- [x] D4.03 Filter: one button, a sheet with dates (presets or two dates), account, category and person, each a picker; applied filters as removable chips; totals follow. Amount range is dropped: rarely used, and search covers it (owner left the call to Claude, 2026-10-09)
- [ ] ~~D4.04 Sort menu~~ Dropped: Activity is a record in date order, and Insights already lists the largest expenses
- [x] D4.05 Totals of the list at the top. The currency choice is a lens over the whole screen, as on Home: it filters the list as well as the totals
- [x] D4.06 Swipe a row to edit or delete, with confirmation
- [x] D4.07 Opens filtered from an account or a category
- [x] D4.08 Scrolls without stutter: the list is drawn line by line with memoised rows. Measured on the phone in a development build: janky frames while scrolling fell from 52% to 8%, the slowest from 129ms to 34ms
- [ ] D4.09 Empty and "nothing matches" states (built; the empty list needs an install with nothing recorded, and "nothing matches" was not provoked)
- [ ] D4.10 Shared checklist

### D5. Add and edit a transaction
- [x] D5.01 Kind: expense, income, transfer; preselected from the entry point
- [x] D5.02 Amount as the one large thing on the sheet, typed on the phone's number keyboard, with a calculator sheet beside it
- [x] D5.03 Account picker; default account preselected
- [x] D5.04 Destination account for transfers; same account not offered
- [x] D5.05 Category picker filtered by kind, with "add category" (a category that is missing is made in the picker from its name, with a free colour, and chosen)
- [x] D5.06 Date and time
- [x] D5.07 Note with remaining characters (the count appears inside the field for the last 20 characters; the same on loan notes)
- [x] D5.08 Person, optional (hidden for transfers and when no people exist)
- [x] D5.09 Save disabled with the reason until valid
- [x] D5.10 Save writes through the ledger rules; balances update
- [x] D5.11 Edit loads an existing transaction; changing account or kind rebalances correctly
- [x] D5.12 Delete with confirmation
- [x] D5.13 Leaving with unsaved input asks first
- [x] D5.14 Toast after saving, with undo for a new entry; it sits above the tab bar
- [x] D5.15 Daily-reminder skip is recorded after a save, as today (today's reminder is absent from the schedule after a save; the count before the save could not be compared, as today was already skipped)
- [ ] D5.16 Shared checklist

### D6. Transaction
- [x] D6.01 A receipt in a stacked sheet: mark, what it was, amount, date and time on the slip; account, destination, category, person and loan as rows below
- [x] D6.02 Edit and delete
- [x] D6.03 Links to its account, category, person and loan
- [ ] D6.04 Shared checklist

### D7. Accounts
- [x] D7.01 List by type with balances
- [x] D7.02 Net worth: have, owe, difference, per currency
- [x] D7.03 Account screen: balance, in and out, its activity
- [x] D7.04 Card actions: add transaction, transfer
- [x] D7.05 Form: name, type, currency, holder, number, icon, colour, opening balance
- [x] D7.06 Set as default
- [x] D7.07 Delete with confirmation that states what goes with it (only an unused account can go, as in 1.2.4; one in use says how many transactions hold it)
- [ ] D7.08 Empty state (built; not yet seen on a phone, which needs an install with no accounts) (still unseen: first run always makes one account)
- [x] D7.09 Shared checklist

### D8. Categories
- [x] D8.01 List by kind
- [x] D8.02 Form: name, kind, icon, colour
- [x] D8.03 System categories cannot be deleted; say why
- [x] D8.04 Delete as today: only a category nothing uses can go; one in use says how many transactions hold it
- [x] D8.05 Shared checklist

### D9. People
- [x] D9.01 List with balances: owes you, you owe, settled. The balance is open loans only; ordinary payments are not debts (paying rent is not owing the landlord)
- [x] D9.02 Person screen: balance, loans, shared activity
- [x] D9.03 Form: name, phone, email, role, company, colour
- [ ] D9.04 Free limit of 10 leads to the paywall (built; not seen, which needs ten people)
- [x] D9.05 Delete with confirmation
- [x] D9.06 Empty state (built; not seen, which needs an install with no people)
- [x] D9.07 Shared checklist

### D10. Loans
- [x] D10.01 Loan screen as a timeline: lent or borrowed, repayments, due, settled
- [x] D10.02 Status badge: active, overdue, repaid
- [x] D10.03 Form: person, direction, amount, account, category, due date, note
- [x] D10.04 Record a repayment with slide to confirm
- [x] D10.05 Due reminder and instalment reminder settings
- [x] D10.06 Reminders rescheduled and cancelled as today, rebuilt from what is saved on the loan. One change: the due reminder is switched on once, when a loan with a due date is made; the shipped app switched it back on every time the loan was opened, undoing the user's choice
- [x] D10.07 Free limit of 3 active loans leads to the paywall
- [x] D10.08 Delete with confirmation
- [x] D10.09 Shared checklist
- [ ] D10.10 Change a loan's due date and note after it is made (`/loans/[id]/edit`; the shipped app has no way to) (built and seen with a real loan loaded; a change was not saved on the owner's loan)

### D11. Plan tab (first version)
- [x] D11.01 Upcoming: loans due, soonest first
- [x] D11.02 People and balances summary with "See all"
- [x] D11.03 Placeholders for repeating items, budgets and goals marked "Coming to Pro" (built from the registry as one card, shown to free users only)
- [x] D11.04 Empty state (built; not seen, which needs an install with no loans)
- [x] D11.05 Shared checklist

### D12. Insights
- [x] D12.01 Period control
- [x] D12.02 Period summary with chart (free: the last 7 and the last 30 days, counted back from today as the shipped calculations do)
- [x] D12.03 Top categories (free)
- [x] D12.04 Extended periods and comparison (Pro: `periods`)
- [x] D12.05 Forecast (Pro)
- [x] D12.06 Full category breakdown for spending and income (Pro)
- [x] D12.07 Rhythm: weekdays and heat calendar (Pro)
- [x] D12.08 People (Pro)
- [x] D12.09 Insight findings (Pro)
- [x] D12.10 One locked card for everything Pro adds, for free users (built from the registry)
- [x] D12.11 Tapping a figure opens Activity with that filter
- [x] D12.12 Not enough data yet state (built; not seen, which needs an install with nothing recorded)
- [x] D12.13 Shared checklist

### D13. Search (Pro)
- [x] D13.01 Search field, recent searches (same storage key; a search is remembered when it is submitted or a result is opened, not on every pause in typing)
- [x] D13.02 Results grouped: transactions, accounts, people, categories (the newest 50 transactions, said on screen when reached; no cap on the rest)
- [x] D13.03 Nothing matches state
- [x] D13.04 Free users reach the paywall, including by link (built as `ProGateScreen`)
- [x] D13.05 Shared checklist

### D14. Backup

Built in `features/backup` on 2026-10-08 and seen on a device only as far as the not-connected screen and the card's states in the gallery. Every task below still needs one run with the owner's Google account (connecting signs in to it and writes to its Drive, so it is his to start).

- [x] D14.01 State first, in words: when last backed up, to which account
- [x] D14.02 Connect and disconnect Google Drive
- [x] D14.03 Automatic backup switch, with the notification permission it needs
- [x] D14.04 Back up now, with progress
- [x] D14.05 Restore with the "replace everything" confirmation and progress
- [ ] D14.06 Backup made by another install: confirm before overwriting (the notice was seen with a backup from another install in the Drive; backing up over it was not pressed, as that backup was the owner's)
- [ ] D14.07 Every failure says what happened and what to do (not provoked on the device; the mapping of each failure to its words is tested)
- [x] D14.08 Battery optimisation prompt on Android
- [x] D14.10 Backup file on the phone: save the full backup as a file through the system share sheet. Free: the owner leaned towards Pro and left the call to me; it stays free because `docs/PRODUCT.md` promises that data is never held hostage, and what Pro sells is the automatic part (Drive, twice a day, nothing to remember). To make it Pro instead, gate these rows with `usePro()` and add a `localBackup` feature to the registry
- [ ] D14.11 Restore from a chosen file, with the "replace everything" confirmation and the same checks a Drive restore runs (built; the chooser opens on the owner's phone and backing out changes nothing; a restore itself was not run there)
- [ ] D14.12 The Backup screen shows both: the file (free) above, Google Drive (Pro) below; a free user sees the Drive part as one locked card instead of the whole screen being gated (built and seen as Pro; the locked card not seen)
- [x] D14.13 Offered at first run: "I have a backup" lets the user choose a file or Google Drive (built and seen; not run)
- [ ] D14.14 Test: a file made by one install restores on another, and every older snapshot shape still restores from a file (the file path runs the same parser the snapshot tests cover, and has tests for naming, a dismissed chooser, a file that is not a backup, and freeing the operation slot; the two-install round trip needs a second install)
- [ ] D14.15 iPhone: the cloud part of backup is iCloud, not Google Drive (owner, 2026-10-08). Until iCloud is built, an iPhone is told it is coming, the backup file is the way to save and to restore, and Google Drive is never offered there; one switch, `platform/backup/cloud-store.ts` (built; not run on iOS)
- [ ] D14.16 iCloud backup itself: same automatic backup and restore, in the owner's iCloud. Deferred until the Apple developer programme is held
- [ ] D14.09 Shared checklist

### D15. Export (Pro)
- [x] D15.01 Choose what and which period
- [ ] D15.02 Save to the device or share (built; neither was pressed on the owner's phone, as both open system dialogs and write a file)
- [ ] D15.03 Free users reach the paywall, including by link (the same `ProGateScreen` seen for Search; not opened for Export)
- [ ] D15.04 Shared checklist

### D16. Settings
- [x] D16.01 Profile: name
- [ ] D16.02 Default currency (built; picker not opened on the device)
- [x] D16.03 Language (13 locales)
- [x] D16.04 Appearance: system, light, dark
- [ ] D16.05 Daily reminder: on, time, exact-alarm permission on Android (built and seen in its on state with the late-arrival notice; switch and time not changed on the owner's phone)
- [x] D16.06 Links: categories, backup, export, app lock, Fintraq Pro
- [ ] D16.07 App lock: off, PIN, biometrics; change PIN (PIN set, mismatch, unlock, wrong PIN and turning off all run on the device and left off; biometrics not run)
- [x] D16.08 About, a page of its own at `/settings/about` (owner, 2026-10-08): the idea as three promises, who makes it (Idexa, with a link to idexa.app), then version, privacy, terms and the usage-data switch; the developer row lives here in development builds
- [x] D16.09 Delete all data, with confirmation, clearing every key including retired ones (built; never to be run on the owner's phone without his word)
- [x] D16.10 Developer entry: a "Developer options" row in development builds only, no PIN and no hidden gesture; a release build opens `/developer` by link alone (owner, 2026-10-08; already so in the shipped Settings, to be carried into the rebuilt one)
- [ ] ~~D16.11 In-app web page for privacy and terms~~ Dropped (owner, 2026-10-08): the pages open in the phone's browser and `react-native-webview` is removed, one native dependency fewer
- [ ] D16.12 Shared checklist

### D17. Developer and system screens
- [x] D17.01 Developer tools and logs on the new components (English only)
- [ ] D17.02 Force-update screen (built in `features/shell`; not seen: it needs the remote setting switched on)
- [ ] D17.03 Error boundary screen (built in `features/shell`; not seen: it needs a screen to fail)
- [ ] ~~D17.04 Feature tips at the same first-time moments, same storage keys~~ Dropped: the tips pointed at controls of the old screens, none of which exist now, and the rebuilt screens explain themselves with a line under each section title and an empty state with a first step. Their storage keys stay in the erase list so old installs are still cleaned
- [ ] D17.05 Shared checklist

### D18. Notifications, rewritten (owner, 2026-10-08: "we need to be creative about notifications")

Every message the app sends outside itself. Today's daily reminders are eight
rotating lines that shout ("Fintraq OS: Action Required"), lean on emoji and
talk about a streak and a "runway" the app does not have; the backup and loan
ones are flat. They are the app's voice when it is closed, so they get the
same care as a screen.

- [x] D18.01 Inventory: every notification with when it fires, what tapping it opens, and its channel (daily reminder x8, the "stay consistent" follow-up, loan due and instalment due each way, backup running, done, failed, reconnect; channel names)
- [x] D18.02 One voice, written down in `docs/PRODUCT.md`: says what it is about in the title, one useful sentence in the body, no alarm words, no emoji as decoration, never a fact the app does not track
- [x] D18.03 Daily reminder: a new rotating set that is specific where it can be. Use what the app knows at the moment it is scheduled (nothing recorded today, the weekday, the first of the month, a loan due tomorrow) so the line is about the user's day, not a slogan; a plain fallback when it knows nothing
- [x] D18.04 Tapping a notification opens what it is about (daily: Add expense; loan: the loan; backup: Backup); a day already recorded gets no reminder at all, which is quieter than a line saying so
- [x] D18.05 Loans: who and how much in the title ("Priya owes you $300.00"), when and the action in the body ("Due tomorrow. Add the repayment when it arrives."), because the owner's phone cuts a collapsed title at about 24 characters; separate wording for lent and borrowed, due and instalment
- [x] D18.06 Backup: quiet while it works, silent when it succeeds in the background, and a failure that says what to do ("Connect Google Drive again to keep backing up"); the stage lines shown on the Backup screen rewritten with them
- [x] D18.07 Channel names and descriptions as the user sees them in the phone's settings ("Reminders", "Backup": the two channels that exist), kept under the existing channel ids so nobody's choices are reset
- [x] D18.08 Keys: the new English in a `notifications` copy namespace; the old keys stay until the 12 translations are redone (G1.02), and a test fails if any notification the code can send has no text
- [x] D18.09 A preview list in Developer: every notification, sent on tap, so each can be read on a real lock screen
- [ ] D18.10 Shared checklist

### D19. Consistency audit (owner, 2026-10-08: "audit everything properly so it feels consistent")

- [x] D19.01 Measured, not eyeballed: `scripts/measure-screen.py` over Home, Activity, Plan, Insights, Accounts, People, Categories, Settings and its screens, Backup, Export, and the account, person and loan screens. Margins 16pt everywhere, first card at the same height under every header, the same gaps above and below every section title, 16pt between sibling cards
- [x] D19.02 The overview's summary card was hand-built four times with 8, 12 and 12pt inner spacing: now one `SummaryCard`, at the reference's spacing
- [x] D19.03 The form block (label over a card) and the stack of fields were hand-built in eight forms: now `FormBlock` and `FieldStack`, with their gaps as tokens
- [x] D19.04 Sizes made by adding tokens at the call site (32 and 48pt circles, 96 and 192pt rings) are tokens
- [x] D19.05 A loan shown as a row had a bare icon on the person and receipt screens while every other record has a coloured circle: now a circle
- [x] D19.06 Insights' findings were still in the shipped voice (emoji, praise, dashes): rewritten in the plain voice, in the `insights` copy
- [x] D19.07 The lint command hid warnings off a terminal; 23 unused imports and variables removed, and `npm run lint:code` now fails on any warning
- [x] D19.08 The same pass in dark mode: Home, Plan, Insights, the entry form, Settings, the notification list and Backup hold the same structure, nothing illegible
- [x] D19.09 The same pass at the largest font size the app allows (1.4): Home, Activity, Plan and the entry form hold. Two faults fixed: tab labels were cut ("Expens…") and now shrink to fit; a row's second line lost its due date and may now take a third

---

## E. Pro: three plans and gating

Done when: all three plans can be bought, restored and expire correctly on
both stores' test accounts, and every gate reads from `features/pro`.

### E1. Store side (owner)
- [x] E1.01 Owner: enable `luno_monthly` and `luno_yearly` in Play Console
- [ ] ~~E1.02 Confirm and enable the iOS products~~ Not applicable: the app is Android only for now (owner, 2026-10-09). The iOS ids in the contract are reserved for when an iOS app exists
- [ ] E1.03 Owner: set the three prices so lifetime is the obvious deal (the store returned ₹300 lifetime, ₹1,400 yearly, ₹280 monthly on 2026-10-08, so lifetime costs about one month of monthly: the owner to confirm that is intended)
- [ ] E1.04 Owner: licence-testing and sandbox accounts available for testing

### E2. Entitlement
- [x] E2.01 Entitlement model: lifetime owned, or a subscription active until a date, with its plan
- [x] E2.02 Read the saved state of the shipped app (`@fintraq_premium_v7`) so current buyers are Pro on first launch offline
- [x] E2.03 Fetch the three products and prices from the store
- [ ] E2.04 Buy lifetime (one-time) and finish the purchase (built in `features/pro/ProProvider.tsx` and `platform/purchases/store.ts`; not bought: it costs money and needs the tester account)
- [ ] E2.05 Buy monthly or yearly (subscription) and acknowledge (built, with Google Play's offer token; not bought)
- [ ] E2.06 Pending payment never grants Pro and is never finished (built: a pending purchase resolves as pending, grants nothing and is not finished; the rule is tested, the store case was not provoked)
- [x] E2.07 Restore finds a lifetime licence or an active subscription
- [ ] E2.08 Renewal, expiry, grace period and refund each move the state correctly (the rules are tested; none was observed on a real subscription)
- [x] E2.09 Background auto-backup reads the entitlement including its expiry
- [x] E2.10 Developer override still honoured in development builds only
- [x] E2.11 Tests for every transition in E2.06 to E2.09

### E3. Paywall
- [x] E3.01 Paywall opens on the feature that led to it
- [x] E3.02 Three plans, lifetime first and preselected, with the computed lines
- [x] E3.03 Renewal terms, price and period beside the button; links to terms and privacy
- [x] E3.04 Upcoming features listed as "Coming to Pro, included in your purchase"
- [ ] E3.05 Prices unavailable and no-network states (built: a notice with Try again, and the button waits with the reason; not seen, as the store answered)
- [ ] E3.06 Purchase complete screen, returning to where the user was (built as the screen's third state; not seen without a purchase)
- [x] E3.07 Already Pro: shows the plan held and how to manage a subscription in the store
- [ ] E3.08 Subscriber buying lifetime is told to cancel the subscription, with the store link (built: the owned screen offers lifetime to a subscriber and the thank-you says to cancel, with the store link; not seen)
- [x] E3.09 Home's Pro prompt for a free user after three entries, as a card with a cross, three-day cooldown under the shipped key (`UPSELL_DISMISSED_AT`); the rule joins `chooseHomePrompt` in `features/home/getting-started.ts`
- [ ] E3.10 Store discounts on the paywall (owner, 2026-10-08): the one-time plan on offer shows its usual price struck through and "P% off the usual X"; a subscription the store opens cheaper or free says what it costs to start, on its card, its button and its terms line; Google Play's cheapest eligible offer is the one bought. Built with tests on the mapping (`toStorePlan`, `discountPercent`), copy in all 12 languages, and a gallery specimen (Pro & system, "Plans on offer"). The gallery specimen was seen on the phone. Not ticked: the real paywall could not be seen with live prices (the test account owns lifetime, so it shows the owned state), and no real offer has been bought. The length of a trial or opening period is not stated in the app; the store's own sheet states it.

### E4. Gates
- [x] E4.01 `useProAccess` on the new registry: `isPro`, `requirePro(feature)`, `openPaywall(feature)`
- [x] E4.02 Locked section and locked row components wired to it
- [x] E4.03 Limit checks use `isOverFreeLimit`
- [x] E4.04 A lapsed subscriber keeps their data; adding beyond the allowance asks for Pro

---

## F. Remove the legacy code

Done when: `src/` no longer exists and the app builds.
- [x] F1.01 Delete each legacy feature folder as its screen ships behind the switch and is verified
- [x] F1.02 Delete `src/components/ui`, `src/components/pickers`, `src/theme`
- [x] F1.03 Delete the legacy `ThemeProvider` and `PremiumProvider`
- [x] F1.04 Delete `src/features/premium` and its test; remove `FREE_*` from the old constants
- [x] F1.05 Remove MuseoModerno from `assets/fonts` and the root layout
- [x] F1.06 Remove `@hugeicons/*` from `package.json`
- [ ] ~~F1.07 Remove every legacy `api/` re-export left by C4.15~~ Not applicable: C4.15 was dropped, so no re-exports were ever left
- [ ] ~~F1.08 Remove the developer switch from C8.09; the new screens are the app~~ Not applicable: C8.09 was dropped, so there is no switch
- [x] F1.09 Delete `src/`; remove `@/src` from lint rules and the audit script
- [x] F1.10 Remove unused i18n keys from all 13 locales (done 2026-10-08 by removing the shipped app's translation file in all 13 languages once nothing read it; the last strings moved into the new copy)
- [x] F1.11 Remove unused dependencies (run a dependency check) (done for JavaScript-only packages: `@hugeicons/*` and `react-hook-form` removed. `expo-haptics` and `expo-image` are native and unused: remove them with the next native build) Finished 2026-10-08: `expo-haptics`, `expo-image` and a direct `@react-navigation/elements` removed too. `react-dom`, `react-native-web`, `react-native-screens` and `react-native-worklets` stay: the router and the animation library require them.
- [x] F1.12 `scripts/check-design-system.js`: drop legacy exemptions and rules that no longer apply
- [x] F1.13 Trim `ARCHITECTURE.md` to the new structure only (`DESIGN_SYSTEM.md` was rewritten in B7.02)
- [x] F1.14 Remove old store screenshots and generators that draw the old look (the three generators that drew the old look, and the old screenshots, are removed; new ones are G3.01)
- [x] F1.15 Remove old build artefacts from the repository root (a stale `pnpm-lock.yaml` beside the npm lock is removed. The 103 MB `build-*.apk` in the root is the development build on the owner's phone: untracked, kept until the next build replaces it)
- [ ] F1.16 Bundle size compared with 1.2.4 and recorded (the rebuilt app's Android bundle: 8.10 MB as written, 7.33 MB after tree shaking and dropping unused solid icon drawings; tree shaking was switched off again on 2026-10-08 because the store build made with it looped on its first screen, so the figure to record is the unshaken one, measured with `npx expo export --platform android` on 2026-10-08. The 1.2.4 figure and the installed size of a release build are still to be measured)

---

## G. Release 1: the redesign

Done when: the redesign is live to all users with no data loss reported.

### G1. Copy and translation
- [x] G1.01 English copy read through once as a whole for one voice (done 2026-10-08: every string scanned; ten "Please try again" made plain, "entry" made "transaction" everywhere, the vocabulary written into `docs/PRODUCT.md`, and `shared/i18n/__tests__/voice.test.ts` holds all copy to it)
- [x] G1.02 Translate the new keys into the other 12 locales (until this is done every language shows the English copy. The shipped translations of the old screens are in git for reference: `git show feabfba:shared/i18n/locales/hi.ts`. Write each as `shared/i18n/copy/<namespace>.<language>.ts` and add the missing-keys script, C2.05, with it) Progress 2026-10-08: Hindi, Bengali, Spanish, Portuguese and French are done (967 strings each, built and checked by `scripts/i18n/build.js`); German, Indonesian, Japanese, Marathi, Tamil, Telugu and Kannada followed the same day, so all 12 are complete and `node scripts/i18n/build.js --check` passes. Each is one file, `shared/i18n/copy/<language>.json`. All are machine translations by Claude and want a native reader before release; only Hindi has been seen on a phone (G1.03).
- [ ] G1.03 Device: spot-check one Indic locale, German (long words) and Japanese

### G2. Quality
- [ ] G2.00 Before any upload: the release build (the same profile as the upload) installed fresh on a phone and taken through first run to Home, and installed over 1.2.4 with data. Added 2026-10-08 after build 65 reached internal testing with a blank, flickering first screen that no dev build showed
- [ ] G2.11 The amount field takes letters: text sent to it from a hardware keyboard, a paste or adb is kept ("$.10Weekly shop" was seen while scripting on 2026-10-08). It must keep digits and one separator only
- [ ] G2.12 Expo 57 upgrade checked on the Android phone (upgraded from 54 on 2026-10-08, branch `upgrade-expo`): a new development build runs, and the screens whose code changed for the stricter lint rules behave as before: add and edit a transaction (account, category and transfer destination stay valid), the account, category and person forms when editing, loan edit, Activity opened from a link, the PIN wait after wrong tries, Home's prompt, the slide-to-confirm control, a notification tap that starts the app. Seen on the Samsung 2026-10-09 with a new development build: first run, setup, Home, add an expense (account and category chosen by default), Activity, the receipt, and the edit form filled from the saved transaction. The rest of the list is not yet looked at
- [ ] G2.13 Expo 57 upgrade checked on the iPhone: first run through to Home. Builds, signs with a free Apple account and starts on iOS 27 (2026-10-09); stopped at the update notice because remote config's `iosMinBuild` was 49
- [ ] G2.14 Remote config `forceUpdateConfig`: `iosMinBuild` and `storeUrlIos` set for iOS before any iOS release (they held Android's 49 and a placeholder)
- [ ] G2.15 Firebase on iOS through Swift packages, once react-native-firebase finds `GoogleService-Info.plist` in an Expo project (26.4.0 does not: the Crashlytics build step fails). Then drop `disableSPM` and static linking in `app.config.ts`. Its CocoaPods stop getting new versions after October 2026
- [x] G2.16 Amounts on iOS have no thousands separator and a space after the symbol ("₹ 35939.88" on the iPhone, "₹37,769.63" on Android; seen 2026-10-09). The sign also sits after the symbol there ("₹ -48.31"). The two platforms must format money the same way
- [x] G2.18 iOS: an amount in an Activity row is sometimes drawn tiny (the "Home internet" row on the iPhone, 2026-10-09): the text that shrinks to fit shrinks far too much
- [ ] G2.17 iOS: after opening a task sheet, closing it and changing tab, the tab's page is blank (owner, 2026-10-09). Not yet reproduced by me
- [x] G2.19 The photo permission is not asked for: `expo-screen-capture` declares `READ_MEDIA_IMAGES` (for noticing screenshots, which Fintraq does not do; it only blocks capture while locked), and Play asks for a justification of it. Blocked in `app.json` with `READ_EXTERNAL_STORAGE`; the generated manifest removes both (2026-10-09)
- [ ] G2.01 Full pass on a small Android phone (360dp) and a large one
- [ ] G2.02 Full pass on iOS. The code is written for both platforms (owner, 2026-10-09); nothing has been run on iOS yet
- [ ] G2.03 Android three-button and gesture navigation
- [ ] G2.04 Dark and light, largest font size, screen reader, on the main flows
- [ ] G2.05 Cold start time and list scrolling compared with 1.2.4
- [ ] G2.06 Upgrade test from 1.2.4 repeated on the release build (as C10)
- [ ] G2.07 Restore a 1.2.4 cloud backup into the release build
- [ ] G2.08 Purchase, restore and expiry on both stores' test accounts
- [ ] G2.09 Analytics: every event still fires with the catalogue's names; no personal data
- [ ] G2.10 Crash-free on the internal track for a week

### G3. Store
- [ ] G3.01 New screenshots and feature graphic Made 2026-10-08 in `store/` by `scripts/generate-store-assets.py` from Samsung captures with demo data (dollar main, euro, lira and rupee accounts), light mode: seven Play screenshots (1080 x 1920), the feature graphic (1024 x 500) and phone mockups. Not ticked: the owner has not chosen among them, they are English only, and there are no videos (owner: later).
- [ ] G3.02 New app icon and splash, if the brand changes with the look (owner) Polished to the new look with C8.08; waits for the owner's eye on a build.
- [ ] G3.03 Listing text: remove "No subscriptions"; describe the three plans
- [ ] G3.04 Privacy policy and terms updated for subscriptions
- [ ] G3.05 Data-safety and privacy labels reviewed
- [ ] G3.06 Release notes
- [x] G3.07 Version number decided (a redesign suggests 2.0.0) Set to 2.0.0 on 2026-10-08 in `app.json` and `package.json`; the build number is kept by EAS (`appVersionSource: remote`).

### G4. Rollout
- [ ] G4.01 Internal track, then closed testers
- [ ] G4.02 Staged rollout on Play: 5%, 20%, 50%, 100%, watching crashes and reviews at each step
- [ ] ~~G4.03 iOS phased release~~ Deferred with the other store-side iOS work: there is no iOS listing yet
- [ ] G4.04 Owner: go or no-go at each step

---

## H. Release 2: repeating items, budgets, net worth trend

Done when: a free user can make 2 repeating items and 1 budget, Pro removes
the limits, and older backups still restore.

### H1. Free backup file
Moved forward to D14 (owner, 2026-10-08): see D14.10 to D14.14.

### H2. Repeating items: data
- [ ] H2.01 `recurring_rules` table in the schema (template, cadence, next due, auto or confirm, end)
- [ ] H2.02 Generated migration; applies on a phone with existing data
- [ ] H2.03 Backup format version raised; older backups restore with no rules
- [ ] H2.04 Repository: create, edit, pause, delete, list upcoming
- [ ] H2.05 Rule for the next due date across month ends and leap years, with tests
- [ ] H2.06 Catch-up when the app has not been opened for several periods, with tests

### H3. Repeating items: screens
- [ ] H3.01 "Repeat" on the entry flow creates a rule
- [ ] H3.02 List of repeating items with next date and amount
- [ ] H3.03 Rule screen: edit, pause, delete, history of what it created
- [ ] H3.04 Upcoming on the Plan tab: the next 30 days
- [ ] H3.05 Due today: add automatically or confirm with one tap
- [ ] H3.06 Notification for items awaiting confirmation
- [ ] H3.07 Free limit of 2 leads to the paywall
- [ ] H3.08 Shared checklist

### H4. Budgets: data
- [ ] H4.01 `budgets` table (category or overall, currency, limit, rollover)
- [ ] H4.02 Generated migration; applies on a phone with existing data
- [ ] H4.03 Backup format version raised; older backups restore with no budgets
- [ ] H4.04 Repository: create, edit, delete, spent so far this month
- [ ] H4.05 Rollover rule with tests
- [ ] H4.06 Warning thresholds at 80% and 100%, each sent once a month, with tests

### H5. Budgets: screens
- [ ] H5.01 Budgets on the Plan tab with progress bars
- [ ] H5.02 Budget screen: limit, spent, left, days left, its transactions
- [ ] H5.03 Form: category or overall, amount, rollover
- [ ] H5.04 Budget shown on the category in Insights
- [ ] H5.05 Notifications at the two thresholds
- [ ] H5.06 Free limit of 1 leads to the paywall
- [ ] H5.07 Shared checklist

### H6. Net worth over time (Pro)
- [ ] H6.01 Month-end net worth computed from transaction history, per currency, with tests
- [ ] H6.02 Line chart on Accounts and in Insights
- [ ] H6.03 Locked state for free users

### H7. Ship
- [ ] H7.01 Mark `budgets`, `recurring`, `netWorthTrend` as `live` in the registry
- [ ] H7.02 English copy and the 12 translations
- [ ] H7.03 Analytics events added to the catalogue
- [ ] H7.04 Upgrade test from Release 1 with real data
- [ ] H7.05 Owner: price change for new buyers, if any
- [ ] H7.06 Store listing and screenshots updated
- [ ] H7.07 Staged rollout

---

## I. Release 3: goals, safe to spend, statement

### I1. Goals
- [ ] I1.01 `goals` table (name, target, date, linked account, icon, colour)
- [ ] I1.02 Generated migration; backup format version raised; older backups restore
- [ ] I1.03 Repository and the "set aside each month" rule, with tests
- [ ] I1.04 Goals on the Plan tab with a ring
- [ ] I1.05 Goal screen and form
- [ ] I1.06 Reached-goal moment
- [ ] I1.07 Free limit of 1 leads to the paywall
- [ ] I1.08 Shared checklist

### I2. Safe to spend (Pro)
- [ ] I2.01 The rule: expected income, minus repeating items still due, minus budgets and goal contributions, over days left; with tests for each term
- [ ] I2.02 What it shows when there is too little data to be honest
- [ ] I2.03 Gauge on Home for Pro users
- [ ] I2.04 "How this is worked out" sheet
- [ ] I2.05 Locked state for free users

### I3. Monthly statement (Pro)
- [ ] I3.01 Choose a way to make a PDF on both platforms
- [ ] I3.02 One-page layout: totals, categories, largest items, net worth
- [ ] I3.03 Choose the month; save or share
- [ ] I3.04 Renders correctly in every locale and script
- [ ] I3.05 Locked state for free users

### I4. Ship
- [ ] I4.01 Mark `goals`, `safeToSpend`, `statement` as `live`
- [ ] I4.02 Copy and translations
- [ ] I4.03 Analytics events
- [ ] I4.04 Upgrade test from Release 2 with real data
- [ ] I4.05 Store listing updated
- [ ] I4.06 Staged rollout

### I5. Reconsider after Release 3
- [ ] I5.01 Receipt photos
- [ ] I5.02 Auto-categorising rules
- [ ] I5.03 A free trial, with conversion data in hand
