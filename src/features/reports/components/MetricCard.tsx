import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { TrendMode } from '../../../types';

interface MetricCardProps {
  label: string;
  value: number;
  currency: string;
  trendMode?: TrendMode;
  changeValue?: number;
  suffix?: string;
  isAmount?: boolean;
}

export const MetricCard = React.memo(function MetricCard({
  label,
  value,
  currency,
  trendMode = 'neutral',
  changeValue,
  suffix,
  isAmount = true
}: MetricCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const trendColor = useMemo(() => {
    if (changeValue === undefined || changeValue === 0 || trendMode === 'neutral') {
      return colors.textMuted;
    }
    const isPositive = changeValue > 0;
    if (trendMode === 'high_is_good') {
      return isPositive ? colors.success : colors.danger;
    }
    return isPositive ? colors.danger : colors.success;
  }, [changeValue, trendMode, colors.textMuted, colors.success, colors.danger]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {isAmount ? (
          <MoneyText
            amount={value}
            currency={currency}
            style={styles.value}
            weight="bold"
          />
        ) : (
          <Text style={[styles.value, { color: colors.text }]}>
            {value.toFixed(1)}{suffix}
          </Text>
        )}
      </View>
      {changeValue !== undefined && (
        <View style={styles.percentageRow}>
          <Text style={[styles.percentageText, { color: trendColor }]}>
            {changeValue >= 0 ? '+' : ''}{changeValue.toFixed(1)}% vs prev.
          </Text>
        </View>
      )}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  container: {
    padding: spacing('4'),
    borderRadius: radius('xl'),
    backgroundColor: colors.surface + '80',
    flex: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing('2'),
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
  },
  percentageRow: {
    marginTop: spacing('2'),
  },
  percentageText: {
    fontFamily: typography.fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
