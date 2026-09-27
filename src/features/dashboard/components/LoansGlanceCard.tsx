import { Text } from '@/src/components/ui/Text';
import { HandshakeIcon } from '@hugeicons/core-free-icons';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
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

  if (!summary || (summary.activeLentCount === 0 && summary.activeBorrowedCount === 0)) {
    return (
      <BentoPressable style={styles.padded} onPress={onPress} accessibilityRole="button" accessibilityLabel={t('dashboard.noLoans')}>
        <EmptyState variant="inline" icon={HandshakeIcon} title={t('dashboard.noLoans')} description={t('dashboard.loanHint')} />
      </BentoPressable>
    );
  }

  const tiles = [
    { key: 'lent', label: t('dashboard.lentOut'), color: colors.success, amount: summary.totalLent, type: 'CR', active: summary.activeLentCount, overdue: summary.overdueLentCount },
    { key: 'borrowed', label: t('dashboard.borrowed'), color: colors.danger, amount: summary.totalBorrowed, type: 'DR', active: summary.activeBorrowedCount, overdue: summary.overdueBorrowedCount },
  ] as const;

  return (
    <View style={[styles.grid, styles.padded]}>
      {tiles.map((tile) => (
        <BentoPressable key={tile.key} style={styles.tile} onPress={onPress} accessibilityRole="button" accessibilityLabel={tile.label}>
          <View style={styles.tileHeader}>
            <Text variant="label" color={tile.color} numberOfLines={1} style={styles.flex}>{tile.label}</Text>
            {tile.overdue > 0 ? <Badge label={t('dashboard.overdue', { count: tile.overdue })} color={colors.danger} /> : null}
          </View>
          <MoneyText amount={tile.amount} currency={currency} type={tile.type} weight="bold" compact style={styles.tileAmount} />
          <Text variant="caption" tone="muted">{t('dashboard.active', { count: tile.active })}</Text>
        </BentoPressable>
      ))}
    </View>
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
    tileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    flex: { flexShrink: 1 },
    tileAmount: { ...typography.metrics.xl },
  });
