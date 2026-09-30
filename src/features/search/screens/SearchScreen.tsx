import { CaretLeftIcon, XIcon } from '@/src/components/ui/icons';
import { IconButton } from '@/src/components/ui/IconButton';
import { Screen } from '@/src/components/ui/Screen';
import { Spinner } from '@/src/components/ui';
import { Icon } from '@/src/components/ui/Icon';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { PersonAvatar } from '@/src/components/ui/PersonAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { Person } from '@/src/features/persons/api/persons';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import { ArrowRight01Icon, CancelCircleIcon, Clock01Icon, InboxIcon, Search01Icon, SparklesIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { SectionList, SectionListData, SectionListRenderItemInfo, StyleSheet, TextInput, View, ScrollView } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { useGlobalSearch } from '@/src/features/search/hooks/useGlobalSearch';
import { useRecentSearches } from '@/src/features/search/hooks/useRecentSearches';
import { AnalyticsService } from '@/src/services/analytics';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

type SearchItem =
  | { kind: 'transaction'; data: TransactionListItem }
  | { kind: 'account'; data: Account }
  | { kind: 'category'; data: Category }
  | { kind: 'person'; data: Person };

type SearchSection = {
  title: string;
  count: number;
  data: SearchItem[];
};

const AccountRow = React.memo(function AccountRow({
  account,
  onPress,
  isFirst,
  isLast,
}: {
  account: Account;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createAccountRowStyles(theme, isFirst, isLast), [theme, isFirst, isLast]);
  const accentColor = useMemo(() => colorNumberToHex(account.color), [account.color]);
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);

  return (
    <BentoPressable style={styles.row} onPress={handlePress} scaleOnPress={false}>
      <IconAvatar icon={resolveAccountTypeIcon(account.accountType)} color={accentColor} variant="subtle" size={36} iconSize={18} />
      <View style={styles.info}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.meta}>
          {account.currency}{account.accountNumber && account.accountNumber !== 'N/A' ? ` · •••• ${account.accountNumber.slice(-4)}` : ''}
        </Text>
      </View>
      <MoneyText amount={account.balance} currency={account.currency} weight="bold" style={styles.balance} />
      <Icon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
    </BentoPressable>
  );
});

const createAccountRowStyles = (
  { colors, typography, spacing, radius }: ThemeContextType,
  isFirst: boolean,
  isLast: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('3.5'),
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : spacing('0.5'),
    },
    info: { flex: 1, gap: spacing('0.5') },
    name: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.sm,
      color: colors.text,
    },
    meta: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    balance: {
      ...typography.metrics.md,
    },
  });

const CategoryRow = React.memo(function CategoryRow({
  category,
  onPress,
  isFirst,
  isLast,
}: {
  category: Category;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createCategoryRowStyles(theme, isFirst, isLast), [theme, isFirst, isLast]);
  const catColor = useMemo(() => colorNumberToHex(category.color), [category.color]);
  const handlePress = useCallback(() => onPress(category.id), [onPress, category.id]);
  const badgeColor = category.type === 'CR' ? colors.success : category.type === 'TR' ? colors.info : category.type === 'DR' ? colors.danger : colors.textMuted;

  return (
    <BentoPressable style={styles.row} onPress={handlePress} scaleOnPress={false}>
      <IconAvatar icon={resolveIcon(category.icon, Tag01Icon)} color={catColor} variant="subtle" size={36} iconSize={18} />
      <Text style={styles.name}>{category.name}</Text>
      <View style={[styles.badge, { backgroundColor: alpha(badgeColor, 'subtle') }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>
          {category.type === 'CR' ? 'Income' : category.type === 'TR' ? 'Transfer' : category.type === 'DR' ? 'Expense' : 'All'}
        </Text>
      </View>
      <Icon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
    </BentoPressable>
  );
});

const createCategoryRowStyles = (
  { colors, typography, spacing, radius }: ThemeContextType,
  isFirst: boolean,
  isLast: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('3.5'),
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : spacing('0.5'),
    },
    name: {
      flex: 1,
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.sm,
      color: colors.text,
    },
    badge: {
      paddingHorizontal: spacing('2'),
      height: 22,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xxs,
    },
  });

