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
};

const dashboard = {
  all: ['dashboard'] as const,
  stats: (currency: string) => [...dashboard.all, 'stats', currency] as const,
  topCategories: (currency: string) => [...dashboard.all, 'top-categories', currency] as const,
  insights: (currency: string) => [...dashboard.all, 'insights', currency] as const,
};

const reports = {
  all: ['reports'] as const,
  weekly: (currency: string) => [...reports.all, 'weekly', currency] as const,
  monthly: (currency: string) => [...reports.all, 'monthly', currency] as const,
  streak: () => [...reports.all, 'streak'] as const,
};

const search = {
  all: ['globalSearch'] as const,
  results: (query: string) => [...search.all, query] as const,
};

export const QUERY_KEYS = { accounts, categories, transactions, dashboard, reports, search } as const;
