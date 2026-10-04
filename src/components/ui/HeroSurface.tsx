import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The brand card that carries a screen's headline figure (Home balance, Transactions net, net
 * worth, the entry amount): lime with dark text in light mode, emerald with white text in dark
 * mode. Every hero follows one layout — label, figure, two translucent stat tiles (`HeroSplit`),
 * then the currency track (`CurrencySwitcher`) — and takes every colour from `theme.heroCard`.
 */
export const HeroSurface = React.memo(function HeroSurface({ children, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={[styles.card, style]}>{children}</View>;
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
  });