const PersonRow = React.memo(function PersonRow({
  person,
  onPress,
  isFirst,
  isLast,
}: {
  person: Person;
  onPress: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createPersonRowStyles(theme, isFirst, isLast), [theme, isFirst, isLast]);
  const hex = useMemo(() => colorNumberToHex(person.color), [person.color]);
  const handlePress = useCallback(() => onPress(person.id), [onPress, person.id]);

  return (
    <BentoPressable style={styles.row} onPress={handlePress} scaleOnPress={false}>
      <PersonAvatar name={person.name} color={hex} size={36} />
      <View style={styles.info}>
        <Text style={styles.name}>{person.name}</Text>
        {(person.designation || person.company) ? (
          <Text style={styles.meta}>
            {[person.designation, person.company].filter(Boolean).join(' · ')}
          </Text>
        ) : person.email ? (
          <Text style={styles.meta}>{person.email}</Text>
        ) : null}
      </View>
      <Icon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
    </BentoPressable>
  );
});

const createPersonRowStyles = (
  { colors, typography, spacing, radius }: ThemeContextType,
  isFirst: boolean,
  isLast: boolean,
) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('3.5'),
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : spacing('0.5'),
    },
    info: { flex: 1, gap: spacing('0.5') },
    name: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.sm,
      color: colors.text,
    },
    meta: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
  });


