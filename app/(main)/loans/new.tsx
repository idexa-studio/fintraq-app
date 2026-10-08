import { LoanFormScreen } from '@/features/loans';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/loans/new?type=lend|borrow&personId=` */
export default function NewLoanRoute() {
  const { type, personId } = useLocalSearchParams<{ type?: string; personId?: string }>();
  const person = Number.parseInt(personId ?? '', 10);
  return <LoanFormScreen initialType={type === 'borrow' ? 'borrow' : 'lend'} initialPersonId={Number.isFinite(person) ? person : undefined} />;
}
