import { ConfirmDialog, EmptyState, IconAvatar, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, MoneyText, OptionsDialog, Screen, Text } from '@/src/components/ui';
import type { OptionsDialogOption } from '@/src/components/ui';
import type { Account } from '@/data/repositories/accounts';
import { useAccounts, useDeleteAccount } from '@/features/accounts';
import { NetWorthCard } from '@/src/features/accounts/components/NetWorthCard';
import { netWorthByCurrency } from '@/src/features/accounts/utils/net-worth';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useSettings } from '@/features/settings';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { toErrorMessage } from '@/shared/errors';

export const AccountsScreen = React.memo(function AccountsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: accounts } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const router = useRouter();
  const { showAlert } = usePremium();
  const { profile } = useSettings();
  const netWorth = useMemo(() => netWorthByCurrency(accounts ?? [], profile.defaultCurrency), [accounts, profile.defaultCurrency]);

  // The hero shows one currency; its accounts lead the list, other currencies follow in order.
  const [pickedCurrency, setPickedCurrency] = useState<string | null>(null);
  const hero = netWorth.find((g) => g.currency === pickedCurrency) ?? netWorth[0];
  const groups = useMemo(() => (hero ? [hero, ...netWorth.filter((g) => g !== hero)] : []), [hero, netWorth]);
  const currencies = useMemo(() => netWorth.map((g) => g.currency), [netWorth]);

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
    } catch (e) {
      setShowDeleteConfirm(false);
      showAlert({
        title: t('accounts.cannotDelete'),
        message: toErrorMessage(e, t('accounts.deleteFailed')),
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
      { key: 'edit', label: t('accounts.edit'), icon: 'pencil-simple', onPress: handleEdit },
      {
        key: 'delete',
        label: t('accounts.delete'),
        icon: 'trash',
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
        </>
      }
    >
      {/* Adding lives on the tab bar's centre button, which means "new account" on this tab. */}
      {accounts && accounts.length === 0 ? (
        <EmptyState icon="wallet" title={t('accounts.none')} actionLabel={t('accountForm.new')} onAction={handleAdd} />
      ) : null}

      {hero ? (
        <NetWorthCard group={hero} currencies={currencies} onCurrencySelect={setPickedCurrency} />
      ) : null}

      {groups.map((group) => (
        <ListGroup
          key={group.currency}
          title={`${group.currency} · ${group.accounts.length === 1 ? t('transactions.oneAccount') : t('transactions.accountsCount', { count: group.accounts.length })}`}
        >
          {group.accounts.map((account) => {
            const masked = account.accountNumber && account.accountNumber !== 'N/A' ? `•••• ${account.accountNumber.slice(-4)}` : null;
            // Share of what is owned in this currency; an overdrawn account or card owes instead.
            const share = account.balance > 0 && group.assets > 0 ? Math.round((account.balance / group.assets) * 100) : null;
            const detail = [masked, share !== null ? t('accounts.shareOfAssets', { pct: share }) : null].filter(Boolean).join('  ·  ');
            return (
              <ListItem
                key={account.id}
                title={account.name}
                subtitle={detail || undefined}
                leading={<IconAvatar icon={resolveAccountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} size={LIST_ITEM_LEADING_SIZE + 4} />}
                trailing={
                  <MoneyText
                    amount={Math.abs(account.balance)}
                    currency={account.currency}
                    type={account.balance < 0 ? 'DR' : 'NONE'}
                    weight="semibold"
                    style={styles.balance}
                    numberOfLines={1}
                  />
                }
                onPress={() => handleCardPress(account.id)}
                onLongPress={() => handleMenuOpen(account)}
              />
            );
          })}
        </ListGroup>
      ))}

      {accounts && accounts.length > 0 ? (
        <ListGroup>
          <ListItem icon="plus" iconColor={theme.colors.primaryInk} title={t('accountForm.new')} subtitle={t('accounts.addHint')} onPress={handleAdd} />
        </ListGroup>
      ) : null}

      {accounts && accounts.length > 0 ? (
        <Text variant="caption" tone="muted" align="center" style={styles.hint}>
          {t('accounts.manageHint')}
        </Text>
      ) : null}
    </Screen>
  );
});

const createStyles = ({ spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    content: { gap: spacing('5') },
    balance: { ...typography.metrics.md },
    hint: { marginTop: -spacing('2') },
  });
