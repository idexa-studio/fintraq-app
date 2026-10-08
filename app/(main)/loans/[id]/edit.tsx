import { LoanEditScreen } from '@/features/loans';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/loans/<id>/edit` */
export default function LoanEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const loanId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a loan that does not exist.
  return <LoanEditScreen loanId={Number.isFinite(loanId) ? loanId : -1} />;
}
