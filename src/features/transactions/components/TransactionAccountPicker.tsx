import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveAccountTypeIcon } from '../../../utils/icons';
import type { AccountType } from '../../../types';
import type { Account } from '../../accounts/api/accounts';
import { BentoPressable } from '../../../components/ui/BentoPressable';

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
  label = 'Account',
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {accounts.map((acc) => {
          const selected = selectedId === acc.id;
          const accColor = colorNumberToHex(acc.color);
          return (
            <BentoPressable
              key={acc.id}
              style={[
                styles.card,
                { backgroundColor: selected ? accColor + '12' : colors.surface },
              ]}
              onPress={() => handleSelect(acc.id)}
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
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                <Text style={[styles.currency, { color: colors.textMuted }]}>{acc.currency}</Text>
              </View>
              {selected && (
                <View style={[styles.check, { backgroundColor: accColor, borderColor: colors.background }]}>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color={colors.background} />
                </View>
              )}
            </BentoPressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius , layout, sizes }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingVertical: spacing('3'),
  },
  label: {
    fontFamily: typography.styles.sectionLabel.fontFamily,
    fontSize: typography.sizes.xs,
    marginBottom: spacing('3'),
    paddingHorizontal: layout.screenPadding,
    opacity: 0.6,
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
  name: {
    fontFamily: typography.styles.rowLabel.fontFamily,
    fontSize: typography.sizes.md,
  },
  currency: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
  },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
