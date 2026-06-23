import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type Props = {
  principal: number;
  repaid: number;
  color?: string;
};

export const OutstandingBar = React.memo(function OutstandingBar({ principal, repaid, color }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  const pct = principal > 0 ? Math.min(1, repaid / principal) : 0;
  const barColor = color ?? colors.primary;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%` as `${number}%`, backgroundColor: barColor }]} />
    </View>
  );
});

const createStyles = ({ colors, radius, spacing }: ThemeContextType) =>
  StyleSheet.create({
    track: {
      height: 4,
      borderRadius: radius('full'),
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: spacing('1'),
    },
    fill: {
      height: '100%',
      borderRadius: radius('full'),
    },
  });
