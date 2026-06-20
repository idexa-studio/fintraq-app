import { usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/src/providers/SettingsProvider';
import {
  configureFirebaseTelemetry,
  logFirebaseScreenView,
  setFirebaseUserTraits,
} from '../services/firebase';

export const FirebaseProvider = React.memo(function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const { profile, isLoading } = useSettings();
  const { isPremium } = usePremium();

  useEffect(() => {
    const enabled = !__DEV__;
    configureFirebaseTelemetry(enabled).catch((e) => { if (__DEV__) console.warn('[Firebase]', e); });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    setFirebaseUserTraits({
      isPremium,
      theme: profile.theme,
      defaultCurrency: profile.defaultCurrency,
      hasProfileName: Boolean(profile.name.trim()),
    }).catch((e) => { if (__DEV__) console.warn('[Firebase]', e); });
  }, [isLoading, isPremium, profile.defaultCurrency, profile.name, profile.theme]);

  useEffect(() => {
    if (!pathname || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    logFirebaseScreenView(pathname).catch((e) => { if (__DEV__) console.warn('[Firebase]', e); });
  }, [pathname]);

  return <>{children}</>;
});
