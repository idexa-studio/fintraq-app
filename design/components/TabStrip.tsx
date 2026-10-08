import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type StripTab<K extends string = string> = {
  key: K;
  label: string;
};

export type TabStripProps<K extends string = string> = {
  /** Two to four views of the same screen. */
  tabs: StripTab<K>[];
  value: K;
  onChange?: (key: K) => void;
  accessibilityLabel: string;
};

/**
 * Tabs across the top of a screen or sheet, directly under its header. They
 * speak the tab bar's language: plain labels, the active one bold with the
 * green mark, which slides to it. No filled blocks, so the strip never
 * competes with the screen's one black button.
 */
export function TabStrip<K extends string>({ tabs, value, onChange, accessibilityLabel }: TabStripProps<K>) {
  const { motion } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((tab) => tab.key === value));
  const tabWidth = width / tabs.length;
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withTiming(index, { duration: motion.normal + motion.fast, easing: Easing.out(Easing.cubic) });
  }, [index, position, motion.normal, motion.fast]);

  const direction = I18nManager.isRTL ? -1 : 1;
  const mark = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * tabWidth * direction }] }));

  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.strip} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable key={tab.key} onPress={() => onChange?.(tab.key)} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }} style={styles.tab}>
            <Text variant={selected ? 'bodyStrong' : 'body'} tone={selected ? 'default' : 'muted'} numberOfLines={1}>{tab.label}</Text>
          </Pressable>
        );
      })}
      {width > 0 ? <Animated.View style={[styles.mark, { width: tabWidth }, mark]} /> : null}
    </View>
  );
}

const createStyles = ({ colors, size, border }: Theme) =>
  StyleSheet.create({
    strip: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: border.thin, borderBottomColor: colors.divider },
    tab: { flex: 1, minHeight: size.minTouch, alignItems: 'center', justifyContent: 'center' },
    // Sits on the strip's bottom hairline, as the tab bar's mark sits on its top one.
    mark: { position: 'absolute', left: 0, bottom: -border.thin, height: size.tabMark + 1, backgroundColor: colors.accent },
  });
