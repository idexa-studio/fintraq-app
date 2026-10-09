import type { LoanWithStats } from '@/data/repositories/loans';
import { IconCircle, ProgressBar, Text, Touchable, ltr, useStyles } from '@/design';
import type { Theme } from '@/design';
import { repaidShare } from '@/features/loans/loan-rules';
import { initialsOf } from '@/features/people';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type LoanRowProps = {
  loan: LoanWithStats;
  /** Who and which way, under the bar: "Owes you · Due in 3 days". */
  line: string;
  onOpen: () => void;
};

/**
 * An open loan as one row of a list: whose it is, what is still owed, and a bar for how much of
 * it has come back. Green when the money is coming to you. What is done with a loan (a repayment,
 * its due date) is on its own screen, so the row only opens it.
 */
export function LoanRow({ loan, line, onOpen }: LoanRowProps) {
  const { t } = useTranslation('loans');
  const styles = useStyles(createStyles);
  const owed = formatCurrency(loan.outstanding, loan.currency);
  const name = loan.personName ?? t(loan.type === 'lend' ? 'title.lendNoName' : 'title.borrowNoName');

  return (
    <Touchable onPress={onOpen} accessibilityLabel={`${name}, ${line}, ${owed}`} style={styles.row}>
      {loan.personName ? <IconCircle initials={initialsOf(loan.personName)} color={colorNumberToHex(loan.personColor ?? 0)} /> : <IconCircle icon="hand-coins" color="pink" />}
      <View style={styles.text}>
        <View style={styles.head}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>{name}</Text>
          <Text variant="amount" tone={loan.type === 'lend' ? 'positive' : 'default'}>{ltr(owed)}</Text>
        </View>
        <ProgressBar value={repaidShare(loan)} accessibilityLabel={t('loan.progressLabel')} />
        <Text variant="callout" tone={loan.computedStatus === 'overdue' ? 'danger' : 'muted'} numberOfLines={1}>{line}</Text>
      </View>
    </Touchable>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    // The list row's own measures, so it sits in a ListGroup among ordinary rows.
    row: { minHeight: size.row, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: size.cardPadding, paddingVertical: space.lg },
    text: { flex: 1, gap: space.sm },
    head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.lg },
    name: { flex: 1 },
  });
