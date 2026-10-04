import { Text } from '@/src/components/ui/Text';
import { Flame } from '@hugeicons/core-free-icons';
import { Icon } from '@/src/components/ui/Icon';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useUsageStreak } from '@/src/features/reports/hooks/useStreak';
import { useTranslation } from 'react-i18next';

/** Days-in-a-row badge for the ink hero card. */
export const StreakBadge = React.memo(function StreakBadge() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <Icon
        icon={Flame}
        size={13}
        color={theme.colors.warning}
      />
      <Text variant="micro" color={theme.heroCard.textPrimary}>{t('dashboard.streakDays', { count: streak })}</Text>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.warning, 'subtle'),
      alignSelf: 'flex-start',
    },
  });
