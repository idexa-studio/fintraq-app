import { CategoryFormScreen } from '@/features/categories';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/categories/new?kind=DR|CR|TR` */
export default function NewCategoryRoute() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return <CategoryFormScreen initialKind={kind === 'CR' || kind === 'TR' ? kind : 'DR'} />;
}
