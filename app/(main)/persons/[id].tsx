import { personPathFromLegacy } from '@/features/shell';
import { Redirect, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import React from 'react';

/** `/persons/<id>`, the path of the shipped app. */
export default function LegacyPersonRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={personPathFromLegacy(id) as Href} />;
}
