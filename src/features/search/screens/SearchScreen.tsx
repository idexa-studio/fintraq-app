import { PageBackground } from '@/src/components/ui/PageBackground';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useGlobalSearch } from '../hooks/useGlobalSearch';

type SearchItem =
  | { kind: 'transaction'; data: TransactionListItem }
  | { kind: 'account'; data: Account }
  | { kind: 'category'; data: Category };

type SearchSection = {
  title: string;
  count: number;
  data: SearchItem[];
};

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    searchRow: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('4'),
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      gap: spacing('2'),
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.md,
      color: colors.text,
      padding: 0,
    },

    prompt: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
      gap: spacing('4'),
    },
    promptIcon: {
      width: 64,
      height: 64,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
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
      marginBottom: spacing('2.5'),
    },
    sectionTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      opacity: 0.7,
    },
    sectionCount: {
      fontFamily: typography.fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      opacity: 0.5,
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
      fontSize: 10,
    },

    sectionFooter: { height: spacing('5') },
  });

const AccountRow = React.memo(function AccountRow({
  account,
  onPress,
}: {
  account: Account;
  onPress: (id: number) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const accentColor = useMemo(() => colorNumberToHex(account.color), [account.color]);
  const handlePress = useCallback(() => onPress(account.id), [onPress, account.id]);

  return (
    <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing('3.5'), gap: theme.spacing('3') }]} onPress={handlePress} activeOpacity={0.7}>
      <IconAvatar icon={resolveIcon(account.icon, 'wallet-outline')} bg={colors.surface} color={accentColor} size={36} iconSize={16} />
      <View style={{ flex: 1, gap: theme.spacing('0.5') }}>
        <Text style={{ fontFamily: theme.typography.fonts.semibold, fontSize: theme.typography.sizes.sm, color: colors.text }}>{account.name}</Text>
        <Text style={{ fontFamily: theme.typography.fonts.regular, fontSize: theme.typography.sizes.xs, color: colors.textMuted }}>
          {account.currency}{account.accountNumber && account.accountNumber !== 'N/A' ? ` · •••• ${account.accountNumber.slice(-4)}` : ''}
        </Text>
      </View>
      <MoneyText amount={account.balance} currency={account.currency} weight="bold" style={{ fontSize: 14 }} />
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

const CategoryRow = React.memo(function CategoryRow({
  category,
  onPress,
}: {
  category: Category;
  onPress: (id: number) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const catColor = useMemo(() => colorNumberToHex(category.color), [category.color]);
  const handlePress = useCallback(() => onPress(category.id), [onPress, category.id]);

  return (
    <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing('3.5'), gap: theme.spacing('3') }]} onPress={handlePress} activeOpacity={0.7}>
      <IconAvatar icon={resolveIcon(category.icon, 'pricetag-outline')} bg={colors.surface} color={catColor} size={36} iconSize={16} />
      <Text style={{ flex: 1, fontFamily: theme.typography.fonts.semibold, fontSize: theme.typography.sizes.sm, color: colors.text }}>{category.name}</Text>
      <View style={[{ backgroundColor: (category.type === 'CR' ? colors.success : colors.danger) + '15', paddingHorizontal: theme.spacing('2'), height: 22, borderRadius: theme.radius('sm'), alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: theme.typography.fonts.semibold, fontSize: 10, color: category.type === 'CR' ? colors.success : colors.danger }}>
          {category.type === 'CR' ? 'Income' : category.type === 'TR' ? 'Transfer' : 'Expense'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

export const SearchScreen = React.memo(function SearchScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const { data, isFetching, isEnabled, debouncedQuery } = useGlobalSearch(query);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleClear = useCallback(() => setQuery(''), []);

  const handleTransactionPress = useCallback((tx: { id: number }) => {
    router.push(`/transactions/edit/${tx.id}`);
  }, [router]);

  const handleAccountPress = useCallback((id: number) => {
    router.push(`/transactions?accountId=${id}`);
  }, [router]);

  const handleCategoryPress = useCallback((id: number) => {
    router.push(`/transactions?categoryId=${id}`);
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
    return result;
  }, [data]);

  const hasResults = sections.length > 0;
  const noResults = isEnabled && !isFetching && debouncedQuery.length >= 2 && !hasResults;

  const renderItem = useCallback(
    ({ item, index, section }: SectionListRenderItemInfo<SearchItem, SearchSection>) => {
      const isFirst = index === 0;
      const isLast = index === section.data.length - 1;

      if (item.kind === 'transaction') {
        return (
          <TransactionRow tx={item.data} isFirst={isFirst} isLast={isLast} showDate onPress={handleTransactionPress} />
        );
      }

      const cardStyle = {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: isFirst ? theme.radius('xl') : 0,
        borderTopRightRadius: isFirst ? theme.radius('xl') : 0,
        borderBottomLeftRadius: isLast ? theme.radius('xl') : 0,
        borderBottomRightRadius: isLast ? theme.radius('xl') : 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.text + '08',
      };

      if (item.kind === 'account') {
        return (
          <View style={cardStyle}>
            <AccountRow account={item.data} onPress={handleAccountPress} />
          </View>
        );
      }
      return (
        <View style={cardStyle}>
          <CategoryRow category={item.data} onPress={handleCategoryPress} />
        </View>
      );
    },
    [handleTransactionPress, handleAccountPress, handleCategoryPress, theme],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<SearchItem, SearchSection> }) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          {section.title}
        </Text>
        <Text style={[styles.sectionCount, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {section.count}
        </Text>
      </View>
    ),
    [styles, typography.fonts.semibold, typography.fonts.regular, colors.textMuted],
  );

  const renderSectionFooter = useCallback(
    () => <View style={styles.sectionFooter} />,
    [styles],
  );

  const keyExtractor = useCallback((item: SearchItem) => {
    if (item.kind === 'transaction') return `tx-${item.data.id}`;
    if (item.kind === 'account') return `acc-${item.data.id}`;
    return `cat-${item.data.id}`;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <Header
        title="Search"
        showBack
        rightAction={isFetching && isEnabled ? <ActivityIndicator size="small" color={colors.primary} /> : undefined}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { fontFamily: typography.fonts.regular, color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions, accounts, categories..."
            placeholderTextColor={colors.textMuted + '80'}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!isEnabled ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={28} color={colors.textMuted} />
          </View>
          <Text style={[styles.promptTitle, { fontFamily: typography.fonts.heading, color: colors.text }]}>Search everything</Text>
          <Text style={[styles.promptSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Transactions, accounts, and categories. Type at least 2 characters to start.
          </Text>
        </View>
      ) : noResults ? (
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="file-tray-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={[styles.promptTitle, { fontFamily: typography.fonts.heading, color: colors.text }]}>No results</Text>
          <Text style={[styles.promptSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Nothing matched \u201C{debouncedQuery}\u201D. Try a different term.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
});
