import { TransactionFormScreen, isKind } from '@/features/transactions';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/add?kind=expense|income|transfer&accountId=&repeat=1` */
export default function AddRoute() {
  const { kind, accountId, repeat } = useLocalSearchParams<{ kind?: string; accountId?: string; repeat?: string }>();
  const account = Number.parseInt(accountId ?? '', 10);
  return <TransactionFormScreen initialKind={isKind(kind) ? kind : undefined} initialAccountId={Number.isFinite(account) ? account : undefined} initialRepeat={repeat === '1'} />;
}
