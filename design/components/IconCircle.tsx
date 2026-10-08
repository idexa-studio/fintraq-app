import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import { INK, PASTELS } from '@/design/tokens/colors';
import type { PastelName } from '@/design/tokens/colors';
import React from 'react';
import { View } from 'react-native';

export type IconCircleProps = {
  /** An icon, or up to two initials for a person. */
  icon?: IconName;
  initials?: string;
  /** A pastel from the palette, or any stored colour (categories, accounts, people). */
  color?: PastelName | (string & {});
  size?: number;
};

const isPastel = (color: string): color is PastelName => color in PASTELS;

/** A coloured circle with a black glyph: the leading mark of tiles, categories and people. */
export function IconCircle({ icon, initials, color = 'lilac', size }: IconCircleProps) {
  const { size: sizes } = useTheme();
  const diameter = size ?? sizes.iconCircle;
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: isPastel(color) ? PASTELS[color] : color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <Icon name={icon} size={diameter * 0.55} color={INK} />
      ) : (
        <Text variant="calloutStrong" style={{ color: INK }}>{(initials ?? '').slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}
