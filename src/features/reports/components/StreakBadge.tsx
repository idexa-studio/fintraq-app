import { Flame } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useUsageStreak } from '@/src/features/reports/hooks/useStreak';

type Props = {
  heroCard: HeroCardPalette;
};

export const StreakBadge = React.memo(function StreakBadge({ heroCard }: Props) {
  const theme = useTheme();
  const { isDark } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard, isDark), [theme, heroCard, isDark]);
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <HugeiconsIcon
        icon={Flame}
        size={13}
        color={isDark ? '#FF9F0A' : '#E65100'}
      />
      <Text style={styles.text}>{streak}d streak</Text>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius }: ThemeContextType, heroCard: HeroCardPalette, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
      backgroundColor: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(230, 81, 0, 0.12)',
      alignSelf: 'flex-start',
    },
    text: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: heroCard.textPrimary,
    },
  });
