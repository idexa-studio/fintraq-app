import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { useUsageStreak } from '../hooks/useStreak';

export const StreakBadge = React.memo(function StreakBadge() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={11} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        {streak}D STREAK
      </Text>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  container: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing('2.5'),
    borderRadius: radius('full'),
    gap: spacing('1'),
    backgroundColor: colors.background + '80',
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
