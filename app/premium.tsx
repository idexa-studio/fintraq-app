import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/premium?feature=<old id>`, the paywall's path in the shipped app. It is `/pro` now. */
export default function LegacyPremiumRoute() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  return <Redirect href={feature ? { pathname: '/pro', params: { feature } } : '/pro'} />;
}
