import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TipProps = {
  /** One sentence about the control it points at. */
  message: string;
  dismissLabel: string;
  onDismiss?: () => void;
  /** Which edge the pointer sits on: `top` when the tip is below its control. */
  pointer?: 'top' | 'bottom';
  /** Where along that edge, from the left, 0 to 1. */
  pointerAt?: number;
};

/** A one-time hint attached to a control: black, with a pointer, and one way to dismiss it. */
export function Tip({ message, dismissLabel, onDismiss, pointer = 'top', pointerAt = 0.5 }: TipProps) {
  const styles = useStyles(createStyles);
  const arrow = <View style={[styles.arrow, pointer === 'top' ? styles.arrowTop : styles.arrowBottom, { left: `${pointerAt * 100}%` }]} />;
  return (
    <View accessibilityRole="alert" style={pointer === 'top' ? styles.below : styles.above}>
      {arrow}
      <View style={styles.bubble}>
        <Text variant="callout" tone="onAction" style={styles.message}>{message}</Text>
        <Touchable onPress={onDismiss} accessibilityLabel={dismissLabel} hitSlop={styles.hit.padding}>
          <Text variant="calloutStrong" tone="onAction" underline>{dismissLabel}</Text>
        </Touchable>
      </View>
    </View>
  );
}

const ARROW = 12;

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    below: { paddingTop: ARROW / 2 },
    above: { paddingBottom: ARROW / 2 },
    bubble: { backgroundColor: colors.action, borderRadius: radius.md, padding: size.cardPadding, flexDirection: 'row', alignItems: 'center', gap: space.lg },
    message: { flex: 1 },
    // A square turned on its corner, half hidden behind the bubble.
    arrow: { position: 'absolute', width: ARROW, height: ARROW, marginLeft: -ARROW / 2, backgroundColor: colors.action, transform: [{ rotate: '45deg' }] },
    arrowTop: { top: 0 },
    arrowBottom: { bottom: 0 },
    hit: { padding: space.md },
  });
