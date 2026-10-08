import { Button, Card, EmptyState, Header, IconCircle, ListGroup, ListRow, MarkGrid, Screen, Section, Skeleton, TabStrip, resolveIcon, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { CATEGORY_KINDS, categoriesOfKind } from '@/features/categories/category-form';
import { useCategories } from '@/features/categories/hooks/categories';
import { colorNumberToHex } from '@/shared/format/color';
import type { TransactionType } from '@/shared/types';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** How many categories it takes before the grid offers a search. */
const SEARCH_FROM = 12;

/**
 * Categories, a kind at a time, as the marks they are drawn with elsewhere.
 * Tapping one opens it for changing. The ones the app relies on are listed
 * apart and say why they stay as they are.
 */
export function CategoriesScreen() {
  const { t } = useTranslation('categories');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { data: categories, isPending } = useCategories();
  const [kind, setKind] = useState<TransactionType>('DR');

  const { own, builtIn } = useMemo(() => categoriesOfKind(categories ?? [], kind), [categories, kind]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const add = () => router.push({ pathname: '/categories/new', params: { kind } });
  const header = (
    <View>
      <Header title={t('title')} onBack={back} backLabel={t('back')} />
      <TabStrip tabs={CATEGORY_KINDS.map((option) => ({ key: option, label: t(`kinds.${option}`) }))} value={kind} onChange={setKind} accessibilityLabel={t('kindLabel')} />
    </View>
  );

  if (isPending || !categories) {
    return (
      <Screen header={header}>
        <Skeleton height={size.row * 5} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={<Button label={t('add')} onPress={add} />}>
      {own.length === 0 ? (
        <EmptyState compact icon="tag" color="orange" title={t(`empty.${kind}.title`)} body={t(`empty.${kind}.body`)} actionLabel={t('add')} onAction={add} />
      ) : (
        <Card style={styles.grid}>
          <MarkGrid
            // Each kind is its own grid, so a search does not carry over from one to the next.
            key={kind}
            marks={own.map((category) => ({ key: String(category.id), label: category.name, icon: resolveIcon(category.icon, 'tag'), color: colorNumberToHex(category.color) }))}
            onSelect={(id) => router.push({ pathname: '/categories/[id]/edit', params: { id } })}
            searchPlaceholder={own.length > SEARCH_FROM ? t('search') : undefined}
            noMatch={(query) => t('noMatch', { query })}
          />
        </Card>
      )}

      {builtIn.length > 0 ? (
        <Section title={t('builtIn.title')}>
          <ListGroup>
            {builtIn.map((category) => (
              <ListRow key={category.id} leading={<IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} />} title={category.name} subtitle={t('builtIn.hint')} disabled />
            ))}
          </ListGroup>
        </Section>
      ) : null}
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    grid: { padding: space.sm, paddingTop: space.md },
  });
