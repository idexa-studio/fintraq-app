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
};

export const LoanCard = React.memo(function LoanCard({ loan, onPress }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const personColor = useMemo(() => colorNumberToHex(loan.personColor), [loan.personColor]);
  const handlePress = useCallback(() => onPress(loan), [onPress, loan]);

  const pct = loan.principal > 0 ? Math.round((loan.repaid / loan.principal) * 100) : 0;

  return (
    <BentoPressable onPress={handlePress} style={styles.card}>
      {/* ── Card top row: avatar + name + status badge ── */}
      <View style={styles.cardTop}>
        <View style={styles.cardLead}>
          <PersonAvatar name={loan.personName} color={personColor} size={40} />
          <View style={styles.cardMeta}>
            <Text style={styles.cardName} numberOfLines={1}>
              {loan.personName}
            </Text>
            <Text style={styles.cardHint} numberOfLines={1}>
              {loan.type === 'lend' ? 'Lent out' : 'Borrowed'} · {loan.accountName}
            </Text>
          </View>
        </View>
        <LoanStatusBadge status={loan.computedStatus} />
      </View>

      {/* ── Balance / Outstanding ── */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Outstanding balance</Text>
          <Text style={[
            styles.pctText,
            loan.computedStatus === 'overdue' && { color: colors.danger },
            loan.computedStatus === 'repaid' && { color: colors.success }
          ]}>
            {pct}% paid
          </Text>
        </View>
        <MoneyText
          amount={loan.outstanding}
          currency={loan.currency}
          type={loan.type === 'lend' ? 'CR' : 'DR'}
          weight="semibold"
          style={styles.cardBalance}
        />
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <View style={styles.statLabelRow}>
            <Text style={styles.statLabel}>Principal</Text>
          </View>
          <MoneyText
            amount={loan.principal}
            currency={loan.currency}
            type="NONE"
            weight="medium"
            compact
            style={styles.statValue}
          />
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCell}>
          <View style={styles.statLabelRow}>
            <Text style={styles.statLabel}>Repaid</Text>
          </View>
          <MoneyText
            amount={loan.repaid}
            currency={loan.currency}
            type="NONE"
            weight="medium"
            compact
            style={[styles.statValue, { color: colors.success }]}
          />
        </View>
      </View>

      {/* ── Divider & Footer (Only if due date exists) ── */}
      {loan.dueDate ? (
        <>
          <View style={styles.divider} />
          <View style={styles.cardFooter}>
            <Text style={[styles.footerText, loan.computedStatus === 'overdue' && { color: colors.danger }]}>
              Due {format(new Date(loan.dueDate), 'MMM d, yyyy')}
            </Text>
          </View>
        </>
      ) : null}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('4'),
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardLead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      flex: 1,
    },
    cardMeta: {
      flex: 1,
      gap: spacing('0.5'),
    },
    cardName: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    cardHint: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    balanceSection: {
      marginTop: spacing('4'),
      gap: spacing('1.5'),
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    balanceLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    pctText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    cardBalance: {
      fontSize: typography.sizes.lg,
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.text + '0C',
      marginTop: spacing('4'),
      marginBottom: spacing('3'),
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statCell: {
      flex: 1,
      gap: spacing('1'),
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.text + '0C',
      marginHorizontal: spacing('4'),
    },
    statLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
    },
    statValue: {
      fontSize: typography.sizes.md,
      fontFamily: typography.styles.sectionLabel.fontFamily,
      color: colors.text,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
  });
