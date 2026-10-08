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
| B | Design sign-off | 56 | 56 | Complete |
| C | Groundwork: shared, data, platform, shell | 79 | 0 | |
| D | Screens at parity with the shipped app | 142 | 0 | |
| E | Pro: three plans and gating | 27 | 0 | |
| F | Remove the legacy code | 16 | 0 | |
| G | Release 1: the redesign | 24 | 0 | |
| H | Release 2: repeating items, budgets, net worth trend | 41 | 0 | |
| I | Release 3: goals, safe to spend, statement | 27 | 0 | |

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
- [x] B1.04 Adding a transaction: **single-page form** is the default, because it is done many times a day and one page with one Save is fastest. Stacked cards are for first-run setup and other guided, once-only flows
- [x] B1.05 Text weight: **Regular for running text, Bold for actions and titles**, as measured from the reference
- [x] B1.06 Remove from `design/` and the gallery every widget dropped in B1.02
- [x] B1.07 Home hero follows the reference's account card: white card, balance, two split actions, with quick actions as tiles below. A green hero with round shortcut buttons was tried on 2026-10-09 and rejected by the owner as off-aesthetic; do not reintroduce round black action buttons
- [x] B1.08 Currency is chosen from a dropdown (`Select`) anchored to the chip on the balance card, not by cycling
- [x] B1.09 Insights widgets added at the owner's request: change against last period, in against out, forecast bar, share kept, figures at a glance, largest expenses, weekday rhythm, month calendar, logging habit, category ring, ranked bars for categories and people

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
- [ ] C1.01 Move `src/utils/format.ts` and its test to `shared/format/money.ts`
- [ ] C1.02 Move `src/utils/amount.ts` and its test to `shared/format/amount.ts`
- [ ] C1.03 Move `src/utils/date.ts` and `src/constants/calendar.ts` to `shared/date/`
- [ ] C1.04 Move `src/constants/currency.ts` to `shared/currency/`
- [ ] C1.05 Move `src/constants/keys.ts` to `shared/contracts/storage-keys.ts`; add a test that pins every key string
- [ ] C1.06 Move `src/constants/defaultCategories.ts` and `picker.ts` (stored colour palette) to `shared/contracts/`; pin the palette with a test
- [ ] C1.07 Move `src/utils/errors.ts`, `version.ts`, `greeting.ts` to `shared/`
- [ ] C1.08 Move `src/types/index.ts` to `shared/types.ts`, splitting out anything feature-specific
- [ ] C1.09 Update every import; `tsc`, lint and tests clean

### C2. `shared/i18n` and new copy
- [ ] C2.01 Move i18n config and provider wiring to `shared/i18n/`
- [ ] C2.02 Decide namespaces: one per feature plus `common`
- [ ] C2.03 Write the new English copy namespace by namespace as each screen is built (tracked under D)
- [ ] C2.04 Missing keys in other locales fall back to English, never to a key name
- [ ] C2.05 Script that lists keys missing per locale; run in CI
- [ ] C2.06 Register `features/pro/pro-copy.en.ts` as the `pro` namespace

### C3. `data/db`
- [ ] C3.01 Move `src/db/schema.ts`, `client.ts`, `sql.ts` to `data/db/` with no content change
- [ ] C3.02 Move `src/db/seeds/` to `data/db/seeds/`; seed names in `seeder_state` unchanged
- [ ] C3.03 Point `drizzle.config.ts` at the new schema path; `npm run db:generate` produces no migration
- [ ] C3.04 Confirm `drizzle/` and `migrations.js` are untouched (diff is empty)
- [ ] C3.05 Move `src/services/local-migration.service.ts` (old Luno/Keep database rename) to `data/db/`
- [ ] C3.06 Update every import; tests clean

