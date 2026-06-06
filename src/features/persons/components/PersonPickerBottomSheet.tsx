import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Person } from '../api/persons';

type PersonPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  persons: Person[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

const ITEM_HEIGHT = 60;

function PersonInitials({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
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
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
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
            <MaterialCommunityIcons name="check" size={12} color={colors.background} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedId, handleSelect, styles, colors, typography]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
              Link person
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
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
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* None option */}
          <TouchableOpacity
            style={[styles.row, styles.noneRow, selectedId === null && styles.rowSelected]}
            onPress={() => handleSelect(null)}
            activeOpacity={0.7}
          >
            <View style={styles.noneAvatar}>
              <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} />
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowName, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                No person
              </Text>
            </View>
            {selectedId === null && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="check" size={12} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>

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
          />
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, overlay, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: overlay.dim, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    sheet: {
      height: '75%',
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
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('3'),
    },
    title: { fontSize: 22 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('2'),
      height: 44,
      borderRadius: radius('xl'),
      backgroundColor: colors.background,
      paddingHorizontal: spacing('3'),
      gap: spacing('2'),
    },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('9'),
    },
    row: {
      height: ITEM_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('2'),
      borderRadius: radius('xl'),
    },
    noneRow: { marginHorizontal: layout.screenPadding, marginBottom: spacing('1') },
    rowSelected: { backgroundColor: colors.primary + '0F' },
    rowMeta: { flex: 1 },
    rowName: { fontSize: 14 },
    rowSub: { fontSize: 11, opacity: 0.65, marginTop: 2 },
    noneAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
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
