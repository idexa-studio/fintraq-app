import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line as SvgLine, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../../providers/ThemeProvider';

export type BarBucket = {
  label: string;
  income: number;
  expense: number;
};

type Props = {
  data: BarBucket[];
  width: number;
  height?: number;
};

const PAD    = { top: 12, bottom: 24, left: 30, right: 8 };
const BAR_R  = 4;   // bar corner radius
const BAR_GAP = 4;  // gap between income/expense bars within bucket
const BUCKET_PAD = 8; // padding inside each bucket group

const fmtY = (v: number): string =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
  : `${Math.round(v)}`;

export const BarGroupChart = React.memo(function BarGroupChart({ data, width, height = 170 }: Props) {
  const { colors, typography } = useTheme();
  const gridColor = colors.text + '10';
  const labelColor = colors.textMuted;

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const cw = width - PAD.left - PAD.right;
    const ch = height - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
    const bucketW = cw / data.length;
    const barW = Math.max(4, (bucketW - BUCKET_PAD * 2 - BAR_GAP) / 2);
    const baseY = PAD.top + ch;

    const bars = data.flatMap((d, i) => {
      const bx = PAD.left + i * bucketW + BUCKET_PAD;
      const ih = Math.max(2, (d.income  / maxVal) * ch);
      const eh = Math.max(2, (d.expense / maxVal) * ch);
      return [
        { x: bx,               y: baseY - ih, w: barW, h: ih, color: colors.success + 'D0', key: `i${i}` },
        { x: bx + barW + BAR_GAP, y: baseY - eh, w: barW, h: eh, color: colors.danger  + 'D0', key: `e${i}` },
      ];
    });

    const xLabels = data.map((d, i) => ({
      label: d.label,
      x: PAD.left + i * bucketW + bucketW / 2,
    }));

    // 3 grid lines at 33/66/100%
    const yTicks = [1, 2, 3].map(i => ({
      v: (maxVal * i) / 3,
      y: PAD.top + ch - (ch * i) / 3,
    }));

    return { bars, xLabels, yTicks };
  }, [data, width, height, colors]);

  if (!chart) return <View style={[styles.empty, { height }]} />;

  return (
    <Svg width={width} height={height}>
      {/* Horizontal grid lines */}
      {chart.yTicks.map((tick, i) => (
        <React.Fragment key={i}>
          <SvgLine
            x1={PAD.left} y1={tick.y}
            x2={width - PAD.right} y2={tick.y}
            stroke={gridColor} strokeWidth={1}
          />
          <SvgText
            x={PAD.left - 5} y={tick.y + 3.5}
            fontSize={9} fill={labelColor}
            textAnchor="end" fontFamily={typography.fonts.regular}
          >
            {fmtY(tick.v)}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Bars */}
      {chart.bars.map(b => (
        <Rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color} rx={BAR_R} ry={BAR_R} />
      ))}

      {/* X-axis labels */}
      {chart.xLabels.map((l, i) => (
        <SvgText key={i}
          x={l.x} y={height - 4}
          fontSize={9} fill={labelColor}
          textAnchor="middle" fontFamily={typography.fonts.regular}
        >
          {l.label}
        </SvgText>
      ))}
    </Svg>
  );
});

const styles = StyleSheet.create({
  empty: { justifyContent: 'center', alignItems: 'center' },
});
