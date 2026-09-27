import { SearchGateScreen } from '@/src/features/search/screens/SearchGateScreen';
import { SearchScreen } from '@/src/features/search/screens/SearchScreen';
import { usePremium } from '@/src/providers/PremiumProvider';
import React from 'react';

export default function SearchRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <SearchScreen /> : <SearchGateScreen />;
}
