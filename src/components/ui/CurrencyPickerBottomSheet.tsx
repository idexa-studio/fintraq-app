import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
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

const ITEM_HEIGHT = 60;

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
            <MaterialCommunityIcons name="check" size={12} color={colors.background} />
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
          <BentoPressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </BentoPressable>
        </View>

        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
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
              <MaterialCommunityIcons name="close-circle" size={17} color={colors.textMuted} />
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
              <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
              <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
            </View>
          }
        />
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
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
      fontSize: 22,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 2,
      opacity: 0.7,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Search
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('2'),
      height: 46,
      borderRadius: radius('xl'),
      backgroundColor: colors.background,
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
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('1'),
      paddingBottom: Platform.OS === 'ios' ? spacing('9') : spacing('6'),
      gap: spacing('0.5'),
    },

    // Row
    row: {
      height: ITEM_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      borderRadius: radius('xl'),
      gap: spacing('3'),
    },
    rowSelected: {
      backgroundColor: colors.primary + '0F',
    },

    // Currency code chip
    chip: {
      width: 46,
      height: 28,
      borderRadius: radius('md'),
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipSelected: {
      backgroundColor: colors.primary + '18',
    },
    chipText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
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
      fontFamily: typography.fonts.semibold,
    },

    // Check indicator
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkPlaceholder: {
      width: 20,
      height: 20,
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
