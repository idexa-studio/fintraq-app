import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const GLOW = 240;

/**
 * The card that carries a screen's headline figure (Home balance, Transactions net): a mid
 * evergreen in both themes, the one green moment on a screen. Accents on it use the onHero* set
 * (mint / rose / sky), so it reads as premium in both themes and
 * whatever sits inside it — amounts, currency switch, actions — keeps full contrast.
 * Children use `colors.onInk` / `onInkMuted` for text and the `onHero*` accents for signal colours.
 */
export const HeroSurface = React.memo(function HeroSurface({ children, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      {/* A soft lime halo in the corner: the brand, without painting the whole card. */}
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.ring} pointerEvents="none" />
      {children}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.heroSurface,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      width: GLOW,
      height: GLOW,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.primary, 'faint'),
      top: -GLOW * 0.55,
      right: -GLOW * 0.35,
    },
    ring: {
      position: 'absolute',
      width: GLOW * 0.6,
      height: GLOW * 0.6,
      borderRadius: radius('full'),
      borderWidth: 1.5,
      borderColor: alpha(colors.primary, 'soft'),
      top: -GLOW * 0.2,
      right: -GLOW * 0.12,
    },
  });
