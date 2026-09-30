import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';

import { Icon } from '@/src/components/ui/Icon';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ArrowRight01Icon, CloudIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import React, { useCallback, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useBackupAccount } from '@/src/features/backup/hooks/useBackupAccount';
import { useEnableCloudBackup } from '@/src/features/backup/hooks/useEnableCloudBackup';
import { LoggerService } from '@/src/services/logger.service';
import { useTranslation } from 'react-i18next';

type BackupPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  onConnectSuccess?: () => void;
};

export const BackupPromptModal = React.memo(function BackupPromptModal({
  visible,
  onClose,
  onConnectSuccess,
}: BackupPromptModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isConnected } = useBackupAccount();
  const { enableCloudBackup, isEnabling } = useEnableCloudBackup();

  // "Enable Cloud Sync" promises automatic backups, not just a connected account.
  const handleConnect = useCallback(async () => {
    try {
      const result = await enableCloudBackup();
      if (result.status === 'cancelled') return;
      onClose();
      onConnectSuccess?.();
    } catch (e) {
      // Sign-in failed or was declined; keep the prompt open so the user can retry or dismiss.
      LoggerService.warn('BACKUP_PROMPT', 'Enabling cloud backup failed', e);
    }
  }, [enableCloudBackup, onClose, onConnectSuccess]);

  if (isConnected || !visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <IconAvatar icon={CloudIcon} color={colors.primaryInk} variant="subtle" size={52} iconSize={26} />
            <Text style={styles.title}>{t('backup.protectTitle')}</Text>
            <Text style={styles.message}>
              {t('backup.protectMessage')}
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Icon icon={ShieldKeyIcon} size={16} color={colors.success} />
              <Text style={styles.featureText}>{t('backup.privateStorage')}</Text>
            </View>
            <View style={styles.featureRow}>
              <Icon icon={CloudIcon} size={16} color={colors.primaryInk} />
              <Text style={styles.featureText}>{t('backup.dailyBackup')}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={t('backup.enableSync')}
              icon={ArrowRight01Icon}
              iconPosition="trailing"
              onPress={handleConnect}
              isLoading={isEnabling}
              size="lg"
              fullWidth
            />

            <Button title={t('backup.maybeLater')} onPress={onClose} variant="ghost" size="lg" fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'center',
      padding: spacing('6'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      gap: spacing('5'),
    },
    header: {
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    title: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xl,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    features: {
      backgroundColor: colors.card,
      borderRadius: radius('xl'),
      padding: spacing('3.5'),
      gap: spacing('2.5'),
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    featureText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.text,
    },
    actions: {
      gap: spacing('2.5'),
    },
  });
