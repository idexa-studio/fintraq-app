export const ANALYTICS_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '12M', days: 365 },
] as const;

export type RangeDays = (typeof ANALYTICS_RANGES)[number]['days'];

/** The only range available without Pro. */
export const FREE_RANGE_DAYS: RangeDays = 7;

export const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
