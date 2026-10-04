import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type HeroSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const RING_LARGE = 240;
const RING_SMALL = 132;

/**
 * The brand card that carries a screen's headline figure (Home balance, Transactions net, net
 * worth, the entry amount): lime with dark text in light mode, emerald with white text in dark
 * mode. Every hero follows one layout — label, figure, two translucent stat tiles (`HeroSplit`),
 * then the currency track (`CurrencySwitcher`) — and takes every colour from `theme.heroCard`.
 *
 * Two concentric rings break out of the top-right corner: the brand motif shared with the profile
 * card and the paywall, so the hero reads as a designed object rather than a flat fill. They sit
 * behind the content, in a tone a few percent off the fill, and never carry meaning.
 */
export const HeroSurface = React.memo(function HeroSurface({ children, style }: HeroSurfaceProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.ring, styles.ringLarge]} />
        <View style={[styles.ring, styles.ringSmall]} />
      </View>
      {children}
    </View>
  );
});

const createStyles = ({ heroCard, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
    ring: {
      position: 'absolute',
      borderRadius: radius('full'),
      borderColor: heroCard.decoOverlay,
    },
    ringLarge: {
      width: RING_LARGE,
      height: RING_LARGE,
      borderWidth: 34,
      top: -RING_LARGE * 0.42,
      right: -RING_LARGE * 0.3,
    },
    ringSmall: {
      width: RING_SMALL,
      height: RING_SMALL,
      borderWidth: 18,
      top: -RING_SMALL * 0.1,
      right: -RING_SMALL * 0.02,
    },
  });
