# Architecture & Coding Style

How the Fintraq app is organised and the conventions every change follows.
For UI rules see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Stack

Expo SDK 54 · React Native 0.81 · React 19 (React Compiler on) · Expo Router · SQLite + Drizzle ORM ·
TanStack Query · react-hook-form · i18next · Reanimated 4 · Hugeicons · Firebase (analytics, crashlytics, remote config, auth — see "Analytics & crash reporting").

## Folder structure

```
app/                        Routes only (Expo Router). Each file re-exports a screen.
  (onboarding)/             First-run flow
  (main)/                   Authenticated app shell
    (tabs)/                 Bottom-tab screens
  transactions/ premium.tsx search.tsx

src/
  components/
    ui/                     Design-system primitives — domain-agnostic. Barrel: index.ts
    pickers/                Reusable pickers built on ui/ (currency, colour, icon, calculator)
    ErrorBoundary.tsx
  features/<feature>/
    api/                    Data access: Drizzle queries, pure async functions
    hooks/                  React Query hooks wrapping api/
    components/             UI used by this feature
    screens/                One component per route
    constants.ts, types.ts  Optional, feature-local
  theme/                    Design tokens — colors, typography, spacing… (no React)
  providers/                App-wide context (Theme, Settings, Premium, Lock…)
  services/                 Side-effectful singletons (backup, notifications, logging, IAP)
  db/                       Drizzle client, schema, seeds
  i18n/                     Locales + i18next config
  hooks/                    Cross-feature hooks
  lib/                      Framework glue (query keys)
  utils/                    Pure helpers (format, date, icons)
  constants/  types/

drizzle/                    Generated SQL migrations — never edit by hand
docs/                       Product & engineering docs
plugins/                    Expo config plugins
```

### Where does new code go?

| You are adding… | Put it in |
|---|---|
| A new route | `app/…/name.tsx` that re-exports `src/features/<f>/screens/NameScreen` |
| A screen | `src/features/<f>/screens/` |
| A component used by one feature | `src/features/<f>/components/` |
| A generic, domain-agnostic component | `src/components/ui/` + a specimen in the Design Gallery |
| A picker reused by several features | `src/components/pickers/` |
| A DB query | `src/features/<f>/api/` |
| A React Query hook | `src/features/<f>/hooks/` (keys in `src/lib/query-keys.ts`) |
| Background work / platform SDK wrapper | `src/services/` |
| A colour, size, radius or duration | `src/theme/` — never inline |

### Dependency rules

```
app ──▶ features/screens
features ──▶ components · providers · services · db · theme · utils · i18n
components/pickers ──▶ components/ui · constants · utils
components/ui ──▶ theme · providers/ThemeProvider · utils · types   (never features, services, db)
theme ──▶ nothing
```

- A feature may import another feature's `components/` or `hooks/`, never its `screens/` or `api/`.
- `components/ui` must stay product-agnostic. If a component needs to know what a transaction or loan is, it belongs in a feature.

## Coding style

### Imports
- Use the `@/src/…` alias for anything outside the current folder. `./Sibling` only for files in the same folder. **No `../`** (lint warns).
- Import primitives from the barrel: `import { Button, Text, ListItem } from '@/src/components/ui';`
- Import pickers from `@/src/components/pickers`.

### Components
```tsx
type AccountCardProps = { account: Account; onPress: () => void };

export const AccountCard = React.memo(function AccountCard({ account, onPress }: AccountCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (…);
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({ … });
```
- Named exports only. Default exports are reserved for `app/` route files.
- One component per file, file named after the component (`PascalCase.tsx`).
- Props type is `<Name>Props`, declared above the component.
- Styles live in a `createStyles(theme)` factory at the bottom of the file, memoised on `theme`.
- Small private sub-components may live in the same file. Once a second file needs one, promote it.
- Early returns over nested ternaries. Keep screens under ~400 lines; extract sections into `components/`.

### Styling
- Colours from `useTheme().colors`, tints via `alpha(color, 'subtle')`. No hex literals in features.
- Text through `<Text variant>` (or `typography.variants.*` in a StyleSheet). No bare `fontSize`.
- Spacing via `spacing('4')`, radius via `radius('xl')`, durations via `animation.normal`.
- See the design system doc for which component to reach for.

