import { Text } from '@/design/components/Text';
import { useFontScale, useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { useFocusOnArrival } from '@/design/components/useFocusOnArrival';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

export type AmountFieldProps = {
  /** The amount as typed. */
  value: string;
  onChangeText: (text: string) => void;
  /** The currency symbol, printed before the figure. */
  symbol: string;
  accessibilityLabel: string;
  /** Opens the keyboard once the screen has arrived. */
  focusOnArrival?: boolean;
};

/** The figure being entered, at the size of a headline: the one large thing on an entry screen. */
export function AmountField({ value, onChangeText, symbol, accessibilityLabel, focusOnArrival = false }: AmountFieldProps) {
  const { colors, type } = useTheme();
  const styles = useStyles(createStyles);
  const scale = useFontScale();
  const input = useFocusOnArrival(focusOnArrival);

  const figure = { fontFamily: type.amountHero.fontFamily, fontWeight: type.amountHero.fontWeight, fontSize: type.amountHero.fontSize * scale };
  return (
    <View style={styles.row}>
      <Text variant="amountHero" tone={value ? 'default' : 'muted'}>{symbol}</Text>
      <TextInput
        ref={input}
        value={value}
        onChangeText={onChangeText}
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.selected}
        keyboardType="decimal-pad"
        allowFontScaling={false}
        maxLength={16}
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, figure, { color: colors.text }]}
      />
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    input: { flex: 1, padding: 0, minWidth: 0 },
  });
