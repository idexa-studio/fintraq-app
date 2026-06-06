import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { FEATURES } from '@/src/constants/iap';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export const ProSuccessScreen = React.memo(function ProSuccessScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Keeep Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Subscribed Success Hero */}
        <LinearGradient
          colors={['#047857', '#022c22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
          <View style={styles.crownWrapper}>
            <MaterialCommunityIcons name="check-decagram" size={32} color="#FBBF24" />
          </View>
          <Text style={styles.heroBadge}>PRO MEMBER</Text>
          <Text style={styles.heroTitle}>You{"'"}re all set.</Text>
          <Text style={styles.heroDesc}>
            Every professional tool, every future update — yours forever. No subscriptions, no limits.
          </Text>
        </LinearGradient>

        {/* Subscription Status Card */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={styles.priceLabel}>Lifetime license</Text>
              <Text style={styles.priceSubText}>Linked to your Google Play / App Store</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.pillText, { color: colors.success, fontFamily: typography.fonts.semibold }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Features list */}
        <SectionHeader title="Unlocked features" noPadding />

        <View style={styles.featuresCard}>
          {FEATURES.map((f, index) => (
            <React.Fragment key={f.title}>
              <View style={styles.featureItem}>
                <View style={[styles.iconWrapper, { backgroundColor: colors.success + '12' }]}>
                  <MaterialCommunityIcons name={f.icon} size={20} color={colors.success} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{f.description}</Text>
                </View>
              </View>
              {index < FEATURES.length - 1 && <View style={styles.featureDivider} />}
            </React.Fragment>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pinned Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.replace('/(main)/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: colors.background }]}>
            Open dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
    },
    // Hero Card
    heroCard: {
      borderRadius: 28,
      padding: spacing('6'),
      marginBottom: spacing('5'),
      gap: spacing('2'),
      overflow: 'hidden',
    },
    decoCircle1: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decoCircle2: {
      position: 'absolute',
      bottom: -50,
      left: -20,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    crownWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('2'),
      zIndex: 2,
    },
    heroBadge: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: '#A7F3D0',
      letterSpacing: 1.5,
      zIndex: 2,
    },
    heroTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      lineHeight: 32,
      color: '#FFFFFF',
      marginTop: spacing('1'),
      zIndex: 2,
    },
    heroDesc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: '#E0F2FE',
      opacity: 0.9,
      marginTop: spacing('1'),
      zIndex: 2,
    },
    // Price Card
    priceContainer: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: spacing('5'),
      marginBottom: spacing('5'),
      gap: spacing('4'),
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
    },
    // Features list
    featuresCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: spacing('4'),
    },
    featureDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.text + '0C',
      marginLeft: 56,
      marginVertical: spacing('3'),
    },
    featureItem: {
      flexDirection: 'row',
      gap: spacing('4'),
      alignItems: 'flex-start',
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
      gap: spacing('0.5'),
    },
    featureTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
    },
    featureDesc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      opacity: 0.85,
    },
    // Pinned Footer
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
