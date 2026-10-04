import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable, Icon, Switch, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { createBackupRowStyles } from './backupCardStyles';

type AutoBackupRowProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onReliabilityHintPress: () => void;
};

export const AutoBackupRow = React.memo(function AutoBackupRow({ enabled, onToggle, onReliabilityHintPress }: AutoBackupRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rows = useMemo(() => createBackupRowStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <View style={rows.rowInfo}>
          <Text style={rows.rowLabel}>{t('backup.autoBackup')}</Text>
          <Text style={rows.rowSubtitle}>{enabled ? t('backup.autoOn') : t('backup.autoOff')}</Text>
        </View>
        <Switch value={enabled} onValueChange={onToggle} accessibilityLabel={t('backup.autoBackup')} />
      </View>

      {/* Android OEM battery managers are the main reason scheduled work stops firing. */}
      {Platform.OS === 'android' && enabled && (
        <BentoPressable style={styles.hintRow} onPress={onReliabilityHintPress} accessibilityRole="button" accessibilityLabel={t('backup.reliabilityHint')}>
          <Icon name="battery-charging" size={12} color={theme.colors.textMuted} />
          <Text variant="label" tone="muted">{t('backup.reliabilityHint')}</Text>
          <Icon name="chevron-right" size={12} color={theme.colors.textMuted} />
        </BentoPressable>
      )}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    section: {
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      alignSelf: 'flex-start',
    },
  });
