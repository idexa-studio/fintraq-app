import { LockScreen } from '@/features/lock/LockScreen';
import { shouldLockAfter } from '@/features/lock/lock-rules';
import { LockStorage } from '@/platform/lock/lock-storage';
import type { LockMode } from '@/platform/lock/lock-storage';
import { LoggerService } from '@/shared/logging/logger';
import { requireOptionalNativeModule } from 'expo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Platform } from 'react-native';

const SCREEN_CAPTURE_KEY = 'app-lock';

/**
 * While the lock is on, keep balances out of the recent-apps thumbnail, screenshots and
 * recordings: the lock screen only appears on return, so without this the switcher shows
 * whatever was last on screen. Android marks the window secure; iOS blurs the snapshot.
 */
async function setScreenPrivacy(enabled: boolean): Promise<void> {
  try {
    // A JS update can reach an installed build that predates this native module; importing it
    // there would crash on launch, so look for the module first and load it only when present.
    if (!requireOptionalNativeModule('ExpoScreenCapture')) return;
    const ScreenCapture = await import('expo-screen-capture');
    // Development builds stay capturable: screenshots are how the interface gets reviewed.
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

type AppLock = {
  /** How the app is locked, or null when it is not. */
  lockMode: LockMode | null;
  lockEnabled: boolean;
  enableLock: (mode: LockMode) => Promise<void>;
  /** Turns the lock off and forgets the PIN. */
  disableLock: () => Promise<void>;
  isLocked: boolean;
};

const AppLockContext = createContext<AppLock | null>(null);

export function useAppLock(): AppLock {
  const lock = useContext(AppLockContext);
  if (!lock) throw new Error('useAppLock must be used within LockProvider');
  return lock;
}

/**
 * Holds whether the app is locked and covers everything with the lock screen while it is. The
 * lock comes back after the app has been left for more than a few seconds.
 */
export function LockProvider({ children }: { children: React.ReactNode }) {
  // Read at once, so the very first frame is already locked: reading later would let the
  // screens underneath draw their balances before the lock screen arrives.
  const [lockMode, setLockMode] = useState<LockMode | null>(() => LockStorage.getLockModeSync());
  const [isLocked, setIsLocked] = useState(lockMode !== null);
  const leftAt = useRef<number | null>(null);
  const lockEnabled = lockMode !== null;

  useEffect(() => {
    void setScreenPrivacy(lockEnabled);
  }, [lockEnabled]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        leftAt.current = Date.now();
      } else if (state === 'active') {
        if (lockMode && shouldLockAfter(leftAt.current === null ? null : Date.now() - leftAt.current)) setIsLocked(true);
        leftAt.current = null;
      }
    });
    return () => listener.remove();
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

  const unlock = useCallback(() => setIsLocked(false), []);
  const value = useMemo(() => ({ lockEnabled, lockMode, enableLock, disableLock, isLocked }), [lockEnabled, lockMode, enableLock, disableLock, isLocked]);

  return (
    <AppLockContext.Provider value={value}>
      {children}
      <Modal visible={isLocked} animationType="none" presentationStyle="fullScreen" statusBarTranslucent>
        <LockScreen onUnlock={unlock} />
      </Modal>
    </AppLockContext.Provider>
  );
}
