import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { MoneyText } from './MoneyText';
import { BentoPressable } from './BentoPressable';

type KPIMetrics = {
  income: number;
  expense: number;
};

type Props = {
  currencies: string[];
  selectedCurrency: string | null;
  onSelectCurrency: (currency: string) => void;
  metrics: KPIMetrics;
};

/**
 * KPICard - Editorial Brutalist Design
 *
 * Structure:
 * - Card: 16px radius (lg), 16px padding, surface background
 * - Currency tabs: 12px radius (md), 8px gap
 * - Labels: Uppercase, 9-10px, letterSpacing 1.2
 * - Values: 24px large / 14px small
 */
export const KPICard = React.memo(function KPICard({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  metrics,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleCurrencyPress = useCallback((curr: string) => {
    onSelectCurrency(curr);
  }, [onSelectCurrency]);

  return (
    <View style={styles.kpiCard}>
      {currencies.length > 1 && (
        <View style={styles.kpiTabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencyTabsRow}
          >
            {currencies.map((cur) => (
              <BentoPressable
                key={cur}
                style={[
                  styles.currencyTab,
                  selectedCurrency === cur && styles.currencyTabActive,
                ]}
                onPress={() => handleCurrencyPress(cur)}
              >
                <Text style={[
                  styles.currencyTabText,
                  selectedCurrency === cur && styles.currencyTabTextActive,
                ]}>
                  {cur}
                </Text>
              </BentoPressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.kpiBody}>
        <View style={styles.kpiMainContent}>
          <View>
            <Text style={styles.kpiLabel}>Net savings</Text>
            <MoneyText
              amount={Math.abs(metrics.income - metrics.expense)}
              currency={selectedCurrency ?? undefined}
              type={metrics.income >= metrics.expense ? 'CR' : 'DR'}
              weight="bold"
              style={styles.kpiValueLarge}
            />
          </View>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiSecondaryContent}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>Income</Text>
            <MoneyText
              amount={metrics.income}
              currency={selectedCurrency ?? undefined}
              type="CR"
              weight="semibold"
              style={styles.kpiValueSmall}
            />
          </View>
          <View style={styles.kpiVerticalSep} />
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>Expenses</Text>
            <MoneyText
              amount={metrics.expense}
              currency={selectedCurrency ?? undefined}
              type="DR"
              weight="semibold"
              style={styles.kpiValueSmall}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    kpiCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    kpiTabsWrap: {
      paddingVertical: spacing('2.5'),
      paddingLeft: spacing('3'),
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      paddingRight: spacing('3'),
    },
    currencyTab: {
      paddingHorizontal: spacing('3.5'),
      paddingVertical: spacing('2'),
      borderRadius: radius('full'),
      backgroundColor: colors.card,
    },
    currencyTabActive: {
      backgroundColor: colors.primary + '18',
    },
    currencyTabText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    currencyTabTextActive: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
      color: colors.primary,
    },
    kpiBody: {
      padding: spacing('4'),
      paddingBottom: spacing('4'),
      gap: spacing('3'),
    },
    kpiMainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiSecondaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    kpiCell: {
      flex: 1,
      gap: spacing('0.5'),
    },
    kpiVerticalSep: {
      width: 1,
      height: 24,
      backgroundColor: colors.text + '0C',
      marginHorizontal: spacing('4'),
      opacity: 0.6,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      lineHeight: 14,
      marginBottom: spacing('0.5'),
    },
    kpiLabelSmall: {
      color: colors.textMuted,
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      lineHeight: 14,
    },
    kpiValueLarge: {
      fontSize: typography.sizes.xxl,
      lineHeight: 28,
    },
    kpiValueSmall: {
      fontSize: typography.sizes.md,
      lineHeight: 18,
    },
    kpiDivider: {
      height: 1,
      backgroundColor: colors.text + '0C',
      opacity: 0.5,
    },
  });
