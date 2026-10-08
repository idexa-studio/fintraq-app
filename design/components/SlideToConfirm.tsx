import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type SlideToConfirmProps = {
  /** What sliding will do, e.g. "Slide to settle up". */
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
};

/** How far along the track counts as meaning it. */
const COMMIT = 0.85;

/**
 * A button that has to be dragged, for actions that move money or cannot be
 * taken back: a slide cannot happen by accident. Screen readers get a plain
 * button instead.
 */
export function SlideToConfirm({ label, onConfirm, disabled = false }: SlideToConfirmProps) {
  const { colors, motion } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const travel = Math.max(0, width - styles.thumb.width - styles.track.padding * 2);

  const confirm = useCallback(() => {
    onConfirm();
    // Return to the start once the result has had a moment to show.
    setTimeout(() => { x.value = withTiming(0, { duration: motion.normal }); }, motion.slow * 2);
  }, [onConfirm, x, motion.normal, motion.slow]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onChange((e) => {
      x.value = Math.min(travel, Math.max(0, x.value + e.changeX));
    })
    .onEnd(() => {
      if (travel > 0 && x.value >= travel * COMMIT) {
        x.value = withTiming(travel, { duration: motion.fast });
        runOnJS(confirm)();
      } else {
        x.value = withTiming(0, { duration: motion.normal });
      }
    });

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fade = useAnimatedStyle(() => ({ opacity: travel > 0 ? interpolate(x.value, [0, travel * 0.6], [1, 0], 'clamp') : 1 }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'activate' && !disabled) onConfirm(); }}
      style={[styles.track, { backgroundColor: disabled ? colors.disabled : colors.action }]}
    >
      <Animated.View style={[styles.label, fade]}>
        <Text variant="action" tone={disabled ? 'disabled' : 'onAction'} numberOfLines={1}>{label}</Text>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, { backgroundColor: disabled ? colors.onDisabled : colors.accent }, thumb]}>
          <Icon name="arrow-right" color={colors.onAccent} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = ({ radius, size, space }: Theme) =>
  StyleSheet.create({
    track: { height: size.row, borderRadius: radius.md, padding: space.xs, justifyContent: 'center' },
    label: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingLeft: size.row },
    thumb: { width: size.row - space.xs * 2, height: size.row - space.xs * 2, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  });
