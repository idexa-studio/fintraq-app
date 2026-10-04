import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/src/components/ui';
import { getCurrencySymbol } from '@/src/constants/currency';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  currency: string;
  helperText?: string;
  error?: string;
  autoFocus?: boolean;
};

/** A money input sized like the entry form's: the symbol beside a large figure, in one calm well. */
export const AmountField = React.memo(function AmountField({ label, value, onChangeText, currency, helperText, error, autoFocus }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.root}>
      <View style={[styles.well, focused && styles.wellFocused, error ? styles.wellError : null]}>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <View style={styles.row}>
          <Text variant="title" tone="muted" style={styles.symbol}>
            {getCurrencySymbol(currency)}
          </Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="0"
            placeholderTextColor={theme.alpha(colors.textMuted, 'strong')}
            keyboardType="decimal-pad"
            maxLength={16}
            selectionColor={colors.primaryInk}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={autoFocus}
            accessibilityLabel={label}
          />
        </View>
      </View>
      {error ? (
        <Text variant="caption" tone="danger" style={styles.helper}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="muted" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('1.5') },
    well: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('4'),
      paddingTop: spacing('3'),
      paddingBottom: spacing('2'),
      gap: spacing('0.5'),
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    wellFocused: { borderColor: colors.primary },
    wellError: { borderColor: colors.danger },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    symbol: { flexShrink: 0 },
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.metrics.display,
      fontFamily: typography.fonts.amountBold,
      color: colors.text,
      paddingVertical: 0,
    },
    helper: { paddingHorizontal: spacing('1') },
  });
