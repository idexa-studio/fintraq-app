import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type Segment<K extends string = string> = {
  key: K;
  label: string;
};

export type SegmentedControlProps<K extends string = string> = {
  /** Two to four choices of equal standing. */
  segments: Segment<K>[];
  value: K;
  onChange?: (key: K) => void;
  /** What is being chosen, for screen readers. */
  accessibilityLabel: string;
};

/**
 * One choice among a few that changes what the screen below is: expense,
 * income or transfer. A single outlined bar the width of the page, with a
 * black block that slides to the chosen segment.
 */
export function SegmentedControl<K extends string>({ segments, value, onChange, accessibilityLabel }: SegmentedControlProps<K>) {
  const { motion } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.key === value));
  const segmentWidth = width / segments.length;
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withTiming(index, { duration: motion.normal, easing: Easing.out(Easing.cubic) });
  }, [index, position, motion.normal]);

  const direction = I18nManager.isRTL ? -1 : 1;
  const block = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * segmentWidth * direction }] }));

  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width - styles.bar.borderWidth * 2)}>
      {width > 0 ? <Animated.View style={[styles.block, { width: segmentWidth }, block]} /> : null}
      {segments.map((segment) => {
        const selected = segment.key === value;
        return (
          <Pressable key={segment.key} onPress={() => onChange?.(segment.key)} accessibilityRole="tab" accessibilityLabel={segment.label} accessibilityState={{ selected }} style={styles.segment}>
            <Text variant={selected ? 'calloutStrong' : 'callout'} tone={selected ? 'onAction' : 'default'} numberOfLines={1}>{segment.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radius, size, border }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', minHeight: size.minTouch, borderRadius: radius.md, borderWidth: border.thin, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
    block: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.action },
    segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
