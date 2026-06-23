import { CancelCircleIcon, CheckIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CURRENCIES } from '../../constants/currency';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';
import { BentoBottomSheet, useBottomSheet } from './BottomSheet';

export type CurrencyPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
};

const ITEM_HEIGHT = 60; // 56px row + 4px gap

export const CurrencyPickerBottomSheet = React.memo(function CurrencyPickerBottomSheet({
  visible,
  onClose,
  value,
  onChange,
}: CurrencyPickerBottomSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const bottomSheet = useBottomSheet();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? CURRENCIES.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      : CURRENCIES;
    // pin selected to top when not searching
    if (!q) {
      const selectedIdx = list.findIndex(c => c.code === value);
      if (selectedIdx > 0) {
        const copy = [...list];
        const [sel] = copy.splice(selectedIdx, 1);
        return [sel, ...copy];
      }
    }
    return list;
  }, [query, value]);

  const handleSelect = useCallback((code: string) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(code);
    onClose();
  }, [onChange, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const keyExtractor = useCallback((item: typeof CURRENCIES[0]) => item.code, []);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: typeof CURRENCIES[0] }) => {
    const selected = item.code === value;
    return (
      <BentoPressable
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => handleSelect(item.code)}
        scaleOnPress={false}
      >
        <View style={[styles.chip, selected && styles.chipSelected]}>
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {item.code}
          </Text>
        </View>

        <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
          {item.name}
        </Text>

        {selected ? (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <HugeiconsIcon icon={CheckIcon} size={12} color={colors.primaryForeground} />
          </View>
        ) : (
          <View style={styles.checkPlaceholder} />
        )}
      </BentoPressable>
    );
  }, [value, handleSelect, styles, colors]);

  const snapPoints = useMemo(() => ['82%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Currency</Text>
            <Text style={styles.subtitle}>{CURRENCIES.length} currencies</Text>
          </View>
          {value ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{value}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.searchWrap}>
          <HugeiconsIcon icon={Search01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code"
            placeholderTextColor={colors.textMuted + '80'}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <BentoPressable onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <HugeiconsIcon icon={CancelCircleIcon} size={17} color={colors.textMuted} />
            </BentoPressable>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <HugeiconsIcon icon={Search01Icon} size={24} color={colors.textMuted} />
              <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
            </View>
          }
        />
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark, sizes }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    headerText: { flex: 1 },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
      opacity: 0.7,
    },
    headerBadge: {
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
      backgroundColor: colors.primary + '14',
    },
    headerBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.primary,
    },

    // Search
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('2'),
      height: sizes.input.md.height,
      borderRadius: radius('lg'),
      backgroundColor: colors.card,
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.text,
      paddingVertical: 0,
    },

    // List
    listContent: {
      paddingTop: spacing('1'),
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('3'),
      gap: spacing('1'),
    },

    // Row
    row: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
      gap: spacing('3'),
      borderWidth: 1,
      borderColor: 'transparent',
    },
    rowSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.primary + '30',
    },
    // Currency code chip
    chip: {
      width: 50,
      height: 28,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipSelected: {
      backgroundColor: colors.primary + '14',
      borderColor: colors.primary + '40',
    },
    chipText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    chipTextSelected: {
      color: colors.primary,
    },

    // Name
    name: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    nameSelected: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
    },

    // Check indicator
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkPlaceholder: {
      width: 22,
      height: 22,
    },

    // Empty
    emptyWrap: {
      paddingVertical: spacing('9'),
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
