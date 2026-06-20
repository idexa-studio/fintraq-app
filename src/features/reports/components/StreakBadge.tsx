import { Flame } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useUsageStreak } from '../hooks/useStreak';

// Fixed dark-context palette — badge always renders on the dark HeroBalanceCard
const BADGE_BG    = 'rgba(255,107,53,0.15)';
const FLAME_COLOR = '#FF6B35';

export const StreakBadge = React.memo(function StreakBadge() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <HugeiconsIcon icon={Flame} size={12} color={FLAME_COLOR} />
      <Text style={styles.text}>{streak}d streak</Text>
    </View>
  );
});

const createStyles = ({ typography, colors }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: BADGE_BG,
      alignSelf: 'flex-start',
    },
    text: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.text,
    },
  });
