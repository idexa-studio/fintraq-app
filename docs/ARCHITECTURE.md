# Architecture & Coding Style

How the Fintraq app is organised and the conventions every change follows.
For UI rules see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Stack

Expo SDK 54 · React Native 0.81 · React 19 (React Compiler on) · Expo Router · SQLite + Drizzle ORM ·
TanStack Query · react-hook-form · i18next · Reanimated 4 · Hugeicons · Firebase (analytics, crashlytics, remote config, auth).

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
