import { SheetFrame } from '@/design/components/SheetFrame';
import { useKeyboardOverlap } from '@/design/components/useKeyboardOverlap';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { BACKDROP } from '@/design/tokens/colors';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: React.ReactNode;
  /** A Header. */
  header?: React.ReactNode;
  /** Pinned under the content: the screen's buttons, stacked. */
  footer?: React.ReactNode;
  /** A TabBar. It handles its own bottom inset. */
  tabBar?: React.ReactNode;
  /** The screen is one of the app's tabs: the tab bar below it already clears the bottom inset. */
  tabbed?: boolean;
  /** Content scrolls by default. Turn off for a single full-height message. */
  scroll?: boolean;
  /** Page margin around the content. Turn off when a child must reach the edges. */
  padded?: boolean;
  /**
   * The screen is a task that rises over the one it was started from: it
   * stops short of the top with rounded corners. On iOS the system stacks it
   * over the screen behind; on Android it is a sheet under a black top
   * edge. Present its route with `SHEET_ROUTE`.
   */
  sheet?: boolean;
  /** The screen has text fields: content and footer move up to stay above the keyboard. */
  keyboardAware?: boolean;
};

/** Every screen starts here: page colour, safe areas, header, content, then footer or tab bar. */
export function Screen({ children, header, footer, tabBar, tabbed = false, sheet = false, scroll = true, padded = true, keyboardAware = false }: ScreenProps) {
  const styles = useStyles(createStyles);
  const { motion } = useTheme();
  const keyboard = useKeyboardOverlap(keyboardAware);
  const content = padded ? styles.padded : null;
  // Each section arrives a moment after the one above it, rising a little as it fades in.
  const arriving = React.Children.toArray(children).map((child, i) => (
    <Animated.View key={i} entering={FadeInDown.duration(motion.enter).delay(Math.min(i, 8) * motion.stagger)}>
      {child}
    </Animated.View>
  ));

  const page = (
    <SafeAreaView style={[styles.page, keyboard ? { paddingBottom: keyboard } : null]} edges={sheet ? ['bottom'] : tabBar || tabbed ? ['top'] : ['top', 'bottom']}>
      {header}
      {scroll ? (
        <ScrollView style={styles.fill} contentContainerStyle={[styles.scrollContent, content]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {arriving}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {tabBar}
    </SafeAreaView>
  );

  // iOS presents the sheet itself, stacked over the screen behind. Android gets a sheet under a black top edge.
  if (!sheet || Platform.OS === 'ios') return page;
  return (
    <View style={styles.behind}>
      <StatusBar style="light" />
      <SheetFrame>{page}</SheetFrame>
    </View>
  );
}

const createStyles = ({ colors, size, space }: Theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    // Sheet presentation: the dimmed strip above, then the sheet with rounded top corners.
    behind: { flex: 1, backgroundColor: BACKDROP },
    fill: { flex: 1 },
    padded: { paddingHorizontal: size.screenPadding },
    scrollContent: { paddingTop: space.sm, paddingBottom: space.xxl, gap: size.sectionGap },
    footer: { paddingHorizontal: size.screenPadding, paddingTop: space.lg, paddingBottom: space.lg, gap: space.lg },
  });
