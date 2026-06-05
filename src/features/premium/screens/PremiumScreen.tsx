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

export const PremiumScreen = React.memo(function PremiumScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const { products, purchasePremium, restorePurchase, isLoading } = usePremium();
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

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Keeep Pro" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>Lifetime upgrade</Text>
          <Text style={[styles.heroTitle, { fontFamily: typography.fonts.heading, color: colors.text }]}>One payment.{'\n'}Everything. Forever.</Text>
          <Text style={[styles.heroSub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>No subscriptions. No recurring charges. A single lifetime payment for every professional tool.</Text>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            {lifetimeProduct ? (
              <View>
                <View style={styles.priceTop}>
                  {lifetimeProduct.originalPrice && <Text style={[styles.priceOrig, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>{lifetimeProduct.originalPrice}</Text>}
                  <View style={styles.pill}><Text style={[styles.pillText, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>Best value</Text></View>
                </View>
                <Text style={[styles.priceValue, { fontFamily: typography.fonts.amountBold, color: colors.text }]}>{lifetimeProduct.displayPrice}</Text>
                <Text style={[styles.priceTag, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>One time · All features · All updates</Text>
              </View>
            ) : isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
            ) : (
              <Text style={[styles.priceError, { fontFamily: typography.fonts.regular, color: colors.danger }]}>Pricing unavailable</Text>
            )}
          </View>
          <View style={styles.priceSep} />
          <View style={styles.perks}>
            <View style={styles.perk}><MaterialCommunityIcons name="shield-check" size={14} color={colors.success} /><Text style={[styles.perkText, { fontFamily: typography.fonts.regular, color: colors.success }]}>Permanent license</Text></View>
            <View style={styles.perk}><MaterialCommunityIcons name="sync" size={14} color={colors.success} /><Text style={[styles.perkText, { fontFamily: typography.fonts.regular, color: colors.success }]}>Future updates included</Text></View>
          </View>
        </View>

        <SectionHeader title="Everything included" noPadding />

        <View style={styles.grid}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.tile}>
              <MaterialCommunityIcons name={f.icon} size={20} color={colors.primary} />
              <Text style={[styles.tileTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.tileDesc, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={3}>{f.description}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handlePurchase} disabled={isProcessing || !lifetimeProduct} activeOpacity={0.85}>
          {isProcessing ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.ctaText, { fontFamily: typography.fonts.bold, color: colors.background }]}>Get lifetime access</Text>}
        </TouchableOpacity>
        <View style={styles.legal}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}><Text style={[styles.legalText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Restore purchase</Text></TouchableOpacity>
          <View style={styles.legalDot} />
          <TouchableOpacity onPress={() => Alert.alert('Terms', 'One-time purchase tied to your store account.')}><Text style={[styles.legalText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Terms</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: layout.screenPadding },
    hero: { paddingTop: spacing('6'), paddingBottom: spacing('5'), gap: spacing('3') },
    heroLabel: { fontSize: typography.sizes.xs },
    heroTitle: { fontSize: typography.sizes.xxxl, lineHeight: 34 },
    heroSub: { fontSize: typography.sizes.sm, lineHeight: 20, opacity: 0.7 },
    priceCard: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('5'), marginBottom: spacing('6'), gap: spacing('4') },
    priceRow: {},
    priceTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('2.5'), marginBottom: spacing('2') },
    priceOrig: { fontSize: typography.sizes.md, textDecorationLine: 'line-through', opacity: 0.5 },
    pill: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing('2.5'), paddingVertical: spacing('0.5'), borderRadius: radius('full') },
    pillText: { fontSize: typography.sizes.xs },
    priceValue: { fontSize: 44, lineHeight: 48 },
    priceTag: { fontSize: typography.sizes.xs, opacity: 0.6, marginTop: spacing('1') },
    priceError: { fontSize: typography.sizes.sm },
    priceSep: { height: 1, backgroundColor: colors.text + '0C' },
    perks: { gap: spacing('2') },
    perk: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    perkText: { fontSize: typography.sizes.xs },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    tile: { width: '47%', backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('3.5'), gap: spacing('2') },
    tileTitle: { fontSize: typography.sizes.sm },
    tileDesc: { fontSize: typography.sizes.xs, lineHeight: 17, opacity: 0.6 },
    footer: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'), backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.text + '08' },
    cta: { height: sizes.button.lg.height, borderRadius: sizes.button.lg.borderRadius, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing('3') },
    ctaText: { fontSize: sizes.button.lg.fontSize },
    legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing('3') },
    legalText: { fontSize: typography.sizes.xs, opacity: 0.5 },
    legalDot: { width: 3, height: 3, borderRadius: radius('full'), backgroundColor: colors.textMuted, opacity: 0.3 },
  });
