import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { INK } from '@/design/tokens/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type IconGroup = {
  title: string;
  icons: IconName[];
};

export type IconGridProps = {
  groups: IconGroup[];
  selected?: IconName;
  onSelect?: (icon: IconName) => void;
  /** The colour the chosen icon sits on, so the choice previews as it will appear. */
  color: string;
  /** Turns an icon name into words for screen readers. Defaults to the name with spaces. */
  labelFor?: (icon: IconName) => string;
};

/** Icons to pick one from, in named groups. The chosen one sits on its colour. */
export function IconGrid({ groups, selected, onSelect, color, labelFor = (icon) => icon.replace(/-/g, ' ') }: IconGridProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.wrap}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text variant="bodyStrong">{group.title}</Text>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {group.icons.map((icon) => {
              const chosen = icon === selected;
              return (
                <Touchable key={icon} onPress={() => onSelect?.(icon)} accessibilityRole="radio" accessibilityLabel={labelFor(icon)} accessibilityState={{ selected: chosen }} style={[styles.cell, chosen ? { backgroundColor: color } : null]}>
                  <Icon name={icon} color={chosen ? INK : undefined} />
                </Touchable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.xl },
    group: { gap: space.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    cell: { width: size.minTouch + space.xs, height: size.minTouch + space.xs, borderRadius: (size.minTouch + space.xs) / 2, alignItems: 'center', justifyContent: 'center' },
  });
