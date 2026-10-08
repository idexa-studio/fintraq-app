import { useTheme } from '@/src/providers/ThemeProvider';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import { DEFAULT_ICON_FAMILY, HUGEICONS, ICON_FAMILIES } from '@/src/components/ui/icon-registry';
import type { IconFamily, IconName } from '@/src/components/ui/icon-registry';

export type { IconFamily, IconName } from '@/src/components/ui/icon-registry';
/** What components accept wherever they take an icon: a name from the registry. */
export type IconSource = IconName;

/** Visual emphasis, expressed as stroke width. */
export type IconWeight = 'light' | 'regular' | 'bold';

export type IconProps = {
  /** A name from the icon registry (src/components/ui/icon-registry.ts). */
  name: IconName;
  /** Which family to draw from; names the family lacks fall back to Hugeicons. */
  family?: IconFamily;
  size?: number;
  color?: string;
  /** light for large decorative glyphs · regular for UI · bold for small sizes and emphasis. */
  weight?: IconWeight | 'fill' | 'duotone';
};

const STROKE: Record<string, number> = { light: 1.25, regular: 1.5, duotone: 1.5, bold: 2, fill: 2 };

/** The one way to draw an icon: <Icon name="trash" />. */
export const Icon = React.memo(function Icon({ name, family = DEFAULT_ICON_FAMILY, size = 20, color, weight = 'regular' }: IconProps) {
  const { colors } = useTheme();
  const glyph = ICON_FAMILIES[family][name] ?? HUGEICONS[name];
  return <HugeiconsIcon icon={glyph} size={size} color={color ?? colors.text} strokeWidth={STROKE[weight] ?? 1.5} />;
});
