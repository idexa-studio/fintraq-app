import { SEARCH_TRANSACTION_LIMIT } from '@/data/repositories/search';
import { Chip, ChipRow, EmptyState, Header, IconButton, IconCircle, ListGroup, ListRow, Screen, Section, Skeleton, Text, TextField, resolveIcon, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon, maskedNumber } from '@/features/accounts';
import { initialsOf } from '@/features/people';
import { ProGateScreen, usePro } from '@/features/pro';
import { useRecentSearches } from '@/features/search/hooks/useRecentSearches';
import { useSearch } from '@/features/search/hooks/useSearch';
import { personLine } from '@/features/search/search-rules';
import type { SearchGroup, SearchKind } from '@/features/search/search-rules';
import { TransactionRow } from '@/features/transactions';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * One field over everything recorded: transactions by their note, account,
 * category or person, and the accounts, people and categories themselves.
 * Pro as a whole, so a free user arriving by any way sees what it is instead.
 */
export function SearchScreen() {
  const { isPro, ready } = usePro();
  if (!ready) return <Screen>{null}</Screen>;
  return isPro ? <Search /> : <ProGateScreen feature="search" />;
}

function Search() {
  const { t } = useTranslation('search');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [only, setOnly] = useState<SearchKind | null>(null);
  const { groups, total, waiting, nothingFound, query } = useSearch(typed);
  const { recents, remember, forget, forgetAll } = useRecentSearches();

  // A new search starts from everything, not from a kind that may have found nothing this time.
  const type = (next: string) => {
    setTyped(next);
    setOnly(null);
  };
  // The kind chosen, while it still has results to show.
  const kind = only && groups.some((group) => group.kind === only) ? only : null;
  const shown = kind ? groups.filter((group) => group.kind === kind) : groups;
  // A search is worth remembering once it led somewhere, not for every pause in typing.
  const open = (go: () => void) => () => {
    remember(query);
    go();
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const rows = (group: SearchGroup) => {
    switch (group.kind) {
      case 'transactions':
        return group.items.map((tx) => <TransactionRow key={tx.id} transaction={tx} when="day" onPress={open(() => router.push({ pathname: '/transactions/[id]', params: { id: tx.id } }))} />);
      case 'accounts':
        return group.items.map((account) => (
          <ListRow
            key={account.id}
            leading={<IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />}
            strong
            title={account.name}
            subtitle={maskedNumber(account.accountNumber) || undefined}
            value={formatCurrency(account.balance, account.currency)}
            onPress={open(() => router.push({ pathname: '/accounts/[id]', params: { id: account.id } }))}
          />
        ));
      case 'people':
        return group.items.map((person) => (
          <ListRow
            key={person.id}
            leading={<IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} />}
            strong
            title={person.name}
            subtitle={personLine(person)}
            onPress={open(() => router.push({ pathname: '/people/[id]', params: { id: person.id } }))}
          />
        ));
      case 'categories':
        return group.items.map((category) => (
          <ListRow
            key={category.id}
            leading={<IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} />}
            strong
            title={category.name}
            onPress={open(() => router.push({ pathname: '/activity', params: { categoryId: category.id } }))}
          />
        ));
    }
  };

  const body = () => {
    if (waiting) return [<Skeleton key="a" height={size.row * 3} />, <Skeleton key="b" height={size.row * 2} />];
    if (nothingFound) return [<EmptyState key="none" icon="search" title={t('none.title', { query })} body={t('none.body')} />];
    if (groups.length > 0) {
      return shown.map((group) => (
        <Section key={group.kind} title={t(`groups.${group.kind}`)}>
          <ListGroup>{rows(group)}</ListGroup>
          {group.kind === 'transactions' && group.items.length >= SEARCH_TRANSACTION_LIMIT ? <Text variant="callout" tone="muted">{t('capped', { count: SEARCH_TRANSACTION_LIMIT })}</Text> : null}
        </Section>
      ));
    }
    if (recents.length > 0) {
      return [
        <Section key="recent" title={t('recent.title')} actionLabel={t('recent.clear')} onAction={forgetAll}>
          <ListGroup>
            {recents.map((recent) => (
              <ListRow
                key={recent}
                icon="history"
                title={recent}
                trailing={<IconButton icon="x" size={size.iconSmall} onPress={() => forget(recent)} accessibilityLabel={t('recent.forget', { query: recent })} />}
                onPress={() => type(recent)}
              />
            ))}
          </ListGroup>
        </Section>,
      ];
    }
    return [<EmptyState key="start" icon="search" title={t('start.title')} body={t('start.body')} />];
  };

  return (
    <Screen
      keyboardAware
      scrollHidesKeyboard
      header={
        <View style={styles.head}>
          <Header title={t('title')} onBack={back} backLabel={t('back')} />
          <View style={styles.field}>
            <TextField
              icon="search"
              value={typed}
              onChangeText={type}
              placeholder={t('placeholder')}
              accessibilityLabel={t('title')}
              focusOnArrival
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => remember(typed)}
              onClear={() => type('')}
              clearLabel={t('clear')}
            />
          </View>
          {/* Kinds only help when more than one found something. */}
          {groups.length > 1 ? (
            <ChipRow>
              <Chip label={t('kinds.all', { count: total })} selected={!kind} onPress={() => setOnly(null)} />
              {groups.map((group) => <Chip key={group.kind} label={t(`kinds.${group.kind}`, { count: group.items.length })} selected={kind === group.kind} onPress={() => setOnly(group.kind)} />)}
            </ChipRow>
          ) : null}
        </View>
      }
    >
      {body()}
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    head: { gap: space.md, paddingBottom: space.md },
    field: { paddingHorizontal: size.screenPadding },
  });
