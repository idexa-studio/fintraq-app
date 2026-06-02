import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { TransactionType } from '../../types';
import { colorNumberToHex } from '../../utils/format';
import { IconAvatar } from './IconAvatar';
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
    name: string | null;
  } | null;
};

type Props = {
  tx: TransactionData;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

const TYPE_CONFIG: Record<TransactionType, { label: string; colorKey: 'success' | 'danger' | 'info' }> = {
  CR: { label: 'Income',   colorKey: 'success' },
  DR: { label: 'Expense',  colorKey: 'danger'  },
  TR: { label: 'Transfer', colorKey: 'info'     },
};

export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate,
}: Props) {
  const theme = useTheme();
  const { colors, radius, spacing, sizes, typography } = theme;
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

  const typeConfig = TYPE_CONFIG[tx.type];
  const typeColor = colors[typeConfig.colorKey];

  const containerStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderTopLeftRadius: isFirst ? radius('xl') : 0,
    borderTopRightRadius: isFirst ? radius('xl') : 0,
    borderBottomLeftRadius: isLast ? radius('xl') : 0,
    borderBottomRightRadius: isLast ? radius('xl') : 0,
    marginBottom: isLast ? 0 : spacing('0.5'),
  }), [isFirst, isLast, colors.surface, radius, spacing]);

  const metaText = tx.type === 'TR'
    ? `${tx.account.name} → ${tx.toAccount?.name ?? 'Account'}`
    : tx.account.name;

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <IconAvatar icon={iconName} color={categoryColor} variant="solid" size={sizes.iconButton.lg} iconSize={18} />

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {tx.note || tx.category.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {typeConfig.label} · {metaText}
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
    paddingHorizontal: spacing('4'),
    gap: spacing('3'),
  },
  info: {
    flex: 1,
    gap: spacing('1'),
  },
  title: {
    fontFamily: typography.fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1.5'),
    flexShrink: 1,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: radius('full'),
    flexShrink: 0,
  },
  meta: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
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
    opacity: 0.55,
  },
});
