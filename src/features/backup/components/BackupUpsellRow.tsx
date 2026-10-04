import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable, Icon, IconAvatar, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';
import { createBackupRowStyles } from './backupCardStyles';

type BackupUpsellRowProps = { onPress: () => void };

/** Shown to non-Pro users in place of the backup controls. */
export const BackupUpsellRow = React.memo(function BackupUpsellRow({ onPress }: BackupUpsellRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const rows = useMemo(() => createBackupRowStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BentoPressable style={rows.mainRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={t('backup.upgrade')}>
      <IconAvatar icon="lock-key" color={theme.colors.primaryInk} variant="subtle" size={40} />
      <View style={rows.rowInfo}>
        <View style={rows.titleRow}>
          <Text style={rows.rowLabel}>{t('backup.cloudBackup')}</Text>
          <View style={styles.proBadge}>
            <Icon name="sparkle" size={10} color={theme.colors.warning} />
            <Text variant="micro" color={colors.primaryInk}>{t('backup.pro')}</Text>
          </View>
        </View>
        <Text style={rows.rowSubtitle}>{t('backup.proFeatures')}</Text>
      </View>
      <View style={rows.trailingBadge}>
        <Text style={rows.trailingBadgeText}>{t('backup.upgrade')}</Text>
        <Icon name="chevron-right" size={14} color={theme.colors.primaryInk} />
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: spacing('2'),
      paddingVertical: 2,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'subtle'),
    },
  });
