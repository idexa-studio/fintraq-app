import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { DARK_THEME } from '../theme/colors';
import { StorageKeys } from '../constants/keys';

type OnboardingContextType = {
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(StorageKeys.ONBOARDED);
        if (value === 'true') {
          setHasOnboarded(true);
        }
      } catch (e) {
        console.error('Error reading onboarding status', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(StorageKeys.ONBOARDED, 'true');
      setHasOnboarded(true);
    } catch (e) {
      console.error('Error setting onboarding status', e);
    }
  }, []);

  const contextValue = useMemo(() => ({ hasOnboarded, completeOnboarding }), [hasOnboarded, completeOnboarding]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK_THEME.background }}>
        <ActivityIndicator size="large" color={DARK_THEME.primary} />
      </View>
    );
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}
