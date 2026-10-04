import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useLoansSummary } from '@/src/features/loans/hooks/loans';

type Props = {
  currency: string;
  onPress: () => void;
};

export const LoansGlanceCard = React.memo(function LoansGlanceCard({ currency, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: summary } = useLoansSummary(currency);

  // Nothing to glance at: the section stays hidden and the Loan quick action is the way in.
  if (!summary || (summary.activeLentCount === 0 && summary.activeBorrowedCount === 0)) return null;

  const tiles = [
    {
      key: 'lent',
      label: t('dashboard.lentOut'),
      color: colors.success,
      amount: summary.totalLent,
      type: 'CR',
      active: summary.activeLentCount,
      overdue: summary.overdueLentCount,
    },
    {
      key: 'borrowed',
      label: t('dashboard.borrowed'),
      color: colors.danger,
      amount: summary.totalBorrowed,
      type: 'DR',
      active: summary.activeBorrowedCount,
      overdue: summary.overdueBorrowedCount,
    },
  ] as const;

  return (
    <>
      <SectionHeader title={t('dashboard.loans')} rightText={t('dashboard.seeAll')} onPressRight={onPress} />
      <View style={[styles.grid, styles.padded]}>
        {tiles.map((tile) => (
          <BentoPressable key={tile.key} style={styles.tile} onPress={onPress} accessibilityRole="button" accessibilityLabel={tile.label}>
            <View style={styles.tileHeader}>
              <Text variant="label" color={tile.color} numberOfLines={2} style={styles.label}>
                {tile.label}
              </Text>
              {tile.overdue > 0 ? <Badge label={t('dashboard.overdue', { count: tile.overdue })} color={colors.danger} /> : null}
            </View>
            <MoneyText amount={tile.amount} currency={currency} type={tile.type} weight="bold" compact style={styles.tileAmount} />
            <Text variant="caption" tone="muted">
              {t('dashboard.active', { count: tile.active })}
            </Text>
          </BentoPressable>
        ))}
      </View>
    </>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    padded: { marginHorizontal: layout.screenPadding },
    grid: { flexDirection: 'row', gap: spacing('2.5') },
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('1.5'),
    },
    // Wraps so a long label (Tamil, German) pushes the overdue badge to the next line instead of truncating.
    tileHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing('1.5') },
    label: { flexShrink: 1 },
    tileAmount: { ...typography.metrics.xl },
  });
