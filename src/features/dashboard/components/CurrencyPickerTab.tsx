import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Text } from '@/src/components/ui/Text';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

type Props = {
  currencies: string[];
  selectedCurrency: string;
  onCurrencySelect?: (currency: string) => void;
  heroCard: HeroCardPalette;
};

/** Currency switch on the lime hero: a tonal track with an ink thumb. Scrolls when there are many. */
export const CurrencyPickerTab = React.memo(function CurrencyPickerTab({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  heroCard,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  // The thumb is the hero's text colour, so its label takes the hero fill in dark mode.
  const activeInk = theme.isDark ? heroCard.background : theme.colors.onInk;

  if (currencies.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.track}
      accessibilityRole="tablist"
    >
      {currencies.map((c) => {
        const isSelected = c === selectedCurrency;
        return (
          <BentoPressable
            key={c}
            style={[styles.option, isSelected && styles.optionActive]}
            onPress={() => onCurrencySelect?.(c)}
            scaleOnPress={false}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text variant={isSelected ? 'label' : 'caption'} color={isSelected ? activeInk : heroCard.textMuted}>
              {c}
            </Text>
          </BentoPressable>
        );
      })}
    </ScrollView>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    scroll: { flexGrow: 0, alignSelf: 'center', maxWidth: '100%' },
    track: {
      backgroundColor: heroCard.separator,
      borderRadius: radius('full'),
      padding: spacing('1'),
      gap: spacing('0.5'),
    },
    option: {
      minWidth: 48,
      height: 28,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionActive: { backgroundColor: heroCard.textPrimary },
  });
