/**
 * How the app answers the width it is given. The three classes are the platforms' own (Android's
 * window size classes; an iPad upright is medium, on its side expanded), so the app changes shape
 * where the system's own apps do.
 */
export const BREAKPOINT = {
  /** A small tablet upright, or a phone unfolded. */
  medium: 600,
  /** A tablet on its side. */
  expanded: 840,
} as const;

export type WidthClass = 'compact' | 'medium' | 'expanded';

export const LAYOUT = {
  /** The widest a column of cards is drawn: past this a row's amount drifts away from its name. */
  column: 600,
  /** Two columns of cards with the gap between them. */
  wide: 1040,
  /** A task or a picker, drawn as a card in the middle of a wide screen. */
  task: 560,
  /** A dialog. */
  dialog: 400,
  /** The least a task card keeps clear above and below itself. */
  taskClearance: 32,
  /** The tallest a task card grows. */
  taskHeight: 760,
  /**
   * The least height a screen needs above the keyboard to keep its buttons pinned there. With
   * less (a small phone), the buttons step aside while the keyboard is up, so the field being
   * typed in is not squeezed out of sight; they are back the moment the keyboard closes.
   */
  roomForFooter: 400,
  /** The rail that holds the tabs on an expanded screen. */
  rail: 88,
  /** One tab on the rail. */
  railTab: 72,
} as const;

export function widthClassOf(width: number): WidthClass {
  if (width >= BREAKPOINT.expanded) return 'expanded';
  if (width >= BREAKPOINT.medium) return 'medium';
  return 'compact';
}
