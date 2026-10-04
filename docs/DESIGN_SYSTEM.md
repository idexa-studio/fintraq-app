# Fintraq Design System

The single source of truth for how Fintraq looks and behaves.
- **Tokens:** `src/theme/`
- **Components:** `src/components/ui/`
- **Live catalogue:** the Design Gallery (`app/design-gallery.tsx`). Reach it via Settings → tap the footer 10× → Developer → **Design gallery**. Toggle light and dark in its header.

If a screen needs something the gallery doesn't have, add it to the system first, then use it.

---

## 1. Principles

1. **Calm money.** Finance is stressful. Use generous spacing, few colours, and one clear primary action per screen.
2. **Tone before lines.** Separate layers with surface tone (`background → surface → card`), not borders or shadows.
3. **Meaning is reserved.** Green means money in and red means money out or destructive. Never use them decoratively.
4. **Numbers are the hero.** Amounts use `MoneyText` and the amount type ramp: tabular, signed and consistent.
5. **Every state is designed.** Each list and card defines its loading (Skeleton), empty (EmptyState) and error (Banner) states.
6. **Reachable and legible.** 44pt targets, labelled icon buttons, and dynamic type–friendly line heights.

---

## 2. Tokens

Always read tokens through `const theme = useTheme()`.

| Token | Access | Notes |
|---|---|---|
| Colour | `colors.primary` | Semantic roles below. Never hex in features. |
| Tint | `alpha(colors.danger, 'subtle')` | `faint 6% · subtle 10% · soft 17% · medium 30% · strong 50%` |
| Content on a fill | `foregroundOn(fill)` | Near-black or white, whichever contrasts more. Use for anything drawn on a solid user/brand colour. |
| Type | `<Text variant="body">` / `typography.variants.body` | Family + size + line height + tracking in one. |
| Spacing | `spacing('4')` → 16 | 4px grid. Screen padding 16, section gap 20. |
| Radius | `radius('xl')` → 24 | Shape follows the element — pick what reads best in place, never mixed on one element. **Pill** (`full`) where it looks right: buttons, chips, badges, segmented controls, search fields, the tab-bar indicator, switches, progress; icon buttons are circles. **Soft**: everything else — cards & list groups `xl` 24 · hero, sheets, dialogs `2xl` 28 · tiles inside cards & text inputs `lg` 16 · keypad keys & inner blocks `md` 12 · icon & avatar tiles squircle 30% of size. Nested shapes stay concentric. |
| Density | `sizes.button.md.height` → 44 | One control-height scale **36 / 44 / 52** (sm / md / lg) shared by buttons, icon buttons, segmented controls; chips 36, search 44. Card padding 16, tile gap 10, section header 24 above / 12 below. |
| Elevation | none | Flat: no shadows, glows, gradients or borders. Separate layers with tonal surfaces (`background` → `surface` → `card`). |
| Motion | `animation.normal` → 200ms | `fast 150 · normal 200 · exit 220 · slow 300` |
| Layout | `layout.screenPadding`, `layout.minTouchTarget` | Plus `tabBarClearance(insets.bottom)` for tab screens. |

### Colour roles

| Role | Use for |
|---|---|
| `background` | Page. Lowest layer. |
| `surface` | Cards, list groups, sheets, inputs on the page. |
| `card` | Inset fill *inside* a surface: tracks, chips, nested blocks. (The name is historic: it is not the card background.) |
| `primary` / `primaryForeground` | Brand lime **fill**: main action, active state, hero / content on top of it. |
| `primaryInk` | Brand green for **text and icons** on light layers (links, active chip labels, tonal buttons, checks). Lime as text is ~2:1 — never use `primary` for text (enforced by the `lime-text` audit rule; lime on the dark ink surface is fine). |
| `text` / `textMuted` | Primary / secondary content. |
| `success` · `danger` | Income · expense, destructive, errors. |
| `warning` · `info` | Attention needed · transfers, informational. |
| `heroCard.*` | Lime showcase surfaces (Pro screens). Balance and totals heroes use `HeroSurface`. |

User-chosen colours (accounts, categories, people) come from data. Pass them via a component's `color` prop.

### Type ramp (`<Text variant>`)

| Variant | Size/LH | Use |
|---|---|---|
| `display` | 28/33 bold | Hero numbers, onboarding |
| `title` | 22/27 bold | Screen titles (one per screen) |
| `headline` | 18/23 bold | Dialog & sheet titles |
| `subheading` | 16/21 semibold | Card titles |
| `body` / `bodyStrong` | 14/20 | Reading text / row labels |
| `callout` / `calloutStrong` | 13/19 | Descriptions / compact labels |
| `caption` | 11/15 | Metadata, helper text |
| `label` | 11/15 semibold | Section labels |
| `micro` | 9.5/13 | Badges, counters |
| `amountHero` · `amountLarge` · `amount` | 28 · 22 · 14 | Money |

