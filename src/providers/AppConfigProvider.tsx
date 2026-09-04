import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  fetchRemoteAppConfig,
  initRemoteConfig,
} from '@/src/services/remote-config.service';
import { ForceUpdateScreen } from '@/src/features/update/components/ForceUpdateScreen';
import { MigrationSeedService } from '@/src/services/migration-seed.service';
import { getAppVersion } from '@/src/utils/version';

interface AppConfigContextType {
  isChecking: boolean;
  checkStatus: (force?: boolean) => Promise<void>;
  privacyUrl: string;
  termsUrl: string;
}

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}

const COOLDOWN_MS = 10 * 60 * 1000;
// App-level backstop on cold-start init, independent of Firebase's own
// fetchTimeoutMillis — that only bounds the network fetch phase, not the
// full fetchAndActivate() call (activation, native bridge round trip, the
// dynamic import inside remote-config.service.ts). Without this, a stall
// anywhere in that chain leaves the splash screen up indefinitely, since
// SplashScreen.hideAsync() only fires in this effect's `.finally()`.
const INIT_DEADLINE_MS = 8000;

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

export const AppConfigProvider = React.memo(function AppConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChecking, setIsChecking] = useState(false);

  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [forceUpdateVersionName, setForceUpdateVersionName] = useState('');
  const [forceUpdateStoreUrl, setForceUpdateStoreUrl] = useState('');

  const [privacyUrl, setPrivacyUrl] = useState('');
  const [termsUrl, setTermsUrl] = useState('');

  const appState = useRef(AppState.currentState);
  const lastCheckedTime = useRef(0);
  const initialized = useRef(false);

  const checkStatus = useCallback(async (force = false) => {
    const now = Date.now();
    const skipCooldown = __DEV__ || force;
    if (!skipCooldown && lastCheckedTime.current > 0 && now - lastCheckedTime.current < COOLDOWN_MS) {
      return;
    }

    setIsChecking(true);

    try {
      const config = await fetchRemoteAppConfig();

      setForceUpdateRequired(config.forceUpdate.required);
      setForceUpdateVersionName(config.forceUpdate.versionName);
      setForceUpdateStoreUrl(config.forceUpdate.storeUrl);

      if (config.privacyUrl) setPrivacyUrl(config.privacyUrl);
      if (config.termsUrl) setTermsUrl(config.termsUrl);

      lastCheckedTime.current = Date.now();
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[AppConfigProvider] Remote config fetch failed:', error);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    withDeadline(
      initRemoteConfig().then(() => checkStatus(true)),
      INIT_DEADLINE_MS,
    )
      .catch((err) => {
        if (__DEV__) console.warn('[AppConfigProvider] init error:', err);
      })
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
  }, [checkStatus]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkStatus();
      } else if (nextState === 'background') {
        MigrationSeedService.writeMigrationSeed().catch(() => {});
      }
      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [checkStatus]);

  const contextValue = useMemo(
    () => ({ isChecking, checkStatus, privacyUrl, termsUrl }),
    [isChecking, checkStatus, privacyUrl, termsUrl]
  );

  if (forceUpdateRequired) {
    return (
      <ForceUpdateScreen
        androidStoreUrl={forceUpdateStoreUrl}
        iosStoreUrl={forceUpdateStoreUrl}
        currentVersion={getAppVersion()}
        latestVersion={forceUpdateVersionName}
      />
    );
  }

  return (
    <AppConfigContext.Provider value={contextValue}>
      {children}
    </AppConfigContext.Provider>
  );
});
