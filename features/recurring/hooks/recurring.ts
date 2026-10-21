import { QUERY_KEYS } from '@/data/query-keys';
import * as api from '@/data/repositories/recurring';
import type { RecurringRule } from '@/data/repositories/recurring';
import { getTransactions } from '@/data/repositories/transactions';
import type { OccurrenceWork } from '@/features/recurring/recurring-view';
import { catchUpWork, occurrencePayment } from '@/features/recurring/recurring-view';
import { afterLedgerWrite } from '@/platform/notifications/after-ledger-write';
import { markLoggedToday } from '@/platform/notifications/reminder-sync';
import { resumedNextDue } from '@/shared/calc/recurrence';
import { getLocalISOString } from '@/shared/date/date';
import { LoggerService } from '@/shared/logging/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Today's date (YYYY-MM-DD), read again whenever the app comes back, so a new day is seen as one. */
export function useToday(): string {
  const [today, setToday] = useState(getLocalISOString);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') setToday(getLocalISOString()); });
    return () => listener.remove();
  }, []);
  return today;
}

export const useRecurringRules = () => useQuery({ queryKey: QUERY_KEYS.recurring.lists(), queryFn: api.getRecurringRules });

export const useRecurringRule = (id: number | null) =>
  useQuery({ queryKey: [...QUERY_KEYS.recurring.all, 'detail', id], queryFn: () => api.getRecurringRule(id!), enabled: id != null });

/** How many items there are, for the free plan's limit. */
export const useRecurringCount = () => useQuery({ queryKey: QUERY_KEYS.recurring.count(), queryFn: api.countRecurringRules });

/** The transactions an item has made, newest first, with one more than `limit` to tell whether there are more. */
export const useMadeBy = (id: number | null, limit: number) =>
  useQuery({
    queryKey: [...QUERY_KEYS.transactions.lists(), 'madeBy', id, limit],
    queryFn: () => getTransactions(limit + 1, { recurringRuleId: id! }),
    enabled: id != null,
  });

/** A transaction saved with Repeat set, and the item it starts. */
export const useCreateRepeating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRepeating,
    onSuccess: async () => {
      // Logged today, as for any transaction: today's reminder is no longer needed.
      await markLoggedToday();
      afterLedgerWrite(queryClient);
    },
  });
};

export const useUpdateRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.NewRecurringRule> }) => api.updateRecurringRule(id, data),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

/** Pauses an item, or resumes it from its next day after today: what fell while paused is let go. */
export const usePauseRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rule, paused }: { rule: RecurringRule; paused: boolean }) =>
      api.updateRecurringRule(rule.id, paused ? { paused: true } : { paused: false, nextDue: resumedNextDue(rule, getLocalISOString()) }),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.deleteRecurringRule, onSuccess: () => afterLedgerWrite(queryClient) });
};

/** Adds a waiting occurrence, with the amount changed if it was. */
export const useAddOccurrence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ work, amount }: { work: OccurrenceWork; amount?: number }) =>
      api.recordOccurrence({ ruleId: work.rule.id, date: work.day, payment: occurrencePayment(work.rule, work.day, amount), then: work.then }),
    onSuccess: async () => {
      await markLoggedToday();
      afterLedgerWrite(queryClient);
    },
  });
};

/** Lets a waiting occurrence pass without a transaction. */
export const useSkipOccurrence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (work: OccurrenceWork) => api.skipOccurrence(work.rule.id, work.then),
    onSuccess: () => afterLedgerWrite(queryClient),
  });
};

/**
 * Makes every occurrence of an item added by itself that fell since the app was last open, oldest
 * first. An item that cannot be recorded (its accounts no longer allow a transfer, say) is left
 * where it stands and the rest go on; the repository never makes the same day twice.
 */
async function catchUp(): Promise<number> {
  const work = catchUpWork(await api.getRecurringRules(), getLocalISOString());
  const failed = new Set<number>();
  let made = 0;
  for (const { rule, day, then } of work) {
    if (failed.has(rule.id)) continue;
    try {
      await api.recordOccurrence({ ruleId: rule.id, date: day, payment: occurrencePayment(rule, day), then });
      made += 1;
    } catch (e) {
      failed.add(rule.id);
      LoggerService.warn('RECURRING', `Could not make item ${rule.id} for ${day}`, e);
    }
  }
  return made;
}

let running: Promise<void> | null = null;

/** Catches up on opening the app and on every return to it. Mounted once, beside the app's screens. */
export function useRecurringCatchUp(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const run = () => {
      if (running) return;
      running = catchUp()
        .then((made) => { if (made > 0) afterLedgerWrite(queryClient); })
        .catch((e) => LoggerService.warn('RECURRING', 'Catch-up failed', e))
        .finally(() => { running = null; });
    };
    run();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') run(); });
    return () => listener.remove();
  }, [queryClient]);
}
