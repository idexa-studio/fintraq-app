# Fintraq app

Offline-first personal finance app (Expo / React Native, SQLite + Drizzle).
Live on the stores as version 1.2.4, with real users' data on their phones.

## What is happening: a full reboot

Started 2026-10-08. The product is being rebuilt from scratch: new look, new
layouts, new copy, new folder structure, a reorganised Pro. **Only user data
carries forward.** Nothing of the old design is to be reused or "improved".

The work is tracked task by task in **`docs/PLAN.md`**. Always work from it:

1. Take the next unticked task in the current phase. Do not skip ahead to a
   later phase.
2. Do that task, with its check (device, owner, test) actually carried out.
3. Tick it and update the progress table in the same change.
4. If something new turns up, add it to the plan as a task; do not just do it.

Current phase: **C, groundwork.** The gallery was approved on 2026-10-09
(task B7.01); new widgets still go through the gallery first.

## Read before changing anything

| File | Answers |
| --- | --- |
| `docs/PLAN.md` | What to do next, and what is done |
| `docs/PRODUCT.md` | What is free, what is Pro, the three plans, and why |
| `docs/SCREENS.md` | Every screen, its route, old paths that must keep working, the flows |
| `docs/ARCHITECTURE.md` | Folder structure, who may import whom, how data carries forward |
| `docs/DESIGN_SYSTEM.md` | Tokens, components, patterns, how to add a component |

## Where code goes

```
app/              routes only; each file re-exports a screen
design/           design system: tokens, icons, components. Knows nothing about money
features/<name>/  one product area; used from outside only through its index.ts
data/             database, repositories, backup format
platform/         store purchases, Drive, notifications, lock, telemetry, config
shared/           pure helpers and contracts; depends on nothing
src/              LEGACY screens, components and providers only. Deleted in phase F
```

- Import UI only from `@/design`. Tokens come from its `useTheme()`. No hex
  colours, no bare `fontSize`, in feature code.
- Imports use the `@/…` alias; `./` only for a file in the same folder; never
  `../`.
- New code never imports from `@/src`. Lint enforces the import directions and
  `npm run lint:design` fails on reaching into another feature's internals.
- One component per file, named exports, styles in a `createStyles(theme)`
  factory read with `useStyles`. Match the surrounding code.

## The look

Matched to the owner's reference screens by measurement, not by eye: grey
page, white cards, black actions, vivid green accent, one humanist sans
throughout (Proza Libre, bold for headings), soft 10pt corners, no shadows.

- **Gallery first.** Every widget is built in `design/`, shown in the Design
  Gallery (`features/gallery/`) and approved by the owner before a screen uses
  it. Sections show Fintraq's own screens, not copies of the reference.
- **Icons:** Remix Icon, outline and solid. Add one by adding a line to
  `design/icons/icon-map.json` and running `npm run icons:generate`. Never
  import an icon package.
- **Illustrations:** none. Three hand-drawn attempts were rejected and the
  owner wants nothing bold. Messages and empty states use `Emblem` (a line
  icon in a pale green circle) until a professional light-line set is chosen.
  Do not draw illustrations by hand.
- **Settled choices:** the currency menu sits on the balance card; the wave
  card is fully green; highlights are white cards; tabs are Home, Activity,
  Add, Plan, Insights; a task is a stacked sheet (black backdrop, the screen
  behind peeking above it) holding the reference's form. "Stacked" means
  sheets over screens, not step cards inside a form. The full list with
  reasons is in `docs/PLAN.md` under B1.

## Looking at the result

The owner reviews on an Android phone over adb, and so should you. A visual
change that was not looked at on the phone is not done.

```bash
npx expo start --dev-client --port 8081      # not with CI=1: that turns off reloading
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "luno://design-gallery?section=home\&scheme=light\&at=$(date +%s)" me.nafish.luno
adb exec-out screencap -p > shot.png
```

Sections: `home`, `entry`, `money`, `insights`, `system`, `ideas`,
`foundations`, `actions`, `inputs`, `display`, `feedback`, `navigation`.
Swipe slowly when scripting (a long duration), or the list flings to the end.
The app does not run in a browser.

## Data must carry forward

These are contracts with every existing user. Each has, or is getting, a test
that fails if it is broken. Any change is additive.

- **Database:** file name, tables and columns. Never edit `drizzle/` by hand;
  change `schema.ts` and run `npm run db:generate`.
- **Backup format:** every older snapshot shape must keep restoring.
- **Storage keys** in AsyncStorage and the secure store: never renamed.
- **Icon names** saved on categories and accounts
  (`shared/contracts/stored-icon-names.ts`): each keeps a glyph for ever.
- **Store product ids** (`shared/contracts/product-ids.ts`): `luno_lifetime`,
  `luno_yearly`, `luno_monthly` and their `com.luno.*` twins on iOS.
- **Old paths** in pinned launcher shortcuts and notifications: kept as
  redirects (`docs/SCREENS.md`).

## Pro

`features/pro/` is the only place that says what Pro is: features in four
pillars (Plan, Understand, Find and share, Protect), free limits, and the
three plans. Lifetime is listed first and preselected; its advantage is shown
by arithmetic from live store prices, never by pressure. Gate and advertise
only from the registry, and only features marked `live`. Recording money is
never gated, and a lapsed subscriber never loses data.

## Text

User-facing strings go through i18n; the new English copy is written fresh,
screen by screen. Thirteen locales ship. Developer tools and the gallery are
English only.

## Checks

All must be clean before a task is ticked:

```bash
npx tsc --noEmit
npx expo lint
npm run lint:design
npm test
```

## Owner's standing decisions

- Write every screen and component to work on iOS as well as Android. Only
  store-side iOS work (products, listing, release) is deferred. Where the
  platforms differ, use the native behaviour on each (for example sheets:
  iOS stacks them itself; Android gets `SheetFrame`). Nothing has been run on
  iOS yet, so say so when reporting.

- Three plans (monthly, yearly, lifetime); lifetime is the one to push, by
  pricing it to look clearly cheaper.
- Full freedom to restructure the codebase. Still ask before committing,
  pushing, publishing, deleting user data, or anything that costs money.
