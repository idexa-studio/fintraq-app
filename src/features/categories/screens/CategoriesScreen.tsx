import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageBackground } from '../../../components/ui/PageBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { OptionsDialog } from '../../../components/ui/OptionsDialog';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { Category } from '../api/categories';
import { CategoryCard } from '../components/CategoryCard';
import { useCategories, useDeleteCategory } from '../hooks/categories';

export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        icon: 'pencil-outline' as const,
        onPress: () => {
          setShowManageDialog(false);
          handleEdit(selectedCategory);
        },
      },
      {
        key: 'delete-category',
        label: 'Delete category',
        icon: 'trash-can-outline' as const,
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
          <TouchableOpacity
            style={[styles.typeTab, activeType === 'DR' && styles.typeTabActive]}
            onPress={() => setActiveType('DR')}
            activeOpacity={0.8}
          >
            <Text style={[styles.typeTabText, activeType === 'DR' && styles.typeTabTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, activeType === 'CR' && styles.typeTabActive]}
            onPress={() => setActiveType('CR')}
            activeOpacity={0.8}
          >
            <Text style={[styles.typeTabText, activeType === 'CR' && styles.typeTabTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, activeType === 'TR' && styles.typeTabActive]}
            onPress={() => setActiveType('TR')}
            activeOpacity={0.8}
          >
            <Text style={[styles.typeTabText, activeType === 'TR' && styles.typeTabTextActive]}>
              Transfer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [activeType, styles],
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="folder-open-outline" size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No categories</Text>
        <Text style={styles.emptyText}>
          {`No ${activeType === 'DR' ? 'expense' : activeType === 'CR' ? 'income' : 'transfer'} categories yet.`}
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={handleCreate} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={15} color={colors.background} />
          <Text style={styles.emptyBtnText}>Create one</Text>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.9}>
        <MaterialCommunityIcons name="plus" size={22} color={colors.background} />
      </TouchableOpacity>

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
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
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
      paddingBottom: 110,
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
    },
    typeTab: {
      height: 34,
      paddingHorizontal: spacing('4'),
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeTabActive: {
      backgroundColor: colors.primary + '18',
    },
    typeTabText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
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
      fontSize: 17,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
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
      fontSize: 13,
      color: colors.background,
    },

    /* ── FAB ── */
    fab: {
      position: 'absolute',
      bottom: layout.screenPadding,
      right: layout.screenPadding,
      width: 55,
      height: 55,
      borderRadius: radius('lg'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
