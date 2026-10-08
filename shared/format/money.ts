/** Money as text: reading what was typed, and writing amounts in the app's language. */
import { appLocale } from '@/shared/i18n/locale';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { parseAmountInput } from '@/shared/format/amount';

/** A typed amount as a number, 0 when blank or unreadable. See parseAmountInput for the rules. */
export const parseAmount = (value: string | undefined | null): number => parseAmountInput(value ?? '') ?? 0;

/** A currency sign (Unicode category Sc), as opposed to a symbol made of letters such as "kr" or "CHF". */
const CURRENCY_SIGN = /[$¢£¤¥֏؋৲৳૱௹฿៛\u20A0-\u20CF꠸﷼＄￠￡￥￦]/;
const LEADING_SPACE = /^[\s\u00A0\u202F]+/;
const TRAILING_SPACE = /[\s\u00A0\u202F]+$/;

/**
 * Intl decides the layout (where the sign, the separators and the currency go for the app's
 * language); the symbol itself always comes from getCurrencySymbol. Left to Intl, the same rupee
 * reads ₹ in one language, "INR" in another, and "US$" or a bare code on Hermes' reduced Intl.
 *
 * Intl is asked to write the ISO code, which is then found and replaced. `formatToParts` would
 * name the currency part directly, but Hermes on iOS has no `formatToParts` for numbers: with it,
 * every amount on an iPhone fell through to the plain fallback ("₹ 35939.88").
 *
 * A code is always set off from the digits by a space. A sign stands against them (₹1,234.50), and
 * a symbol made of letters keeps the space (CHF 1,234.50): the rule Intl itself follows. `suffix`
 * (K, M, B, T) is put against the last digit, whichever side the currency is on.
 */
const withAppSymbol = (formatted: string, currencyCode: string, suffix = ''): string => {
  const at = formatted.indexOf(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);
  if (at < 0) return `${formatted}${suffix}`;
  const before = formatted.slice(0, at);
  const after = formatted.slice(at + currencyCode.length);

  if (after.trim() !== '') {
    // The currency leads: "-INR 1,234.50".
    const gap = LEADING_SPACE.exec(after)?.[0] ?? '';
    const kept = CURRENCY_SIGN.test(symbol.slice(-1)) ? '' : gap;
    return `${before}${symbol}${kept}${after.slice(gap.length)}${suffix}`;
  }
  // The currency trails: "1.234,50 EUR". The space before it belongs to the language.
  const gap = TRAILING_SPACE.exec(before)?.[0] ?? '';
  return `${before.slice(0, before.length - gap.length)}${suffix}${gap}${symbol}${after}`;
};

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
 * Scale and suffix by hand so output is identical on every JS engine: the suffix
 * lands against the digits in both prefix (₹61.3K) and suffix (61,3K €) languages.
 */
const formatCompactCurrency = (amount: number, locale: string, currencyCode: string): string => {
  const abs = Math.abs(amount);
  const tier = COMPACT_TIERS.find((t) => abs >= t.limit);
  const scaled = tier ? amount / tier.limit : amount;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(scaled);

  return withAppSymbol(formatted, currencyCode, tier?.suffix);
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
    return withAppSymbol(new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'code' }).format(amount), code);
  } catch {
    // A code Intl doesn't know: still the app's symbol, with plain two-decimal digits.
    return `${getCurrencySymbol(currencyCode)} ${amount.toFixed(2)}`;
  }
};
