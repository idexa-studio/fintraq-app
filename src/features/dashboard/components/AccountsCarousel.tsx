import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import React, { useCallback, useMemo } from 'react';
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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.7;

  const renderAccount = useCallback((acc: Account) => {
    const accColor = colorNumberToHex(acc.color);
    return (
      <TouchableOpacity
        key={acc.id}
        style={[styles.card, { width: cardWidth }]}
        onPress={() => onPressAccount(acc.id)}
        activeOpacity={0.88}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.cardLead}>
              <IconAvatar
                icon={resolveIcon(acc.icon, 'wallet-outline')}
                bg={accColor + '20'}
                color={accColor}
                size={38}
                iconSize={18}
              />
              <View style={styles.cardMeta}>
                <Text style={styles.cardName} numberOfLines={1}>{acc.name}</Text>
                <Text style={styles.cardHint}>
                  {acc.accountNumber && acc.accountNumber !== 'N/A'
                    ? `•••• ${acc.accountNumber.slice(-4)}`
                    : 'Tap to view activity'}
                </Text>
              </View>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={[styles.currencyText, { color: accColor }]}>{acc.currency}</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>AVAILABLE</Text>
          <MoneyText amount={acc.balance} currency={acc.currency} style={styles.balance} weight="bold" />

          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>TOTAL IN</Text>
              <MoneyText amount={acc.income} currency={acc.currency} style={styles.statValue} type="CR" compact />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>TOTAL OUT</Text>
              <MoneyText amount={acc.expense} currency={acc.currency} style={styles.statValue} type="DR" compact />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [cardWidth, onPressAccount, styles, colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {accounts.map(renderAccount)}

      <TouchableOpacity
        style={[styles.placeholder, { width: cardWidth }]}
        onPress={onPressAdd}
        activeOpacity={0.88}
      >
        <View style={styles.placeholderInner}>
          <IconAvatar
            icon="add"
            bg={colors.background + '88'}
            color={colors.text}
            size={44}
            iconSize={22}
            style={styles.placeholderAvatar}
          />
          <Text style={styles.placeholderTitle}>New Account</Text>
          <Text style={styles.placeholderSubtitle}>Add another wallet, bank, or cash account.</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    scroll:        { paddingLeft: spacing('4') },
    scrollContent: { paddingRight: spacing('7'), gap: spacing('3'), paddingBottom: spacing('1') },

    card: {
      minHeight: 160,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    cardInner: { padding: spacing('3.5') },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing('3'),
      gap: spacing('2.5'),
    },
    cardLead: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    cardMeta:  { flex: 1 },
    cardName: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 14,
    },
    cardHint: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 11,
      marginTop: spacing('0.5'),
    },
    currencyBadge: {
      height: 24,
      minWidth: 48,
      paddingHorizontal: spacing('2'),
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + '80',
    },
    currencyText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.8,
    },
    balanceLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: spacing('1.5'),
    },
    balance: { fontSize: 18, lineHeight: 22, marginBottom: spacing('3') },
    statRow: { flexDirection: 'row', alignItems: 'center' },
    statCol:  { flex: 1, gap: spacing('1') },
    statLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    statValue:   { fontSize: 11 },
    statDivider: { width: 1, height: 20, backgroundColor: colors.text + '0C', marginHorizontal: spacing('3') },

    placeholder: {
      minHeight: 160,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    placeholderInner: {
      flex: 1,
      minHeight: 157,
      padding: spacing('4'),
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    placeholderAvatar:   { marginBottom: spacing('3.5') },
    placeholderTitle: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 16,
      marginBottom: spacing('1.5'),
    },
    placeholderSubtitle: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      maxWidth: 180,
    },
  });
