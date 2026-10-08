import { Card, CardActions, MarkTile, Money, Select, Skeleton, Text, useTheme } from '@/design';
import type { HomeBalances } from '@/features/home/hooks/useHomeBalances';
import { CURRENCIES } from '@/shared/currency/currencies';
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

const currencyName = (code: string) => CURRENCIES.find((c) => c.code === code)?.name ?? code;

/** What the accounts in one currency add up to, with the two things done most. */
export function BalanceCard({ balances, loading, onAddExpense, onAddIncome, onOpenAccounts }: BalanceCardProps) {
  const { t } = useTranslation('home');
  const { size, space, type } = useTheme();
  const { currency, currencies, setCurrency, balance, count } = balances;
  return (
    <Card padded={false}>
      <View style={{ padding: size.cardPadding, gap: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: size.chip }}>
          <Text variant="bodyStrong">{t('balance.allAccounts')}</Text>
          {currencies.length > 1 ? (
            <Select
              options={currencies.map((code) => ({ key: code, label: code, detail: currencyName(code) }))}
              value={currency}
              onChange={setCurrency}
              accessibilityLabel={t('balance.currency')}
            />
          ) : null}
        </View>
        {loading ? (
          <>
            <Skeleton height={type.callout.lineHeight} width="50%" />
            <Skeleton height={type.amountHero.lineHeight} width="70%" />
          </>
        ) : (
          <>
            <Text variant="callout" tone="muted">{t('balance.summary', { count, currency: currencyName(currency) })}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
              <View style={{ flex: 1 }}><Money value={formatCurrency(balance, currency)} variant="amountHero" /></View>
              <MarkTile icon="wallet" onPress={onOpenAccounts} accessibilityLabel={t('balance.openAccounts')} />
            </View>
          </>
        )}
      </View>
      <CardActions actions={[{ label: t('balance.addExpense'), onPress: onAddExpense }, { label: t('balance.addIncome'), onPress: onAddIncome }]} />
    </Card>
  );
}
