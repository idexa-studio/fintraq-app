import { Header, Message, Screen, Text, useStyles, useToast } from '@/design';
import type { KeypadKey, Theme } from '@/design';
import { PinPad } from '@/features/lock/components/PinPad';
import { useAppLock } from '@/features/lock/LockProvider';
import { PIN_LENGTH, isCompletePin, pinAfter, pinSetupAfter } from '@/features/lock/lock-rules';
import type { PinSetup } from '@/features/lock/lock-rules';
import { LockStorage } from '@/platform/lock/lock-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** Choosing a PIN: typed once, then again to make sure. Saving it turns the PIN lock on. */
export function PinSetupScreen() {
  const { t } = useTranslation('lock');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { enableLock } = useAppLock();
  const [setup, setSetup] = useState<PinSetup>({ step: 'choose' });
  const [pin, setPin] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const press = async (key: KeypadKey) => {
    const next = pinAfter(pin, key);
    setMismatch(false);
    setPin(next);
    if (!isCompletePin(next)) return;
    const result = pinSetupAfter(setup, next);
    setPin('');
    if (result.kind === 'done') {
      await LockStorage.setPin(result.pin);
      await enableLock('pin');
      toast.show({ message: t('setup.done.pin') });
      close();
      return;
    }
    setSetup(result.setup);
    setMismatch(result.kind === 'mismatch');
  };

  const confirming = setup.step === 'confirm';
  return (
    <Screen sheet scroll={false} header={<Header task title={t('pin.title')} onClose={close} closeLabel={t('pin.close')} />}>
      <View style={styles.centre}>
        <Message title={t(confirming ? 'pin.confirmTitle' : 'pin.chooseTitle')} body={t(confirming ? 'pin.confirmBody' : 'pin.chooseBody')} />
        {/* The line is always there, so the pad does not jump when it has something to say. */}
        <Text variant="callout" tone="danger" align="center" style={styles.said} accessibilityLiveRegion="polite">{mismatch ? t('pin.mismatch') : ' '}</Text>
        <PinPad pin={pin} onKey={press} marksLabel={t('unlock.marks', { count: pin.length, total: PIN_LENGTH })} deleteLabel={t('unlock.delete')} />
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center', gap: space.lg },
    said: { minHeight: space.xl },
  });
