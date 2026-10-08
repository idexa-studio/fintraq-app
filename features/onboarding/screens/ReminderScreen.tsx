import { Button, Card, IconCircle, Message, Notice, Screen, Text, useStyles } from '@/design';
import type { Theme } from '@/design';
import { useSettings } from '@/features/settings';
import { NotificationService } from '@/platform/notifications/notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** The last step of the way in: the offer of a daily reminder, which needs the system's permission. */
export function ReminderScreen() {
  const { t } = useTranslation('firstRun');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { updateProfile } = useSettings();
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  // Named in full: inside the way in, "/" is the welcome screen, not Home.
  const enter = () => router.replace('/(main)/(tabs)');

  const accept = async () => {
    setAsking(true);
    if (await NotificationService.requestPermissions()) {
      // Saving the profile is what schedules the reminder.
      await updateProfile({ reminderEnabled: true });
      enter();
      return;
    }
    setAsking(false);
    setDenied(true);
  };

  return (
    <Screen
      centred
      footer={
        denied ? (
          <Button label={t('reminder.carryOn')} onPress={enter} />
        ) : (
          <>
            <Button label={t('reminder.yes')} loading={asking} onPress={accept} />
            <Button label={t('reminder.no')} variant="secondary" disabled={asking} onPress={enter} />
          </>
        )
      }
    >
      <View style={styles.centre}>
        {/* The reminder as it will arrive, rather than a picture of a bell. */}
        <Card style={styles.sample} accessibilityLabel={t('reminder.sample.label')}>
          <IconCircle icon="bell" color="green" />
          <View style={styles.sampleText}>
            <Text variant="caption" tone="muted">{t('reminder.sample.app')}</Text>
            <Text variant="bodyStrong">{t('reminder.sample.title')}</Text>
            <Text variant="callout">{t('reminder.sample.body')}</Text>
          </View>
        </Card>
        <Message title={t('reminder.title')} body={t('reminder.body')} />
        {denied ? <Notice tone="warning" title={t('reminder.deniedTitle')} body={t('reminder.deniedBody')} /> : null}
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { gap: space.xxl },
    sample: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    sampleText: { flex: 1, gap: space.xxs },
  });
