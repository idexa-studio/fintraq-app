import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconAvatar, MoneyText, Skeleton, Text, TrendBadge } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { buildMonthPulse } from '@/src/features/dashboard/utils/widgets';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = { currency: string };

type TileProps = {
  icon: IconSource;
  tint: string;
  label: string;
  amount: number;
  currency: string;
  badge?: React.ReactNode;
  /** 0–1 fill of the bar; null hides the bar. */
  fill: number | null;
  barColor: string;
  /** Position of a notch in the bar (today's place in the month). */
  tick?: number;
  caption: string;
  accessibilityLabel?: string;
};

/**
 * This month as two tiles side by side: what went out (against last month, with a "today" notch so
 * the pace reads without maths) and what came in (with how much of it was kept).
 */
export const MonthPulseCard = React.memo(function MonthPulseCard({ currency }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: totals, isLoading } = useMonthTotals(currency);

  const pulse = useMemo(() => (totals ? buildMonthPulse(totals, new Date()) : null), [totals]);

  if (isLoading || !pulse) {
    return (
      <View style={[styles.row, styles.margin]}>
        <Skeleton height={168} radius="xl" style={styles.skeleton} />
        <Skeleton height={168} radius="xl" style={styles.skeleton} />
      </View>
    );
  }

  const share = pulse.shareOfLastMonth;
  // Over last month's total, or ahead of the calendar with a real baseline, is worth a warning colour.
  const spendColor = share !== null && share >= 1 ? colors.danger : share !== null && share > pulse.monthProgress ? colors.warning : colors.primary;
  const kept = pulse.income > 0 ? (pulse.income - pulse.expense) / pulse.income : null;

  const spentCaption =
    share !== null
      ? t('dashboard.pulseOfLast', { pct: Math.round(share * 100) })
      : pulse.expense === 0
        ? t('dashboard.pulseEmpty')
        : t('dashboard.pulseDay', { day: pulse.dayOfMonth, total: pulse.daysInMonth });
  const keptCaption =
    kept === null ? t('dashboard.pulseNoIncome') : kept < 0 ? t('dashboard.pulseOverIncome') : t('dashboard.pulseKept', { pct: Math.round(kept * 100) });

  return (
    <View style={[styles.row, styles.margin]}>
      <Tile
        icon="arrow-up-right"
        tint={colors.danger}
        label={t('dashboard.pulseSpent')}
        amount={pulse.expense}
        currency={currency}
        badge={<TrendBadge delta={pulse.deltaVsLastMonth} positiveIsGood={false} />}
        fill={share !== null ? Math.min(1, share) : null}
        barColor={spendColor}
        tick={share !== null ? pulse.monthProgress : undefined}
        caption={spentCaption}
        accessibilityLabel={spentCaption}
        styles={styles}
      />
      <Tile
        icon="arrow-down-left"
        tint={colors.success}
        label={t('dashboard.pulseIncome')}
        amount={pulse.income}
        currency={currency}
        fill={kept !== null ? Math.max(0, kept) : null}
        barColor={kept !== null && kept < 0 ? colors.danger : colors.success}
        caption={keptCaption}
        styles={styles}
      />
    </View>
  );
});

function Tile({ icon, tint, label, amount, currency, badge, fill, barColor, tick, caption, accessibilityLabel, styles }: TileProps & { styles: Styles }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileHead}>
        <IconAvatar icon={icon} color={tint} size={30} iconSize={15} weight="bold" />
        {badge}
      </View>
      <View style={styles.figure}>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {label}
        </Text>
        <MoneyText amount={amount} currency={currency} weight="bold" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} />
      </View>
      <View style={styles.barBlock}>
        <View
          style={styles.track}
          accessibilityRole={fill !== null ? 'progressbar' : undefined}
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={fill !== null ? { min: 0, max: 100, now: Math.round(fill * 100) } : undefined}
        >
          {fill !== null ? <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: barColor }]} /> : null}
          {tick !== undefined ? <View style={[styles.tick, { left: `${tick * 100}%` }]} /> : null}
        </View>
        <Text variant="micro" tone="muted" numberOfLines={2}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

const TRACK = 6;

type Styles = ReturnType<typeof createStyles>;

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    row: { flexDirection: 'row', gap: spacing('3') },
    skeleton: { flex: 1 },
    tile: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3'),
    },
    tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing('2'), minHeight: 30 },
    figure: { gap: 2 },
    amount: { ...typography.metrics.xl },
    barBlock: { gap: spacing('1.5') },
    track: { height: TRACK, borderRadius: radius('full'), backgroundColor: colors.card, overflow: 'hidden' },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius('full') },
    // A notch at today's position in the month.
    tick: { position: 'absolute', top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: colors.text },
  });
