import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type IllustrationTileProps = {
  /** An illustration or a large icon. */
  children: React.ReactNode;
  size?: number;
};

/** A pale green square that holds a small illustration at the start of a promo row. */
export function IllustrationTile({ children, size }: IllustrationTileProps) {
  const { colors, radius, size: sizes } = useTheme();
  const side = size ?? sizes.illustrationTile;
  return (
    <View style={{ width: side, height: side, borderRadius: radius.tile, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
