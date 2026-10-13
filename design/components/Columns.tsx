import { useLayout } from '@/design/layout';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type ColumnProps = {
  /** The column's sections, top to bottom. */
  children: React.ReactNode;
};

/** One side of `Columns`. On a narrower screen it is only a grouping: its sections join the page's single column. */
export function Column({ children }: ColumnProps) {
  return <>{children}</>;
}

export type ColumnsProps = {
  /** Two `Column`s: what leads the screen, then the rest. */
  children: React.ReactNode;
};

/**
 * A screen's sections laid side by side when there is room (an expanded screen: a tablet on its
 * side), so the width is used instead of left empty beside one column. Below that `Screen` opens
 * it up and the sections run in one column, in the order written. Put it directly inside `Screen`,
 * which widens its page to hold it.
 */
export function Columns({ children }: ColumnsProps) {
  const styles = useStyles(createStyles);
  const { isExpanded } = useLayout();
  if (!isExpanded) return <>{children}</>;
  return (
    <View style={styles.row}>
      {React.Children.toArray(children).map((column, i) => (
        <View key={i} style={styles.column}>{column}</View>
      ))}
    </View>
  );
}

const createStyles = ({ size }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: size.sectionGap },
    column: { flex: 1, gap: size.sectionGap },
  });