### C4. `data/repositories`
One module per entity holding every read and write, taken from the legacy
`api/` files without changing behaviour.
- [ ] C4.01 `accounts.ts` from `src/features/accounts/api/accounts.ts` and `src/utils/accounts.ts`
- [ ] C4.02 `transactions.ts` from `src/features/transactions/api/transactions.ts` and `src/utils/transactions.ts`
- [ ] C4.03 Ledger rules (`ledger.test.ts`) move with it and stay green
- [ ] C4.04 `categories.ts`
- [ ] C4.05 `people.ts` (table stays `persons`)
- [ ] C4.06 `loans.ts`
- [ ] C4.07 `summaries.ts` from `dashboard/api/dashboard.ts`
- [ ] C4.08 `analytics.ts` from `analytics/api/analytics.ts` and `src/utils/analytics.ts`
- [ ] C4.09 `insights.ts` from `dashboard/api/insights.ts`
- [ ] C4.10 `search.ts` from `search/api/global-search.ts`
- [ ] C4.11 `filters.ts` from `filters/api/advanced-filters.service.ts` with its test
- [ ] C4.12 `streak.ts` from `reports/api/streak.service.ts`
- [ ] C4.13 `export.ts` (CSV) from `export/api` and `export/utils` with its test
- [ ] C4.14 `query-keys.ts` and `after-ledger-write.ts` from `src/lib/`
- [ ] C4.15 Legacy `api/` files become one-line re-exports so legacy screens keep running

### C5. `data/backup`
- [ ] C5.01 Move `backup-snapshot.ts`, `backup.types.ts`, `database-backup.service.ts` to `data/backup/`
- [ ] C5.02 `backup-snapshot.test.ts` moves with it: every older shape still restores
- [ ] C5.03 Add a fixture backup exported from the shipped 1.2.4 build and a test that restores it

### C6. `platform/`
- [ ] C6.01 `platform/drive/`: `google-drive.*` with their tests
- [ ] C6.02 `platform/backup/`: cloud backup, cloud restore, auto-backup service, triggers, background task, state, preferences, schedule, battery optimisation, with tests
- [ ] C6.03 The background task is still defined at module load from the root layout (verify a headless run on Android)
- [ ] C6.04 `platform/notifications/`: `notification.service.ts`, `reminders/*` with test
- [ ] C6.05 `platform/purchases/`: `iap.service.ts`
- [ ] C6.06 `platform/telemetry/`: all of `telemetry/` with tests
- [ ] C6.07 `platform/lock/`: `lockStorage.ts`, `useLocalAuth`, PIN lockout rules with test
- [ ] C6.08 `platform/config/`: remote config, app config, force update, review prompt
- [ ] C6.09 `platform/logging/`: `logger.service.ts`
- [ ] C6.10 `platform/shortcuts/`: launcher shortcuts
- [ ] C6.11 Check `patches/expo-background-task` still applies

### C7. App state
- [ ] C7.01 Settings store in `shared/settings/` reading the same `@fintraq_profile` key; older saved profiles still load
- [ ] C7.02 Bind `design`'s `ThemeProvider` to the saved theme setting and the system scheme
- [ ] C7.03 Onboarding state reading the same `@fintraq_onboarded` key
- [ ] C7.04 Lock state provider on `platform/lock`
- [ ] C7.05 Telemetry provider: same consent key, same default
- [ ] C7.06 Query client provider

### C8. Shell and navigation
- [ ] C8.01 New root layout: fonts, splash, old-database rename, providers, in the order the legacy root uses
- [ ] C8.02 Tab layout using `TabBar`: Home, Activity, Add, Plan, Insights
- [ ] C8.03 Centre Add opens the entry task, not a tab
- [ ] C8.04 Task presentation (rises, serif header, close) and push presentation defined once
- [ ] C8.05 Android: system navigation bar colour, predictive back off as today, edge to edge
- [ ] C8.06 Status bar style follows the scheme
- [ ] C8.07 Lock overlay above everything, including tasks
- [ ] C8.08 Splash, adaptive icon and notification colours updated to the new palette in `app.json`
- [ ] C8.09 New screens are built behind a developer switch so the shipped screens stay the default until G

