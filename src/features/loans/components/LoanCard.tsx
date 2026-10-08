import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, MoneyText, PersonAvatar, ProgressBar, Text } from '@/src/components/ui';
import type { LoanWithStats } from '@/data/repositories/loans';
import { LoanStatusBadge } from '@/src/features/loans/components/LoanStatusBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { formatDate , parseDateKey } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';

type Props = {
  loan: LoanWithStats;
  onPress: (loan: LoanWithStats) => void;
};

/** Who, how much is left, and how far along repayment is. */
export const LoanCard = React.memo(function LoanCard({ loan, onPress }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isLend = loan.type === 'lend';
  const isRepaid = loan.computedStatus === 'repaid';
  const isOverdue = loan.computedStatus === 'overdue';
  const personName = loan.personName ?? (isLend ? t('loans.unknown') : t('loans.unnamedSource'));
  const pct = loan.principal > 0 ? Math.min(100, Math.round((loan.repaid / loan.principal) * 100)) : 0;
  const accent = isLend ? colors.success : colors.danger;

  return (
    <BentoPressable style={styles.card} onPress={() => onPress(loan)} accessibilityRole="button" accessibilityLabel={personName}>
      <View style={styles.top}>
        <PersonAvatar name={personName} color={loan.personColor != null ? colorNumberToHex(loan.personColor) : colors.textMuted} size={40} />
        <View style={styles.meta}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {personName}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {isLend ? t('loans.lentOut') : t('loans.borrowed')} · {loan.accountName}
          </Text>
        </View>
        <LoanStatusBadge status={loan.computedStatus} />
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text variant="micro" tone="muted">
            {isRepaid ? t('loans.totalPrincipal') : t('loans.outstanding')}
          </Text>
          <MoneyText
            amount={isRepaid ? loan.principal : loan.outstanding}
            currency={loan.currency}
            type={isRepaid ? 'NONE' : isLend ? 'CR' : 'DR'}
            weight="bold"
            style={styles.amount}
            numberOfLines={1}
          />
        </View>
        {loan.dueDate && !isRepaid ? (
          <Text variant="caption" tone={isOverdue ? 'danger' : 'muted'}>
            {t('loans.due', { date: formatDate(parseDateKey(loan.dueDate), { day: 'numeric', month: 'short', year: 'numeric' }) })}
          </Text>
        ) : null}
      </View>

      {!isRepaid && loan.principal > 0 ? (
        <View style={styles.progress}>
          <ProgressBar progress={pct} height={6} color={accent} accessibilityLabel={t('loans.repaidPct', { pct })} />
          <Text variant="micro" tone="muted">
            {t('loans.repaidPct', { pct })}
          </Text>
        </View>
      ) : null}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('3') },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    meta: { flex: 1, gap: spacing('0.5') },
    amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing('3') },
    amountBlock: { flexShrink: 1, gap: spacing('0.5') },
    amount: typography.metrics.xl,
    progress: { gap: spacing('1.5') },
  });
