import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressBar, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type BackupProgressRowProps = { progress: number; stage: string | null };

export const BackupProgressRow = React.memo(function BackupProgressRow({ progress, stage }: BackupProgressRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }}>
      <View style={styles.header}>
        <Text style={styles.stage}>{stage || t('backup.processing')}</Text>
        <Text style={styles.percent}>{progress}%</Text>
      </View>
      <ProgressBar progress={progress} height={6} />
    </View>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing('4'),
      paddingTop: spacing('3'),
      paddingBottom: spacing('1'),
      gap: spacing('2'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stage: {
      flex: 1,
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    percent: {
      fontFamily: typography.fonts.bold,
      ...typography.metrics.xs,
      color: colors.primary,
    },
  });
