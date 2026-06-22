import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { FEATURES } from '@/src/constants/iap';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { getHeroColors, HeroCardPalette } from '@/src/theme/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ProSuccessScreen = React.memo(function ProSuccessScreen() {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const router = useRouter();
  const heroCard = useMemo(() => getHeroColors(isDark, colors.primary, colors.primaryDark, colors.text, colors.textMuted), [isDark, colors]);
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Fintraq Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card — edge-to-edge, dashboard style */}
        <View style={[styles.heroCard, { backgroundColor: heroCard.background }]}>
          <Text style={styles.heroBadge}>Pro active</Text>
          <Text style={styles.heroTitle}>You{"'"}re all set.</Text>
          <Text style={styles.heroDesc}>
            Every professional tool, every future update — yours forever. No subscriptions, no limits.
          </Text>
        </View>

        {/* Subscription Status Card */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={styles.priceLabel}>Lifetime license</Text>
              <Text style={styles.priceSubText}>Linked to your Google Play / App Store</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Features list */}
        <SectionHeader title="Unlocked features" />

        <View style={styles.featuresCard}>
          {FEATURES.map((f, index) => {
            const isLast = index === FEATURES.length - 1;
            return (
              <View key={f.title} style={[styles.featureItem, isLast && styles.noMargin]}>
                <View style={styles.iconWrapperActive}>
                  <HugeiconsIcon icon={f.icon} size={20} color={colors.success} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pinned Bottom CTA */}
      <View style={styles.footer}>
        <BentoPressable
          style={styles.cta}
          onPress={() => router.replace('/(main)/(tabs)')}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            Open dashboard
          </Text>
        </BentoPressable>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingTop: 0,
    },
    // ── Hero Card
    heroCard: {
      paddingHorizontal: spacing('5'),
      paddingTop: spacing('5'),
      paddingBottom: spacing('6'),
      borderRadius: radius('2xl'),
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
      overflow: 'hidden',
    },
    heroBadge: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
      color: heroCard.textMuted,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      lineHeight: 32,
      color: heroCard.textPrimary,
      marginTop: spacing('1'),
    },
    heroDesc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: heroCard.textMuted,
      marginTop: spacing('1'),
    },
    // ── Status Card
    priceContainer: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('5'),
      marginHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceLeft: {
      gap: spacing('0.5'),
    },
    priceLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
      color: colors.text,
    },
    priceSubText: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    pill: {
      backgroundColor: colors.success + '15',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    pillText: {
      fontSize: typography.sizes.xs,
      color: colors.success,
      fontFamily: typography.fonts.semibold,
    },
    // ── Features list
    featuresCard: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginHorizontal: layout.screenPadding,
    },
    featureItem: {
      flexDirection: 'row',
      gap: spacing('4'),
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      marginBottom: spacing('0.5'),
    },
    noMargin: {
      marginBottom: 0,
    },
    iconWrapperActive: {
      width: 40,
      height: 40,
      borderRadius: radius('xl'),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.success + '12',
    },
    featureContent: {
      flex: 1,
      gap: spacing('0.5'),
    },
    featureTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    featureDesc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    // ── Pinned Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      backgroundColor: colors.background,
    },
    cta: {
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('3'),
    },
    ctaText: {
      fontFamily: typography.fonts.bold,
      fontSize: 16,
    },
  });
