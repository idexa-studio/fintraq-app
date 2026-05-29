import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';

/**
 * Full-screen gradient background replicating the old blurred look.
 * Drop as first child of any SafeAreaView.
 */
export const PageBackground = React.memo(function PageBackground() {
  const { colors, isDark } = useTheme();

  const gradientColors = useMemo((): [string, string, string] => {
    if (isDark) {
      return [
        colors.background,
        colors.primary + '10',
        colors.background,
      ];
    }
    return [
      colors.background,
      colors.primary + '0C',
      colors.background,
    ];
  }, [isDark, colors.background, colors.primary]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
});
