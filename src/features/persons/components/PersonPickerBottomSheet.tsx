import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { CancelCircleIcon, CheckmarkCircle01Icon, Search01Icon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Person } from '../api/persons';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';

type PersonPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  persons: Person[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

const ITEM_HEIGHT = 60;

function PersonInitials({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const { typography } = useTheme();
  const initials = useMemo(() => name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join(''), [name]);
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.25), backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: typography.fonts.bold, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export const PersonPickerBottomSheet = React.memo(function PersonPickerBottomSheet({
  visible,
  onClose,
  persons,
  selectedId,
  onSelect,
}: PersonPickerBottomSheetProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const bottomSheet = useBottomSheet();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.company?.toLowerCase().includes(q),
    );
  }, [persons, query]);

  const handleSelect = useCallback((id: number | null) => {
    Haptics.selectionAsync().catch(() => {});
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const keyExtractor = useCallback((item: Person) => String(item.id), []);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index,
  }), []);

  const renderItem = useCallback(({ item }: { item: Person }) => {
    const selected = item.id === selectedId;
    const hex = colorNumberToHex(item.color);
    return (
      <BentoPressable
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => handleSelect(item.id)}
      >
        <PersonInitials name={item.name} color={hex} size={36} />
        <View style={styles.rowMeta}>
          <Text style={[styles.rowName, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {(item.designation || item.company) ? (
            <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
              {[item.designation, item.company].filter(Boolean).join(' · ')}
            </Text>
          ) : item.phone ? (
            <Text style={[styles.rowSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
              {item.phone}
            </Text>
          ) : null}
        </View>
        {selected && (
          <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color={colors.primaryForeground} />
          </View>
        )}
      </BentoPressable>
    );
  }, [selectedId, handleSelect, styles, colors, typography]);

  const snapPoints = useMemo(() => ['75%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
            Link person
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <HugeiconsIcon icon={Search01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { fontFamily: typography.fonts.regular, color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search persons..."
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

        {/* None option */}
        <BentoPressable
          style={[styles.row, styles.noneRow, selectedId === null && styles.rowSelected]}
          onPress={() => handleSelect(null)}
        >
          <View style={styles.noneAvatar}>
            <HugeiconsIcon icon={UserCircleIcon} size={18} color={colors.textMuted} />
          </View>
          <View style={styles.rowMeta}>
            <Text style={[styles.rowName, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              No person
            </Text>
          </View>
          {selectedId === null && (
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color={colors.primaryForeground} />
            </View>
          )}
        </BentoPressable>

        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        />
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, isDark }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    title: { fontSize: 22 },
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
    searchInput: { flex: 1, fontFamily: typography.fonts.regular, fontSize: typography.sizes.sm, paddingVertical: 0 },
    listContent: {
      paddingBottom: spacing('3'),
    },
    row: {
      height: ITEM_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: layout.screenPadding,
      marginVertical: spacing('0.5'),
    },
    noneRow: {
      marginTop: spacing('2'),
      marginBottom: spacing('1'),
    },
    rowSelected: { backgroundColor: isDark ? '#163228' : '#E6F4EA' },
    rowMeta: { flex: 1 },
    rowName: { fontSize: 14 },
    rowSub: { fontSize: 11, opacity: 0.65, marginTop: 2 },
    noneAvatar: {
      width: 36,
      height: 36,
      borderRadius: Math.round(36 * 0.25),
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