Tones: `default · muted · primary · success · danger · warning · info · onPrimary`.

---

## Icons

Every icon is a **name** in one registry, `src/components/ui/icon-registry.ts` (`HUGEICONS: Record<IconName, glyph>`). Render with `<Icon name="trash" />` (optional `family`, default `hugeicons`); components that take an icon (`IconAvatar`, `ListItem`, `Button`, `EmptyState`…) take the same `IconName` string. Nothing else imports an icon pack — `check-design-system.js` fails the build if it does.

- **Swap an icon app-wide:** change its entry in the registry.
- **New icon:** add an entry (interface names describe a role: `chevron-right`, `tab-home`); missing glyphs are drawn in `custom-icons.ts`.
- **Stored names** (category/account icons such as `shopping-cart`) are saved in user data. Never rename or remove one; re-point it instead. `resolveIcon()` / `resolveAccountTypeIcon()` in `src/utils/icons.ts` turn a stored string into a name.
- **Another family:** add it to `ICON_FAMILIES` as a (partial) name → glyph map; missing names fall back to Hugeicons.

## 3. Components

All components are exported from `@/src/components/ui`.

### Foundations
| Component | Use | Replaces |
|---|---|---|
| `Screen` | Scaffold: safe area, background, header, padded scroll, tab-bar clearance, footer and overlays slots. Start every screen here. | Hand-rolled `SafeAreaView + PageBackground + ScrollView` |
| `Text` | All text. `variant` + `tone`. | RN `Text` + manual fontFamily/fontSize |
| `Header` | Screen title, back button, right action. | — |
| `SectionHeader` | Section title with an optional quiet ink link ("See all") or muted note. No filled pill: a screen has several. | — |
| `Divider` | Hairline, optional `inset`. | `RowSeparator` copies |

### Actions
| Component | Use |
|---|---|
| `Button` | `primary` (one per screen) · `tonal` · `secondary` · `outline` · `ghost` · `danger` · `success`. Sizes `sm/md/lg`, `fullWidth`, `icon` + `iconPosition`, `isLoading`. |
| `IconButton` | Icon-only. `surface · ghost · tonal · filled · danger`. `accessibilityLabel` required. |
| `BentoPressable` | Press primitive for custom tappables: a slight shrink (or a fade with `scaleOnPress={false}`), the same on every platform. No ripple, no ink overlay. Never `TouchableOpacity`. |

### Inputs & selection
| Component | Use |
|---|---|
| `Input` | Text field with `label`, `helperText`, `error`, `leadingIcon`, `trailing`. `filled` on page, `default` in a card. |
| `SegmentedControl` | 2–4 exclusive options (type, period, theme). Animated. |
| `Chip` | Filters, multi-select tags, horizontal scroll. Pass `on="surface"` inside sheets and cards so resting chips stay visible. |
| `Switch` | Instant on/off (with haptic). In lists use `ListItem switchValue`. |
| Pickers | `CurrencyPickerBottomSheet`, `ColorPickerBottomSheet`, `ColorPickerRow`, `IconPickerBottomSheet`, `CalculatorBottomSheet` from `@/src/components/pickers`. |

### Display
| Component | Use | Replaces |
|---|---|---|
| `Card` | `surface` · `inset` · `outlined`, optional `onPress`. | Ad-hoc `View` cards |
| `HeroSurface` | Ink card for a screen's headline figure (Home balance, Transactions net). Content uses `onInk`, `onInkMuted`, `onInkAccent`; currency switching is one chip (`CurrencySwitcher`) that opens a sheet. | Lime-filled hero cards, rows of currency tabs |
| `ListGroup` + `ListItem` | Settings-style lists: nav rows (`onPress` → chevron), toggles (`switchValue`), single choice (`selected`), info (`value`), `destructive`. | `NavRow`, `SwitchRow`, `InfoRow` in Settings, Developer, Search, TransactionDetail |
| `MoneyText` | Every amount. `type` CR/DR adds sign + colour. `compact` for tiles. | — |
| `StatTile` | One KPI with label, amount/value, optional `caption` and trend. Lay out in rows of two. | KPI blocks in Analytics/Dashboard |
| `StatColumns` | Secondary figures under a card's headline number, split by hairlines (income · expense, principal · repaid). Optional delta, press, or custom `content` such as a Pro lock. | Hand-built stat rows in summary cards |
| `Badge` | Status labels, counts. | `LoanStatusBadge` internals |
| `TrendBadge` | ▲/▼ % vs previous period. | `DeltaBadge` in Analytics |
| `IconAvatar` / `PersonAvatar` | Leading visuals for categories, accounts and people. | — |
| `ProgressBar` | Determinate progress, optional `color`. | — |

