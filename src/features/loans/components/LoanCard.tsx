import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import type { LoanWithStats } from '../api/loans';
import { LoanStatusBadge } from './LoanStatusBadge';
import { format } from 'date-fns';

type Props = {
  loan: LoanWithStats;
  onPress: (loan: LoanWithStats) => void;
  compact?: boolean;
  isLast?: boolean;
};

export const LoanCard = React.memo(function LoanCard({ loan, onPress, compact = false, isLast = false }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const personColor = useMemo(
    () => loan.personColor != null ? colorNumberToHex(loan.personColor) : '#8B8B8B',
    [loan.personColor],
  );
  const personName = loan.personName ?? (loan.type === 'lend' ? 'Unknown' : 'Unnamed source');
  const handlePress = useCallback(() => onPress(loan), [onPress, loan]);

  const pct = loan.principal > 0 ? Math.min(100, Math.round((loan.repaid / loan.principal) * 100)) : 0;
  const isRepaid = loan.computedStatus === 'repaid';
  const isOverdue = loan.computedStatus === 'overdue';

  if (compact) {
    return (
      <BentoPressable onPress={handlePress} style={[styles.compactRow, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}>
        <View style={[styles.typeDot, { backgroundColor: loan.type === 'lend' ? colors.success + '30' : colors.danger + '30' }]}>
          <Text style={[styles.typeDotText, { color: loan.type === 'lend' ? colors.success : colors.danger }]}>
            {loan.type === 'lend' ? 'L' : 'B'}
          </Text>
        </View>
        <View style={styles.compactMeta}>
          <Text style={[styles.compactLabel, { color: colors.text }]} numberOfLines={1}>
            {loan.type === 'lend' ? 'Lent' : 'Borrowed'} · {loan.accountName}
          </Text>
          {loan.dueDate && !isRepaid && (
            <Text style={[styles.compactHint, { color: isOverdue ? colors.danger : colors.textMuted }]} numberOfLines={1}>
              Due {format(new Date(loan.dueDate), 'MMM d, yyyy')}
            </Text>
          )}
          {isRepaid && (
            <Text style={[styles.compactHint, { color: colors.success }]}>Fully repaid</Text>
          )}
        </View>
        <View style={styles.compactRight}>
          <MoneyText
            amount={isRepaid ? loan.principal : loan.outstanding}
            currency={loan.currency}
            type={isRepaid ? 'NONE' : (loan.type === 'lend' ? 'CR' : 'DR')}
            weight="semibold"
            compact
            style={[styles.compactAmount, isRepaid && { color: colors.textMuted }]}
          />
          <LoanStatusBadge status={loan.computedStatus} />
        </View>
      </BentoPressable>
    );
  }

  return (
    <BentoPressable onPress={handlePress} style={[styles.card, isRepaid && { opacity: 0.65 }]}>
      {/* Top row */}
      <View style={styles.top}>
        <PersonAvatar name={personName} color={personColor} size={40} />
        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{personName}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={1}>
            {loan.type === 'lend' ? 'Lent out' : 'Borrowed'} · {loan.accountName}
          </Text>
        </View>
        <LoanStatusBadge status={loan.computedStatus} />
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <View>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
            {isRepaid ? 'Total principal' : 'Outstanding'}
          </Text>
          <MoneyText
            amount={isRepaid ? loan.principal : loan.outstanding}
            currency={loan.currency}
            type={isRepaid ? 'NONE' : (loan.type === 'lend' ? 'CR' : 'DR')}
            weight="bold"
            style={styles.amount}
          />
        </View>
        {!isRepaid && loan.principal > 0 && (
          <View style={styles.pctBadge}>
            <Text style={[styles.pctText, { color: colors.textMuted }]}>{pct}% paid</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      {loan.dueDate && !isRepaid && (
        <Text style={[styles.footer, { color: isOverdue ? colors.danger : colors.textMuted }]}>
          Due {format(new Date(loan.dueDate), 'MMM d, yyyy')}
        </Text>
      )}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    // Full card
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      marginBottom: spacing('3'),
      gap: spacing('3'),
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    meta: { flex: 1, gap: spacing('0.5') },
    name: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
    },
    hint: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    amountLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      marginBottom: spacing('0.5'),
    },
    amount: { fontSize: typography.sizes.xl },
    pctBadge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.text + '0C',
    },
    pctText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.xs,
    },
    footer: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
    },

    // Compact row (used in PersonDetailScreen)
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingVertical: spacing('3'),
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    typeDot: {
      width: 32,
      height: 32,
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeDotText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
    },
    compactMeta: { flex: 1, gap: spacing('0.5') },
    compactLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.sm,
    },
    compactHint: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
    },
    compactRight: {
      alignItems: 'flex-end',
      gap: spacing('1'),
    },
    compactAmount: { fontSize: typography.sizes.md },
  });
