import type { ProFeatureId } from '@/features/pro/pro-features';
import { readSavedPro } from '@/platform/purchases/saved-pro';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

type ProState = {
  /** Whether Pro is unlocked. False until the saved state has been read. */
  isPro: boolean;
  /** Reads the saved state again, e.g. on coming back from the paywall. */
  refresh: () => void;
};

const ProContext = createContext<ProState>({ isPro: false, refresh: () => undefined });

/**
 * Whether the user is Pro, for every rebuilt screen. It is read from what is
 * saved on the phone, so it is right offline and at once; talking to the
 * store (buying, restoring, renewals) is joined on here in phase E.
 */
export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const refresh = useCallback(() => void readSavedPro().then(setIsPro, () => undefined), []);

  useEffect(() => {
    refresh();
    // A subscription can end, or a purchase finish, while the app is in the background.
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => listener.remove();
  }, [refresh]);

  const value = useMemo(() => ({ isPro, refresh }), [isPro, refresh]);
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

/**
 * For a screen that has a limit or a Pro feature: whether Pro is unlocked,
 * and the way to the paywall. The state is read again whenever the screen
 * comes back into view, so returning from the paywall shows the result.
 */
export function usePro() {
  const { isPro, refresh } = useContext(ProContext);
  const router = useRouter();
  useFocusEffect(refresh);
  const openPaywall = useCallback((feature?: ProFeatureId) => router.push(feature ? { pathname: '/premium', params: { feature } } : '/premium'), [router]);
  return { isPro, openPaywall };
}
