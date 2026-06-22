import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { useTransactionDetail, useDeleteTransaction } from '@/src/features/transactions/hooks/transactions';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Tag01Icon,
  UserIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const TYPE_LABELS: Record<TransactionType, string> = {
  CR: 'Income',
  DR: 'Expense',
  TR: 'Transfer',
};

const TYPE_COLORS = (colors: { success: string; danger: string; info: string }) => ({
  CR: colors.success,
  DR: colors.danger,
  TR: colors.info,
});

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
};

function InfoRow({ icon, label, value, isLast }: InfoRowProps) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      gap: spacing('3'),
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : 1,
    }}>
      <View style={{ width: 20, alignItems: 'center' }}>{icon}</View>
      <Text style={{ fontFamily: typography.fonts.regular, fontSize: typography.sizes.sm, color: colors.textMuted, width: 72 }}>
        {label}
      </Text>
      <View style={{ flex: 1 }}>{value}</View>
    </View>
  );
}

export const TransactionDetailScreen = React.memo(function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const { data: tx, isLoading } = useTransactionDetail(txId);
  const { mutateAsync: deleteTx } = useDeleteTransaction();

  const categoryColor = useMemo(() => tx ? colorNumberToHex(tx.category.color) : colors.primary, [tx, colors.primary]);
  const categoryIcon = useMemo(() => tx ? resolveIcon(tx.category.icon, Tag01Icon) : Tag01Icon, [tx]);
  const accountIcon = useMemo(() => resolveAccountTypeIcon(tx?.account.accountType as AccountType | null), [tx]);
  const accountColor = useMemo(() => tx ? colorNumberToHex(tx.account.color) : colors.textMuted, [tx, colors.textMuted]);
  const toAccountIcon = useMemo(() => resolveAccountTypeIcon(tx?.toAccount?.accountType as AccountType | null), [tx]);
  const toAccountColor = useMemo(() => tx?.toAccount?.color != null ? colorNumberToHex(tx.toAccount.color) : colors.textMuted, [tx, colors.textMuted]);
  const personColor = useMemo(() => tx?.person?.color != null ? colorNumberToHex(tx.person.color) : colors.primary, [tx, colors.primary]);

  const typeColors = useMemo(() => TYPE_COLORS(colors), [colors]);

  const displayTitle = useMemo(() => {
    if (!tx) return '';
    return tx.note?.trim() ? tx.note.trim() : tx.category.name;
  }, [tx]);

  const dateStr = useMemo(() => tx ? format(new Date(tx.datetime), 'EEEE, d MMMM yyyy') : '', [tx]);
  const timeStr = useMemo(() => tx ? format(new Date(tx.datetime), 'h:mm a') : '', [tx]);

  const personInitials = useMemo(() => {
    if (!tx?.person?.name) return '';
    return tx.person.name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  }, [tx]);

  const handleEdit = useCallback(() => {
    router.push(`/transactions/edit/${txId}`);
  }, [router, txId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete transaction',
      'This will reverse the balance impact. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTx(txId);
            router.back();
          },
        },
      ],
    );
  }, [txId, deleteTx, router]);

  if (isLoading || !tx) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PageBackground />
        <Header title="Transaction" showBack />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const typeColor = typeColors[tx.type];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header
        title="Transaction"
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <BentoPressable style={styles.iconBtn} onPress={handleDelete}>
              <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.danger} />
            </BentoPressable>
            <BentoPressable style={styles.iconBtn} onPress={handleEdit}>
              <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={colors.text} />
            </BentoPressable>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <IconAvatar icon={categoryIcon} color={categoryColor} variant="solid" size={56} iconSize={26} />

          <Text style={styles.heroTitle} numberOfLines={2}>{displayTitle}</Text>

          <MoneyText
            amount={tx.amount}
            currency={tx.account.currency}
            type={tx.type}
            weight="bold"
            style={styles.heroAmount}
          />

          <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{TYPE_LABELS[tx.type]}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          {/* First row gets top radius */}
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: theme.radius('xl'),
            borderTopRightRadius: theme.radius('xl'),
            paddingHorizontal: theme.spacing('4'),
            paddingVertical: theme.spacing('3.5'),
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing('3'),
            marginBottom: 1,
          }}>
            <View style={{ width: 20, alignItems: 'center' }}>
              <HugeiconsIcon icon={Calendar03Icon} size={16} color={colors.textMuted} />
            </View>
            <Text style={{ fontFamily: typography.fonts.regular, fontSize: typography.sizes.sm, color: colors.textMuted, width: 72 }}>Date</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: typography.sizes.sm, color: colors.text }}>{dateStr}</Text>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 1 }}>{timeStr}</Text>
            </View>
          </View>

          {/* Account row */}
          <InfoRow
            icon={<HugeiconsIcon icon={Wallet01Icon} size={16} color={colors.textMuted} />}
            label={tx.type === 'TR' ? 'From' : 'Account'}
            value={
              <View style={styles.accountChip}>
                <IconAvatar icon={accountIcon} color={accountColor} variant="subtle" size={20} iconSize={10} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{tx.account.name}</Text>
              </View>
            }
          />

          {/* Transfer to-account */}
          {tx.type === 'TR' && tx.toAccount?.name != null && (
            <InfoRow
              icon={<HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.textMuted} />}
              label="To"
              value={
                <View style={styles.accountChip}>
                  <IconAvatar icon={toAccountIcon} color={toAccountColor} variant="subtle" size={20} iconSize={10} />
                  <Text style={[styles.infoValue, { color: colors.text }]}>{tx.toAccount.name}</Text>
                </View>
              }
            />
          )}

          {/* Category */}
          <InfoRow
            icon={<HugeiconsIcon icon={Tag01Icon} size={16} color={colors.textMuted} />}
            label="Category"
            value={
              <View style={styles.accountChip}>
                <IconAvatar icon={categoryIcon} color={categoryColor} variant="subtle" size={20} iconSize={10} />
                <Text style={[styles.infoValue, { color: colors.text }]}>{tx.category.name}</Text>
              </View>
            }
          />

          {/* Note (only if different from title, i.e. note is set) */}
          {tx.note?.trim() ? (
            <InfoRow
              icon={<HugeiconsIcon icon={Tag01Icon} size={16} color={colors.textMuted} />}
              label="Note"
              value={<Text style={[styles.infoValue, { color: colors.text }]}>{tx.note.trim()}</Text>}
            />
          ) : null}

          {/* Person */}
          {tx.person?.name != null ? (
            <InfoRow
              icon={<HugeiconsIcon icon={UserIcon} size={16} color={colors.textMuted} />}
              label="Person"
              value={
                <View style={styles.accountChip}>
                  <View style={[styles.personAvatar, { backgroundColor: personColor + '18' }]}>
                    <Text style={[styles.personInitials, { color: personColor }]}>{personInitials}</Text>
                  </View>
                  <View>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{tx.person.name}</Text>
                    {(tx.person.designation || tx.person.company) ? (
                      <Text style={[styles.infoSubValue, { color: colors.textMuted }]}>
                        {[tx.person.designation, tx.person.company].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              }
              isLast
            />
          ) : (
            <InfoRow
              icon={<HugeiconsIcon icon={Calendar03Icon} size={16} color={colors.textMuted} />}
              label="Created"
              value={<Text style={[styles.infoValue, { color: colors.textMuted }]}>{format(new Date(tx.createdAt), 'd MMM yyyy')}</Text>}
              isLast
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, insets: { bottom: number }) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
      paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 40,
      gap: spacing('3'),
    },

    headerActions: { flexDirection: 'row', gap: spacing('2') },
    iconBtn: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero
    heroCard: {
      marginHorizontal: layout.screenPadding,
      marginTop: spacing('2'),
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      alignItems: 'center',
      gap: spacing('3'),
    },
    heroTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.lg,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing('1'),
    },
    heroAmount: {
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: -1,
    },
    typeBadge: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    typeBadgeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
    },

    // Detail section
    section: {
      marginHorizontal: layout.screenPadding,
    },
    accountChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    infoValue: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
    },
    infoSubValue: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      marginTop: 1,
    },
    personAvatar: {
      width: 24,
      height: 24,
      borderRadius: radius('sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    personInitials: {
      fontFamily: typography.fonts.bold,
      fontSize: 9,
    },
  });
