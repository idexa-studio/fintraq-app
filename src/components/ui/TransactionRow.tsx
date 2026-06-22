import { Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from './BentoPressable';

type TransactionData = {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  datetime: string;
  account: {
    name: string;
    currency: string;
    icon: string;
    color: number;
    accountType?: AccountType | null;
  };
  category: {
    name: string;
    icon: string;
    color: number;
  };
  toAccount?: {
    name: string | null;
    icon: string | null;
    color: number | null;
    accountType?: AccountType | null;
  } | null;
};

type Props = {
  tx: TransactionData;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate,
}: Props) {
  const theme = useTheme();
  const { colors, radius, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoryColor = useMemo(() => colorNumberToHex(tx.category.color), [tx.category.color]);
  const categoryIcon = useMemo(() => resolveIcon(tx.category.icon, Tag01Icon), [tx.category.icon]);
  const accountIcon = useMemo(
    () => resolveAccountTypeIcon(tx.account.accountType),
    [tx.account.accountType],
  );
  const toAccountIcon = useMemo(
    () => resolveAccountTypeIcon(tx.toAccount?.accountType),
    [tx.toAccount?.accountType],
  );
  const accountColor = useMemo(() => colorNumberToHex(tx.account.color), [tx.account.color]);
  const toAccountColor = useMemo(
    () => (tx.toAccount?.color != null ? colorNumberToHex(tx.toAccount.color) : colors.textMuted),
    [tx.toAccount?.color, colors.textMuted],
  );

  const displayTitle = useMemo(
    () => (tx.note?.trim() ? tx.note.trim() : tx.category.name),
    [tx.note, tx.category.name],
  );

  const dateTimeText = useMemo(() => {
    const d = new Date(tx.datetime);
    const time = format(d, 'h:mm a');
    if (!showDate) return time;
    const dateLabel = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d');
    return `${time} · ${dateLabel}`;
  }, [tx.datetime, showDate]);

  const containerStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
      marginBottom: isLast ? 0 : spacing('0.5'),
    }),
    [isFirst, isLast, colors.surface, radius, spacing],
  );

  const handlePress = useCallback(() => onPress?.(tx), [onPress, tx]);

  return (
    <BentoPressable style={[styles.row, containerStyle]} onPress={handlePress} scaleOnPress={false}>
      <IconAvatar
        icon={categoryIcon}
        color={categoryColor}
        variant="subtle"
        size={40}
        iconSize={16}
      />

      {/* Centre: title + account meta */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>

        {tx.type === 'TR' ? (
          <View style={styles.metaRow}>
            <HugeiconsIcon icon={accountIcon} size={10} color={accountColor} />
            <Text style={styles.metaText} numberOfLines={1}>{tx.account.name}</Text>
            <Text style={styles.metaSep}>→</Text>
            <HugeiconsIcon icon={toAccountIcon} size={10} color={toAccountColor} />
            <Text style={styles.metaText} numberOfLines={1}>{tx.toAccount?.name ?? '—'}</Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <HugeiconsIcon icon={accountIcon} size={10} color={accountColor} />
            <Text style={styles.metaText} numberOfLines={1}>{tx.account.name}</Text>
          </View>
        )}
      </View>

      {/* Right: amount + time */}
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="semibold"
          style={styles.amount}
        />
        <Text style={styles.time} numberOfLines={1}>{dateTimeText}</Text>
      </View>
    </BentoPressable>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = ({ colors, typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('3.5'),
      gap: spacing('2.5'),
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing('0.5'),
    },
    title: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.text,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      flexShrink: 1,
      minWidth: 0,
    },
    metaText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 14,
      flexShrink: 1,
      minWidth: 0,
    },
    metaSep: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.5,
    },
    right: {
      alignItems: 'flex-end',
      gap: spacing('0.5'),
    },
    amount: {
      fontSize: typography.sizes.sm,
      lineHeight: 18,
    },
    time: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      lineHeight: 14,
    },
  });
