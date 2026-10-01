import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { BentoPressable, HeroSurface, Icon, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ArrowDownLeftIcon, ArrowsLeftRightIcon, ArrowUpRightIcon, CalculatorIcon } from '@/src/components/ui/icons';
import { CalculatorBottomSheet } from '@/src/components/pickers/CalculatorBottomSheet';
import { CURRENCIES } from '@/src/constants/currency';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/src/types';

type Props = {
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
  /** Editing keeps the original type: only the current one shows, not pressable. */
  typeLocked?: boolean;
  /** Loan repayments have a fixed type; the switch is hidden. */
  hideType?: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
};

type TypeOption = { value: TransactionType; label: string; icon: IconSource; color: string };

/**
 * The top of the entry form on the same ink card as the Home and Transactions heroes: what kind of
 * entry, and how much. The amount is the page's headline, so it gets the most weight.
 */
export const TransactionEntryHero = React.memo(function TransactionEntryHero({
  type,
  onTypeChange,
  typeLocked = false,
  hideType = false,
  amount,
  onAmountChange,
  currency,
}: Props) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showCalc, setShowCalc] = useState(false);

  // The symbol people recognise (₹, $, €); falls back to the code.
  const symbol = useMemo(() => CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency, [currency]);

  const options = useMemo(
    (): TypeOption[] => [
      { value: 'DR', label: t('transactions.expense'), icon: ArrowUpRightIcon, color: colors.onHeroNegative },
      { value: 'CR', label: t('transactions.income'), icon: ArrowDownLeftIcon, color: colors.onHeroPositive },
      { value: 'TR', label: t('transactions.transfer'), icon: ArrowsLeftRightIcon, color: colors.onHeroInfo },
    ],
    [t, colors],
  );
  const visible = typeLocked ? options.filter((o) => o.value === type) : options;

  return (
    <HeroSurface style={styles.margin}>
      {!hideType ? (
        <View style={styles.types} accessibilityRole="tablist">
          {visible.map((option) => {
            const isActive = option.value === type;
            return (
              <BentoPressable
                key={option.value}
                style={[styles.type, isActive && { backgroundColor: alpha(option.color, 'soft') }]}
                onPress={() => {
                  if (typeLocked || isActive) return;
                  Haptics.selectionAsync().catch(() => {});
                  onTypeChange(option.value);
                }}
                disabled={typeLocked}
                scaleOnPress={false}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive, disabled: typeLocked }}
              >
                <Icon icon={option.icon} size={15} color={isActive ? option.color : colors.onInkMuted} weight="bold" />
                <Text variant="label" color={isActive ? colors.onInk : colors.onInkMuted} numberOfLines={1}>
                  {option.label}
                </Text>
              </BentoPressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.amountBlock}>
        <Text variant="caption" color={colors.onInkMuted}>
          {t('transactions.amount')}
        </Text>
        <View style={styles.amountRow}>
          <Text variant="headline" color={colors.onInkMuted} style={styles.symbol}>
            {symbol}
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={onAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={alpha(colors.onInk, 'medium')}
            selectionColor={colors.onHeroPositive}
            accessibilityLabel={t('transactions.amount')}
            autoFocus
          />
          <BentoPressable
            style={styles.calc}
            onPress={() => {
              Keyboard.dismiss();
              setShowCalc(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('transactions.calculator')}
          >
            <Icon icon={CalculatorIcon} size={20} color={colors.onInk} />
          </BentoPressable>
        </View>
      </View>

      <CalculatorBottomSheet visible={showCalc} onClose={() => setShowCalc(false)} value={amount} onConfirm={onAmountChange} currency={currency} />
    </HeroSurface>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    types: {
      flexDirection: 'row',
      gap: spacing('1'),
      padding: spacing('1'),
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.onInk, 'faint'),
    },
    type: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1.5'),
      height: 36,
      paddingHorizontal: spacing('2'),
      borderRadius: radius('full'),
    },
    amountBlock: { gap: spacing('1') },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    symbol: { flexShrink: 0 },
    // minWidth 0 lets the field shrink inside the row instead of widening it to fit the text.
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.metrics.jumbo,
      fontFamily: typography.fonts.amountBold,
      color: colors.onInk,
      paddingVertical: 0,
    },
    calc: {
      width: 44,
      height: 44,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: alpha(colors.onInk, 'subtle'),
    },
  });
