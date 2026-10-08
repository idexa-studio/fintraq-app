import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import type { IconSource } from '@/src/components/ui';
import {
  AlertButton,
  AlertDialog,
  Badge,
  ConfirmDialog,
  IconAvatar,
  Input,
  ListGroup,
  ListItem,
  Screen,
  Text,
} from '@/src/components/ui';
import { useKeyboardInset } from '@/src/hooks/useKeyboardInset';
import { IS_PREMIUM_OVERRIDE_ALLOWED } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { runAutoBackupIfDue } from '@/src/services/backup/auto-backup.service';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import { LoggerService } from '@/shared/logging/logger';
import { NotificationService } from '@/src/services/notification.service';
import { toErrorMessage } from '@/shared/errors';
import { seedDummyData } from '@/src/utils/seed';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useCallback, useMemo } from 'react';
import { DevSettings, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEV_PIN = '32159';

/* ── DeveloperScreen ────────────────────────────────────────── */

export const DeveloperScreen = React.memo(function DeveloperScreen() {
  const router = useRouter();
  const theme = useTheme();
  const keyboardInset = useKeyboardInset(true, useSafeAreaInsets().bottom);
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { devOverride, setDevOverride } = usePremium();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [showDeleteBackupConfirm, setShowDeleteBackupConfirm] = React.useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = React.useState(false);
  const [showClearLogsConfirm, setShowClearLogsConfirm] = React.useState(false);
  const [scheduledNotifs, setScheduledNotifs] = React.useState<Notifications.NotificationRequest[]>([]);
  const [logCount, setLogCount] = React.useState<number>(0);

  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback(
    (config: {
      title: string;
      message?: string;
      type?: 'info' | 'success' | 'error' | 'warning';
      buttons?: AlertButton[];
    }) => {
      setAlertConfig({
        visible: true,
        title: config.title,
        message: config.message,
        type: config.type || 'info',
        buttons: config.buttons || [{ text: 'OK' }],
      });
    },
    [],
  );

  const fetchLogs = React.useCallback(async () => {
    setLogCount(LoggerService.getLogCount());
  }, []);

  const handleClearAllLogs = React.useCallback(async () => {
    await LoggerService.clearLogs();
    await fetchLogs();
    setShowClearLogsConfirm(false);
    showAlert({
      title: 'Logs Cleared',
      message: 'All system log records have been erased from storage.',
      type: 'success',
    });
  }, [fetchLogs, showAlert]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated, fetchLogs]);

  const handleRunAutoBackupTask = async () => {
    try {
      const res = await runAutoBackupIfDue(true);
      showAlert({
        title: 'Dev Auto-Backup Task',
        message: `Execution outcome: ${res.outcome.toUpperCase()}${res.outcome === 'skipped' ? ` (${res.reason})` : ''}${res.outcome === 'failed' && res.error instanceof Error ? `\n${res.error.message}` : ''}`,
        type: res.outcome === 'ran' ? 'success' : 'info',
      });
    } catch (err) {
      showAlert({
        title: 'Dev Auto-Backup Error',
        message: toErrorMessage(err, 'Failed to execute auto-backup task'),
        type: 'error',
      });
    }
  };

  const handleDeleteBackup = async () => {
    try {
      setIsDeletingBackup(true);
      const deleted = await GoogleDriveService.deleteBackup();
      await BackupPreferences.clearBackupCache();
      setShowDeleteBackupConfirm(false);
      if (deleted) {
        showAlert({
          title: 'Success',
          message: 'Cloud backup file has been permanently deleted from Google Drive.',
          type: 'success',
        });
      } else {
        showAlert({
          title: 'No Backup Found',
          message: 'No backup file was found on Google Drive.',
          type: 'info',
        });
      }
    } catch (e) {
      setShowDeleteBackupConfirm(false);
      showAlert({
        title: 'Error',
        message: toErrorMessage(e, 'Failed to delete backup from Google Drive.'),
        type: 'error',
      });
    } finally {
      setIsDeletingBackup(false);
    }
  };

  const fetchScheduled = useCallback(async () => {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    setScheduledNotifs(list);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchScheduled();
  }, [isAuthenticated, fetchScheduled]);

  const handlePinChange = (val: string) => {
    setPin(val);
    setError('');
    if (val === DEV_PIN) {
      setIsAuthenticated(true);
    } else if (val.length >= DEV_PIN.length) {
      setError('Invalid access token');
      setTimeout(() => setPin(''), 800);
    }
  };

  const handleRunSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedDummyData();
      showAlert({
        title: 'Success',
        message: `Generated ${count} transactions. The app will reload to sync.`,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (reloadErr) {
                LoggerService.warn('DEV_SCREEN', 'Updates.reloadAsync warning (fallback to DevSettings)', reloadErr);
                if (DevSettings?.reload) {
                  DevSettings.reload();
                }
              }
            },
          },
        ],
      });
      setShowSeedConfirm(false);
    } catch (e) {
      showAlert({
        title: 'Error',
        message: toErrorMessage(e, 'Failed to generate seed data.'),
        type: 'error',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  /* ── Lock screen ── */

  if (!isAuthenticated) {
    return (
      <Screen header={{ title: 'Developer', showBack: true }} variant="fixed" edges={['top', 'bottom']}>
        {/* Keyboard pushes the whole column up so the hint never hides behind the field. */}
        <View style={[styles.lockShell, { paddingBottom: keyboardInset }]}>
          <View style={styles.lockArt}>
            <IconAvatar icon="lock-key" color={colors.primaryInk} size={72} iconSize={30} weight="duotone" />
            <Text variant="label" tone="primary">SECURE GATEWAY</Text>
            <Text variant="title" align="center">Developer tools</Text>
            <Text variant="callout" tone="muted" align="center">
              Internal utilities for testing and debugging. Enter the access token to continue.
            </Text>
          </View>
          <Input
            placeholder="Access token"
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={DEV_PIN.length}
            secureTextEntry
            textAlign="center"
            autoFocus
            error={error}
            variant="filled"
          />
        </View>
      </Screen>
    );
  }

  /* ── Main screen ── */

  const overrideOptions: { mode: 'DEFAULT' | 'FORCED_ON' | 'FORCED_OFF'; label: string; subtitle: string; icon: IconSource; color: string }[] = [
    { mode: 'DEFAULT', label: 'Default', subtitle: 'Sync with App Store / Play Store', icon: 'arrows-clockwise', color: colors.textMuted },
    { mode: 'FORCED_ON', label: 'Force enabled', subtitle: 'Treat as active Pro subscription', icon: 'seal-check', color: colors.success },
    { mode: 'FORCED_OFF', label: 'Force disabled', subtitle: 'Treat as free tier regardless', icon: 'x-circle', color: colors.danger },
  ];

  return (
    <Screen
      header={{ title: 'Developer', showBack: true }}
      overlays={
        <>
          <ConfirmDialog
            visible={showSeedConfirm}
            onClose={() => setShowSeedConfirm(false)}
            title="Seed test data"
            message="This adds a year of demo transactions, six accounts, people and loans. Proceed?"
            confirmLabel="Generate"
            destructive={false}
            isLoading={isSeeding}
            onConfirm={handleRunSeed}
          />
          <ConfirmDialog
            visible={showDeleteBackupConfirm}
            onClose={() => setShowDeleteBackupConfirm(false)}
            title="Delete Cloud Backup"
            message="This will permanently delete your database backup file from Google Drive. This action cannot be undone. Proceed?"
            confirmLabel="Delete"
            destructive
            isLoading={isDeletingBackup}
            onConfirm={handleDeleteBackup}
          />
          <ConfirmDialog
            visible={showClearLogsConfirm}
            onClose={() => setShowClearLogsConfirm(false)}
            title="Clear System Logs"
            message="This will permanently erase all system log records from device storage. Proceed?"
            confirmLabel="Clear Logs"
            destructive
            onConfirm={handleClearAllLogs}
          />
          <AlertDialog
            visible={alertConfig.visible}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            buttons={alertConfig.buttons}
            onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
          />
        </>
      }
    >
      <View style={styles.badgeCard}>
        <View style={styles.badgeDot} />
        <View style={styles.badgeInfo}>
          <Text variant="bodyStrong" color={colors.onInk}>Dev tools active</Text>
          <Text variant="caption" color={colors.onInkMuted}>Changes here affect app behaviour globally</Text>
        </View>
        <Badge label={__DEV__ ? 'DEV' : 'PROD'} color={colors.primaryInk} />
      </View>

      <ListGroup title="Design system">
        <ListItem
          icon="palette"
          iconColor={colors.primaryInk}
          title="Design gallery"
          subtitle="Every UI component, variant and state — light & dark"
          onPress={() => router.push('/design-gallery')}
        />
      </ListGroup>

      {IS_PREMIUM_OVERRIDE_ALLOWED && (
        <ListGroup title="Premium override">
          {overrideOptions.map((item) => (
            <ListItem
              key={item.mode}
              icon={item.icon}
              iconColor={devOverride === item.mode ? item.color : colors.textMuted}
              title={item.label}
              subtitle={item.subtitle}
              selected={devOverride === item.mode}
              onPress={() => setDevOverride(item.mode)}
            />
          ))}
        </ListGroup>
      )}

      {/* Tools that write or delete a user's records never ship: a release build keeps only the
          read-only diagnostics below, since the access token is in the bundle. */}
      {__DEV__ && (
        <ListGroup title="Data & Cloud">
          <ListItem icon="flask" iconColor={colors.primaryInk} title="Seed dummy data" subtitle="A year of realistic data: USD, EUR, TRY & INR accounts, people & loans" onPress={() => setShowSeedConfirm(true)} />
          <ListItem icon="cloud" iconColor={colors.primaryInk} title="Run Auto-Backup Task Now" subtitle="Trigger headless auto-backup check executor" onPress={handleRunAutoBackupTask} />
          <ListItem icon="trash" title="Delete Cloud Backup" subtitle="Permanently remove backup file from Google Drive" destructive onPress={() => setShowDeleteBackupConfirm(true)} />
        </ListGroup>
      )}

      <ListGroup title="System logs">
        <ListItem
          icon="file-text"
          iconColor={colors.primaryInk}
          title="Open full-screen app logs"
          subtitle="View & export the raw log stream (.txt)"
          value={`${logCount}`}
          onPress={() => router.push('/(main)/app-logs')}
        />
        <ListItem icon="trash" title="Clear system logs" subtitle="Permanently erase all log records from device storage" destructive onPress={() => setShowClearLogsConfirm(true)} />
      </ListGroup>

      <ListGroup title="Notifications">
        {scheduledNotifs.length === 0 ? (
          <ListItem icon="bell-slash" iconColor={colors.textMuted} title="No active schedules" value="None" />
        ) : (
          scheduledNotifs.map((n) => (
            <ListItem
              key={n.identifier}
              icon="bell"
              iconColor={colors.primaryInk}
              title={n.content.title || 'Scheduled reminder'}
              subtitle={n.content.body || 'Daily check-in alert'}
              trailing={<Badge label="Active" color={colors.success} />}
            />
          ))
        )}
        <ListItem
          icon="bell-ringing"
          iconColor={colors.primaryInk}
          title="Trigger sample notification"
          subtitle="Queue an instant check-in alert"
          onPress={() => {
            NotificationService.triggerInstantNotification();
            showAlert({ title: 'Test Notification', message: 'Instant check-in alert queued.', type: 'info' });
          }}
        />
        <ListItem icon="arrows-clockwise" iconColor={colors.textMuted} title="Refresh schedules" subtitle="Reload notification schedule list" onPress={fetchScheduled} />
      </ListGroup>

      <ListGroup title="System">
        <ListItem icon="gear" iconColor={colors.textMuted} title="Environment" value={__DEV__ ? 'Development' : 'Production'} />
        <ListItem icon={Platform.OS === 'ios' ? 'apple-logo' : 'android-logo'} iconColor={colors.textMuted} title="Platform" value={Platform.OS === 'ios' ? 'iOS' : 'Android'} />
      </ListGroup>

      <View style={styles.footer}>
        <Text variant="label" tone="muted">Fintraq / Dev tools</Text>
        <Text variant="caption" tone="muted">Internal debugging and testing utilities.</Text>
      </View>
    </Screen>
  );
});

/* ── Styles ─────────────────────────────────────────────────── */

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    lockShell: { flex: 1, paddingHorizontal: layout.screenPadding, paddingBottom: spacing('4') },
    lockArt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing('3'), paddingHorizontal: spacing('4') },
    badgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.tabBarBackground,
    },
    badgeDot: { width: 8, height: 8, borderRadius: radius('full'), backgroundColor: colors.success },
    badgeInfo: { flex: 1, gap: 2 },
    footer: { alignItems: 'center', gap: spacing('1'), paddingVertical: spacing('4') },
  });
