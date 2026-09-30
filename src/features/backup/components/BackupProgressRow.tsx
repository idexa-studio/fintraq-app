import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressBar, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type BackupProgressRowProps = { progress: number; stage: string | null };

export const BackupProgressRow = React.memo(function BackupProgressRow({ progress, stage }: BackupProgressRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }}>
      <View style={styles.header}>
        <Text variant="label" tone="muted" style={styles.stage}>{stage || t('backup.processing')}</Text>
        <Text variant="label" color={colors.primaryInk}>{progress}%</Text>
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
    },
  });
