import * as Localization from 'expo-localization';
import i18n, { getIntlLocale } from '@/src/i18n';

/**
 * Normalizes and parses a string amount into a finite number.
 * Defaults to 0 if the input is blank or invalid.
 */
export const parseAmount = (value: string | undefined | null): number => {
  if (!value || !value.trim()) return 0;
  
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  
  return Number.isFinite(parsed) ? parsed : 0;
};

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

  if (!tier) return parts.map((part) => part.value).join('');

  const NUMERIC = new Set(['integer', 'group', 'decimal', 'fraction']);
  let lastDigit = -1;
  parts.forEach((part, i) => {
    if (NUMERIC.has(part.type)) lastDigit = i;
  });

  return parts
    .map((part, i) => (i === lastDigit ? `${part.value}${tier.suffix}` : part.value))
    .join('');
};

/**
 * Formats a numeric amount into a currency string using the Intl library.
 * If no currency code is provided, it formats the number as a localized decimal.
 */
export const formatCurrency = (amount: number, currencyCode?: string, compact?: boolean): string => {
  const deviceLocale = Localization.getLocales()?.[0]?.languageTag ?? 'en-US';
  const locale = getIntlLocale(i18n.resolvedLanguage ?? i18n.language, deviceLocale);

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
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
  }
};
