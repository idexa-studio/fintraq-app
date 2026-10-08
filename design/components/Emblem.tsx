import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type EmblemProps = {
  icon: IconName;
  size?: number;
};

/**
 * The picture above a message: one line icon in a soft green circle. Quiet on
 * purpose, like the plain icons the reference sets above its headlines.
 */
export function Emblem({ icon, size }: EmblemProps) {
  const { colors, size: sizes, space } = useTheme();
  const diameter = size ?? sizes.illustrationTile + space.sm;
  return (
    <View style={{ width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={diameter * 0.44} />
    </View>
  );
}
