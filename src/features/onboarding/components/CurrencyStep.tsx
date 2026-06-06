import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CURRENCIES } from '../../../constants/currency';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

const POPULAR_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'SGD', 'AED', 'HKD', 'MXN', 'ZAR'];

type CurrencyStepProps = {
  currency: string;
  onCurrencyChange: (value: string) => void;
};

export const CurrencyStep = React.memo(function CurrencyStep({ currency, onCurrencyChange }: CurrencyStepProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [query, setQuery] = useState('');

  const selected = useMemo(() => CURRENCIES.find(c => c.code === currency), [currency]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const popular = POPULAR_CODES
        .map(code => CURRENCIES.find(c => c.code === code))
        .filter((c): c is typeof CURRENCIES[0] => !!c);
      const rest = CURRENCIES.filter(c => !POPULAR_CODES.includes(c.code));
      return { popular, rest, isSearching: false };
    }
    const results = CURRENCIES.filter(
      c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
    return { popular: results, rest: [], isSearching: true };
  }, [query]);

  const handleClear = useCallback(() => setQuery(''), []);

  const renderRow = useCallback((item: typeof CURRENCIES[0]) => {
    const isSelected = item.code === currency;
    return (
      <BentoPressable
        key={item.code}
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => onCurrencyChange(item.code)}
      >
        <View style={[styles.codeBadge, isSelected && styles.codeBadgeSelected]}>
          <Text style={[styles.codeText, isSelected && styles.codeTextSelected]}>{item.code}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.currencyName, isSelected && styles.currencyNameSelected]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.symbolText}>{item.symbol}</Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
        )}
      </BentoPressable>
    );
  }, [currency, onCurrencyChange, styles, colors.primary]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.preview}>
        <Text style={styles.previewSymbol}>{selected?.symbol ?? currency}</Text>
        <View>
          <Text style={styles.previewCode}>{currency}</Text>
          <Text style={styles.previewName} numberOfLines={1}>{selected?.name ?? 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by code or name…"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <BentoPressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={15} color={colors.textMuted} />
          </BentoPressable>
        )}
      </View>

      <View style={styles.list}>
        {!filtered.isSearching && (
          <Text style={styles.listSection}>Popular</Text>
        )}
        {filtered.popular.map(renderRow)}

        {!filtered.isSearching && filtered.rest.length > 0 && (
          <>
            <Text style={styles.listSectionSpaced}>All currencies</Text>
            {filtered.rest.map(renderRow)}
          </>
        )}

        {filtered.isSearching && filtered.popular.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No currencies match \u201C{query}\u201D</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing('4'),
    },

    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      padding: spacing('4'),
    },
    previewSymbol: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 32,
      color: colors.primary,
      letterSpacing: -1,
      minWidth: 40,
      textAlign: 'center',
    },
    previewCode: {
      fontFamily: typography.fonts.bold,
      fontSize: 16,
      color: colors.text,
      letterSpacing: 0.5,
    },
    previewName: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing('0.5'),
    },

    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      height: 44,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('3'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },

    list: {
      gap: 0,
    },
    listSection: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginBottom: spacing('2'),
      paddingLeft: spacing('1'),
    },
    listSectionSpaced: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: spacing('4'),
      marginBottom: spacing('2'),
      paddingLeft: spacing('1'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('sm'),
      gap: spacing('3'),
    },
    rowSelected: {
      backgroundColor: colors.primary + '10',
    },
    codeBadge: {
      width: 46,
      height: 30,
      borderRadius: radius('xs'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeBadgeSelected: {
      backgroundColor: colors.primary + '20',
    },
    codeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    codeTextSelected: {
      color: colors.primary,
    },
    nameBlock: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    currencyName: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.text,
    },
    currencyNameSelected: {
      fontFamily: typography.fonts.semibold,
    },
    symbolText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
    },
    empty: {
      paddingVertical: spacing('7'),
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });
