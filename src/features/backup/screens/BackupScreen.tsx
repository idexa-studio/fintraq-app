import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import {
  LockPasswordIcon,
  RefreshIcon,
  ShieldKeyIcon,
} from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GoogleBackupCard } from '@/src/features/backup/components/GoogleBackupCard';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

const HIGHLIGHTS = [
  { icon: LockPasswordIcon, key: 'private' },
  { icon: ShieldKeyIcon, key: 'peace' },
  { icon: RefreshIcon, key: 'autoSync' },
] as const;

export const BackupScreen = React.memo(function BackupScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen header={{ title: t('backup.title'), showBack: true }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <Text style={styles.sectionLabel}>{t('backup.storageIntegration')}</Text>

        {/* Main Google Backup Bento Card */}
        <GoogleBackupCard />

        {/* Highlights Section */}
        <Text style={styles.sectionLabel}>{t('backup.securityCompat')}</Text>
        <View style={styles.groupContainer}>
          {HIGHLIGHTS.map((item, index) => (
            <React.Fragment key={item.key}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.highlightRow}>
                <IconAvatar icon={item.icon} color={colors.primaryInk} variant="subtle" size={36} />
                <View style={styles.highlightInfo}>
                  <Text style={styles.highlightTitle}>{t(`backup.${item.key}`)}</Text>
                  <Text style={styles.highlightSubtitle}>{t(`backup.${item.key}Detail`)}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('8'),
    },
    sectionLabel: {
      fontFamily: typography.fonts.bold,
      ...typography.metrics.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing('2'),
      marginLeft: spacing('1'),
    },
    groupContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('5'),
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    highlightInfo: {
      flex: 1,
      gap: 2,
    },
    highlightTitle: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    highlightSubtitle: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: alpha(colors.text, 'subtle'),
      marginLeft: layout.screenPadding + 36 + spacing('3.5'),
    },
  });
