import { PageBackground } from '@/src/components/ui/PageBackground';
import { Header } from '@/src/components/ui/Header';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { FEATURES, SKU_LIFETIME } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export const PremiumScreen = React.memo(function PremiumScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const router = useRouter();
  const { products, purchasePremium, restorePurchase, isLoading, isPremium } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const lifetimeProduct = useMemo(() => products.find(p => p.id === SKU_LIFETIME), [products]);

  const handlePurchase = useCallback(async () => {
    setIsProcessing(true);
    await purchasePremium();
    setIsProcessing(false);
  }, [purchasePremium]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    await restorePurchase();
    setIsProcessing(false);
  }, [restorePurchase]);

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <PageBackground />
        <Header title="Keeep Pro" showBack />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Subscribed Hero */}
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
            <Text style={styles.heroTitle}>Keeep Pro is Active</Text>
            <Text style={styles.heroDesc}>
              Thank you for your support! You have permanent lifetime access to every professional tool, report export, and future update.
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

        {/* Back Button Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Back to dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Keeep Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Play Store Premium Hero */}
        <LinearGradient
          colors={['#047857', '#022c22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
          <View style={styles.crownWrapper}>
            <MaterialCommunityIcons name="crown" size={32} color="#FBBF24" />
          </View>
          <Text style={styles.heroBadge}>LIFETIME UPGRADE</Text>
          <Text style={styles.heroTitle}>One payment. Everything. Forever.</Text>
          <Text style={styles.heroDesc}>
            No subscriptions. No recurring charges. Unlock advanced financial analytics, exports, and global search instantly.
          </Text>
        </LinearGradient>

        {/* Pricing details */}
        <View style={styles.priceContainer}>
          {lifetimeProduct ? (
            <View style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.priceLabel}>Lifetime license</Text>
                <Text style={styles.priceSubText}>All features & updates included</Text>
              </View>
              <View style={styles.priceRight}>
                {lifetimeProduct.originalPrice && (
                  <Text style={styles.originalPriceText}>{lifetimeProduct.originalPrice}</Text>
                )}
                <Text style={styles.priceValue}>{lifetimeProduct.displayPrice}</Text>
              </View>
            </View>
          ) : isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />
          ) : (
            <Text style={[styles.priceError, { color: colors.danger }]}>Pricing currently unavailable</Text>
          )}

          <View style={styles.separator} />

          <View style={styles.perks}>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
              <Text style={[styles.perkText, { color: colors.text }]}>Secure one-time payment</Text>
            </View>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="sync" size={16} color={colors.success} />
              <Text style={[styles.perkText, { color: colors.text }]}>Entitlements bind to your store account</Text>
            </View>
          </View>
        </View>

        {/* Features list */}
        <SectionHeader title="Everything included" noPadding />

        <View style={styles.featuresCard}>
          {FEATURES.map((f, index) => (
            <React.Fragment key={f.title}>
              <View style={styles.featureItem}>
                <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '12' }]}>
                  <MaterialCommunityIcons name={f.icon} size={20} color={colors.primary} />
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
          style={[styles.cta, (!lifetimeProduct || isProcessing) && styles.disabledCta]}
          onPress={handlePurchase}
          disabled={isProcessing || !lifetimeProduct}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Upgrade for {lifetimeProduct?.displayPrice || 'Pro'}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.legal}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
            <Text style={[styles.legalText, { color: colors.textMuted }]}>Restore purchase</Text>
          </TouchableOpacity>
          <View style={[styles.legalDot, { backgroundColor: colors.textMuted }]} />
          <TouchableOpacity onPress={() => Alert.alert('Terms', 'This purchase binds to your Play Store / App Store account and restores automatically on login.')}>
            <Text style={[styles.legalText, { color: colors.textMuted }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
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
    pill: {
      backgroundColor: colors.success + '15',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    pillText: {
      fontSize: typography.sizes.xs,
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
    priceRight: {
      alignItems: 'flex-end',
    },
    originalPriceText: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    priceValue: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 28,
      color: colors.text,
    },
    priceError: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      textAlign: 'center',
      width: '100%',
    },
    separator: {
      height: 1,
      backgroundColor: colors.text + '08',
    },
    perks: {
      gap: spacing('2'),
    },
    perk: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
    },
    perkText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      opacity: 0.85,
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
    disabledCta: {
      opacity: 0.65,
    },
    ctaText: {
      fontFamily: typography.fonts.bold,
      fontSize: 16,
    },
    legal: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('3'),
    },
    legalText: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      opacity: 0.8,
    },
    legalDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      opacity: 0.5,
    },
  });
