import { Text } from '@/src/components/ui/Text';
import { Icon } from '@/src/components/ui/Icon';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import { isToday, isYesterday } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { AccessibilityActionEvent, AccessibilityActionInfo, StyleSheet, View } from 'react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTranslation } from 'react-i18next';
import { Divider } from '@/src/components/ui/Divider';

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
  /** Screen-reader equivalents of gestures (e.g. swipe actions), which assistive tech can't perform. */
  accessibilityActions?: AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
};

export const TransactionRow = React.memo(function TransactionRow({
  tx,
  onPress,
  isFirst,
  isLast,
  showDate,
  accessibilityActions,
  onAccessibilityAction,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, radius, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const categoryColor = useMemo(() => colorNumberToHex(tx.category.color), [tx.category.color]);
  const categoryIcon = useMemo(() => resolveIcon(tx.category.icon, 'tag'), [tx.category.icon]);
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
    const time = formatDate(d, { hour: 'numeric', minute: '2-digit' });
    if (!showDate) return time;
    const dateLabel = isToday(d) ? t('common.today') : isYesterday(d) ? t('common.yesterday') : formatDate(d, { day: 'numeric', month: 'short' });
    return `${time} · ${dateLabel}`;
  }, [tx.datetime, showDate, t]);

  const containerStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? radius('xl') : 0,
      borderTopRightRadius: isFirst ? radius('xl') : 0,
      borderBottomLeftRadius: isLast ? radius('xl') : 0,
      borderBottomRightRadius: isLast ? radius('xl') : 0,
    }),
    [isFirst, isLast, colors.surface, radius],
  );

  const handlePress = useCallback(() => onPress?.(tx), [onPress, tx]);

  return (
    <>
    <BentoPressable
      style={[styles.row, containerStyle]}
      onPress={handlePress}
      scaleOnPress={false}
      accessibilityRole="button"
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
    >
      <IconAvatar
        icon={categoryIcon}
        color={categoryColor}
        variant="subtle"
        size={40}
        iconSize={16}
      />

      {/* Centre: title + account meta */}
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>{displayTitle}</Text>

        {tx.type === 'TR' ? (
          <View style={styles.metaRow}>
            <Icon name={accountIcon} size={10} color={accountColor} />
            <Text variant="caption" tone="muted" numberOfLines={1} style={styles.shrink}>{tx.account.name}</Text>
            <Text variant="caption" tone="muted">→</Text>
            <Icon name={toAccountIcon} size={10} color={toAccountColor} />
            <Text variant="caption" tone="muted" numberOfLines={1} style={styles.shrink}>{tx.toAccount?.name ?? '—'}</Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <Icon name={accountIcon} size={10} color={accountColor} />
            <Text variant="caption" tone="muted" numberOfLines={1} style={styles.shrink}>{tx.account.name}</Text>
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
        <Text variant="caption" tone="muted" numberOfLines={1}>{dateTimeText}</Text>
      </View>
    </BentoPressable>
    {/* Hairline inset under the text column — same rhythm as ListGroup rows. */}
    {isLast === false ? (
      <View style={{ backgroundColor: colors.surface }}>
        <Divider inset={spacing('4') + 40 + spacing('3')} />
      </View>
    ) : null}
    </>
  );
});

TransactionRow.displayName = 'TransactionRow';

const createStyles = ({ typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('4'),
      gap: spacing('3'),
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing('0.5'),
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      flexShrink: 1,
      minWidth: 0,
    },
    shrink: { flexShrink: 1, minWidth: 0 },
    right: {
      alignItems: 'flex-end',
      gap: spacing('0.5'),
    },
    amount: {
      ...typography.metrics.md,
    },
  });
