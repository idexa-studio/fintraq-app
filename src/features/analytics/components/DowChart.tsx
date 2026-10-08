import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui';
import { DOW_KEYS } from '@/shared/date/calendar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { magnitudeRamp } from '@/src/theme/chart';
import { formatCurrency } from '@/shared/format/money';

/** Average spend per weekday (0 = Sunday). */
type Props = { data: readonly { dow: number; total: number }[]; currency: string };

/** Monday-first, matching the spending rhythm calendar above it. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const HEIGHT = 120;

/**
 * Average spend per weekday. Shaded on the same single-hue scale as the spending rhythm calendar,
 * with the peak day solid and labelled, so the two charts read as one story.
 */
export const DowChart = React.memo(function DowChart({ data, currency }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const days = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.total));
    return WEEK_ORDER.map((dow) => {
      const total = data.find((d) => d.dow === dow)?.total ?? 0;
      return { dow, total, ratio: total / max, isPeak: total > 0 && total === max };
    });
  }, [data]);

  const ramp = useMemo(() => magnitudeRamp(colors), [colors]);
  const shade = (ratio: number, isPeak: boolean) => (isPeak ? ramp.active : ratio > 0.66 ? ramp.high : ratio > 0.33 ? ramp.mid : ramp.low);

  return (
    <View style={styles.row}>
      {days.map((d) => (
        <View
          key={d.dow}
          style={styles.col}
          accessible
          accessibilityLabel={`${t(`calendar.days.${DOW_KEYS[d.dow]!}`)}, ${formatCurrency(d.total, currency)}`}
        >
          <View style={styles.track}>
            {d.isPeak ? (
              <Text variant="label" numberOfLines={1} style={styles.peakLabel}>
                {formatCurrency(d.total, currency, true)}
              </Text>
            ) : null}
            <View style={[styles.fill, { height: Math.max(4, d.ratio * HEIGHT), backgroundColor: shade(d.ratio, d.isPeak) }]} />
          </View>
          <Text variant={d.isPeak ? 'label' : 'micro'} tone={d.isPeak ? 'default' : 'muted'}>
            {t(`calendar.daysShort.${DOW_KEYS[d.dow]!}`)}
          </Text>
        </View>
      ))}
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    // Headroom above the tallest bar for the peak's amount, plus the weekday row.
    row: { flexDirection: 'row', height: HEIGHT + 52, alignItems: 'flex-end', gap: spacing('2') },
    col: { flex: 1, alignItems: 'center', gap: spacing('1.5'), height: '100%' },
    track: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    fill: { width: '100%', borderRadius: radius('sm') },
    peakLabel: { marginBottom: spacing('1') },
  });
