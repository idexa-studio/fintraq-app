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
  const cardWidth = useMemo(() => screenWidth * 0.62, [screenWidth]);

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
            {/* Upper: identity + balance */}
            <View style={styles.upper}>
              <View style={styles.topRow}>
                <IconAvatar
                  icon={resolveIcon(acc.icon, 'wallet-outline')}
                  color={c}
                  variant="subtle"
                  size={34}
                  iconSize={14}
                />
                <View style={styles.meta}>
                  <Text style={[styles.name, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.hint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
                    {hint}
                  </Text>
                </View>
                <View style={[styles.currencyBadge, { backgroundColor: c + '1A' }]}>
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
            </View>

            {/* Lower: stats on contrasting background */}
            <View style={styles.lower}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.success }]}>
                  Income
                </Text>
                <MoneyText amount={acc.income} currency={acc.currency} type="CR" compact style={styles.statValue} />
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>
                  Expenses
                </Text>
                <MoneyText amount={acc.expense} currency={acc.currency} type="DR" compact style={styles.statValue} />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Add account card */}
      <TouchableOpacity
        style={[styles.addCard, { width: cardWidth }]}
        onPress={onPressAdd}
        activeOpacity={0.85}
      >
        <IconAvatar icon="plus" color={colors.primary} variant="subtle" size={48} iconSize={22} />
        <View style={styles.addText}>
          <Text style={[styles.addTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
            Add account
          </Text>
          <Text style={[styles.addSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Track another wallet, bank, or cash.
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    scroll: { paddingLeft: spacing('3') },
    scrollContent: { paddingRight: spacing('5'), gap: spacing('2.5') },

    card: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
      minHeight: 154,
    },

    upper: {
      padding: spacing('4'),
      gap: spacing('2.5'),
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
      borderRadius: radius('full'),
    },
    currency: { fontSize: 11 },

    balanceLabel: { fontSize: 11, opacity: 0.45, marginBottom: spacing('0.5') },
    balance: { fontSize: 22, lineHeight: 26 },

    lower: {
      flexDirection: 'row',
      gap: spacing('4'),
      backgroundColor: colors.background + '40',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2.5'),
    },
    stat: { gap: spacing('0.5') },
    statLabel: { fontSize: 11 },
    statValue: { fontSize: 13, fontFamily: typography.fonts.semibold },

    addCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface + '80',
      borderWidth: 1.5,
      borderColor: colors.text + '12',
      borderStyle: 'dashed',
      padding: spacing('4'),
      justifyContent: 'center',
      gap: spacing('3'),
      minHeight: 154,
    },
    addText: { gap: spacing('1') },
    addTitle: { fontSize: typography.sizes.md },
    addSub: { fontSize: typography.sizes.xs, lineHeight: 18, maxWidth: 180, opacity: 0.5 },
  });
