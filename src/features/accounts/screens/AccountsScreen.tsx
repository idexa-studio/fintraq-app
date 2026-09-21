import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { OptionsDialog, OptionsDialogOption } from '@/src/components/ui/OptionsDialog';
import { useAccounts, useDeleteAccount } from '@/src/features/accounts/hooks/accounts';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete01Icon,
  MoreVerticalCircle01Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { WalkthroughOverlay, ACCOUNTS_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { StorageKeys } from '@/src/constants/keys';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Account } from '../api/accounts';
import { alpha } from '@/src/theme/tokens';

export const AccountsScreen = React.memo(function AccountsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { data: accounts } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const router = useRouter();
  const { showAlert } = usePremium();

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount.mutateAsync(selectedAccount.id);
      setSelectedAccount(null);
      setShowDeleteConfirm(false);
    } catch (e: any) {
      setShowDeleteConfirm(false);
      showAlert({
        title: t('accounts.cannotDelete'),
        message: e.message || t('accounts.deleteFailed'),
        type: 'error',
      });
    }
  }, [selectedAccount, deleteAccount, showAlert, t]);

  const handleCardPress = useCallback((accountId: number) => {
    router.push(`/(main)/accounts/${accountId}`);
  }, [router]);

  const handleAdd = useCallback(() => {
    router.push('/(main)/accounts/form');
  }, [router]);

  const accountOptions = useMemo((): OptionsDialogOption[] => {
    if (!selectedAccount) return [];
    const hasTransactions = selectedAccount.income > 0 || selectedAccount.expense > 0;
    return [
      { key: 'edit', label: t('accounts.edit'), icon: PencilEdit01Icon, onPress: handleEdit },
      {
        key: 'delete',
        label: t('accounts.delete'),
        icon: Delete01Icon,
        destructive: true,
        disabled: hasTransactions,
        hint: hasTransactions ? t('accounts.removeTransactions') : undefined,
        onPress: handleDeletePress,
      },
    ];
  }, [selectedAccount, handleEdit, handleDeletePress, t]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />

      <Header title={t('accounts.title')} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {accounts?.map((account) => {
          const accColor = colorNumberToHex(account.color);
          const hasAccountNumber = account.accountNumber && account.accountNumber !== 'N/A';
          return (
            <BentoPressable
              key={account.id}
              style={styles.card}
              onPress={() => handleCardPress(account.id)}
            >
              {/* ── Card top row: avatar + name + currency + menu ── */}
              <View style={styles.cardTop}>
                <View style={styles.cardLead}>
                  <IconAvatar
                    icon={resolveAccountTypeIcon(account.accountType)}
                    color={accColor}
                    variant="subtle"
                    size={44}
                    iconSize={20}
                  />
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {account.name}
                    </Text>
                    {hasAccountNumber ? (
                      <Text style={styles.cardHint}>
                        {'•••• ' + account.accountNumber!.slice(-4)}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.cardTopRight}>
                  <View style={[styles.currencyBadge, { backgroundColor: colors.background }]}>
                    <Text style={styles.currencyText}>{account.currency}</Text>
                  </View>
                  <BentoPressable
                    onPress={() => handleMenuOpen(account)}
                    style={styles.iconBtn}
                  >
                    <HugeiconsIcon icon={MoreVerticalCircle01Icon} size={20} color={colors.textMuted} />
                  </BentoPressable>
                </View>
              </View>

              {/* ── Balance section ── */}
              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>{t('accounts.availableBalance')}</Text>
                <MoneyText
                  amount={account.balance}
                  currency={account.currency}
                  weight="bold"
                  style={styles.cardBalance}
                />
              </View>

              {/* ── Divider ── */}
              <View style={styles.divider} />

              {/* ── Stats row ── */}
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <View style={styles.statLabelRow}>
                    <HugeiconsIcon icon={ArrowUp01Icon} size={12} color={colors.success} />
                    <Text style={styles.statLabel}>{t('accounts.totalIn')}</Text>
                  </View>
                  <MoneyText
                    amount={account.income}
                    currency={account.currency}
                    type="CR"
                    compact
                    style={[styles.statValue, { color: colors.success }]}
                  />
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCell}>
                  <View style={styles.statLabelRow}>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={12} color={colors.danger} />
                    <Text style={styles.statLabel}>{t('accounts.totalOut')}</Text>
                  </View>
                  <MoneyText
                    amount={account.expense}
                    currency={account.currency}
                    type="DR"
                    compact
                    style={[styles.statValue, { color: colors.danger }]}
                  />
                </View>
              </View>
            </BentoPressable>
          );
        })}

        {accounts && accounts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('accounts.none')}</Text>
          </View>
        ) : null}
      </ScrollView>

      <BentoPressable style={styles.fab} onPress={handleAdd}>
        <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.primaryForeground} />
      </BentoPressable>

      <OptionsDialog
        visible={showOptions}
        onClose={closeOptions}
        title={selectedAccount?.name ?? t('accounts.account')}
        options={accountOptions}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={closeDelete}
        title={t('accounts.deleteTitle')}
        message={selectedAccount ? t('accounts.deleteMessage', { name: selectedAccount.name }) : undefined}
        confirmLabel={t('accounts.delete')}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteAccount.isPending}
      />
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_ACCOUNTS} steps={ACCOUNTS_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, shadow, layout }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: insets.bottom > 0 ? insets.bottom + 80 + 24 : 110,
    },

    /* ── Account card ── */
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('4'),
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      fontFamily: typography.styles.rowLabel.fontFamily,
      color: colors.text,
      ...typography.metrics.md,
    },
    cardHint: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      ...typography.metrics.xs,
    },
    cardTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      marginLeft: spacing('2'),
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -spacing('1'),
    },
    currencyBadge: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    currencyText: {
      fontFamily: typography.styles.badge.fontFamily,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },

    /* ── Balance ── */
    balanceSection: {
      marginTop: spacing('4'),
      gap: spacing('1'),
    },
    balanceLabel: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      ...typography.metrics.xs,
    },
    cardBalance: {
      ...typography.metrics.xxxl,
      lineHeight: 34,
    },

    /* ── Divider ── */
    divider: {
      height: 1,
      backgroundColor: alpha(colors.text, 'faint'),
      marginTop: spacing('4'),
      marginBottom: spacing('3'),
    },

    /* ── Stats ── */
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statCell: {
      flex: 1,
      gap: spacing('1'),
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: alpha(colors.text, 'faint'),
      marginHorizontal: spacing('4'),
    },
    statLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
    },
    statLabel: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      ...typography.metrics.xs,
    },
    statValue: {
      ...typography.metrics.md,
      fontFamily: typography.styles.sectionLabel.fontFamily,
    },

    /* ── FAB ── */
    fab: {
      position: 'absolute',
      bottom: insets.bottom > 0 ? insets.bottom + 8 + 60 + 16 : 16 + 60 + 16,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('xl'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow('lg'),
    },

    /* ── Empty state ── */
    empty: {
      alignItems: 'center',
      paddingVertical: spacing('9'),
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
      opacity: 0.5,
    },
  });
