import { Button, Card, Checklist, Emblem, Message, Screen, useStyles } from '@/design';
import type { Theme } from '@/design';
import { Analytics } from '@/platform/telemetry';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** The first thing a new install shows: what the app is, the way in, and the way back for someone returning. */
export function WelcomeScreen() {
  const { t } = useTranslation('firstRun');
  const styles = useStyles(createStyles);
  const router = useRouter();

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
        <Message illustration={<Emblem icon="wallet" />} title={t('welcome.title')} body={t('welcome.body')} />
        {/* The checklist brings its own padding. */}
        <Card padded={false}>
          <Checklist items={[t('welcome.points.free'), t('welcome.points.private'), t('welcome.points.quick')]} />
        </Card>
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center', gap: space.xxl },
  });
