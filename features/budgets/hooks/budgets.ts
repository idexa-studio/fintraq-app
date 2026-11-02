import { QUERY_KEYS } from '@/data/query-keys';
import * as api from '@/data/repositories/budgets';
import { budgetPeriod, budgetStartDayOf } from '@/features/budgets/budget-rules';
import { budgetViews } from '@/features/budgets/budget-view';
import { useSettings } from '@/features/settings';
import { afterLedgerWrite } from '@/platform/notifications/after-ledger-write';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const DAY = 'yyyy-MM-dd';

/** The day budgets start on, from settings, and the budget month in progress. */
export function useBudgetPeriod() {
  const { profile, updateProfile } = useSettings();
  const startDay = budgetStartDayOf(profile.budgetStartDay);
  return { startDay, period: budgetPeriod(new Date(), startDay), setStartDay: (day: number) => updateProfile({ budgetStartDay: budgetStartDayOf(day) }) };
}

/**
 * Every budget against its month in progress, which starts on the day set for budgets (the 1st
 * unless changed). Spending is counted to today, as on Home: a transaction dated later has not
 * happened yet.
 */
export const useBudgets = () => {
  const { period } = useBudgetPeriod();
  const today = format(new Date(), DAY);
  return useQuery({
    queryKey: QUERY_KEYS.budgets.views(period.start),
    queryFn: async () => {
      const [budgets, thisMonth, before] = await Promise.all([
        api.getBudgets(),
        api.getSpend(period.start, today),
        api.getSpend(period.previousStart, period.previousEnd),
      ]);
      return budgetViews(budgets, thisMonth, before);
    },
  });
};

/** The last budget month's spending, to choose a limit against. */
export const useLastMonthSpend = () => {
  const { period } = useBudgetPeriod();
  return useQuery({ queryKey: [...QUERY_KEYS.budgets.all, 'spend', period.previousStart], queryFn: () => api.getSpend(period.previousStart, period.previousEnd) });
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
