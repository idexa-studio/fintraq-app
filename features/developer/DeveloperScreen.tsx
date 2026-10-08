import { seedDummyData } from '@/data/seed/demo-data';
import { Badge, Button, Card, CheckMark, Dialog, Header, ListGroup, ListRow, Notice, Screen, Section, Text, useStyles, useToast } from '@/design';
import type { Theme } from '@/design';
import { runAutoBackupIfDue } from '@/platform/backup/auto-backup';
import { BackupPreferences } from '@/platform/backup/backup-preferences';
import { restartApp } from '@/platform/config/restart';
import { GoogleDriveService } from '@/platform/drive/google-drive';
import { IS_PREMIUM_OVERRIDE_ALLOWED } from '@/platform/purchases/dev-override';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import { toErrorMessage } from '@/shared/errors';
import { LoggerService } from '@/shared/logging/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type Override = 'DEFAULT' | 'FORCED_ON' | 'FORCED_OFF';
const OVERRIDES: { key: Override; title: string; subtitle: string }[] = [
  { key: 'DEFAULT', title: 'As the store says', subtitle: 'Pro follows the saved purchase' },
  { key: 'FORCED_ON', title: 'Always Pro', subtitle: 'Treat this install as Pro' },
  { key: 'FORCED_OFF', title: 'Always free', subtitle: 'Treat this install as free, whatever was bought' },
];

type Asking = 'seed' | 'deleteBackup' | 'clearLogs' | null;

/**
 * Tools for testing and debugging, in English only. A development build reaches it from About;
 * a release build has no way in from the app and opens it only by link
 * (`adb shell am start -d luno://developer`). Nothing a release build shows here can change a
 * user's records or unlock Pro.
 */
