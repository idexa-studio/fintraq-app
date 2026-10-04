import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, SegmentedControl, Text } from '@/src/components/ui';
import { ANALYTICS_RANGES, FREE_RANGE_DAYS, RangeDays } from '@/src/features/analytics/constants';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AnalyticsWindow } from '@/src/utils/analytics';
import { formatDate } from '@/src/utils/format';

type AnalyticsControlsProps = {
  currencies: readonly string[];
  currency: string;
  onCurrencyChange: (currency: string) => void;
  range: RangeDays;
  onRangeChange: (range: RangeDays) => void;
  /** The period the figures below cover. */
  window: AnalyticsWindow;
  isPremium: boolean;
  /** Tapped a Pro-only range while on the free plan. */
  onLockedRange: () => void;
};

/** The window's own dates, so the caption always names exactly the days the figures cover. */
function windowCaption(window: AnalyticsWindow): string {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d);
  };
  const options: Intl.DateTimeFormatOptions = window.byMonth ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return `${formatDate(parse(window.start), options)} – ${formatDate(parse(window.end), options)}`;
}

/** Period, then the dates it covers with the currency picker (only when there's more than one) beside them. */
export const AnalyticsControls = React.memo(function AnalyticsControls({
  currencies,
  currency,
  onCurrencyChange,
  range,
  onRangeChange,
  window,
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
        icon: !isPremium && r.days !== FREE_RANGE_DAYS ? ('lock-key' as const) : undefined,
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
      <SegmentedControl options={rangeOptions} value={String(range) as `${RangeDays}`} onChange={handleRange} size="sm" />
      <View style={styles.footer}>
        <Text variant="caption" tone="muted" numberOfLines={1} style={styles.caption}>
          {windowCaption(window)}
        </Text>
        {currencies.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
            {currencies.map((c) => (
              <Chip key={c} label={c} size="sm" isActive={c === currency} onPress={() => onCurrencyChange(c)} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    container: { gap: spacing('3') },
    // Dates on the left, the compact currency picker trailing on the same line instead of a row of its own.
    footer: { flexDirection: 'row', alignItems: 'center', gap: spacing('3'), minHeight: 28 },
    caption: { flex: 1 },
    // Sizes to its chips, capped so the dates keep room; many currencies scroll.
    chipsScroll: { flexGrow: 0, maxWidth: '58%' },
    chips: { gap: spacing('1.5') },
  });
