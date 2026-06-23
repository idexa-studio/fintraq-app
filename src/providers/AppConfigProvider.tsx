import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';
import { fetchAppConfig } from '@/src/services/app-config.service';
import { ForceUpdateScreen } from '@/src/features/update/components/ForceUpdateScreen';
import { getAppVersion } from '@/src/utils/version';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import * as SplashScreen from 'expo-splash-screen';
import { useAppLock } from './AppLockProvider';
import { MigrationSeedService } from '@/src/services/migration-seed.service';

interface AppConfigContextType {
  isChecking: boolean;
  checkStatus: (force?: boolean) => Promise<void>;
  hasActivePrompt: boolean;
}

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}

const FETCH_TIMEOUT_MS = 3500;
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

export const AppConfigProvider = React.memo(function AppConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [action, setAction] = useState<'force-update' | 'suggest-update' | 'none'>('none');
  const [message, setMessage] = useState('');
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  const [storeLinks, setStoreLinks] = useState<{ androidStore: string; iosStore: string } | null>(null);

  const { isLocked } = useAppLock();
  const isLockedRef = useRef(isLocked);
  const pendingSoftPrompt = useRef(false);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // When app is unlocked, show soft prompt if it was pending
  useEffect(() => {
    if (!isLocked && pendingSoftPrompt.current) {
      setShowSoftPrompt(true);
      pendingSoftPrompt.current = false;
    }
  }, [isLocked]);

  const appState = useRef(AppState.currentState);
  const lastCheckedTime = useRef(0);

  const checkStatus = useCallback(async (force = false) => {
    const now = Date.now();
    // 10-minute rate-limiting cooldown unless forced
    if (!force && lastCheckedTime.current > 0 && now - lastCheckedTime.current < COOLDOWN_MS) {
      if (__DEV__) {
        console.log('[AppConfigProvider] Skipping version check: within 10-minute cooldown.');
      }
      return;
    }

    setIsCheckingStatus(true);
    
    // Create a promise that rejects after FETCH_TIMEOUT_MS
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Fetch timeout')), FETCH_TIMEOUT_MS);
    });

    try {
      // Race the fetch request against the timeout
      const result = await Promise.race([fetchAppConfig(), timeoutPromise]);

      if (result.success && result.data) {
        const { action: nextAction, message: nextMessage, links } = result.data;
        setAction(nextAction);
        setMessage(nextMessage || '');
        setStoreLinks(links);

        if (nextAction === 'suggest-update') {
          if (isLockedRef.current) {
            pendingSoftPrompt.current = true;
          } else {
            setShowSoftPrompt(true);
          }
        }

        lastCheckedTime.current = Date.now();
      }
    } catch (error) {
      console.warn('[AppConfigProvider] Failed to fetch app config (offline or timeout):', error);
      // Let the user proceed offline if fetch fails, unless a block state was already set.
    } finally {
      setIsLoading(false);
      setIsCheckingStatus(false);
    }
  }, []);

  // Check config and generate migration seed on mount
  useEffect(() => {
    checkStatus();
    MigrationSeedService.writeMigrationSeed().catch(() => {});
  }, [checkStatus]);

  // Release the splash screen lock once initialization completes
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Check config on AppState change (active/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, re-fetch configuration (subject to cooldown) and write seed
        checkStatus();
        MigrationSeedService.writeMigrationSeed().catch(() => {});
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background: write seed to ensure Flutter has latest data
        MigrationSeedService.writeMigrationSeed().catch(() => {});
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  const handleSoftUpdateConfirm = useCallback(() => {
    setShowSoftPrompt(false);
    const storeUrl = Platform.OS === 'ios' ? storeLinks?.iosStore : storeLinks?.androidStore;
    if (storeUrl) {
      Linking.openURL(storeUrl).catch((err) =>
        console.error('[AppConfigProvider] Failed to open store URL:', err)
      );
    }
  }, [storeLinks]);

  const handleSoftUpdateClose = useCallback(() => {
    setShowSoftPrompt(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      isChecking: isCheckingStatus,
      checkStatus,
      hasActivePrompt: showSoftPrompt,
    }),
    [isCheckingStatus, checkStatus, showSoftPrompt]
  );

  // Return null during loading to keep the native splash screen locked without visual flicker
  if (isLoading) {
    return null;
  }

  if (action === 'force-update') {
    return (
      <ForceUpdateScreen
        androidStoreUrl={storeLinks?.androidStore || 'https://play.google.com/store/apps/details?id=me.nafish.luno'}
        iosStoreUrl={storeLinks?.iosStore || 'https://apps.apple.com/app/id123456'}
        currentVersion={getAppVersion()}
        latestVersion="Latest"
        message={message}
      />
    );
  }

  return (
    <AppConfigContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        visible={showSoftPrompt}
        onClose={handleSoftUpdateClose}
        title="Update available"
        message={message || 'A new version of Fintraq is available. Would you like to update now to get the latest features?'}
        confirmLabel="Update"
        cancelLabel="Later"
        destructive={false}
        onConfirm={handleSoftUpdateConfirm}
      />
    </AppConfigContext.Provider>
  );
});
