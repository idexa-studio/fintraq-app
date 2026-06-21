import { BentoPressable } from "@/src/components/ui/BentoPressable";
import { ThemeContextType, useTheme } from "@/src/providers/ThemeProvider";
import { HeroCardPalette } from "@/src/theme/colors";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  currencies: string[];
  selectedCurrency: string;
  onCurrencySelect?: (currency: string) => void;
  heroCard: HeroCardPalette;
};

export const CurrencyPickerTab = React.memo(function CurrencyPickerTab({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  heroCard,
}: Props) {
  const theme = useTheme();
  const { isDark } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard, isDark), [theme, heroCard, isDark]);

  if (currencies.length <= 1) return null;

  return (
    <View style={styles.track}>
      {currencies.map((c) => {
        const isSelected = c === selectedCurrency;
        return (
          <BentoPressable
            key={c}
            style={[styles.pill, isSelected && styles.pillActive]}
            onPress={() => onCurrencySelect?.(c)}
          >
            <Text style={[styles.label, isSelected && styles.labelActive]}>
              {c}
            </Text>
          </BentoPressable>
        );
      })}
    </View>
  );
});

const createStyles = ({ spacing, radius, typography }: ThemeContextType, heroCard: HeroCardPalette, isDark: boolean) =>
  StyleSheet.create({
     track: {
      flexDirection: "row",
      backgroundColor: heroCard.separator,
      borderRadius: radius("full"),
      padding: spacing("0.5"),
      alignSelf: "center",
      marginTop: spacing("2.5"),
    },
    pill: {
      paddingHorizontal: spacing("3.5"),
      paddingVertical: spacing("1"),
      borderRadius: radius("full"),
    },
    pillActive: {
      backgroundColor: heroCard.textPrimary,
    },
    label: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      color: heroCard.textMuted,
    },
    labelActive: {
      color: isDark ? '#008040' : '#FFFFFF',
      fontFamily: typography.fonts.semibold,
    },
  });
