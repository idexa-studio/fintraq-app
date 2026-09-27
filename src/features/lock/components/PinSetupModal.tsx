import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { PinPad } from './PinPad';
import { useTranslation } from 'react-i18next';

type Step = 'enter' | 'confirm';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onComplete: (pin: string) => void;
};

export const PinSetupModal = React.memo(function PinSetupModal({ visible, onCancel, onComplete }: Props) {
  const { colors, typography, spacing } = useTheme();
  const styles = useMemo(() => createStyles({ colors, spacing, typography }), [colors, spacing, typography]);

  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

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
        setError(t('lock.pinMismatch'));
        setCurrentPin('');
        setStep('enter');
        setFirstPin('');
      }
    }
  }, [step, firstPin, reset, onComplete, t]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleCancel}>
      <Screen variant="fixed" edges={['top', 'right', 'bottom', 'left']}>
        <Button title={t('common.cancel')} onPress={handleCancel} variant="ghost" style={styles.cancelAction} />

        <View style={styles.content}>
          <Text style={[styles.title, { fontFamily: typography.styles.dialogTitle.fontFamily, color: colors.text }]}>
            {step === 'enter' ? t('lock.createPin') : t('lock.confirmPin')}
          </Text>
          <Text style={[styles.subtitle, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            {step === 'enter'
              ? t('lock.choosePin')
              : t('lock.reenterPin')}
          </Text>

          {error ? (
            <Text style={[styles.error, { fontFamily: typography.fonts.medium, color: colors.danger }]}>
              {error}
            </Text>
          ) : null}

          <PinPad value={currentPin} onChange={handlePinChange} maxLength={6} />
        </View>
      </Screen>
    </Modal>
  );
});

type StyleDeps = Pick<ReturnType<typeof useTheme>, 'colors' | 'spacing' | 'typography'>;

function createStyles({ colors, spacing, typography }: StyleDeps) {
  return StyleSheet.create({
    cancelAction: {
      alignSelf: 'flex-end',
      padding: spacing('4'),
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('6'),
      paddingBottom: spacing('12'),
    },
    title: {
      ...typography.metrics.xxxl,
    },
    subtitle: {
      ...typography.metrics.md,
      color: colors.textMuted,
      textAlign: 'center',
    },
    error: {
      ...typography.metrics.sm,
    },
  });
}
