import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { Icon } from '@/src/components/ui/Icon';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { FEATURES } from '@/src/constants/iap';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { alpha } from '@/src/theme/tokens';

export const ProSuccessScreen = React.memo(function ProSuccessScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, heroCard } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  return (
    <Screen header={{ title: t('premium.title'), showBack: true }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card — edge-to-edge, dashboard style */}
        <View style={[styles.heroCard, { backgroundColor: heroCard.background }]}>
          <Text style={styles.heroBadge}>{t('premium.proActive')}</Text>
          <Text style={styles.heroTitle}>{t('premium.allSet')}</Text>
          <Text style={styles.heroDesc}>
            {t('premium.allSetDesc')}
          </Text>
        </View>

        {/* Subscription Status Card */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={styles.priceLabel}>{t('premium.lifetimeLicense')}</Text>
              <Text style={styles.priceSubText}>{t('premium.linkedStore')}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{t('premium.active')}</Text>
            </View>
          </View>
        </View>

        {/* Features list */}
        <SectionHeader title={t('premium.unlockedFeatures')} />

        <View style={styles.featuresCard}>
          {FEATURES.map((f, index) => {
            const isLast = index === FEATURES.length - 1;
            return (
              <View key={f.key} style={[styles.featureItem, isLast && styles.noMargin]}>
                <View style={styles.iconWrapperActive}>
                  <Icon icon={f.icon} size={20} color={colors.success} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{t(`premium.features.${f.key}.title`)}</Text>
                  <Text style={styles.featureDesc}>{t(`premium.features.${f.key}.description`)}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pinned Bottom CTA */}
      <View style={styles.footer}>
        <Button title={t('premium.openDashboard')} onPress={() => router.replace('/(main)/(tabs)')} size="lg" fullWidth />
      </View>
    </Screen>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
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
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xxs,
      letterSpacing: 0.5,
      color: heroCard.textMuted,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xxxl,
      color: heroCard.textPrimary,
      marginTop: spacing('1'),
    },
    heroDesc: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
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
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.lg,
      color: colors.text,
    },
    priceSubText: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    pill: {
      backgroundColor: alpha(colors.success, 'subtle'),
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    pillText: {
      ...typography.metrics.xs,
      color: colors.success,
      fontFamily: typography.styles.chipLabel.fontFamily,
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
      backgroundColor: alpha(colors.success, 'subtle'),
    },
    featureContent: {
      flex: 1,
      gap: spacing('0.5'),
    },
    featureTitle: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    featureDesc: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
    },
    // ── Pinned Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      backgroundColor: colors.background,
    },
  });
