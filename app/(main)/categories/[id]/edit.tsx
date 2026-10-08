import { CategoryFormScreen } from '@/features/categories';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/categories/<id>/edit` */
export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const categoryId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a category that does not exist.
  return <CategoryFormScreen categoryId={Number.isFinite(categoryId) ? categoryId : -1} />;
}
