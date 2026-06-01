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

export const AccountsCarousel = React.memo(function AccountsCarousel({ accounts, onPressAccount, onPressAdd }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = useMemo(() => screenWidth * 0.72, [screenWidth]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {accounts.map(acc => {
        const c = colorNumberToHex(acc.color);
        const hint =
          acc.accountNumber && acc.accountNumber !== 'N/A'
            ? `•••• ${acc.accountNumber.slice(-4)}`
            : 'Tap to view';

        return (
          <TouchableOpacity
            key={acc.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onPressAccount(acc.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardContent}>
              <View style={styles.topRow}>
                <IconAvatar icon={resolveIcon(acc.icon, 'wallet-outline')} bg={c} color={colors.text} size={40} iconSize={18} />
                <View style={styles.meta}>
                  <Text style={[styles.name, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.hint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
                    {hint}
                  </Text>
                </View>
                <View style={[styles.currencyBadge, { backgroundColor: c + '18' }]}>
                  <Text style={[styles.currency, { fontFamily: typography.fonts.semibold, color: c }]}>
                    {acc.currency}
                  </Text>
                </View>
              </View>

              <View>
                <Text style={[styles.balanceLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  Available
                </Text>
                <MoneyText amount={acc.balance} currency={acc.currency} style={styles.balance} weight="bold" />
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={[styles.statTag, { fontFamily: typography.fonts.semibold, color: colors.success }]}>IN</Text>
                  <MoneyText amount={acc.income} currency={acc.currency} type="CR" compact style={styles.statValue} />
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statTag, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>OUT</Text>
                  <MoneyText amount={acc.expense} currency={acc.currency} type="DR" compact style={styles.statValue} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.addCard, { width: cardWidth }]}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <IconAvatar icon="add" bg={colors.primary} color={colors.primary} size={48} iconSize={22} />
        <Text style={[styles.addTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
          Add account
        </Text>
        <Text style={[styles.addSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          Track another wallet, bank, or cash.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    scroll: { paddingLeft: spacing('4') },
    scrollContent: { paddingRight: spacing('7'), gap: spacing('3') },

    card: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    cardContent: {
      padding: spacing('4'),
      gap: spacing('3'),
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    meta: {
      flex: 1,
      gap: spacing('0.5'),
    },
    name: { fontSize: typography.sizes.sm },
    hint: { fontSize: typography.sizes.xs, opacity: 0.55 },
    currencyBadge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('md'),
    },
    currency: { fontSize: 10 },

    balanceLabel: { fontSize: 9, opacity: 0.5, marginBottom: spacing('0.5') },
    balance: { fontSize: 26, lineHeight: 30 },

    stats: { flexDirection: 'row', gap: spacing('4') },
    stat: { gap: spacing('0.5') },
    statTag: { fontSize: 8, letterSpacing: 0.5 },
    statValue: { fontSize: 12 },

    addCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('4'),
      justifyContent: 'center',
      gap: spacing('3'),
      minHeight: 170,
    },
    addTitle: { fontSize: typography.sizes.lg },
    addSub: { fontSize: typography.sizes.xs, lineHeight: 18, maxWidth: 180, opacity: 0.6 },
  });
