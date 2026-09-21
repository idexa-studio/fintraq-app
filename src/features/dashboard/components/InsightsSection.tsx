import { ChartLineData01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { PremiumGuard } from '../../../components/ui/PremiumGuard';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { useDashboardInsights } from '../hooks/dashboard';
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
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: insights, isLoading } = useDashboardInsights(currency);
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
        <SectionHeader title={t('premium.insightsTitle')} />
        <PremiumGuard label={t('premium.upgradeForInsights')} size="large" containerStyle={styles.guard}>
          <View style={styles.empty}>
            <View style={styles.emptyIconWrapper}>
              <HugeiconsIcon icon={ChartLineData01Icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>{t('premium.noInsights')}</Text>
              <Text style={styles.emptyText}>{t('premium.noInsightsHint')}</Text>
            </View>
          </View>
        </PremiumGuard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader title={t('premium.insightsTitle')} />
      <PremiumGuard
        label={t('premium.upgradeForInsights')}
        size="large"
        containerStyle={styles.guard}
      >
        {isLoading ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              {t('premium.analysing')}
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
                      { backgroundColor: i === index ? colors.primary : alpha(colors.text, 'subtle') },
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
    guard: {
      marginHorizontal: layout.screenPadding,
    },
    scroll: { gap: GAP },
    placeholder: {
      height: 80,
      marginHorizontal: layout.screenPadding,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: { ...typography.metrics.xs, opacity: 0.6 },
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
      backgroundColor: alpha(colors.primary, 'subtle'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContent: {
      flex: 1,
      gap: 2,
    },
    emptyTitle: {
      fontFamily: typography.styles.cardTitle.fontFamily,
      fontSize: 13,
      color: colors.text,
    },
    emptyText: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing('2'),
      marginTop: spacing('2'),
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius('full'),
    },
  });
