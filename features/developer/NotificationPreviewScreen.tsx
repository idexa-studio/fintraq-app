import { Card, Header, Screen, Section, Text, useTheme, useToast } from '@/design';
import { notificationPreviews } from '@/platform/notifications/notification-previews';
import type { NotificationPreview } from '@/platform/notifications/notification-previews';
import { NotificationService } from '@/platform/notifications/notifications';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';

const GROUPS: { name: NotificationPreview['group']; hint: string }[] = [
  { name: 'Daily reminder', hint: 'One a day at the chosen time, and none on a day already recorded. A tap opens Add expense.' },
  { name: 'Loans', hint: 'Set per loan. A tap opens the loan.' },
  { name: 'Backup', hint: 'A backup that works says nothing. A tap opens Backup.' },
];

/** Every notification the app can send, worded from sample records. Tap one to receive it. English only. */
export function NotificationPreviewScreen() {
  const router = useRouter();
  const toast = useToast();
  const { space } = useTheme();
  const previews = useMemo(() => notificationPreviews(), []);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const send = async (preview: NotificationPreview) => {
    if (!(await NotificationService.requestPermissions())) {
      toast.show({ message: 'Notifications are off for Fintraq' });
      return;
    }
    await preview.send();
    toast.show({ message: 'Sent. Pull down the shade to read it.' });
  };

  return (
    <Screen header={<Header title="Notifications" onBack={back} />}>
      {GROUPS.map((group) => (
        <Section key={group.name} title={group.name} hint={group.hint}>
          {previews.filter((preview) => preview.group === group.name).map((preview) => (
            <Card key={preview.id} compact onPress={() => void send(preview)} accessibilityLabel={`${preview.title}. ${preview.body}`} style={{ gap: space.xxs }}>
              <Text variant="caption" tone="muted">{preview.when}</Text>
              <Text variant="bodyStrong">{preview.title}</Text>
              <Text variant="callout">{preview.body}</Text>
            </Card>
          ))}
        </Section>
      ))}
    </Screen>
  );
}
