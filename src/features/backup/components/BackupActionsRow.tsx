import { Download01Icon, Upload01Icon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable, Button, Icon, Spinner, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';

type BackupActionsRowProps = {
  isBackingUp: boolean;
  isRestoring: boolean;
  canRestore: boolean;
  onBackup: () => void;
  onRestore: () => void;
};

export const BackupActionsRow = React.memo(function BackupActionsRow({
  isBackingUp,
  isRestoring,
  canRestore,
  onBackup,
  onRestore,
}: BackupActionsRowProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const restoreDisabled = isBackingUp || isRestoring || !canRestore;

  return (
    <View style={styles.row}>
      <Button
        title={t('backup.backupNow')}
        icon={Upload01Icon}
        onPress={onBackup}
        disabled={isRestoring}
        isLoading={isBackingUp}
        style={styles.primary}
      />
      <BentoPressable
        style={[styles.secondary, restoreDisabled && styles.disabled]}
        onPress={onRestore}
        disabled={restoreDisabled}
        accessibilityRole="button"
        accessibilityLabel={t('backup.restore')}
        accessibilityState={{ disabled: restoreDisabled, busy: isRestoring }}
      >
        {isRestoring ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Icon icon={Download01Icon} size={16} color={theme.colors.primaryInk} />
            <Text variant="calloutStrong" color={colors.primaryInk}>{t('backup.restore')}</Text>
          </>
        )}
      </BentoPressable>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, state }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    primary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      height: 40,
      backgroundColor: colors.primary,
    },
    secondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      height: 40,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: alpha(colors.primary, 'soft'),
      borderRadius: radius('full'),
    },
    disabled: {
      opacity: state.disabled,
    },
  });
