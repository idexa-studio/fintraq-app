import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import type { Account } from '../../accounts/api/accounts';

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
  label = 'ACCOUNT',
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
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: selected ? accColor : colors.border },
              ]}
              onPress={() => handleSelect(acc.id)}
              activeOpacity={0.8}
            >
              <IconAvatar icon={resolveIcon(acc.icon, 'wallet-outline')} color={accColor} variant="solid" size={32} iconSize={18} />
              <View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                <Text style={[styles.currency, { color: colors.textMuted }]}>{acc.currency}</Text>
              </View>
              {selected && (
                <View style={[styles.check, { backgroundColor: accColor, borderColor: colors.background }]}>
                  <Ionicons name="checkmark" size={10} color={colors.background} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius , layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingVertical: spacing('3'),
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing('3'),
    paddingHorizontal: layout.screenPadding,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing('3'),
    paddingVertical: spacing('1'),
  },
  card: {
    minWidth: 100,
    paddingHorizontal: spacing('4'),
    paddingVertical: spacing('3'),
    borderRadius: radius('lg'),
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2.5'),
  },
  name: {
    fontFamily: typography.fonts.semibold,
    fontSize: 13,
  },
  currency: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
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
