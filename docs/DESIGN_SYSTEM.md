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
| `brandDeep`, `brand`, `brandBright` | Brand moments (the wave card) |
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
- **Controls:** button 48, field 44, chip 32, row at least 56, tab bar 56,
  header 44 (56 for a task). These are minimum heights: controls grow with
  their text. Every touch target is at least 44pt.
- **Motion:** 120, 200 and 320 ms. A screen's sections arrive one after
  another, rising as they fade in; a press dims and eases back; the segmented
  control's block slides; progress bars grow to their value; pushed screens
  slide in from the side and tasks rise from the bottom. Under Reduce Motion everything is still
  except the spinner and a progress bar of unknown length, which keep moving
  so the app never looks hung.

## The app icon and splash (`assets/brand/`, `assets/images/`)

The mark is a stack of coins: a white coin resting on a black one, both seen
from the edge, and a green one falling onto them (owner, 2026-10-08: "a stack
of coins, and the top is just adding into the stack"). It is drawn the way the
screens are: flat, on the grey page, every outline one black line, the falling
coin in the pastel green of the icon circles. No gradient, no glow.

| Where | Ground | Mark |
| --- | --- | --- |
| App icon, adaptive icon | `background` (#F1F1F1) | Black line, white coin, pastel green coin |
| Splash and launch screen | `brand` green, both schemes | The same |
| iOS dark icon | The system's | The same with the line in white and the white coin in the dark `surface` |
| Themed icon, notification icon | The system's | One colour: the white coin is an outline |
| Launcher shortcuts | Pastel green | A black glyph from `design/icons/`, as an icon circle |

**The launch screen** follows the reference's: three greens in waves, the mark
in the middle, the name under it in black. The greens are the reference's; the
wave shapes are Fintraq's own, the wave card's two waves set for a tall screen
(owner, 2026-10-08: it must not be the bank's picture). A phone's own splash can hold only a
colour and an image, so it shows the brand green and the mark; as soon as the
app can draw, `LaunchScreen` (`features/shell/`) takes over with `LaunchArt`
(`WaveField`, `BrandMark`, the name), the mark in the same place at the same
size, and fades when the app behind it is ready. The mark's size there is tied
to `imageWidth` in `app.json` and the splash scale in the script; change the
three together.

Sizes follow each platform's rule, and are written with their reasons in the
script: the mark is 54% of the icon a launcher shows and inside the adaptive
icon's safe circle; the splash mark stays inside Android's splash circle; the
notification icon keeps 2dp of padding; a shortcut glyph is 24dp in 48dp.

Every file is drawn by `scripts/generate-brand.js` from one description of the
mark; change it there and run `npm run brand:generate` (its header says how).
Never edit the PNGs by hand. In the app the mark is `BrandMark`, drawn from the
same numbers; the gallery's hidden `brand` section shows it at launcher size
and shows the launch screen, to look at on a phone before building.

## Icons (`design/icons/`)

Phosphor, outline by default and solid for the active tab or a selected
item: `<Icon name="wallet" />`, `<Icon name="house" filled />`.

The reference draws its icons in two line weights, measured from its screens,
and so do we:

| Weight | Line at 24pt | Used for |
| --- | --- | --- |
| `regular` | 1.5pt | Every pictogram, chevrons and arrows, plus and minus |
| `bold` | 2.25pt | Bare marks that are controls or verdicts: close, tick, more |
| `light` | 1.3pt at 28pt | The same pictograms drawn at 27pt and over, chosen by `Icon`, never at a call site |

The weight belongs to the icon, not to where it is used: it is written in
`icon-map.json` (`"x": "x@bold"`) and `Icon` has no weight prop, so one icon
can never appear in two weights. A bold mark has no solid drawing.

- To add one, add a line to `icon-map.json` (our name to the Phosphor name)
  and run `npm run icons:generate`. Only mapped icons ship.
- Icons that point along the reading direction flip in right-to-left layouts.
- Icon names saved on categories and accounts are a contract: a test fails if
  any of them stops drawing.

There are no illustrations. A message or empty state carries an `Emblem`: one
line icon, in black, in a pastel circle (`color`, lilac unless the subject
has a colour of its own elsewhere). The pale green it first had was
rejected as washed out (owner, 2026-10-08).

## Components (`design/components/`)

One per file. The gallery shows each with its states and a line on when to
use it.

| Group | Components |
| --- | --- |
| Structure | `Screen`, `Header`, `TabBar`, `Section`, `Card`, `CardActions`, `Divider` |
| Text and figures | `Text`, `Money`, `Stat`, `Badge` |
| Actions | `Button`, `IconButton`, `TabStrip`, `Chip`, `ChipRow`, `Touchable`, `SlideToConfirm` |
| Input | `TextField`, `Select`, `Keypad`, `Radio`, `Checkbox`, `Switch`, `Calendar`, `TimePicker`, `OptionList`, `SwatchGrid`, `IconGrid`, `MarkGrid`, `AmountField` |
| Lists | `ListRow`, `ListGroup`, `DetailRow`, `DayHeader`, `SwipeRow`, `StepRow`, `Checklist`, `Timeline` |
| Marks | `Icon`, `IconCircle`, `MarkTile`, `IllustrationTile`, `Emblem`, `CheckMark` |
| Charts | `BarChart`, `LineChart`, `Ring` (with an optional `marker`: an ink mark at a point along it, e.g. today in the month), `Gauge`, `HeatGrid`, `SplitBar`, `RankBars`, `PairedBars`, `PaceBar`, `Delta`, `ProgressBar` (green with room, amber `near`, red `over`), `DayStreak`, `PeriodStepper` |
| Messages | `Message`, `EmptyState`, `Notice`, `Highlight`, `Tip`, `Toast` (`ToastProvider`, `useToast`), `LockedCard` |
| Overlays and waiting | `Dialog`, `LoadingDialog`, `Sheet`, `Spinner`, `Skeleton`, `ProgressRow` |
| Moments | `WaveCard`, `Receipt`, `FeatureTile` |
| Structure | `Section`, `SummaryCard`, `FormBlock`, `FieldStack` |

## Patterns

- **A screen** is `Screen` with a `Header`, content in `Section`s, and its
  buttons in the `footer`. Never hand-build the scaffold.
- **An overview opens with a `SummaryCard`**: its title with the currency
  menu opposite, the figure or bar, and optionally two actions (Home,
  Accounts, People, Plan). Never rebuilt per screen.
- **A form is a run of `FormBlock`s**: the bold label ending in a colon over
  the card that answers it, with stacked fields in a `FieldStack`. The label
  gap and the field gap are tokens (`size.labelGap`, `size.fieldGap`).
- **A record gets a coloured circle, a setting gets a plain icon.** A row
  that stands for something recorded (transaction, account, person, loan)
  leads with an `IconCircle`; a row that changes a setting or starts an
  action leads with a line icon.
- **Sizes have names.** A size used in two places is a token
  (`iconCircleSmall`, `iconCircleLarge`, `ringSmall`, `ring`), not a sum of
  two others at the call site.
- **Consistency is measured.** `scripts/measure-screen.py` reads a
  screenshot and reports each card's margins and the gaps around each
  section title; the audit of 2026-10-08 found every main screen on 16pt
  margins, the first card at the same height, and the same title gaps.
- **Text is drawn as it is measured.** On Android 15 and later the system
  lays text out by the ink of its letters while React Native measures by
  their advance; in Devanagari a tight bold label lost its last word.
  `plugins/with-text-measured-as-drawn.js` turns the new behaviour off in the
  app theme. It is native: it needs a new build, and was confirmed on the
  owner's phone in Hindi on 2026-10-08.
- **A task clears the keyboard it inherits.** `Screen sheet` dismisses a
  keyboard left open by the screen beneath, so it never sits over the task's
  buttons; a field that wants the keyboard asks with `focusOnArrival`.
- **A length limit counts down inside the field.** `TextField` with
  `maxLength` and `remaining` shows the number left for the last 20
  characters, at the field's right edge, where it stays above the keyboard.
- **A note that may be put away** is a `Notice` with `onDismiss`: a cross in
  its corner. Home's prompts are these, on the page, never laid over it.
- **First steps are a journey**: `StepRow`s, done ones ticked, the next one
  outlined and tappable, later ones pale (Home's getting started).
- **The top of a tab** is the reference's header: the title small and
  centred, icon actions either side. Home's title is "Hi" and the first
  name, with search on the left and the profile icon on the right. A large
  left-aligned title and a greeting by time of day were tried and withdrawn
  (owner, 2026-10-08: "exact same as the aesthetic").
- **The tab bar** is the reference's: every item an icon over its label,
  a green mark the full width of the tab on the bar's top edge above the
  active one, whose icon is solid and label bold. Add sits in the middle as
  one more item (`action`: it opens the entry task and is never active). A
  green tile for Add and a half-width mark were tried and withdrawn. Icons
  are 30pt (`size.iconTab`); the bar is 56 tall.
- **Home's quick actions** are the reference's tiles: `FeatureTile` with
  its mark, a sentence, and the action in bold. The `compact` tile is for
  rows of settings shortcuts, not for Home.
- **Chips** have smooth ("squircle") corners, as the reference's do. They
  are drawn (`Squircle`), since a border radius only makes an arc; use it
  for any other shape that must match.
- **A message screen** (a picture, a headline, a sentence, buttons) is
  `<Screen centred>`: in the middle when it fits, scrolling when it does
  not. `scroll={false}` clips on a short phone and is only for content
  that manages its own height, such as a list.
- **The way in** is a welcome, then one form in the reference's form
  pattern: a bold label ending in a colon over each white card, a chooser
  row with a chevron, a choice and its fields together in one card. One
  field alone on a screen reads as bare; so did a step per question. A
  live preview card, a mark beside a field and shortcut chips were also
  tried and rejected (owner, 2026-10-08).
- **Settings** opens on the wave card (who you are and your plan: its one
  brand moment), then the things recorded against as tiles with their
  counts, then grouped rows. A choice of three (appearance) is a `Select`
  on its row, not a sheet.
- **The app lock** is chosen from marks (`MarkGrid`): no lock, fingerprint
  or face, a PIN. A PIN is six marks over a `Keypad` with no decimal key;
  the line for a wrong PIN is always there, so the pad never jumps.
- **A section** may carry one small `hint` under its title: what it shows
  or how to use it. Cutting every such line leaves a screen looking bare
  (owner, 2026-10-08); keep them to one line.
- **Icons keep one line weight at every size**, about 1.4pt, as measured
  in the reference's header, tab bar and rows. `Icon` draws from the
  regular set up to 26pt and from the light set from 27pt up, so a header
  icon (28pt box, about 22pt of ink) and a tab icon (30pt) are the
  reference's size without a heavier line.
- **Rows that are scanned** (transactions) set `oneLine`, so a long note
  cannot make one row taller than its neighbours.
- **A list** is `ListRow`s in a `ListGroup`. A tappable row ends in a chevron
  unless a value or a control already sits at its edge. A disabled row has no
  chevron and says why underneath.
- **A form field** has its label inside the outline, before the value. The
  first field of a task opens the keyboard with `focusOnArrival`, never
  `autoFocus`: focusing while the sheet is still rising scrolls the field out
  of view.
- **A search field** has no label: a magnifier, a placeholder naming what
  can be found, and `onClear` for the cross. A screen whose results appear
  under the keyboard sets `scrollHidesKeyboard` on its `Screen`.
- **A screen that is Pro as a whole** (search, export) shows `ProGateScreen`
  from `features/pro` to a free user, however they arrived, after waiting
  for `usePro().ready`.
- **A colour** is chosen from the eight in `OFFERED_COLORS`, shown as the
  pastels they are drawn in. The saved palette is wider; a colour saved
  before stays on offer for that item.
- **Buttons:** one primary per screen, full width, at the bottom. Secondary is
  the alternative; text is a quiet way out; link goes elsewhere; danger
  destroys and is always confirmed in a dialog whose first button repeats the
  verb.
- **Design the state, not the error.** A control that cannot work yet is
  disabled and the reason is visible. Work in progress keeps the button's
  colour and shows a spinner.
- **A task** (adding, editing) is a sheet: `<Screen sheet>` on a route
  presented with `SHEET_ROUTE`. On iOS the system presents it stacked over the
  screen behind, whose edge shows above it. On Android it is a sheet under a
  black top edge, with no imitation of the iOS stack (owner, 2026-10-09). Pickers opened from a task (`Sheet`) follow the same rule.
- **A sheet is white, with its content directly on it.** A `Sheet` is small
  and holds one thing (a list, a grid, a calendar), so that thing is not put
  in a card: a white card on a grey sheet is a box in a box (owner,
  2026-10-08). Full task screens (`<Screen sheet>`) keep the grey page and
  white cards.
- **A form is the thing being made, not a list of inputs.** The account form
  is the account's own card filled in where it stands: its mark beside the
  name, the balance as the large figure with the currency chip, its colours
  underneath. A choice among a few marked things is a `MarkGrid`, picked in
  one tap, not a field that opens a list. Optional details stay folded
  behind one row. Build the next forms (category, person, loan) the same way.
- **Show the thing, not a list about it.** Where a screen has one subject,
  it opens on a picture of that subject built from the system's own marks,
  and the picture carries the state. Backup is the phone and the Drive with
  the line between them: dotted with nothing there, solid once backed up,
  filling towards the Drive during a backup and back towards the phone
  during a restore (`BackupLink`). Export is a small ruled spreadsheet
  holding the first rows the file will have, which follows every choice
  made under it (`ExportPreview`). A stack of rows is what is left when no
  such picture exists (owner, 2026-10-08: "be more creative everywhere").
  Home does the same three times: accounts as a stack of cards like a
  wallet (each in its own colour with black text in both schemes, the ones
  behind showing the edge that names them), the month as a ring of spent
  and kept, people as faces in a row.
- **Adding a transaction** is the reference's form inside that sheet: kind
  as a `TabStrip` under the header, the amount as the one large thing
  (`AmountField`), then labelled cards ("From:", "Details:") and outlined
  fields with the label inside. No deck of step cards inside a form, no
  page-filling keypad, and no filled segmented bar: all three were tried and
  rejected.
- **Empty:** a whole empty screen gets `EmptyState` (emblem, bold title, a
  sentence, the first step). One empty section among others gets the
  `compact` version so the screen keeps its shape.
- **Loading:** `Skeleton` in the shape of what is coming. `Spinner` only for
  work that blocks.
- **Backup** has two parts on one screen: the file the user keeps
  themselves (free) above, Google Drive (Pro) below. A free user sees the
  Drive part as one `LockedCard`, never a locked screen.
- **Pro:** everything a plan adds to a screen is one `LockedCard`; a single
  Pro row inside a free list carries a badge. Never one lock per item.
- **Home's hero** is the reference's account card: a white card with the
  balance and two split actions; quick actions as compact `FeatureTile`s
  below. No
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
