/**
 * Works out what a keypad expression such as "12.5+3×4" comes to. Times and
 * divide bind tighter than plus and minus, as on any calculator. Used by the
 * amount keypad, so a result is always a plain non-negative amount or nothing.
 */

export const OPERATORS = ['+', '−', '×', '÷'] as const;
export type Operator = (typeof OPERATORS)[number];

const isOperator = (ch: string): ch is Operator => (OPERATORS as readonly string[]).includes(ch);

/** True when the text contains a sum to work out, not just a number. */
export const isExpression = (text: string): boolean => [...text].some(isOperator);

/**
 * The value of the expression, or undefined when it is not finished or makes
 * no sense: empty, ending in an operator, dividing by zero, or negative.
 */
export function calculate(text: string): number | undefined {
  const tokens = text.match(/\d+\.?\d*|\.\d+|[+−×÷]/g);
  if (!tokens || tokens.join('') !== text) return undefined;
  if (tokens.length % 2 === 0) return undefined;

  // First pass folds × and ÷ into the terms; the second adds and subtracts them.
  const terms: number[] = [];
  const signs: Operator[] = [];
  let current = Number(tokens[0]);
  if (isOperator(tokens[0])) return undefined;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const next = tokens[i + 1];
    if (!isOperator(op) || isOperator(next)) return undefined;
    const value = Number(next);
    if (op === '×') current *= value;
    else if (op === '÷') {
      if (value === 0) return undefined;
      current /= value;
    } else {
      terms.push(current);
      signs.push(op);
      current = value;
    }
  }
  terms.push(current);

  let total = terms[0];
  signs.forEach((sign, i) => {
    total = sign === '+' ? total + terms[i + 1] : total - terms[i + 1];
  });
  if (!Number.isFinite(total) || total < 0) return undefined;
  // Money: two decimal places, without binary floating-point dust (0.1 + 0.2).
  return Math.round(total * 100) / 100;
}
