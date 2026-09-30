import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import type { ProFeatureId } from '@/src/features/premium/pro-features';
import { usePremium } from '@/src/providers/PremiumProvider';

/**
 * Entitlement checks for actions (buttons, list rows, limits). `requirePro(feature)` returns true
 * for Pro users; otherwise it opens the paywall with that feature highlighted and returns false.
 * For sections of UI, use `<ProGate>` instead.
 */
export function useProAccess() {
  const { isPremium } = usePremium();
  const router = useRouter();

  const openPaywall = useCallback(
    (feature?: ProFeatureId) => router.push(feature ? { pathname: '/premium', params: { feature } } : '/premium'),
    [router],
  );

  const requirePro = useCallback(
    (feature: ProFeatureId) => {
      if (isPremium) return true;
      openPaywall(feature);
      return false;
    },
    [isPremium, openPaywall],
  );

  return { isPremium, openPaywall, requirePro };
}
