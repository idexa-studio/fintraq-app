import { useTheme } from '@/src/providers/ThemeProvider';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';

/** A Hugeicons glyph — the app's only icon pack. */
export type IconSource = IconSvgElement;

/** Visual emphasis, expressed as stroke width. */
export type IconWeight = 'light' | 'regular' | 'bold';

export type IconProps = {
  icon: IconSource;
  size?: number;
  color?: string;
  /** light for large decorative glyphs · regular for UI · bold for small sizes and emphasis. */
  weight?: IconWeight | 'fill' | 'duotone';
};

const STROKE: Record<string, number> = { light: 1.25, regular: 1.5, duotone: 1.5, bold: 2, fill: 2 };

export const Icon = React.memo(function Icon({ icon, size = 20, color, weight = 'regular' }: IconProps) {
  const { colors } = useTheme();
  return <HugeiconsIcon icon={icon} size={size} color={color ?? colors.text} strokeWidth={STROKE[weight] ?? 1.5} />;
});
