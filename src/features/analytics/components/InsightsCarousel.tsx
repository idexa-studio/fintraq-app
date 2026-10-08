import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { EmptyState, Skeleton } from '@/src/components/ui';
import { InsightCard } from '@/src/features/analytics/components/InsightCard';
import { useDashboardInsights } from '@/features/home';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = { currency: string };

const GAP = 12;
const INTERVAL = 4000;

/**
 * This month's generated insights as an auto-advancing carousel. Sits inside the padded Analytics
 * column but scrolls edge to edge, so the next card peeks in from the screen edge.
 */
export const InsightsCarousel = React.memo(function InsightsCarousel({ currency }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { spacing, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: insights, isLoading } = useDashboardInsights(currency);
  const { width: screenWidth } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = insights?.length ?? 0;
  // Full width minus a peek of the next card.
  const cardWidth = screenWidth - layout.screenPadding * 2 - spacing('6');
  const snapInterval = cardWidth + GAP;

  const scrollTo = useCallback((i: number) => scrollRef.current?.scrollTo({ x: i * snapInterval, animated: true }), [snapInterval]);

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
      setIndex((prev) => {
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

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
      setIndex(Math.max(0, Math.min(i, total - 1)));
    },
    [snapInterval, total],
  );

  if (isLoading) return <Skeleton height={88} radius="xl" />;
  if (!insights || total === 0) {
    return <EmptyState variant="inline" icon="chart-line-data" title={t('premium.noInsights')} description={t('premium.noInsightsHint')} />;
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.scroll}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        onMomentumScrollEnd={onScrollEnd}
        onTouchStart={clearTimer}
        onTouchEnd={startTimer}
        scrollEventThrottle={16}
      >
        {insights.map((insight) => (
          <View key={insight.id} style={{ width: cardWidth }}>
            <InsightCard insight={insight} />
          </View>
        ))}
      </ScrollView>

      {total > 1 ? (
        <View style={styles.dots}>
          {insights.map((insight, i) => (
            <View key={insight.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout, alpha }: ThemeContextType) =>
  StyleSheet.create({
    // Break out of the column's padding; cards still start on the page edge and snap back to it.
    bleed: { marginHorizontal: -layout.screenPadding },
    scroll: { paddingHorizontal: layout.screenPadding, gap: GAP },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('1.5'),
      marginTop: spacing('2.5'),
    },
    dot: { width: 6, height: 6, borderRadius: radius('full'), backgroundColor: alpha(colors.text, 'subtle') },
    // The active dot stretches instead of changing colour alone.
    dotActive: { width: 16, backgroundColor: colors.primaryInk },
  });
