import { Button, Icon, Screen, Spinner, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LockStorage } from '@/platform/lock/lock-storage';
import { authenticateWithBiometrics, canAuthenticateOnDevice, getBiometricCapability } from '@/platform/lock/useLocalAuth';
import { formatLockoutRemaining } from '@/platform/lock/pin-lockout';
import { LoggerService } from '@/shared/logging/logger';
import { PinPad } from './PinPad';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

type LockScreenProps = {
  onUnlock: () => void;
};

/** `device`: the system prompt (biometrics, or the screen-lock credential). `pin`: the app's own PIN. */
type UnlockMethod = 'loading' | 'device' | 'pin';

export const LockScreen = React.memo(function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<UnlockMethod>('loading');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);
  // Too many wrong PINs: the pad is disabled until this moment (epoch ms). 0 = not locked out.
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const lockoutRemaining = Math.max(0, lockoutUntil - now);

  useEffect(() => {
    void LockStorage.getPinLockoutUntil().then(setLockoutUntil);
  }, []);

  useEffect(() => {
    if (lockoutUntil === 0) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockoutUntil) setLockoutUntil(0);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const tryBiometric = useCallback(async () => {
    if (authInProgress) return;
    setAuthInProgress(true);
    setError('');
    try {
      const success = await authenticateWithBiometrics(t('lock.unlockApp'));
      if (success) {
        onUnlock();
      } else {
        setError(t('lock.authFailed'));
      }
    } finally {
      setAuthInProgress(false);
    }
  }, [authInProgress, onUnlock, t]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const lockMode = await LockStorage.getLockMode();
      if (cancelled) return;

      if (lockMode !== 'biometric') {
        setMode('pin');
        return;
      }

      // A biometric lock has no app PIN. If fingerprints or faces were removed since it was
      // turned on, the system prompt still accepts the screen-lock credential, so keep using it
      // rather than showing a PIN pad nothing can satisfy.
      const [biometrics, canAuthenticate, hasPin] = await Promise.all([
        getBiometricCapability(),
        canAuthenticateOnDevice(),
        LockStorage.hasPin(),
      ]);
      if (cancelled) return;

      if (canAuthenticate) {
        setHasBiometrics(biometrics.available);
        setMode('device');
        const success = await authenticateWithBiometrics(t('lock.unlockApp'));
        if (cancelled) return;
        if (success) onUnlock();
        else setError(t('lock.useButton'));
        return;
      }

      if (hasPin) {
        setMode('pin');
        return;
      }

      // The device has no screen lock left and the app has no PIN: nothing can verify the owner.
      // Removing a screen lock already required the device credential, so let them in instead of
      // locking them out of their own records for good.
      LoggerService.warn('APP_LOCK', 'Biometric lock is on but the device has no screen lock; unlocking');
      onUnlock();
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [onUnlock, t]);

  const handlePinChange = useCallback(
    async (val: string) => {
      setError('');
      setPin(val);

      if (val.length < 6) return;

      const correct = await LockStorage.verifyPin(val);
      if (correct) {
        onUnlock();
      } else {
        setError(t('lock.incorrectPin'));
        setPin('');
        setLockoutUntil(await LockStorage.getPinLockoutUntil());
      }
    },
    [onUnlock, t],
  );

  if (mode === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Spinner size="sm" />
      </View>
    );
  }

  return (
    <Screen variant="fixed" edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.graphicContainer}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Icon name="lock-key" size={32} color={colors.primaryInk} />
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text variant="headline" align="center">{t('common.locked')}</Text>
          <Text variant="callout" tone="muted" align="center">{t('common.secureData')}</Text>
        </View>

        <View style={styles.padContainer}>
          {lockoutRemaining > 0 ? (
            <Text variant="callout" tone="danger" align="center" style={styles.error}>
              {t('lock.tooManyAttempts', { time: formatLockoutRemaining(lockoutRemaining) })}
            </Text>
          ) : error ? (
            <Text variant="callout" tone="danger" align="center" style={styles.error}>
              {error}
            </Text>
          ) : null}

          {mode === 'device' ? (
            <View style={styles.biometricWrap}>
              <Button
                title={hasBiometrics ? t('lock.useBiometrics') : t('lock.unlockApp')}
                variant="primary"
                size="lg"
                fullWidth
                onPress={tryBiometric}
                isLoading={authInProgress}
              />
            </View>
          ) : (
            <PinPad value={pin} onChange={handlePinChange} maxLength={6} disabled={lockoutRemaining > 0} />
          )}
        </View>
      </View>
    </Screen>
  );
});

function createStyles({ spacing, radius, colors }: ThemeContextType) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: spacing('8'),
      paddingVertical: spacing('10'),
    },
    graphicContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing('4'),
    },
    ringOuter: {
      width: 96,
      height: 96,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'faint'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    ringInner: {
      width: 68,
      height: 68,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'subtle'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContainer: {
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('2'),
      paddingTop: spacing('2'),
    },
    padContainer: {
      flex: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('6'),
      width: '100%',
    },
    error: {
      paddingHorizontal: spacing('6'),
    },
    biometricWrap: {
      width: '100%',
      paddingHorizontal: spacing('6'),
      maxWidth: 320,
    },
  });
}
