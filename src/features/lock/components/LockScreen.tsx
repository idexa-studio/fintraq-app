import { Button } from '@/src/components/ui/Button';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
          // auto-prompt on mount
          const success = await authenticateWithBiometrics('Unlock app');
          if (!cancelled && success) onUnlock();
          else if (!cancelled) setError('Use the button below to try again.');
        } else {
          // biometric was enrolled when lock was set but now unavailable — fall to PIN
          setMode('pin');
        }
      } else {
        setMode('pin');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [onUnlock]);

  const handlePinChange = useCallback(async (val: string) => {
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
  }, [onUnlock]);

  if (mode === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Decorative background elements for a creative look */}
      <View style={styles.decoTop} pointerEvents="none" />
      <View style={styles.decoBottom} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: typography.fonts.bold, color: colors.text }]}>
            App is locked
          </Text>
          <Text style={[styles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Secure your financial data
          </Text>
        </View>

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

function createStyles({ spacing, colors }: ThemeContextType) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    decoTop: {
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: colors.primary + '0A',
      top: -150,
      left: -100,
    },
    decoBottom: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: colors.primary + '0C',
      bottom: -100,
      right: -50,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: spacing('12'),
      paddingBottom: spacing('12'),
    },
    header: {
      alignItems: 'center',
      gap: spacing('2'),
      marginTop: spacing('6'),
    },
    title: {
      fontSize: 32,
    },
    subtitle: {
      fontSize: 15,
    },
    padContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('6'),
    },
    error: {
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: spacing('6'),
      marginBottom: spacing('4'),
    },
    biometricWrap: {
      width: '100%',
      paddingHorizontal: spacing('6'),
      maxWidth: 320,
    },
  });
}
