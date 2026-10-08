import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LockStorage } from '@/platform/lock/lock-storage';
import { authenticateWithBiometrics, getBiometricCapability } from '@/platform/lock/useLocalAuth';
import { useAppLock } from '@/src/providers/AppLockProvider';

/**
 * The Settings switch for app lock. Turning it on prefers biometrics and falls back to a PIN;
 * turning it off asks for biometrics when that's the lock, otherwise an in-app confirmation.
 * The screen renders `PinSetupModal` and `ConfirmDialog` from the returned state.
 */
export function useLockSetting() {
  const { t } = useTranslation();
  const { lockEnabled, lockMode, enableLock, disableLock } = useAppLock();
  const [isPinSetupVisible, setPinSetupVisible] = useState(false);
  const [isDisableConfirmVisible, setDisableConfirmVisible] = useState(false);

  const toggle = useCallback(async () => {
    const capability = await getBiometricCapability();
    if (lockEnabled) {
      if (lockMode === 'biometric' && capability.available) {
        if (await authenticateWithBiometrics(t('settings.confirmDisableLock'))) await disableLock();
      } else {
        setDisableConfirmVisible(true);
      }
      return;
    }
    if (capability.available) {
      if (await authenticateWithBiometrics(t('settings.confirmEnableLock'))) await enableLock('biometric');
    } else {
      setPinSetupVisible(true);
    }
  }, [lockEnabled, lockMode, enableLock, disableLock, t]);

  const completePinSetup = useCallback(
    async (pin: string) => {
      setPinSetupVisible(false);
      await LockStorage.setPin(pin);
      await enableLock('pin');
    },
    [enableLock],
  );

  return {
    lockEnabled,
    lockMode,
    toggle,
    changePin: useCallback(() => setPinSetupVisible(true), []),
    pinSetup: {
      visible: isPinSetupVisible,
      onCancel: useCallback(() => setPinSetupVisible(false), []),
      onComplete: completePinSetup,
    },
    disableConfirm: {
      visible: isDisableConfirmVisible,
      onClose: useCallback(() => setDisableConfirmVisible(false), []),
      onConfirm: disableLock,
    },
  };
}
