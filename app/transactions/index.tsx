import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/** The transactions list's path in the shipped app, with its account or category filter. Activity is its home now. */
export default function LegacyTransactionsRoute() {
  const { accountId, categoryId } = useLocalSearchParams<{ accountId?: string; categoryId?: string }>();
  return <Redirect href={{ pathname: '/activity', params: { ...(accountId ? { accountId } : {}), ...(categoryId ? { categoryId } : {}) } }} />;
}
