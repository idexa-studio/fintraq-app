import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { IconAvatar } from './IconAvatar';
import { colorNumberToHex } from '../../utils/format';
import { TransactionType } from '../../types';
import { MoneyText } from './MoneyText';

type TransactionData = {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  datetime: string;
  account: {
    name: string;
    currency: string;
  };
  category: {
    name: string;
    icon: string;
    color: number;
  };
  toAccount?: {
    name: string;
  } | null;
};

type Props = {
  tx: TransactionData;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

/**
 * TransactionRow - Editorial Brutalist Design
 *
 * Layout:
 * - Card radius: 0 for middle items, 16px (lg) for first/last corners
 * - Padding: 14px vertical
 * - Gap: 10px between elements
 * - Icon box: 40px, 12px radius (md)
 */
export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate
}: Props) {
  const theme = useTheme();
  const { colors, radius } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoryColor = useMemo(() => colorNumberToHex(tx.category.color), [tx.category.color]);

  const iconName: keyof typeof Ionicons.glyphMap = useMemo(() =>
    tx.category.icon in Ionicons.glyphMap
      ? (tx.category.icon as keyof typeof Ionicons.glyphMap)
      : 'pricetag-outline',
    [tx.category.icon]
  );

  const handlePress = useCallback(() => {
    onPress?.(tx);
  }, [onPress, tx]);

  const isTransfer = tx.type === 'TR';

  const containerStyle = useMemo(() => ({
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? radius('lg') : 0,
    borderTopRightRadius: isFirst ? radius('lg') : 0,
    borderBottomLeftRadius: isLast ? radius('lg') : 0,
    borderBottomRightRadius: isLast ? radius('lg') : 0,
  }), [isFirst, isLast, colors.border, colors.surface, radius]);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <IconAvatar icon={iconName} bg={categoryColor + '20'} color={categoryColor} size={40} iconSize={18} />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {tx.note || tx.category.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {isTransfer
              ? `${tx.category.name} · ${tx.account.name} → ${tx.toAccount?.name ?? 'Account'}`
              : `${tx.category.name} · ${tx.account.name}`}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="bold"
          style={styles.amount}
        />
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {showDate
            ? format(new Date(tx.datetime), 'MMM d')
            : format(new Date(tx.datetime), 'HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing('3.5'),
    paddingHorizontal: spacing('3.5'),
    gap: spacing('2.5'),
  },
  info: {
    flex: 1,
    gap: spacing('1'),
  },
  title: {
    fontFamily: typography.fonts.semibold,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing('1'),
  },
  amount: {
    fontSize: 13,
  },
  date: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
  },
});
