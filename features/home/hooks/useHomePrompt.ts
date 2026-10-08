import { useBackupAccount } from '@/features/backup';
import { PROMPT_COOLDOWN_MS, chooseHomePrompt, isCoolingDown } from '@/features/home/getting-started';
import type { HomePrompt } from '@/features/home/getting-started';
import { usePro } from '@/features/pro';
import { useTransactionsCount } from '@/features/transactions';
import { IS_CLOUD_BACKUP_BUILT } from '@/platform/backup/cloud-store';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Where each prompt's dismissal is remembered: the shipped app's keys, so a dismissal carries over the update. */
const DISMISSED_KEY: Record<HomePrompt, StorageKeys> = { backup: StorageKeys.BACKUP_PROMPT_DISMISSED_AT, pro: StorageKeys.UPSELL_DISMISSED_AT };

/**
 * The one prompt Home may show: Pro for a free user, backup for a Pro user with no Drive
 * connected. It is a card on the page, not something laid over it, and once dismissed it stays
 * away for its cooldown (three days for Pro, two weeks for backup).
 */
export function useHomePrompt() {
  const { isPro, ready } = usePro();
  const { isConnected, isLoading } = useBackupAccount();
  const { data: transactionCount } = useTransactionsCount();
  const [prompt, setPrompt] = useState<HomePrompt | null>(null);

  const candidate = chooseHomePrompt({ resolved: ready && !isLoading, isPro, backupConnected: isConnected || !IS_CLOUD_BACKUP_BUILT, transactionCount: transactionCount ?? 0 });

  useEffect(() => {
    if (!candidate) {
      setPrompt(null);
      return;
    }
    let cancelled = false;
    void AsyncStorage.getItem(DISMISSED_KEY[candidate]).catch(() => null).then((dismissedAt) => {
      if (!cancelled && !isCoolingDown(dismissedAt, Date.now(), PROMPT_COOLDOWN_MS[candidate])) setPrompt(candidate);
    });
    return () => { cancelled = true; };
  }, [candidate]);

  const dismiss = () => {
    if (prompt) void AsyncStorage.setItem(DISMISSED_KEY[prompt], String(Date.now())).catch(() => {});
    setPrompt(null);
  };

  return { prompt, dismiss };
}
