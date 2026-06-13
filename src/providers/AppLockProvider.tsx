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
import { AppState, AppStateStatus, Modal } from 'react-native';

const GRACE_PERIOD_MS = 3000;

type AppLockContextType = {
  lockEnabled: boolean;
  lockMode: LockMode | null;
  enableLock: (mode: LockMode) => Promise<void>;
  disableLock: () => Promise<void>;
  isReady: boolean;
  isLocked: boolean;
};

const AppLockContext = createContext<AppLockContextType | null>(null);

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [lockMode, setLockMode] = useState<LockMode | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    LockStorage.getLockMode().then(mode => {
      setLockMode(mode);
      if (mode) setIsLocked(true);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;

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
  }, [isReady, lockMode]);

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
    () => ({ lockEnabled: lockMode !== null, lockMode, enableLock, disableLock, isReady, isLocked }),
    [lockMode, enableLock, disableLock, isReady, isLocked],
  );

  return (
    <AppLockContext.Provider value={contextValue}>
      {children}
      <Modal visible={isLocked} animationType="fade" presentationStyle="fullScreen" statusBarTranslucent>
        <LockScreen onUnlock={handleUnlock} />
      </Modal>
    </AppLockContext.Provider>
  );
}

export { getBiometricCapability };
