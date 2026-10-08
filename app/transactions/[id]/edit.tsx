import { TransactionFormScreen } from '@/features/transactions';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/transactions/<id>/edit` */
export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a transaction that does not exist.
  return <TransactionFormScreen transactionId={Number.isFinite(transactionId) ? transactionId : -1} />;
}
