import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useCallback, useMemo, useState } from 'react';
import { DevSettings, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertDialog, ConfirmDialog, Spinner, Text } from '@/src/components/ui';
import { useAutoBackupSetting, type SetAutoBackupResult } from '@/src/features/backup/hooks/useAutoBackupSetting';
import { useBackupAccount, useDisconnectBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { useBackupProgress } from '@/src/features/backup/hooks/useBackupProgress';
import { useCloudBackupActions } from '@/src/features/backup/hooks/useCloudBackupActions';
import { useEnableCloudBackup } from '@/src/features/backup/hooks/useEnableCloudBackup';
import { useLatestBackup } from '@/src/features/backup/hooks/useLatestBackup';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { openAppSettings, openBatteryOptimizationSettings } from '@/src/services/backup/battery-optimization';
import { isBackupOverdue } from '@/src/services/backup/backup-schedule';
import { isNoBackupError } from '@/src/services/backup/google-drive.errors';
import { LoggerService } from '@/src/services/logger.service';
import { alpha } from '@/src/theme/tokens';
import { formatBackupTimestamp } from '@/shared/date/date';
import { toErrorMessage } from '@/shared/errors';
import { AutoBackupRow } from './AutoBackupRow';
import { BackupAccountRow } from './BackupAccountRow';
import { BackupActionsRow } from './BackupActionsRow';
import { BackupConnectRow } from './BackupConnectRow';
import { BackupProgressRow } from './BackupProgressRow';
import { BackupStatusRow } from './BackupStatusRow';
import { Analytics } from '@/src/services/telemetry';
import { BackupUpsellRow } from './BackupUpsellRow';

/** The Backup screen's control surface: account, status, manual backup/restore, auto-backup. */
export const GoogleBackupCard = React.memo(function GoogleBackupCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { isPremium, openPaywall } = useProAccess();

  const { account, isLoading: isAccountLoading } = useBackupAccount();
  const { latestBackup, isFromAnotherInstall } = useLatestBackup();
  const { isBackingUp, isRestoring, progress, stage } = useBackupProgress();
  const { autoBackupEnabled, setAutoBackupEnabled } = useAutoBackupSetting();
  const { enableCloudBackup, isEnabling } = useEnableCloudBackup();
  const { mutateAsync: disconnect } = useDisconnectBackupAccount();
  const { backupNow, restoreLatest } = useCloudBackupActions();

  const { showAlert, alertProps } = useAlertDialog();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const openBatterySettings = useCallback(() => {
    void openBatteryOptimizationSettings(() =>
      showAlert({ title: t('backup.batterySettings'), message: t('backup.batteryMessage'), type: 'info' }),
    );
  }, [showAlert, t]);

  /** Shows the follow-up an enable needs, if any. Returns true when it showed one. */
  const showEnablePrompts = useCallback(
    ({ blockedByNotifications, showBatteryPrompt }: SetAutoBackupResult): boolean => {
      if (blockedByNotifications) {
        showAlert({
          title: t('backup.notificationsRequired'),
          message: t('backup.notificationsMessage'),
          type: 'warning',
          buttons: [
            { text: t('backup.ok'), style: 'cancel' },
            { text: t('backup.openSettings'), onPress: () => void openAppSettings() },
          ],
        });
        return true;
      }
      if (showBatteryPrompt) {
        showAlert({
          title: t('backup.improveReliability'),
          message: t('backup.reliabilityMessage'),
          type: 'info',
          buttons: [
            { text: t('backup.notNow'), style: 'cancel' },
            { text: t('backup.openSettings'), onPress: openBatterySettings },
          ],
        });
        return true;
      }
      return false;
    },
    [showAlert, openBatterySettings, t],
  );

  const handleToggleAutoBackup = useCallback(
    async (value: boolean) => {
      try {
        showEnablePrompts(await setAutoBackupEnabled(value));
      } catch (e) {
        LoggerService.warn('BACKUP_UI', 'Failed to update auto-backup', e);
      }
    },
    [setAutoBackupEnabled, showEnablePrompts],
  );

  const handleConnect = useCallback(async () => {
    try {
      const result = await enableCloudBackup();
      if (result.status === 'cancelled') return;
      if (!showEnablePrompts(result)) {
        showAlert({ title: t('backup.connectedTitle'), message: t('backup.connectedMessage'), type: 'success' });
      }
    } catch (e) {
      showAlert({ title: t('backup.connectFailed'), message: toErrorMessage(e, t('backup.connectFailedMessage')), type: 'error' });
    }
  }, [enableCloudBackup, showEnablePrompts, showAlert, t]);

  const handleDisconnect = useCallback(async () => {
    setShowDisconnectConfirm(false);
    try {
      await disconnect();
      showAlert({ title: t('backup.disconnected'), message: t('backup.disconnectedMessage'), type: 'info' });
    } catch (e) {
      showAlert({ title: t('backup.disconnectFailed'), message: toErrorMessage(e, t('backup.disconnectFailedMessage')), type: 'error' });
    }
  }, [disconnect, showAlert, t]);

  const handleBackup = useCallback(async () => {
    setShowReplaceConfirm(false);
    try {
      await backupNow();
      Analytics.track('backup_created');
      showAlert({ title: t('backup.backupSuccess'), message: t('backup.backupSuccessMessage'), type: 'success' });
    } catch (e) {
      showAlert({ title: t('backup.backupFailed'), message: toErrorMessage(e, t('backup.backupFailedMessage')), type: 'error' });
    }
  }, [backupNow, showAlert, t]);

  // The database was replaced underneath the running app; providers hold stale state until reload.
  const reloadAfterRestore = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (reloadErr) {
      LoggerService.warn('BACKUP_UI', 'Updates.reloadAsync failed', reloadErr);
      if (__DEV__ && DevSettings?.reload) {
        DevSettings.reload();
        return;
      }
      // Remount every screen so it re-reads the restored database, and say plainly that an
      // automatic restart didn't happen.
      router.replace('/(main)/(tabs)');
      showAlert({ title: t('backup.restoreApplied'), message: t('backup.restoreAppliedMessage'), type: 'warning' });
    }
  }, [router, showAlert, t]);

  const handleRestore = useCallback(async () => {
    setShowRestoreConfirm(false);
    try {
      await restoreLatest();
      Analytics.track('backup_restored');
      showAlert({
        title: t('backup.restoreComplete'),
        message: t('backup.restoreCompleteMessage'),
        type: 'success',
        buttons: [{ text: t('backup.ok'), onPress: () => void reloadAfterRestore() }],
      });
    } catch (e) {
      if (isNoBackupError(e)) {
        showAlert({
          title: t('backup.noBackupFound'),
          message: t('backup.noBackupMessage', { email: account?.email || t('backup.yourCloudAccount') }),
          type: 'warning',
        });
        return;
      }
      showAlert({ title: t('backup.restoreFailed'), message: toErrorMessage(e, t('backup.restoreFailedMessage')), type: 'error' });
    }
  }, [restoreLatest, reloadAfterRestore, showAlert, account?.email, t]);

  // Background jobs can silently stop firing (OEM battery killers) — surface it instead of
  // letting the user assume they're still protected.
  const isOverdue = autoBackupEnabled && isBackupOverdue(latestBackup?.modifiedTime, Date.now());

  // Drive has one backup file. Replacing one this install never restored loses whatever only it holds.
  const requestBackup = isFromAnotherInstall ? () => setShowReplaceConfirm(true) : handleBackup;

  const renderBody = () => {
    if (!isPremium) return <BackupUpsellRow onPress={() => openPaywall('backup')} />;

    if (isAccountLoading) {
      return (
        <View style={styles.loadingRow}>
          <Spinner size="sm" />
          <Text variant="calloutStrong" tone="muted">{t('backup.checking')}</Text>
        </View>
      );
    }

    if (!account) return <BackupConnectRow onPress={handleConnect} isConnecting={isEnabling} />;

    return (
      <>
        <BackupAccountRow email={account.email} onDisconnect={() => setShowDisconnectConfirm(true)} />
        <View style={styles.separator} />
        <BackupStatusRow
          latestBackup={latestBackup}
          isOverdue={isOverdue}
          onOverduePress={openBatterySettings}
          isFromAnotherInstall={isFromAnotherInstall}
        />
        {(isBackingUp || isRestoring) && <BackupProgressRow progress={progress} stage={stage} />}
        <BackupActionsRow
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          canRestore={latestBackup !== null}
          onBackup={requestBackup}
          onRestore={() => setShowRestoreConfirm(true)}
        />
        <View style={styles.separator} />
        <AutoBackupRow enabled={autoBackupEnabled} onToggle={handleToggleAutoBackup} onReliabilityHintPress={openBatterySettings} />

        <ConfirmDialog
          visible={showRestoreConfirm}
          onClose={() => setShowRestoreConfirm(false)}
          title={t('backup.restoreConfirmTitle')}
          message={t('backup.restoreConfirmMessage')}
          confirmLabel={t('backup.restoreData')}
          onConfirm={handleRestore}
          destructive
        />
        <ConfirmDialog
          visible={showReplaceConfirm}
          onClose={() => setShowReplaceConfirm(false)}
          title={t('backup.replaceConfirmTitle')}
          message={t('backup.replaceConfirmMessage', {
            date: latestBackup ? formatBackupTimestamp(latestBackup.modifiedTime) : '',
          })}
          confirmLabel={t('backup.replaceBackup')}
          onConfirm={handleBackup}
          destructive
        />
        <ConfirmDialog
          visible={showDisconnectConfirm}
          onClose={() => setShowDisconnectConfirm(false)}
          title={t('backup.disconnectTitle')}
          message={t('backup.disconnectMessage')}
          confirmLabel={t('backup.disconnect')}
          onConfirm={handleDisconnect}
          destructive
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderBody()}
      <AlertDialog {...alertProps} />
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('4'),
      paddingHorizontal: spacing('4'),
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: alpha(colors.text, 'subtle'),
      // Aligns with the text column: screen padding + avatar (36) + row gap.
      marginLeft: layout.screenPadding + 36 + spacing('3.5'),
    },
  });
