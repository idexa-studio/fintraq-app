import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { IoniconName } from '../../utils/icons';

type IconAvatarProps = {
  icon: IoniconName;
  bg: string;
  color: string;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
};

export const IconAvatar = React.memo(function IconAvatar({
  icon,
  bg,
  color,
  size = 40,
  iconSize,
  style,
}: IconAvatarProps) {
  const resolved = iconSize ?? Math.round(size * 0.45);
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      <Ionicons name={icon} size={resolved} color={color} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
