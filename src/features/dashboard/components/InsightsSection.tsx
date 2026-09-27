import { EmptyState, Skeleton } from '@/src/components/ui';
import { ChartLineData01Icon } from '@hugeicons/core-free-icons';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { PremiumGuard } from '@/src/features/premium/components/PremiumGuard';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useDashboardInsights } from '@/src/features/dashboard/hooks/dashboard';
import { InsightCard } from './InsightCard';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

interface InsightsSectionProps {
  currency: string;
}

const GAP = 12;
const INTERVAL = 4000;

export const InsightsSection = React.memo(function InsightsSection({ currency }: InsightsSectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: insights, isLoading } = useDashboardInsights(currency);
  const { width: screenWidth } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = insights?.length ?? 0;
  // Full width minus a peek of the next card.
  const cardWidth = screenWidth - theme.layout.screenPadding * 2 - spacing('6');
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

  let body: React.ReactNode;
  if (isLoading) {
    body = <Skeleton height={88} radius="xl" style={styles.padded} />;
  } else if (!hasInsights) {
    body = (
      <EmptyState variant="inline" icon={ChartLineData01Icon} title={t('premium.noInsights')} description={t('premium.noInsightsHint')} style={styles.padded} />
    );
  } else {
    body = (
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
          {insights?.map((insight) => (
            <View key={insight.id} style={{ width: cardWidth }}>
              <InsightCard insight={insight} />
            </View>
          ))}
        </ScrollView>

        {total > 1 ? (
          <View style={styles.dots}>
            {insights?.map((insight, i) => (
              <View key={insight.id} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View>
      <SectionHeader title={t('premium.insightsTitle')} />
      <PremiumGuard label={t('premium.upgradeForInsights')} size="large" containerStyle={styles.padded}>
        {body}
      </PremiumGuard>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    padded: { marginHorizontal: layout.screenPadding },
    // Cards start on the page edge and snap back to it.
    scroll: { paddingHorizontal: layout.screenPadding, gap: GAP },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('2.5'),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
      backgroundColor: alpha(colors.text, 'subtle'),
    },
    // The active dot stretches instead of changing colour alone.
    dotActive: { width: 16, backgroundColor: colors.primaryInk },
  });
