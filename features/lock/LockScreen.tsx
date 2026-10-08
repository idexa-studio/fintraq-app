import { Button, Emblem, Message, Screen, Spinner, Text, useStyles } from '@/design';
import type { KeypadKey, Theme } from '@/design';
import { PinPad } from '@/features/lock/components/PinPad';
import { PIN_LENGTH, isCompletePin, pinAfter } from '@/features/lock/lock-rules';
import { LockStorage } from '@/platform/lock/lock-storage';
import { formatLockoutRemaining } from '@/platform/lock/pin-lockout';
import { authenticateWithBiometrics, canAuthenticateOnDevice, getBiometricCapability } from '@/platform/lock/useLocalAuth';
import type { BiometricCapability } from '@/platform/lock/useLocalAuth';
import { LoggerService } from '@/shared/logging/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** `device`: the system prompt (biometrics, or the phone's own screen lock). `pin`: the app's PIN. */
type Way = 'finding' | 'device' | 'pin';

/**
 * What stands between a locked app and its records. It asks the way the lock
 * was set up: the system's prompt for a biometric lock, the app's own PIN pad
 * for a PIN lock. Wrong PINs are counted where a restart cannot reset them.
 */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useTranslation('lock');
  const styles = useStyles(createStyles);
  const [way, setWay] = useState<Way>('finding');
  const [biometry, setBiometry] = useState<BiometricCapability['biometryType']>('none');
  const [pin, setPin] = useState('');
  const [said, setSaid] = useState<'wrong' | 'failed' | null>(null);
  const [asking, setAsking] = useState(false);
  // Too many wrong PINs: the pad waits until this moment. 0 means it is not waiting.
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const waiting = Math.max(0, waitUntil - now);

  useEffect(() => {
    void LockStorage.getPinLockoutUntil().then(setWaitUntil);
  }, []);

  useEffect(() => {
    if (waitUntil === 0) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= waitUntil) setWaitUntil(0);
    }, 1000);
    return () => clearInterval(timer);
  }, [waitUntil]);

  const askDevice = useCallback(async () => {
    setAsking(true);
    setSaid(null);
    try {
      if (await authenticateWithBiometrics(t('unlock.prompt'))) onUnlock();
      else setSaid('failed');
    } finally {
      setAsking(false);
    }
  }, [onUnlock, t]);

  useEffect(() => {
    let gone = false;
    void (async () => {
      if ((await LockStorage.getLockMode()) !== 'biometric') {
        setWay('pin');
        return;
      }
      // A biometric lock has no app PIN. If fingerprints or faces were removed since, the system
      // prompt still takes the phone's own screen lock, so keep asking it rather than show a
      // PIN pad nothing can satisfy.
      const [biometrics, canAsk, hasPin] = await Promise.all([getBiometricCapability(), canAuthenticateOnDevice(), LockStorage.hasPin()]);
      if (gone) return;
      if (canAsk) {
        setBiometry(biometrics.biometryType);
        setWay('device');
        void askDevice();
        return;
      }
      if (hasPin) {
        setWay('pin');
        return;
      }
      // No screen lock left on the phone and no app PIN: nothing can say who this is. Removing
      // a screen lock already took the phone's credential, so let them in rather than lock
      // them out of their own records for good.
      LoggerService.warn('APP_LOCK', 'Biometric lock is on but the phone has no screen lock; unlocking');
      onUnlock();
    })();
    return () => {
      gone = true;
    };
    // Asked once, when the lock screen appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = async (key: KeypadKey) => {
    const next = pinAfter(pin, key);
    setSaid(null);
    setPin(next);
    if (!isCompletePin(next)) return;
    if (await LockStorage.verifyPin(next)) {
      onUnlock();
      return;
    }
    setPin('');
    setSaid('wrong');
    setWaitUntil(await LockStorage.getPinLockoutUntil());
  };

  if (way === 'finding') {
    return <Screen scroll={false}><View style={styles.waiting}><Spinner /></View></Screen>;
  }

  const message = waiting > 0 ? t('unlock.wait', { time: formatLockoutRemaining(waiting) }) : said ? t(`unlock.${said}`) : null;

  return (
    <Screen
      centred
      footer={way === 'device' ? <Button label={biometry === 'none' ? t('unlock.device') : t(`unlock.${biometry}`)} loading={asking} onPress={askDevice} /> : undefined}
    >
      <View style={styles.centre}>
        <Message illustration={<Emblem icon="lock-key" />} title={way === 'pin' ? t('unlock.pinTitle') : t('unlock.deviceTitle')} body={way === 'device' ? t('unlock.deviceBody') : undefined} />
        {/* The line is always there, so the pad does not jump when it has something to say. */}
        <Text variant="callout" tone="danger" align="center" style={styles.said} accessibilityLiveRegion="polite">{message ?? ' '}</Text>
        {way === 'pin' ? <PinPad pin={pin} onKey={press} disabled={waiting > 0} marksLabel={t('unlock.marks', { count: pin.length, total: PIN_LENGTH })} deleteLabel={t('unlock.delete')} /> : null}
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { gap: space.lg },
    waiting: { flex: 1, justifyContent: 'center' },
    said: { minHeight: space.xl },
  });
