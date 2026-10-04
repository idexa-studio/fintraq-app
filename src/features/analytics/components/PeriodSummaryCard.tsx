import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconAvatar, MoneyText, Text, TrendBadge } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import type { Totals } from '@/src/utils/analytics';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  totals: Totals;
  deltas: { income: number | null; expense: number | null };
  currency: string;
};

/**
 * The period in a 2-up grid — money in and money out, each against the previous period — with the
 * net and the share of income kept in one strip beneath, so the three figures never compete.
 */
export const PeriodSummaryCard = React.memo(function PeriodSummaryCard({ totals, deltas, currency }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const kept = totals.income > 0 ? totals.net / totals.income : null;
  const keptCaption =
    kept === null
      ? null
      : kept >= 0
        ? t('analytics.savedShare', { pct: Math.round(kept * 100) })
        : t('analytics.overspentShare', { pct: Math.round(Math.abs(kept) * 100) });

  const tile = (key: 'income' | 'expense', icon: IconSource, tint: string, amount: number, delta: number | null) => (
    <View style={styles.tile}>
      <View style={styles.tileHead}>
        <IconAvatar icon={icon} color={tint} size={30} iconSize={15} weight="bold" />
        <TrendBadge delta={delta} positiveIsGood={key === 'income'} />
      </View>
      <View style={styles.figure}>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {key === 'income' ? t('analytics.income') : t('analytics.expenses')}
        </Text>
        <MoneyText amount={amount} currency={currency} weight="bold" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {tile('income', 'arrow-down-left', colors.success, totals.income, deltas.income)}
        {tile('expense', 'arrow-up-right', colors.danger, totals.expense, deltas.expense)}
      </View>

      <View style={styles.strip}>
        <View style={styles.stripHead}>
          <Text variant="calloutStrong">{t('analytics.netPosition')}</Text>
          <MoneyText
            amount={Math.abs(totals.net)}
            currency={currency}
            type={totals.net >= 0 ? 'CR' : 'DR'}
            weight="bold"
            style={styles.net}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          />
        </View>
        {kept !== null ? (
          <View style={styles.keptBlock}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(1, Math.abs(kept)) * 100}%`, backgroundColor: kept >= 0 ? colors.success : colors.danger }]} />
            </View>
            <Text variant="caption" tone="muted">
              {keptCaption}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('3') },
    row: { flexDirection: 'row', gap: spacing('3') },
    tile: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('3') },
    tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing('2'), minHeight: 30 },
    figure: { gap: 2 },
    amount: { ...typography.metrics.xl },
    strip: { backgroundColor: colors.surface, borderRadius: radius('xl'), paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5'), gap: spacing('3') },
    stripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing('3') },
    net: { ...typography.metrics.lg },
    keptBlock: { gap: spacing('1.5') },
    track: { height: 6, borderRadius: radius('full'), backgroundColor: colors.card, overflow: 'hidden' },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius('full') },
  });
