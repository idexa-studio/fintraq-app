import { Button } from '@/src/components/ui/Button';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockPasswordIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockStorage } from '../api/lockStorage';
import { authenticateWithBiometrics, getBiometricCapability } from '../hooks/useLocalAuth';
import { PinPad } from './PinPad';

type Props = {
  onUnlock: () => void;
};

export const LockScreen = React.memo(function LockScreen({ onUnlock }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<'loading' | 'biometric' | 'pin'>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  const tryBiometric = useCallback(async () => {
    if (authInProgress) return;
    setAuthInProgress(true);
    setError('');
    try {
      const success = await authenticateWithBiometrics('Unlock app');
      if (success) {
        onUnlock();
      } else {
        setError('Authentication failed. Try again.');
      }
    } finally {
      setAuthInProgress(false);
    }
  }, [authInProgress, onUnlock]);

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
          const success = await authenticateWithBiometrics('Unlock app');
          if (!cancelled && success) onUnlock();
          else if (!cancelled) setError('Use the button below to try again.');
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
  }, [onUnlock]);

  const handlePinChange = useCallback(
    async (val: string) => {
      setError('');
      setPin(val);

      if (val.length < 6) return;

      const correct = await LockStorage.verifyPin(val);
      if (correct) {
        onUnlock();
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    },
    [onUnlock],
  );

  if (mode === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Glowing Pulse Ring Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner}>
              <HugeiconsIcon icon={LockPasswordIcon} size={32} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Text Details block */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>App is locked</Text>
          <Text style={styles.subtitle}>Secure your financial data</Text>
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
                title="Use biometrics"
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
    </SafeAreaView>
  );
});

function createStyles({ spacing, radius, typography, colors }: ThemeContextType) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
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
      borderRadius: 48,
      backgroundColor: colors.primary + '0B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pulseInner: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary + '18',
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
      fontFamily: typography.styles.emptyTitle.fontFamily,
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      opacity: 0.85,
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
      fontSize: 13,
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
