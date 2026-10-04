import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MoneyText } from './MoneyText';
import { Text } from './Text';

export type HeroSplitSide = { label: string; amount: number };

type Props = {
  /** Drawn in solid ink: income, assets. */
  primary: HeroSplitSide;
  /** Drawn in soft ink: expenses, debts. */
  secondary: HeroSplitSide;
  currency?: string;
};

/**
 * Two figures and the bar that weighs them, for a HeroSurface. Monochrome on purpose: solid ink
 * against soft ink reads on lime and on emerald, where green/red pairs fail. The legend marks
 * repeat the bar's two strengths so the figures map to it without colour.
 */
export const HeroSplit = React.memo(function HeroSplit({ primary, secondary, currency }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const total = primary.amount + secondary.amount;
  const share = total > 0 ? primary.amount / total : 0;

  const side = (s: HeroSplitSide, solid: boolean) => (
    <View style={[styles.side, !solid && styles.sideEnd]}>
      <View style={styles.label}>
        <View style={[styles.mark, solid ? styles.markSolid : styles.markSoft]} />
        <Text variant="caption" color={hero.textMuted} numberOfLines={1}>
          {s.label}
        </Text>
      </View>
      <MoneyText
        amount={s.amount}
        currency={currency}
        weight="semibold"
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {total > 0 ? (
          <>
            {share > 0 ? <View style={[styles.fill, styles.fillSolid, { flex: share }]} /> : null}
            {share < 1 ? <View style={[styles.fill, styles.fillSoft, { flex: 1 - share }]} /> : null}
          </>
        ) : null}
      </View>
      <View style={styles.sides}>
        {side(primary, true)}
        {side(secondary, false)}
      </View>
    </View>
  );
});

const BAR = 8;

const createStyles = ({ heroCard: hero, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('3') },
    track: { flexDirection: 'row', height: BAR, gap: 3, borderRadius: radius('full'), backgroundColor: hero.track, overflow: 'hidden' },
    fill: { height: BAR, borderRadius: radius('full') },
    fillSolid: { backgroundColor: hero.textPrimary },
    fillSoft: { backgroundColor: hero.fillSoft },
    sides: { flexDirection: 'row', gap: spacing('4') },
    side: { flex: 1, gap: spacing('0.5') },
    sideEnd: { alignItems: 'flex-end' },
    label: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    mark: { width: 10, height: 10, borderRadius: radius('full') },
    markSolid: { backgroundColor: hero.textPrimary },
    markSoft: { backgroundColor: hero.fillSoft },
    value: { ...typography.metrics.lg, color: hero.textPrimary },
  });
