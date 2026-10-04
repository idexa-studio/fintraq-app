import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconSource;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

const PAD = 3;

function SegmentedControlBase<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const { colors, animation } = theme;
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);
  const [width, setWidth] = useState(0);

  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segmentWidth = width > 0 ? (width - PAD * 2) / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(index * segmentWidth, { duration: animation.normal });
  }, [index, segmentWidth, translateX, animation.normal]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const select = useCallback((next: T) => {
    if (next === value) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  }, [value, onChange]);

  return (
    <View style={[styles.track, style]} onLayout={handleLayout} accessibilityRole="tablist">
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.indicator, { width: segmentWidth }, indicatorStyle]} />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segment}
            onPress={() => select(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            {opt.icon ? (
              <Icon name={opt.icon} size={size === 'sm' ? 14 : 16} color={active ? colors.text : colors.textMuted} />
            ) : null}
            <Text
              variant={size === 'sm' ? 'caption' : 'calloutStrong'}
              tone={active ? 'default' : 'muted'}
              style={active && styles.activeLabel}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const SegmentedControl = React.memo(SegmentedControlBase) as typeof SegmentedControlBase;

const createStyles = ({ colors, radius, spacing, typography, isDark }: ThemeContextType, size: 'sm' | 'md') =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      height: size === 'sm' ? 36 : 44,
      padding: PAD,
      borderRadius: radius('full'),
      backgroundColor: colors.card,
    },
    indicator: {
      position: 'absolute',
      top: PAD,
      bottom: PAD,
      left: PAD,
      borderRadius: radius('full'),
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      paddingHorizontal: spacing('2'),
    },
    activeLabel: {
      fontFamily: typography.fonts.semibold,
    },
  });
