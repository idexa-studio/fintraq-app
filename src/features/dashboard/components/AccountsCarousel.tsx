import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { Building01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { resolveIcon } from '@/src/utils/icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
          <BentoPressable
            key={acc.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onPressAccount(acc.id)}
          >
            {/* Upper: identity + balance */}
            <View style={styles.upper}>
              <View style={styles.topRow}>
                <IconAvatar
                  icon={resolveIcon(acc.icon, Building01Icon)}
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
                  <Text style={[styles.currency, { fontFamily: typography.fonts.medium, color: c }]}>
                    {acc.currency}
                  </Text>
                </View>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={[styles.balanceLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  Available balance
                </Text>
                <MoneyText amount={acc.balance} currency={acc.currency} style={styles.balance} weight="bold" />
              </View>
            </View>
          </BentoPressable>
        );
      })}

      {/* Add account card */}
      <BentoPressable
        style={[styles.addCard, { width: cardWidth }]}
        onPress={onPressAdd}
      >
        <IconAvatar icon={PlusSignIcon} color={colors.primary} variant="subtle" size={36} iconSize={16} />
        <Text style={[styles.addTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
          Add account
        </Text>
      </BentoPressable>
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
      height: 124,
    },

    upper: {
      padding: spacing('4'),
      height: '100%',
      justifyContent: 'space-between',
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
    hint: { fontSize: typography.sizes.xs },
    currencyBadge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    currency: { fontSize: typography.sizes.xs },

    balanceContainer: {
      gap: spacing('0.5'),
    },
    balanceLabel: {
      fontSize: typography.sizes.xs,
    },
    balance: { fontSize: 20, lineHeight: 24 },

    addCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('2'),
      height: 124,
    },
    addTitle: { fontSize: typography.sizes.sm },
  });
