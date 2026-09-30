import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { LIST_ITEM_LEADING_SIZE, ListItem, PersonAvatar, SearchField, SheetHeader } from '@/src/components/ui';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { UserCircleIcon } from '@/src/components/ui/icons';
import type { Person } from '@/src/features/persons/api/persons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';

type PersonPickerBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  persons: Person[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export const PersonPickerBottomSheet = React.memo(function PersonPickerBottomSheet({
  visible,
  onClose,
  persons,
  selectedId,
  onSelect,
}: PersonPickerBottomSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
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

  const renderItem = useCallback(
    ({ item }: { item: Person }) => (
      <ListItem
        leading={<PersonAvatar name={item.name} color={colorNumberToHex(item.color)} size={LIST_ITEM_LEADING_SIZE} />}
        title={item.name}
        subtitle={[item.designation, item.company].filter(Boolean).join(' · ') || item.phone || undefined}
        selected={item.id === selectedId}
        onPress={() => handleSelect(item.id)}
      />
    ),
    [selectedId, handleSelect],
  );

  const snapPoints = useMemo(() => ['75%'], []);

  return (
    <BentoBottomSheet visible={visible} onClose={handleClose} snapPoints={snapPoints} keyboardBehavior="interactive">
      <View style={styles.fill}>
        <SheetHeader title={t('persons.linkPerson')} />
        <View style={styles.search}>
          <SearchField value={query} onChangeText={setQuery} placeholder={t('persons.searchPlaceholder')} on="surface" />
        </View>
        <ListItem
          icon={UserCircleIcon}
          iconColor={colors.textMuted}
          title={t('persons.noPerson')}
          selected={selectedId === null}
          onPress={() => handleSelect(null)}
        />
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
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

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    fill: { flex: 1 },
    search: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing('2') },
    listContent: { paddingBottom: spacing('3') },
  });