### Naming
| Thing | Convention | Example |
|---|---|---|
| Component / screen | PascalCase | `LoanCard.tsx`, `LoansScreen.tsx` |
| Hook | `useX` camelCase | `useLoanReminders.ts` |
| Service | kebab `*.service.ts` | `notification.service.ts` |
| Feature API module | feature name | `features/loans/api/loans.ts` |
| Constants | SCREAMING_SNAKE | `CATEGORY_ICON_GROUPS` |
| Booleans | `is/has/should` | `isPremium`, `hasOnboarded` |

### Data
- Screens never call Drizzle directly: screen → hook (`features/*/hooks`) → api (`features/*/api`) → db.
- Mutations invalidate through the shared keys in `src/lib/query-keys.ts`.
- Persisted preferences go through `SettingsProvider`; secrets through `expo-secure-store`.

### Text & i18n
- Every user-facing string goes through `t('…')` with keys in `src/i18n/locales/en.ts` (the typed source); other locales follow.
- Developer tooling (Developer screen, Design Gallery) is English-only by design.

### Accessibility
- Custom pressables set `accessibilityRole` and a label; icon-only buttons use `IconButton`, which requires `accessibilityLabel`.
- Touch targets are at least 44pt (`layout.minTouchTarget`).
- Don't convey meaning by colour alone: income/expense also carry `+`/`−`.

### Comments
Explain *why*, not *what*: constraints, platform quirks, non-obvious maths. Delete commented-out code.

## Free vs Pro

`src/features/premium/pro-features.ts` is the one list of Pro capabilities (id, icon, paywall group). Ids are also the i18n keys under `premium.features.*`, and a test checks every feature has copy and a group.

- **Sections** — `<ProGate feature="…">` renders children for Pro, a locked card otherwise. `ProPreviewCard` lists several locked sections behind one button.
- **Actions** — `useProAccess()` gives `isPremium`, `requirePro(feature)` (opens the paywall and returns false on the free plan) and `openPaywall(feature?)`.
- **Routes** — Pro-only screens (`/search`, `/export`) render `ProGateScreen` for free users, so deep links can't bypass the gate.
- **Paywall** — `/premium?feature=<id>` leads with that feature. The paywall, the Pro screen and the dashboard upsell all render from the registry.
- **Free caps** — `FREE_LOAN_LIMIT` and `FREE_PERSON_LIMIT` in `src/constants/iap.ts`; hitting one opens the paywall on `unlimited`.
- **Background work** (auto-backup) can't use hooks; it reads the persisted entitlement through `BackupPreferences.isProEntitled()`.
- **Developer override** — the Developer screen's "Premium override" is honoured in development builds only (`IS_PREMIUM_OVERRIDE_ALLOWED`). Test Pro on a release build with a store licence-tester account.
- **Pending purchases** (`isSettledPurchase`) never grant Pro and are never finished; the store sends another update when payment settles.

### Home vs Analytics

Each tab has one job, so a widget belongs to exactly one of them:

- **Home — where you stand, what to do next.** Balance and this month's net, quick actions, this month's spend against last month, accounts, recent transactions, people and loans to settle. No Pro locks.
- **Analytics — why.** Period summary and trend, top categories, spending rhythm (free); highlights and month-end forecast, insights, full category breakdown, weekly pattern, people and balances (Pro). Free users see these as one `ProPreviewCard`.

A new chart, breakdown or forecast goes in Analytics; Home links to it from the "This month" header.

## Cloud backup

Offline-first: SQLite is the source of truth; Google Drive `appDataFolder` holds one JSON snapshot
(`fintraq_backup.json`). The format is versioned in `services/backup/backup-snapshot.ts` and every
older shape must keep restoring — covered by `__tests__/backup-snapshot.test.ts`.

```
features/backup/hooks        React Query + useSyncExternalStore; the only thing screens import
  useBackupAccount           connected account (Firebase auth state is the source of truth)
  useLatestBackup            newest Drive file, cached offline, updated by completed runs
  useAutoBackupSetting       the switch: permission gate → pref → OS task → first run
  useEnableCloudBackup       connect + auto-backup in one step (every "set up backup" entry point)
  useCloudBackupActions      manual backup / restore
  useBackupProgress          live progress of any run, including auto-backups
services/backup
  cloud-backup.service       the one backup pipeline (export → upload w/ retry → record)
  cloud-restore.service      the one restore pipeline (locate → download → import)
  auto-backup.service        policy: entitled? enabled? idle? due? signed in? → run
  auto-backup.triggers       foreground checks: launch, resume, Android backgrounding
  background-backup.task     headless OS task (WorkManager / BGTaskScheduler) → same policy
  backup-state               single operation slot (backup | restore) + progress, shared store
  backup-preferences         the only reader/writer of backup AsyncStorage keys
  backup-schedule            pure timing rules (due, overdue, check cadence)
  database-backup.service    snapshot export and atomic import
  google-drive.*             Drive API, auth/session, transport, error classification
```

