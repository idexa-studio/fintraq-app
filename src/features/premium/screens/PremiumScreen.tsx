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
  View,
} from 'react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export const PremiumScreen = React.memo(function PremiumScreen() {
  const theme = useTheme();
  const { colors } = theme;
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
        <Header title="Fintraq Pro" showBack />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Subscribed Hero */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.crownWrapper}>
              <MaterialCommunityIcons name="check-decagram" size={32} color={colors.warning} />
            </View>
            <Text style={styles.heroBadge}>Pro active</Text>
            <Text style={styles.heroTitle}>Fintraq Pro is active</Text>
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
              <View style={styles.pill}>
                <Text style={styles.pillText}>Active</Text>
              </View>
            </View>
          </View>

          {/* Features list */}
          <SectionHeader title="Unlocked features" noPadding />

          <View style={styles.featuresCard}>
            {FEATURES.map((f, index) => {
              const isLast = index === FEATURES.length - 1;
              return (
                <View key={f.title} style={[styles.featureItem, isLast && styles.noMargin]}>
                  <View style={styles.iconWrapperActive}>
                    <MaterialCommunityIcons name={f.icon} size={20} color={colors.success} />
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

        {/* Back Button Footer */}
        <View style={styles.footer}>
          <BentoPressable
            style={styles.cta}
            onPress={() => router.back()}
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Back to dashboard
            </Text>
          </BentoPressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Fintraq Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Play Store Premium Hero */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.crownWrapper}>
            <MaterialCommunityIcons name="crown" size={32} color={colors.warning} />
          </View>
          <Text style={styles.heroBadge}>Lifetime upgrade</Text>
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
            <Text style={styles.priceError}>Pricing currently unavailable</Text>
          )}

          <View style={styles.separator} />

          <View style={styles.perks}>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
              <Text style={styles.perkText}>Secure one-time payment</Text>
            </View>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="sync" size={16} color={colors.success} />
              <Text style={styles.perkText}>Entitlements bind to your store account</Text>
            </View>
          </View>
        </View>

        {/* Features list */}
        <SectionHeader title="Everything included" noPadding />

        <View style={styles.featuresCard}>
          {FEATURES.map((f, index) => {
            const isLast = index === FEATURES.length - 1;
            return (
              <View key={f.title} style={[styles.featureItem, isLast && styles.noMargin]}>
                <View style={styles.iconWrapperInactive}>
                  <MaterialCommunityIcons name={f.icon} size={20} color={colors.primary} />
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
          style={[styles.cta, (!lifetimeProduct || isProcessing) && styles.disabledCta]}
          onPress={handlePurchase}
          disabled={isProcessing || !lifetimeProduct}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.background }]}>
              Upgrade for {lifetimeProduct?.displayPrice || 'Pro'}
            </Text>
          )}
        </BentoPressable>
        <View style={styles.legal}>
          <BentoPressable onPress={handleRestore} disabled={isProcessing}>
            <Text style={styles.legalText}>Restore purchase</Text>
          </BentoPressable>
          <View style={styles.legalDot} />
          <BentoPressable onPress={() => Alert.alert('Terms', 'This purchase binds to your Play Store / App Store account and restores automatically on login.')}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </BentoPressable>
        </View>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout, heroCard }: ThemeContextType) =>
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
    crownWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: heroCard.textPrimary + '1E',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('2'),
      zIndex: 2,
    },
    heroBadge: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.primaryLight,
      zIndex: 2,
    },
    heroTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      lineHeight: 32,
      color: heroCard.textPrimary,
      marginTop: spacing('1'),
      zIndex: 2,
    },
    heroDesc: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: heroCard.textMuted,
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
      color: colors.success,
      fontFamily: typography.fonts.semibold,
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
      color: colors.danger,
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
      color: colors.text,
      opacity: 0.85,
    },
    // Features list
    featuresCard: {
      borderRadius: 24,
      overflow: 'hidden',
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
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.success + '12',
    },
    iconWrapperInactive: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary + '12',
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
      color: colors.textMuted,
      opacity: 0.8,
    },
    legalDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textMuted,
      opacity: 0.5,
    },
  });