export function DeveloperScreen() {
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const [override, setOverride] = useState<Override>('DEFAULT');
  const [asking, setAsking] = useState<Asking>(null);
  const [working, setWorking] = useState(false);
  const [said, setSaid] = useState<{ tone: 'positive' | 'danger' | 'info'; title: string; body?: string } | null>(null);
  const [logCount, setLogCount] = useState(0);
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const readScheduled = useCallback(() => void Notifications.getAllScheduledNotificationsAsync().then(setScheduled, () => setScheduled([])), []);

  useEffect(() => {
    void AsyncStorage.getItem(StorageKeys.PREMIUM_DEV_OVERRIDE).then((saved) => setOverride(saved === 'FORCED_ON' || saved === 'FORCED_OFF' ? saved : 'DEFAULT'));
    readScheduled();
  }, [readScheduled]);
  // The log grows while other screens are open.
  useFocusEffect(useCallback(() => setLogCount(LoggerService.getLogCount()), []));

  const chooseOverride = async (next: Override) => {
    if (next === override) return;
    await AsyncStorage.setItem(StorageKeys.PREMIUM_DEV_OVERRIDE, next);
    setOverride(next);
    // Every screen reads Pro at its own moment; starting again is the one way they all agree.
    if (!(await restartApp())) toast.show({ message: 'Saved. Restart the app to apply it.' });
  };

  const seed = async () => {
    setWorking(true);
    try {
      const count = await seedDummyData();
      setAsking(null);
      if (!(await restartApp())) setSaid({ tone: 'positive', title: `Added ${count} transactions`, body: 'Restart the app to see them everywhere.' });
    } catch (e) {
      setAsking(null);
      setSaid({ tone: 'danger', title: 'Demo data was not added', body: toErrorMessage(e, 'The seeder failed.') });
    } finally {
      setWorking(false);
    }
  };

  const deleteBackup = async () => {
    setWorking(true);
    try {
      const deleted = await GoogleDriveService.deleteBackup();
      await BackupPreferences.clearBackupCache();
      setSaid(deleted ? { tone: 'positive', title: 'The backup in Google Drive was deleted' } : { tone: 'info', title: 'There was no backup in Google Drive' });
    } catch (e) {
      setSaid({ tone: 'danger', title: 'The backup was not deleted', body: toErrorMessage(e, 'Google Drive refused.') });
    } finally {
      setWorking(false);
      setAsking(null);
    }
  };

  const runAutoBackup = async () => {
    try {
      const result = await runAutoBackupIfDue(true);
      const detail = result.outcome === 'skipped' ? `Skipped: ${result.reason}` : result.outcome === 'failed' ? toErrorMessage(result.error, 'It failed.') : undefined;
      setSaid({ tone: result.outcome === 'ran' ? 'positive' : 'info', title: `Automatic backup: ${result.outcome}`, body: detail });
    } catch (e) {
      setSaid({ tone: 'danger', title: 'Automatic backup could not run', body: toErrorMessage(e, 'It failed.') });
    }
  };

  const clearLogs = () => {
    LoggerService.clearLogs();
    setLogCount(LoggerService.getLogCount());
    setAsking(null);
    toast.show({ message: 'Logs cleared' });
  };

  return (
    <Screen header={<Header title="Developer" onBack={back} />}>
      <Card style={styles.build}>
        <View style={styles.buildText}>
          <Text variant="bodyStrong">Developer tools</Text>
          <Text variant="callout" tone="muted">{__DEV__ ? 'Changes here affect the whole app.' : 'A release build: diagnostics only.'}</Text>
        </View>
        <Badge label={__DEV__ ? 'Development' : 'Release'} tone={__DEV__ ? 'accent' : 'neutral'} />
      </Card>

      {said ? <Notice tone={said.tone} title={said.title} body={said.body} /> : null}

      <Section title="Design" hint="Every component and state, in light and dark">
        <ListGroup>
          <ListRow icon="palette" title="Design gallery" onPress={() => router.push('/design-gallery')} />
        </ListGroup>
      </Section>

      {IS_PREMIUM_OVERRIDE_ALLOWED ? (
        <Section title="Pro" hint="Which plan this install behaves as. The app starts again when you change it.">
          <ListGroup>
            {OVERRIDES.map((option) => (
              <ListRow key={option.key} title={option.title} subtitle={option.subtitle} trailing={override === option.key ? <CheckMark /> : undefined} onPress={() => void chooseOverride(option.key)} />
            ))}
          </ListGroup>
        </Section>
      ) : null}

      {/* Tools that write or delete a user's records never ship: a release build keeps only what is below this section. */}
      {__DEV__ ? (
        <Section title="Data" hint="These change what is stored. Development builds only.">
          <ListGroup>
            <ListRow icon="flask" title="Add demo data" subtitle="A year of transactions, six accounts, people and loans" onPress={() => setAsking('seed')} />
            <ListRow icon="cloud-arrow-up" title="Run automatic backup now" subtitle="The same check the background task runs" onPress={() => void runAutoBackup()} />
            <ListRow icon="trash" destructive title="Delete the backup in Google Drive" subtitle="Cannot be undone" onPress={() => setAsking('deleteBackup')} />
          </ListGroup>
        </Section>
      ) : null}

      <Section title="Logs" hint="What the app noted while running, kept on this phone">
        <ListGroup>
          <ListRow icon="file-text" title="Open the log" value={String(logCount)} onPress={() => router.push('/app-logs')} />
          <ListRow icon="trash" destructive title="Clear the log" disabled={logCount === 0} onPress={() => setAsking('clearLogs')} />
        </ListGroup>
      </Section>

      <Section title="Notifications" hint="What is scheduled with the system right now">
        <ListGroup>
          {scheduled.length === 0 ? <ListRow icon="bell" title="Nothing scheduled" /> : null}
          {scheduled.map((request) => <ListRow key={request.identifier} icon="bell" title={request.content.title || 'Reminder'} subtitle={request.content.body ?? undefined} />)}
          <ListRow icon="bell" title="Read every notification" subtitle="Each one, sent on tap" onPress={() => router.push('/notification-previews')} />
          <ListRow icon="refresh" title="Read the schedule again" onPress={readScheduled} />
        </ListGroup>
      </Section>

      <Section title="System">
        <ListGroup>
          <ListRow icon="info" title="Build" value={__DEV__ ? 'Development' : 'Release'} />
          <ListRow icon="smartphone" title="Platform" value={Platform.OS === 'ios' ? 'iOS' : 'Android'} />
        </ListGroup>
      </Section>

      <Dialog visible={asking === 'seed'} onRequestClose={working ? undefined : () => setAsking(null)} title="Add demo data?" body="A year of demo transactions, six accounts, people and loans are added to what is already here. The app then starts again.">
        <Button label="Add demo data" loading={working} onPress={seed} />
        <Button label="Cancel" variant="secondary" disabled={working} onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'deleteBackup'} onRequestClose={working ? undefined : () => setAsking(null)} title="Delete the backup in Google Drive?" body="The backup file is removed from the connected Drive. This cannot be undone.">
        <Button label="Delete the backup" variant="danger" loading={working} onPress={deleteBackup} />
        <Button label="Keep it" variant="secondary" disabled={working} onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'clearLogs'} onRequestClose={() => setAsking(null)} title="Clear the log?" body="Every log line kept on this phone is erased.">
        <Button label="Clear the log" variant="danger" onPress={clearLogs} />
        <Button label="Keep it" variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    build: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    buildText: { flex: 1, gap: space.xs },
  });
