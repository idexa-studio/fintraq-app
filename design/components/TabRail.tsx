import { Icon } from '@/design/components/Icon';
import type { TabItem } from '@/design/components/TabBar';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { LAYOUT } from '@/design/tokens/layout';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type TabRailProps<K extends string = string> = {
  items: TabItem<K>[];
  activeKey: K;
  onSelect?: (key: K) => void;
  /** The safe-area insets the rail must clear: it runs the full height of the leading edge. */
  insets?: { top: number; bottom: number; start: number };
};

/**
 * The tab bar turned on its side, for a screen wide enough to spare the room (a tablet on its
 * side). It is the same bar: the same items, an icon over its label, the active one solid and
 * bold. The green mark stands on the rail's hairline, the edge that meets the page, as the bar's
 * mark lies on its top one, and slides to the active tab.
 */
export function TabRail<K extends string>({ items, activeKey, onSelect, insets = { top: 0, bottom: 0, start: 0 } }: TabRailProps<K>) {
  const { motion, size } = useTheme();
  const styles = useStyles(createStyles);
  const index = Math.max(0, items.findIndex((item) => item.key === activeKey));
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withTiming(index, { duration: motion.normal + motion.fast, easing: Easing.out(Easing.cubic) });
  }, [index, position, motion.normal, motion.fast]);

  const sliding = useAnimatedStyle(() => ({ transform: [{ translateY: position.value * LAYOUT.railTab }] }));

  return (
    <View style={[styles.rail, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingStart: insets.start }]}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <Touchable key={item.key} onPress={() => onSelect?.(item.key)} accessibilityRole={item.action ? 'button' : 'tab'} accessibilityLabel={item.label} accessibilityState={item.action ? undefined : { selected: active }} style={styles.tab}>
              <Icon name={item.icon} size={size.iconTab} filled={active} />
              <Text variant={active ? 'tabActive' : 'tab'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{item.label}</Text>
            </Touchable>
          );
        })}
        <Animated.View pointerEvents="none" style={[styles.mark, sliding]} />
      </View>
    </View>
  );
}

const createStyles = ({ colors, size, space, border }: Theme) =>
  StyleSheet.create({
    rail: { justifyContent: 'center', backgroundColor: colors.surface, borderEndWidth: border.thin, borderEndColor: colors.divider },
    tabs: { width: LAYOUT.rail },
    tab: { height: LAYOUT.railTab, alignItems: 'center', justifyContent: 'center', gap: space.xs },
    label: { alignSelf: 'stretch', textAlign: 'center', paddingHorizontal: space.xxs },
    // Stands on the rail's hairline, the full height of its tab.
    mark: { position: 'absolute', top: 0, end: -border.thin, width: size.tabBarMark, height: LAYOUT.railTab, backgroundColor: colors.accent },
  });
