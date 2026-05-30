import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export const PageBackground = React.memo(function PageBackground() {
  const { colors } = useTheme();
  return (
    <View
      style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]}
      pointerEvents="none"
    />
  );
});
