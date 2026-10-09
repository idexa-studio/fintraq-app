import type { LoanWithStats } from '@/data/repositories/loans';
import { Badge, Card, CardActions, IconCircle, Money, ProgressBar, Text, Touchable, useStyles } from '@/design';
import type { Theme } from '@/design';
import { repaidShare } from '@/features/loans/loan-rules';
import { initialsOf } from '@/features/people';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type LoanCardProps = {
  loan: LoanWithStats;
  /** Who and which way, under the name: "Owes you · Due in 3 days". */
  line: string;
  onOpen: () => void;
  onRepay: () => void;
};

/**
 * An open loan as the thing it is: whose it is, what is still owed, how much of it has come back,
 * and the one thing done with it most. Green when the money is coming to you.
 */
export function LoanCard({ loan, line, onOpen, onRepay }: LoanCardProps) {
  const { t } = useTranslation('loans');
  const styles = useStyles(createStyles);
  const money = (amount: number) => formatCurrency(amount, loan.currency);
  const name = loan.personName ?? t(loan.type === 'lend' ? 'title.lendNoName' : 'title.borrowNoName');
  const progress = t('loan.progress', { repaid: money(loan.repaid), total: money(loan.principal) });

  return (
    <Card padded={false}>
      <Touchable onPress={onOpen} accessibilityLabel={`${name}, ${line}, ${money(loan.outstanding)}, ${progress}`} style={styles.body}>
        <View style={styles.head}>
          {loan.personName ? <IconCircle initials={initialsOf(loan.personName)} color={colorNumberToHex(loan.personColor ?? 0)} /> : <IconCircle icon="hand-coins" color="pink" />}
          <View style={styles.who}>
            <Text variant="bodyStrong" numberOfLines={1}>{name}</Text>
            <Text variant="callout" tone="muted" numberOfLines={1}>{line}</Text>
          </View>
          {loan.computedStatus === 'overdue' ? <Badge label={t('status.overdue')} tone="danger" /> : null}
        </View>
        <Money value={money(loan.outstanding)} variant="amountLarge" tone={loan.type === 'lend' ? 'positive' : 'default'} />
        <ProgressBar value={repaidShare(loan)} accessibilityLabel={t('loan.progressLabel')} />
        <Text variant="callout" tone="muted">{progress}</Text>
      </Touchable>
      <CardActions actions={[{ label: t('loan.repay'), onPress: onRepay }]} />
    </Card>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    body: { padding: size.cardPadding, gap: space.md },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    who: { flex: 1, gap: space.xxs },
  });