### Feedback
| Component | Use | Replaces |
|---|---|---|
| `Banner` | Inline persistent message: `info · success · warning · danger`, optional action/dismiss. | Custom notice cards |
| `EmptyState` | `block` (whole list) or `inline` (one section). Always explain + offer next step. | `EmptyState` in Analytics, per-screen empties |
| `Skeleton` / `SkeletonRow` | Loading placeholders matching real layout. | Bare `ActivityIndicator` in lists |

### Overlays
| Component | Use |
|---|---|
| `BentoBottomSheet` | Base sheet: choose, compose, filter. |
| `OptionsBottomSheet` | Action menu / single choice from bottom. |
| `ConfirmDialog` | Destructive or irreversible. Title is the question, confirm label repeats the verb. |
| `AlertDialog` | Result of an action (success/error). |
| `OptionsDialog` | 2–5 choices, lighter than a sheet. |
| `TextInputDialog` | Rename a single value. |

**Sheet or dialog?** Choosing or composing → sheet. Confirming or informing → dialog.

---

## 4. Patterns

- **Screen rhythm:** Header → KPIs (`StatTile` ×2) → `SectionHeader` → grouped content → empty/loading states. Sections are separated by `layout.sectionGap`.
- **Lists:** group rows in `ListGroup` (settings, details) or rounded `TransactionRow` stacks (`isFirst`/`isLast`). Don't separate rows with cards.
- **Forms:** labelled `Input`s in a column with a 16 gap. Put a single `Button fullWidth size="lg"` in `Screen footer`. Validate on blur/submit. Error text says how to fix it.
- **Tab bar:** the original split islands — dark island (Home · Accounts), lime + tile, dark island (Analytics · Settings). All three are 60 tall on one centre line; active tab = lime tile; tabs expose their label to screen readers. Tab screens pad with `tabBarClearance()`.
- **Summary cards:** one shape everywhere a screen leads with a number (month pulse, period summary, account, loan): `surface` card, `label` caption, the headline `MoneyText`, then `StatColumns`. Identity (avatar, name, `Badge`s) goes on the first row when the card is about one thing.
- **Add actions:** list screens reached from navigation use a `Fab`. Tab screens never do — the tab bar's centre + adds (a transaction, or an account on the Accounts tab); don't repeat it in the header.
- **Pro features:** gate with `<ProGate feature>` (a section) or `useProAccess().requirePro(feature)` (an action). A screen with several locked sections shows one `ProPreviewCard` instead of a lock card per section. Every id comes from `src/features/premium/pro-features.ts`.
- **Destructive actions:** use a `danger` button or a `destructive` ListItem, always behind a `ConfirmDialog`, and in its own group at the bottom.
- **Copy:** sentence case, verbs on buttons ("Add account"), no trailing periods in titles.

---

## 5. Contributing to the system

1. Check the Design Gallery. Extend an existing component (new prop or variant) before creating a new one.
2. Build it in `src/components/ui/`: tokens only, a typed `<Name>Props`, accessibility props, and no feature imports.
3. Export it from `src/components/ui/index.ts`.
4. Add a specimen to the right section in `src/features/design-gallery/sections/` covering every variant, size and state, plus 2–3 usage guidelines.
5. Check it in light **and** dark before merging.

---

## 6. Migration plan — refactoring screens onto the system

Work one screen per PR. For each screen:

- [ ] Wrap in `Screen` (drop the manual SafeAreaView/PageBackground/ScrollView padding).
- [ ] Replace local `NavRow`/`SwitchRow`/`InfoRow`/`RowSeparator` with `ListGroup` + `ListItem`.
- [ ] Replace RN `Text` + manual font styles with `<Text variant tone>`.
- [ ] Replace local empty/loading UIs with `EmptyState` / `Skeleton`.
- [ ] Replace hex literals and raw numbers with tokens (`alpha`, `spacing`, `radius`).
- [ ] Verify in the gallery's theme toggle and on a small device (iPhone SE / 360dp).

Suggested order (highest reuse first): Settings → Developer → Search → Transaction detail → Analytics → Accounts/Persons/Loans detail → forms → Dashboard → Onboarding.
