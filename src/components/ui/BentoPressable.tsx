import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export type BentoPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode);
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  scaleOnPress?: boolean;
  opacityOnPress?: boolean;
  rippleColor?: string;
  disableRipple?: boolean;
  overflow?: 'visible' | 'hidden';
};

export const BentoPressable = React.memo(function BentoPressable({
  children,
  style,
  scaleOnPress = true,
  opacityOnPress = false, // MD3 prefers overlay highlight over whole-component opacity dimming
  rippleColor,
  disableRipple = false,
  overflow = 'hidden', // Default to hidden for MD3 ripple clipping
  disabled,
  ...pressableProps
}: BentoPressableProps) {
  const { colors } = useTheme();

  const defaultRippleColor = useMemo(() => {
    return rippleColor || colors.text + '1E'; // 12% opacity overlay (Material Design 3 standard)
  }, [rippleColor, colors.text]);

  const androidRippleConfig = useMemo(() => {
    if (Platform.OS !== 'android' || disableRipple) return undefined;
    return {
      color: defaultRippleColor,
      borderless: false,
      foreground: true,
    };
  }, [defaultRippleColor, disableRipple]);

  const getPressableStyle = useCallback(
    (state: PressableStateCallbackType) => {
      const { pressed } = state;
      const customStyle = typeof style === 'function' ? style(state) : style;
      const feedbackStyle: ViewStyle = {};

      if (pressed && !disabled) {
        // MD3: Android uses native ink ripples, so scaling is disabled to avoid conflicting feedback.
        // iOS/Web use a premium physical scale-down animation.
        if (scaleOnPress && Platform.OS !== 'android') {
          feedbackStyle.transform = [{ scale: 0.98 }];
        }
        if (opacityOnPress && Platform.OS === 'ios') {
          feedbackStyle.opacity = 0.85;
        }
      }

      return [
        styles.base,
        { overflow },
        customStyle,
        feedbackStyle,
      ];
    },
    [style, scaleOnPress, opacityOnPress, overflow, disabled]
  );

  const renderChildren = useCallback(
    (state: PressableStateCallbackType) => {
      const { pressed } = state;
      const content = typeof children === 'function' ? children(state) : children;

      // MD3 state overlay for iOS/Web to simulate premium ink splash
      const showOverlay = pressed && !disabled && Platform.OS !== 'android';

      return (
        <>
          {content}
          {showOverlay && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: defaultRippleColor, zIndex: 999 },
              ]}
              pointerEvents="none"
            />
          )}
        </>
      );
    },
    [children, disabled, defaultRippleColor]
  );

  return (
    <Pressable
      android_ripple={androidRippleConfig}
      style={getPressableStyle}
      disabled={disabled}
      {...pressableProps}
    >
      {renderChildren}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    position: 'relative',
  },
});
