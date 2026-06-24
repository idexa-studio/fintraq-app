import {
  CancelCircleIcon,
  Delete01Icon,
  FolderOpenIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { PageBackground } from '../../../components/ui/PageBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { Category } from '../api/categories';
import { CategoryCard } from '../components/CategoryCard';
import { useCategories, useDeleteCategory } from '../hooks/categories';
import { WalkthroughOverlay, CATEGORIES_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { StorageKeys } from '../../../constants/keys';
import { usePremium } from '@/src/providers/PremiumProvider';

export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const router = useRouter();
  const { showAlert } = usePremium();

  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (
      categories
        ?.filter((c) => !q || c.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    );
  }, [categories, search]);

  const handleCreate = useCallback(() => {
    router.push('/(main)/categories/form');
  }, [router]);

  const handleEdit = useCallback(
    (category: Category) => {
      if (category.isSystem) {
        showAlert({
          title: 'System category',
          message: 'System-reserved categories cannot be modified.',
          type: 'warning',
        });
        return;
      }
      router.push(`/(main)/categories/form?id=${category.id}`);
    },
    [router, showAlert],
  );

  const handleLongPress = useCallback(
    (category: Category) => {
      if (category.isSystem) {
        showAlert({
          title: 'System category',
          message: 'System-reserved categories cannot be deleted or managed.',
          type: 'warning',
        });
        return;
      }
      setSelectedCategory(category);
      setShowManageDialog(true);
    },
    [showAlert],
  );

  const manageOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        key: 'edit-category',
        label: 'Edit category',
        icon: PencilEdit01Icon,
        onPress: () => {
          setShowManageDialog(false);
          handleEdit(selectedCategory);
        },
      },
      {
        key: 'delete-category',
        label: 'Delete category',
        icon: Delete01Icon,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedCategory, handleEdit]);

  const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Category>) => (
      <CategoryCard
        item={item}
        index={index}
        isFirst={index === 0}
        isLast={index === filtered.length - 1}
        onPress={handleEdit}
        onLongPress={handleLongPress}
      />
    ),
    [handleEdit, handleLongPress, filtered.length],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.searchBar}>
          <HugeiconsIcon icon={Search01Icon} size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search categories…"
            placeholderTextColor={colors.textMuted + '60'}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <HugeiconsIcon icon={CancelCircleIcon} size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    ),
    [search, colors, styles],
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <HugeiconsIcon icon={FolderOpenIcon} size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No categories</Text>
        <Text style={styles.emptyText}>
          {search.trim() ? `No results for "${search.trim()}"` : 'No categories yet.'}
        </Text>
        {!search.trim() && (
          <BentoPressable style={styles.emptyBtn} onPress={handleCreate}>
            <HugeiconsIcon icon={PlusSignIcon} size={15} color={colors.primaryForeground} />
            <Text style={styles.emptyBtnText}>Create one</Text>
          </BentoPressable>
        )}
      </View>
    ),
    [search, colors, handleCreate, styles],
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Categories" showBack />

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={16}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <BentoPressable style={styles.fab} onPress={handleCreate}>
        <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>

      <OptionsDialog
        visible={showManageDialog}
        onClose={() => setShowManageDialog(false)}
        title="Manage category"
        subtitle={selectedCategory?.name}
        options={manageOptions}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete category"
        message="This will delete the category and its associated transactions."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!selectedCategory) return;
          setShowDeleteDialog(false);
          try {
            await deleteCategory(selectedCategory.id);
            setSelectedCategory(null);
          } catch (e: any) {
            showAlert({
              title: 'Cannot delete category',
              message: e.message || 'Failed to delete category.',
              type: 'error',
            });
          }
        }}
      />
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_CATEGORIES} steps={CATEGORIES_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, shadow }: ThemeContextType, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    loader: {
      marginTop: 60,
    },

    /* ── List ── */
    list: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 90 : 100,
    },

    /* ── List header (search) ── */
    listHeader: {
      paddingBottom: spacing('3'),
      paddingTop: spacing('1'),
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2'),
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },

    /* ── Empty ── */
    empty: {
      paddingTop: 60,
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('1'),
    },
    emptyTitle: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 220,
      lineHeight: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 38,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      marginTop: spacing('2'),
    },
    emptyBtnText: {
      fontFamily: typography.styles.emptyAction.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.primaryForeground,
    },

    /* ── FAB ── */
    fab: {
      position: 'absolute',
      bottom: insets.bottom > 0 ? insets.bottom + 16 : 16,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('lg'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow('lg'),
    },
  });
