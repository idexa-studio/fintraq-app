import { Icon } from '@/design/components/Icon';
import type { SolidIconName } from '@/design/icons/index';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type TabItem<K extends string = string> = {
  key: K;
  label: string;
  /** Drawn solid, so it must be an icon that has a solid drawing. */
  icon: SolidIconName;
  /** Opens something instead of being a place (adding): pressed like the rest, never the active tab. */
  action?: boolean;
};

export type TabBarProps<K extends string = string> = {
  items: TabItem<K>[];
  activeKey: K;
  onSelect?: (key: K) => void;
  /** The bottom safe-area inset, so the bar clears the home indicator. */
  bottomInset?: number;
};

/**
 * The bottom bar, as the reference draws it: white, edge to edge, every item
 * an icon over its label. A green mark as wide as the tab sits on the bar's
 * top edge above the active tab, whose icon is solid and whose label is bold.
 * The mark slides across when the tab changes.
 */
export function TabBar<K extends string>({ items, activeKey, onSelect, bottomInset = 0 }: TabBarProps<K>) {
  const { motion, size } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const tabWidth = items.length ? width / items.length : 0;
  const index = Math.max(0, items.findIndex((item) => item.key === activeKey));
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withTiming(index, { duration: motion.normal + motion.fast, easing: Easing.out(Easing.cubic) });
  }, [index, position, motion.normal, motion.fast]);

  const direction = I18nManager.isRTL ? -1 : 1;
  const sliding = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * tabWidth * direction }] }));

  return (
    <View accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.bar, { paddingBottom: bottomInset }]}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Touchable key={item.key} onPress={() => onSelect?.(item.key)} accessibilityRole={item.action ? 'button' : 'tab'} accessibilityLabel={item.label} accessibilityState={item.action ? undefined : { selected: active }} style={styles.tab}>
            <Icon name={item.icon} size={size.iconTab} filled={active} />
            <Text variant={active ? 'tabActive' : 'tab'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{item.label}</Text>
          </Touchable>
        );
      })}
      {width > 0 ? <Animated.View pointerEvents="none" style={[styles.mark, { width: tabWidth }, sliding]} /> : null}
    </View>
  );
}

const createStyles = ({ colors, size, space, border }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: border.thin, borderTopColor: colors.divider },
    tab: { flex: 1, minHeight: size.tabBar, paddingVertical: space.xs, alignItems: 'center', justifyContent: 'center', gap: space.xs },
    label: { alignSelf: 'stretch', textAlign: 'center', paddingHorizontal: space.xxs },
    // Sits on the bar's top hairline, the full width of its tab.
    mark: { position: 'absolute', top: -border.thin, left: 0, height: size.tabMark, backgroundColor: colors.accent },
  });
