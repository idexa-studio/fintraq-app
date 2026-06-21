import { BentoPressable } from "@/src/components/ui/BentoPressable";
import { ThemeContextType, useTheme } from "@/src/providers/ThemeProvider";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  currencies: string[];
  selectedCurrency: string;
  onCurrencySelect?: (currency: string) => void;
};

export const CurrencyPickerTab = React.memo(function CurrencyPickerTab({
  currencies,
  selectedCurrency,
  onCurrencySelect,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

const createStyles = ({ spacing, radius, typography, colors }: ThemeContextType) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: radius("full"),
      padding: spacing("0.5"),
      alignSelf: "flex-start",
      marginHorizontal: spacing("5"),
      marginTop: spacing("3"),
    },
    pill: {
      paddingHorizontal: spacing("3.5"),
      paddingVertical: spacing("1"),
      borderRadius: radius("full"),
    },
    pillActive: {
      backgroundColor: colors.primary,
    },
    label: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
    },
  });
