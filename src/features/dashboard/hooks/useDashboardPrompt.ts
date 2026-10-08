import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { useBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { useAppLock } from '@/src/providers/AppLockProvider';
import { usePremium } from '@/src/providers/PremiumProvider';

export type DashboardPrompt = 'upsell' | 'backup';

const DAY_MS = 24 * 60 * 60 * 1000;

const PROMPTS: Record<DashboardPrompt, { dismissedKey: StorageKeys; cooldownMs: number }> = {
  upsell: { dismissedKey: StorageKeys.UPSELL_DISMISSED_AT, cooldownMs: 3 * DAY_MS },
  backup: { dismissedKey: StorageKeys.BACKUP_PROMPT_DISMISSED_AT, cooldownMs: 14 * DAY_MS },
};

// Only after someone has actually used the app — a prompt on an empty dashboard has no context.
const MIN_TRANSACTIONS = 3;
// Let the dashboard render and be read before anything floats over it.
const SHOW_DELAY_MS = 2_500;

export type DashboardPromptInput = {
  /** Entitlement and backup account have both loaded. */
  isResolved: boolean;
  isLocked: boolean;
  isPremium: boolean;
  isBackupConnected: boolean;
  transactionCount: number;
};

/** Which prompt fits this user right now, ignoring cooldowns. Pure, for testing. */
export function chooseDashboardPrompt(input: DashboardPromptInput): DashboardPrompt | null {
  if (!input.isResolved || input.isLocked || input.transactionCount < MIN_TRANSACTIONS) return null;
  if (!input.isPremium) return 'upsell';
  if (!input.isBackupConnected) return 'backup';
  return null;
}

// One dashboard prompt per app session at most.
let shownThisSession = false;

/**
 * Decides the single prompt (if any) the dashboard may show this session:
 *  - free users → Pro upsell;
 *  - Pro users without a connected Drive → backup prompt (connecting requires Pro, so free users
 *    are never offered something they can't complete).
 * Each respects its own dismissal cooldown. Nothing shows until entitlement and the backup account
 * are resolved, so a Pro user never flashes the upsell while their entitlement is loading.
 */
export function useDashboardPrompt(transactionCount: number | undefined) {
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const { isConnected: isBackupConnected, isLoading: isBackupLoading } = useBackupAccount();
  const { isLocked } = useAppLock();
  const [prompt, setPrompt] = useState<DashboardPrompt | null>(null);

  const candidate = chooseDashboardPrompt({
    isResolved: !isPremiumLoading && !isBackupLoading,
    isLocked,
    isPremium,
    isBackupConnected,
    transactionCount: transactionCount ?? 0,
  });

  useEffect(() => {
    if (!candidate) {
      setPrompt(null);
      return;
    }
    if (shownThisSession) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const { dismissedKey, cooldownMs } = PROMPTS[candidate];

    AsyncStorage.getItem(dismissedKey)
      .then((dismissedAt) => {
        if (cancelled) return;
        const last = parseInt(dismissedAt ?? '', 10);
        if (Number.isFinite(last) && Date.now() - last < cooldownMs) return;
        timer = setTimeout(() => {
          if (shownThisSession) return;
          shownThisSession = true;
          setPrompt(candidate);
        }, SHOW_DELAY_MS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [candidate]);

  const dismiss = useCallback(() => {
    setPrompt((current) => {
      if (current) AsyncStorage.setItem(PROMPTS[current].dismissedKey, String(Date.now())).catch(() => {});
      return null;
    });
  }, []);

  return { prompt, dismiss };
}
