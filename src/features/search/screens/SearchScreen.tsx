import { PageBackground } from '@/src/components/ui/PageBackground';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { Person } from '@/src/features/persons/api/persons';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import { ArrowLeft01Icon, ArrowRight01Icon, CancelCircleIcon, Clock01Icon, InboxIcon, Search01Icon, SparklesIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { WalkthroughOverlay, SEARCH_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { AnalyticsService } from '@/src/services/analytics';
import { StorageKeys } from '@/src/constants/keys';
import { BentoPressable } from '@/src/components/ui/BentoPressable';

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
      <IconAvatar icon={resolveAccountTypeIcon(account.accountType)} color={accentColor} variant="solid" size={36} iconSize={18} />
      <View style={styles.info}>
        <Text style={styles.name}>{account.name}</Text>
        <Text style={styles.meta}>
          {account.currency}{account.accountNumber && account.accountNumber !== 'N/A' ? ` · •••• ${account.accountNumber.slice(-4)}` : ''}
        </Text>
      </View>
      <MoneyText amount={account.balance} currency={account.currency} weight="bold" style={styles.balance} />
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
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
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    meta: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    balance: {
      fontSize: typography.sizes.md,
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
  const badgeColor = category.type === 'CR' ? colors.success : category.type === 'TR' ? colors.info : colors.danger;

  return (
    <BentoPressable style={styles.row} onPress={handlePress} scaleOnPress={false}>
      <IconAvatar icon={resolveIcon(category.icon, Tag01Icon)} color={catColor} variant="solid" size={36} iconSize={18} />
      <Text style={styles.name}>{category.name}</Text>
      <View style={[styles.badge, { backgroundColor: badgeColor + '1A' }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>
          {category.type === 'CR' ? 'Income' : category.type === 'TR' ? 'Transfer' : 'Expense'}
        </Text>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
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
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    badge: {
      paddingHorizontal: spacing('2'),
      height: 22,
      borderRadius: radius('sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xxs,
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
  const initials = useMemo(() =>
    person.name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join(''),
    [person.name],
  );
  const handlePress = useCallback(() => onPress(person.id), [onPress, person.id]);

  return (
    <BentoPressable style={styles.row} onPress={handlePress} scaleOnPress={false}>
      <View style={[styles.avatar, { backgroundColor: hex }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
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
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
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
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius('xl'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      color: '#FFFFFF',
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.sm,
    },
    info: { flex: 1, gap: spacing('0.5') },
    name: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    meta: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
  });


export const SearchScreen = React.memo(function SearchScreen() {
  const theme = useTheme();
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
        title: 'Transactions',
        count: data.transactions.length,
        data: data.transactions.map(item => ({ kind: 'transaction' as const, data: item })),
      });
    }
    if (data.accounts.length > 0) {
      result.push({
        title: 'Accounts',
        count: data.accounts.length,
        data: data.accounts.map(item => ({ kind: 'account' as const, data: item })),
      });
    }
    if (data.categories.length > 0) {
      result.push({
        title: 'Categories',
        count: data.categories.length,
        data: data.categories.map(item => ({ kind: 'category' as const, data: item })),
      });
    }
    if (data.persons.length > 0) {
      result.push({
        title: 'Persons',
        count: data.persons.length,
        data: data.persons.map(item => ({ kind: 'person' as const, data: item })),
      });
    }
    return result;
  }, [data]);

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
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <View style={styles.header}>
        <BentoPressable onPress={() => router.back()} style={styles.backButton}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.text} />
        </BentoPressable>

        <View style={styles.searchWrap}>
          <HugeiconsIcon icon={Search01Icon} size={16} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions, accounts..."
            placeholderTextColor={colors.textMuted + '80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isFetching && isEnabled ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : query.length > 0 ? (
            <BentoPressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <HugeiconsIcon icon={CancelCircleIcon} size={18} color={colors.textMuted} />
            </BentoPressable>
          ) : (
            <View style={styles.premiumHeaderBadge}>
              <HugeiconsIcon icon={SparklesIcon} size={12} color={colors.warning} />
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
            <Text style={styles.recentsTitle}>Recent searches</Text>
            <BentoPressable onPress={clearRecents}>
              <Text style={styles.recentsClear}>Clear history</Text>
            </BentoPressable>
          </View>
          <View style={styles.recentsList}>
            {recents.map((item) => (
              <BentoPressable
                key={item}
                style={styles.recentChip}
                onPress={() => setQuery(item)}
              >
                <HugeiconsIcon icon={Clock01Icon} size={14} color={colors.textMuted} />
                <Text style={styles.recentChipText}>{item}</Text>
                <BentoPressable
                  onPress={() => removeRecent(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <HugeiconsIcon icon={CancelCircleIcon} size={12} color={colors.textMuted} />
                </BentoPressable>
              </BentoPressable>
            ))}
          </View>
        </View>
      )}

      {!isEnabled ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <HugeiconsIcon icon={Search01Icon} size={32} color={colors.textMuted} />
          </View>
          <View style={styles.proTitleWrap}>
            <HugeiconsIcon icon={SparklesIcon} size={14} color={colors.warning} />
            <Text style={styles.proTitleText}>Premium search</Text>
          </View>
          <Text style={styles.promptSub}>
            Transactions, accounts, and categories. Type at least 2 characters to start.
          </Text>
        </View>
      ) : noResults ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <HugeiconsIcon icon={InboxIcon} size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.promptTitle}>No results</Text>
          <Text style={styles.promptSub}>
            Nothing matched “{debouncedQuery}”. Try a different term.
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
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_SEARCH} steps={SEARCH_WALKTHROUGH_STEPS} />
    </SafeAreaView>
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
      borderRadius: radius('lg'),
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
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
      padding: 0,
    },
    premiumHeaderBadge: {
      width: 24,
      height: 24,
      borderRadius: radius('full'),
      backgroundColor: colors.warning + '12',
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
      backgroundColor: colors.primary + '18',
    },
    filterTabText: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: typography.sizes.xxs,
    },
    filterTabTextActive: {
      color: colors.primary,
    },
    tabBadge: {
      height: 18,
      minWidth: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    tabBadgeActive: {
      backgroundColor: colors.primary + '15',
    },
    tabBadgeText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.xxs,
      color: colors.textMuted,
    },
    tabBadgeTextActive: {
      color: colors.primary,
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
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    recentsClear: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xxs,
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
      fontSize: typography.sizes.xs,
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
      borderRadius: radius('xl'),
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
      backgroundColor: colors.warning + '12',
    },
    proTitleText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xxs,
      color: colors.warning,
    },
    promptTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xl,
      color: colors.text,
    },
    promptSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
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
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    sectionCount: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
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
    rowName: { fontFamily: typography.fonts.semibold, fontSize: typography.sizes.sm, color: colors.text },
    rowMeta: { fontFamily: typography.fonts.regular, fontSize: typography.sizes.xs, color: colors.textMuted },

    typeBadge: {
      paddingHorizontal: spacing('2'),
      height: 22,
      borderRadius: radius('sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeBadgeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xxs,
    },

    sectionFooter: { height: spacing('4') },
  });
