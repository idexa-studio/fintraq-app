import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SheetFrameProps = {
  children: React.ReactNode;
  /** Let the sheet be only as tall as its content, sitting at the bottom. Otherwise it fills the height. */
  hug?: boolean;
};

/**
 * A sheet on Android: it slides up and stops just short of the top, with
 * rounded corners. A task screen sits under a black top edge; a picker sits
 * over the dimmed screen. (iOS presents sheets itself, stacked over the screen
 * behind, and does not use this.)
 */
export function SheetFrame({ children, hug = false }: SheetFrameProps) {
  const { motion } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const rise = SlideInDown.duration(motion.sheet).easing(Easing.out(Easing.cubic));
  return (
    <View style={[styles.frame, hug ? styles.hug : null, { paddingTop: insets.top + styles.clearance.height }]} pointerEvents="box-none">
      <Animated.View entering={rise} style={[styles.sheet, hug ? styles.sheetHug : styles.sheetFill]}>{children}</Animated.View>
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
