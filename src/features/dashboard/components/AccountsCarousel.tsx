import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { Account } from '../../accounts/api/accounts';

type Props = {
  accounts: Account[];
  onPressAccount: (id: number) => void;
  onPressAdd: () => void;
};

export const AccountsCarousel = React.memo(function AccountsCarousel({
  accounts,
  onPressAccount,
  onPressAdd,
}: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = screenWidth * 0.68;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {accounts.map(acc => {
        const c = colorNumberToHex(acc.color);
        return (
          <TouchableOpacity
            key={acc.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onPressAccount(acc.id)}
            activeOpacity={0.7}
          >
            <View style={styles.top}>
              <View style={styles.lead}>
                <IconAvatar icon={resolveIcon(acc.icon, 'wallet-outline')} bg={c + '18'} color={c} size={36} iconSize={16} />
                <View style={styles.meta}>
                  <Text style={[styles.name, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.hint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    {acc.accountNumber && acc.accountNumber !== 'N/A' ? `•••• ${acc.accountNumber.slice(-4)}` : 'Tap to view'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.currency, { fontFamily: typography.fonts.semibold, color: c }]}>{acc.currency}</Text>
            </View>

            <Text style={[styles.balanceLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Available</Text>
            <MoneyText amount={acc.balance} currency={acc.currency} style={styles.balance} weight="bold" />

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>In</Text>
                <MoneyText amount={acc.income} currency={acc.currency} type="CR" compact style={styles.statValue} />
              </View>
              <View style={styles.statSep} />
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Out</Text>
                <MoneyText amount={acc.expense} currency={acc.currency} type="DR" compact style={styles.statValue} />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.placeholder, { width: cardWidth }]}
        onPress={onPressAdd}
        activeOpacity={0.7}
      >
        <View style={styles.placeholderInner}>
          <View style={styles.addIcon}>
            <IconAvatar icon="add" bg={colors.primary + '18'} color={colors.primary} size={40} iconSize={20} />
          </View>
          <Text style={[styles.addTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>Add account</Text>
          <Text style={[styles.addSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Track another wallet, bank, or cash account.
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    scroll: { paddingLeft: spacing('4') },
    scrollContent: { paddingRight: spacing('7'), gap: spacing('3') },

    card: {
      minHeight: 150,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('3.5'),
      justifyContent: 'space-between',
    },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing('3'),
    },
    lead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      flex: 1,
    },
    meta: { flex: 1, gap: spacing('0.5') },
    name: { fontSize: typography.sizes.sm },
    hint: { fontSize: typography.sizes.xs, opacity: 0.55 },
    currency: { fontSize: 10 },

    balanceLabel: { fontSize: 9, opacity: 0.5, marginBottom: spacing('1') },
    balance: { fontSize: 22, lineHeight: 26, marginBottom: spacing('3') },

    stats: { flexDirection: 'row' },
    stat: { flex: 1, gap: spacing('1') },
    statSep: { width: 1, height: 20, backgroundColor: colors.text + '0C', marginHorizontal: spacing('3') },
    statLabel: { fontSize: 9, opacity: 0.5 },
    statValue: { fontSize: 12 },

    placeholder: {
      minHeight: 150,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    placeholderInner: {
      flex: 1,
      padding: spacing('4'),
      justifyContent: 'center',
      gap: spacing('2.5'),
    },
    addIcon: { alignSelf: 'flex-start' },
    addTitle: { fontSize: typography.sizes.lg },
    addSub: { fontSize: typography.sizes.xs, lineHeight: 18, maxWidth: 180, opacity: 0.6 },
  });
