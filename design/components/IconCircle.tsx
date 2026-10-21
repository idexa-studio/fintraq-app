import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import { INK, PASTELS, pastelOf } from '@/design/tokens/colors';
import type { PastelName } from '@/design/tokens/colors';
import React from 'react';
import { View } from 'react-native';

export type IconCircleProps = {
  /** An icon, or up to two initials for a person. */
  icon?: IconName;
  initials?: string;
  /** A pastel from the palette, or a saved colour as hex (a category's, an account's, a person's), which is drawn as its pastel. */
  color?: PastelName | (string & {});
  size?: number;
  /**
   * A circle with no colour of its own, in the page's grey: for a choice not made yet (with the
   * glyph of what is to be chosen) or a thing that has no colour (a currency). A row keeps its
   * shape before and after the choice instead of jumping from a bare icon.
   */
  plain?: boolean;
};

const isPastel = (color: string): color is PastelName => color in PASTELS;

/** A coloured circle with a black glyph: the leading mark of tiles, categories and people. */
export function IconCircle({ icon, initials, color = 'lilac', size, plain = false }: IconCircleProps) {
  const { colors, size: sizes } = useTheme();
  const ink = plain ? colors.text : INK;
  const diameter = size ?? sizes.iconCircle;
  return (
    <View
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: plain ? colors.background : isPastel(color) ? PASTELS[color] : pastelOf(color),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <Icon name={icon} size={diameter * 0.55} color={ink} />
      ) : (
        <Text variant="calloutStrong" style={{ color: ink }}>{(initials ?? '').slice(0, 2).toUpperCase()}</Text>
      )}
    </View>
  );
}
