import type { IconProps, IconSource } from './Icon';
import { Icon } from './Icon';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { alpha, foregroundOn } from '@/src/theme/tokens';

type IconAvatarVariant = 'solid' | 'subtle' | 'outline';

type IconAvatarProps = {
  icon: IconSource;
  color: string;
  variant?: IconAvatarVariant;
  size?: number;
  iconSize?: number;
  /** Stroke weight for the glyph. */
  weight?: IconProps['weight'];
  style?: ViewStyle;
};

export const IconAvatar = React.memo(function IconAvatar({
  icon,
  color,
  variant = 'subtle',
  size = 40,
  iconSize,
  weight = 'regular',
  style,
}: IconAvatarProps) {

  const { bg, iconColor, border, resolvedIconSize, borderRadius } = React.useMemo(() => {
    let bg: string;
    let iconColor: string;
    let border: { borderWidth: number; borderColor: string } | undefined;

    switch (variant) {
      case 'solid':
        bg = color;
        iconColor = foregroundOn(color);
        border = undefined;
        break;
      case 'outline':
        bg = 'transparent';
        iconColor = color;
        border = { borderWidth: 1, borderColor: color };
        break;
      case 'subtle':
      default:
        bg = alpha(color, 'subtle');
        iconColor = color;
        border = undefined;
        break;
    }

    return {
      bg,
      iconColor,
      border,
      resolvedIconSize: iconSize ?? Math.round(size * 0.45),
      // Squircle: 30% of size keeps the curve proportional at every size.
      borderRadius: Math.round(size * 0.3),
    };
  }, [variant, color, iconSize, size]);

  const containerStyle = React.useMemo(
    () => [styles.base, { width: size, height: size, borderRadius, backgroundColor: bg }, border, style],
    [size, borderRadius, bg, border, style],
  );

  return (
    <View style={containerStyle}>
      <Icon name={icon} size={resolvedIconSize} color={iconColor} weight={weight} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
