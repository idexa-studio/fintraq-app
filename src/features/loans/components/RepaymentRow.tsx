import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconAvatar, ListItem, MoneyText } from '@/src/components/ui';
import type { LoanRepaymentRow, LoanType } from '@/src/features/loans/api/loans';
import { useTheme } from '@/src/providers/ThemeProvider';
import { formatDate } from '@/src/utils/format';

type Props = {
  row: LoanRepaymentRow;
  loanType: LoanType;
  /** The transaction that opened the loan, rather than a repayment. */
  isCreation?: boolean;
};

/** One money movement on a loan, as a standard list row inside the history ListGroup. */
export const RepaymentRow = React.memo(function RepaymentRow({ row, loanType, isCreation = false }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isLend = loanType === 'lend';
  // Money coming to you is CR: repayments of what you lent, or the loan you received.
  const incoming = isCreation ? !isLend : isLend;
  const label = isCreation ? (isLend ? t('loans.loanGiven') : t('loans.loanReceived')) : isLend ? t('loans.repaymentReceived') : t('loans.repaymentSent');

  return (
    <ListItem
      leading={
        <IconAvatar icon={incoming ? 'arrow-down-left' : 'arrow-up-right'} color={isCreation ? colors.textMuted : incoming ? colors.success : colors.danger} size={40} />
      }
      title={row.note || label}
      subtitle={`${formatDate(new Date(row.datetime), { day: 'numeric', month: 'short', year: 'numeric' })} · ${row.accountName}`}
      trailing={<MoneyText amount={row.amount} currency={row.accountCurrency} type={incoming ? 'CR' : 'DR'} weight="semibold" compact />}
      showChevron={false}
    />
  );
});
