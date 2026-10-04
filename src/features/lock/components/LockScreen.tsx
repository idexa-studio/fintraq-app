import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { Spinner } from '@/src/components/ui';
import { Button } from '@/src/components/ui/Button';
import { Icon } from '@/src/components/ui/Icon';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LockStorage } from '@/src/features/lock/api/lockStorage';
import { authenticateWithBiometrics, getBiometricCapability } from '@/src/features/lock/hooks/useLocalAuth';
import { PinPad } from './PinPad';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

type Props = {
  onUnlock: () => void;
};

export const LockScreen = React.memo(function LockScreen({ onUnlock }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<'loading' | 'biometric' | 'pin'>('loading');
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

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

      if (lockMode === 'biometric') {
        const cap = await getBiometricCapability();
        if (cancelled) return;
        if (cap.available) {
          setMode('biometric');
          const success = await authenticateWithBiometrics(t('lock.unlockApp'));
          if (!cancelled && success) onUnlock();
          else if (!cancelled) setError(t('lock.useButton'));
        } else {
          setMode('pin');
        }
      } else {
        setMode('pin');
      }
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
        {/* Glowing Pulse Ring Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner}>
              <Icon name="lock-key" size={32} color={colors.primaryInk} />
            </View>
          </View>
        </View>

        {/* Text Details block */}
        <View style={styles.infoContainer}>
          <Text variant="headline" style={styles.title}>{t('common.locked')}</Text>
          <Text variant="callout" tone="muted" style={styles.subtitle}>{t('common.secureData')}</Text>
        </View>

        {/* PinPad or Biometrics block */}
        <View style={styles.padContainer}>
          {error ? (
            <Text style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>
              {error}
            </Text>
          ) : null}

          {mode === 'biometric' ? (
            <View style={styles.biometricWrap}>
              <Button
                title={t('lock.useBiometrics')}
                variant="primary"
                size="lg"
                onPress={tryBiometric}
                isLoading={authInProgress}
              />
            </View>
          ) : (
            <PinPad value={pin} onChange={handlePinChange} maxLength={6} />
          )}
        </View>
      </View>
    </Screen>
  );
});

function createStyles({ spacing, radius, typography, colors }: ThemeContextType) {
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
    // Graphic element
    graphicContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing('4'),
    },
    pulseOuter: {
      width: 96,
      height: 96,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'faint'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    pulseInner: {
      width: 68,
      height: 68,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'subtle'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Text container
    infoContainer: {
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('2'),
      paddingTop: spacing('2'),
    },
    title: {
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
    },
    // PinPad/Biometrics Container
    padContainer: {
      flex: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('6'),
      width: '100%',
    },
    error: {
      ...typography.metrics.sm,
      textAlign: 'center',
      paddingHorizontal: spacing('6'),
    },
    biometricWrap: {
      width: '100%',
      paddingHorizontal: spacing('6'),
      maxWidth: 320,
    },
  });
}
