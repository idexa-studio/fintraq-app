import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { BentoPressable, Icon, OptionsBottomSheet, Text } from '@/src/components/ui';
import { CaretDownIcon } from '@/src/components/ui/icons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { formatCurrency } from '@/src/utils/format';

type Props = {
  currencies: string[];
  selected: string;
  onSelect: (currency: string) => void;
  /** Shown next to each code in the sheet (e.g. balance or net per currency). */
  amounts?: Record<string, number>;
};

/**
 * Currency switch for a HeroSurface: one compact chip that opens a sheet. It stays the same size
 * with two currencies or twenty, where a row of tabs overflowed the card. Hidden with one currency.
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
        <Text variant="label" color={hero.textPrimary}>
          {selected}
        </Text>
        <Icon icon={CaretDownIcon} size={14} color={hero.income} weight="bold" />
      </BentoPressable>
      <OptionsBottomSheet visible={open} onClose={() => setOpen(false)} title={t('ui.currency')} options={options} />
    </>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      height: 30,
      paddingLeft: spacing('3'),
      paddingRight: spacing('2'),
      borderRadius: radius('full'),
      backgroundColor: hero.tileStrong,
    },
  });
