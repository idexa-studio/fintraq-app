import { Button, Checklist, Message, Screen, pastelOf, useStyles } from '@/design';
import type { Theme } from '@/design';
import { WalletStack } from '@/features/accounts';
import { Analytics } from '@/platform/telemetry';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { getDeviceCurrencyCode } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** The first thing a new install shows: what the app is, the way in, and the way back for someone returning. */
export function WelcomeScreen() {
  const { t } = useTranslation('firstRun');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const currency = getDeviceCurrencyCode();
  const tint = (name: string) => pastelOf(OFFERED_COLORS.find((color) => color.name === name)?.hex ?? OFFERED_COLORS[0]!.hex);

  useEffect(() => {
    Analytics.track('tutorial_begin');
  }, []);

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button label={t('welcome.start')} onPress={() => router.push('/(onboarding)/setup')} />
          <Button label={t('welcome.restore')} variant="secondary" onPress={() => router.push('/(onboarding)/restore')} />
        </>
      }
    >
      <View style={styles.centre}>
        {/* The app's own picture of accounts, with made-up figures in the phone's currency. */}
        <View style={styles.picture} accessible accessibilityRole="image" accessibilityLabel={t('welcome.picture')}>
          <WalletStack
            cards={[
              { key: 'savings', name: t('welcome.sample.savings'), amount: formatCurrency(12400, currency), color: tint('blue') },
              { key: 'bank', name: t('welcome.sample.bank'), amount: formatCurrency(3150.75, currency), color: tint('orange') },
              { key: 'cash', name: t('welcome.sample.cash'), detail: t('welcome.sample.everyday'), amount: formatCurrency(240, currency), color: tint('purple'), icon: 'cash' },
            ]}
          />
        </View>
        <Message title={t('welcome.title')} body={t('welcome.body')} />
        <Checklist items={[t('welcome.points.free'), t('welcome.points.private'), t('welcome.points.quick')]} />
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center', gap: space.xl },
    // Narrower than the page, so it reads as a picture of the app and not a control.
    picture: { paddingHorizontal: space.xl },
  });
