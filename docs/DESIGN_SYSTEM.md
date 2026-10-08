# Design system

How Fintraq looks and how its interface is built. The system lives in
`design/` and is shown, live, in the Design Gallery (`/design-gallery`). The
gallery is the reference; this page explains the rules behind it.

The previous system (`src/components/ui`, `src/theme`) is frozen: the shipped
screens still run on it until they are rebuilt, and nothing new uses it. Its
documentation is in this file's git history.

## The look in one paragraph

A light grey page carries white cards with soft corners and no shadows. Black
does the work: text, the one main button, outlines. A vivid green marks what
is new, current or switched on, and is never used for text. One humanist sans
is used throughout, bold for headings. One thing is asked at a time,
buttons fill the width, and the button that cannot be used yet is grey and
says why. Every value was measured from the owner's reference screens.

## Using it

```tsx
import { Button, Card, ListRow, Screen, Section, Text, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
```

- Import only from `@/design`. Never from a file inside it, and never from
  `@/src/components/ui`.
- Read tokens from `useTheme()`. Feature code contains no colour values, no
  font sizes, no radii and no shadows; `npm run lint:design` fails on them.
- Styles go in a `createStyles(theme)` function at the bottom of the file,
  read with `useStyles(createStyles)`.
- `design/` knows nothing about money, accounts or Pro. A component that needs
  to know what a loan is belongs in a feature.

## Tokens (`design/tokens/`)

### Colour (`colors.ts`)

Components use roles, never raw colours. Light values are sampled from the
reference; dark is derived from them and contrast-checked.

| Role | Used for |
| --- | --- |
| `background`, `surface`, `surfaceMuted` | Page; cards, sheets and fields; a resting or unavailable surface |
| `text`, `textMuted` | Primary content; descriptions and field labels |
| `border`, `divider` | Outlines of fields, chips and secondary buttons; hairlines between rows |
| `action`, `onAction` | The main button and selected chips, and what sits on them |
| `disabled`, `onDisabled` | A control that cannot be used yet |
| `accent`, `onAccent` | Badges, the active tab mark, a switch that is on. **Never text**: it fails contrast on white, so anything drawn in it on a light surface also carries an outline |
| `selected` | Outline of the current item, and green that is safe as text |
| `brandDeep`, `brand`, `brandBright`, `brandTint` | Brand moments (the wave card) and the pale green behind an emblem |
| `positive`, `danger`, `warning` | Money in; destructive actions and errors; things to check. Money out is plain `text` with a minus sign |
| `scrim` | Behind dialogs and sheets |

`PASTELS` (lilac, pink, orange, teal, green) fill icon circles; the glyph on
top is always black (`INK`).

### Type (`typography.ts`)

Proza Libre throughout: Bold for headings, actions and names, Regular for
running text, Medium for large figures. The reference's lettering is a
proprietary humanist sans in the Gill Sans tradition (it is not a serif);
Proza Libre was the closest of 40 open-licence families compared against the
reference's own words. A variant fixes
family, size, line height and tracking together; use `<Text variant>` and
never set a size by hand.

| Variant | For |
| --- | --- |
| `display` | The one headline of a full-screen message |
| `title` | Section, question, sheet and dialog titles |
| `action` | Button labels and card actions |
| `lead`, `leadStrong` | Intro copy, choice labels; the header title |
| `body`, `bodyStrong` | Running text; the name of the thing in a row |
| `callout`, `calloutStrong` | Descriptions and field labels; small links |
| `caption`, `captionStrong` | Chips and notes |
| `tab`, `tabActive`, `badge` | Tab labels; badge text |
| `amountHero`, `amountLarge`, `amount` | Figures. Use `<Money>`, which sets minor units smaller |

Three behaviours are built in and must not be worked around:

- **Text size setting.** `Text` scales size and line height together with the
  phone's setting, up to 1.4 times. Platform scaling is off because Android
  scales letters but not line heights, which clips text.
- **Other scripts.** For Hindi, Marathi, Bengali, Tamil, Telugu, Kannada and
  Japanese the whole ramp switches to the phone's own font with looser lines
  (`needsSystemFont(language)` chooses `script="system"` on the
  `ThemeProvider`). Headings stay bold.
- **Figures read left to right** in every language (`ltr()`, used by `Money`
  and row values), so a minus sign never jumps to the other end.

### Shape, space and size (`metrics.ts`)

- **Space:** a 4pt grid, `xxs` 2 to `xxxl` 48. Page margin and card padding
  are both 16; sections sit 32 apart, sibling cards 16.
- **Radius:** `sm` 6 (dialogs, step rows), `tile` 8, `chip` 9, `md` 10 (cards,
  buttons, sheets), `field` 11, `pill` (badges and switches only).
- **Borders:** 1 for outlines and hairlines, 2 for the current item.
- **Controls:** button 48, field 44, chip 32, row at least 56, tab bar 49,
  header 44 (56 for a task). These are minimum heights: controls grow with
  their text. Every touch target is at least 44pt.
- **Motion:** 120, 200 and 320 ms. A screen's sections arrive one after
  another, rising as they fade in; a press dims and eases back; the segmented
  control's block slides; progress bars grow to their value; pushed screens
  slide in from the side and tasks rise from the bottom. Under Reduce Motion everything is still
  except the spinner and a progress bar of unknown length, which keep moving
  so the app never looks hung.

