import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, SegmentedControl, Text } from '@/src/components/ui';
import { LockKeyIcon } from '@/src/components/ui/icons';
import { ANALYTICS_RANGES, FREE_RANGE_DAYS, RangeDays } from '@/src/features/analytics/constants';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type AnalyticsControlsProps = {
  currencies: readonly string[];
  currency: string;
  onCurrencyChange: (currency: string) => void;
  range: RangeDays;
  onRangeChange: (range: RangeDays) => void;
  isPremium: boolean;
  /** Tapped a Pro-only range while on the free plan. */
  onLockedRange: () => void;
};

function rangeCaption(range: RangeDays, now: Date): string {
  const start = new Date(now);
  if (range === 365) {
    start.setDate(1);
    start.setMonth(start.getMonth() - 11);
    return `${format(start, 'MMM yyyy')} – ${format(now, 'MMM yyyy')}`;
  }
  start.setDate(start.getDate() - range + 1);
  return `${format(start, 'd MMM yyyy')} – ${format(now, 'd MMM yyyy')}`;
}

/** Currency (only when there's more than one) and period, with the dates the period covers. */
export const AnalyticsControls = React.memo(function AnalyticsControls({
  currencies,
  currency,
  onCurrencyChange,
  range,
  onRangeChange,
  isPremium,
  onLockedRange,
}: AnalyticsControlsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const rangeOptions = useMemo(
    () =>
      ANALYTICS_RANGES.map((r) => ({
        value: String(r.days) as `${RangeDays}`,
        label: r.label,
        icon: !isPremium && r.days !== FREE_RANGE_DAYS ? LockKeyIcon : undefined,
      })),
    [isPremium],
  );

  const handleRange = useCallback(
    (value: `${RangeDays}`) => {
      const days = Number(value) as RangeDays;
      if (!isPremium && days !== FREE_RANGE_DAYS) onLockedRange();
      else onRangeChange(days);
    },
    [isPremium, onLockedRange, onRangeChange],
  );

  return (
    <View style={styles.container}>
      {currencies.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
          {currencies.map((c) => (
            <Chip key={c} label={c} isActive={c === currency} onPress={() => onCurrencyChange(c)} />
          ))}
        </ScrollView>
      )}
      <SegmentedControl options={rangeOptions} value={String(range) as `${RangeDays}`} onChange={handleRange} size="sm" />
      <Text variant="caption" tone="muted">
        {rangeCaption(range, new Date())}
      </Text>
    </View>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { gap: spacing('3') },
    // Chips scroll edge to edge while their first chip lines up with the content.
    bleed: { marginHorizontal: -layout.screenPadding },
    chips: { gap: spacing('2'), paddingHorizontal: layout.screenPadding },
  });
