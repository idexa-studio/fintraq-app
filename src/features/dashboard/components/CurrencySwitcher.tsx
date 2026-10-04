import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, OptionsBottomSheet, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { getCurrencySymbol } from '@/src/constants/currency';
import { formatCurrency } from '@/src/utils/format';

type Props = {
  currencies: string[];
  selected: string;
  onSelect: (currency: string) => void;
  /** Shown next to each code in the sheet (e.g. balance or net per currency). */
  amounts?: Record<string, number>;
};

/**
 * Currency switch for a HeroSurface: one frosted pill — symbol disc, code, chevron — that opens a
 * sheet. It stays the same size with two currencies or twenty. Hidden with one currency.
 */
export const CurrencySwitcher = React.memo(function CurrencySwitcher({ currencies, selected, onSelect, amounts }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  if (currencies.length <= 1) return null;

  const options = currencies.map((code) => ({
    key: code,
    label: amounts?.[code] !== undefined ? `${code}  ·  ${formatCurrency(amounts[code]!, code)}` : code,
    selected: code === selected,
    onPress: () => onSelect(code),
  }));

  return (
    <>
      <BentoPressable
        style={styles.chip}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t('ui.currency')}: ${selected}`}
        hitSlop={8}
      >
        <View style={styles.symbol}>
          <Text variant="micro" color={hero.onInk} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.symbolText}>
            {getCurrencySymbol(selected)}
          </Text>
        </View>
        <Text variant="calloutStrong" color={hero.textPrimary}>
          {selected}
        </Text>
        <Icon name="chevron-down" size={14} color={hero.textPrimary} weight="bold" />
      </BentoPressable>
      <OptionsBottomSheet visible={open} onClose={() => setOpen(false)} title={t('ui.currency')} options={options} />
    </>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 32,
      paddingLeft: 4,
      paddingRight: spacing('2.5'),
      borderRadius: radius('full'),
      backgroundColor: hero.tile,
    },
    symbol: {
      width: 24,
      height: 24,
      borderRadius: radius('full'),
      backgroundColor: hero.ink,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    symbolText: { textAlign: 'center' },
  });
