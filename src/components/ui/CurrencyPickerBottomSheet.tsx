import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CURRENCIES } from '../../constants/currency';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';

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
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.7}
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
      </TouchableOpacity>
    );
  }, [value, handleSelect, styles, colors]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Currency</Text>
              <Text style={styles.subtitle}>{CURRENCIES.length} currencies</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={17} color={colors.textMuted} />
              </TouchableOpacity>
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
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
                <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: overlay.dim,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      height: '82%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      borderRadius: radius('full'),
      marginTop: spacing('3'),
      backgroundColor: colors.text + '24',
    },

    // Header
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('3'),
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
      width: 30,
      height: 30,
      borderRadius: radius('full'),
      backgroundColor: colors.background,
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
