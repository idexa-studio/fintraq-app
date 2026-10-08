# Architecture & Coding Style

> The legacy `src/` tree was deleted on 2026-10-08. Everything lives in the
> folders below. The old tree's conventions are in this file's git history.

## Target structure (all new code)

```
app/                    Routes only. Each file re-exports a screen. No logic, no styles.
design/                 The design system. Knows nothing about money or Fintraq.
  tokens/               Colour, type, space, shape, motion
  icons/                icon-map.json and the generated glyphs
  components/           One component per file
  index.ts              The only door: import UI from '@/design'
features/<name>/        One product area (home, activity, transactions, accounts, people,
                        loans, plan, insights, pro, backup, lock, onboarding, settings, gallery…)
  screens/              One component per route
  components/           UI used only by this feature, built from '@/design'
  hooks/                State and queries for this feature
  <name>.ts             Pure rules of the feature (e.g. pro-features.ts), with tests beside them
  index.ts              What other features may use. Nothing else is importable from outside
data/                   What is stored and how it is read and written
  db/                   Drizzle client and schema (carried forward unchanged)
  repositories/         One module per entity: every query and write, as plain async functions
  backup/               The backup snapshot format and its version history
platform/               The phone and outside services: store purchases, Google Drive,
                        notifications, biometrics, analytics, crash reports
shared/                 Helpers and constants that depend on nothing else in the app:
                        money and date formatting, contracts (values saved in user data),
                        i18n, the logger
drizzle/                Generated SQL migrations. Never edited by hand
docs/                   PRODUCT.md (free and Pro), SCREENS.md (screens and flows), this file
```

### Who may import whom

```
app      →  features
features →  design · data · platform · shared · other features' index.ts
platform →  data · shared
data     →  shared
design   →  shared
shared   →  nothing
```

- A screen never touches the database: screen → hook → repository.
- `design/` never imports a feature, the data layer or the platform. If a
  component needs to know what a loan is, it belongs in a feature.
- One feature uses another only through its `index.ts`.

These are enforced, not just written down: `eslint.config.js` blocks the
forbidden directions and `npm run lint:design` fails on a reach into another
feature's internals.

### Where does new code go?

| You are adding | Put it in |
| --- | --- |
| A route | `app/…` re-exporting `features/<f>/screens/<Name>Screen` |
| A screen | `features/<f>/screens/` |
| UI for one feature | `features/<f>/components/` |
| UI any feature could use | `design/components/`, exported from `design/index.ts`, with a specimen in the gallery |
| A colour, size, radius, duration | `design/tokens/` |
| An icon | a line in `design/icons/icon-map.json`, then `npm run icons:generate` |
| A query or a write | `data/repositories/<entity>.ts` |
| A table or column | `data/db/schema.ts`, then `npm run db:generate`; additive only, with a backup-format test |
| A rule of the product (limits, what Pro includes) | `features/<f>/<name>.ts` with a test |
| A wrapper round a device or third-party API | `platform/` |
| A value that is saved in user data and must never change | `shared/contracts/` with a test |

### Carrying data forward

The redesign replaces every screen and none of the data. These are the
contracts; each has a test that fails if it is broken.

| Contract | Where | Guard |
| --- | --- | --- |
| Database file name, tables and columns | `data/db` | Drizzle migrations only ever add; `npm run db:generate` must report no changes after a move |
| Storage keys (AsyncStorage, secure store) | `shared/contracts/storage-keys.ts` | `shared/contracts/__tests__/storage-keys.test.ts` pins every key as shipped |
| Icon names saved on categories and accounts | `shared/contracts/stored-icon-names.ts` | `design/icons/__tests__/glyphs.test.ts` |
| Icon names written by older versions | `shared/contracts/legacy-icon-names.ts` | same test: every name they map to still draws |
| Backup snapshot format | `data/backup/snapshot.ts` | `data/backup/__tests__/snapshot.test.ts`: every older shape still restores |
| Store product ids | `shared/contracts/product-ids.ts` | `shared/contracts/__tests__/product-ids.test.ts` |
| Saved profile (settings) | `shared/settings/profile.ts` | `shared/settings/__tests__/profile.test.ts`: older profiles still load |
| Pro feature ids used by old links | `features/pro/pro-features.ts` (`LEGACY_FEATURE_IDS`) | `features/pro/__tests__/pro-features.test.ts` |
| Paths in launcher shortcuts and notifications | redirect routes, see `SCREENS.md` | To be covered when the routes are rebuilt |

