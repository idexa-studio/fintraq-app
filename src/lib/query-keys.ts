import type { TransactionFilters } from '../features/transactions/api/transactions';

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
  stats: (currency: string) => [...dashboard.all, 'stats', currency] as const,
  topCategories: (currency: string) => [...dashboard.all, 'top-categories', currency] as const,
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
  personBreakdown: (currency: string, days: number) => [...analytics.all, 'person-breakdown', currency, days] as const,
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

export const QUERY_KEYS = { accounts, categories, transactions, persons, dashboard, reports, search, analytics, loans } as const;
