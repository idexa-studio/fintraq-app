import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { INK } from '@/design/tokens/colors';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Opens a list of choices instead of selecting itself: shows a down arrow and hugs its label. */
  menu?: boolean;
  /** Black whatever the scheme, for a chip that sits on the green wave card. */
  onBrand?: boolean;
  accessibilityLabel?: string;
  /** Shows a cross that removes it: an applied filter. The label says what is applied. */
  onRemove?: () => void;
  removeLabel?: string;
  onPress?: () => void;
};

/** One of a row of views or filters: outlined at rest, solid when chosen. */
export function Chip({ label, selected = false, menu = false, onBrand = false, accessibilityLabel, onRemove, removeLabel, onPress }: ChipProps) {
  const { colors, size } = useTheme();
  // A chip is 32 tall; the slop brings its touch target up to the 44pt minimum.
  const hitSlop = { top: (size.minTouch - size.chip) / 2, bottom: (size.minTouch - size.chip) / 2 };
  const styles = useStyles(createStyles);
  if (onRemove) {
    return (
      <Touchable onPress={onRemove} hitSlop={hitSlop} accessibilityLabel={removeLabel ?? `Remove ${label}`} style={[styles.chip, styles.menu, { backgroundColor: colors.action }]}>
        <Text variant="captionStrong" tone="onAction" numberOfLines={1}>{label}</Text>
        <Icon name="x" size={size.iconSmall} color={colors.onAction} />
      </Touchable>
    );
  }
  return (
    <Touchable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole={menu ? 'button' : 'tab'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={menu ? undefined : { selected }}
      style={[styles.chip, menu ? styles.menu : null, selected ? { backgroundColor: colors.action } : null, onBrand ? { borderColor: INK } : null]}
    >
      <Text variant={menu ? 'captionStrong' : 'caption'} tone={selected ? 'onAction' : 'default'} numberOfLines={1} style={onBrand ? { color: INK } : null}>{label}</Text>
      {menu ? <Icon name="chevron-down" size={size.iconSmall} color={onBrand ? INK : selected ? colors.onAction : colors.text} /> : null}
    </Touchable>
  );
}

export type ChipRowProps = {
  children: React.ReactNode;
  /** Set when the row sits inside a padded container, so it does not add the page margin again. */
  inset?: boolean;
};

/** Chips in one line that scrolls off the right edge of the page. */
export function ChipRow({ children, inset = false }: ChipRowProps) {
  const styles = useStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={styles.rowScroll}
      contentContainerStyle={[styles.row, inset ? null : styles.rowMargin]}
    >
      {children}
    </ScrollView>
  );
}

const createStyles = ({ colors, radius, size, space, border }: Theme) =>
  StyleSheet.create({
    chip: {
      minHeight: size.chip,
      minWidth: 88,
      paddingHorizontal: space.lg,
      borderRadius: radius.chip,
      borderWidth: border.thin,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
    },
    menu: { minWidth: 0, paddingLeft: space.md, paddingRight: space.sm },
    rowScroll: { flexGrow: 0 },
    row: { gap: space.md },
    rowMargin: { paddingHorizontal: size.screenPadding },
  });
