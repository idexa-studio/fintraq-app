import { useAccounts } from '@/features/accounts';
import { useAutoBackupSetting } from '@/features/backup';
import { gettingStartedSteps, showsGettingStarted } from '@/features/home/getting-started';
import { usePro } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { useTransactionsCount } from '@/features/transactions';
import { IS_CLOUD_BACKUP_BUILT } from '@/platform/backup/cloud-store';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DISMISSED_KEY = ['getting-started', 'dismissed'] as const;

/** Home's first steps, read from the records. Hidden until everything it depends on has loaded. */
export function useGettingStarted() {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts();
  const { data: transactionCount } = useTransactionsCount();
  const { profile } = useSettings();
  const { isPro, ready } = usePro();
  const { autoBackupEnabled } = useAutoBackupSetting();
  // Treated as hidden until read, so it never flashes at someone who closed it.
  const { data: dismissed = true } = useQuery({
    queryKey: DISMISSED_KEY,
    queryFn: async () => (await AsyncStorage.getItem(StorageKeys.GETTING_STARTED_DISMISSED).catch(() => null)) === '1',
    staleTime: Infinity,
  });

  const steps = gettingStartedSteps({
    accountCount: accounts?.length ?? 0,
    transactionCount: transactionCount ?? 0,
    reminderOn: profile.reminderEnabled,
    // The cloud step is only given where cloud backup exists: not yet on iPhone.
    isPro: isPro && IS_CLOUD_BACKUP_BUILT,
    autoBackupOn: autoBackupEnabled,
  });
  const loaded = accounts !== undefined && transactionCount !== undefined && ready;

  const dismiss = async () => {
    queryClient.setQueryData(DISMISSED_KEY, true);
    await AsyncStorage.setItem(StorageKeys.GETTING_STARTED_DISMISSED, '1').catch(() => {});
  };

  return { steps, visible: loaded && showsGettingStarted(steps, transactionCount ?? 0, dismissed), dismiss };
}
