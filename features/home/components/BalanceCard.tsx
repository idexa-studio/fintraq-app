import { Card, CardActions, MarkTile, Money, Select, Skeleton, Text, Touchable, pastelOf, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { balanceMakeup, distinctColors } from '@/features/home/home-rules';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { colorNumberToHex } from '@/shared/format/color';
import type { HomeBalances } from '@/features/home/hooks/useHomeBalances';
import { currencyName } from '@/shared/currency/currencies';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type BalanceCardProps = {
  balances: HomeBalances;
  loading: boolean;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onOpenAccounts: () => void;
  onOpenAccount: (id: number) => void;
};


/**
 * What the accounts in one currency add up to and what that is made of: one
 * bar shared out among the accounts that hold money, each named beneath it
 * in its own colour, then the two things done most.
 */
export function BalanceCard({ balances, loading, onAddExpense, onAddIncome, onOpenAccounts, onOpenAccount }: BalanceCardProps) {
  const { t } = useTranslation('home');
  const { size, space, type } = useTheme();
  const styles = useStyles(createStyles);
  const { currency, currencies, setCurrency, balance, accounts } = balances;
  const makeup = balanceMakeup(accounts);
  // Named in the order of the bar, each in a colour of its own.
  const tints = distinctColors(makeup.named.map((account) => pastelOf(colorNumberToHex(account.color))), OFFERED_COLORS.map((offered) => pastelOf(offered.hex)));
  const tint = (id: number) => tints[makeup.named.findIndex((account) => account.id === id)] ?? tints[0];
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
            <Skeleton height={type.amountHero.lineHeight} width="70%" />
          </>
        ) : (
          <>
            {/* With more than one currency held, say which one all of Home is showing. */}
            {currencies.length > 1 ? <Text variant="callout" tone="muted">{t('balance.scope', { currency: currencyName(currency) })}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
              <View style={{ flex: 1 }}><Money value={formatCurrency(balance, currency)} variant="amountHero" /></View>
              <MarkTile icon="wallet" onPress={onOpenAccounts} accessibilityLabel={t('balance.openAccounts')} />
            </View>
            {accounts.length > 1 ? (
              <View style={styles.makeup}>
                {makeup.parts.length > 0 ? (
                  <View style={styles.bar} accessible accessibilityRole="image" accessibilityLabel={t('balance.makeup')}>
                    {makeup.parts.map((account) => <View key={account.id} style={[styles.part, { flex: account.balance, backgroundColor: tint(account.id) }]} />)}
                  </View>
                ) : null}
                <View style={styles.names}>
                  {makeup.named.map((account) => (
                    <Touchable key={account.id} onPress={() => onOpenAccount(account.id)} accessibilityLabel={`${account.name}, ${formatCurrency(account.balance, currency)}`} style={styles.name}>
                      <View style={[styles.dot, { backgroundColor: tint(account.id) }]} />
                      <View style={styles.nameText}>
                        <Text variant="caption" tone="muted" numberOfLines={1}>{account.name}</Text>
                        <Text variant="calloutStrong" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{formatCurrency(account.balance, currency)}</Text>
                      </View>
                    </Touchable>
                  ))}
                </View>
                {makeup.more > 0 ? (
                  <Touchable onPress={onOpenAccounts} accessibilityRole="link" accessibilityLabel={t('balance.more', { count: makeup.more })} style={styles.more}>
                    <Text variant="calloutStrong" underline>{t('balance.more', { count: makeup.more })}</Text>
                  </Touchable>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </View>
      <CardActions actions={[{ label: t('balance.addExpense'), onPress: onAddExpense }, { label: t('balance.addIncome'), onPress: onAddIncome }]} />
    </Card>
  );
}

const createStyles = ({ colors, border, radius, space }: Theme) =>
  StyleSheet.create({
    makeup: { gap: space.md, paddingTop: space.md },
    // Outlined like every bar in the system, since the pastels are pale against white.
    bar: { flexDirection: 'row', height: space.md, borderRadius: radius.pill, borderWidth: border.thin, borderColor: colors.border, overflow: 'hidden', gap: border.thin, backgroundColor: colors.border },
    // Even the smallest holding keeps a sliver, so every account in the bar can be seen.
    part: { height: '100%', minWidth: space.xs },
    names: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
    name: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: space.md },
    nameText: { flex: 1 },
    dot: { width: space.md, height: space.md, borderRadius: space.md / 2, borderWidth: border.thin, borderColor: colors.border },
    more: { alignSelf: 'flex-start' },
  });