The data layer was moved out of `src/` unchanged in content (phase C of the
plan); `npm run db:generate` reports no schema changes. Before release the
whole thing is verified by upgrading a phone that holds real data from the
shipped version (plan task C10).

## Stack

Expo SDK 54 · React Native 0.81 · React 19 (React Compiler on) · Expo Router · SQLite + Drizzle ORM ·
TanStack Query · react-hook-form · i18next · Reanimated 4 · Hugeicons · Firebase (analytics, crashlytics, remote config, auth — see "Analytics & crash reporting").

## Coding style

### Imports

- `@/…` for anything outside the current folder; `./Sibling` only for a file in the same folder; never `../`.
- UI from the barrel: `import { Button, Text, ListRow } from '@/design';`
- Who may import whom is under "Target structure" above, and lint enforces it.

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
- Mutations invalidate through the shared keys in `data/query-keys.ts`.
- Persisted preferences go through `SettingsProvider`; secrets through `expo-secure-store`.

### Text & i18n
- Every user-facing string goes through `t('…')` with keys in `shared/i18n/locales/en.ts` (the typed source); other locales follow.
- Developer tooling (Developer screen, Design Gallery) is English-only by design.

### Accessibility
- Custom pressables set `accessibilityRole` and a label; icon-only buttons use `IconButton`, which requires `accessibilityLabel`.
- Touch targets are at least 44pt (`layout.minTouchTarget`).
- Don't convey meaning by colour alone: income/expense also carry `+`/`−`.

### Comments
Explain *why*, not *what*: constraints, platform quirks, non-obvious maths. Delete commented-out code.

## Free vs Pro

`features/pro/pro-features.ts` is the one list of Pro capabilities (id, pillar, icon, whether it is live). Its words are the `pro` copy namespace, and a test checks every feature has copy.

- **Who is Pro:** `ProProvider` reads the saved entitlement at once (right offline), then asks the store what the account owns and brings the two in line. The rules (`platform/purchases/entitlement.ts`) never see the store SDK; the SDK calls are in `platform/purchases/store.ts`.
- **Screens:** `usePro()` gives `isPro`, `ready`, `openPaywall(feature?)` and `requirePro(feature)` (opens the paywall and answers false on the free plan). A locked section is a `LockedCard`.
- **Routes:** screens that are Pro as a whole (`/search`, `/export`) render `ProGateScreen` for free users, so a link cannot pass the gate.
- **Paywall:** `/pro?feature=<id>` opens on that feature; `/premium?feature=<old id>` redirects to it. It shows the plans, what is held, or the thank-you, and takes every price from the store.
- **Free caps:** `FREE_LIMITS`; reaching one opens the paywall on `unlimited`.
- **Background work** (automatic backup) cannot use hooks; it reads the saved entitlement, with its expiry, through `readSavedPro()`.
- **Developer override:** honoured in development builds only (`IS_PREMIUM_OVERRIDE_ALLOWED`). Test buying on a release build with a store licence-tester account.

## Cloud backup

Offline-first: SQLite is the source of truth; Google Drive `appDataFolder` holds one JSON snapshot
(`fintraq_backup.json`). The format is versioned in `data/backup/snapshot.ts` and every
older shape must keep restoring — covered by `data/backup/__tests__/snapshot.test.ts`.

```
features/backup/hooks        React Query + useSyncExternalStore; the only thing screens import
  useBackupAccount           connected account (Firebase auth state is the source of truth)
  useLatestBackup            newest Drive file, cached offline, updated by completed runs
  useAutoBackupSetting       the switch: permission gate → pref → OS task → first run
  useEnableCloudBackup       connect + auto-backup in one step (every "set up backup" entry point)
  useCloudBackupActions      manual backup / restore
  useBackupProgress          live progress of any run, including auto-backups
platform/backup
  cloud-backup               the one backup pipeline (export → upload w/ retry → record)
  cloud-restore              the one restore pipeline (locate → download → import)
  auto-backup                policy: entitled? enabled? idle? due? signed in? → run
  auto-backup.triggers       foreground checks: launch, resume, Android backgrounding
  background-backup.task     headless OS task (WorkManager / BGTaskScheduler) → same policy
  backup-state               single operation slot (backup | restore) + progress, shared store
  backup-preferences         the only reader/writer of backup AsyncStorage keys
  backup-schedule            pure timing rules (due, overdue, check cadence)
  database-backup            snapshot export and atomic import
platform/drive
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

Firebase Analytics (GA4) and Crashlytics, behind `platform/telemetry`. Screens never import
the Firebase SDK.

```
platform/telemetry
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
