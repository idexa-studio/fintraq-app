import { CloudIcon, Logout01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconAvatar, IconButton, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';
import { createBackupRowStyles } from './backupCardStyles';

type BackupAccountRowProps = { email: string; onDisconnect: () => void };

export const BackupAccountRow = React.memo(function BackupAccountRow({ email, onDisconnect }: BackupAccountRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rows = useMemo(() => createBackupRowStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={rows.mainRow}>
      <IconAvatar icon={CloudIcon} color={theme.colors.success} variant="subtle" size={40} />
      <View style={rows.rowInfo}>
        <View style={rows.titleRow}>
          <Text style={rows.rowLabel}>{t('backup.cloudAccount')}</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>{t('backup.connected')}</Text>
          </View>
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <IconButton icon={Logout01Icon} variant="ghost" onPress={onDisconnect} accessibilityLabel={t('backup.disconnect')} />
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: alpha(colors.success, 'subtle'),
      paddingHorizontal: spacing('2'),
      paddingVertical: 2,
      borderRadius: radius('full'),
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
      backgroundColor: colors.success,
    },
    activeBadgeText: {
      fontFamily: typography.fonts.bold,
      ...typography.metrics.xxs,
      color: colors.success,
    },
    email: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.primaryInk,
    },
  });
