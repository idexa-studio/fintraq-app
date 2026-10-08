import { MOTION, PRESSED_OPACITY } from '@/design/tokens/metrics';
import React from 'react';
import { Pressable } from 'react-native';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type TouchableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Press primitive for every tappable. It dims quickly under the finger and
 * eases back on release, so a press feels answered rather than switched.
 */
export function Touchable({ style, accessibilityRole = 'button', onPressIn, onPressOut, ...rest }: TouchableProps) {
  const pressed = useSharedValue(0);
  const dim = useAnimatedStyle(() => ({ opacity: 1 - pressed.value * (1 - PRESSED_OPACITY) }));

  const pressIn = (e: GestureResponderEvent) => {
    if (!rest.disabled) pressed.value = withTiming(1, { duration: MOTION.fast / 2 });
    onPressIn?.(e);
  };
  const pressOut = (e: GestureResponderEvent) => {
    pressed.value = withTiming(0, { duration: MOTION.normal });
    onPressOut?.(e);
  };

  return <AnimatedPressable accessibilityRole={accessibilityRole} {...rest} onPressIn={pressIn} onPressOut={pressOut} style={[style, dim]} />;
}
