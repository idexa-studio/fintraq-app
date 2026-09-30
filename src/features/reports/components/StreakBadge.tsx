import { Text } from '@/src/components/ui/Text';
import { Flame } from '@hugeicons/core-free-icons';
import { Icon } from '@/src/components/ui/Icon';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useUsageStreak } from '@/src/features/reports/hooks/useStreak';
import { useTranslation } from 'react-i18next';

type Props = {
  heroCard: HeroCardPalette;
};

export const StreakBadge = React.memo(function StreakBadge({ heroCard }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isDark } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard, isDark), [theme, heroCard, isDark]);
  const { data: streak, isLoading } = useUsageStreak();

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={styles.container}>
      <Icon
        icon={Flame}
        size={13}
        color={theme.colors.warning}
      />
      <Text variant="micro" color={heroCard.textPrimary}>{t('dashboard.streakDays', { count: streak })}</Text>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, alpha }: ThemeContextType, heroCard: HeroCardPalette, isDark: boolean) =>
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
