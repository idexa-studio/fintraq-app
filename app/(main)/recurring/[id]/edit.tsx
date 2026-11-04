import { TransactionFormScreen } from '@/features/transactions';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/recurring/<id>/edit`: an item is changed on the same form it was made on. */
export default function EditRecurringRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const ruleId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as an item that does not exist.
  return <TransactionFormScreen ruleId={Number.isFinite(ruleId) ? ruleId : -1} />;
}
