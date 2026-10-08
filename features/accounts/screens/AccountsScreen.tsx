import { Button, Card, EmptyState, Header, IconCircle, ListGroup, ListRow, Money, Screen, Section, Select, Skeleton, SplitBar, Text, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon } from '@/features/accounts/account-icons';
import { maskedNumber } from '@/features/accounts/account-form';
import { accountsByType } from '@/features/accounts/account-list';
import { useAccounts } from '@/features/accounts/hooks/accounts';
import { netWorthByCurrency } from '@/features/accounts/net-worth';
import { useSettings } from '@/features/settings';
import { currencyName } from '@/shared/currency/currencies';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Every account under its kind, below what they add up to.
 */
export function AccountsScreen() {
  const { t } = useTranslation('accounts');
  const { colors, size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { profile } = useSettings();
  const { data: accounts, isPending } = useAccounts();

  const groups = useMemo(() => accountsByType(accounts ?? []), [accounts]);
  const worth = useMemo(() => netWorthByCurrency(accounts ?? [], profile.defaultCurrency), [accounts, profile.defaultCurrency]);
  const [currency, setCurrency] = useState<string | null>(null);
  // The default currency first, until another is chosen.
  const shown = worth.find((group) => group.currency === currency) ?? worth[0];

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const add = () => router.push('/accounts/new');
  const header = <Header title={t('title')} onBack={back} backLabel={t('back')} />;

  if (isPending || !accounts) {
    return (
      <Screen header={header}>
        <Skeleton height={size.row * 2} />
        <Skeleton height={size.chip} width="40%" />
        <Skeleton height={size.row * 3} />
      </Screen>
    );
  }

  if (accounts.length === 0) {
    return (
      <Screen scroll={false} header={header}>
        <View style={styles.empty}>
          <EmptyState icon="wallet" title={t('empty.title')} body={t('empty.body')} actionLabel={t('add')} onAction={add} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={<Button label={t('add')} onPress={add} />}>
      {shown ? (
        <Card style={styles.worth}>
          <View style={styles.worthHead}>
            <Text variant="bodyStrong">{t('netWorth.title')}</Text>
            {/* Currencies are never added together, so with several held the card shows one at a time. */}
            {worth.length > 1 ? <Select options={worth.map((group) => ({ key: group.currency, label: group.currency, detail: currencyName(group.currency) }))} value={shown.currency} onChange={setCurrency} accessibilityLabel={t('netWorth.currency')} /> : null}
          </View>
          <Money value={formatCurrency(shown.net, shown.currency)} variant="amountHero" />
          {shown.debts > 0 ? (
            <SplitBar
              segments={[
                { label: t('netWorth.have'), value: shown.assets, display: formatCurrency(shown.assets, shown.currency), color: colors.brand },
                { label: t('netWorth.owe'), value: shown.debts, display: formatCurrency(shown.debts, shown.currency), color: colors.text },
              ]}
            />
          ) : null}
        </Card>
      ) : null}

      {groups.map((group) => (
        <Section key={group.type} title={t(`groups.${group.type}`)}>
          <ListGroup>
            {group.accounts.map((account) => (
              <ListRow
                key={account.id}
                leading={<IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />}
                strong
                title={account.name}
                subtitle={[account.isDefault ? t('default') : null, maskedNumber(account.accountNumber)].filter(Boolean).join(' · ') || undefined}
                value={formatCurrency(account.balance, account.currency)}
                onPress={() => router.push({ pathname: '/accounts/[id]', params: { id: account.id } })}
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
    empty: { flex: 1, justifyContent: 'center' },
    worth: { gap: space.md },
    worthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
  });
