import { Text } from '@/src/components/ui/Text';
import { Icon } from '@/src/components/ui/Icon';
import React, { useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import type { AccountType } from '@/src/types';
import type { Account } from '@/src/features/accounts/api/accounts';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTranslation } from 'react-i18next';

type Props = {
  accounts: Account[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label?: string;
};

export const TransactionAccountPicker = React.memo(function TransactionAccountPicker({
  accounts,
  selectedId,
  onSelect,
  label,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

  return (
    <View>
      <Text variant="label" tone="muted" style={styles.label}>{label ?? t('transactions.account')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {accounts.map((acc) => {
          const selected = selectedId === acc.id;
          const accColor = colorNumberToHex(acc.color);
          return (
            <BentoPressable
              key={acc.id}
              style={[styles.pill, selected && styles.pillActive]}
              onPress={() => handleSelect(acc.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <IconAvatar
                icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)}
                color={accColor}
                variant="subtle"
                size={28}
                iconSize={14}
              />
              <View style={styles.textColumn}>
                <Text variant="calloutStrong" color={selected ? colors.primaryInk : undefined} numberOfLines={1}>{acc.name}</Text>
                <Text variant="micro" tone="muted">{acc.currency}</Text>
              </View>
              {selected ? <Icon name="tick" size={14} color={colors.primaryInk} weight="bold" /> : null}
            </BentoPressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout, alpha }: ThemeContextType) => StyleSheet.create({
  label: {
    marginBottom: spacing('2'),
    paddingHorizontal: layout.screenPadding + spacing('1'),
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing('2'),
    paddingVertical: spacing('0.5'),
  },
  // Compact pill, like the category chips below it: the choice reads at a glance without a card per account.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
    height: 48,
    paddingLeft: 10,
    paddingRight: spacing('4'),
    maxWidth: 200,
    borderRadius: radius('full'),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: alpha(colors.primary, 'subtle'),
    borderColor: alpha(colors.primary, 'strong'),
  },
  textColumn: { flexShrink: 1 },
});
