import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconAvatar, ListGroup, ListItem, MoneyText, PersonAvatar, Text } from '@/src/components/ui';
import { LIST_ITEM_LEADING_SIZE } from '@/src/components/ui/ListItem';
import type { SearchSection } from '@/src/features/search/hooks/useSearchResults';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';

type SearchResultGroupsProps = {
  sections: readonly SearchSection[];
  onOpenTransaction: (id: number) => void;
  onOpenAccount: (id: number) => void;
  onOpenCategory: (id: number) => void;
  onOpenPerson: (id: number) => void;
};

/** Results grouped by kind — transactions as the usual row stack, everything else as list groups. */
export const SearchResultGroups = React.memo(function SearchResultGroups({
  sections,
  onOpenTransaction,
  onOpenAccount,
  onOpenCategory,
  onOpenPerson,
}: SearchResultGroupsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const typeLabel = { CR: t('transactions.income'), DR: t('transactions.expense'), TR: t('transactions.transfer') } as const;
  const title = (section: SearchSection) => `${t(`search.${section.kind}`)} · ${section.items.length}`;

  return (
    <View style={styles.groups}>
      {sections.map((section) => {
        switch (section.kind) {
          case 'transactions':
            return (
              // TransactionRow draws its own rounded stack and dividers (as on the dashboard),
              // so it isn't wrapped in a ListGroup — only the label is matched.
              <View key={section.kind}>
                <Text variant="label" tone="muted" style={styles.label}>
                  {title(section)}
                </Text>
                {section.items.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    isFirst={i === 0}
                    isLast={i === section.items.length - 1}
                    showDate
                    onPress={() => onOpenTransaction(tx.id)}
                  />
                ))}
              </View>
            );
          case 'accounts':
            return (
              <ListGroup key={section.kind} title={title(section)}>
                {section.items.map((account) => {
                  const lastFour = account.accountNumber && account.accountNumber !== 'N/A' ? ` · •••• ${account.accountNumber.slice(-4)}` : '';
                  return (
                    <ListItem
                      key={account.id}
                      title={account.name}
                      subtitle={`${account.currency}${lastFour}`}
                      leading={<IconAvatar icon={resolveAccountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} size={LIST_ITEM_LEADING_SIZE} />}
                      trailing={<MoneyText amount={account.balance} currency={account.currency} style={styles.balance} />}
                      onPress={() => onOpenAccount(account.id)}
                    />
                  );
                })}
              </ListGroup>
            );
          case 'categories':
            return (
              <ListGroup key={section.kind} title={title(section)}>
                {section.items.map((category) => (
                  <ListItem
                    key={category.id}
                    title={category.name}
                    value={typeLabel[category.type as keyof typeof typeLabel] ?? t('search.all')}
                    leading={<IconAvatar icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} size={LIST_ITEM_LEADING_SIZE} />}
                    onPress={() => onOpenCategory(category.id)}
                  />
                ))}
              </ListGroup>
            );
          case 'persons':
            return (
              <ListGroup key={section.kind} title={title(section)}>
                {section.items.map((person) => (
                  <ListItem
                    key={person.id}
                    title={person.name}
                    subtitle={[person.designation, person.company].filter(Boolean).join(' · ') || person.email || undefined}
                    leading={<PersonAvatar name={person.name} color={colorNumberToHex(person.color)} size={LIST_ITEM_LEADING_SIZE} />}
                    onPress={() => onOpenPerson(person.id)}
                  />
                ))}
              </ListGroup>
            );
        }
      })}
    </View>
  );
});

const createStyles = ({ spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    groups: { gap: spacing('5') },
    // Mirrors ListGroup's title spacing.
    label: { marginBottom: spacing('2'), marginLeft: spacing('1') },
    balance: typography.metrics.md,
  });
