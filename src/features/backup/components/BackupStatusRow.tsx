import { Alert02Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { CloudBackupFileMeta } from '@/src/services/backup/backup.types';
import { alpha } from '@/src/theme/tokens';
import { formatBackupTimestamp } from '@/src/utils/date';
import { formatFileSize } from '@/src/utils/format';

type BackupStatusRowProps = {
  latestBackup: CloudBackupFileMeta | null;
  /** Auto-backup has stopped firing — show the warning instead of the timestamp. */
  isOverdue: boolean;
  onOverduePress: () => void;
};

export const BackupStatusRow = React.memo(function BackupStatusRow({ latestBackup, isOverdue, onOverduePress }: BackupStatusRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (isOverdue) {
    return (
      <BentoPressable style={styles.warningBox} onPress={onOverduePress} accessibilityRole="button" accessibilityLabel={t('backup.overdue')}>
        <Icon icon={Alert02Icon} size={16} color={theme.colors.warning} />
        <Text variant="calloutStrong" color={colors.warning} style={styles.warningText}>{t('backup.overdue')}</Text>
      </BentoPressable>
    );
  }

  return (
    <View style={styles.box}>
      <View style={styles.textCol}>
        <Text variant="micro" tone="muted">{t('backup.lastBackup')}</Text>
        <Text variant="calloutStrong">
          {latestBackup ? formatBackupTimestamp(latestBackup.modifiedTime) : t('backup.noBackupYet')}
        </Text>
      </View>
      {latestBackup && latestBackup.size > 0 && (
        <View style={styles.sizeBadge}>
          <Text variant="label" color={colors.primaryInk}>{formatFileSize(latestBackup.size)}</Text>
        </View>
      )}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.card,
    },
    textCol: {
      gap: 2,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: alpha(colors.warning, 'subtle'),
    },
    warningText: {
      flex: 1,
    },
    sizeBadge: {
      backgroundColor: alpha(colors.primary, 'subtle'),
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
  });
