import { GLYPH_GRID, GLYPHS } from '@/design/icons/glyphs';
import type { IconName } from '@/design/icons/index';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type { IconName } from '@/design/icons/index';

export type IconProps = {
  /** A name from design/icons/icon-map.json. The map also fixes its line weight, so there is none to choose here. */
  name: IconName;
  size?: number;
  color?: string;
  /** The solid drawing: the active tab, a selected item. Outline otherwise. */
  filled?: boolean;
};

const VIEW_BOX = `0 0 ${GLYPH_GRID} ${GLYPH_GRID}`;

/**
 * From this size up a pictogram is drawn from its light version. The reference's line is about
 * 1.4pt whatever the icon's size (measured in its header, tab bar and rows). The regular drawing
 * gives 1.5pt at 24 but 1.75pt at 28, which reads as heavy; the light one gives 1.3pt at 28.
 */
const LIGHT_FROM = 27;

/** Icons that point along the reading direction, and so face the other way in right-to-left layouts. */
const DIRECTIONAL = new Set<IconName>(['chevron-left', 'chevron-right', 'arrow-left', 'arrow-right', 'arrow-forward', 'logout']);

/** The one way to draw an icon. */
export const Icon = React.memo(function Icon({ name, size, color, filled = false }: IconProps) {
  const theme = useTheme();
  const side = size ?? theme.size.icon;
  const ink = color ?? theme.colors.text;
  const flip = I18nManager.isRTL && DIRECTIONAL.has(name) ? { transform: [{ scaleX: -1 }] } : undefined;

  return (
    <Svg width={side} height={side} viewBox={VIEW_BOX} style={flip}>
      <Path d={filled ? GLYPHS[name].fill : side >= LIGHT_FROM ? GLYPHS[name].light : GLYPHS[name].line} fill={ink} />
    </Svg>
  );
});
