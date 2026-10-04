import { Text } from './Text';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Icon } from './Icon';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type TrendBadgeProps = {
  /** Percentage change, e.g. 12.4 or -8. `null` renders nothing. */
  delta: number | null;
  /** Whether an increase is good news (income: true, expenses: false). */
  positiveIsGood?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const TrendBadge = React.memo(function TrendBadge({ delta, positiveIsGood = true, style }: TrendBadgeProps) {
  const { colors, alpha, radius, spacing } = useTheme();
  const { t } = useTranslation();
  if (delta === null || !Number.isFinite(delta)) return null;

  const isUp = delta >= 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const color = Math.round(delta) === 0 ? colors.textMuted : isGood ? colors.success : colors.danger;

  return (
    <View
      accessibilityLabel={t(isUp ? 'common.trendUp' : 'common.trendDown', { value: Math.abs(delta).toFixed(0) })}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 2,
          height: 20,
          paddingHorizontal: spacing('1.5'),
          borderRadius: radius('full'),
          backgroundColor: alpha(color, 'subtle'),
        },
        style,
      ]}
    >
      <Icon name={isUp ? 'trend-up' : 'trend-down'} size={12} color={color} weight="bold" />
      <Text variant="micro" color={color}>{Math.abs(delta).toFixed(0)}%</Text>
    </View>
  );
});
