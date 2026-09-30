import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Badge, MoneyText, Text } from '@/src/components/ui';
import type { CurrencyNetWorth } from '@/src/features/accounts/utils/net-worth';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';

type Props = { groups: readonly CurrencyNetWorth[] };

/**
 * Net worth per currency with an allocation bar in each account's own colour, so the list below
 * reads as parts of this whole.
 */
export const NetWorthCard = React.memo(function NetWorthCard({ groups }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showCurrency = groups.length > 1;

  return (
    <View style={styles.card}>
      {groups.map((group, index) => (
        <View key={group.currency} style={[styles.group, index > 0 && styles.groupDivider]}>
          <View style={styles.header}>
            <Text variant="label" tone="muted">
              {t('accounts.netWorth')}
            </Text>
            {showCurrency ? <Badge label={group.currency} variant="muted" /> : null}
            <View style={styles.spacer} />
            <Text variant="micro" tone="muted">
              {group.accounts.length === 1 ? t('transactions.oneAccount') : t('transactions.accountsCount', { count: group.accounts.length })}
            </Text>
          </View>

          <MoneyText
            amount={group.net}
            currency={group.currency}
            weight="bold"
            style={styles.net}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          />

          {group.assets > 0 ? (
            <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {group.accounts
                .filter((a) => a.balance > 0)
                .map((a) => (
                  <View key={a.id} style={[styles.segment, { flex: a.balance, backgroundColor: colorNumberToHex(a.color) }]} />
                ))}
            </View>
          ) : null}

          {group.debts > 0 ? (
            <View style={styles.split}>
              <View style={styles.splitCell}>
                <Text variant="micro" tone="muted">
                  {t('accounts.assets')}
                </Text>
                <MoneyText amount={group.assets} currency={group.currency} type="CR" weight="semibold" compact style={styles.splitValue} />
              </View>
              <View style={styles.splitCell}>
                <Text variant="micro" tone="muted">
                  {t('accounts.debts')}
                </Text>
                <MoneyText amount={group.debts} currency={group.currency} type="DR" weight="semibold" compact style={styles.splitValue} />
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      paddingHorizontal: spacing('5'),
    },
    group: { gap: spacing('2.5'), paddingVertical: spacing('5') },
    groupDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: alpha(colors.text, 'subtle') },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    spacer: { flex: 1 },
    net: { ...typography.metrics.xxxl, marginTop: -spacing('1') },
    bar: { flexDirection: 'row', height: spacing('2'), borderRadius: radius('full'), overflow: 'hidden', gap: 2 },
    segment: { borderRadius: radius('full') },
    split: { flexDirection: 'row', gap: spacing('4') },
    splitCell: { gap: spacing('0.5') },
    splitValue: typography.metrics.sm,
  });
