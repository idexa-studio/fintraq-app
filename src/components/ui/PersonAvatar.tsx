import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type PersonAvatarVariant = 'subtle' | 'solid';

type PersonAvatarProps = {
  name: string;
  color: string;
  variant?: PersonAvatarVariant;
  size?: number;
  style?: ViewStyle;
};

export const PersonAvatar = React.memo(function PersonAvatar({
  name,
  color,
  variant = 'subtle',
  size = 40,
  style,
}: PersonAvatarProps) {
  const { typography } = useTheme();

  const { initials, bg, textColor, borderRadius, fontSize } = React.useMemo(() => {
    const words = name.trim().split(/\s+/);
    const computed = words.map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
    return {
      initials: computed,
      bg: variant === 'solid' ? color : color + '18',
      textColor: variant === 'solid' ? '#FFFFFF' : color,
      borderRadius: Math.round(size * 0.25),
      fontSize: Math.round(size * 0.38),
    };
  }, [name, color, variant, size]);

  const containerStyle = React.useMemo(
    () => [styles.base, { width: size, height: size, borderRadius, backgroundColor: bg }, style],
    [size, borderRadius, bg, style],
  );

  const textStyle = React.useMemo(
    () => ({
      fontFamily: typography.styles.profileMono.fontFamily,
      fontSize,
      color: textColor,
      includeFontPadding: false,
    }),
    [typography.styles.profileMono.fontFamily, fontSize, textColor],
  );

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{initials}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
