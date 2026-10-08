import { appLocale } from '@/shared/i18n/locale';
import { format, subDays, startOfMonth } from 'date-fns';

/**
 * getLocalISOString: Returns the date portion of the current local time (YYYY-MM-DD).
 * Standardized using date-fns format.
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * A stored "YYYY-MM-DD" as local midnight. `new Date('2026-10-05')` means UTC midnight, which is
 * the previous day west of UTC — so date-only strings are always read with this.
 */
export const parseDateKey = (value: string): Date => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

/**
 * getDaysAgoLocal: Returns the YYYY-MM-DD string for N days ago in local time.
 */
export const getDaysAgoLocal = (days: number): string => {
  return format(subDays(new Date(), days), 'yyyy-MM-dd');
};

/**
 * getStartOfMonthLocal: Returns the YYYY-MM-DD string for the first day of the current month.
 */
export const getStartOfMonthLocal = (): string => {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
};

/**
 * formatDisplayDate: Formats an ISO date string for UI display.
 * Example: "2024-04-13" -> "13 APR 2024"
 */
export const formatDisplayDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

/**
 * formatBackupTimestamp: Formats an ISO date string for cloud backup UI display.
 * Example: "2024-04-13T10:05:00Z" -> "Apr 13, 2024 • 10:05 AM"
 */
export const formatBackupTimestamp = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy • h:mm a');
  } catch {
    return dateStr;
  }
};

/** Formats a date in the app's language, e.g. `formatDate(d, { dateStyle: 'full' })`. */
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions): string => {
  try {
    return new Intl.DateTimeFormat(appLocale(), options).format(date);
  } catch {
    return date.toDateString();
  }
};
