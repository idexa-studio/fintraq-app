import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import {
  ArrowRight01Icon,
  CloudIcon,
  Download01Icon,
  Logout01Icon,
  Upload01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useGoogleBackup } from '../hooks/useGoogleBackup';

export const GoogleBackupCard = React.memo(function GoogleBackupCard() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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

  const formattedLastBackupTime = useMemo(() => {
    if (!lastBackup?.modifiedTime) return 'No backup yet';
    try {
      return format(new Date(lastBackup.modifiedTime), 'MMM d, yyyy • h:mm a');
    } catch {
      return lastBackup.modifiedTime;
    }
  }, [lastBackup?.modifiedTime]);

  const formattedSize = useMemo(() => {
    if (!lastBackup?.size) return null;
    const kb = lastBackup.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }, [lastBackup?.size]);

  if (isChecking) {
    return (
      <View style={styles.groupContainer}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Checking Google Drive status...</Text>
        </View>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.groupContainer}>
        <BentoPressable style={styles.mainRow} onPress={connectAccount}>
          <IconAvatar icon={CloudIcon} color={colors.primary} variant="subtle" size={36} />
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Google Cloud Backup</Text>
            <Text style={styles.rowSubtitle}>
              Connect Google Drive to back up your data privately
            </Text>
          </View>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeText}>Connect</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primary} />
          </View>
        </BentoPressable>
      </View>
    );
  }

  return (
    <View style={styles.groupContainer}>
      {/* Account Info Row */}
      <View style={styles.mainRow}>
        <IconAvatar icon={CloudIcon} color={colors.primary} variant="subtle" size={36} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowLabel}>Google Cloud Backup</Text>
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
      <View style={styles.statusBox}>
        <View style={styles.statusTextCol}>
          <Text style={styles.statusLabel}>LAST BACKUP</Text>
          <Text style={styles.statusValue}>{formattedLastBackupTime}</Text>
        </View>
        {formattedSize && (
          <View style={styles.sizeBadge}>
            <Text style={styles.sizeBadgeText}>{formattedSize}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar during Backup or Restore */}
      {(isBackingUp || isRestoring) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressStageText}>{progressStage || 'Processing...'}</Text>
            <Text style={styles.progressPercentText}>{progress}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <BentoPressable
          style={[styles.primaryActionButton, (isBackingUp || isRestoring) && styles.disabledButton]}
          onPress={performBackup}
          disabled={isBackingUp || isRestoring}
        >
          {isBackingUp ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Upload01Icon} size={16} color={colors.primaryForeground} />
              <Text style={styles.primaryActionButtonText}>Backup Now</Text>
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
              <Text style={styles.secondaryActionButtonText}>Restore</Text>
            </>
          )}
        </BentoPressable>
      </View>

      <View style={styles.separator} />

      {/* Auto Backup Toggle Row */}
      <View style={styles.switchRow}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowLabel}>Auto-backup on launch</Text>
          <Text style={styles.rowSubtitle}>Safely sync changes every time the app opens</Text>
        </View>
        <Switch
          value={autoBackupEnabled}
          onValueChange={toggleAutoBackup}
          trackColor={{ false: colors.text + '18', true: colors.primary }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={colors.text + '18'}
        />
      </View>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        visible={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        title="Restore Cloud Backup?"
        message="Restoring will replace your current local data with the backup file from Google Drive. Proceed?"
        confirmLabel="Restore Data"
        onConfirm={performRestore}
        destructive
      />

      <ConfirmDialog
        visible={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        title="Disconnect Google Drive?"
        message="Are you sure you want to disconnect your Google Account from Cloud Backup?"
        confirmLabel="Disconnect"
        onConfirm={disconnectAccount}
        destructive
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
      fontSize: typography.sizes.sm,
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
    rowLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    rowSubtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 16,
    },
    userEmailText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
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
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
    },
    connectBadgeText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      color: colors.primary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.text + '18',
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
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    sizeBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('md'),
    },
    sizeBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.xs,
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
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    progressPercentText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.xs,
      color: colors.primary,
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: colors.text + '12',
      borderRadius: radius('full'),
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius('full'),
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
      fontSize: typography.sizes.sm,
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
      fontSize: typography.sizes.sm,
      color: colors.primary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
  });
