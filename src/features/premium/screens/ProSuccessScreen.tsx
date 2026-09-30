import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, Screen, Text } from '@/src/components/ui';
import { ProFeatureList } from '@/src/features/premium/components/ProFeatureList';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

/** What a Pro owner sees at /premium: their licence and everything it unlocked. */
export const ProSuccessScreen = React.memo(function ProSuccessScreen() {
  const theme = useTheme();
  const { heroCard, colors } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  return (
    <Screen
      header={{ title: t('premium.title'), showBack: true }}
      footer={<Button title={t('premium.openDashboard')} onPress={() => router.replace('/(main)/(tabs)')} size="lg" fullWidth />}
    >
      <View style={styles.hero}>
        <View style={styles.ring} pointerEvents="none" />
        <Text variant="micro" color={heroCard.textMuted} style={styles.eyebrow}>
          {t('premium.proActive')}
        </Text>
        <Text variant="title" color={heroCard.textPrimary}>
          {t('premium.allSet')}
        </Text>
        <Text variant="callout" color={heroCard.textMuted}>
          {t('premium.allSetDesc')}
        </Text>
      </View>

      <View style={styles.licence}>
        <View style={styles.licenceText}>
          <Text variant="bodyStrong">{t('premium.lifetimeLicense')}</Text>
          <Text variant="caption" tone="muted">
            {t('premium.linkedStore')}
          </Text>
        </View>
        <Badge label={t('premium.active')} color={colors.success} />
      </View>

      <ProFeatureList unlocked />
    </Screen>
  );
});

const RING = 220;

const createStyles = ({ colors, spacing, radius }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    hero: { backgroundColor: heroCard.background, borderRadius: radius('2xl'), padding: spacing('5'), gap: spacing('1.5'), overflow: 'hidden' },
    ring: {
      position: 'absolute',
      width: RING,
      height: RING,
      borderRadius: radius('full'),
      borderWidth: 28,
      borderColor: heroCard.decoOverlay,
      top: -RING * 0.45,
      right: -RING * 0.3,
    },
    eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6 },
    licence: { flexDirection: 'row', alignItems: 'center', gap: spacing('3'), backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4') },
    licenceText: { flex: 1, gap: spacing('0.5') },
  });
