import { BentoPressable } from './BentoPressable';
import { MoneyText } from './MoneyText';
import { Text } from './Text';
import { TrendBadge } from './TrendBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/src/types';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type StatTileProps = {
  label: string;
  /** Monetary value. Use `value` instead for counts or plain text. */
  amount?: number;
  currency?: string;
  /** CR = green with +, DR = red with −. */
  type?: TransactionType | 'NONE';
  value?: string;
  /** Muted line under the value — what the number is about (a category, a date). */
  caption?: string;
  icon?: IconSource;
  iconColor?: string;
  /** Percentage change vs previous period. */
  delta?: number | null;
  positiveIsGood?: boolean;
  compact?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A single KPI: label, big number, optional trend. Lay out in rows of two. */
export const StatTile = React.memo(function StatTile({
  label,
  amount,
  currency,
  type = 'NONE',
  value,
  caption,
  icon,
  iconColor,
  delta,
  positiveIsGood = true,
  compact = false,
  onPress,
  style,
}: StatTileProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = (
    <>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconDot, { backgroundColor: theme.alpha(iconColor ?? theme.colors.textMuted, 'subtle') }]}>
            <Icon name={icon} size={13} color={iconColor ?? theme.colors.textMuted} weight="bold" />
          </View>
        ) : null}
        <Text variant="label" tone="muted" numberOfLines={2} style={styles.label}>{label}</Text>
      </View>
      {amount !== undefined ? (
        <MoneyText amount={amount} currency={currency} type={type} compact={compact} style={styles.value} maxChars={11} />
      ) : (
        <Text variant="amountLarge" numberOfLines={1}>{value ?? '—'}</Text>
      )}
      {caption ? <Text variant="caption" tone="muted" numberOfLines={2}>{caption}</Text> : null}
      {delta !== undefined ? <TrendBadge delta={delta} positiveIsGood={positiveIsGood} /> : null}
    </>
  );

  if (!onPress) return <View style={[styles.tile, style]}>{content}</View>;

  return (
    <BentoPressable onPress={onPress} style={[styles.tile, style]} accessibilityRole="button">
      {content}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      gap: spacing('1.5'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing('2'), marginBottom: spacing('1') },
    iconDot: { width: 24, height: 24, borderRadius: radius('full'), alignItems: 'center', justifyContent: 'center' },
    label: { flexShrink: 1, paddingTop: 4 },
    value: { ...typography.variants.amountLarge },
  });
