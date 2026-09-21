import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import * as Updates from 'expo-updates';
import {
  Alert02Icon,
  ArrowRight01Icon,
  BatteryCharging01Icon,
  CloudIcon,
  Download01Icon,
  LockPasswordIcon,
  Logout01Icon,
  SparklesIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { formatBackupTimestamp } from '@/src/utils/date';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  DevSettings,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { isNoBackupError } from '@/src/services/backup/google-drive.errors';
import { toErrorMessage } from '@/src/utils/errors';
import { useRouter } from 'expo-router';
import { useGoogleBackup } from '../hooks/useGoogleBackup';
import { LoggerService } from '@/src/services/logger.service';
import { usePremium } from '@/src/providers/PremiumProvider';
import { openAppSettings, openBatteryOptimizationSettings } from '@/src/services/backup/battery-optimization';

import { AUTO_BACKUP_INTERVAL_MS } from '@/src/services/backup/auto-backup.service';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

export const GoogleBackupCard = React.memo(function GoogleBackupCard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { isPremium } = usePremium();

  const {
    user,
    isConnected,
    isChecking,
    isBackingUp,
    isRestoring,
    progress,
    progressStage,
    lastBackup,
    autoBackupEnabled,
    connectAccount,
    disconnectAccount,
    performBackup,
    performRestore,
    toggleAutoBackup,
  } = useGoogleBackup();

  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = React.useCallback(
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
        buttons: config.buttons || [{ text: t('backup.ok') }],
      });
    },
    [t],
  );

  const handleReliabilityHintPress = React.useCallback(() => {
    openBatteryOptimizationSettings(() => showAlert({
      title: t('backup.batterySettings'),
      message: t('backup.batteryMessage'),
      type: 'info',
    }));
  }, [showAlert, t]);

  /** Returns true if it showed a prompt (notification/battery), so callers can skip a competing alert. */
  const handleToggleAutoBackup = React.useCallback(
    async (value: boolean): Promise<boolean> => {
      const { blockedByNotifications, showBatteryPrompt } = await toggleAutoBackup(value);

      if (blockedByNotifications) {
        showAlert({
          title: t('backup.notificationsRequired'),
          message: t('backup.notificationsMessage'),
          type: 'warning',
          buttons: [
            { text: t('backup.ok'), style: 'cancel' },
            { text: t('backup.openSettings'), onPress: () => openAppSettings() },
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
            {
              text: t('backup.openSettings'),
              onPress: handleReliabilityHintPress,
            },
          ],
        });
        return true;
      }

      return false;
    },
    [toggleAutoBackup, showAlert, handleReliabilityHintPress, t],
  );

  const handleConnect = React.useCallback(async () => {
    try {
      await connectAccount();
      // Connecting an account is the whole "set up backup" action from the
      // user's POV — auto-backup turns on immediately, no separate step.
      const promptShown = await handleToggleAutoBackup(true);
      if (!promptShown) {
        showAlert({
          title: t('backup.connectedTitle'),
          message: t('backup.connectedMessage'),
          type: 'success',
        });
      }
    } catch (e) {
      showAlert({
        title: t('backup.connectFailed'),
        message: toErrorMessage(e, t('backup.connectFailedMessage')),
        type: 'error',
      });
    }
  }, [connectAccount, handleToggleAutoBackup, showAlert, t]);

  const handleDisconnect = React.useCallback(async () => {
    setShowDisconnectConfirm(false);
    try {
      await disconnectAccount();
      showAlert({
        title: t('backup.disconnected'),
        message: t('backup.disconnectedMessage'),
        type: 'info',
      });
    } catch (e) {
      showAlert({
        title: t('backup.disconnectFailed'),
        message: toErrorMessage(e, t('backup.disconnectFailedMessage')),
        type: 'error',
      });
    }
  }, [disconnectAccount, showAlert, t]);

  const handleBackup = React.useCallback(async () => {
    try {
      const success = await performBackup();
      if (success) {
        showAlert({
          title: t('backup.backupSuccess'),
          message: t('backup.backupSuccessMessage'),
          type: 'success',
        });
      }
    } catch (e) {
      showAlert({
        title: t('backup.backupFailed'),
        message: toErrorMessage(e, t('backup.backupFailedMessage')),
        type: 'error',
      });
    }
  }, [performBackup, showAlert, t]);

  const handleRestore = React.useCallback(async () => {
    setShowRestoreConfirm(false);
    try {
      const success = await performRestore();
      if (success) {
        showAlert({
          title: t('backup.restoreComplete'),
          message: t('backup.restoreCompleteMessage'),
          type: 'success',
          buttons: [
            {
              text: t('backup.ok'),
              onPress: async () => {
                try {
                  await Updates.reloadAsync();
                } catch (reloadErr) {
                  LoggerService.warn('BACKUP_UI', 'Updates.reloadAsync failed', reloadErr);
                  if (__DEV__ && DevSettings?.reload) {
                    DevSettings.reload();
                    return;
                  }
                  // The local DB has already been replaced underneath the
                  // running app — leaving the user on this screen with stale
                  // in-memory state would be worse than an imperfect restart.
                  // Reset navigation to the app root so every screen remounts
                  // and re-fetches from the now-restored database, and tell
                  // the user plainly that an automatic restart didn't happen.
                  router.replace('/(main)/(tabs)');
                  showAlert({
                    title: t('backup.restoreApplied'),
                    message: t('backup.restoreAppliedMessage'),
                    type: 'warning',
                  });
                }
              },
            },
          ],
        });
      }
    } catch (e) {
      if (isNoBackupError(e)) {
        LoggerService.info('BACKUP_UI', 'No backup file found on Google Drive');
        showAlert({
          title: t('backup.noBackupFound'),
          message: t('backup.noBackupMessage', { email: user?.email || t('backup.yourCloudAccount') }),
          type: 'warning',
        });
      } else {
        LoggerService.warn('BACKUP_UI', 'Restore failed', e);
        showAlert({
          title: t('backup.restoreFailed'),
          message: toErrorMessage(e, t('backup.restoreFailedMessage')),
          type: 'error',
        });
      }
    }
  }, [performRestore, showAlert, user?.email, router, t]);

  const formattedLastBackupTime = useMemo(() => {
    if (!lastBackup?.modifiedTime) return t('backup.noBackupYet');
    return formatBackupTimestamp(lastBackup.modifiedTime);
  }, [lastBackup?.modifiedTime, t]);

  const formattedSize = useMemo(() => {
    if (!lastBackup?.size) return null;
    const kb = lastBackup.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }, [lastBackup?.size]);

  // Background jobs can silently stop firing (OEM battery killers) — surface it
  // instead of letting the user assume it's still working.
  const isBackupOverdue = useMemo(() => {
    if (!autoBackupEnabled || !lastBackup?.modifiedTime) return false;
    return Date.now() - new Date(lastBackup.modifiedTime).getTime() > AUTO_BACKUP_INTERVAL_MS * 2;
  }, [autoBackupEnabled, lastBackup?.modifiedTime]);

  if (!isPremium) {
    return (
      <View style={styles.groupContainer}>
        <BentoPressable style={styles.mainRow} onPress={() => router.push('/premium')}>
          <IconAvatar icon={LockPasswordIcon} color={colors.primary} variant="subtle" size={40} />
          <View style={styles.rowInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.rowLabel}>{t('backup.cloudBackup')}</Text>
              <View style={styles.proBadge}>
                <HugeiconsIcon icon={SparklesIcon} size={10} color={colors.warning} />
                <Text style={styles.proBadgeText}>{t('backup.pro')}</Text>
              </View>
            </View>
            <Text style={styles.rowSubtitle}>
              {t('backup.proFeatures')}
            </Text>
          </View>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeText}>{t('backup.upgrade')}</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primary} />
          </View>
        </BentoPressable>
      </View>
    );
  }

  if (isChecking) {
    return (
      <View style={styles.groupContainer}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>{t('backup.checking')}</Text>
        </View>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.groupContainer}>
        <BentoPressable style={styles.mainRow} onPress={handleConnect}>
          <IconAvatar icon={CloudIcon} color={colors.primary} variant="subtle" size={40} />
          <View style={styles.rowInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.rowLabel}>{t('backup.cloudBackup')}</Text>
              <View style={styles.statusDotOffline} />
            </View>
            <Text style={styles.rowSubtitle}>
              {t('backup.connectStorage')}
            </Text>
          </View>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeText}>{t('backup.connect')}</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primary} />
          </View>
        </BentoPressable>

        <AlertDialog
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    );
  }

  return (
    <View style={styles.groupContainer}>
      {/* Account Info Row */}
      <View style={styles.mainRow}>
        <IconAvatar icon={CloudIcon} color={colors.success} variant="subtle" size={40} />
        <View style={styles.rowInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.rowLabel}>{t('backup.cloudAccount')}</Text>
            <View style={styles.activeBadge}>
              <View style={styles.statusDotActive} />
              <Text style={styles.activeBadgeText}>{t('backup.connected')}</Text>
            </View>
          </View>
          <Text style={styles.userEmailText} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
        <BentoPressable
          style={styles.disconnectIconButton}
          onPress={() => setShowDisconnectConfirm(true)}
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} color={colors.textMuted} />
        </BentoPressable>
      </View>

      <View style={styles.separator} />

      {/* Backup Status Row */}
      {isBackupOverdue ? (
        <BentoPressable style={styles.statusBoxWarning} onPress={handleReliabilityHintPress}>
          <HugeiconsIcon icon={Alert02Icon} size={16} color={colors.warning} />
          <Text style={styles.statusWarningText}>{t('backup.overdue')}</Text>
        </BentoPressable>
      ) : (
        <View style={styles.statusBox}>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusLabel}>{t('backup.lastBackup')}</Text>
            <Text style={styles.statusValue}>{formattedLastBackupTime}</Text>
          </View>
          {formattedSize && (
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeBadgeText}>{formattedSize}</Text>
            </View>
          )}
        </View>
      )}

      {/* Progress Bar during Backup or Restore */}
      {(isBackingUp || isRestoring) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressStageText}>{progressStage || t('backup.processing')}</Text>
            <Text style={styles.progressPercentText}>{progress}%</Text>
          </View>
          <ProgressBar progress={progress} height={6} />
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <BentoPressable
          style={[styles.primaryActionButton, (isBackingUp || isRestoring) && styles.disabledButton]}
          onPress={handleBackup}
          disabled={isBackingUp || isRestoring}
        >
          {isBackingUp ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Upload01Icon} size={16} color={colors.primaryForeground} />
              <Text style={styles.primaryActionButtonText}>{t('backup.backupNow')}</Text>
            </>
          )}
        </BentoPressable>

        <BentoPressable
          style={[
            styles.secondaryActionButton,
            (isBackingUp || isRestoring || !lastBackup) && styles.disabledButton,
          ]}
          onPress={() => setShowRestoreConfirm(true)}
          disabled={isBackingUp || isRestoring || !lastBackup}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Download01Icon} size={16} color={colors.primary} />
              <Text style={styles.secondaryActionButtonText}>{t('backup.restore')}</Text>
            </>
          )}
        </BentoPressable>
      </View>

      <View style={styles.separator} />

      {/* Auto Backup Toggle Row */}
      <View style={styles.autoBackupSection}>
        <View style={styles.autoBackupRow}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{t('backup.autoBackup')}</Text>
            <Text style={styles.rowSubtitle}>
              {autoBackupEnabled
                ? t('backup.autoOn')
                : t('backup.autoOff')}
            </Text>
          </View>
          <Switch
            value={autoBackupEnabled}
            onValueChange={(value) => { void handleToggleAutoBackup(value); }}
            trackColor={{ false: alpha(colors.text, 'subtle'), true: colors.primary }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={alpha(colors.text, 'subtle')}
          />
        </View>

        {Platform.OS === 'android' && autoBackupEnabled && (
          <BentoPressable style={styles.reliabilityHintRow} onPress={handleReliabilityHintPress}>
            <HugeiconsIcon icon={BatteryCharging01Icon} size={12} color={colors.textMuted} />
            <Text style={styles.reliabilityHintText}>{t('backup.reliabilityHint')}</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={colors.textMuted} />
          </BentoPressable>
        )}
      </View>

      {/* Confirm Dialogs */}
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
        visible={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title={t('backup.disconnectTitle')}
        message={t('backup.disconnectMessage')}
        confirmLabel={t('backup.disconnect')}
        onConfirm={handleDisconnect}
        destructive
      />

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    groupContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      overflow: 'hidden',
      marginBottom: spacing('5'),
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('4'),
      paddingHorizontal: spacing('4'),
    },
    loadingText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
      color: colors.textMuted,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    rowInfo: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rowLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    statusDotOffline: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
      backgroundColor: colors.textMuted,
      opacity: 0.5,
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: alpha(colors.success, 'subtle'),
      paddingHorizontal: spacing('2'),
      paddingVertical: 2,
      borderRadius: radius('full'),
    },
    statusDotActive: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
      backgroundColor: colors.success,
    },
    activeBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: 10,
      color: colors.success,
    },
    rowSubtitle: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
      lineHeight: 16,
    },
    userEmailText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.primary,
    },
    disconnectIconButton: {
      padding: spacing('2'),
      borderRadius: radius('md'),
    },
    connectBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      backgroundColor: alpha(colors.primary, 'subtle'),
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
    },
    connectBadgeText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.primary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: alpha(colors.text, 'subtle'),
      marginLeft: layout.screenPadding + 36 + spacing('3.5'),
    },
    statusBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.card,
    },
    statusTextCol: {
      gap: 2,
    },
    statusLabel: {
      fontFamily: typography.fonts.bold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    statusValue: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
      color: colors.text,
    },
    statusBoxWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: alpha(colors.warning, 'subtle'),
    },
    statusWarningText: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
      color: colors.warning,
    },
    reliabilityHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      alignSelf: 'flex-start',
    },
    reliabilityHintText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    sizeBadge: {
      backgroundColor: alpha(colors.primary, 'subtle'),
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('md'),
    },
    sizeBadgeText: {
      fontFamily: typography.fonts.bold,
      ...typography.metrics.xs,
      color: colors.primary,
    },
    progressContainer: {
      paddingHorizontal: spacing('4'),
      paddingTop: spacing('3'),
      paddingBottom: spacing('1'),
      gap: spacing('2'),
    },
    progressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressStageText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    progressPercentText: {
      fontFamily: typography.fonts.bold,
      ...typography.metrics.xs,
      color: colors.primary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    primaryActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: radius('xl'),
    },
    primaryActionButtonText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
      color: colors.primaryForeground,
    },
    secondaryActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      height: 40,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      borderRadius: radius('xl'),
    },
    secondaryActionButtonText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.sm,
      color: colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    autoBackupSection: {
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    autoBackupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: spacing('2'),
      paddingVertical: 2,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'subtle'),
    },
    proBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: 10,
      color: colors.primary,
    },
  });
