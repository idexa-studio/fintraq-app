import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AlertDialog, Badge, BentoPressable, Button, Icon, Screen, Spinner, Text } from '@/src/components/ui';
import { SKU_LIFETIME } from '@/src/constants/iap';
import { ProFeatureList, ProFeatureRow } from '@/src/features/premium/components/ProFeatureList';
import { isProFeatureId } from '@/src/features/premium/pro-features';
import { useAlertDialog } from '@/src/hooks/useAlertDialog';
import { usePremium } from '@/src/providers/PremiumProvider';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { AnalyticsService } from '@/src/services/analytics';

/**
 * The paywall. Opened from a locked feature it leads with that feature ("You tried this"), then
 * lists everything Pro includes by area, with one pinned purchase button.
 */
export const PremiumScreen = React.memo(function PremiumScreen() {
  const theme = useTheme();
  const { heroCard, colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);
  const { products, purchasePremium, restorePurchase, isLoading } = usePremium();
  const { showAlert, alertProps } = useAlertDialog();
  const [isProcessing, setIsProcessing] = useState(false);

  const params = useLocalSearchParams<{ feature?: string }>();
  const triedFeature = isProFeatureId(params.feature) ? params.feature : undefined;
  const product = useMemo(() => products.find((p) => p.id === SKU_LIFETIME), [products]);

  useEffect(() => {
    AnalyticsService.premiumPaywallViewed().catch(() => {});
  }, [triedFeature]);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <Screen
      header={{ title: t('premium.title'), showBack: true }}
      footer={
        <View style={styles.footer}>
          <Button
            title={t('premium.upgradeFor', { price: product?.displayPrice ?? t('premium.pro') })}
            onPress={() => run(purchasePremium)}
            disabled={!product}
            isLoading={isProcessing}
            size="lg"
            fullWidth
          />
          <View style={styles.legal}>
            <BentoPressable onPress={() => run(restorePurchase)} disabled={isProcessing} accessibilityRole="button">
              <Text variant="caption" tone="muted">
                {t('premium.restorePurchase')}
              </Text>
            </BentoPressable>
            <View style={styles.legalDot} />
            <BentoPressable onPress={() => showAlert({ title: t('premium.termsTitle'), message: t('premium.termsMessage') })} accessibilityRole="button">
              <Text variant="caption" tone="muted">
                {t('premium.terms')}
              </Text>
            </BentoPressable>
          </View>
        </View>
      }
      overlays={<AlertDialog {...alertProps} />}
    >
      <View style={styles.hero}>
        <View style={[styles.ring, styles.ringLarge]} pointerEvents="none" />
        <View style={[styles.ring, styles.ringSmall]} pointerEvents="none" />
        <Text variant="micro" color={heroCard.textMuted} style={styles.eyebrow}>
          {t('premium.lifetimeUpgrade')}
        </Text>
        <Text variant="title" color={heroCard.textPrimary}>
          {t('premium.heroTitle')}
        </Text>
        <Text variant="callout" color={heroCard.textMuted}>
          {t('premium.heroDesc')}
        </Text>
        <View style={styles.perks}>
          {[
            { key: 'oneTime', icon: 'shield-check' as const },
            { key: 'storeLinked', icon: 'reload' as const },
          ].map((perk) => (
            <View key={perk.key} style={styles.perk}>
              <Icon name={perk.icon} size={14} color={heroCard.textPrimary} />
              <Text variant="label" color={heroCard.textPrimary} numberOfLines={1} style={styles.perkText}>
                {t(`premium.${perk.key as 'oneTime' | 'storeLinked'}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.price}>
        <View style={styles.priceText}>
          <Text variant="bodyStrong">{t('premium.lifetimeLicense')}</Text>
          <Text variant="caption" tone="muted">
            {t('premium.allIncluded')}
          </Text>
        </View>
        {product ? (
          <View style={styles.priceValue}>
            {product.originalPrice ? (
              <Text variant="callout" tone="muted" style={styles.strike}>
                {product.originalPrice}
              </Text>
            ) : null}
            <Text variant="amountLarge">{product.displayPrice}</Text>
          </View>
        ) : isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Text variant="caption" tone="danger">
            {t('premium.pricingUnavailable')}
          </Text>
        )}
      </View>

      {triedFeature ? (
        <View>
          <View style={styles.triedLabel}>
            <Badge label={t('premium.gate.youTried')} color={colors.warning} />
          </View>
          <View style={styles.triedCard}>
            <ProFeatureRow feature={triedFeature} />
          </View>
        </View>
      ) : null}

      <ProFeatureList exclude={triedFeature} />
    </Screen>
  );
});

const RING_LARGE = 220;
const RING_SMALL = 110;

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    hero: {
      backgroundColor: heroCard.background,
      borderRadius: radius('2xl'),
      padding: spacing('5'),
      gap: spacing('1.5'),
      overflow: 'hidden',
    },
    ring: { position: 'absolute', borderRadius: radius('full'), borderColor: heroCard.decoOverlay },
    ringLarge: { width: RING_LARGE, height: RING_LARGE, borderWidth: 28, top: -RING_LARGE * 0.45, right: -RING_LARGE * 0.3 },
    ringSmall: { width: RING_SMALL, height: RING_SMALL, borderWidth: 16, bottom: -RING_SMALL * 0.5, right: RING_SMALL * 0.4 },
    eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6 },
    perks: { flexDirection: 'row', gap: spacing('2'), marginTop: spacing('3') },
    perk: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      backgroundColor: heroCard.tile,
      paddingVertical: spacing('2'),
      paddingHorizontal: spacing('3'),
      borderRadius: radius('lg'),
    },
    perkText: { flexShrink: 1 },
    price: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
    priceText: { flex: 1, gap: spacing('0.5') },
    priceValue: { alignItems: 'flex-end' },
    strike: { textDecorationLine: 'line-through' },
    triedLabel: { flexDirection: 'row', marginBottom: spacing('2'), marginLeft: spacing('1') },
    triedCard: {
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: alpha(colors.warning, 'strong'),
      overflow: 'hidden',
    },
    footer: { gap: spacing('3') },
    legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing('3') },
    legalDot: { width: 4, height: 4, borderRadius: radius('full'), backgroundColor: colors.textMuted },
  });
