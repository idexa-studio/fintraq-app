import type { ThemePalette } from './colors';
import { alpha } from './tokens';

/**
 * Colours for charts that show *how much* (bars by day, the spending heatmap). Size is not good
 * or bad, so these use a neutral ramp of the text colour rather than the expense red: a tab full
 * of red reads as an alarm. Red and green stay on the figures themselves, where they mean
 * money out and money in. The one accent, `active`, marks the bar or cell the user is looking at.
 */
export type MagnitudeRamp = {
  /** Empty: nothing recorded. */
  none: string;
  low: string;
  mid: string;
  high: string;
  /** The largest value in the set. */
  peak: string;
  /** The selected or highlighted mark. */
  active: string;
};

export function magnitudeRamp(colors: ThemePalette): MagnitudeRamp {
  return {
    none: colors.card,
    low: alpha(colors.text, 'soft'),
    mid: alpha(colors.text, 'medium'),
    high: alpha(colors.text, 'strong'),
    peak: colors.text,
    active: colors.primary,
  };
}
