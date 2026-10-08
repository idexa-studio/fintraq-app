import { OPERATORS, calculate } from '@/shared/format/calculate';

/** What the keypad can send. */
export type AmountKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'delete' | '+' | '−' | '×' | '÷';

/** Longest amount text the keypad will build. */
const MAX_LENGTH = 24;
/** Digits allowed before the decimal point in one number. */
const MAX_WHOLE_DIGITS = 12;

const isOperator = (ch: string) => (OPERATORS as readonly string[]).includes(ch);

/** The number being typed: everything after the last operator. */
const currentNumber = (text: string): string => {
  let i = text.length;
  while (i > 0 && !isOperator(text[i - 1])) i -= 1;
  return text.slice(i);
};

/**
 * The amount text after one key press. Keeps the text something that can
 * become a valid sum: one decimal point and two decimal places per number,
 * no leading or doubled operators, no runaway length.
 */
export function pressAmountKey(text: string, key: AmountKey): string {
  if (key === 'delete') return text.slice(0, -1);
  if (text.length >= MAX_LENGTH) return text;

  if (isOperator(key)) {
    if (text === '') return text;
    // A second operator replaces the first: the last one pressed is the one meant.
    return isOperator(text[text.length - 1]) ? text.slice(0, -1) + key : text.endsWith('.') ? text.slice(0, -1) + key : text + key;
  }

  const number = currentNumber(text);
  if (key === '.') {
    if (number.includes('.')) return text;
    return number === '' ? `${text}0.` : `${text}.`;
  }

  const [whole, decimals] = number.split('.');
  if (decimals !== undefined) return decimals.length >= 2 ? text : text + key;
  if (whole.length >= MAX_WHOLE_DIGITS) return text;
  // A leading zero is replaced rather than kept: "0" then "5" is "5".
  if (whole === '0') return text.slice(0, -1) + key;
  return text + key;
}

/** What the amount text comes to, or undefined while it is empty, unfinished or not a valid amount. */
export const amountValue = (text: string): number | undefined => (text === '' ? undefined : calculate(text));
