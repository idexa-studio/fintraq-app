import { useTheme } from '@/design/ThemeProvider';
import { PASTELS } from '@/design/tokens/colors';
import type { PastelName } from '@/design/tokens/colors';
import React from 'react';
import { View } from 'react-native';

export type IllustrationTileProps = {
  /** An illustration or a large icon. */
  children: React.ReactNode;
  /** One of the pastels icons sit on. */
  color?: PastelName;
  size?: number;
};

/** A pastel square that holds a small illustration or icon at the start of a promo row. Set what sits on it in black. */
export function IllustrationTile({ children, color = 'lilac', size }: IllustrationTileProps) {
  const { radius, size: sizes } = useTheme();
  const side = size ?? sizes.illustrationTile;
  return (
    <View style={{ width: side, height: side, borderRadius: radius.tile, backgroundColor: PASTELS[color], alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
