import { format, subDays, startOfMonth } from 'date-fns';

/**
 * getLocalISOString: Returns the date portion of the current local time (YYYY-MM-DD).
 * Standardized using date-fns format.
 */
export const getLocalISOString = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
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
