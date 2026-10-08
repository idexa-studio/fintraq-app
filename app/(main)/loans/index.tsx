import { Redirect } from 'expo-router';
import React from 'react';

/** `/loans`, the list of the shipped app. Loans are listed on the Plan tab now. */
export default function LegacyLoansRoute() {
  return <Redirect href="/plan" />;
}
