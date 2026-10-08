import { AccountFormScreen } from '@/features/accounts';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/accounts/<id>/edit` */
export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const accountId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as an account that does not exist.
  return <AccountFormScreen accountId={Number.isFinite(accountId) ? accountId : -1} />;
}
