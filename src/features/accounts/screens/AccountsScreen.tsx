import { PageBackground } from '@/src/components/ui/PageBackground';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { OptionsDialog, OptionsDialogOption } from '@/src/components/ui/OptionsDialog';
import { useAccounts, useDeleteAccount } from '@/src/features/accounts/hooks/accounts';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Account } from '../api/accounts';

export const AccountsScreen = React.memo(function AccountsScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: accounts } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const router = useRouter();

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const closeOptions = useCallback(() => setShowOptions(false), []);
  const closeDelete = useCallback(() => setShowDeleteConfirm(false), []);

  const handleMenuOpen = useCallback((account: Account) => {
    setSelectedAccount(account);
    setShowOptions(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedAccount) return;
    router.push(`/(main)/accounts/form?id=${selectedAccount.id}`);
  }, [selectedAccount, router]);

  const handleDeletePress = useCallback(() => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!selectedAccount) return;
    deleteAccount.mutate(selectedAccount.id);
    setSelectedAccount(null);
    setShowDeleteConfirm(false);
  }, [selectedAccount, deleteAccount]);

  const handleCardPress = useCallback((accountId: number) => {
    router.push(`/transactions?accountId=${accountId}`);
  }, [router]);

  const handleAdd = useCallback(() => {
    router.push('/(main)/accounts/form');
  }, [router]);

  const accountOptions = useMemo((): OptionsDialogOption[] => {
    if (!selectedAccount) return [];
    return [
      { key: 'edit', label: 'Edit', icon: 'pencil-outline', onPress: handleEdit },
      { key: 'delete', label: 'Delete', icon: 'trash-can-outline', destructive: true, onPress: handleDeletePress },
    ];
  }, [selectedAccount, handleEdit, handleDeletePress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <Header title="Accounts" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {accounts?.map((account) => {
          const accColor = colorNumberToHex(account.color);
          return (
            <TouchableOpacity
              key={account.id}
              style={styles.card}
              onPress={() => handleCardPress(account.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLead}>
                  <IconAvatar
                    icon={resolveIcon(account.icon, 'wallet-outline')}
                    color={accColor} variant="subtle"
                    size={36}
                    iconSize={16}
                  />
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={styles.cardHint}>
                      {account.accountNumber && account.accountNumber !== 'N/A'
                        ? `•••• ${account.accountNumber.slice(-4)}`
                        : 'Tap to view activity'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardTopRight}>
                  <View style={[styles.currencyBadge, { backgroundColor: accColor + '12' }]}>
                    <Text style={[styles.currencyText, { color: accColor }]}>
                      {account.currency}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleMenuOpen(account)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.4}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.balanceLabel}>
                Available
              </Text>
              <MoneyText
                amount={account.balance}
                currency={account.currency}
                weight="bold"
                style={styles.cardBalance}
              />

              <View style={styles.cardStats}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>
                    Total in
                  </Text>
                  <MoneyText amount={account.income} currency={account.currency} type="CR" compact style={styles.statValue} />
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>
                    Total out
                  </Text>
                  <MoneyText amount={account.expense} currency={account.currency} type="DR" compact style={styles.statValue} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {accounts && accounts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              No accounts yet
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
        <MaterialCommunityIcons name="plus" size={24} color={colors.background} />
      </TouchableOpacity>

      <OptionsDialog
        visible={showOptions}
        onClose={closeOptions}
        title={selectedAccount?.name ?? 'Account'}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={closeDelete}
        title="Delete account"
        message={selectedAccount ? `Delete ${selectedAccount.name}? All linked transactions will be permanently removed.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteAccount.isPending}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
    },
    bottomPad: { height: spacing('9') },

    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginBottom: spacing('3'),
      gap: spacing('3'),
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardLead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      flex: 1,
    },
    cardMeta: {
      flex: 1,
      gap: spacing('0.5'),
    },
    cardName: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: typography.sizes.md,
    },
    cardHint: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      opacity: 0.65,
    },
    cardTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      marginLeft: spacing('2'),
    },
    currencyBadge: {
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    currencyText: {
      fontFamily: typography.fonts.bold,
      fontSize: typography.sizes.xs,
    },
    balanceLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
    },
    cardBalance: {
      fontSize: 26,
    },
    cardStats: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    statCol: {
      flex: 1,
      gap: spacing('1'),
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.text + '0C',
    },
    statLabel: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
    },
    statValue: {
      fontSize: 14,
    },

    fab: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? spacing('9') : spacing('6'),
      right: layout.screenPadding,
      width: 56,
      height: 56,
      borderRadius: radius('lg'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },

    empty: {
      alignItems: 'center',
      paddingVertical: spacing('9'),
    },
    emptyText: {
      fontSize: typography.sizes.sm,
      opacity: 0.4,
    },
  });
