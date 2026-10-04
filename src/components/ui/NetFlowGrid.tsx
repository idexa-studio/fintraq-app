import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import { IconAvatar } from './IconAvatar';
import { MoneyText } from './MoneyText';
import { Text } from './Text';
import { formatCurrency } from '@/src/utils/format';
import { TrendBadge } from './TrendBadge';

type Props = {
  income: number;
  expense: number;
  currency: string;
  /** Change against the previous period, in percent; null hides the badge. */
  incomeDelta?: number | null;
  expenseDelta?: number | null;
};

/**
 * A period in two cards side by side: the net on the left with how much of the income was kept,
 * and income over expenses stacked on the right. Used for Home's month and Analytics' period.
 */
export const NetFlowGrid = React.memo(function NetFlowGrid({ income, expense, currency, incomeDelta = null, expenseDelta = null }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const net = income - expense;
  const kept = income > 0 ? net / income : null;
  // Size by length instead of shrinking glyphs: a long net steps down one type size and stays whole.
  const longNet = formatCurrency(Math.abs(net), currency).length > 10;
  // Both rows place their badge the same way: beside the figure when both figures are short, under it otherwise.
  const badgesBelow = Math.max(formatCurrency(income, currency).length, formatCurrency(expense, currency).length) > 9;

  const flow = (icon: IconSource, tint: string, label: string, amount: number, delta: number | null, positiveIsGood: boolean) => (
    <View style={styles.flow}>
      <View style={styles.flowHead}>
        <IconAvatar icon={icon} color={tint} size={24} iconSize={12} weight="bold" />
        <Text variant="caption" tone="muted" numberOfLines={1} style={styles.shrink}>
          {label}
        </Text>
      </View>
      <View style={[styles.flowValue, badgesBelow && styles.flowValueStacked]}>
        <MoneyText amount={amount} currency={currency} weight="semibold" style={styles.flowAmount} maxChars={13} />
        <TrendBadge delta={delta} positiveIsGood={positiveIsGood} />
      </View>
    </View>
  );

  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.netCard]}>
        <View style={styles.netTop}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {t('analytics.netPosition')}
          </Text>
          <MoneyText
            amount={Math.abs(net)}
            currency={currency}
            type={net >= 0 ? 'CR' : 'DR'}
            weight="bold"
            style={longNet ? styles.netLong : styles.net}
            maxChars={14}
          />
        </View>
        {kept !== null ? (
          <View style={styles.keptBlock}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(1, Math.abs(kept)) * 100}%`, backgroundColor: kept >= 0 ? colors.success : colors.danger }]} />
            </View>
            <Text variant="micro" tone="muted" numberOfLines={2}>
              {kept >= 0
                ? t('analytics.savedShare', { pct: Math.round(kept * 100) })
                : t('analytics.overspentShare', { pct: Math.round(Math.abs(kept) * 100) })}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        {flow('arrow-down-left', colors.success, t('analytics.income'), income, incomeDelta, true)}
        <View style={styles.divider} />
        {flow('arrow-up-right', colors.danger, t('analytics.expenses'), expense, expenseDelta, false)}
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing('3') },
    card: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('3') },
    netCard: { justifyContent: 'space-between' },
    netTop: { gap: spacing('1') },
    net: { ...typography.metrics.xxl },
    netLong: { ...typography.metrics.xl },
    keptBlock: { gap: spacing('1.5') },
    track: { height: 6, borderRadius: radius('full'), backgroundColor: colors.card, overflow: 'hidden' },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius('full') },
    flow: { gap: spacing('1.5') },
    flowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    flowValue: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    flowValueStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: spacing('1') },
    shrink: { flex: 1, minWidth: 0 },
    flowAmount: { ...typography.metrics.lg, flexShrink: 0 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: alpha(colors.text, 'subtle') },
  });
