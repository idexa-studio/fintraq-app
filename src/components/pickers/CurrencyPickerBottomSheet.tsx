import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Icon } from '@/src/components/ui/Icon';
import { SearchField } from '@/src/components/ui/SearchField';
import { SheetHeader } from '@/src/components/ui/SheetHeader';
import { Text } from '@/src/components/ui/Text';
import { CURRENCIES, type Currency } from '@/shared/currency/currencies';
import { useSettings } from '@/features/settings';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

export type CurrencyPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
};

type Section = { key: string; title: string; data: Currency[] };

export const CurrencyPickerBottomSheet = React.memo(function CurrencyPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
}: CurrencyPickerBottomSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const bottomSheet = useBottomSheet();
  const { profile } = useSettings();
  const defaultCurrency = profile.defaultCurrency;

  const selected = useMemo(() => CURRENCIES.find((c) => c.code === value), [value]);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const matches = CURRENCIES.filter(
        (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase() === q,
      );
      return matches.length ? [{ key: 'results', title: '', data: matches }] : [];
    }

    // Suggested = the user's default + the current selection, so the likely
    // answer is always one tap away without scrolling 150+ rows.
    const suggestedCodes = [...new Set([defaultCurrency, value].filter(Boolean))] as string[];
    const suggested = suggestedCodes
      .map((code) => CURRENCIES.find((c) => c.code === code))
      .filter((c): c is Currency => !!c);
    const rest = CURRENCIES.filter((c) => !suggestedCodes.includes(c.code));

    return [
      ...(suggested.length ? [{ key: 'suggested', title: t('ui.suggested'), data: suggested }] : []),
      { key: 'all', title: t('ui.allCurrencies'), data: rest },
    ];
  }, [query, value, defaultCurrency, t]);

  const handleSelect = useCallback((code: string) => {
    Haptics.selectionAsync().catch(() => {});
    setQuery('');
    onChange(code);
    onClose();
  }, [onChange, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const renderItem = useCallback(({ item }: { item: Currency }) => {
    const isSelected = item.code === value;
    return (
      <BentoPressable
        style={[styles.row, isSelected && { backgroundColor: alpha(colors.primary, 'subtle') }]}
        onPress={() => handleSelect(item.code)}
        scaleOnPress={false}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.code}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={[styles.symbolTile, isSelected && { backgroundColor: colors.primary }]}>
          <Text
            variant="bodyStrong"
            color={isSelected ? colors.primaryForeground : colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {item.symbol}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <Text variant="bodyStrong" numberOfLines={1}>{item.name}</Text>
          <Text variant="caption" tone="muted">{item.code}</Text>
        </View>
        {isSelected ? <Icon name="check-circle" size={22} color={colors.primaryInk} weight="fill" /> : null}
      </BentoPressable>
    );
  }, [value, handleSelect, styles, colors, alpha]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
    section.title ? <Text variant="label" tone="muted" style={styles.sectionLabel}>{section.title}</Text> : null
  ), [styles]);

  const snapPoints = useMemo(() => ['85%'], []);

  return (
    <BentoBottomSheet visible={visible} onClose={handleClose} snapPoints={snapPoints} keyboardBehavior="interactive">
      <View style={{ flex: 1 }}>
        <SheetHeader
          title={t('ui.currency')}
          subtitle={selected ? `${selected.name} · ${selected.code}` : t('ui.currenciesCount', { count: CURRENCIES.length })}
        />
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('ui.searchCurrency')}
          style={styles.search}
        />
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={14}
          maxToRenderPerBatch={12}
          windowSize={7}
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <EmptyState icon="search" title={t('ui.noMatch', { query: query.trim() })} color={colors.textMuted} />
          }
        />
      </View>
    </BentoBottomSheet>
  );
});

const ROW_HEIGHT = 60;

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    search: { marginHorizontal: layout.screenPadding, marginBottom: spacing('2') },
    listContent: { paddingHorizontal: spacing('2'), paddingBottom: spacing('6') },
    sectionLabel: {
      paddingHorizontal: layout.screenPadding - spacing('2') + spacing('1'),
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    row: {
      height: ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('md'),
    },
    symbolTile: {
      width: 40,
      height: 40,
      borderRadius: radius('md'),
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    rowBody: { flex: 1, gap: 1 },
  });
