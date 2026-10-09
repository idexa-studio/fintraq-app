import { QUERY_KEYS } from '@/data/query-keys';
import * as api from '@/data/repositories/budgets';
import { budgetViews } from '@/features/budgets/budget-view';
import { afterLedgerWrite } from '@/platform/notifications/after-ledger-write';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

const DAY = 'yyyy-MM-dd';

/**
 * Every budget against the month in progress. Spending is counted to today, as on Home: a
 * transaction dated later this month has not happened yet.
 */
export const useBudgets = () => {
  const now = new Date();
  return useQuery({
    queryKey: QUERY_KEYS.budgets.views(format(now, 'yyyy-MM')),
    queryFn: async () => {
      const lastMonth = subMonths(now, 1);
      const [budgets, thisMonth, before] = await Promise.all([
        api.getBudgets(),
        api.getSpend(format(startOfMonth(now), DAY), format(now, DAY)),
        api.getSpend(format(startOfMonth(lastMonth), DAY), format(endOfMonth(lastMonth), DAY)),
      ]);
      return budgetViews(budgets, thisMonth, before);
    },
  });
};

export const useBudgetCount = () => useQuery({ queryKey: QUERY_KEYS.budgets.count(), queryFn: api.countBudgets });

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.createBudget, onSuccess: () => afterLedgerWrite(queryClient) });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Pick<api.NewBudget, 'monthlyLimit' | 'rollover'> }) => api.updateBudget(id, data),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.deleteBudget, onSuccess: () => afterLedgerWrite(queryClient) });
};
