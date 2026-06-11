import { useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LockStorage } from '../api/lockStorage';
import { authenticateWithBiometrics, getBiometricCapability } from '../hooks/useLocalAuth';
import { PinPad } from './PinPad';

type Props = {
  onUnlock: () => void;
};

export const LockScreen = React.memo(function LockScreen({ onUnlock }: Props) {
  const { colors, typography, spacing } = useTheme();
  const styles = useMemo(() => createStyles({ colors, spacing }), [colors, spacing]);

  const [mode, setMode] = useState<'loading' | 'biometric' | 'pin'>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  const tryBiometric = useCallback(async () => {
    if (authInProgress) return;
    setAuthInProgress(true);
    setError('');
    try {
      const success = await authenticateWithBiometrics('Unlock Luno');
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
          const success = await authenticateWithBiometrics('Unlock Luno');
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
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
          <MaterialCommunityIcons
            name={mode === 'biometric' ? 'face-recognition' : 'lock-outline'}
            size={36}
            color={colors.primary}
          />
        </View>

        <Text style={[styles.title, { fontFamily: typography.fonts.bold, color: colors.text }]}>
          Luno is locked
        </Text>

        {error ? (
          <Text style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>
            {error}
          </Text>
        ) : null}

        {mode === 'biometric' ? (
          <TouchableOpacity
            style={[styles.biometricBtn, { backgroundColor: colors.primary }]}
            onPress={tryBiometric}
            disabled={authInProgress}
            activeOpacity={0.8}
          >
            {authInProgress ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="fingerprint" size={20} color="#fff" />
                <Text style={[styles.biometricBtnText, { fontFamily: typography.fonts.semibold }]}>
                  Unlock with biometrics
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <PinPad value={pin} onChange={handlePinChange} maxLength={6} />
        )}
      </View>
    </SafeAreaView>
  );
});

type StyleDeps = Pick<ReturnType<typeof useTheme>, 'colors' | 'spacing'>;

function createStyles({ spacing }: StyleDeps) {
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
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('6'),
      paddingBottom: spacing('12'),
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 26,
    },
    error: {
      fontSize: 13,
    },
    biometricBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('6'),
      paddingVertical: spacing('4'),
      borderRadius: 50,
      marginTop: spacing('4'),
    },
    biometricBtnText: {
      fontSize: 16,
      color: '#fff',
    },
  });
}
