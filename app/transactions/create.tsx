import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { TransactionFormPage } from '@/src/features/transactions/screens/TransactionFormPage';
import type { TransactionType } from '@/src/types';

const TYPES: readonly TransactionType[] = ['DR', 'CR', 'TR'];

/** Optional params pre-set the form: `type` (DR | CR | TR) and `accountId`. */
export default function CreateTransactionRoute() {
  const { type, accountId } = useLocalSearchParams<{ type?: string; accountId?: string }>();
  const initialType = TYPES.find((t) => t === type);
  const parsedAccountId = Number.parseInt(accountId ?? '', 10);
  return <TransactionFormPage mode="create" initialType={initialType} initialAccountId={Number.isFinite(parsedAccountId) ? parsedAccountId : undefined} />;
}
