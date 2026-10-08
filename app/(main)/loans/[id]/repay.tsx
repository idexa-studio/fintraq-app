import { RepaymentScreen } from '@/features/loans';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/loans/<id>/repay` */
export default function RepaymentRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loanId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a loan that does not exist.
  return <RepaymentScreen loanId={Number.isFinite(loanId) ? loanId : -1} />;
}
