import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TabItem<K extends string = string> = {
  key: K;
  label: string;
  icon: IconName;
};

export type TabBarProps<K extends string = string> = {
  items: TabItem<K>[];
  activeKey: K;
  onSelect?: (key: K) => void;
  /** The bottom safe-area inset, so the bar clears the home indicator. */
  bottomInset?: number;
};

/** The bottom bar: white, edge to edge, with a green mark above the active tab, whose icon is solid. */
export function TabBar<K extends string>({ items, activeKey, onSelect, bottomInset = 0 }: TabBarProps<K>) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: bottomInset }]}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Touchable key={item.key} onPress={() => onSelect?.(item.key)} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }} style={styles.tab}>
            <View style={[styles.mark, active ? { backgroundColor: colors.accent } : null]} />
            <Icon name={item.icon} filled={active} />
            <Text variant={active ? 'tabActive' : 'tab'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{item.label}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, size, space, border }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: border.thin, borderTopColor: colors.divider },
    tab: { flex: 1, minHeight: size.tabBar, paddingVertical: space.xs, alignItems: 'center', justifyContent: 'center', gap: space.xs },
    label: { alignSelf: 'stretch', textAlign: 'center', paddingHorizontal: space.xxs },
    // Sits on the bar's top hairline.
    mark: { position: 'absolute', top: -border.thin, left: 0, right: 0, height: size.tabMark },
  });
