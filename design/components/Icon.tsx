import { CUSTOM_GLYPHS, isCustomIcon } from '@/design/icons/custom-glyphs';
import type { CustomGlyph } from '@/design/icons/custom-glyphs';
import { GLYPHS } from '@/design/icons/glyphs';
import type { IconName } from '@/design/icons/index';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type { IconName } from '@/design/icons/index';

export type IconProps = {
  /** A name from design/icons/icon-map.json, or one of the hand-drawn ones in custom-glyphs.ts. */
  name: IconName;
  size?: number;
  color?: string;
  /** The solid drawing: the active tab, a selected item. Outline otherwise. */
  filled?: boolean;
};

/** Line weight of the hand-drawn icons, on the 24 unit grid, matching the generated set. */
const STROKE = 2;

/** Icons that point along the reading direction, and so face the other way in right-to-left layouts. */
const DIRECTIONAL = new Set<IconName>(['chevron-left', 'chevron-right', 'arrow-left', 'arrow-right', 'arrow-forward', 'logout']);

/** The one way to draw an icon. */
export const Icon = React.memo(function Icon({ name, size, color, filled = false }: IconProps) {
  const theme = useTheme();
  const side = size ?? theme.size.icon;
  const ink = color ?? theme.colors.text;
  const flip = I18nManager.isRTL && DIRECTIONAL.has(name) ? { transform: [{ scaleX: -1 }] } : undefined;

  if (isCustomIcon(name)) {
    const glyph: CustomGlyph = CUSTOM_GLYPHS[name];
    const line = { stroke: ink, strokeWidth: STROKE, strokeLinejoin: 'miter' as const, strokeLinecap: 'round' as const };
    return (
      <Svg width={side} height={side} viewBox="0 0 24 24" style={flip}>
        {glyph.shapes.map((d) => <Path key={d} d={d} fill={filled ? ink : 'none'} {...line} />)}
        {glyph.strokes.map((d) => <Path key={d} d={d} fill="none" {...line} />)}
      </Svg>
    );
  }

  return (
    <Svg width={side} height={side} viewBox="0 0 24 24" style={flip}>
      <Path d={filled ? GLYPHS[name].fill : GLYPHS[name].line} fill={ink} />
    </Svg>
  );
});
