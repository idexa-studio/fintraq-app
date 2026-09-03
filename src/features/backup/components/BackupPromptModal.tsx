import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ArrowRight01Icon, CloudIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useGoogleBackup } from '../hooks/useGoogleBackup';

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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { connectAccount, isConnected, isChecking } = useGoogleBackup();

  const handleConnect = useCallback(async () => {
    try {
      await connectAccount();
      onClose();
      if (onConnectSuccess) onConnectSuccess();
    } catch {
      // Connect error handled inside hook
    }
  }, [connectAccount, onClose, onConnectSuccess]);

  if (isConnected || !visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <IconAvatar icon={CloudIcon as IconSvgElement} color={colors.primary} variant="subtle" size={52} iconSize={26} />
            <Text style={styles.title}>Protect Your Financial History</Text>
            <Text style={styles.message}>
              You have logged several transactions! Connect Google Drive to enable automated cloud backups and prevent data loss.
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <HugeiconsIcon icon={ShieldKeyIcon as IconSvgElement} size={16} color={colors.success} />
              <Text style={styles.featureText}>100% Private & Stored in Your Personal Drive</Text>
            </View>
            <View style={styles.featureRow}>
              <HugeiconsIcon icon={CloudIcon as IconSvgElement} size={16} color={colors.primary} />
              <Text style={styles.featureText}>Automated Daily Background Backup</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <BentoPressable style={styles.primaryButton} onPress={handleConnect} disabled={isChecking}>
              {isChecking ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Connect Google Drive</Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.primaryForeground} />
                </>
              )}
            </BentoPressable>

            <BentoPressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </BentoPressable>
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
      fontSize: typography.sizes.xl,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
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
      fontSize: typography.sizes.xs,
      color: colors.text,
    },
    actions: {
      gap: spacing('2.5'),
    },
    primaryButton: {
      height: 48,
      backgroundColor: colors.primary,
      borderRadius: radius('xl'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
    },
    primaryButtonText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.primaryForeground,
    },
    secondaryButton: {
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
