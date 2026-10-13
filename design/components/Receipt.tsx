import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ReceiptProps = {
  children: React.ReactNode;
};

const TOOTH = 12;

/** A white slip with a torn lower edge: the record of one payment. */
export function Receipt({ children }: ReceiptProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [width, setWidth] = useState(0);
  // Whole teeth only, stretched to fit, so the edge starts and ends on a point.
  const count = Math.max(1, Math.round(width / TOOTH));
  const step = width / count;
  let edge = `M0 0 H${width}`;
  for (let i = count; i > 0; i--) edge += ` L${(i - 0.5) * step} ${TOOTH * 0.6} L${(i - 1) * step} 0`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.paper}>{children}</View>
      {width > 0 ? (
        <Svg width={width} height={TOOTH * 0.6}>
          <Path d={`${edge} Z`} fill={colors.surface} />
        </Svg>
      ) : null}
    </View>
  );
}

/** The dashed fold line across a receipt. */
export function ReceiptRule() {
  const styles = useStyles(createStyles);
  return <View style={styles.rule} />;
}

const createStyles = ({ colors, radius, size, space, border }: Theme) =>
  StyleSheet.create({
    paper: { backgroundColor: colors.surface, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, padding: size.cardPadding, paddingBottom: space.lg, gap: space.lg },
    rule: { borderBottomWidth: border.thin, borderStyle: 'dashed', borderColor: colors.divider },
  });
