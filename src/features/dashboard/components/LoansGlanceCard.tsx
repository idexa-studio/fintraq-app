import { HandshakeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { MoneyText } from '../../../components/ui/MoneyText';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useLoansSummary } from '../../loans/hooks/loans';

type Props = {
  currency: string;
  onPress: () => void;
};

export const LoansGlanceCard = React.memo(function LoansGlanceCard({ currency, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: summary } = useLoansSummary(currency);

  if (!summary || (summary.activeLentCount === 0 && summary.activeBorrowedCount === 0)) {
    return (
      <BentoPressable style={styles.empty} onPress={onPress}>
        <View style={styles.emptyIconWrapper}>
          <HugeiconsIcon icon={HandshakeIcon} size={18} color={colors.primary} />
        </View>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>{t('dashboard.noLoans')}</Text>
          <Text style={styles.emptyText}>{t('dashboard.loanHint')}</Text>
        </View>
      </BentoPressable>
    );
  }

  return (
    <View style={styles.grid}>
      <BentoPressable style={[styles.tile, { marginRight: theme.spacing('1.5') }]} onPress={onPress}>
        <View style={styles.tileHeader}>
          <Text style={[styles.tileLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.success }]}>
            {t('dashboard.lentOut')}
          </Text>
          {summary.overdueLentCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.danger }]}>
                {t('dashboard.overdue', { count: summary.overdueLentCount })}
              </Text>
            </View>
          )}
        </View>
        <MoneyText amount={summary.totalLent} currency={currency} type="CR" weight="bold" compact style={styles.tileAmount} />
        <Text style={[styles.tileSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {t('dashboard.active', { count: summary.activeLentCount })}
        </Text>
      </BentoPressable>

      <BentoPressable style={[styles.tile, { marginLeft: theme.spacing('1.5') }]} onPress={onPress}>
        <View style={styles.tileHeader}>
          <Text style={[styles.tileLabel, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.danger }]}>
            {t('dashboard.borrowed')}
          </Text>
          {summary.overdueBorrowedCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.danger }]}>
                {t('dashboard.overdue', { count: summary.overdueBorrowedCount })}
              </Text>
            </View>
          )}
        </View>
        <MoneyText amount={summary.totalBorrowed} currency={currency} type="DR" weight="bold" compact style={styles.tileAmount} />
        <Text style={[styles.tileSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {t('dashboard.active', { count: summary.activeBorrowedCount })}
        </Text>
      </BentoPressable>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    empty: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginHorizontal: layout.screenPadding,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    emptyIconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContent: {
      flex: 1,
      gap: 2,
    },
    emptyTitle: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
    grid: {
      flexDirection: 'row',
      paddingHorizontal: layout.screenPadding,
    },
    tile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('1.5'),
    },
    tileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tileLabel: {
      fontSize: 10,
      textTransform: 'uppercase',
    },
    tileAmount: {
      fontSize: 18,
    },
    tileSub: {
      fontSize: 11,
    },
    badge: {
      paddingHorizontal: spacing('1.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    badgeText: {
      fontSize: 9,
      fontFamily: typography.fonts.semibold,
    },
  });
