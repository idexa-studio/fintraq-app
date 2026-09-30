import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { TransactionFormPage } from '@/src/features/transactions/screens/TransactionFormPage';
import type { TransactionType } from '@/src/types';

const TYPES: readonly TransactionType[] = ['DR', 'CR', 'TR'];

export default function CreateTransactionRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const initialType = TYPES.find((t) => t === type);
  return <TransactionFormPage mode="create" initialType={initialType} />;
}
