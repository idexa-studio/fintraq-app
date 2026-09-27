import { Text } from '@/src/components/ui/Text';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { CloudIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import type { IconSource } from '@/src/components/ui/Icon';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={styles.container}>
      {/* Main Restore Bento Card */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <IconAvatar
            icon={CloudIcon as IconSource}
            color={colors.primary}
            variant="subtle"
            size={52}
            iconSize={26}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('onboardingFlow.restoringWorkspace')}</Text>
            <Text style={styles.stageText} numberOfLines={2}>
              {progressStage || t('onboardingFlow.downloadingBackup')}
            </Text>
          </View>
          <Text style={styles.percentText}>{clampedProgress}%</Text>
        </View>

        <ProgressBar progress={clampedProgress} height={8} />

        {userEmail ? (
          <Text style={styles.emailText} numberOfLines={1}>
            {t('onboardingFlow.connectedAsShort', { email: userEmail })}
          </Text>
        ) : null}
      </View>

      {/* Reassurance Info Card */}
      <View style={styles.infoCard}>
        <IconAvatar
          icon={ShieldKeyIcon as IconSource}
          color={colors.success}
          variant="subtle"
          size={40}
          iconSize={20}
        />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>{t('onboardingFlow.secureRestore')}</Text>
          <Text style={styles.infoDetail}>
            {t('onboardingFlow.restoreWarning')}
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
      ...typography.metrics.lg,
      color: colors.text,
    },
    stageText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.primary,
    },
    percentText: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.xl,
      color: colors.primary,
    },
    emailText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
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
      ...typography.metrics.md,
      color: colors.text,
    },
    infoDetail: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
  });
