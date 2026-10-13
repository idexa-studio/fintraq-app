import { PersonFormScreen } from '@/features/people';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

/** `/people/<id>/edit` */
export default function EditPersonRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const personId = Number.parseInt(id ?? '', 10);
  // An unreadable id is treated as a person who does not exist.
  return <PersonFormScreen personId={Number.isFinite(personId) ? personId : -1} />;
}
