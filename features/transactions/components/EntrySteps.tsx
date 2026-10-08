import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import { CheckMark, Divider, IconButton, IconCircle, Keypad, ListRow, Money, Text, Touchable, resolveIcon, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { pressAmountKey } from '@/shared/format/amount-entry';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type AmountStepProps = { text: string; amount: number | undefined; currency: string; onChange: (text: string) => void; onCalculator: () => void };

/** The figure, large, and a keypad to type it. */
export function AmountStep({ text, amount, currency, onChange, onCalculator }: AmountStepProps) {
  const { t } = useTranslation('transactions');
  const { space } = useTheme();
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}><Money value={formatCurrency(amount ?? 0, currency)} variant="amountHero" tone={amount ? 'default' : 'muted'} /></View>
        <IconButton icon="calculator" onPress={onCalculator} accessibilityLabel={t('calculator.open')} />
      </View>
      <Keypad onKey={(key) => onChange(pressAmountKey(text, key))} />
    </View>
  );
}

type AccountStepProps = { accounts: readonly Account[]; selectedId: number | null; onSelect: (id: number) => void; empty?: string };

/** The accounts to choose from, each with what is in it. */
export function AccountStep({ accounts, selectedId, onSelect, empty }: AccountStepProps) {
  const { t } = useTranslation('common');
  const { size } = useTheme();
  if (accounts.length === 0) return <Text variant="callout" tone="muted">{empty}</Text>;
  return (
    // The rows reach the card's edges, as rows do everywhere else.
    <View style={{ marginHorizontal: -size.cardPadding, marginBottom: -size.cardPadding }}>
      {accounts.map((account) => (
        <React.Fragment key={account.id}>
          <Divider />
          <ListRow
            leading={<IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />}
            strong={account.id === selectedId}
            title={account.name}
            subtitle={t(`accountTypes.${account.accountType ?? 'bank'}`)}
            value={account.id === selectedId ? undefined : formatCurrency(account.balance, account.currency)}
            trailing={account.id === selectedId ? <CheckMark /> : undefined}
            onPress={() => onSelect(account.id)}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

type CategoryStepProps = { categories: readonly Category[]; selectedId: number | null; onSelect: (id: number) => void };

/** Categories as a grid of marks, three across: quicker to scan than a list of the same length. */
export function CategoryStep({ categories, selectedId, onSelect }: CategoryStepProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Touchable key={category.id} onPress={() => onSelect(category.id)} accessibilityRole="radio" accessibilityLabel={category.name} accessibilityState={{ selected }} style={[styles.tile, selected ? styles.tileSelected : null]}>
            <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} />
            <Text variant={selected ? 'captionStrong' : 'caption'} align="center" numberOfLines={2}>{category.name}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radius, space, border }: Theme) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
    // The outline is always there, transparent, so choosing a tile never moves the others.
    tile: { width: '33.333%', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.xs, borderRadius: radius.md, borderWidth: border.thick, borderColor: 'transparent' },
    tileSelected: { borderColor: colors.selected },
  });
