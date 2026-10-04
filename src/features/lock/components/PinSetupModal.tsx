import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { PinPad } from './PinPad';
import { useTranslation } from 'react-i18next';

type Step = 'enter' | 'confirm';

type PinSetupModalProps = {
  visible: boolean;
  onCancel: () => void;
  onComplete: (pin: string) => void;
};

export const PinSetupModal = React.memo(function PinSetupModal({ visible, onCancel, onComplete }: PinSetupModalProps) {
  const { spacing } = useTheme();
  const styles = useMemo(() => createStyles({ spacing }), [spacing]);

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
          <Text variant="title" align="center">
            {step === 'enter' ? t('lock.createPin') : t('lock.confirmPin')}
          </Text>
          <Text variant="body" tone="muted" align="center">
            {step === 'enter' ? t('lock.choosePin') : t('lock.reenterPin')}
          </Text>

          {error ? (
            <Text variant="callout" tone="danger" align="center">
              {error}
            </Text>
          ) : null}

          <PinPad value={currentPin} onChange={handlePinChange} maxLength={6} />
        </View>
      </Screen>
    </Modal>
  );
});

type StyleDeps = Pick<ReturnType<typeof useTheme>, 'spacing'>;

function createStyles({ spacing }: StyleDeps) {
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
  });
}
