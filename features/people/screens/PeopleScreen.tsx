import { Button, Card, EmptyState, Header, IconCircle, ListGroup, ListRow, Screen, Section, Select, Skeleton, SplitBar, Text, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { useAccounts } from '@/features/accounts';
import { usePeopleWithBalances } from '@/features/people/hooks/people';
import { initialsOf, peopleByStanding } from '@/features/people/person-form';
import { FREE_LIMITS, isOverFreeLimit, usePro } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { sortCurrenciesWithDefault } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Everyone money passes between, under where things stand: who owes you,
 * whom you owe, and who is settled. One currency at a time, as on Home.
 */
export function PeopleScreen() {
  const { t } = useTranslation('people');
  const { colors, size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { profile } = useSettings();
  const { isPro, openPaywall } = usePro();
  const { data: accounts } = useAccounts();

  const currencies = useMemo(() => sortCurrenciesWithDefault([...new Set([profile.defaultCurrency, ...(accounts ?? []).map((a) => a.currency)])], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const [chosen, setChosen] = useState<string | null>(null);
  const currency = chosen && currencies.includes(chosen) ? chosen : currencies[0]!;

  const { data: people, isPending } = usePeopleWithBalances(currency);
  const groups = useMemo(() => peopleByStanding(people ?? []), [people]);
  const owed = groups.find((group) => group.standing === 'owesYou')?.total ?? 0;
  const owe = groups.find((group) => group.standing === 'youOwe')?.total ?? 0;
  const atLimit = !isPro && isOverFreeLimit('people', people?.length ?? 0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const add = () => router.push('/people/new');
  const header = <Header title={t('title')} onBack={back} backLabel={t('back')} />;

  if (isPending || !people) {
    return (
      <Screen header={header}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.row * 4} />
      </Screen>
    );
  }

  if (people.length === 0) {
    return (
      <Screen scroll={false} header={header}>
        <View style={styles.centre}>
          <EmptyState icon="users" color="teal" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={add} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      footer={
        // At the free limit the way forward is Pro, so that is what the button offers, with the reason above it.
        atLimit ? (
          <>
            <Text variant="callout" tone="muted" align="center">{t('limit.reached', { count: FREE_LIMITS.people })}</Text>
            <Button label={t('limit.seePro')} onPress={() => openPaywall('unlimited')} />
          </>
        ) : (
          <Button label={t('add')} onPress={add} />
        )
      }
    >
      <Card style={styles.summary}>
        <View style={styles.summaryHead}>
          <Text variant="bodyStrong">{t('summary.title')}</Text>
          {currencies.length > 1 ? <Select options={currencies.map((code) => ({ key: code, label: code }))} value={currency} onChange={setChosen} accessibilityLabel={t('currency')} /> : null}
        </View>
        {owed > 0 || owe > 0 ? (
          <SplitBar
            segments={[
              { label: t('summary.owed'), value: owed, display: formatCurrency(owed, currency), color: colors.brand },
              { label: t('summary.owe'), value: owe, display: formatCurrency(owe, currency), color: colors.text },
            ]}
          />
        ) : (
          <Text variant="callout" tone="muted">{t('summary.settled')}</Text>
        )}
      </Card>

      {groups.map((group) => (
        <Section key={group.standing} title={t(`standing.${group.standing}`)}>
          <ListGroup>
            {group.people.map((person) => (
              <ListRow
                key={person.id}
                leading={<IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} />}
                strong
                title={person.name}
                value={person.net === 0 ? undefined : formatCurrency(Math.abs(person.net), currency)}
                valueTone={person.net > 0 ? 'positive' : 'default'}
                onPress={() => router.push({ pathname: '/people/[id]', params: { id: person.id } })}
              />
            ))}
          </ListGroup>
        </Section>
      ))}
    </Screen>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center' },
    summary: { gap: space.md },
    summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
  });
