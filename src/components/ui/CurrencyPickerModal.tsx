import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback } from 'react';
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
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

export type CurrencyPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
};

const ITEM_HEIGHT = 54;

export const CurrencyPickerModal = React.memo(function CurrencyPickerModal({
  visible,
  onClose,
  value,
  onChange
}: CurrencyPickerModalProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = useCallback((code: string) => {
    onChange(code);
    onClose();
  }, [onChange, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const renderItem = useCallback(({ item }: { item: typeof CURRENCIES[0] }) => {
    const selected = item.code === value;
    return (
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.85}
      >
        <View style={[styles.codeWrap, selected && styles.codeWrapSelected]}>
          <Text style={[styles.code, selected && styles.codeSelected]}>{item.code}</Text>
        </View>
        <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
          {item.name}
        </Text>
        {selected && (
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  }, [value, handleSelect, styles, colors.primary]);

  const getItemLayout = useCallback((data: ArrayLike<typeof CURRENCIES[0]> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: typeof CURRENCIES[0]) => item.code, []);

  const ItemSeparatorComponent = useCallback(() => <View style={styles.separator} />, [styles.separator]);

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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select currency</Text>
              <Text style={styles.subtitle}>{CURRENCIES.length} currencies available</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search currencies..."
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClearQuery} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={ItemSeparatorComponent}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No results for {query}</Text>
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
      flex: 1,
    },
    sheet: {
      height: '82%',
      borderTopLeftRadius: radius('2xl'),
      borderTopRightRadius: radius('2xl'),
      borderTopWidth: 1,
      borderColor: colors.text + '0C',
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    handle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: radius('full'),
      marginTop: spacing('2.5'),
      backgroundColor: colors.textMuted + '30',
    },
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('2.5'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
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
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('2.5'),
      height: 44,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      paddingHorizontal: spacing('3'),
      gap: spacing('2'),
    },
    searchIcon: {
      flexShrink: 0,
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
      paddingVertical: 0,
    },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
    },
    separator: {
      height: 1,
      backgroundColor: colors.text + '0C',
      marginLeft: 54,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      gap: spacing('3'),
    },
    rowSelected: {},
    codeWrap: {
      width: 42,
      height: 30,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.text + '0C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeWrapSelected: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary + '50',
    },
    code: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    codeSelected: {
      color: colors.primary,
    },
    name: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    nameSelected: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
    },
    emptyWrap: {
      paddingVertical: spacing('9'),
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
  });
