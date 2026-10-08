/** Money as text: reading what was typed, and writing amounts in the app's language. */
import { appLocale } from '@/shared/i18n/locale';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { parseAmountInput } from '@/shared/format/amount';

/** A typed amount as a number, 0 when blank or unreadable. See parseAmountInput for the rules. */
export const parseAmount = (value: string | undefined | null): number => parseAmountInput(value ?? '') ?? 0;

/**
 * Intl decides the layout (where the sign, symbol, separators and spaces go for the app's
 * language); the symbol itself always comes from getCurrencySymbol. Left to Intl, the same rupee
 * reads ₹ in one language, "INR" in another, and "US$" or a bare code on Hermes' reduced Intl.
 */
const joinWithAppSymbol = (parts: Intl.NumberFormatPart[], currencyCode: string): string =>
  parts.map((part) => (part.type === 'currency' ? getCurrencySymbol(currencyCode) : part.value)).join('');

const COMPACT_TIERS: { limit: number; suffix: string }[] = [
  { limit: 1e12, suffix: 'T' },
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
  { limit: 1e3, suffix: 'K' },
];

/**
 * Hermes ships a reduced Intl build that silently ignores `notation: 'compact'`
 * while still honouring `maximumFractionDigits`, so every compact amount came
 * out as an ugly one-decimal full number (₹61,254.0 instead of ₹61.3K).
 *
 * Scale and suffix by hand so output is identical on every JS engine, and use
 * formatToParts so the suffix lands against the digits in both prefix (₹61.3K)
 * and suffix (61,3 K €) currency locales.
 */
const formatCompactCurrency = (amount: number, locale: string, currencyCode: string): string => {
  const abs = Math.abs(amount);
  const tier = COMPACT_TIERS.find((t) => abs >= t.limit);
  const scaled = tier ? amount / tier.limit : amount;

  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).formatToParts(scaled);

  if (!tier) return joinWithAppSymbol(parts, currencyCode);

  const NUMERIC = new Set(['integer', 'group', 'decimal', 'fraction']);
  let lastDigit = -1;
  parts.forEach((part, i) => {
    if (NUMERIC.has(part.type)) lastDigit = i;
  });

  return joinWithAppSymbol(
    parts.map((part, i) => (i === lastDigit ? { ...part, value: `${part.value}${tier.suffix}` } : part)),
    currencyCode,
  );
};

/**
 * An amount in the app's language. With a currency code it carries the app's symbol for that
 * currency; without one it is a plain two-decimal number. `compact` shortens it to K, M, B or T.
 */
export const formatCurrency = (amount: number, currencyCode?: string, compact?: boolean): string => {
  const locale = appLocale();

  if (!currencyCode) {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  try {
    if (compact) {
      return formatCompactCurrency(amount, locale, currencyCode.toUpperCase());
    }
    const code = currencyCode.toUpperCase();
    return joinWithAppSymbol(new Intl.NumberFormat(locale, { style: 'currency', currency: code }).formatToParts(amount), code);
  } catch {
    // A code Intl doesn't know: still the app's symbol, with plain two-decimal digits.
    return `${getCurrencySymbol(currencyCode)} ${amount.toFixed(2)}`;
  }
};
