import { ProScreen, resolveProFeature } from '@/features/pro';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/pro?feature=<id>`: the paywall, opened on the feature that led to it. Old ids still resolve. */
export default function ProRoute() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  return <ProScreen feature={resolveProFeature(feature)} />;
}
