/** Colours as they are stored: a number in the database, a hex string everywhere else. */

/**
 * Converts a hex color string to a numeric value for database storage.
 */
export const toDbColor = (value: string): number => {
  return Number.parseInt(value.replace('#', ''), 16);
};

/**
 * Converts a numeric color (as stored in the DB) to a CSS hex string.
 * e.g. 11591744 → '#B0E000'
 */
export const colorNumberToHex = (value: number): string =>
  `#${value.toString(16).padStart(6, '0')}`;

export const withAlpha = (color: string, hexAlpha: string): string =>
  `${color}${hexAlpha}`;
