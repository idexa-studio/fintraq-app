import type { Account } from '@/data/repositories/accounts';
import { Icon, INK, Text, Touchable, ltr, pastelOf, useStyles } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon, maskedNumber } from '@/features/accounts';
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
 * The accounts as a stack of cards, the way cards sit in a wallet: each in
 * its own colour, the ones behind showing the edge that names them and says
 * what they hold, the one in front shown in full. Tapping any card opens
 * that account. Text is black on every card, in both schemes, as the cards
 * keep their colours.
 */
export function AccountStack({ accounts, onOpen, onOpenAll }: AccountStackProps) {
  const { t } = useTranslation(['home', 'common']);
  const styles = useStyles(createStyles);
  const { behind, front, more } = accountStack(accounts);
  if (!front) return null;

  // Each card in a colour of its own, so two accounts saved alike can still be told apart.
  // Colours are settled from the front backwards: the nearer card keeps its own, a further one gives way.
  const nearest = [front, ...[...behind].reverse()];
  const settled = distinctColors(nearest.map((account) => pastelOf(colorNumberToHex(account.color))), OFFERED_COLORS.map((offered) => pastelOf(offered.hex)));
  const colorOf = (account: Account) => settled[nearest.indexOf(account)];
  const kind = (account: Account) => t(`common:accountTypes.${account.accountType ?? 'bank'}`);
  const money = (account: Account) => ltr(formatCurrency(account.balance, account.currency));

  return (
    <View style={styles.wrap}>
      <View>
        {behind.map((account) => (
          <Touchable key={account.id} onPress={() => onOpen(account.id)} accessibilityLabel={`${account.name}, ${money(account)}`} style={[styles.card, styles.edge, { backgroundColor: colorOf(account) }]}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>{account.name}</Text>
            <Text variant="amount" numberOfLines={1} style={styles.ink}>{money(account)}</Text>
          </Touchable>
        ))}
        <Touchable onPress={() => onOpen(front.id)} accessibilityLabel={`${front.name}, ${kind(front)}, ${money(front)}`} style={[styles.card, styles.front, { backgroundColor: colorOf(front) }]}>
          <View style={styles.row}>
            <View style={styles.title}>
              <Text variant="bodyStrong" numberOfLines={1} style={styles.ink}>{front.name}</Text>
              <Text variant="callout" numberOfLines={1} style={styles.ink}>{[kind(front), maskedNumber(front.accountNumber)].filter(Boolean).join(' · ')}</Text>
            </View>
            <Icon name={accountTypeIcon(front.accountType)} color={INK} />
          </View>
          <Text variant="amountLarge" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.ink}>{money(front)}</Text>
        </Touchable>
      </View>
      {more > 0 ? (
        <Touchable onPress={onOpenAll} accessibilityRole="link" accessibilityLabel={t('accounts.more', { count: more })} style={styles.more}>
          <Text variant="calloutStrong" underline>{t('accounts.more', { count: more })}</Text>
        </Touchable>
      ) : null}
    </View>
  );
}

const createStyles = ({ border, radius, size, space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.md },
    // Outlined, as the pale colours need an edge against the page and against each other.
    card: { borderRadius: radius.md, borderWidth: border.thin, borderColor: INK, paddingHorizontal: size.cardPadding },
    // A card behind shows its top edge; the rest of it is tucked under the card below.
    edge: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.lg, paddingTop: space.md, height: size.field + radius.md + space.xs, marginBottom: -(radius.md + space.xs) },
    front: { paddingVertical: size.cardPadding, gap: space.lg },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    title: { flex: 1, gap: space.xxs },
    name: { flex: 1, color: INK },
    ink: { color: INK },
    more: { alignSelf: 'flex-start' },
  });
