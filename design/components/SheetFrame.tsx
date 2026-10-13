import { useLayout } from '@/design/layout';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { LAYOUT } from '@/design/tokens/layout';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SheetFrameProps = {
  children: React.ReactNode;
  /** Let the sheet be only as tall as its content, sitting at the bottom. Otherwise it fills the height. */
  hug?: boolean;
};

/**
 * A sheet drawn by the app: it slides up and stops just short of the top, with
 * rounded corners. A picker (`Sheet`) sits in one over the dimmed screen on both
 * platforms. A task screen sits in one under a black top edge on Android only:
 * iOS presents a task itself, stacked over the screen behind.
 *
 * On a wide screen (a tablet, a phone unfolded) it is a card in the middle instead: a sheet
 * across the whole bottom edge of a tablet is a band of empty white.
 */
export function SheetFrame({ children, hug = false }: SheetFrameProps) {
  const { motion } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { height, isCompact } = useLayout();
  // The sheet starts a screen's height down and rises into its place. It is moved by its own
  // offset, not by a layout animation: inside a Modal on Android those work out where the sheet
  // belongs from the wrong origin, and left it short of the bottom by the height of the system bars.
  const drop = useSharedValue(height);
  useEffect(() => {
    drop.set(withTiming(0, { duration: motion.sheet, easing: Easing.out(Easing.cubic) }));
  }, [drop, motion.sheet]);
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: drop.get() }] }));
  if (!isCompact) {
    return (
      <View style={[styles.frame, styles.middle, { paddingTop: insets.top + LAYOUT.taskClearance, paddingBottom: insets.bottom + LAYOUT.taskClearance }]} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, styles.card, hug ? null : styles.cardFill, rise]}>{children}</Animated.View>
      </View>
    );
  }
  return (
    <View style={[styles.frame, hug ? styles.hug : null, { paddingTop: insets.top + styles.clearance.height }]} pointerEvents="box-none">
      <Animated.View style={[styles.sheet, hug ? styles.sheetHug : styles.sheetFill, rise]}>{children}</Animated.View>
    </View>
  );
}

const createStyles = ({ colors, radius, space }: Theme) =>
  StyleSheet.create({
    frame: { flex: 1 },
    hug: { justifyContent: 'flex-end' },
    // How much of the screen behind stays visible above a full-height sheet.
    clearance: { height: space.sm },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' },
    sheetFill: { flex: 1 },
    sheetHug: { flexShrink: 1 },
    middle: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: LAYOUT.taskClearance },
    // It shrinks before it touches the edges, or the keyboard.
    card: { width: LAYOUT.task, maxWidth: '100%', maxHeight: LAYOUT.taskHeight, flexShrink: 1, borderRadius: radius.sheet },
    cardFill: { height: LAYOUT.taskHeight },
  });

/**
 * How a route that holds a `<Screen sheet>` is presented. iOS has the stacked
 * sheet built in. On Android the backdrop fades to black and `SheetFrame`
 * slides the sheet up under it.
 */
export const SHEET_ROUTE = Platform.select({
  ios: { presentation: 'modal' },
  default: { presentation: 'transparentModal', animation: 'fade', animationDuration: 220 },
} as const);
