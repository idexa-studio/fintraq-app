import { ConfirmDialog, EmptyState, Fab, ListGroup, OptionsDialog, Screen, SearchField, SegmentedControl, SkeletonRow } from '@/src/components/ui';
import { FolderOpenIcon, MagnifyingGlassIcon, PencilSimpleIcon, TrashIcon } from '@/src/components/ui/icons';
import { Category } from '@/src/features/categories/api/categories';
import { CategoryCard } from '@/src/features/categories/components/CategoryCard';
import { useCategories, useDeleteCategory } from '@/src/features/categories/hooks/categories';
import { FeatureTip } from '@/src/features/walkthrough';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { toErrorMessage } from '@/src/utils/errors';

type TypeFilter = 'DR' | 'CR' | 'TR';

export const CategoriesScreen = React.memo(function CategoriesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { showAlert } = usePremium();

  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: deleteCategory } = useDeleteCategory();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('DR');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const counts = useMemo(() => {
    const out = { DR: 0, CR: 0, TR: 0 };
    categories?.forEach((c) => c.type.split(',').forEach((ty) => { if (ty in out) out[ty as TypeFilter] += 1; }));
    return out;
  }, [categories]);

  // Searching looks across all types; otherwise show the selected tab.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (
      categories
        ?.filter((c) => (q ? c.name.toLowerCase().includes(q) : c.type.split(',').includes(typeFilter)))
        .sort((a, b) => Number(a.isSystem) - Number(b.isSystem) || a.name.localeCompare(b.name)) ?? []
    );
  }, [categories, search, typeFilter]);

  const handleCreate = useCallback(() => {
    router.push('/(main)/categories/form');
  }, [router]);

  const handleEdit = useCallback(
    (category: Category) => {
      if (category.isSystem) {
        showAlert({
          title: t('categories.systemCategory'),
          message: t('categories.systemEdit'),
          type: 'warning',
        });
        return;
      }
      router.push(`/(main)/categories/form?id=${category.id}`);
    },
    [router, showAlert, t],
  );

  const handleLongPress = useCallback(
    (category: Category) => {
      if (category.isSystem) {
        showAlert({
          title: t('categories.systemCategory'),
          message: t('categories.systemManage'),
          type: 'warning',
        });
        return;
      }
      setSelectedCategory(category);
      setShowManageDialog(true);
    },
    [showAlert, t],
  );

  const manageOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        key: 'edit-category',
        label: t('categories.edit'),
        icon: PencilSimpleIcon,
        onPress: () => {
          setShowManageDialog(false);
          handleEdit(selectedCategory);
        },
      },
      {
        key: 'delete-category',
        label: t('categories.delete'),
        icon: TrashIcon,
        destructive: true,
        onPress: () => setShowDeleteDialog(true),
      },
    ];
  }, [selectedCategory, handleEdit, t]);

  const typeOptions = [
    { value: 'DR' as const, label: `${t('categoryForm.expense')} ${counts.DR}` },
    { value: 'CR' as const, label: `${t('categoryForm.income')} ${counts.CR}` },
    { value: 'TR' as const, label: `${t('categoryForm.transfer')} ${counts.TR}` },
  ];

  return (
    <Screen
      header={{ title: t('categories.title'), showBack: true }}
      hasFab
      overlays={
        <>
          <Fab onPress={handleCreate} accessibilityLabel={t('categoryForm.new')} />
          <OptionsDialog
            visible={showManageDialog}
            onClose={() => setShowManageDialog(false)}
            title={t('categories.manage')}
            subtitle={selectedCategory?.name}
            options={manageOptions}
          />
          <ConfirmDialog
            destructive
            visible={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            title={t('categories.delete')}
            message={t('categories.deleteMessage')}
            confirmLabel={t('categories.delete')}
            onConfirm={async () => {
              if (!selectedCategory) return;
              setShowDeleteDialog(false);
              try {
                await deleteCategory(selectedCategory.id);
                setSelectedCategory(null);
              } catch (e) {
                showAlert({
                  title: t('categories.cannotDelete'),
                  message: toErrorMessage(e, t('categories.deleteFailed')),
                  type: 'error',
                });
              }
            }}
          />
          <FeatureTip tip="categoryOptions" />
        </>
      }
    >
      <View style={styles.controls}>
        <SearchField value={search} onChangeText={setSearch} placeholder={t('categories.search')} on="page" />
        {!search.trim() ? (
          <SegmentedControl<TypeFilter> value={typeFilter} onChange={setTypeFilter} options={typeOptions} size="sm" />
        ) : null}
      </View>

      {isLoading ? (
        <ListGroup>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ListGroup>
      ) : filtered.length === 0 ? (
        search.trim() ? (
          <EmptyState icon={MagnifyingGlassIcon} title={t('categories.noResults', { query: search.trim() })} color={colors.textMuted} />
        ) : (
          <EmptyState
            icon={FolderOpenIcon}
            title={t('categories.none')}
            description={t('categories.noneYet')}
            actionLabel={t('categories.create')}
            onAction={handleCreate}
          />
        )
      ) : (
        <ListGroup>
          {filtered.map((item) => (
            <CategoryCard key={item.id} item={item} onPress={handleEdit} onLongPress={handleLongPress} />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    controls: { gap: spacing('3') },
  });
