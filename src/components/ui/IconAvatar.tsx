import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { MaterialIconName } from '../../utils/icons';

type IconAvatarVariant = 'solid' | 'subtle' | 'outline';

type IconAvatarProps = {
  icon: MaterialIconName;
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
  const { colors, radius } = useTheme();
  const resolved = iconSize ?? Math.round(size * 0.45);

  const { bg, iconColor, border } = React.useMemo(() => {
    switch (variant) {
      case 'solid':
        return { bg: color, iconColor: colors.background, border: undefined };
      case 'outline':
        return { bg: 'transparent', iconColor: color, border: { borderWidth: 1, borderColor: color } };
      case 'subtle':
      default:
        return { bg: color + '18', iconColor: color, border: undefined };
    }
  }, [variant, color, colors.background]);

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: radius('md'), backgroundColor: bg }, border, style]}>
      <MaterialCommunityIcons name={icon} size={resolved} color={iconColor} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
