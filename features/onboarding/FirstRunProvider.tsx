import { markWhatsNewSeen } from '@/features/guide';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { LoggerService } from '@/shared/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type FirstRun = {
  /** The user has been through setup or a restore, on this install. */
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
};

const FirstRunContext = createContext<FirstRun | null>(null);

export function useOnboarding(): FirstRun {
  const firstRun = useContext(FirstRunContext);
  if (!firstRun) throw new Error('useOnboarding must be used within OnboardingProvider');
  return firstRun;
}

/**
 * Whether this install has been set up, kept under the key the shipped app wrote, so existing
 * users never see the way in again. Nothing is drawn until that is known: the launch screen is
 * still up, and drawing the welcome for an instant to someone already set up would be wrong.
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [known, setKnown] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.ONBOARDED)
      .then((value) => setHasOnboarded(value === 'true'), (e) => LoggerService.error('FIRST_RUN', 'Could not read whether setup was done', e))
      .finally(() => setKnown(true));
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      // Someone who has just arrived has nothing to be told is new.
      await markWhatsNewSeen();
      await AsyncStorage.setItem(StorageKeys.ONBOARDED, 'true');
      setHasOnboarded(true);
    } catch (e) {
      LoggerService.error('FIRST_RUN', 'Could not save that setup was done', e);
    }
  }, []);

  const value = useMemo(() => ({ hasOnboarded, completeOnboarding }), [hasOnboarded, completeOnboarding]);
  if (!known) return null;
  return <FirstRunContext.Provider value={value}>{children}</FirstRunContext.Provider>;
}