Rules that keep it reliable:
- **One operation at a time.** Claim the slot with `tryBeginOperation` *before* the first `await`.
- **Auth vs transient.** Only a definitively unusable grant is a `GoogleDriveAuthError`; the Drive
  service then ends the session so every screen and the background task agree. Network failures
  are transient and never sign the user out.
- **Never overwrite a backup this install doesn't own.** Drive holds one file. Auto-backup skips (`unclaimed_backup`) when the file wasn't made or restored by this install (`BackupPreferences.isOwnBackup`); a manual backup confirms first.
- **Export is one read transaction**, so the snapshot is a single point in time.
- **Foreground checks are the reliable path**; OS background scheduling is best-effort.
- `patches/expo-background-task+1.0.10.patch` backports expo/expo#44663 and #44667 (Android worker
  was replaced on every cold start). Drop it when upgrading to an SDK that ships those fixes.

## Checks before a PR

```bash
npx tsc --noEmit     # types
npx expo lint        # lint (no warnings)
npm test             # unit tests (Jest)
```
Open **Settings → tap the footer 10× → Developer (PIN) → Design gallery** and check any component you touched in both themes.

## Analytics & crash reporting

Firebase Analytics (GA4) and Crashlytics, behind `src/services/telemetry`. Screens never import
the Firebase SDK.

```
services/telemetry
  events.ts               the event catalogue: every event name + its params, typed
  analytics.ts            Analytics.track / screen / setUserProperties / setEnabled
  crashlytics.ts          Crashlytics.recordError / setEnabled
  params.ts               pure: GA4 name/param limits, result buckets, screen-name templates
  firebase-modules(.native).ts   SDK on iOS/Android, null on web (preview build, tests)
providers/TelemetryProvider       applies the user's choice, logs screen_view, sets user properties
```

Rules
- **Track through the catalogue.** Add the event to `events.ts` first; `Analytics.track(name, params)`
  is type-checked against it. Calls are fire-and-forget (return `void`) and never throw, so never
  `await` them on a save or purchase path.
- **No personal or financial data.** No amounts, balances, notes, names, search text, IDs or any
  typed text — only low-cardinality enums and buckets (`resultBucket`). Screen names are route
  templates (`accounts/[id]`), never concrete paths.
- **GA4 recommended names only with their prescribed params** (`tutorial_begin`,
  `tutorial_complete`, `begin_checkout` with `items`/`value`/`currency`); otherwise a custom name
  (`search_performed`, since recommended `search` expects the query). Never log `purchase`:
  Firebase records store purchases as `in_app_purchase` automatically, and logging both doubles
  revenue. Never use an SDK-reserved name (`RESERVED_EVENT_NAMES` in `params.ts`; such events are
  dropped) and never add a param that can only hold one value.
- **Limits are enforced in code** (`params.ts`): names ≤40 chars, param values ≤100, ≤25 params,
  user property names ≤24 and values ≤36; anything GA4 would silently drop is dropped visibly.
- **Consent.** Settings → About → Privacy policy → *Share usage data* (`profile.shareUsageData`, on by default)
  controls both Analytics and Crashlytics. Native collection starts off (`firebase.json`) and the
  provider enables it once settings load; events fired earlier wait for that and are dropped if
  the user opted out. Ad storage, ad user data and ad personalisation consent are always denied,
  advertising-ID collection is off and the Android `AD_ID` permission is removed (`app.json`).
- **Debug builds send nothing.** To verify events, run a dev build with
  `EXPO_PUBLIC_ANALYTICS_DEBUG=1`, enable DebugView (`adb shell setprop debug.firebase.analytics.app me.nafish.luno`,
  or `-FIRDebugEnabled` on iOS) and watch Firebase console → DebugView.
- **GA4 console.** Register each event param you report on (`transaction_type`, `mode`,
  `account_type`, `results`, `source`, `outcome`, `destination`, `first_entry`) as an event-scoped custom dimension, and the user properties in
  `AnalyticsUserProperties` as user-scoped ones; unregistered params are collected but not reportable.
