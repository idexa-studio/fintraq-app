import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { usePremium } from '../../../providers/PremiumProvider';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { useDashboardInsights } from '../hooks/dashboard';
import { InsightCard } from './InsightCard';
import { SectionHeader } from './SectionHeader';

interface InsightsSectionProps {
  currency: string;
}

export const InsightsSection = React.memo(function InsightsSection({ currency }: InsightsSectionProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();
  const { data: insights, isLoading } = useDashboardInsights(currency);

  const hasInsights = insights && insights.length > 0;

  return (
    <View style={styles.container}>
      <SectionHeader title="PRO INSIGHTS" />

      <PremiumGuard
        label="Upgrade to Pro for insights"
        size="large"
        containerStyle={[
          styles.premiumContainer,
          !isPremium && { marginHorizontal: 24 }
        ]}
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
            <View style={{ width: 24 }} />
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
            <View style={{ width: 14 }} />
          </ScrollView>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface + '50', borderColor: colors.border }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No insights available yet. Keep tracking to unlock trends.</Text>
          </View>
        )}
      </PremiumGuard>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  container: {
    marginVertical: spacing('1'),
    marginBottom: spacing('5'),
  },
  premiumContainer: {
    borderRadius: radius('xl'),
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  scrollContent: {
    paddingRight: 0,
    gap: 0,
  },
  placeholderCard: {
    height: 110,
    marginHorizontal: spacing('6'),
    borderRadius: radius('xl'),
    backgroundColor: 'rgba(0,0,0,0.03)',
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
    marginHorizontal: spacing('6'),
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
