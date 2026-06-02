import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  Line as SvgLine,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../../../providers/ThemeProvider';

export type AreaChartPoint = {
  label: string;
  income: number;
  expense: number;
};

type Props = {
  data: AreaChartPoint[];
  width: number;
  height?: number;
};

const PAD = { top: 12, bottom: 24, left: 30, right: 8 };

const buildCurvePath = (pts: { x: number; y: number }[]) => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const n = pts[i];
    const mx = (p.x + n.x) / 2;
    d += ` C ${mx} ${p.y} ${mx} ${n.y} ${n.x} ${n.y}`;
  }
  return d;
};

const fmtY = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${Math.round(v)}`;
};

export const AreaChart = React.memo(function AreaChart({ data, width, height = 190 }: Props) {
  const { colors, typography } = useTheme();
  const gridColor = colors.text + '10';
  const labelColor = colors.textMuted;

  const chart = useMemo(() => {
    const n = data.length;
    if (n === 0) return null;

    const cw = width - PAD.left - PAD.right;
    const ch = height - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
    const xOf = (i: number) => PAD.left + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);
    const yOf = (v: number) => PAD.top + ch - (v / maxVal) * ch;

    const expPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.expense) }));
    const incPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.income) }));
    const bottomY = PAD.top + ch;

    const expLine = buildCurvePath(expPts);
    const incLine = buildCurvePath(incPts);
    const expArea = expLine + ` L ${expPts[n - 1].x} ${bottomY} L ${expPts[0].x} ${bottomY} Z`;
    const incArea = incLine + ` L ${incPts[n - 1].x} ${bottomY} L ${incPts[0].x} ${bottomY} Z`;

    // 4 grid lines at 25% intervals — skip 0
    const yTicks = [1, 2, 3, 4].map(i => ({
      v: (maxVal * i) / 4,
      y: PAD.top + ch - (ch * i) / 4,
    }));

    // max 6 x-labels
    const step = Math.max(1, Math.ceil(n / 6));
    const xLabels = data
      .map((d, i) => ({ label: d.label, x: xOf(i), show: i % step === 0 || i === n - 1 }))
      .filter(l => l.show);

    return { expLine, incLine, expArea, incArea, yTicks, xLabels, bottomY };
  }, [data, width, height]);

  if (!chart) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: colors.textMuted, fontFamily: typography.fonts.regular, fontSize: 12 }}>
          No data for period
        </Text>
      </View>
    );
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaExp" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.danger} stopOpacity="0.18" />
          <Stop offset="100%" stopColor={colors.danger} stopOpacity="0.01" />
        </LinearGradient>
        <LinearGradient id="areaInc" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.success} stopOpacity="0.12" />
          <Stop offset="100%" stopColor={colors.success} stopOpacity="0.01" />
        </LinearGradient>
      </Defs>

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

      {/* Area fills */}
      <Path d={chart.incArea} fill="url(#areaInc)" />
      <Path d={chart.expArea} fill="url(#areaExp)" />

      {/* Lines */}
      <Path d={chart.incLine} stroke={colors.success} strokeWidth={1.5} fill="none" />
      <Path d={chart.expLine} stroke={colors.danger} strokeWidth={2} fill="none" />

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
