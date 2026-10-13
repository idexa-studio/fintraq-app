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
 * The one prompt Home may show: Pro for a free user, as a sheet over the page; backup for a Pro
 * user with no Drive connected, as a card on it. Once closed, either stays away for two weeks.
 */
export function useHomePrompt() {
  const { isPro, ready } = usePro();
  const { isConnected, isLoading } = useBackupAccount();
  const { data: transactionCount } = useTransactionsCount();
  /** The prompt found to be past its cooldown; shown only while it is still the one to show. */
  const [allowed, setAllowed] = useState<HomePrompt | null>(null);

  const candidate = chooseHomePrompt({ resolved: ready && !isLoading, isPro, backupConnected: isConnected || !IS_CLOUD_BACKUP_BUILT, transactionCount: transactionCount ?? 0 });

  useEffect(() => {
    if (!candidate) return;
    let cancelled = false;
    void AsyncStorage.getItem(DISMISSED_KEY[candidate]).catch(() => null).then((dismissedAt) => {
      if (!cancelled && !isCoolingDown(dismissedAt, Date.now(), PROMPT_COOLDOWN_MS[candidate])) setAllowed(candidate);
    });
    return () => { cancelled = true; };
  }, [candidate]);

  const prompt = candidate && allowed === candidate ? candidate : null;

  const dismiss = () => {
    if (prompt) void AsyncStorage.setItem(DISMISSED_KEY[prompt], String(Date.now())).catch(() => {});
    setAllowed(null);
  };

  return { prompt, dismiss };
}
