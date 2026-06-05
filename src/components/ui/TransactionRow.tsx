import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { TransactionType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const { colors, radius } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoryColor = useMemo(() => colorNumberToHex(tx.category.color), [tx.category.color]);

  const iconName = useMemo(() => resolveIcon(tx.category.icon, 'tag-outline'), [tx.category.icon]);

  const handlePress = useCallback(() => {
    onPress?.(tx);
  }, [onPress, tx]);

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? radius('xl') : 0,
    borderTopRightRadius: isFirst ? radius('xl') : 0,
    borderBottomLeftRadius: isLast ? radius('xl') : 0,
    borderBottomRightRadius: isLast ? radius('xl') : 0,
  }), [isFirst, isLast, colors.surface, radius]);

  const accountIconName = useMemo(() => resolveIcon(tx.account.icon, 'wallet-outline'), [tx.account.icon]);

  const toAccountIconName = useMemo(() => resolveIcon(tx.toAccount?.icon, 'wallet-outline'), [tx.toAccount?.icon]);

  const accountColor = useMemo(() => colorNumberToHex(tx.account.color), [tx.account.color]);

  const toAccountColor = useMemo(() =>
    tx.toAccount?.color != null
      ? colorNumberToHex(tx.toAccount.color)
      : colors.textMuted,
    [tx.toAccount?.color, colors.textMuted]
  );

  const timeText = useMemo(() => {
    return format(new Date(tx.datetime), 'h:mm a');
  }, [tx.datetime]);

  const dateText = useMemo(() => {
    const d = new Date(tx.datetime);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  }, [tx.datetime]);

  const displayTitle = useMemo(() => {
    return tx.note && tx.note.trim() ? tx.note.trim() : tx.category.name;
  }, [tx.note, tx.category.name]);

  const metaText = useMemo(() => {
    const parts = [];
    if (tx.note && tx.note.trim()) {
      parts.push(tx.category.name);
    }
    parts.push(timeText);
    if (showDate) {
      parts.push(dateText);
    }
    return parts.join(' · ');
  }, [tx.note, tx.category.name, timeText, dateText, showDate]);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <IconAvatar
        icon={iconName}
        color={categoryColor}
        variant="subtle"
        size={42}
        iconSize={18}
        style={{ borderRadius: radius('md') }}
      />

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        <View style={styles.metaRow}>
          {metaText ? (
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
              {metaText}
            </Text>
          ) : null}

          {metaText ? <Text style={styles.bullet}>·</Text> : null}

          {tx.type === 'TR' ? (
            <View style={styles.transferBadge}>
              <View style={styles.accountBadge}>
                <MaterialCommunityIcons name={accountIconName} size={11} color={accountColor} />
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  {tx.account.name}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={11} color={colors.textMuted} style={styles.transferArrow} />
              <View style={styles.accountBadge}>
                <MaterialCommunityIcons name={toAccountIconName} size={11} color={toAccountColor} />
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  {tx.toAccount?.name ?? 'Account'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.accountBadge}>
              <MaterialCommunityIcons name={accountIconName} size={11} color={accountColor} />
              <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                {tx.account.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="semibold"
          style={styles.amount}
        />
      </View>

      {!isLast && <View style={[styles.divider, { backgroundColor: colors.text + '0A' }]} />}
    </TouchableOpacity>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = ({ colors, typography, spacing }: ThemeContextType) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing('3'),
    paddingHorizontal: spacing('4'),
    gap: spacing('3'),
  },
  info: {
    flex: 1,
    gap: spacing('0.5'),
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.md,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
    flexShrink: 1,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
    flexShrink: 1,
  },
  transferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
    flexShrink: 1,
  },
  transferArrow: {
    opacity: 0.5,
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 14,
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 15,
  },
  bullet: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 14,
    color: colors.textMuted,
    opacity: 0.5,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: spacing('4') + 42 + spacing('3'), // 16 + 42 + 12 = 70px
    right: spacing('4'),
    height: 0.5,
  },
});
