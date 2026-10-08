import { addPathFromLegacy } from '@/features/shell';
import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';

/** The entry screen's path in the shipped app; pinned launcher shortcuts still open it. */
export default function LegacyCreateRoute() {
  const params = useLocalSearchParams<{ type?: string; accountId?: string }>();
  return <Redirect href={addPathFromLegacy(params) as Href} />;
}
