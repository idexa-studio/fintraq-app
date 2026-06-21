import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import type { DowSpend } from '../api/analytics';

type Props = { data: DowSpend[] };

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DowChart = React.memo(function DowChart({ data }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const filled = useMemo(() => {
    const maxVal = Math.max(1, ...data.map(d => d.total));
    return Array.from({ length: 7 }, (_, dow) => {
      const entry = data.find(d => d.dow === dow);
      const total = entry?.total ?? 0;
      const ratio = total / maxVal;
      const color = ratio > 0.7 ? colors.danger : ratio > 0.35 ? colors.warning : colors.success;
      return { dow, label: DOW_LABELS[dow], total, ratio, color };
    });
  }, [data, colors]);

  return (
    <View style={styles.row}>
      {filled.map(d => (
        <View key={d.dow} style={styles.col}>
          <View style={styles.track}>
            <View style={[
              styles.fill,
              {
                height: `${Math.max(4, Math.round(d.ratio * 100))}%`,
                backgroundColor: d.color,
                opacity: d.ratio > 0 ? 0.75 + d.ratio * 0.25 : 0.2,
              },
            ]} />
          </View>
          <Text style={[styles.lbl, { color: colors.textMuted, fontFamily: typography.fonts.semibold }]}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, typography }: ThemeContextType) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    gap: spacing('1.5'),
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: spacing('1'),
    height: '100%',
  },
  track: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background + '80',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 4,
  },
  lbl: { fontSize: typography.sizes.xxs, letterSpacing: 0.5 },
});