## Icons (`design/icons/`)

Remix Icon, outline by default and solid for the active tab or a selected
item: `<Icon name="wallet" />`, `<Icon name="house" filled />`.

- To add one, add a line to `icon-map.json` (our name to the Remix name) and
  run `npm run icons:generate`. Only mapped icons ship.
- Six icons the set lacks are drawn by hand in `custom-glyphs.ts`.
- Icons that point along the reading direction flip in right-to-left layouts.
- Icon names saved on categories and accounts are a contract: a test fails if
  any of them stops drawing.

There are no illustrations. A message or empty state carries an `Emblem`: one
line icon in a pale green circle.

## Components (`design/components/`)

One per file. The gallery shows each with its states and a line on when to
use it.

| Group | Components |
| --- | --- |
| Structure | `Screen`, `Header`, `TabBar`, `Section`, `Card`, `CardActions`, `Divider` |
| Text and figures | `Text`, `Money`, `Stat`, `Badge` |
| Actions | `Button`, `IconButton`, `SegmentedControl`, `Chip`, `ChipRow`, `Touchable`, `SlideToConfirm` |
| Input | `TextField`, `Select`, `Keypad`, `Radio`, `Checkbox`, `Switch`, `Calendar`, `TimePicker`, `OptionList`, `SwatchGrid`, `IconGrid`, `CardStack` |
| Lists | `ListRow`, `ListGroup`, `DetailRow`, `DayHeader`, `SwipeRow`, `StepRow`, `Checklist`, `Timeline` |
| Marks | `Icon`, `IconCircle`, `MarkTile`, `IllustrationTile`, `Emblem`, `CheckMark` |
| Charts | `BarChart`, `LineChart`, `Ring`, `Gauge`, `HeatGrid`, `SplitBar`, `RankBars`, `PairedBars`, `PaceBar`, `Delta`, `ProgressBar`, `DayStreak`, `PeriodStepper` |
| Messages | `Message`, `EmptyState`, `Notice`, `Highlight`, `Tip`, `Toast` (`ToastProvider`, `useToast`), `LockedCard` |
| Overlays and waiting | `Dialog`, `LoadingDialog`, `Sheet`, `Spinner`, `Skeleton`, `ProgressRow` |
| Moments | `WaveCard`, `Receipt`, `FeatureTile` |

## Patterns

- **A screen** is `Screen` with a `Header`, content in `Section`s, and its
  buttons in the `footer`. Never hand-build the scaffold.
- **A list** is `ListRow`s in a `ListGroup`. A tappable row ends in a chevron
  unless a value or a control already sits at its edge.
- **A form field** has its label inside the outline, before the value.
- **Buttons:** one primary per screen, full width, at the bottom. Secondary is
  the alternative; text is a quiet way out; link goes elsewhere; danger
  destroys and is always confirmed in a dialog whose first button repeats the
  verb.
- **Design the state, not the error.** A control that cannot work yet is
  disabled and the reason is visible. Work in progress keeps the button's
  colour and shows a spinner.
- **A task** (adding, editing) is a sheet: `<Screen sheet>` on a route
  presented as a transparent modal. It rises over the screen it was started
  from and stops short of the top, with rounded corners.
- **Adding a transaction** is a single-page form in the reference's pattern:
  labelled cards ("From:", "Details:"), outlined fields with the label
  inside, the phone's own keyboard. No page-filling custom keypad; the
  `Keypad` is for the calculator sheet and the PIN. `CardStack` (one question
  per card) is for first-run setup and other guided, once-only flows.
- **Empty:** a whole empty screen gets `EmptyState` (emblem, bold title, a
  sentence, the first step). One empty section among others gets the
  `compact` version so the screen keeps its shape.
- **Loading:** `Skeleton` in the shape of what is coming. `Spinner` only for
  work that blocks.
- **Pro:** everything a plan adds to a screen is one `LockedCard`; a single
  Pro row inside a free list carries a badge. Never one lock per item.
- **Home's hero** is the reference's account card: a white card with the
  balance and two split actions, quick actions as `FeatureTile`s below. No
  round black action buttons.
- **A short choice** (currency, period) is a `Select`: a chip that opens a
  list under itself. Long lists go in a `Sheet` with an `OptionList`.
- **The wave card** is the one brand moment, for the single most important
  figure, at most once per screen.
- **Charts** always carry a sentence for screen readers saying what they show.

## Adding or changing a component

1. Check the gallery: an existing component with one more prop usually does.
2. Write it in `design/components/`, from tokens only, with a comment on each
   prop that is not obvious, an accessibility role and label, and no fixed
   height that text could outgrow.
3. Export it from `design/index.ts`.
4. Add a specimen to the fitting section in `features/gallery/sections/`,
   showing every state, with a line on when to use it.
5. Look at it on a phone in light and dark, at the largest text size, and
   with long text.
6. `npx tsc --noEmit`, `npx expo lint`, `npm run lint:design`, `npm test`.

## Checking by hand

```bash
adb shell settings put system font_scale 1.5          # largest text; restore with 1.0
adb shell settings put global debug.force_rtl 1       # right to left; restart the app; restore with 0
adb shell settings put global transition_animation_scale 0   # Reduce Motion; restore with 1.0
```

Changing the text size while the app is open restarts its screen, and a
development build then logs "configured linking in multiple places". That
message comes from the restart, not from a fault, and does not appear in
release builds.
