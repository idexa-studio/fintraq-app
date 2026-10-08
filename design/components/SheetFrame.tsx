import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SheetFrameProps = {
  children: React.ReactNode;
  /** Let the sheet be only as tall as its content, sitting at the bottom. Otherwise it fills the height. */
  hug?: boolean;
};

/**
 * The stacked look of every sheet: the sheet has risen over what was there,
 * whose top edge still shows above it as a narrower card, so the two read as
 * cards in a stack. The sheet slides up; the edge behind settles in just
 * after it.
 */
export function SheetFrame({ children, hug = false }: SheetFrameProps) {
  const { motion } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const rise = SlideInDown.duration(motion.sheet).easing(Easing.out(Easing.cubic));
  return (
    <View style={[styles.frame, hug ? styles.hug : null, { paddingTop: insets.top + styles.clearance.height }]} pointerEvents="box-none">
      <Animated.View entering={rise} style={hug ? styles.stackHug : styles.stack}>
        <Animated.View entering={FadeIn.delay(motion.sheet / 2).duration(motion.normal)} style={styles.peek} />
        <View style={[styles.sheet, hug ? styles.sheetHug : styles.sheetFill]}>{children}</View>
      </Animated.View>
    </View>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    frame: { flex: 1 },
    hug: { justifyContent: 'flex-end' },
    clearance: { height: space.xs },
    stack: { flex: 1 },
    stackHug: { flexShrink: 1 },
    peek: { height: size.sheetPeek + radius.sheet, marginBottom: -radius.sheet, marginHorizontal: size.sheetPeekInset, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, backgroundColor: colors.peek },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' },
    sheetFill: { flex: 1 },
    sheetHug: { flexShrink: 1 },
  });