### C9. Old paths keep working
- [ ] C9.01 `/transactions/create?type=DR|CR|TR` redirects to `/add?kind=…`
- [ ] C9.02 `/(main)/loans/form` redirects to `/loans/new`
- [ ] C9.03 `/transactions/edit/[id]` redirects to `/transactions/[id]/edit`
- [ ] C9.04 `/transactions?accountId=|categoryId=` redirects to `/activity` with the filter
- [ ] C9.05 `/persons`, `/persons/[id]` redirect to `/people`, `/people/[id]`
- [ ] C9.06 `/premium?feature=` redirects to `/pro?feature=` through `resolveProFeature`
- [ ] C9.07 `/analytics`, `/backup`, `/export` redirect
- [ ] C9.08 Test: a table of old paths and where each lands
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
- [ ] D1.01 Unlock screen: Emblem, PIN marks, keypad without decimal
- [ ] D1.02 Biometric prompt on open, with PIN as the way back
- [ ] D1.03 Wrong PIN message; lockout with the time remaining shown
- [ ] D1.04 Create PIN and confirm PIN task
- [ ] D1.05 Lock on background after the existing timeout; screenshots blocked as today
- [ ] D1.06 Shared checklist

### D2. First run
- [ ] D2.01 Welcome: start fresh or restore
- [ ] D2.02 Setup as stacked cards: name
- [ ] D2.03 Setup: default currency (currency picker)
- [ ] D2.04 Setup: first account and opening balance
- [ ] D2.05 Creating the workspace (please wait) and failure with retry
- [ ] D2.06 Restore: choose file or Google Drive
- [ ] D2.07 Restore progress, "no backup found", try another account
- [ ] D2.08 Reminder offer and the system permission
- [ ] D2.09 Default categories seeded exactly as today
- [ ] D2.10 Shared checklist

### D3. Home
- [ ] D3.01 Header: greeting, search, reminders, profile
- [ ] D3.02 Balance card with currency menu (hidden with one currency)
- [ ] D3.03 Card actions: add expense, add income
- [ ] D3.04 "Transfer or lend" row (hidden with one account)
- [ ] D3.05 This month: in, out, kept
- [ ] D3.06 Accounts section and "See all"
- [ ] D3.07 Recent transactions and "See all"
- [ ] D3.08 People and loans section
- [ ] D3.09 Getting-started steps for a new user (same dismissal key)
- [ ] D3.10 Empty versions of every section
- [ ] D3.11 Backup prompt and review prompt at the same moments as today
- [ ] D3.12 Hooks on `data/repositories/summaries`
- [ ] D3.13 Shared checklist

### D4. Activity
- [ ] D4.01 List grouped by day with day totals
- [ ] D4.02 Kind chips: all, expenses, income, transfers
- [ ] D4.03 Filter sheet and active filter chips
- [ ] D4.04 Sort menu
- [ ] D4.05 Period summary at the top
- [ ] D4.06 Swipe a row to edit or delete, with confirmation
- [ ] D4.07 Opens filtered from an account or a category
- [ ] D4.08 Paging through long histories without stutter
- [ ] D4.09 Empty and "nothing matches" states
- [ ] D4.10 Shared checklist

### D5. Add and edit a transaction
- [ ] D5.01 Kind: expense, income, transfer; preselected from the entry point
- [ ] D5.02 Amount with keypad, quick amounts, calculator
- [ ] D5.03 Account picker; default account preselected
- [ ] D5.04 Destination account for transfers; same account not offered
- [ ] D5.05 Category picker filtered by kind, with "add category"
- [ ] D5.06 Date and time
- [ ] D5.07 Note with remaining characters
- [ ] D5.08 Person, optional
- [ ] D5.09 Save disabled with the reason until valid
- [ ] D5.10 Save writes through the ledger rules; balances update
- [ ] D5.11 Edit loads an existing transaction; changing account or kind rebalances correctly
- [ ] D5.12 Delete with confirmation
- [ ] D5.13 Leaving with unsaved input asks first
- [ ] D5.14 Toast after saving, with undo
- [ ] D5.15 Daily-reminder skip is recorded after a save, as today
- [ ] D5.16 Shared checklist

