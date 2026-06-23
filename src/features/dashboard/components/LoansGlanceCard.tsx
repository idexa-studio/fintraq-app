import { HandshakeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { MoneyText } from '../../../components/ui/MoneyText';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useLoansSummary } from '../../loans/hooks/loans';

type Props = {
  currency: string;
  onPress: () => void;
};

export const LoansGlanceCard = React.memo(function LoansGlanceCard({ currency, onPress }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: summary } = useLoansSummary(currency);

  if (!summary || (summary.activeLentCount === 0 && summary.activeBorrowedCount === 0)) {
    return null;
  }

  return (
    <BentoPressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <HugeiconsIcon icon={HandshakeIcon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.title, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
          Loans
        </Text>
        {summary.overdueCount > 0 && (
          <View style={[styles.overdueBadge, { backgroundColor: colors.danger + '20' }]}>
            <Text style={[styles.overdueText, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>
              {summary.overdueCount} overdue
            </Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.tile}>
          <Text style={[styles.tileLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.success }]}>
            Lent out
          </Text>
          <MoneyText amount={summary.totalLent} currency={currency} type="CR" weight="bold" compact style={styles.tileAmount} />
          <Text style={[styles.tileSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            {summary.activeLentCount} active
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.tile}>
          <Text style={[styles.tileLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.danger }]}>
            Borrowed
          </Text>
          <MoneyText amount={summary.totalBorrowed} currency={currency} type="DR" weight="bold" compact style={styles.tileAmount} />
          <Text style={[styles.tileSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            {summary.activeBorrowedCount} active
          </Text>
        </View>
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, shadow }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      marginHorizontal: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      ...shadow('sm'),
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing('2'), marginBottom: spacing('3') },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius('md'),
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { flex: 1, fontSize: 15 },
    overdueBadge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    overdueText: { fontSize: 11 },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    tile: { flex: 1, gap: spacing('1') },
    tileLabel: { fontSize: 11, textTransform: 'uppercase' },
    tileAmount: { fontSize: 20 },
    tileSub: { fontSize: 12 },
    divider: { width: 1, marginHorizontal: spacing('4') },
  });
