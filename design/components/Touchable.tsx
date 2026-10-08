import { PRESSED_OPACITY } from '@/design/tokens/metrics';
import React from 'react';
import { Pressable } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export type TouchableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/** Press primitive for every tappable: fades while pressed, the same on every platform. */
export function Touchable({ style, accessibilityRole = 'button', ...rest }: TouchableProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      {...rest}
      style={({ pressed }) => [style, pressed && !rest.disabled ? { opacity: PRESSED_OPACITY } : null]}
    />
  );
}
