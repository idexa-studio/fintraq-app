import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, MoneyText, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { toTrendBars } from '@/src/utils/analytics';
import { magnitudeRamp } from '@/src/theme/chart';
import { formatCurrency } from '@/src/utils/format';

export type TrendBucket = { label: string; income: number; expense: number };

type Props = {
  data: TrendBucket[];
  currency: string;
};

const HEIGHT = 140;

/**
 * Spending per day (or week/month on long ranges) as bars against a dashed average line. Income is
 * left to the summary card: a salary day would dwarf every expense bar and flatten the chart.
 * The latest bar starts selected; tapping any bar shows its label and amount in the header.
 */
export const SpendingTrendChart = React.memo(function SpendingTrendChart({ data, currency }: Props) {
  const theme = useTheme();
  const ramp = useMemo(() => magnitudeRamp(theme.colors), [theme.colors]);
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const bars = useMemo(() => toTrendBars(data), [data]);
  const max = Math.max(1, ...bars.map((b) => b.amount));
  const average = bars.length > 0 ? bars.reduce((sum, b) => sum + b.amount, 0) / bars.length : 0;
  const [picked, setPicked] = useState<number | null>(null);
  // A range change can leave the old index past the end.
  const selectedIndex = picked !== null && picked < bars.length ? picked : bars.length - 1;
  const selected = bars[selectedIndex];

  const middle = bars[Math.floor((bars.length - 1) / 2)];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {selected?.label ?? ''}
          </Text>
          <MoneyText amount={selected?.amount ?? 0} currency={currency} weight="bold" style={styles.amount} numberOfLines={1} />
        </View>
        <View style={styles.avgKey}>
          <View style={styles.avgSwatch} />
          <Text variant="caption" tone="muted">
            {t('analytics.trendAverage', { amount: formatCurrency(average, currency) })}
          </Text>
        </View>
      </View>

      <View style={styles.plot}>
        {average > 0 ? <View pointerEvents="none" style={[styles.avgLine, { bottom: (average / max) * HEIGHT }]} /> : null}
        {bars.map((bar, i) => {
          const isSelected = i === selectedIndex;
          return (
            <BentoPressable
              key={`${bar.label}-${i}`}
              scaleOnPress={false}
              style={styles.slot}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPicked(i);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${bar.label}, ${formatCurrency(bar.amount, currency)}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: bar.amount > 0 ? Math.max(4, (bar.amount / max) * HEIGHT) : 2,
                    backgroundColor: isSelected ? ramp.active : bar.amount > average ? ramp.mid : ramp.low,
                  },
                ]}
              />
            </BentoPressable>
          );
        })}
      </View>

      {/* First, middle and last labels: enough to place the range without crowding thin bars. */}
      <View style={styles.axis}>
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {bars[0]?.label.split(' – ')[0]}
        </Text>
        {bars.length > 2 ? (
          <Text variant="micro" tone="muted" numberOfLines={1}>
            {middle?.label.split(' – ')[0]}
          </Text>
        ) : null}
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {bars[bars.length - 1]?.label.split(' – ').pop()}
        </Text>
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    wrap: { gap: spacing('3') },
    header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing('3') },
    headerText: { flexShrink: 1, gap: spacing('0.5') },
    amount: { ...typography.metrics.xl },
    avgKey: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5'), paddingBottom: spacing('0.5') },
    avgSwatch: { width: 14, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textMuted },
    plot: { height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    slot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: radius('xs') },
    avgLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderTopWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: alpha(colors.text, 'medium'),
      zIndex: 1,
    },
    axis: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing('2') },
  });
