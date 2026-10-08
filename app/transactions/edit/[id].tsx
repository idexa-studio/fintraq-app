import { editPathFromLegacy } from '@/features/shell';
import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';

/** The edit screen's path in the shipped app. */
export default function LegacyEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={editPathFromLegacy(id) as Href} />;
}
