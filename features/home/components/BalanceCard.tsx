import { MarkTile, Money, Select, Skeleton, SummaryCard, Text, useTheme } from '@/design';
import type { HomeBalances } from '@/features/home/hooks/useHomeBalances';
import { currencyName } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type BalanceCardProps = {
  balances: HomeBalances;
  loading: boolean;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onOpenAccounts: () => void;
};

/**
 * What the accounts in one currency add up to, with the two things done most. When something is
 * put aside (a savings account), the figure is what is ready to spend and the rest is a line under it.
 */
export function BalanceCard({ balances, loading, onAddExpense, onAddIncome, onOpenAccounts }: BalanceCardProps) {
  const { t } = useTranslation(['home', 'common']);
  const { space, type } = useTheme();
  const { currency, currencies, setCurrency, balance, accounts, putAside } = balances;
  // The figure is made of the accounts that count; those put aside are named on the line under it.
  const counted = accounts.length - (putAside?.accounts ?? 0);
  return (
    <SummaryCard
      title={putAside ? t('balance.readyToSpend') : t('balance.allAccounts')}
      trailing={currencies.length > 1 ? (
        <Select
          title={t('common:pickCurrency')}
          options={currencies.map((code) => ({ key: code, label: code, detail: currencyName(code) }))}
          value={currency}
          onChange={setCurrency}
          accessibilityLabel={t('balance.currency')}
        />
      ) : null}
      actions={[{ label: t('balance.addExpense'), onPress: onAddExpense }, { label: t('balance.addIncome'), onPress: onAddIncome }]}
    >
        {loading ? (
          <>
            <Skeleton height={type.amountHero.lineHeight} width="70%" />
          </>
        ) : (
          <>
            {/* How many accounts the figure adds up; with more than one currency held, which one all of Home is showing. */}
            <Text variant="callout" tone="muted">
              {currencies.length > 1 ? t('balance.scope', { count: counted, currency: currencyName(currency) }) : t('balance.summary', { count: counted })}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
              <View style={{ flex: 1 }}><Money value={formatCurrency(balance, currency)} variant="amountHero" /></View>
              <MarkTile icon="wallet" onPress={onOpenAccounts} accessibilityLabel={t('balance.openAccounts')} />
            </View>
            {putAside ? <Text variant="callout" tone="muted">{t('balance.putAside', { count: putAside.accounts, amount: formatCurrency(putAside.amount, currency) })}</Text> : null}
          </>
        )}
    </SummaryCard>
  );
}

