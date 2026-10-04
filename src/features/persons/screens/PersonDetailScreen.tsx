import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Chip,
  ConfirmDialog,
  EmptyState,
  IconAvatar,
  IconButton,
  ListGroup,
  ListItem,
  MoneyText,
  PersonAvatar,
  Screen,
  SectionHeader,
  SkeletonScreen,
  StatTile,
  Text,
} from '@/src/components/ui';
import { DEFAULT_CURRENCY, sortCurrenciesWithDefault } from '@/src/constants/currency';
import { useLoansByPerson } from '@/src/features/loans/hooks/loans';
import { useDeletePerson, usePersonWithStats } from '@/src/features/persons/hooks/persons';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { useTransactions } from '@/src/features/transactions/hooks/transactions';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { parseDateKey } from '@/src/utils/date';

const RECENT_LIMIT = 50;

/** A person: who they are and how to reach them, money each way, open loans, then shared transactions. */
export const PersonDetailScreen = React.memo(function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile } = useSettings();

  const { data: transactions = [] } = useTransactions(RECENT_LIMIT, { personIds: [personId] });
  const { data: loans = [] } = useLoansByPerson(personId);
  const deletePerson = useDeletePerson();
  const [isDeleteVisible, setDeleteVisible] = useState(false);

  const currencies = useMemo(() => {
    const unique = Array.from(new Set(transactions.map((tx) => tx.account.currency)));
    return sortCurrenciesWithDefault(unique.length > 0 ? unique : [profile.defaultCurrency || DEFAULT_CURRENCY], profile.defaultCurrency);
  }, [transactions, profile.defaultCurrency]);
  const [chosenCurrency, setCurrency] = useState<string | null>(null);
  const currency = chosenCurrency && currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0]!;

  const { data: person, isLoading } = usePersonWithStats(personId, currency);
  const inCurrency = useMemo(() => transactions.filter((tx) => tx.account.currency === currency), [transactions, currency]);
  const openLoans = useMemo(() => loans.filter((l) => l.computedStatus !== 'repaid'), [loans]);

  const confirmDelete = useCallback(async () => {
    await deletePerson.mutateAsync(personId);
    router.back();
  }, [deletePerson, personId, router]);

  if (isLoading || !person) {
    return (
      <Screen header={{ title: t('persons.person'), showBack: true }} variant="fixed" edges={['top']}>
        <SkeletonScreen />
      </Screen>
    );
  }

  const role = [person.designation, person.company].filter(Boolean).join(' · ');

  return (
    <Screen
      header={{
        title: person.name,
        showBack: true,
        rightAction: (
          <View style={styles.headerActions}>
            <IconButton icon="delete" variant="danger" onPress={() => setDeleteVisible(true)} accessibilityLabel={t('common.delete')} />
            <IconButton icon="pencil-simple" onPress={() => router.push(`/(main)/persons/form?id=${personId}`)} accessibilityLabel={t('common.edit')} />
          </View>
        ),
      }}
      variant="fixed"
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <PersonAvatar name={person.name} color={colorNumberToHex(person.color)} size={72} />
          <Text variant="headline" align="center" numberOfLines={2}>
            {person.name}
          </Text>
          {role ? (
            <Text variant="callout" tone="muted" align="center">
              {role}
            </Text>
          ) : null}
        </View>

        {person.email || person.phone ? (
          <ListGroup>
            {person.email ? (
              <ListItem icon="mail" iconColor={colors.info} title={person.email} subtitle={t('persons.email')} onPress={() => Linking.openURL(`mailto:${person.email}`)} />
            ) : null}
            {person.phone ? (
              <ListItem icon="call" iconColor={colors.success} title={person.phone} subtitle={t('persons.phone')} onPress={() => Linking.openURL(`tel:${person.phone}`)} />
            ) : null}
          </ListGroup>
        ) : null}

        {currencies.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
            {currencies.map((c) => (
              <Chip key={c} label={c} isActive={c === currency} onPress={() => setCurrency(c)} />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.tiles}>
          <StatTile label={t('persons.spent')} icon="trend-up" iconColor={colors.danger} amount={person.totalSpent} currency={currency} type="DR" compact />
          <StatTile label={t('persons.received')} icon="chevron-down" iconColor={colors.success} amount={person.totalReceived} currency={currency} type="CR" compact />
        </View>

        {openLoans.length > 0 ? (
          <ListGroup title={`${t('persons.activeLoans')} · ${openLoans.length}`}>
            {openLoans.map((loan) => {
              const isLend = loan.type === 'lend';
              const subtitle = loan.dueDate
                ? t('loans.due', { date: formatDate(parseDateKey(loan.dueDate), { day: 'numeric', month: 'short', year: 'numeric' }) })
                : `${isLend ? t('loans.lent') : t('loans.borrowed')} · ${loan.accountName}`;
              return (
                <ListItem
                  key={loan.id}
                  leading={<IconAvatar icon={isLend ? 'trend-up' : 'chevron-down'} color={isLend ? colors.success : colors.danger} size={40} />}
                  title={isLend ? t('loans.lentOut') : t('loans.borrowed')}
                  subtitle={subtitle}
                  trailing={<MoneyText amount={loan.outstanding} currency={loan.currency} type={isLend ? 'CR' : 'DR'} weight="semibold" compact />}
                  onPress={() => router.push(`/(main)/loans/${loan.id}`)}
                />
              );
            })}
          </ListGroup>
        ) : null}

        <View>
          <SectionHeader title={t('persons.transactions')} noPadding />
          {inCurrency.length > 0 ? (
            inCurrency.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === inCurrency.length - 1}
                showDate
                onPress={() => router.push(`/transactions/${tx.id}`)}
              />
            ))
          ) : (
            <EmptyState variant="inline" icon="receipt-text" title={t('persons.noTransactionsIn', { currency })} />
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        destructive
        visible={isDeleteVisible}
        onClose={() => setDeleteVisible(false)}
        title={t('persons.deleteTitle')}
        message={t('persons.deleteMessage', { name: person.name })}
        confirmLabel={t('persons.delete')}
        onConfirm={confirmDelete}
        isLoading={deletePerson.isPending}
      />
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: spacing('2') },
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: spacing('12'), gap: spacing('5') },
    hero: { alignItems: 'center', gap: spacing('1.5'), paddingVertical: spacing('2') },
    bleed: { marginHorizontal: -layout.screenPadding, flexGrow: 0 },
    chips: { gap: spacing('2'), paddingHorizontal: layout.screenPadding },
    tiles: { flexDirection: 'row', gap: spacing('2') },
  });
