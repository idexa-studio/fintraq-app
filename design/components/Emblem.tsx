import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { useTheme } from '@/design/ThemeProvider';
import { INK, PASTELS } from '@/design/tokens/colors';
import type { PastelName } from '@/design/tokens/colors';
import React from 'react';
import { View } from 'react-native';

export type EmblemProps = {
  icon: IconName;
  /** One of the pastels icons sit on. Give a screen's emblem the colour its subject has elsewhere. */
  color?: PastelName;
  size?: number;
};

/**
 * The picture above a message: one line icon in a pastel circle, the same
 * pastels and black glyph the app's icon circles use, only larger. A pale
 * green of its own was tried and read as washed out (owner, 2026-10-08).
 */
export function Emblem({ icon, color = 'lilac', size }: EmblemProps) {
  const { size: sizes, space } = useTheme();
  const diameter = size ?? sizes.illustrationTile + space.sm;
  return (
    <View style={{ width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: PASTELS[color], alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={diameter * 0.44} color={INK} />
    </View>
  );
}
