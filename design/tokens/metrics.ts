/**
 * Spacing, shape, control sizes and motion. Measured from the reference
 * (720px wide = 390pt) and checked against the rendered components on a phone:
 * page margin 16, button 48 (reference 47.7), field 44 (43.3), chip 32 by at
 * least 88 with 12 between (31.4, 85.6, 13), tab bar 49, outlines 1 and 2.
 */

/** 4pt grid. */
export const SPACE = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpaceToken = keyof typeof SPACE;

/**
 * Soft rectangles throughout; only badges and switches are pills and only
 * radios and icon circles are round. Each value is a circle fitted to the
 * reference's corners (measured radius in brackets).
 */
export const RADIUS = {
  none: 0,
  /** Dialogs (5.3), step rows (5.7). */
  sm: 6,
  /** Illustration tiles (8.5). */
  tile: 8,
  /** Chips (9.0). */
  chip: 9,
  /** Cards (9.3 to 10.2), buttons (10.0), sheets. */
  md: 10,
  /** Text fields (11.1). */
  field: 11,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof RADIUS;

export const BORDER = {
  /** Field, chip and secondary-button outlines; dividers. */
  thin: 1,
  /** The current or selected item. */
  thick: 2,
} as const;

export const SIZE = {
  /** Page margin, and the padding inside a card. */
  screenPadding: 16,
  cardPadding: 16,
  /** Between a section title and its content (reference: 21pt from the title's baseline to the card). */
  titleGap: 16,
  /** Between sections. */
  sectionGap: 32,
  /** Between sibling cards. */
  cardGap: 16,
  button: 48,
  buttonSmall: 36,
  field: 44,
  chip: 32,
  /** A single-line row inside a card. */
  row: 56,
  /** The action strip at the foot of a card. */
  cardAction: 52,
  tabBar: 49,
  /** Height of the mark above the active tab. */
  tabMark: 2,
  /** A screen's header (reference: 44). */
  header: 44,
  /** The header of a sheet or task, with its bold title (reference: 56). */
  taskHeader: 56,
  icon: 24,
  iconSmall: 20,
  iconLarge: 28,
  iconCircle: 40,
  illustrationTile: 64,
  /** The small outlined mark at the corner of a card (reference: 32). */
  markTile: 32,
  radio: 24,
  checkbox: 24,
  switchWidth: 50,
  switchHeight: 30,
  switchThumb: 24,
  badge: 22,
  spinner: 64,
  minTouch: 44,
  /** Dialogs sit this far from the screen edge. */
  dialogMargin: 32,
} as const;

/** Durations in ms. */
export const MOTION = {
  fast: 120,
  normal: 200,
  slow: 320,
  /** A screen's sections arriving: how long each takes, and how far apart they start. */
  enter: 280,
  stagger: 45,
  /** One turn of the spinner. */
  spin: 1100,
} as const;

/** Opacity of a control while it is pressed. */
export const PRESSED_OPACITY = 0.6;
