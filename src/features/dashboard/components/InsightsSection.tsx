import { usePremium } from '@/src/providers/PremiumProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useDashboardInsights } from '../hooks/dashboard';
import { InsightCard } from './InsightCard';
import { SectionHeader } from './SectionHeader';

interface InsightsSectionProps {
  currency: string;
}

const GAP = 12;
const INTERVAL = 4000;

export const InsightsSection = React.memo(function InsightsSection({ currency }: InsightsSectionProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: insights, isLoading } = useDashboardInsights(currency);
  const { isPremium } = usePremium();
  const { width: screenWidth } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = insights?.length ?? 0;
  const cardWidth = screenWidth - theme.layout.screenPadding * 2 - 20;
  const snapInterval = cardWidth + GAP;

  const scrollTo = useCallback((i: number) => {
    scrollRef.current?.scrollTo({ x: i * snapInterval, animated: true });
  }, [snapInterval]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (total <= 1) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setIndex(prev => {
        const next = prev >= total - 1 ? 0 : prev + 1;
        scrollTo(next);
        return next;
      });
    }, INTERVAL);
  }, [total, clearTimer, scrollTo]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    setIndex(Math.max(0, Math.min(i, total - 1)));
  }, [snapInterval, total]);

  const hasInsights = (insights?.length ?? 0) > 0;

  if (!hasInsights && !isLoading) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Pro Insights" />
        <PremiumGuard label="Upgrade to Pro for insights" size="large" containerStyle={{ marginHorizontal: isPremium ? 0 : theme.layout.screenPadding }}>
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={colors.textMuted} />
            <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              No insights yet. Keep tracking to unlock trends.
            </Text>
          </View>
        </PremiumGuard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Pro Insights" />
      <PremiumGuard
        label="Upgrade to Pro for insights"
        size="large"
        containerStyle={{ marginHorizontal: isPremium ? 0 : theme.layout.screenPadding }}
      >
        {isLoading ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Analysing your patterns...
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              decelerationRate="fast"
              snapToInterval={snapInterval}
              snapToAlignment="start"
              onMomentumScrollEnd={onScrollEnd}
              onTouchStart={clearTimer}
              onTouchEnd={startTimer}
              scrollEventThrottle={16}
            >
              <View style={{ width: theme.layout.screenPadding - GAP / 2 }} />
              {insights?.map((insight) => (
                <View key={insight.id} style={{ width: cardWidth }}>
                  <InsightCard insight={insight} />
                </View>
              ))}
              <View style={{ width: theme.layout.screenPadding - GAP / 2 }} />
            </ScrollView>

            {total > 1 && (
              <View style={styles.dots}>
                {insights?.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === index ? colors.primary : colors.text + '18' },
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </PremiumGuard>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {},
    scroll: { gap: GAP },
    placeholder: {
      height: 80,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: { fontSize: typography.sizes.xs, opacity: 0.6 },
    empty: {
      height: 80,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('2'),
    },
    emptyText: {
      fontSize: typography.sizes.xs,
      textAlign: 'center',
      lineHeight: 16,
      maxWidth: '80%',
      opacity: 0.6,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing('2'),
      marginTop: spacing('3'),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
    },
  });
