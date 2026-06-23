import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type IconAvatarVariant = 'solid' | 'subtle' | 'outline';

type IconAvatarProps = {
  icon: IconSvgElement;
  color: string;
  variant?: IconAvatarVariant;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
};

export const IconAvatar = React.memo(function IconAvatar({
  icon,
  color,
  variant = 'subtle',
  size = 40,
  iconSize,
  style,
}: IconAvatarProps) {
  const { colors } = useTheme();

  const { bg, iconColor, border, resolvedIconSize, borderRadius } = React.useMemo(() => {
    let bg: string;
    let iconColor: string;
    let border: { borderWidth: number; borderColor: string } | undefined;

    switch (variant) {
      case 'solid':
        bg = color;
        iconColor = colors.background;
        border = undefined;
        break;
      case 'outline':
        bg = 'transparent';
        iconColor = color;
        border = { borderWidth: 1, borderColor: color };
        break;
      case 'subtle':
      default:
        bg = color + '18';
        iconColor = color;
        border = undefined;
        break;
    }

    return {
      bg,
      iconColor,
      border,
      resolvedIconSize: iconSize ?? Math.round(size * 0.45),
      borderRadius: Math.round(size * 0.25),
    };
  }, [variant, color, colors.background, iconSize, size]);

  const containerStyle = React.useMemo(
    () => [styles.base, { width: size, height: size, borderRadius, backgroundColor: bg }, border, style],
    [size, borderRadius, bg, border, style],
  );

  return (
    <View style={containerStyle}>
      <HugeiconsIcon icon={icon} size={resolvedIconSize} color={iconColor} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
