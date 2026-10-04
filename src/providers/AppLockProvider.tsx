import { LockScreen } from '@/src/features/lock/components/LockScreen';
import { LockStorage, LockMode } from '@/src/features/lock/api/lockStorage';
import { getBiometricCapability } from '@/src/features/lock/hooks/useLocalAuth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { requireOptionalNativeModule } from 'expo';
import { AppState, AppStateStatus, Modal, Platform } from 'react-native';
import { LoggerService } from '@/src/services/logger.service';

const GRACE_PERIOD_MS = 3000;
const SCREEN_CAPTURE_KEY = 'app-lock';

/**
 * While the lock is on, keep balances out of the recent-apps thumbnail, screenshots and screen
 * recordings: the lock screen only appears on return, so without this the switcher shows whatever
 * was last on screen. Android marks the window secure; iOS blurs the switcher snapshot.
 */
async function setScreenPrivacy(enabled: boolean): Promise<void> {
  try {
    // A JS update can reach an installed build that predates this native module; importing it
    // there would crash on launch, so check for the module first and load it only when present.
    if (!requireOptionalNativeModule('ExpoScreenCapture')) return;
    const ScreenCapture = await import('expo-screen-capture');
    // Development builds stay capturable: screenshots are how UI work gets reviewed.
    if (enabled && !__DEV__) {
      await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      if (Platform.OS === 'ios') await ScreenCapture.enableAppSwitcherProtectionAsync();
    } else {
      await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
      if (Platform.OS === 'ios') await ScreenCapture.disableAppSwitcherProtectionAsync();
    }
  } catch (e) {
    LoggerService.warn('APP_LOCK', 'Could not update screen privacy', e);
  }
}

type AppLockContextType = {
  lockEnabled: boolean;
  lockMode: LockMode | null;
  enableLock: (mode: LockMode) => Promise<void>;
  disableLock: () => Promise<void>;
  isLocked: boolean;
};

const AppLockContext = createContext<AppLockContextType | null>(null);

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  // Read synchronously so the very first frame is already locked: an async read lets the screens
  // underneath render (and show balances) before the lock screen arrives.
  const [lockMode, setLockMode] = useState<LockMode | null>(() => LockStorage.getLockModeSync());
  const [isLocked, setIsLocked] = useState(lockMode !== null);
  const backgroundedAt = useRef<number | null>(null);
  const lockEnabled = lockMode !== null;

  useEffect(() => {
    void setScreenPrivacy(lockEnabled);
  }, [lockEnabled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active') {
        if (!lockMode) return;
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : Infinity;
        if (elapsed > GRACE_PERIOD_MS) {
          setIsLocked(true);
        }
        backgroundedAt.current = null;
      }
    });

    return () => sub.remove();
  }, [lockMode]);

  const enableLock = useCallback(async (mode: LockMode) => {
    await LockStorage.setLockMode(mode);
    setLockMode(mode);
  }, []);

  const disableLock = useCallback(async () => {
    await LockStorage.clearLockMode();
    setLockMode(null);
    setIsLocked(false);
  }, []);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const contextValue = useMemo(
    () => ({ lockEnabled, lockMode, enableLock, disableLock, isLocked }),
    [lockEnabled, lockMode, enableLock, disableLock, isLocked],
  );

  return (
    <AppLockContext.Provider value={contextValue}>
      {children}
      <Modal visible={isLocked} animationType="none" presentationStyle="fullScreen" statusBarTranslucent>
        <LockScreen onUnlock={handleUnlock} />
      </Modal>
    </AppLockContext.Provider>
  );
}

export { getBiometricCapability };
