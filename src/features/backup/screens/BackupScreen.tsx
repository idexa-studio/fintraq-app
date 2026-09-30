import { LockPasswordIcon, RefreshIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ListGroup, ListItem, Screen, Text } from '@/src/components/ui';
import { GoogleBackupCard } from '@/src/features/backup/components/GoogleBackupCard';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

const HIGHLIGHTS = [
  { icon: LockPasswordIcon, key: 'private' },
  { icon: ShieldKeyIcon, key: 'peace' },
  { icon: RefreshIcon, key: 'autoSync' },
] as const;

/** Google Drive backup controls, then what the backup does and doesn't do with your data. */
export const BackupScreen = React.memo(function BackupScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen header={{ title: t('backup.title'), showBack: true }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text variant="label" tone="muted" style={styles.groupTitle}>
            {t('backup.storageIntegration')}
          </Text>
          <GoogleBackupCard />
        </View>

        <ListGroup title={t('backup.securityCompat')}>
          {HIGHLIGHTS.map((item) => (
            <ListItem key={item.key} icon={item.icon} iconColor={colors.primaryInk} title={t(`backup.${item.key}`)} subtitle={t(`backup.${item.key}Detail`)} />
          ))}
        </ListGroup>
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), paddingBottom: spacing('8'), gap: spacing('5') },
    groupTitle: { marginBottom: spacing('2'), marginLeft: spacing('1') },
  });
