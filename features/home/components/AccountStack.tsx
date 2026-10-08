import type { Account } from '@/data/repositories/accounts';
import { Text, Touchable, pastelOf, useStyles } from '@/design';
import type { Theme } from '@/design';
import { WalletStack, accountTypeIcon, maskedNumber } from '@/features/accounts';
import { accountStack, distinctColors } from '@/features/home/home-rules';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type AccountStackProps = {
  accounts: readonly Account[];
  onOpen: (id: number) => void;
  onOpenAll: () => void;
};

/**
 * Home's accounts as a wallet: the default account in front, the others
 * behind it with the largest holding nearest, each in a colour that can be
 * told from its neighbours. Tapping a card opens that account.
 */
export function AccountStack({ accounts, onOpen, onOpenAll }: AccountStackProps) {
  const { t } = useTranslation(['home', 'common']);
  const styles = useStyles(createStyles);
  const { behind, front, more } = accountStack(accounts);
  if (!front) return null;

  // Colours are settled from the front backwards: the nearer card keeps its own, a further one gives way.
  const nearest = [front, ...[...behind].reverse()];
  const settled = distinctColors(nearest.map((account) => pastelOf(colorNumberToHex(account.color))), OFFERED_COLORS.map((offered) => pastelOf(offered.hex)));
  const kind = (account: Account) => t(`common:accountTypes.${account.accountType ?? 'bank'}`);

  return (
    <View style={styles.wrap}>
      <WalletStack
        cards={[...behind, front].map((account) => ({
          key: String(account.id),
          name: account.name,
          detail: [kind(account), maskedNumber(account.accountNumber)].filter(Boolean).join(' · '),
          amount: formatCurrency(account.balance, account.currency),
          color: settled[nearest.indexOf(account)]!,
          icon: accountTypeIcon(account.accountType),
        }))}
        onPress={(key) => onOpen(Number(key))}
      />
      {more > 0 ? (
        <Touchable onPress={onOpenAll} accessibilityRole="link" accessibilityLabel={t('accounts.more', { count: more })} style={styles.more}>
          <Text variant="calloutStrong" underline>{t('accounts.more', { count: more })}</Text>
        </Touchable>
      ) : null}
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.md },
    more: { alignSelf: 'flex-start' },
  });
