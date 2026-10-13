import { loanFormPathFromLegacy } from '@/features/shell';
import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';

/** `/loans/form`, the path a launcher shortcut pinned from the shipped app opens. */
export default function LegacyLoanFormRoute() {
  const params = useLocalSearchParams<{ type?: string; personId?: string }>();
  return <Redirect href={loanFormPathFromLegacy(params) as Href} />;
}
