import { PageBackground } from '@/src/components/ui/PageBackground';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Header } from '@/src/components/ui/Header';
import { FEATURES, SKU_LIFETIME } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const HERO_TEXT = '#0D0D0F';

type BentoSpan = 'full' | 'half';

type BentoItem = {
  feature: (typeof FEATURES)[number];
  span: BentoSpan;
};

const BENTO_ROWS: BentoItem[][] = [
  [{ feature: FEATURES[0], span: 'half' }, { feature: FEATURES[1], span: 'half' }],
  [{ feature: FEATURES[2], span: 'half' }, { feature: FEATURES[3], span: 'half' }],
  [{ feature: FEATURES[4], span: 'half' }, { feature: FEATURES[5], span: 'half' }],
  [{ feature: FEATURES[6], span: 'half' }, { feature: FEATURES[7], span: 'half' }],
];

export const PremiumScreen = React.memo(function PremiumScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const { products, purchasePremium, restorePurchase, isPremium, isLoading } = usePremium();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const lifetimeProduct = useMemo(() => {
    return products.find(p => p.id === SKU_LIFETIME);
  }, [products]);

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

  const featureCount = useMemo(() => {
    let count = 0;
    for (const row of BENTO_ROWS) count += row.length;
    return count;
  }, []);

  if (isPremium && !isProcessing) {
    return (
      <View style={styles.container}>
        <PageBackground />

        <SafeAreaView style={styles.successWrapper}>
          <View style={styles.successContent}>
            <View style={styles.successIndicator}>
              <View style={styles.successDot} />
              <Text style={[styles.successLabel, { fontFamily: typography.fonts.semibold, color: colors.success }]}>
                Active
              </Text>
            </View>

            <Text style={[styles.successHeading, { fontFamily: typography.fonts.heading, color: colors.text }]}>
              You have Luno Pro.
            </Text>

            <Text style={[styles.successBody, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Lifetime access to every professional tool, including all future updates.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.successBtnText, { fontFamily: typography.fonts.bold, color: colors.background }]}>
              Back to dashboard
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />

      <Header title="Luno Pro" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { fontFamily: typography.fonts.semibold, color: '#0D0D0F80' }]}>
            Lifetime upgrade
          </Text>
          <Text style={[styles.heroTitle, { fontFamily: typography.fonts.headingRegular, color: '#0D0D0F' }]}>
            The professional{'\n'}toolkit, unlocked.
          </Text>
          <Text style={[styles.heroDesc, { fontFamily: typography.fonts.regular, color: '#0D0D0F90' }]}>
            One payment. Every feature.{'\n'}No subscriptions. No expiry.
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroPriceRow}>
            <View style={styles.heroPriceLeft}>
              {lifetimeProduct ? (
                <>
                  <View style={styles.priceRow}>
                    {lifetimeProduct.originalPrice && (
                      <Text style={[styles.priceStrike, { fontFamily: typography.fonts.regular, color: '#0D0D0F60' }]}>
                        {lifetimeProduct.originalPrice}
                      </Text>
                    )}
                    <Text style={[styles.priceValue, { fontFamily: typography.fonts.amountBold, color: '#0D0D0F' }]}>
                      {lifetimeProduct.displayPrice}
                    </Text>
                  </View>
                  <Text style={[styles.priceTag, { fontFamily: typography.fonts.medium, color: '#0D0D0F70' }]}>
                    One time, forever
                  </Text>
                </>
              ) : isLoading ? (
                <ActivityIndicator color="#000100" />
              ) : (
                <Text style={[styles.priceError, { fontFamily: typography.fonts.regular, color: '#0D0D0F' }]}>
                  Unavailable
                </Text>
              )}
            </View>

            <View style={styles.heroPriceRight}>
              <View style={styles.heroCheckRow}>
                <Ionicons name="checkmark-circle" size={13} color="#000100" />
                <Text style={[styles.heroCheckText, { fontFamily: typography.fonts.medium, color: '#0D0D0F80' }]}>
                  All updates
                </Text>
              </View>
              <View style={styles.heroCheckRow}>
                <Ionicons name="checkmark-circle" size={13} color="#000100" />
                <Text style={[styles.heroCheckText, { fontFamily: typography.fonts.medium, color: '#0D0D0F80' }]}>
                  No limits
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.featuresHeader}>
          <Text style={[styles.featuresTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
            {"What's included"}
          </Text>
          <Text style={[styles.featuresCount, { fontFamily: typography.fonts.amountRegular, color: colors.primary }]}>
            {featureCount} tools
          </Text>
        </View>

        <View style={styles.bentoGrid}>
          {BENTO_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.bentoRow}>
              {row.map((item) =>
                item.span === 'full' ? (
                  <View key={item.feature.title} style={[styles.bentoFull, rowIdx === 0 && styles.bentoFullFirst]}>
                    <View style={styles.bentoFullTop}>
                      <IconAvatar
                        icon={item.feature.icon}
                        bg={colors.primary + '15'}
                        color={colors.primary}
                        size={28}
                        iconSize={12}
                      />
                      <Text
                        style={[styles.bentoFullName, { fontFamily: typography.fonts.semibold, color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.feature.title}
                      </Text>
                    </View>
                    <Text
                      style={[styles.bentoFullDesc, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}
                      numberOfLines={4}
                    >
                      {item.feature.description}
                    </Text>
                  </View>
                ) : (
                  <View key={item.feature.title} style={styles.bentoHalf}>
                    <IconAvatar
                      icon={item.feature.icon}
                      bg={colors.primary + '15'}
                      color={colors.primary}
                      size={28}
                      iconSize={12}
                    />
                    <Text
                      style={[styles.bentoHalfName, { fontFamily: typography.fonts.semibold, color: colors.text }]}
                      numberOfLines={2}
                    >
                      {item.feature.title}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cta}
          onPress={handlePurchase}
          disabled={isProcessing || isPremium || !lifetimeProduct}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.ctaText, { fontFamily: typography.fonts.bold, color: colors.background }]}>
              Get lifetime access
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <Text style={[styles.footerLink, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>
              Restore
            </Text>
          </TouchableOpacity>
          <View style={styles.footerSep} />
          <TouchableOpacity
            onPress={() => Alert.alert('Terms', 'Luno Pro is a one-time purchase tied to your store account.')}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text style={[styles.footerLink, { fontFamily: typography.fonts.medium, color: colors.textMuted }]}>
              Terms
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    scrollContent: {
      paddingHorizontal: layout.screenPadding,
    },
    bottomPad: { height: spacing('8') },

    hero: {
      backgroundColor: colors.primary,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      marginBottom: spacing('6'),
      gap: spacing('4'),
    },
    heroLabel: {
      fontSize: typography.sizes.xs,
    },
    heroTitle: {
      fontSize: typography.sizes.xxxl,
      lineHeight: 34,
    },
    heroDesc: {
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    heroDivider: {
      height: 1,
      backgroundColor: HERO_TEXT + '18',
    },
    heroPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    heroPriceLeft: {
      gap: spacing('1'),
    },
    heroPriceRight: {
      gap: spacing('2'),
      alignItems: 'flex-end',
    },
    heroCheckRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
    },
    heroCheckText: {
      fontSize: 11,
    },

    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing('2'),
    },
    priceStrike: {
      fontSize: typography.sizes.md,
      textDecorationLine: 'line-through',
    },
    priceValue: {
      fontSize: 40,
    },
    priceTag: {
      fontSize: typography.sizes.xs,
    },
    priceError: {
      fontSize: typography.sizes.sm,
    },

    featuresHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing('4'),
    },
    featuresTitle: {
      fontSize: typography.sizes.lg,
    },
    featuresCount: {
      fontSize: typography.sizes.xs,
      opacity: 0.5,
    },

    bentoGrid: {
      gap: spacing('3'),
    },
    bentoRow: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    bentoFull: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing('4'),
      gap: spacing('3'),
    },
    bentoFullFirst: {
      borderColor: colors.primary + '40',
    },
    bentoFullTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    bentoFullName: {
      fontSize: typography.sizes.sm,
      flex: 1,
      flexShrink: 1,
    },
    bentoFullDesc: {
      fontSize: typography.sizes.xs,
      lineHeight: 18,
      opacity: 0.65,
      flexShrink: 1,
    },
    bentoHalf: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing('3.5'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },
    bentoHalfName: {
      fontSize: typography.sizes.xs,
      flex: 1,
      flexShrink: 1,
    },

    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cta: {
      backgroundColor: colors.text,
      height: sizes.button.lg.height,
      borderRadius: sizes.button.lg.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('4'),
    },
    ctaText: {
      fontSize: sizes.button.lg.fontSize,
    },
    footerLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('3'),
    },
    footerLink: {
      fontSize: 11,
      opacity: 0.5,
    },
    footerSep: {
      width: 3,
      height: 3,
      borderRadius: radius('full'),
      backgroundColor: colors.textMuted,
      opacity: 0.2,
    },

    successWrapper: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      justifyContent: 'space-between',
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
    },
    successContent: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing('6'),
    },
    successIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    successDot: {
      width: 8,
      height: 8,
      borderRadius: radius('full'),
      backgroundColor: colors.success,
    },
    successLabel: {
      fontSize: typography.sizes.xs,
    },
    successHeading: {
      fontSize: 36,
      lineHeight: 40,
    },
    successBody: {
      fontSize: typography.sizes.md,
      lineHeight: 22,
      maxWidth: '85%',
    },
    successBtn: {
      backgroundColor: colors.text,
      height: sizes.button.lg.height,
      borderRadius: sizes.button.lg.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
    },
    successBtnText: {
      fontSize: sizes.button.lg.fontSize,
    },
  });
