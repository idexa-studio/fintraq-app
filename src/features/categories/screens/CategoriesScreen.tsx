import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { Category } from '../api/categories';
import { CategoryCard } from '../components/CategoryCard';
import { CategoryTypeSelector } from '../components/CategoryTypeSelector';
import { useCategories, useDeleteCategory } from '../hooks/categories';

type CategorySection = { title: string; data: Category[] };

const buildSections = (items: Category[]): CategorySection[] => {
  const map = new Map<string, Category[]>();
  for (const item of items) {
    const letter = item.name[0]?.toUpperCase() ?? '#';
    const bucket = map.get(letter) ?? [];
    bucket.push(item);
    map.set(letter, bucket);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
};

export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [activeType, setActiveType] = useState<'CR' | 'DR'>('DR');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      categories
        ?.filter((c) => c.type === activeType)
        .filter((c) => (q ? c.name.toLowerCase().includes(q) : true))
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    );
  }, [categories, activeType, query]);

  const sections = useMemo(() => buildSections(filtered), [filtered]);

  const totalForType = useMemo(
    () => categories?.filter((c) => c.type === activeType).length ?? 0,
    [categories, activeType],
  );

  const handleCreate = useCallback(() => {
    router.push('/(main)/categories/form');
  }, [router]);

  const handleEdit = useCallback(
    (category: Category) => {
      router.push(`/(main)/categories/form?id=${category.id}`);
    },
    [router],
  );

  const handleLongPress = useCallback((category: Category) => {
    setSelectedCategory(category);
    setShowManageDialog(true);
  }, []);

  const clearQuery = useCallback(() => setQuery(''), []);

  const manageOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        key: 'edit-category',
        label: 'Edit category',
        icon: 'create-outline' as const,
        onPress: () => {
          setShowManageDialog(false);
          handleEdit(selectedCategory);
        },
      },
      {
        key: 'delete-category',
        label: 'Delete category',
        icon: 'trash-outline' as const,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedCategory, handleEdit]);

  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<Category, CategorySection>) => (
      <CategoryCard
        item={item}
        index={0}
        onPress={handleEdit}
        onLongPress={handleLongPress}
      />
    ),
    [handleEdit, handleLongPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Category, CategorySection> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLetter}>{section.title}</Text>
      </View>
    ),
    [styles],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.countLine}>
          <Text style={styles.countNum}>{filtered.length}</Text>
          <Text style={styles.countOf}> / {totalForType}</Text>
        </Text>
        <Text style={styles.countLabel}>
          {activeType === 'DR' ? 'Expense' : 'Income'} categories
        </Text>
      </View>
    ),
    [filtered.length, totalForType, activeType, styles],
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.empty}>
        <Ionicons name="file-tray-outline" size={28} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Nothing here</Text>
        <Text style={styles.emptyText}>
          No {activeType === 'DR' ? 'expense' : 'income'} categories match your filter.
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.85}>
          <Ionicons name="add" size={14} color={colors.background} />
          <Text style={styles.emptyBtnText}>Create category</Text>
        </TouchableOpacity>
      </View>
    ),
    [activeType, colors, handleCreate, styles],
  );

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Categories" showBack />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.toolbar}>
            <CategoryTypeSelector activeType={activeType} onTypeChange={setActiveType} />

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={15} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                placeholderTextColor={colors.textMuted + '80'}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearQuery} activeOpacity={0.8} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.9}>
        <Ionicons name="add" size={24} color={colors.background} />
      </TouchableOpacity>

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage Category"
        subtitle={selectedCategory?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Category"
        message="This will delete the category and associated transactions."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!selectedCategory) return;
          deleteCategory(selectedCategory.id);
          setSelectedCategory(null);
        }}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    loader: {
      marginTop: 60,
    },

    /* ── Toolbar ── */
    toolbar: {
      paddingHorizontal: spacing('6'),
      paddingBottom: spacing('3'),
      gap: spacing('2.5'),
    },
    searchBar: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: colors.surface,
      borderRadius: radius('md'),
      paddingHorizontal: spacing('3'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.text,
      height: '100%',
    },

    /* ── List ── */
    listContent: {
      paddingHorizontal: spacing('6'),
      paddingBottom: 110,
    },
    listHeader: {
      paddingTop: spacing('2'),
      paddingBottom: spacing('4'),
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing('1.5'),
    },
    countNum: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      color: colors.text,
      letterSpacing: -1,
    },
    countOf: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
    countLine: {
      lineHeight: 28,
    },
    countLabel: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },

    /* ── Section header ── */
    sectionHeader: {
      paddingVertical: spacing('1.5'),
      marginBottom: spacing('1'),
    },
    sectionLetter: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.2,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },

    /* ── Empty ── */
    empty: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 18,
      color: colors.text,
      letterSpacing: -0.4,
      marginTop: spacing('1'),
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 240,
      lineHeight: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 38,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('md'),
      backgroundColor: colors.primary,
      marginTop: spacing('1'),
    },
    emptyBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.background,
    },

    /* ── FAB ── */
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: radius('xl'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  });