export const SearchScreen = React.memo(function SearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data, isFetching, isEnabled, debouncedQuery } = useGlobalSearch(query);
  const { recents, addRecent, removeRecent, clearRecents } = useRecentSearches();

  // Selected quick filter tab: 'all' | 'transactions' | 'accounts' | 'categories' | 'persons'
  const [activeFilter, setActiveFilter] = useState<'all' | 'transactions' | 'accounts' | 'categories' | 'persons'>('all');
  const lastTrackedSearchRef = useRef<string>('');

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Reset active filter when search query is cleared
  useEffect(() => {
    if (query === '') {
      setActiveFilter('all');
    }
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveFilter('all');
  }, []);

  const handleTransactionPress = useCallback((tx: { id: number }) => {
    router.push(`/transactions/edit/${tx.id}`);
  }, [router]);

  const handleAccountPress = useCallback((id: number) => {
    router.push(`/transactions?accountId=${id}`);
  }, [router]);

  const handleCategoryPress = useCallback((id: number) => {
    router.push(`/transactions?categoryId=${id}`);
  }, [router]);

  const handlePersonPress = useCallback((id: number) => {
    router.push(`/(main)/persons/${id}`);
  }, [router]);

  const sections = useMemo((): SearchSection[] => {
    if (!data) return [];
    const result: SearchSection[] = [];
    if (data.transactions.length > 0) {
      result.push({
        title: t('search.transactions'),
        count: data.transactions.length,
        data: data.transactions.map(item => ({ kind: 'transaction' as const, data: item })),
      });
    }
    if (data.accounts.length > 0) {
      result.push({
        title: t('search.accounts'),
        count: data.accounts.length,
        data: data.accounts.map(item => ({ kind: 'account' as const, data: item })),
      });
    }
    if (data.categories.length > 0) {
      result.push({
        title: t('search.categories'),
        count: data.categories.length,
        data: data.categories.map(item => ({ kind: 'category' as const, data: item })),
      });
    }
    if (data.persons.length > 0) {
      result.push({
        title: t('search.persons'),
        count: data.persons.length,
        data: data.persons.map(item => ({ kind: 'person' as const, data: item })),
      });
    }
    return result;
  }, [data, t]);

  const hasResults = sections.length > 0;
  const noResults = isEnabled && !isFetching && debouncedQuery.length >= 2 && !hasResults;

  // Add successfully resolved queries to AsyncStorage searches list
  useEffect(() => {
    if (debouncedQuery.length >= 2 && hasResults) {
      addRecent(debouncedQuery);
    }
  }, [debouncedQuery, hasResults, addRecent]);

  useEffect(() => {
    if (!isEnabled || isFetching || debouncedQuery.length < 2) return;

    const signature = `${debouncedQuery}|${sections.length}|${sections[0]?.title ?? 'none'}`;
    if (lastTrackedSearchRef.current === signature) return;
    lastTrackedSearchRef.current = signature;

    const resultCount = sections.reduce((sum, section) => sum + section.count, 0);
    const topSection = sections[0]?.title.toLowerCase() as 'transactions' | 'accounts' | 'categories' | 'persons' | undefined;

    AnalyticsService.searchPerformed(
      debouncedQuery.length,
      resultCount,
      topSection ?? 'none'
    ).catch(() => {});
  }, [debouncedQuery, isEnabled, isFetching, sections]);

  // Client-side quick filter tabs implementation
  const filteredSections = useMemo((): SearchSection[] => {
    if (activeFilter === 'all') return sections;
    return sections.filter(s => s.title.toLowerCase() === activeFilter);
  }, [sections, activeFilter]);

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<SearchItem, SearchSection>) => {
      const isFirst = index === 0;
      const isLast = index === section.data.length - 1;

      if (item.kind === 'transaction') {
        return (
          <TransactionRow tx={item.data} isFirst={isFirst} isLast={isLast} showDate onPress={handleTransactionPress} />
        );
      }

      if (item.kind === 'account') {
        return <AccountRow account={item.data} onPress={handleAccountPress} isFirst={isFirst} isLast={isLast} />;
      }
      if (item.kind === 'category') {
        return <CategoryRow category={item.data} onPress={handleCategoryPress} isFirst={isFirst} isLast={isLast} />;
      }
      return <PersonRow person={item.data} onPress={handlePersonPress} isFirst={isFirst} isLast={isLast} />;
    },
    [handleTransactionPress, handleAccountPress, handleCategoryPress, handlePersonPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<SearchItem, SearchSection> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.count}</Text>
      </View>
    ),
    [styles],
  );

  const renderSectionFooter = useCallback(
    () => <View style={styles.sectionFooter} />,
    [styles],
  );

  const keyExtractor = useCallback((item: SearchItem) => {
    if (item.kind === 'transaction') return `tx-${item.data.id}`;
    if (item.kind === 'account') return `acc-${item.data.id}`;
    if (item.kind === 'category') return `cat-${item.data.id}`;
    return `per-${item.data.id}`;
  }, []);

  return (
    <Screen variant="fixed" edges={['top', 'right', 'bottom', 'left']}>

      <View style={styles.header}>
        <IconButton icon={CaretLeftIcon} variant="surface" onPress={() => router.back()} accessibilityLabel={t('common.back')} />

        <View style={styles.searchWrap}>
          <Icon icon={Search01Icon} size={16} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted + '80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isFetching && isEnabled ? (
            <Spinner size="sm" />
          ) : query.length > 0 ? (
            <IconButton icon={XIcon} size="sm" variant="ghost" onPress={handleClear} accessibilityLabel={t('common.clear')} />
          ) : (
            <View style={styles.premiumHeaderBadge}>
              <Icon icon={SparklesIcon} size={12} color={colors.warning} />
            </View>
          )}
        </View>
      </View>

      {/* Quick filters row when search results exist */}
      {hasResults && query.length >= 2 && (
        <View style={styles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(['all', 'transactions', 'accounts', 'categories', 'persons'] as const).map((tab) => {
              const count = tab === 'all'
                ? sections.reduce((sum, s) => sum + s.count, 0)
                : sections.find(s => s.title.toLowerCase() === tab)?.count ?? 0;

              const isActive = activeFilter === tab;

              return (
                <BentoPressable
                  key={tab}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setActiveFilter(tab)}
                >
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                  <View style={[styles.tabBadge, isActive ? styles.tabBadgeActive : { backgroundColor: colors.background }]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </BentoPressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search history searches / recents list when query is empty */}
      {query.length === 0 && recents.length > 0 && (
        <View style={styles.recentsWrap}>
          <View style={styles.recentsHeader}>
            <Text style={styles.recentsTitle}>{t('search.recent')}</Text>
            <BentoPressable onPress={clearRecents}>
              <Text style={styles.recentsClear}>{t('search.clearHistory')}</Text>
            </BentoPressable>
          </View>
          <View style={styles.recentsList}>
            {recents.map((item) => (
              <BentoPressable
                key={item}
                style={styles.recentChip}
                onPress={() => setQuery(item)}
              >
                <Icon icon={Clock01Icon} size={14} color={colors.textMuted} />
                <Text style={styles.recentChipText}>{item}</Text>
                <BentoPressable
                  onPress={() => removeRecent(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon icon={CancelCircleIcon} size={12} color={colors.textMuted} />
                </BentoPressable>
              </BentoPressable>
            ))}
          </View>
        </View>
      )}

      {!isEnabled ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <Icon icon={Search01Icon} size={32} color={colors.textMuted} />
          </View>
          <View style={styles.proTitleWrap}>
            <Icon icon={SparklesIcon} size={14} color={colors.warning} />
            <Text style={styles.proTitleText}>{t('search.premium')}</Text>
          </View>
          <Text style={styles.promptSub}>
            {t('search.hint')}
          </Text>
        </View>
      ) : noResults ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <Icon icon={InboxIcon} size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.promptTitle}>{t('search.noResults')}</Text>
          <Text style={styles.promptSub}>
            {t('search.noMatch', { query: debouncedQuery })}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      )}
    </Screen>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('4'),
      gap: spacing('3'),
    },
    backButton: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginLeft: -spacing('1'),
    },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      ...typography.metrics.md,
      color: colors.text,
      padding: 0,
    },
    premiumHeaderBadge: {
      width: 24,
      height: 24,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.warning, 'subtle'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterWrap: {
      marginBottom: spacing('2'),
    },

    /* ── Quick Results Filter Tabs ── */
    filterRow: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('2'),
      paddingBottom: spacing('2'),
    },
    filterTab: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      paddingLeft: spacing('3.5'),
      paddingRight: spacing('2'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      gap: spacing('1.5'),
    },
    filterTabActive: {
      backgroundColor: alpha(colors.primary, 'subtle'),
    },
    filterTabText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      color: colors.textMuted,
      ...typography.metrics.xxs,
    },
    filterTabTextActive: {
      color: colors.primaryInk,
    },
    tabBadge: {
      height: 18,
      minWidth: 18,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    tabBadgeActive: {
      backgroundColor: alpha(colors.primary, 'subtle'),
    },
    tabBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xxs,
      color: colors.textMuted,
    },
    tabBadgeTextActive: {
      color: colors.primaryInk,
    },

    /* ── Search History / Recents ── */
    recentsWrap: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('4'),
      gap: spacing('3'),
    },
    recentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing('1'),
    },
    recentsTitle: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    recentsClear: {
      fontFamily: typography.styles.dialogAction.fontFamily,
      ...typography.metrics.xxs,
      color: colors.danger,
    },
    recentsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2'),
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius('full'),
      height: 32,
      paddingHorizontal: spacing('3'),
      gap: spacing('1.5'),
    },
    recentChipText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.text,
    },

    prompt: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
      gap: spacing('3'),
    },
    promptIcon: {
      width: 64,
      height: 64,
      borderRadius: radius('md'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('1'),
    },
    proTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      paddingHorizontal: spacing('3'),
      height: 24,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.warning, 'subtle'),
    },
    proTitleText: {
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xxs,
      color: colors.warning,
    },
    promptTitle: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xl,
      color: colors.text,
    },
    promptSub: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: '80%',
    },

    listContent: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('9'),
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: spacing('1'),
      paddingTop: spacing('3'),
      marginBottom: spacing('2.5'),
    },
    sectionTitle: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    sectionCount: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted + 'AA',
    },

    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('3'),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('3.5'),
      gap: spacing('3'),
    },
    rowInfo: { flex: 1, gap: spacing('0.5') },
    rowName: { fontFamily: typography.styles.rowLabel.fontFamily, ...typography.metrics.sm, color: colors.text },
    rowMeta: { fontFamily: typography.fonts.regular, ...typography.metrics.xs, color: colors.textMuted },

    typeBadge: {
      paddingHorizontal: spacing('2'),
      height: 22,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xxs,
    },

    sectionFooter: { height: spacing('4') },
  });
