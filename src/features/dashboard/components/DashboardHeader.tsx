import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { CrownIcon, Search } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type Props = {
  name?: string;
  isPremium: boolean;
  onSearch: () => void;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardHeader = React.memo(function DashboardHeader({ name, isPremium, onSearch }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const monogram = useMemo(() => (name || 'F').charAt(0).toUpperCase(), [name]);
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = name?.split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      {/* Greeting row */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>{greeting}{displayName ? ',' : ''}</Text>
          {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
        </View>

        {/* Search + avatar */}
        <BentoPressable style={styles.searchBtn} onPress={onSearch}>
          <HugeiconsIcon icon={Search} size={18} color={colors.textMuted} />
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{monogram}</Text>
            </View>
            {isPremium && (
              <View style={styles.crownBadge}>
                <HugeiconsIcon icon={CrownIcon} size={8} color="#FFFFFF" />
              </View>
            )}
          </View>
        </BentoPressable>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('3'),
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    greeting: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    name: {
      fontFamily: typography.styles.profileName.fontFamily,
      fontSize: typography.sizes.xl,
      color: colors.text,
      marginTop: 1,
    },
    searchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: colors.surface,
      paddingLeft: spacing('3'),
      paddingRight: spacing('1.5'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('xl'),
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: typography.styles.profileMono.fontFamily,
      color: colors.primary,
      fontSize: 13,
    },
    crownBadge: {
      position: 'absolute',
      right: -3,
      top: -3,
      backgroundColor: colors.warning,
      width: 14,
      height: 14,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.background,
    },
  });
