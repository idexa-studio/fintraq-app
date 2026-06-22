import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from './PinPad';

type Step = 'enter' | 'confirm';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onComplete: (pin: string) => void;
};

export const PinSetupModal = React.memo(function PinSetupModal({ visible, onCancel, onComplete }: Props) {
  const { colors, typography, spacing } = useTheme();
  const styles = useMemo(() => createStyles({ colors, spacing }), [colors, spacing]);

  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStep('enter');
    setFirstPin('');
    setCurrentPin('');
    setError('');
  }, []);

  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handlePinChange = useCallback((val: string) => {
    setError('');
    setCurrentPin(val);

    if (val.length < 6) return;

    if (step === 'enter') {
      setFirstPin(val);
      setCurrentPin('');
      setStep('confirm');
    } else {
      if (val === firstPin) {
        reset();
        onComplete(val);
      } else {
        setError('PINs do not match. Try again.');
        setCurrentPin('');
        setStep('enter');
        setFirstPin('');
      }
    }
  }, [step, firstPin, reset, onComplete]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleCancel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { fontFamily: typography.styles.dialogTitle.fontFamily, color: colors.text }]}>
            {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
          </Text>
          <Text style={[styles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            {step === 'enter'
              ? 'Choose a 6-digit PIN to lock the app'
              : 'Enter the same PIN again'}
          </Text>

          {error ? (
            <Text style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>
              {error}
            </Text>
          ) : null}

          <PinPad value={currentPin} onChange={handlePinChange} maxLength={6} />
        </View>
      </SafeAreaView>
    </Modal>
  );
});

type StyleDeps = Pick<ReturnType<typeof useTheme>, 'colors' | 'spacing'>;

function createStyles({ colors, spacing }: StyleDeps) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    cancelBtn: {
      alignSelf: 'flex-end',
      padding: spacing('4'),
    },
    cancelText: {
      fontSize: 16,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('6'),
      paddingBottom: spacing('12'),
    },
    title: {
      fontSize: 28,
    },
    subtitle: {
      fontSize: 14,
      opacity: 0.7,
      textAlign: 'center',
    },
    error: {
      fontSize: 13,
    },
  });
}
