import { Button, Card, Dialog, Emblem, Header, ListGroup, ListRow, MarkGrid, Screen, Section, Text, useStyles, useToast } from '@/design';
import type { Mark, Theme } from '@/design';
import { useAppLock } from '@/features/lock/LockProvider';
import { authenticateWithBiometrics, getBiometricCapability } from '@/platform/lock/useLocalAuth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Choice = 'off' | 'biometric' | 'pin';

/**
 * Where the lock is chosen. The screen opens on what the lock does now, in
 * words, then offers the ways to unlock as marks to pick from. Fingerprint
 * or face is offered only on a phone that has one set up.
 */
export function AppLockScreen() {
  const { t } = useTranslation('lock');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { lockMode, enableLock, disableLock } = useAppLock();
  const current: Choice = lockMode ?? 'off';
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean | null>(null);
  const [confirmingOff, setConfirmingOff] = useState(false);

  useEffect(() => {
    void getBiometricCapability().then((capability) => setCanUseBiometrics(capability.available), () => setCanUseBiometrics(false));
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const turnOff = async () => {
    setConfirmingOff(false);
    await disableLock();
    toast.show({ message: t('setup.done.off') });
  };

  const choose = async (choice: Choice) => {
    if (choice === current) return;
    if (choice === 'pin') {
      router.push('/settings/pin');
      return;
    }
    if (choice === 'biometric') {
      if (!(await authenticateWithBiometrics(t('setup.confirmOn')))) return;
      await enableLock('biometric');
      toast.show({ message: t('setup.done.biometric') });
      return;
    }
    // Turning a biometric lock off asks the same way it unlocks; a PIN lock asks in words.
    if (current === 'biometric' && canUseBiometrics) {
      if (await authenticateWithBiometrics(t('setup.confirmOff'))) await turnOff();
      return;
    }
    setConfirmingOff(true);
  };

  const marks: Mark<Choice>[] = [
    { key: 'off', label: t('setup.modes.off'), icon: 'lock-open', color: 'teal' },
    ...(canUseBiometrics ? [{ key: 'biometric' as const, label: t('setup.modes.biometric'), icon: 'fingerprint' as const, color: 'lilac' as const }] : []),
    { key: 'pin', label: t('setup.modes.pin'), icon: 'password', color: 'orange' },
  ];

  return (
    <Screen header={<Header title={t('setup.title')} onBack={back} backLabel={t('setup.back')} />}>
      <Card style={styles.state}>
        <Emblem icon={current === 'off' ? 'lock-open' : 'lock-key'} />
        <View style={styles.stateText}>
          <Text variant="title" align="center" accessibilityRole="header">{t(`setup.state.${current}`)}</Text>
          <Text variant="callout" tone="muted" align="center">{t(current === 'off' ? 'setup.stateBody.off' : 'setup.stateBody.on')}</Text>
        </View>
      </Card>

      <Section title={t('setup.choose')} hint={t('setup.chooseHint')}>
        <Card>
          <MarkGrid marks={marks} selectedKey={current} onSelect={choose} />
        </Card>
        {canUseBiometrics === false ? <Text variant="callout" tone="muted">{t('setup.noBiometrics')}</Text> : null}
        {current === 'pin' ? (
          <ListGroup>
            <ListRow icon="password" title={t('setup.changePin')} subtitle={t('setup.changePinHint')} onPress={() => router.push('/settings/pin')} />
          </ListGroup>
        ) : null}
      </Section>

      <Dialog visible={confirmingOff} onRequestClose={() => setConfirmingOff(false)} title={t('setup.offTitle')} body={t('setup.offBody')}>
        <Button label={t('setup.offConfirm')} variant="danger" onPress={turnOff} />
        <Button label={t('setup.offKeep')} variant="secondary" onPress={() => setConfirmingOff(false)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    state: { alignItems: 'center', gap: space.lg, paddingVertical: space.xl },
    stateText: { gap: space.xs },
  });
