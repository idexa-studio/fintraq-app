import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type DividerProps = {
  /** Left indent in px — align with the text column of list rows. */
  inset?: number;
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const Divider = React.memo(function Divider({ inset = 0, vertical = false, style }: DividerProps) {
  const { colors, alpha } = useTheme();
  const color = alpha(colors.text, 'subtle');

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        vertical
          ? { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color }
          : { height: StyleSheet.hairlineWidth, marginLeft: inset, backgroundColor: color },
        style,
      ]}
    />
  );
});
