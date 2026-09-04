import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { CloudIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type RestoreProgressViewProps = {
  progress: number;
  progressStage: string | null;
  userEmail?: string | null;
};

export const RestoreProgressView = React.memo(function RestoreProgressView({
  progress,
  progressStage,
  userEmail,
}: RestoreProgressViewProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={styles.container}>
      {/* Main Restore Bento Card */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <IconAvatar
            icon={CloudIcon as IconSvgElement}
            color={colors.primary}
            variant="subtle"
            size={52}
            iconSize={26}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>Restoring Workspace</Text>
            <Text style={styles.stageText} numberOfLines={2}>
              {progressStage || 'Downloading your cloud backup...'}
            </Text>
          </View>
          <Text style={styles.percentText}>{clampedProgress}%</Text>
        </View>

        {/* Determinate Progress Track */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
        </View>

        {userEmail ? (
          <Text style={styles.emailText} numberOfLines={1}>
            Connected as {userEmail}
          </Text>
        ) : null}
      </View>

      {/* Reassurance Info Card */}
      <View style={styles.infoCard}>
        <IconAvatar
          icon={ShieldKeyIcon as IconSvgElement}
          color={colors.success}
          variant="subtle"
          size={40}
          iconSize={20}
        />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Secure Cloud Restore</Text>
          <Text style={styles.infoDetail}>
            Your transactions, accounts, and settings are being safely downloaded and reconstructed. Please do not close the app.
          </Text>
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      gap: spacing('3.5'),
      paddingTop: spacing('2'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('4'),
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
    },
    headerText: {
      flex: 1,
      gap: spacing('1'),
    },
    title: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 16,
      color: colors.text,
    },
    stageText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.primary,
      lineHeight: 18,
    },
    percentText: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 20,
      color: colors.primary,
    },
    track: {
      height: 8,
      backgroundColor: colors.card,
      borderRadius: radius('full'),
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius('full'),
    },
    emailText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
    infoText: {
      flex: 1,
      gap: spacing('0.5'),
    },
    infoTitle: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 14,
      color: colors.text,
    },
    infoDetail: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 17,
    },
  });
