import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { IoniconName } from '../../utils/icons';
import { useTheme } from '../../providers/ThemeProvider';

type IconAvatarVariant = 'solid' | 'subtle' | 'outline';

type IconAvatarProps = {
  icon: IoniconName;
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
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, border, style]}>
      <Ionicons name={icon} size={resolved} color={iconColor} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
