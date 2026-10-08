import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/data/query-keys';
import { markLoggedToday } from '@/src/services/reminders/reminder-sync';
import { afterLedgerWrite } from '@/src/lib/after-ledger-write';
import * as api from '@/data/repositories/transactions';

export const useTransactions = (limit: number = 20, filters: api.TransactionFilters = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.transactions.lists(), 'limited', limit, filters],
    queryFn: () => api.getTransactions(limit, filters),
  });
};

export const useInfiniteTransactions = (filters: api.TransactionFilters = {}) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.transactions.list(filters),
    queryFn: ({ pageParam }) => api.getTransactionsPaged(pageParam, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === api.PAGE_SIZE ? allPages.length : undefined,
  });
};

export const useTransactionsCount = (filters: api.TransactionFilters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.transactions.count(filters),
    queryFn: () => api.getTransactionsCount(filters),
  });
};

export const useTransactionTotals = (filters: api.TransactionFilters = {}, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.transactions.totals(filters),
    queryFn: () => api.getTransactionTotals(filters),
    enabled,
    staleTime: 30_000,
  });
};

export const useTransactionById = (id?: number | null) => {
  return useQuery({
    queryKey: id != null ? QUERY_KEYS.transactions.detail(id) : [...QUERY_KEYS.transactions.details(), 'disabled'],
    queryFn: () => api.getTransactionById(id as number),
    enabled: id != null,
  });
};

export const useTransactionDetail = (id?: number | null) => {
  return useQuery({
    queryKey: id != null ? [...QUERY_KEYS.transactions.detail(id), 'detail'] : [...QUERY_KEYS.transactions.details(), 'disabled'],
    queryFn: () => api.getTransactionDetailById(id as number),
    enabled: id != null,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: async () => {
      // Logged today, so today's reminder is no longer needed; the sync below drops it.
      await markLoggedToday();
      afterLedgerWrite(queryClient);
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdatePayment }) =>
      api.updateTransaction(id, data),
    onSuccess: (_, { id }) => afterLedgerWrite(queryClient),
  });
};
