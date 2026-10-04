import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, EmptyState, IconButton, Screen, SearchField } from '@/src/components/ui';
import { RecentSearches } from '@/src/features/search/components/RecentSearches';
import { SearchResultGroups } from '@/src/features/search/components/SearchResultGroups';
import { SearchKind, useSearchResults } from '@/src/features/search/hooks/useSearchResults';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type KindFilter = 'all' | SearchKind;

export const SearchScreen = React.memo(function SearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const { sections, total, isEnabled, debouncedQuery, hasNoResults, recents, removeRecent, clearRecents } = useSearchResults(query);

  // A new query starts from "all" rather than a tab that may no longer have results.
  const changeQuery = useCallback((next: string) => {
    setQuery(next);
    setKindFilter('all');
  }, []);

  const visibleSections = kindFilter === 'all' ? sections : sections.filter((s) => s.kind === kindFilter);

  const openTransaction = useCallback((id: number) => router.push(`/transactions/${id}`), [router]);
  const openAccount = useCallback((id: number) => router.push(`/transactions?accountId=${id}`), [router]);
  const openCategory = useCallback((id: number) => router.push(`/transactions?categoryId=${id}`), [router]);
  const openPerson = useCallback((id: number) => router.push(`/(main)/persons/${id}`), [router]);

  const renderBody = () => {
    if (!isEnabled) {
      if (query.length === 0 && recents.length > 0) {
        return <RecentSearches recents={recents} onSelect={changeQuery} onRemove={removeRecent} onClearAll={clearRecents} />;
      }
      return <EmptyState icon="search" title={t('search.premium')} description={t('search.hint')} />;
    }
    if (hasNoResults) {
      return <EmptyState icon="inbox" title={t('search.noResults')} description={t('search.noMatch', { query: debouncedQuery })} />;
    }
    return (
      <SearchResultGroups
        sections={visibleSections}
        onOpenTransaction={openTransaction}
        onOpenAccount={openAccount}
        onOpenCategory={openCategory}
        onOpenPerson={openPerson}
      />
    );
  };

  return (
    <Screen variant="fixed" edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" variant="surface" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <SearchField value={query} onChangeText={changeQuery} placeholder={t('search.placeholder')} on="page" autoFocus style={styles.field} />
      </View>

      {/* Tabs only help when results span more than one kind. */}
      {isEnabled && sections.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabRow}>
          <Chip label={`${t('search.all')} ${total}`} isActive={kindFilter === 'all'} onPress={() => setKindFilter('all')} />
          {sections.map((section) => (
            <Chip
              key={section.kind}
              label={`${t(`search.${section.kind}`)} ${section.items.length}`}
              isActive={kindFilter === section.kind}
              onPress={() => setKindFilter(section.kind)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {renderBody()}
      </ScrollView>
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('4'),
    },
    field: { flex: 1 },
    tabs: { flexGrow: 0, marginBottom: spacing('3') },
    tabRow: { gap: spacing('2'), paddingHorizontal: layout.screenPadding },
    content: {
      flexGrow: 1,
      gap: spacing('5'),
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('9'),
    },
  });
