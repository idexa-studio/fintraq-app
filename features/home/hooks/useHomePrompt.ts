import { useBackupAccount } from '@/features/backup';
import { BACKUP_PROMPT_COOLDOWN_MS, chooseHomePrompt, isCoolingDown } from '@/features/home/getting-started';
import type { HomePrompt } from '@/features/home/getting-started';
import { usePro } from '@/features/pro';
import { useTransactionsCount } from '@/features/transactions';
import { IS_CLOUD_BACKUP_BUILT } from '@/platform/backup/cloud-store';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * The one prompt Home may show: backup, for a Pro user with no Drive connected. It is a card on
 * the page, not something laid over it, and once dismissed it stays away for two weeks.
 */
export function useHomePrompt() {
  const { isPro, ready } = usePro();
  const { isConnected, isLoading } = useBackupAccount();
  const { data: transactionCount } = useTransactionsCount();
  const [prompt, setPrompt] = useState<HomePrompt | null>(null);

  const candidate = chooseHomePrompt({ resolved: IS_CLOUD_BACKUP_BUILT && ready && !isLoading, isPro, backupConnected: isConnected, transactionCount: transactionCount ?? 0 });

  useEffect(() => {
    if (!candidate) {
      setPrompt(null);
      return;
    }
    let cancelled = false;
    void AsyncStorage.getItem(StorageKeys.BACKUP_PROMPT_DISMISSED_AT).catch(() => null).then((dismissedAt) => {
      if (!cancelled && !isCoolingDown(dismissedAt, Date.now(), BACKUP_PROMPT_COOLDOWN_MS)) setPrompt(candidate);
    });
    return () => { cancelled = true; };
  }, [candidate]);

  const dismiss = () => {
    setPrompt(null);
    void AsyncStorage.setItem(StorageKeys.BACKUP_PROMPT_DISMISSED_AT, String(Date.now())).catch(() => {});
  };

  return { prompt, dismiss };
}
