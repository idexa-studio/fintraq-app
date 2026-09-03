import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import {
  LockPasswordIcon,
  RefreshIcon,
  ShieldKeyIcon,
} from '@hugeicons/core-free-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleBackupCard } from '../components/GoogleBackupCard';

const HIGHLIGHTS = [
  {
    icon: LockPasswordIcon,
    title: '100% Private & Hidden',
    subtitle: 'Backups are stored inside your private Google Drive AppData folder, isolated from standard Drive files.',
  },
  {
    icon: ShieldKeyIcon,
    title: 'SHA-256 Integrity Verified',
    subtitle: 'Every backup package is signed with a cryptographic checksum to guarantee zero data corruption.',
  },
  {
    icon: RefreshIcon,
    title: 'Version & Schema Compatible',
    subtitle: 'Dynamically adapts database schemas when restoring across different app versions.',
  },
];

export const BackupScreen = React.memo(function BackupScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Cloud Backup" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <Text style={styles.sectionLabel}>Google Drive Integration</Text>

        {/* Main Google Backup Bento Card */}
        <GoogleBackupCard />

        {/* Highlights Section */}
        <Text style={styles.sectionLabel}>Security & Compatibility</Text>
        <View style={styles.groupContainer}>
          {HIGHLIGHTS.map((item, index) => (
            <React.Fragment key={item.title}>
              {index > 0 && <View style={styles.separator} />}
              <View style={styles.highlightRow}>
                <IconAvatar icon={item.icon} color={colors.primary} variant="subtle" size={36} />
                <View style={styles.highlightInfo}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing('2'),
      marginLeft: spacing('1'),
    },
    groupContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
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
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    highlightSubtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 16,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.text + '18',
      marginLeft: layout.screenPadding + 36 + spacing('3.5'),
    },
  });
