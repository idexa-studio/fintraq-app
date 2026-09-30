import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type ChartLegendProps = {
  items: readonly { label: string; color: string }[];
  align?: 'start' | 'center';
};

export const ChartLegend = React.memo(function ChartLegend({ items, align = 'start' }: ChartLegendProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, align === 'center' && styles.center]}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text variant="caption" tone="muted">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing('4') },
    center: { justifyContent: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    dot: { width: spacing('2'), height: spacing('2'), borderRadius: radius('full') },
  });
