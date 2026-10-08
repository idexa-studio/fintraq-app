import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useAutoBackupSetting } from '@/src/features/backup/hooks/useAutoBackupSetting';
import { useTransactionsCount } from '@/src/features/transactions/hooks/transactions';
import { useSettings } from '@/src/providers/SettingsProvider';

export type GettingStartedStepId = 'account' | 'transaction' | 'reminder' | 'secondAccount' | 'backup';
export type GettingStartedStep = { id: GettingStartedStepId; done: boolean };

const DISMISSED_KEY = ['getting-started', 'dismissed'] as const;
/** Past this many transactions the user is established; an app update must not greet them with a beginner checklist. */
const ESTABLISHED_TX_COUNT = 10;

/**
 * Home's first-run checklist. Every step is read from real data (accounts, transactions, settings),
 * so it ticks itself off as the user goes, whichever screen they did it from. Hidden once every
 * step is done, the user closes it, or they already have a history (existing users updating).
 */
export function useGettingStarted() {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts();
  const { data: txCount } = useTransactionsCount();
  const { profile } = useSettings();
  const { autoBackupEnabled } = useAutoBackupSetting();
  const { data: dismissed = true } = useQuery({
    queryKey: DISMISSED_KEY,
    queryFn: async () => (await AsyncStorage.getItem(StorageKeys.GETTING_STARTED_DISMISSED).catch(() => null)) === '1',
    staleTime: Infinity,
  });

  const steps = useMemo((): GettingStartedStep[] => {
    const accountCount = accounts?.length ?? 0;
    return [
      { id: 'account', done: accountCount > 0 },
      { id: 'transaction', done: (txCount ?? 0) > 0 },
      { id: 'reminder', done: profile.reminderEnabled },
      { id: 'secondAccount', done: accountCount > 1 },
      { id: 'backup', done: autoBackupEnabled },
    ];
  }, [accounts, txCount, profile.reminderEnabled, autoBackupEnabled]);

  const doneCount = steps.filter((s) => s.done).length;
  const loaded = accounts !== undefined && txCount !== undefined;

  const dismiss = useCallback(async () => {
    queryClient.setQueryData(DISMISSED_KEY, true);
    await AsyncStorage.setItem(StorageKeys.GETTING_STARTED_DISMISSED, '1').catch(() => {});
  }, [queryClient]);

  const established = (txCount ?? 0) >= ESTABLISHED_TX_COUNT;
  return { steps, doneCount, visible: loaded && !dismissed && !established && doneCount < steps.length, dismiss };
}
