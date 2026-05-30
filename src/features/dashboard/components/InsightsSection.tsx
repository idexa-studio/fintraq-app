import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useDashboardInsights } from '../hooks/dashboard';
import { InsightCard } from './InsightCard';
import { SectionHeader } from './SectionHeader';

interface InsightsSectionProps {
  currency: string;
}

export const InsightsSection = React.memo(function InsightsSection({ currency }: InsightsSectionProps) {
  const theme = useTheme();
  const { colors,layout, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: insights, isLoading } = useDashboardInsights(currency);
  const { isPremium } = usePremium();

  const hasInsights = insights && insights.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader title="Pro Insights" />
      <PremiumGuard
        label="Upgrade to Pro for insights"
        size="large"
        containerStyle={{ marginHorizontal: isPremium ? 0 : theme.layout.screenPadding }}
      >
        {isLoading ? (
          <View style={styles.placeholderCard}>
            <View style={[styles.loadingCircle, { borderColor: colors.border }]} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing your patterns...</Text>
          </View>
        ) : hasInsights ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            decelerationRate="fast"
            snapToInterval={190}
            snapToAlignment="start"
          >
            <View style={{ paddingHorizontal: layout.screenPadding, flexDirection:"row", gap: spacing('3') }} >
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
           </View>
          </ScrollView>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.text + '0C' }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No insights available yet. Keep tracking to unlock trends.</Text>
          </View>
        )}
      </PremiumGuard>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) => StyleSheet.create({
  container: {
    marginVertical: spacing('1'),
    marginBottom: spacing('5'),
  },
  premiumContainer: {
    borderRadius: radius('xl'),
    overflow: 'hidden',
    marginHorizontal: 0
  },
  scrollContent: {
    paddingRight: 0,
    gap: 0,
  },
  placeholderCard: {
    height: 110,
    marginHorizontal: layout.screenPadding,
    borderRadius: radius('xl'),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing('3'),
  },
  loadingCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  loadingText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  emptyCard: {
    height: 110,
    marginHorizontal: layout.screenPadding,
    borderRadius: radius('xl'),
    borderWidth: 1,
    padding: spacing('5'),
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing('2'),
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: '80%',
  },
});