### D6. Transaction
- [ ] D6.01 Receipt layout: category, amount, account, date, note, person, loan
- [ ] D6.02 Edit and delete
- [ ] D6.03 Links to its account, category, person and loan
- [ ] D6.04 Shared checklist

### D7. Accounts
- [ ] D7.01 List by type with balances
- [ ] D7.02 Net worth: have, owe, difference, per currency
- [ ] D7.03 Account screen: balance, in and out, its activity
- [ ] D7.04 Card actions: add transaction, transfer
- [ ] D7.05 Form: name, type, currency, holder, number, icon, colour, opening balance
- [ ] D7.06 Set as default
- [ ] D7.07 Delete with confirmation that states what goes with it
- [ ] D7.08 Empty state
- [ ] D7.09 Shared checklist

### D8. Categories
- [ ] D8.01 List by kind
- [ ] D8.02 Form: name, kind, icon, colour
- [ ] D8.03 System categories cannot be deleted; say why
- [ ] D8.04 Delete moves its transactions as today
- [ ] D8.05 Shared checklist

### D9. People
- [ ] D9.01 List with balances: owes you, you owe, settled
- [ ] D9.02 Person screen: balance, loans, shared activity
- [ ] D9.03 Form: name, phone, email, role, company, colour
- [ ] D9.04 Free limit of 10 leads to the paywall
- [ ] D9.05 Delete with confirmation
- [ ] D9.06 Empty state
- [ ] D9.07 Shared checklist

### D10. Loans
- [ ] D10.01 Loan screen as a timeline: lent or borrowed, repayments, due, settled
- [ ] D10.02 Status badge: active, overdue, repaid
- [ ] D10.03 Form: person, direction, amount, account, category, due date, note
- [ ] D10.04 Record a repayment with slide to confirm
- [ ] D10.05 Due reminder and instalment reminder settings
- [ ] D10.06 Reminders rescheduled and cancelled exactly as today
- [ ] D10.07 Free limit of 3 active loans leads to the paywall
- [ ] D10.08 Delete with confirmation
- [ ] D10.09 Shared checklist

### D11. Plan tab (first version)
- [ ] D11.01 Upcoming: loans due, soonest first
- [ ] D11.02 People and balances summary with "See all"
- [ ] D11.03 Placeholders for repeating items, budgets and goals marked "Coming to Pro"
- [ ] D11.04 Empty state
- [ ] D11.05 Shared checklist

### D12. Insights
- [ ] D12.01 Period control
- [ ] D12.02 Period summary with chart (free: this month and this week)
- [ ] D12.03 Top categories (free)
- [ ] D12.04 Extended periods and comparison (Pro: `periods`)
- [ ] D12.05 Forecast (Pro)
- [ ] D12.06 Full category breakdown for spending and income (Pro)
- [ ] D12.07 Rhythm: weekdays and heat calendar (Pro)
- [ ] D12.08 People (Pro)
- [ ] D12.09 Insight findings (Pro)
- [ ] D12.10 One locked card for everything Pro adds, for free users
- [ ] D12.11 Tapping a figure opens Activity with that filter
- [ ] D12.12 Not enough data yet state
- [ ] D12.13 Shared checklist

### D13. Search (Pro)
- [ ] D13.01 Search field, recent searches (same storage key)
- [ ] D13.02 Results grouped: transactions, accounts, people, categories
- [ ] D13.03 Nothing matches state
- [ ] D13.04 Free users reach the paywall, including by link
- [ ] D13.05 Shared checklist

### D14. Backup
- [ ] D14.01 State first, in words: when last backed up, to which account
- [ ] D14.02 Connect and disconnect Google Drive
- [ ] D14.03 Automatic backup switch, with the notification permission it needs
- [ ] D14.04 Back up now, with progress
- [ ] D14.05 Restore with the "replace everything" confirmation and progress
- [ ] D14.06 Backup made by another install: confirm before overwriting
- [ ] D14.07 Every failure says what happened and what to do
- [ ] D14.08 Battery optimisation prompt on Android
- [ ] D14.09 Shared checklist

