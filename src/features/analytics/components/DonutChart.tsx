import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import type { CategoryBreakdown } from '../api/analytics';

type Props = {
  data: CategoryBreakdown[];
  currency: string;
  size?: number;
};

const polarXY = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + r * Math.cos(a),
  y: cy + r * Math.sin(a),
});

const arcPath = (
  cx: number, cy: number,
  or: number, ir: number,
  start: number, end: number,
): string => {
  if (end - start >= Math.PI * 2) end = start + Math.PI * 2 - 0.0001;
  const o1 = polarXY(cx, cy, or, start);
  const o2 = polarXY(cx, cy, or, end);
  const i1 = polarXY(cx, cy, ir, end);
  const i2 = polarXY(cx, cy, ir, start);
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${or} ${or} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${ir} ${ir} 0 ${large} 0 ${i2.x} ${i2.y}`,
    'Z',
  ].join(' ');
};

export const DonutChart = React.memo(function DonutChart({ data, currency, size = 168 }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { segments, total } = useMemo(() => {
    const total = data.reduce((s, d) => s + d.amount, 0);
    if (total === 0) return { segments: [], total: 0 };
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 6;
    const innerR = outerR * 0.58;
    const GAP = data.length > 1 ? 0.04 : 0;
    let angle = -Math.PI / 2;
    const segments = data.map(d => {
      const sweep = (d.amount / total) * (Math.PI * 2 - GAP * data.length);
      const path = arcPath(cx, cy, outerR, innerR, angle + GAP / 2, angle + sweep + GAP / 2);
      angle += sweep + GAP;
      return { ...d, path, hexColor: colorNumberToHex(d.color) };
    });
    return { segments, total };
  }, [data, size]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height: size }]}>
        <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>No expense data</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ alignSelf: 'center', marginBottom: 20, width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
          {segments.map((seg, i) => (
            <Path key={i} d={seg.path} fill={seg.hexColor} />
          ))}
        </Svg>
        <View style={styles.center}>
          <Text style={[styles.centerLabel, { color: colors.textMuted, fontFamily: typography.fonts.semibold }]}>
            TOTAL
          </Text>
          <MoneyText amount={total} currency={currency} type="DR" weight="bold" compact style={styles.centerAmt} />
        </View>
      </View>

      {data.map((d, i) => {
        const pct = total > 0 ? (d.amount / total) * 100 : 0;
        const hex = colorNumberToHex(d.color);
        return (
          <View key={d.id} style={[styles.legendRow, i === data.length - 1 && styles.legendRowLast]}>
            <IconAvatar
              icon={resolveIcon(d.icon, 'pricetag-outline')}
              bg={hex}
              color={colors.text}
              size={32}
              iconSize={15}
            />
            <View style={styles.legendInfo}>
              <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
                {d.name}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.background }]}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: hex }]} />
              </View>
            </View>
            <View style={styles.legendRight}>
              <MoneyText amount={d.amount} currency={currency} type="DR" style={styles.legendAmt} weight="bold" compact />
              <Text style={[styles.legendPct, { color: colors.textMuted, fontFamily: typography.fonts.regular }]}>
                {pct.toFixed(0)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    empty: { justifyContent: 'center', alignItems: 'center' },
    emptyTxt: { fontSize: 12, fontFamily: typography.fonts.regular },
    center: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center',
    },
    centerLabel: { fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
    centerAmt: { fontSize: 18 },
    legendRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: spacing('2.5'),
      paddingVertical: spacing('2'),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    legendRowLast: { borderBottomWidth: 0 },
    legendInfo: { flex: 1, gap: spacing('1') },
    legendName: { fontFamily: typography.fonts.semibold, fontSize: 13 },
    barTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
    barFill: { height: 3, borderRadius: 2 },
    legendRight: { alignItems: 'flex-end', gap: 2 },
    legendAmt: { fontSize: 13 },
    legendPct: { fontSize: 10 },
  });
