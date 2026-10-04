import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The brand card that carries a screen's headline figure (Home balance, Transactions net, net
 * worth, the entry amount): lime with dark text in light mode, deep emerald with white text in
 * dark mode. Children take every colour from `theme.heroCard` (textPrimary / textMuted for text,
 * income / expense / transfer for signals, separator / tileStrong for tiles and chips), so the
 * hero can be re-skinned in one place.
 */
export const HeroSurface = React.memo(function HeroSurface({ children, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
});

const createStyles = ({ heroCard, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('4'),
      overflow: 'hidden',
    },
  });
