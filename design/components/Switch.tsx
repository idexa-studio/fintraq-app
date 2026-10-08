import { useTheme } from '@/design/ThemeProvider';
import { PRESSED_OPACITY } from '@/design/tokens/metrics';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type SwitchProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

/** Instant on or off. Off: a black thumb on a white, outlined track. On: the track turns green. */
export function Switch({ value, onValueChange, accessibilityLabel, disabled = false }: SwitchProps) {
  const { colors, size, border, motion } = useTheme();
  const on = useSharedValue(value ? 1 : 0);
  const inset = (size.switchHeight - size.switchThumb) / 2 - border.thin;
  const travel = size.switchWidth - size.switchThumb - (inset + border.thin) * 2;

  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: motion.fast });
  }, [value, on, motion.fast]);

  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [colors.surface, colors.accent]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * travel }] }));

  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      hitSlop={(size.minTouch - size.switchHeight) / 2}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={disabled ? { opacity: PRESSED_OPACITY } : null}
    >
      <Animated.View style={[{ width: size.switchWidth, height: size.switchHeight, borderRadius: size.switchHeight / 2, borderWidth: border.thin, borderColor: colors.border, padding: inset }, track]}>
        <Animated.View style={[{ width: size.switchThumb, height: size.switchThumb, borderRadius: size.switchThumb / 2, backgroundColor: value ? colors.onAccent : colors.action }, thumb]} />
      </Animated.View>
    </Pressable>
  );
}