### D15. Export (Pro)
- [ ] D15.01 Choose what and which period
- [ ] D15.02 Save to the device or share
- [ ] D15.03 Free users reach the paywall, including by link
- [ ] D15.04 Shared checklist

### D16. Settings
- [ ] D16.01 Profile: name
- [ ] D16.02 Default currency
- [ ] D16.03 Language (13 locales)
- [ ] D16.04 Appearance: system, light, dark
- [ ] D16.05 Daily reminder: on, time, exact-alarm permission on Android
- [ ] D16.06 Links: categories, backup, export, app lock, Fintraq Pro
- [ ] D16.07 App lock: off, PIN, biometrics; change PIN
- [ ] D16.08 About: version, privacy, terms, usage-data switch
- [ ] D16.09 Delete all data, with confirmation, clearing every key including retired ones
- [ ] D16.10 Hidden developer entry (same gesture, same PIN)
- [ ] D16.11 In-app web page for privacy and terms
- [ ] D16.12 Shared checklist

### D17. Developer and system screens
- [ ] D17.01 Developer tools and logs on the new components (English only)
- [ ] D17.02 Force-update screen
- [ ] D17.03 Error boundary screen
- [ ] D17.04 Feature tips at the same first-time moments, same storage keys
- [ ] D17.05 Shared checklist

---

## E. Pro: three plans and gating

Done when: all three plans can be bought, restored and expire correctly on
both stores' test accounts, and every gate reads from `features/pro`.

### E1. Store side (owner)
- [ ] E1.01 Owner: enable `luno_monthly` and `luno_yearly` in Play Console
- [ ] E1.02 Owner: confirm and enable `com.luno.monthly` and `com.luno.yearly` in App Store Connect
- [ ] E1.03 Owner: set the three prices so lifetime is the obvious deal
- [ ] E1.04 Owner: licence-testing and sandbox accounts available for testing

### E2. Entitlement
- [ ] E2.01 Entitlement model: lifetime owned, or a subscription active until a date, with its plan
- [ ] E2.02 Read the saved state of the shipped app (`@fintraq_premium_v7`) so current buyers are Pro on first launch offline
- [ ] E2.03 Fetch the three products and prices from the store
- [ ] E2.04 Buy lifetime (one-time) and finish the purchase
- [ ] E2.05 Buy monthly or yearly (subscription) and acknowledge
- [ ] E2.06 Pending payment never grants Pro and is never finished
- [ ] E2.07 Restore finds a lifetime licence or an active subscription
- [ ] E2.08 Renewal, expiry, grace period and refund each move the state correctly
- [ ] E2.09 Background auto-backup reads the entitlement including its expiry
- [ ] E2.10 Developer override still honoured in development builds only
- [ ] E2.11 Tests for every transition in E2.06 to E2.09

### E3. Paywall
- [ ] E3.01 Paywall opens on the feature that led to it
- [ ] E3.02 Three plans, lifetime first and preselected, with the computed lines
- [ ] E3.03 Renewal terms, price and period beside the button; links to terms and privacy
- [ ] E3.04 Upcoming features listed as "Coming to Pro, included in your purchase"
- [ ] E3.05 Prices unavailable and no-network states
- [ ] E3.06 Purchase complete screen, returning to where the user was
- [ ] E3.07 Already Pro: shows the plan held and how to manage a subscription in the store
- [ ] E3.08 Subscriber buying lifetime is told to cancel the subscription, with the store link

### E4. Gates
- [ ] E4.01 `useProAccess` on the new registry: `isPro`, `requirePro(feature)`, `openPaywall(feature)`
- [ ] E4.02 Locked section and locked row components wired to it
- [ ] E4.03 Limit checks use `isOverFreeLimit`
- [ ] E4.04 A lapsed subscriber keeps their data; adding beyond the allowance asks for Pro

