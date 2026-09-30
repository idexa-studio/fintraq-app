import { ArrowRight01Icon, CloudIcon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable, Icon, IconAvatar, Spinner, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { createBackupRowStyles } from './backupCardStyles';

type BackupConnectRowProps = { onPress: () => void; isConnecting: boolean };

/** Pro user with no connected account. Disabled while sign-in is in flight to avoid double sheets. */
export const BackupConnectRow = React.memo(function BackupConnectRow({ onPress, isConnecting }: BackupConnectRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rows = useMemo(() => createBackupRowStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BentoPressable
      style={rows.mainRow}
      onPress={onPress}
      disabled={isConnecting}
      accessibilityRole="button"
      accessibilityLabel={t('backup.connect')}
      accessibilityState={{ busy: isConnecting }}
    >
      <IconAvatar icon={CloudIcon} color={theme.colors.primaryInk} variant="subtle" size={40} />
      <View style={rows.rowInfo}>
        <View style={rows.titleRow}>
          <Text style={rows.rowLabel}>{t('backup.cloudBackup')}</Text>
          <View style={styles.offlineDot} />
        </View>
        <Text style={rows.rowSubtitle}>{t('backup.connectStorage')}</Text>
      </View>
      <View style={rows.trailingBadge}>
        {isConnecting ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Text style={rows.trailingBadgeText}>{t('backup.connect')}</Text>
            <Icon icon={ArrowRight01Icon} size={14} color={theme.colors.primaryInk} />
          </>
        )}
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, radius }: ThemeContextType) =>
  StyleSheet.create({
    offlineDot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
      backgroundColor: colors.textMuted,
    },
  });
