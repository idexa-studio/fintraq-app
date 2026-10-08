import { FREE_LIMITS } from '@/features/pro/pro-features';
import type { ProFeatureId, ProPillar } from '@/features/pro/pro-features';

/**
 * English copy for Pro. It becomes the `pro` namespace of the rebuilt i18n
 * setup; until that lands it is read directly (the gallery is English only).
 */
export const PRO_PILLAR_COPY: Record<ProPillar, { title: string; promise: string }> = {
  plan: { title: 'Plan', promise: 'Know what is coming before it arrives.' },
  understand: { title: 'Understand', promise: 'See why the numbers are what they are.' },
  find: { title: 'Find and share', promise: 'Get anything out, in a form others can use.' },
  protect: { title: 'Protect', promise: 'Stop worrying about losing it or running out of room.' },
};

export const PRO_FEATURE_COPY: Record<ProFeatureId, { title: string; description: string }> = {
  budgets: { title: 'Budgets', description: 'A monthly limit for any category, with a warning before you reach it.' },
  recurring: { title: 'Repeating items', description: 'Rent, salary and subscriptions add themselves, and you see the next 30 days.' },
  goals: { title: 'Goals', description: 'A target and a date, and what to set aside each month to get there.' },
  safeToSpend: { title: 'Safe to spend', description: 'One number for today, after bills, budgets and goals are covered.' },
  periods: { title: 'Any period, compared', description: '30 days, 90 days, a year or your own range, each against the one before.' },
  forecast: { title: 'Forecast', description: 'Where this month will end at the pace you are spending.' },
  categories: { title: 'Category breakdown', description: 'Every category’s share of what came in and what went out.' },
  rhythm: { title: 'Rhythm', description: 'Which days cost you most, across the week and the month.' },
  people: { title: 'People', description: 'Who you spend with, and how balances are spread.' },
  insights: { title: 'Insights', description: 'Patterns worth knowing, in plain words.' },
  netWorthTrend: { title: 'Net worth over time', description: 'What you have minus what you owe, month by month.' },
  search: { title: 'Search', description: 'Any transaction, account, person or category, across all your history.' },
  export: { title: 'Spreadsheet export', description: 'Transactions and loans as a CSV file to save or share.' },
  statement: { title: 'Monthly statement', description: 'The month on one page as a PDF, ready to send.' },
  backup: { title: 'Automatic cloud backup', description: 'Saved to your own Google Drive twice a day, restorable on any phone.' },
  unlimited: {
    title: 'No limits',
    description: `More than ${FREE_LIMITS.people} people, ${FREE_LIMITS.loans} loans, ${FREE_LIMITS.budgets} budget and ${FREE_LIMITS.recurring} repeating items.`,
  },
};
