import { Icon } from '@/design/components/Icon';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { INK } from '@/design/tokens/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type Swatch = {
  /** What is stored, e.g. the colour's number in the saved palette. */
  key: string;
  color: string;
  /** Spoken name, e.g. "Teal". */
  label: string;
};

export type SwatchGridProps = {
  swatches: Swatch[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
};

/** Colours to pick one from, for an account, a category or a person. The chosen one carries a tick. */
export function SwatchGrid({ swatches, selectedKey, onSelect }: SwatchGridProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {swatches.map((swatch) => {
        const selected = swatch.key === selectedKey;
        return (
          <Touchable key={swatch.key} onPress={() => onSelect?.(swatch.key)} accessibilityRole="radio" accessibilityLabel={swatch.label} accessibilityState={{ selected }} style={styles.hit}>
            <View style={[styles.ring, selected ? { borderColor: colors.border } : null]}>
              <View style={[styles.dot, { backgroundColor: swatch.color }]}>{selected ? <Icon name="tick" size={styles.tick.width} color={INK} /> : null}</View>
            </View>
          </Touchable>
        );
      })}
    </View>
  );
}

const createStyles = ({ size, space, border }: Theme) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    hit: { width: size.minTouch + space.xs, height: size.minTouch + space.xs, alignItems: 'center', justifyContent: 'center' },
    // The ring is always there, transparent, so choosing a colour does not move the others.
    ring: { padding: space.xxs + border.thin, borderRadius: size.minTouch, borderWidth: border.thick, borderColor: 'transparent' },
    dot: { width: size.buttonSmall, height: size.buttonSmall, borderRadius: size.buttonSmall / 2, alignItems: 'center', justifyContent: 'center' },
    tick: { width: size.iconSmall },
  });
