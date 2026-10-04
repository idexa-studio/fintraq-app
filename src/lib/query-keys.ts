import type { TransactionFilters } from '@/src/features/transactions/api/transactions';

const accounts = {
  all: ['accounts'] as const,
  lists: () => [...accounts.all, 'list'] as const,
  details: () => [...accounts.all, 'detail'] as const,
  detail: (id: number) => [...accounts.details(), id] as const,
};

const categories = {
  all: ['categories'] as const,
  lists: () => [...categories.all, 'list'] as const,
  details: () => [...categories.all, 'detail'] as const,
  detail: (id: number) => [...categories.details(), id] as const,
};

const transactions = {
  all: ['transactions'] as const,
  lists: () => [...transactions.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactions.lists(), { filters }] as const,
  details: () => [...transactions.all, 'detail'] as const,
  detail: (id: number) => [...transactions.details(), id] as const,
  count: (filters: TransactionFilters) => [...transactions.all, 'count', { filters }] as const,
  totals: (filters: TransactionFilters) => [...transactions.all, 'totals', { filters }] as const,
};

const persons = {
  all: ['persons'] as const,
  lists: () => [...persons.all, 'list'] as const,
  details: () => [...persons.all, 'detail'] as const,
  detail: (id: number) => [...persons.details(), id] as const,
  txByPerson: (id: number) => [...persons.all, 'transactions', id] as const,
};

const dashboard = {
  all: ['dashboard'] as const,
  month: (currency: string) => [...dashboard.all, 'month', currency] as const,
  lifetime: (currency: string) => [...dashboard.all, 'lifetime', currency] as const,
  dailySpend: (currency: string, since: string) => [...dashboard.all, 'daily-spend', currency, since] as const,
  topPersons: (currency: string) => [...dashboard.all, 'top-persons', currency] as const,
  insights: (currency: string) => [...dashboard.all, 'insights', currency] as const,
};

const reports = {
  all: ['reports'] as const,
  streak: () => [...reports.all, 'streak'] as const,
};

const search = {
  all: ['globalSearch'] as const,
  results: (query: string) => [...search.all, query] as const,
};

const analytics = {
  all: ['analytics'] as const,
  series: (currency: string, start: string, end: string, byMonth: boolean) => [...analytics.all, 'series', currency, start, end, byMonth] as const,
  categories: (currency: string, start: string, end: string) => [...analytics.all, 'categories', currency, start, end] as const,
  incomeCategories: (currency: string, start: string, end: string) => [...analytics.all, 'income-categories', currency, start, end] as const,
  dow: (currency: string, start: string, end: string) => [...analytics.all, 'dow', currency, start, end] as const,
  personBreakdown: (currency: string, start: string, end: string) => [...analytics.all, 'person-breakdown', currency, start, end] as const,
  previousPeriod: (currency: string, start: string, end: string) => [...analytics.all, 'prev-period', currency, start, end] as const,
  biggestExpense: (currency: string, start: string, end: string) => [...analytics.all, 'biggest-expense', currency, start, end] as const,
};

const loans = {
  all: ['loans'] as const,
  lists: () => [...loans.all, 'list'] as const,
  list: (filter: string) => [...loans.lists(), filter] as const,
  details: () => [...loans.all, 'detail'] as const,
  detail: (id: number) => [...loans.details(), id] as const,
  byPerson: (personId: number) => [...loans.all, 'person', personId] as const,
  summary: (currency: string) => [...loans.all, 'summary', currency] as const,
};

const backup = {
  all: ['backup'] as const,
  account: () => [...backup.all, 'account'] as const,
  latests: () => [...backup.all, 'latest'] as const,
  latest: (accountId: string) => [...backup.latests(), accountId] as const,
  ownership: (accountId: string, fileId: string) => [...backup.latest(accountId), 'ownership', fileId] as const,
  autoBackupSwitch: () => [...backup.all, 'auto-backup-switch'] as const,
};

export const QUERY_KEYS = { accounts, categories, transactions, persons, dashboard, reports, search, analytics, loans, backup } as const;

/**
 * Every query family read from the financial tables. Payments, accounts, categories, persons and
 * loans all feed each other's screens (a renamed account shows in Analytics, a repayment moves a
 * loan and a person's balance), so any write to them invalidates all of these — listing a subset
 * per mutation is how stale screens crept in. Only mounted queries refetch; the rest go stale.
 */
export const LEDGER_QUERY_ROOTS = [
  transactions.all,
  accounts.all,
  categories.all,
  persons.all,
  loans.all,
  dashboard.all,
  analytics.all,
  reports.all,
  search.all,
] as const;
