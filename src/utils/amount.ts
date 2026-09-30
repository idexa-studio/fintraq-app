/**
 * Reads a typed amount. Accepts a comma as the decimal separator ("12,50") and ignores anything
 * that isn't a digit or separator (currency symbols, spaces). Returns null for empty or
 * unreadable input rather than NaN, so callers can't let NaN into a query or a balance.
 */
export function parseAmountInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.').replace(/[^0-9.]/g, '');
  if (normalized === '' || normalized === '.') return null;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}
