import { Delete01Icon, FolderOpenIcon, PencilEdit01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
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

export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const router = useRouter();

  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [activeType, setActiveType] = useState<'CR' | 'DR' | 'TR'>('DR');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filtered = useMemo(() => {
    return (
      categories
        ?.filter((c) => c.type === activeType)
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    );
  }, [categories, activeType]);

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
    ({ item }: ListRenderItemInfo<Category>) => (
      <CategoryCard
        item={item}
        index={0}
        onPress={handleEdit}
        onLongPress={handleLongPress}
      />
    ),
    [handleEdit, handleLongPress],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.typeTabs}>
          <BentoPressable
            style={[styles.typeTab, activeType === 'DR' && styles.typeTabActive]}
            onPress={() => setActiveType('DR')}
          >
            <Text style={[styles.typeTabText, activeType === 'DR' && styles.typeTabTextActive]}>
              Expense
            </Text>
          </BentoPressable>
          <BentoPressable
            style={[styles.typeTab, activeType === 'CR' && styles.typeTabActive]}
            onPress={() => setActiveType('CR')}
          >
            <Text style={[styles.typeTabText, activeType === 'CR' && styles.typeTabTextActive]}>
              Income
            </Text>
          </BentoPressable>
          <BentoPressable
            style={[styles.typeTab, activeType === 'TR' && styles.typeTabActive]}
            onPress={() => setActiveType('TR')}
          >
            <Text style={[styles.typeTabText, activeType === 'TR' && styles.typeTabTextActive]}>
              Transfer
            </Text>
          </BentoPressable>
        </View>
      </View>
    ),
    [activeType, styles],
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <HugeiconsIcon icon={FolderOpenIcon} size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No categories</Text>
        <Text style={styles.emptyText}>
          {`No ${activeType === 'DR' ? 'expense' : activeType === 'CR' ? 'income' : 'transfer'} categories yet.`}
        </Text>
        <BentoPressable style={styles.emptyBtn} onPress={handleCreate}>
          <HugeiconsIcon icon={PlusSignIcon} size={15} color={colors.primaryForeground} />
          <Text style={styles.emptyBtnText}>Create one</Text>
        </BentoPressable>
      </View>
    ),
    [activeType, colors, handleCreate, styles],
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
          numColumns={2}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          initialNumToRender={16}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={true}
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
        onConfirm={() => {
          if (!selectedCategory) return;
          deleteCategory(selectedCategory.id);
          setSelectedCategory(null);
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

    /* ── Grid ── */
    grid: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 90 : 100,
      gap: spacing('3'),
    },
    row: {
      gap: spacing('3'),
    },

    /* ── List header (tabs) ── */
    listHeader: {
      paddingBottom: spacing('3'),
    },
    typeTabs: {
      flexDirection: 'row',
      gap: spacing('2'),
      width: '100%',
    },
    typeTab: {
      flex: 1,
      height: 36,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeTabActive: {
      backgroundColor: colors.primary + '18',
    },
    typeTabText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    typeTabTextActive: {
      color: colors.primary,
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
      fontFamily: typography.fonts.semibold,
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
      backgroundColor: colors.text,
      marginTop: spacing('2'),
    },
    emptyBtnText: {
      fontFamily: typography.fonts.semibold,
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
