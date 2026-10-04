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
import { alpha } from '@/src/theme/tokens';

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
              style={[
                styles.card,
                { backgroundColor: selected ? alpha(accColor, 'subtle') : colors.surface },
              ]}
              onPress={() => handleSelect(acc.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${acc.name}, ${acc.currency}`}
              overflow="visible"
            >
              <IconAvatar
                icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)}
                color={accColor}
                variant="subtle"
                size={32}
                iconSize={16}
              />
              <View style={styles.textColumn}>
                <Text variant="bodyStrong" numberOfLines={1}>{acc.name}</Text>
                <Text variant="micro" tone="muted">{acc.currency}</Text>
              </View>
              {selected ? <Icon name="check-circle" size={20} color={accColor} weight="fill" /> : null}
            </BentoPressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius , layout, sizes }: ThemeContextType) => StyleSheet.create({
  label: {
    marginBottom: spacing('2'),
    paddingHorizontal: layout.screenPadding + spacing('1'),
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing('3'),
    paddingVertical: spacing('1.5'),
  },
  card: {
    minWidth: 132,
    paddingHorizontal: sizes.card.md.padding,
    paddingVertical: spacing('3.5'),
    borderRadius: radius('xl'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2.5'),
  },
  textColumn: {
    flex: 1,
  },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: radius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
