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
      backgroundColor: colors.primary,
      borderBottomLeftRadius: radius("lg"),
      borderBottomRightRadius: radius("lg"),
      borderRadius: radius("lg"),
      padding: spacing("0.5"),
      alignSelf: "flex-start",
      marginHorizontal: "auto",
      marginTop: -15,
    },
    pill: {
      paddingHorizontal: spacing("3.5"),
      paddingVertical: spacing("1"),
      borderRadius: radius("full"),
    },
    pillActive: {
      backgroundColor: colors.background,
    },
    label: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
      color: "#fff",
    },
    labelActive: {
      color: colors.primary,
      fontFamily: typography.fonts.semibold,
    },
  });
