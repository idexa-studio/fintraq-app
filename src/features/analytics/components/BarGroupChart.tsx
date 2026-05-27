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

const PAD = { top: 16, bottom: 28, left: 44, right: 8 };
const BAR_GAP = 3;
const BUCKET_PAD = 5;

const fmtY = (v: number) => (v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${Math.round(v)}`);

export const BarGroupChart = React.memo(function BarGroupChart({ data, width, height = 170 }: Props) {
  const { colors, typography } = useTheme();

  const chart = useMemo(() => {
    if (data.length === 0) return null;
    const cw = width - PAD.left - PAD.right;
    const ch = height - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
    const bucketW = cw / data.length;
    const barW = Math.max(3, (bucketW - BUCKET_PAD * 2 - BAR_GAP) / 2);
    const baseY = PAD.top + ch;

    const bars = data.flatMap((d, i) => {
      const bx = PAD.left + i * bucketW + BUCKET_PAD;
      const ih = Math.max(2, (d.income / maxVal) * ch);
      const eh = Math.max(2, (d.expense / maxVal) * ch);
      return [
        { x: bx, y: baseY - ih, w: barW, h: ih, color: colors.success + 'CC', key: `i${i}` },
        { x: bx + barW + BAR_GAP, y: baseY - eh, w: barW, h: eh, color: colors.danger + 'CC', key: `e${i}` },
      ];
    });

    const xLabels = data.map((d, i) => ({
      label: d.label,
      x: PAD.left + i * bucketW + bucketW / 2,
    }));

    const yTicks = [1, 2, 3, 4].map(i => ({
      v: (maxVal * i) / 4,
      y: PAD.top + ch - (ch * i) / 4,
    }));

    return { bars, xLabels, yTicks };
  }, [data, width, height, colors]);

  if (!chart) return null;

  return (
    <Svg width={width} height={height}>
      {chart.yTicks.map((tick, i) => (
        <React.Fragment key={i}>
          <SvgLine
            x1={PAD.left} y1={tick.y}
            x2={width - PAD.right} y2={tick.y}
            stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,5"
          />
          <SvgText
            x={PAD.left - 4} y={tick.y + 3.5}
            fontSize={8.5} fill={colors.textMuted}
            textAnchor="end" fontFamily={typography.fonts.regular}
          >
            {fmtY(tick.v)}
          </SvgText>
        </React.Fragment>
      ))}

      {chart.bars.map(b => (
        <Rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color} rx={2} />
      ))}

      {chart.xLabels.map((l, i) => (
        <SvgText key={i}
          x={l.x} y={height - 6}
          fontSize={8.5} fill={colors.textMuted}
          textAnchor="middle" fontFamily={typography.fonts.regular}
        >
          {l.label}
        </SvgText>
      ))}
    </Svg>
  );
});

const styles = StyleSheet.create({});
