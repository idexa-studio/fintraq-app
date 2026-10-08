import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useEffect, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** How much of a tab's width the mark above it spans. */
const MARK_SHARE = 0.5;

export type TabItem<K extends string = string> = {
  key: K;
  label: string;
  icon: IconName;
  /**
   * Not a place but the bar's one action (adding): drawn as a green tile
   * with no label under it, and never the active tab.
   */
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
 * The bottom bar: white, edge to edge. A green mark sits above the active
 * tab, whose icon is solid, and slides across when the tab changes.
 */
export function TabBar<K extends string>({ items, activeKey, onSelect, bottomInset = 0 }: TabBarProps<K>) {
  const { colors, motion } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  const tabWidth = items.length ? width / items.length : 0;
  const index = Math.max(0, items.findIndex((item) => item.key === activeKey));
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withTiming(index, { duration: motion.normal + motion.fast, easing: Easing.out(Easing.cubic) });
  }, [index, position, motion.normal, motion.fast]);

  const direction = I18nManager.isRTL ? -1 : 1;
  const sliding = useAnimatedStyle(() => ({ transform: [{ translateX: (position.value + (1 - MARK_SHARE) / 2) * tabWidth * direction }] }));

  return (
    <View accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.bar, { paddingBottom: bottomInset }]}>
      {items.map((item) => {
        const active = item.key === activeKey;
        if (item.action) {
          return (
            <Touchable key={item.key} onPress={() => onSelect?.(item.key)} accessibilityRole="button" accessibilityLabel={item.label} style={styles.tab}>
              <View style={styles.action}>
                <Icon name={item.icon} color={colors.onAccent} />
              </View>
            </Touchable>
          );
        }
        return (
          <Touchable key={item.key} onPress={() => onSelect?.(item.key)} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} style={styles.tab}>
            <Icon name={item.icon} filled={active} />
            <Text variant={active ? 'tabActive' : 'tab'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{item.label}</Text>
          </Touchable>
        );
      })}
      {width > 0 ? <Animated.View pointerEvents="none" style={[styles.mark, { width: tabWidth * MARK_SHARE }, sliding]} /> : null}
    </View>
  );
}

const createStyles = ({ colors, size, space, border, radius }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: border.thin, borderTopColor: colors.divider },
    tab: { flex: 1, minHeight: size.tabBar, paddingVertical: space.xs, alignItems: 'center', justifyContent: 'center', gap: space.xs },
    label: { alignSelf: 'stretch', textAlign: 'center', paddingHorizontal: space.xxs },
    // Hangs from the bar's top hairline, its lower corners rounded.
    mark: { position: 'absolute', top: -border.thin, left: 0, height: size.tabMark + border.thin, backgroundColor: colors.accent, borderBottomLeftRadius: size.tabMark, borderBottomRightRadius: size.tabMark },
    // Green carries an outline on a light surface, as the switch does.
    action: { width: size.minTouch, height: size.chip + space.xs, borderRadius: radius.md, backgroundColor: colors.accent, borderWidth: border.thin, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  });
