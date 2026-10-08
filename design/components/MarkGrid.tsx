import { IconCircle } from '@/design/components/IconCircle';
import type { IconCircleProps } from '@/design/components/IconCircle';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { TextField } from '@/design/components/TextField';
import { Touchable } from '@/design/components/Touchable';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type Mark<K extends string = string> = {
  key: K;
  label: string;
  icon: IconName;
  color?: IconCircleProps['color'];
};

export type MarkGridProps<K extends string = string> = {
  marks: Mark<K>[];
  selectedKey?: K;
  onSelect?: (key: K) => void;
  /** Three across suits names of two words; four suits single words. */
  columns?: 3 | 4;
  /** Shows a search field with this placeholder above the grid. For a grid too long to take in at a glance. */
  searchPlaceholder?: string;
  /** What to say when the search finds nothing; receives the query. */
  noMatch?: (query: string) => string;
};

/**
 * A choice among things that each have a mark: categories, kinds of account.
 * Quicker to scan than a list of the same length, and the choice is one tap.
 */
export function MarkGrid<K extends string>({ marks, selectedKey, onSelect, columns = 3, searchPlaceholder, noMatch }: MarkGridProps<K>) {
  const styles = useStyles(createStyles);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => (needle ? marks.filter((mark) => mark.label.toLowerCase().includes(needle)) : marks), [marks, needle]);

  const grid = (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {shown.map((mark) => {
        const selected = mark.key === selectedKey;
        return (
          <Touchable key={mark.key} onPress={() => onSelect?.(mark.key)} accessibilityRole="radio" accessibilityLabel={mark.label} accessibilityState={{ selected }} style={[styles.tile, columns === 4 ? styles.quarter : styles.third, selected ? styles.selected : null]}>
            <IconCircle icon={mark.icon} color={mark.color} />
            <Text variant={selected ? 'captionStrong' : 'caption'} align="center" numberOfLines={2}>{mark.label}</Text>
          </Touchable>
        );
      })}
    </View>
  );
  if (!searchPlaceholder) return grid;
  return (
    <View style={styles.wrap}>
      <TextField icon="search" value={query} onChangeText={setQuery} placeholder={searchPlaceholder} accessibilityLabel={searchPlaceholder} autoCorrect={false} autoCapitalize="none" />
      {shown.length === 0 && noMatch ? <Text variant="callout" tone="muted" align="center" style={styles.none}>{noMatch(query.trim())}</Text> : grid}
    </View>
  );
}

const createStyles = ({ colors, radius, space, border }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    none: { paddingVertical: space.xl },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    // The outline is always there, transparent, so choosing a tile never moves the others.
    tile: { alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.xs, borderRadius: radius.md, borderWidth: border.thick, borderColor: 'transparent' },
    third: { width: '33.333%' },
    quarter: { width: '25%' },
    selected: { borderColor: colors.selected },
  });
