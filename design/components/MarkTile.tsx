import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type MarkTileProps = {
  icon: IconName;
  /** Makes the tile a shortcut. Needs a label saying where it goes. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** A small outlined square with a solid mark, set at the corner of a card to say what the card is about. */
export function MarkTile({ icon, onPress, accessibilityLabel }: MarkTileProps) {
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const mark = <Icon name={icon} size={size.iconSmall} filled />;
  if (!onPress) return <View style={styles.tile}>{mark}</View>;
  // The slop brings its touch target up to the 44pt minimum.
  const slop = (size.minTouch - styles.tile.width) / 2;
  return <Touchable onPress={onPress} accessibilityLabel={accessibilityLabel} hitSlop={slop} style={styles.tile}>{mark}</Touchable>;
}

const createStyles = ({ colors, radius, size, border }: Theme) =>
  StyleSheet.create({
    tile: { width: size.markTile, height: size.markTile, borderRadius: radius.sm, borderWidth: border.thin, borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  });
