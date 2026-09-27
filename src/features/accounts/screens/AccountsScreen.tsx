import { Badge, Card, ConfirmDialog, Divider, EmptyState, Icon, IconAvatar, IconButton, MoneyText, OptionsDialog, Screen, Text } from '@/src/components/ui';
import type { OptionsDialogOption } from '@/src/components/ui';
import { ArrowDownLeftIcon, ArrowUpRightIcon, DotsThreeVerticalIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WalletIcon } from '@/src/components/ui/icons';
import { StorageKeys } from '@/src/constants/keys';
import type { Account } from '@/src/features/accounts/api/accounts';
import { useAccounts, useDeleteAccount } from '@/src/features/accounts/hooks/accounts';
import { ACCOUNTS_WALKTHROUGH_STEPS, WalkthroughOverlay } from '@/src/features/walkthrough';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export const AccountsScreen = React.memo(function AccountsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      { key: 'edit', label: t('accounts.edit'), icon: PencilSimpleIcon, onPress: handleEdit },
      {
        key: 'delete',
        label: t('accounts.delete'),
        icon: TrashIcon,
        destructive: true,
        disabled: hasTransactions,
        hint: hasTransactions ? t('accounts.removeTransactions') : undefined,
        onPress: handleDeletePress,
      },
    ];
  }, [selectedAccount, handleEdit, handleDeletePress, t]);

  return (
    <Screen
      header={{
        title: t('accounts.title'),
        // Tab screens add from the header — the tab bar's centre + already means "add transaction".
        rightAction: <IconButton icon={PlusIcon} variant="tonal" onPress={handleAdd} accessibilityLabel={t('accountForm.new')} />,
      }}
      tabBar
      contentContainerStyle={styles.content}
      overlays={
        <>
          <OptionsDialog
            visible={showOptions}
            onClose={closeOptions}
            title={selectedAccount?.name ?? t('accounts.account')}
            options={accountOptions}
          />
          <ConfirmDialog
            destructive
            visible={showDeleteConfirm}
            onClose={closeDelete}
            title={t('accounts.deleteTitle')}
            message={selectedAccount ? t('accounts.deleteMessage', { name: selectedAccount.name }) : undefined}
            confirmLabel={t('accounts.delete')}
            onConfirm={handleDeleteConfirm}
            isLoading={deleteAccount.isPending}
          />
          <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_ACCOUNTS} steps={ACCOUNTS_WALKTHROUGH_STEPS} />
        </>
      }
    >
      {accounts && accounts.length === 0 ? (
        <EmptyState icon={WalletIcon} title={t('accounts.none')} actionLabel={t('accountForm.new')} onAction={handleAdd} />
      ) : null}

      {accounts?.map((account) => {
        const accColor = colorNumberToHex(account.color);
        const hasAccountNumber = account.accountNumber && account.accountNumber !== 'N/A';
        return (
          <Card key={account.id} onPress={() => handleCardPress(account.id)} accessibilityLabel={account.name} style={styles.card}>
            <View style={styles.cardTop}>
              <IconAvatar icon={resolveAccountTypeIcon(account.accountType)} color={accColor} size={44} />
              <View style={styles.cardMeta}>
                <Text variant="bodyStrong" numberOfLines={1}>{account.name}</Text>
                {hasAccountNumber ? (
                  <Text variant="caption" tone="muted">{'•••• ' + account.accountNumber!.slice(-4)}</Text>
                ) : null}
              </View>
              <Badge label={account.currency} variant="muted" style={styles.centered} />
              <IconButton
                icon={DotsThreeVerticalIcon}
                variant="ghost"
                size="sm"
                onPress={() => handleMenuOpen(account)}
                accessibilityLabel={t('categories.manage')}
              />
            </View>

            <View style={styles.balance}>
              <Text variant="caption" tone="muted">{t('accounts.availableBalance')}</Text>
              <MoneyText amount={account.balance} currency={account.currency} weight="bold" style={styles.balanceValue} />
            </View>

            <Divider />

            <View style={styles.stats}>
              <View style={styles.statCell}>
                <View style={styles.statLabel}>
                  <Icon icon={ArrowDownLeftIcon} size={14} color={colors.success} weight="bold" />
                  <Text variant="caption" tone="muted">{t('accounts.totalIn')}</Text>
                </View>
                <MoneyText amount={account.income} currency={account.currency} type="CR" compact style={styles.statValue} />
              </View>
              <Divider vertical />
              <View style={styles.statCell}>
                <View style={styles.statLabel}>
                  <Icon icon={ArrowUpRightIcon} size={14} color={colors.danger} weight="bold" />
                  <Text variant="caption" tone="muted">{t('accounts.totalOut')}</Text>
                </View>
                <MoneyText amount={account.expense} currency={account.currency} type="DR" compact style={styles.statValue} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
});

const createStyles = ({ spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    content: { gap: spacing('3') },
    card: { gap: spacing('4') },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    cardMeta: { flex: 1, gap: 2 },
    centered: { alignSelf: 'center' },
    balance: { gap: spacing('0.5') },
    balanceValue: { ...typography.variants.amountLarge },
    stats: { flexDirection: 'row', alignItems: 'stretch', gap: spacing('4') },
    statCell: { flex: 1, gap: spacing('1') },
    statLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing('1') },
    statValue: { ...typography.variants.amount },
  });
