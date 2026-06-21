import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { CrownIcon, Search } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { HeroCardPalette } from '@/src/theme/colors';

type Props = {
  name?: string;
  isPremium: boolean;
  onSearch: () => void;
  heroCard: HeroCardPalette;
};

export const DashboardHeader = React.memo(function DashboardHeader({
  name,
  isPremium,
  onSearch,
  heroCard,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  const monogram = useMemo(() => {
    return (name || 'L').charAt(0).toUpperCase();
  }, [name]);

  return (
    <View style={styles.container}>
      <BentoPressable style={styles.searchBar} onPress={onSearch}>
        <HugeiconsIcon icon={Search} size={18} color={heroCard.textMuted} />
        <Text style={styles.placeholder} numberOfLines={1}>
          Search...
        </Text>
        <View style={styles.avatarContainer}>
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
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    container: {
      paddingTop: spacing('2'),
      paddingBottom: spacing('3'),
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: radius('lg'),
      backgroundColor: heroCard.separator,
      paddingLeft: spacing('3.5'),
      paddingRight: spacing('1.5'),
      gap: spacing('2.5'),
    },
    placeholder: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      color: heroCard.textMuted,
      fontSize: 13,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 8, // Squircle: Math.round(32 * 0.25)
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: typography.fonts.semibold,
      color: heroCard.textPrimary,
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
      borderColor: colors.primary,
    },
  });

