import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PageBackground } from '@/src/components/ui/PageBackground';
import {
  useDeleteTransaction,
  useTransactionDetail,
} from '@/src/features/transactions/hooks/transactions';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Delete02Icon,
  NoteIcon,
  PencilEdit01Icon,
  Tag01Icon,
  UserIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TransactionType, string> = {
  CR: 'Income',
  DR: 'Expense',
  TR: 'Transfer',
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

type InfoRowStyles = ReturnType<typeof createInfoRowStyles>;

type InfoRowProps = {
  rowStyles: InfoRowStyles;
  icon: IconSvgElement;
  label: string;
  isFirst?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
};

const InfoRow = React.memo(function InfoRow({
  rowStyles,
  icon,
  label,
  isFirst,
  isLast,
  children,
}: InfoRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        rowStyles.row,
        isFirst && rowStyles.rowFirst,
        isLast && rowStyles.rowLast,
        !isLast && rowStyles.rowDivider,
      ]}
    >
      <View style={rowStyles.iconWrap}>
        <HugeiconsIcon icon={icon} size={16} color={colors.textMuted} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.valueWrap}>{children}</View>
    </View>
  );
});

// ─── AccountChip ─────────────────────────────────────────────────────────────

type AccountChipProps = {
  rowStyles: InfoRowStyles;
  icon: IconSvgElement;
  color: string;
  name: string;
};

