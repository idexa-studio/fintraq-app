import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type ProgressBarProps = {
  /** 0-100. Values outside that range are clamped. */
  progress: number;
  height?: number;
};

export const ProgressBar = React.memo(function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: `${clamped}%`, borderRadius: height / 2 }]} />
    </View>
  );
});

const createStyles = ({ colors }: ThemeContextType) =>
  StyleSheet.create({
    track: {
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
  });
