import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Two soft rings in the top-right corner — the brand mark's echo. Off for dense heroes (entry form). */
  decorated?: boolean;
};

/**
 * The brand card that carries a screen's headline figure (Home balance, Transactions net, net
 * worth, the entry amount): lime with ink in light mode, emerald with white in dark mode. The hero
 * is monochrome — children take every colour from `theme.heroCard` (textPrimary / textMuted for
 * text, ink / onInk for solid buttons, tile / tileStrong for pills and wells, track / fillSoft for
 * bars), so it can be re-skinned in one place.
 */
export const HeroSurface = React.memo(function HeroSurface({ children, style, decorated = true }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      {decorated ? (
        <>
          <View style={[styles.ring, styles.ringLarge]} pointerEvents="none" />
          <View style={[styles.ring, styles.ringSmall]} pointerEvents="none" />
        </>
      ) : null}
      {children}
    </View>
  );
});

const RING_LARGE = 200;
const RING_SMALL = 96;

const createStyles = ({ heroCard, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
    ring: { position: 'absolute', borderRadius: radius('full'), borderColor: heroCard.decoOverlay },
    ringLarge: { width: RING_LARGE, height: RING_LARGE, borderWidth: 26, top: -RING_LARGE * 0.5, right: -RING_LARGE * 0.32 },
    ringSmall: { width: RING_SMALL, height: RING_SMALL, borderWidth: 14, top: RING_LARGE * 0.32, right: -RING_SMALL * 0.45 },
  });