const AccountChip = React.memo(function AccountChip({ rowStyles, icon, color, name }: AccountChipProps) {
  return (
    <View style={rowStyles.chip}>
      <IconAvatar icon={icon} color={color} variant="subtle" size={20} iconSize={10} />
      <Text style={rowStyles.chipText}>{name}</Text>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const TransactionDetailScreen = React.memo(function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const rowStyles = useMemo(() => createInfoRowStyles(theme), [theme]);

  const { data: tx, isLoading } = useTransactionDetail(txId);
  const { mutateAsync: deleteTx } = useDeleteTransaction();

  // ── Derived values ──
  const categoryColor = useMemo(
    () => (tx ? colorNumberToHex(tx.category.color) : colors.primary),
    [tx, colors.primary],
  );
  const categoryIcon = useMemo(
    () => (tx ? resolveIcon(tx.category.icon, Tag01Icon) : Tag01Icon),
    [tx],
  );
  const accountIcon = useMemo(
    () => resolveAccountTypeIcon(tx?.account.accountType as AccountType | null),
    [tx?.account.accountType],
  );
  const accountColor = useMemo(
    () => (tx ? colorNumberToHex(tx.account.color) : colors.textMuted),
    [tx, colors.textMuted],
  );
  const toAccountIcon = useMemo(
    () => resolveAccountTypeIcon(tx?.toAccount?.accountType as AccountType | null),
    [tx?.toAccount?.accountType],
  );
  const toAccountColor = useMemo(
    () => (tx?.toAccount?.color != null ? colorNumberToHex(tx.toAccount.color) : colors.textMuted),
    [tx?.toAccount?.color, colors.textMuted],
  );
  const personColor = useMemo(
    () => (tx?.person?.color != null ? colorNumberToHex(tx.person.color) : colors.primary),
    [tx?.person?.color, colors.primary],
  );

  const typeColor = useMemo(() => {
    if (!tx) return colors.primary;
    return tx.type === 'CR' ? colors.success : tx.type === 'DR' ? colors.danger : colors.info;
  }, [tx, colors]);

  const displayTitle = useMemo(
    () => (tx ? (tx.note?.trim() || tx.category.name) : ''),
    [tx],
  );

  const dateStr = useMemo(
    () => (tx ? format(new Date(tx.datetime), 'EEEE, d MMMM yyyy') : ''),
    [tx],
  );
  const timeStr = useMemo(
    () => (tx ? format(new Date(tx.datetime), 'h:mm a') : ''),
    [tx],
  );

  const personInitials = useMemo(() => {
    if (!tx?.person?.name) return '';
    return tx.person.name
      .trim()
      .split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }, [tx?.person?.name]);

  const hasNote = useMemo(() => Boolean(tx?.note?.trim()), [tx?.note]);
  const hasPerson = useMemo(() => tx?.person?.name != null, [tx?.person?.name]);
  const isTransfer = tx?.type === 'TR';
  const hasToAccount = isTransfer && tx?.toAccount?.name != null;

  // ── Handlers ──
  const handleEdit = useCallback(() => {
    router.push(`/transactions/edit/${txId}`);
  }, [router, txId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete transaction',
      'This will reverse the balance impact and cannot be undone.',
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

  const headerRight = useMemo(
    () => (
      <View style={styles.headerActions}>
        <BentoPressable style={styles.iconBtn} onPress={handleDelete}>
          <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.danger} />
        </BentoPressable>
        <BentoPressable style={styles.iconBtn} onPress={handleEdit}>
          <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={colors.text} />
        </BentoPressable>
      </View>
    ),
    [styles, colors, handleDelete, handleEdit],
  );

  // ── Loading / not-found ──
  if (isLoading) {
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

  if (!tx) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PageBackground />
        <Header title="Transaction" showBack />
        <View style={styles.loading}>
          <Text style={styles.missingText}>Transaction not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Determine last row index for bottom-radius ──
  // rows: Date → Account → (To Account?) → Category → (Note?) → (Person | Created)
  const lastRowIsNote = !hasPerson && hasNote;
  const lastRowIsPerson = hasPerson;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="Transaction" showBack rightAction={headerRight} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={[styles.heroCard, { backgroundColor: typeColor + '10' }]}>
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
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {TYPE_LABELS[tx.type]}
            </Text>
          </View>
        </View>

        {/* ── Detail rows ── */}
        <View style={styles.section}>

          {/* Date */}
          <InfoRow
            rowStyles={rowStyles}
            icon={Calendar03Icon}
            label="Date"
            isFirst
            isLast={false}
          >
            <Text style={rowStyles.valueText}>{dateStr}</Text>
            <Text style={rowStyles.valueSub}>{timeStr}</Text>
          </InfoRow>

          {/* Account / From */}
          <InfoRow
            rowStyles={rowStyles}
            icon={Wallet01Icon}
            label={isTransfer ? 'From' : 'Account'}
          >
            <AccountChip
              rowStyles={rowStyles}
              icon={accountIcon}
              color={accountColor}
              name={tx.account.name}
            />
          </InfoRow>

          {/* To account (transfer only) */}
          {hasToAccount && (
            <InfoRow rowStyles={rowStyles} icon={ArrowRight01Icon} label="To">
              <AccountChip
                rowStyles={rowStyles}
                icon={toAccountIcon}
                color={toAccountColor}
                name={tx.toAccount!.name!}
              />
            </InfoRow>
          )}

          {/* Category */}
          <InfoRow
            rowStyles={rowStyles}
            icon={Tag01Icon}
            label="Category"
            isLast={!hasNote && !hasPerson}
          >
            <AccountChip
              rowStyles={rowStyles}
              icon={categoryIcon}
              color={categoryColor}
              name={tx.category.name}
            />
          </InfoRow>

          {/* Note */}
          {hasNote && (
            <InfoRow
              rowStyles={rowStyles}
              icon={NoteIcon}
              label="Note"
              isLast={lastRowIsNote}
            >
              <Text style={rowStyles.valueText}>{tx.note!.trim()}</Text>
            </InfoRow>
          )}

          {/* Person */}
          {hasPerson && (
            <InfoRow
              rowStyles={rowStyles}
              icon={UserIcon}
              label="Person"
              isLast={lastRowIsPerson}
            >
              <View style={rowStyles.chip}>
                <View style={[rowStyles.personAvatar, { backgroundColor: personColor + '18' }]}>
                  <Text style={[rowStyles.personInitials, { color: personColor }]}>
                    {personInitials}
                  </Text>
                </View>
                <View>
                  <Text style={rowStyles.chipText}>{tx.person!.name}</Text>
                  {(tx.person!.designation || tx.person!.company) ? (
                    <Text style={rowStyles.valueSub}>
                      {[tx.person!.designation, tx.person!.company].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </InfoRow>
          )}

          {/* Created fallback when no person */}
          {!hasPerson && (
            <InfoRow
              rowStyles={rowStyles}
              icon={Calendar03Icon}
              label="Created"
              isLast
            >
              <Text style={rowStyles.valueSub}>
                {format(new Date(tx.createdAt), 'd MMM yyyy')}
              </Text>
            </InfoRow>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const createInfoRowStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      gap: spacing('3'),
    },
    rowFirst: {
      borderTopLeftRadius: radius('xl'),
      borderTopRightRadius: radius('xl'),
    },
    rowLast: {
      borderBottomLeftRadius: radius('xl'),
      borderBottomRightRadius: radius('xl'),
    },
    rowDivider: { marginBottom: 1 },
    iconWrap: { width: 20, alignItems: 'center' },
    label: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      width: 72,
    },
    valueWrap: { flex: 1 },
    valueText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    valueSub: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: 1,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    chipText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    personAvatar: {
      width: 24,
      height: 24,
      borderRadius: radius('xl'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    personInitials: {
      fontFamily: typography.styles.profileMono.fontFamily,
      fontSize: typography.sizes.xxs,
    },
  });

const createStyles = (
  { colors, typography, spacing, radius, layout }: ThemeContextType,
  insets: { bottom: number },
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    missingText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    content: {
      paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 40,
      gap: spacing('3'),
      paddingTop: spacing('2'),
    },

    // Header actions
    headerActions: { flexDirection: 'row', gap: spacing('2') },
    iconBtn: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero card
    heroCard: {
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('2xl'),
      padding: spacing('6'),
      alignItems: 'center',
      gap: spacing('2'),
    },
    heroTitle: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.lg,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing('1'),
    },
    heroAmount: {
      fontSize: 36,
      lineHeight: 42,
      letterSpacing: -0.5,
    },
    typeBadge: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    typeBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: typography.sizes.xs,
    },

    // Section
    section: { marginHorizontal: layout.screenPadding },
  });
