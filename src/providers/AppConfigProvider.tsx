import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  fetchRemoteAppConfig,
  initRemoteConfig,
  type AnnouncementConfig,
} from '@/src/services/remote-config.service';
import { ForceUpdateScreen } from '@/src/features/update/components/ForceUpdateScreen';
import { MaintenanceScreen } from '@/src/features/maintenance/components/MaintenanceScreen';
import { AnnouncementBanner } from '@/src/components/ui/AnnouncementBanner';
import { MigrationSeedService } from '@/src/services/migration-seed.service';
import { getAppVersion } from '@/src/utils/version';

interface AppConfigContextType {
  isChecking: boolean;
  checkStatus: (force?: boolean) => Promise<void>;
  hasActivePrompt: boolean;
  privacyUrl: string;
  termsUrl: string;
}

const AppConfigContext = createContext<AppConfigContextType | null>(null);

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}

const FETCH_TIMEOUT_MS = 5_000;
const COOLDOWN_MS = 10 * 60 * 1000;

export const AppConfigProvider = React.memo(function AppConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [forceUpdateVersionName, setForceUpdateVersionName] = useState('');
  const [forceUpdateStoreUrl, setForceUpdateStoreUrl] = useState('');

  const [maintenanceBlocked, setMaintenanceBlocked] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const [privacyUrl, setPrivacyUrl] = useState('');
  const [termsUrl, setTermsUrl] = useState('');

  const appState = useRef(AppState.currentState);
  const lastCheckedTime = useRef(0);
  const initialized = useRef(false);

  const checkStatus = useCallback(async (force = false) => {
    const now = Date.now();
    // In dev: always fetch fresh — skip cooldown so RC changes show immediately
    const skipCooldown = __DEV__ || force;
    if (!skipCooldown && lastCheckedTime.current > 0 && now - lastCheckedTime.current < COOLDOWN_MS) {
      if (__DEV__) console.log('[AppConfig] Skipped — within cooldown');
      return;
    }

    setIsChecking(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('RC fetch timeout')), FETCH_TIMEOUT_MS)
    );

    try {
      const config = await Promise.race([fetchRemoteAppConfig(), timeout]);

      setForceUpdateRequired(config.forceUpdate.required);
      setForceUpdateVersionName(config.forceUpdate.versionName);
      setForceUpdateStoreUrl(config.forceUpdate.storeUrl);

      setMaintenanceBlocked(config.maintenance.blocked);
      setMaintenanceMessage(config.maintenance.message);

      setAnnouncement(config.announcement.showBanner ? config.announcement : null);

      if (config.privacyUrl) setPrivacyUrl(config.privacyUrl);
      if (config.termsUrl) setTermsUrl(config.termsUrl);

      lastCheckedTime.current = Date.now();
    } catch (error) {
      // Offline or timeout — keep cached/default values, don't block the user
      if (__DEV__) console.warn('[AppConfigProvider] Remote config fetch failed:', error);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  }, []);

  // Init RC defaults once, then fetch on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initRemoteConfig()
      .then(() => checkStatus(true))
      .catch(() => setIsLoading(false));

    MigrationSeedService.writeMigrationSeed().catch(() => {});
  }, [checkStatus]);

  // Hide splash once initialized
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Re-fetch on foreground resume
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkStatus();
        MigrationSeedService.writeMigrationSeed().catch(() => {});
      } else if (nextState === 'background' || nextState === 'inactive') {
        MigrationSeedService.writeMigrationSeed().catch(() => {});
      }
      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [checkStatus]);

  const handleAnnouncementDismiss = useCallback(() => {
    setAnnouncementDismissed(true);
  }, []);

  const handleMaintenanceRetry = useCallback(() => {
    checkStatus(true);
  }, [checkStatus]);

  const showAnnouncement = !announcementDismissed && announcement !== null;

  const contextValue = useMemo(
    () => ({
      isChecking,
      checkStatus,
      hasActivePrompt: showAnnouncement,
      privacyUrl,
      termsUrl,
    }),
    [isChecking, checkStatus, showAnnouncement, privacyUrl, termsUrl]
  );

  if (isLoading) return null;

  if (maintenanceBlocked) {
    return (
      <MaintenanceScreen
        message={maintenanceMessage}
        onRetry={handleMaintenanceRetry}
        isRetrying={isChecking}
      />
    );
  }

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
      <View style={{ flex: 1 }}>
        {children}
        {showAnnouncement && announcement !== null && (
          <AnnouncementBanner
            message={announcement.message}
            canDismiss={announcement.canDismiss}
            onDismiss={handleAnnouncementDismiss}
          />
        )}
      </View>
    </AppConfigContext.Provider>
  );
});
