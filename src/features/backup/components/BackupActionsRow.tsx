import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type BackupActionsRowProps = {
  isBackingUp: boolean;
  isRestoring: boolean;
  canRestore: boolean;
  onBackup: () => void;
  onRestore: () => void;
};

/** Back up (the primary action) beside restore (tonal): equal width, one control height. */
export const BackupActionsRow = React.memo(function BackupActionsRow({
  isBackingUp,
  isRestoring,
  canRestore,
  onBackup,
  onRestore,
}: BackupActionsRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Button
        title={t('backup.backupNow')}
        icon="upload"
        onPress={onBackup}
        disabled={isRestoring}
        isLoading={isBackingUp}
        style={styles.action}
      />
      <Button
        title={t('backup.restore')}
        icon="download-simple"
        variant="tonal"
        onPress={onRestore}
        disabled={isBackingUp || !canRestore}
        isLoading={isRestoring}
        style={styles.action}
      />
    </View>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    action: {
      flex: 1,
    },
  });