---

## F. Remove the legacy code

Done when: `src/` no longer exists and the app builds.
- [ ] F1.01 Delete each legacy feature folder as its screen ships behind the switch and is verified
- [ ] F1.02 Delete `src/components/ui`, `src/components/pickers`, `src/theme`
- [ ] F1.03 Delete the legacy `ThemeProvider` and `PremiumProvider`
- [ ] F1.04 Delete `src/features/premium` and its test; remove `FREE_*` from the old constants
- [ ] F1.05 Remove MuseoModerno from `assets/fonts` and the root layout
- [ ] F1.06 Remove `@hugeicons/*` from `package.json`
- [ ] F1.07 Remove every legacy `api/` re-export left by C4.15
- [ ] F1.08 Remove the developer switch from C8.09; the new screens are the app
- [ ] F1.09 Delete `src/`; remove `@/src` from lint rules and the audit script
- [ ] F1.10 Remove unused i18n keys from all 13 locales
- [ ] F1.11 Remove unused dependencies (run a dependency check)
- [ ] F1.12 `scripts/check-design-system.js`: drop legacy exemptions and rules that no longer apply
- [ ] F1.13 Trim `ARCHITECTURE.md` to the new structure only (`DESIGN_SYSTEM.md` was rewritten in B7.02)
- [ ] F1.14 Remove old store screenshots and generators that draw the old look
- [ ] F1.15 Remove old build artefacts from the repository root
- [ ] F1.16 Bundle size compared with 1.2.4 and recorded

---

## G. Release 1: the redesign

Done when: the redesign is live to all users with no data loss reported.

### G1. Copy and translation
- [ ] G1.01 English copy read through once as a whole for one voice
- [ ] G1.02 Translate the new keys into the other 12 locales
- [ ] G1.03 Device: spot-check one Indic locale, German (long words) and Japanese

### G2. Quality
- [ ] G2.01 Full pass on a small Android phone (360dp) and a large one
- [ ] G2.02 Full pass on iOS (small and large)
- [ ] G2.03 Android three-button and gesture navigation
- [ ] G2.04 Dark and light, largest font size, screen reader, on the main flows
- [ ] G2.05 Cold start time and list scrolling compared with 1.2.4
- [ ] G2.06 Upgrade test from 1.2.4 repeated on the release build (as C10)
- [ ] G2.07 Restore a 1.2.4 cloud backup into the release build
- [ ] G2.08 Purchase, restore and expiry on both stores' test accounts
- [ ] G2.09 Analytics: every event still fires with the catalogue's names; no personal data
- [ ] G2.10 Crash-free on the internal track for a week

### G3. Store
- [ ] G3.01 New screenshots and feature graphic
- [ ] G3.02 New app icon and splash, if the brand changes with the look (owner)
- [ ] G3.03 Listing text: remove "No subscriptions"; describe the three plans
- [ ] G3.04 Privacy policy and terms updated for subscriptions
- [ ] G3.05 Data-safety and privacy labels reviewed
- [ ] G3.06 Release notes
- [ ] G3.07 Version number decided (a redesign suggests 2.0.0)

### G4. Rollout
- [ ] G4.01 Internal track, then closed testers
- [ ] G4.02 Staged rollout on Play: 5%, 20%, 50%, 100%, watching crashes and reviews at each step
- [ ] G4.03 iOS phased release
- [ ] G4.04 Owner: go or no-go at each step

---

## H. Release 2: repeating items, budgets, net worth trend

Done when: a free user can make 2 repeating items and 1 budget, Pro removes
the limits, and older backups still restore.

### H1. Free backup file
- [ ] H1.01 Save the full backup to a file through the system share sheet (free)
- [ ] H1.02 Restore from a chosen file with the "replace everything" confirmation
- [ ] H1.03 Offered at first run and in Backup
- [ ] H1.04 Test: file made by one install restores on another

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
