import React, { useCallback } from 'react';
import { Pressable, PressableProps, PressableStateCallbackType, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';

export type BentoPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode);
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  /** Shrink slightly while pressed (cards, tiles, buttons). Off for rows and tabs, which fade instead. */
  scaleOnPress?: boolean;
  /** Fade while pressed even when scaling. */
  opacityOnPress?: boolean;
  overflow?: 'visible' | 'hidden';
};

const PRESSED_SCALE = 0.98;

/**
 * The base of every tappable surface. Press feedback is the same on every platform: a slight
 * shrink, or a fade where shrinking would look wrong. There is deliberately no Android ripple and
 * no ink overlay — the app's language is quiet, physical feedback.
 */
export const BentoPressable = React.memo(function BentoPressable({
  children,
  style,
  scaleOnPress = true,
  opacityOnPress = false,
  overflow = 'hidden',
  disabled,
  accessibilityRole,
  accessibilityState,
  ...pressableProps
}: BentoPressableProps) {
  const { state: stateTokens } = useTheme();

  const getPressableStyle = useCallback(
    (state: PressableStateCallbackType) => {
      const customStyle = typeof style === 'function' ? style(state) : style;
      const feedback: ViewStyle = {};
      if (state.pressed && !disabled) {
        if (scaleOnPress) feedback.transform = [{ scale: PRESSED_SCALE }];
        if (opacityOnPress || !scaleOnPress) feedback.opacity = stateTokens.pressed;
      }
      return [styles.base, { overflow }, customStyle, feedback];
    },
    [style, scaleOnPress, opacityOnPress, overflow, disabled, stateTokens.pressed],
  );

  return (
    // Tappable means a button to screen readers unless the caller says otherwise (tab, radio, link…).
    <Pressable
      style={getPressableStyle}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? (pressableProps.onPress || pressableProps.onLongPress ? 'button' : undefined)}
      accessibilityState={disabled ? { ...accessibilityState, disabled: true } : accessibilityState}
      {...pressableProps}
    >
      {children}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: { position: 'relative' },
});
