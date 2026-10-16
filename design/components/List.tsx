import { useLayout } from '@/design/layout';
import React from 'react';
import { FlatList } from 'react-native';
import type { FlatListProps } from 'react-native';

/**
 * A long list that scrolls itself and draws its rows as they come into view: for a screen whose
 * content is one list without end (Activity). It spans the window, so a swipe in the room beside
 * the column scrolls it too, and holds its rows, header, footer and empty state to the column.
 * Put it directly inside a `Screen` with `scroll={false}`, which then lets it reach the edges.
 */
export function List<T>({ contentContainerStyle, ...props }: FlatListProps<T>) {
  const { column } = useLayout();
  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      {...props}
      contentContainerStyle={[{ width: '100%', maxWidth: column, alignSelf: 'center' }, contentContainerStyle]}
    />
  );
}
