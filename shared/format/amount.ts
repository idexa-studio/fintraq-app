/**
 * Reads a typed amount. Either a dot or a comma can be the decimal separator ("12.50", "12,50"),
 * and anything that isn't a digit or separator (currency symbols, spaces) is ignored. Returns
 * null for empty or unreadable input rather than NaN, so callers can't let NaN into a query or a
 * balance.
 *
 * Grouped input is read as written, not truncated at the first separator: when both separators
 * appear the last one is the decimal point ("1,234.56" and "1.234,56" are both 1234.56), and one
 * that repeats is grouping ("1,234,567"). A single separator stays a decimal point, so "1,234" is
 * 1.234 — the only reading a decimal-comma keyboard can produce for it.
 */
export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  if (lastSeparator === -1) return toFinite(cleaned);

  const separator = cleaned[lastSeparator]!;
  const parts = cleaned.split(separator);
  const isGroupingOnly = parts.length > 2 && !/[.,]/.test(parts.join(''));
  if (isGroupingOnly) return toFinite(parts.join(''));

  const whole = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '');
  return toFinite(`${whole}.${cleaned.slice(lastSeparator + 1)}`);
}

function toFinite(digits: string): number | null {
  if (digits === '' || digits === '.') return null;
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) ? value : null;
}
