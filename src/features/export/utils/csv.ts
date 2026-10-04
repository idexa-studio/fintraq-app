/**
 * Byte-order mark. Excel reads a CSV without it as the system code page, which turns every
 * non-ASCII name and note (বাজার, Café, ₹) into mojibake.
 */
export const CSV_BOM = '﻿';

const FORMULA_LEAD = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

/**
 * One CSV cell. Text that a spreadsheet would run as a formula (a note starting with `=`, `+`,
 * `-` or `@`) gets a leading apostrophe so it is shown, not executed; plain numbers are left
 * alone so amounts still sum. Then the usual quoting for commas, quotes and line breaks.
 */
export function escapeCsvField(field: string): string {
  const safe = FORMULA_LEAD.test(field) && !PLAIN_NUMBER.test(field) ? `'${field}` : field;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const toCsvRow = (fields: string[]): string => fields.map(escapeCsvField).join(',');
