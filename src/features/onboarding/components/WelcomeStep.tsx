import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSurface, Icon, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { formatCurrency } from '@/src/utils/format';

type Props = { currency: string };

const PERKS: { key: 'offline' | 'private' | 'fast'; icon: IconSource }[] = [
  { key: 'offline', icon: 'cloud' },
  { key: 'private', icon: 'lock-key' },
  { key: 'fast', icon: 'lightning' },
];

/** Relative heights of the week's spending in the illustration (Mon → Sun). */
const WEEK = [0.45, 0.7, 0.35, 0.85, 0.55, 1, 0.6];

/**
 * The first screen is a picture of the app, not a list of features: a balance card with a week of
 * spending and two entries landing on it, drawn from the real hero and row styles, in the user's
 * own currency. Three short perks underneath say why it's different.
 */
export const WelcomeStep = React.memo(function WelcomeStep({ currency }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero, colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <HeroSurface style={styles.stage}>
        <Text variant="headline" color={hero.textPrimary} style={styles.brand}>
          Fintraq.
        </Text>

        {/* The balance card, tilted slightly so it reads as an object sitting on the stage. */}
        <View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text variant="caption" tone="muted">
            {t('dashboard.balance')}
          </Text>
          <Text variant="title" style={styles.cardAmount}>
            {formatCurrency(24550, currency)}
          </Text>
          <View style={styles.bars}>
            {WEEK.map((h, i) => (
              <View key={i} style={[styles.bar, { height: 8 + h * 40 }, i === WEEK.length - 2 && styles.barToday]} />
            ))}
          </View>
        </View>

        <View style={[styles.chip, styles.chipIn]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.chipDisc}>
            <Icon name="arrow-down-left" size={12} color={hero.onInk} weight="bold" />
          </View>
          <Text variant="label" color={colors.onInk} numberOfLines={1}>
            {`${t('onboardingFlow.mock.salary')}  +${formatCurrency(4200, currency)}`}
          </Text>
        </View>

        <View style={[styles.chip, styles.chipOut]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="coffee" size={13} color={colors.text} />
          <Text variant="label" numberOfLines={1}>
            {`${t('onboardingFlow.mock.coffee')}  −${formatCurrency(120, currency)}`}
          </Text>
        </View>
      </HeroSurface>

      <View style={styles.copy}>
        <Text variant="display">{t('onboardingFlow.hello.title')}</Text>
        <Text variant="body" tone="muted">
          {t('onboardingFlow.hello.subtitle')}
        </Text>
      </View>

      <View style={styles.perks}>
        {PERKS.map((p) => (
          <View key={p.key} style={styles.perk}>
            <Icon name={p.icon} size={16} color={colors.primaryInk} />
            <Text variant="label" align="center" numberOfLines={2}>
              {t(`onboardingFlow.perks.${p.key}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const STAGE = 320;

const createStyles = ({ colors, heroCard: hero, spacing, radius, typography, alpha }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('6') },
    stage: { height: STAGE, padding: spacing('5') },
    brand: { position: 'absolute', top: spacing('5'), left: spacing('5') },
    card: {
      position: 'absolute',
      left: spacing('6'),
      right: spacing('10'),
      top: 84,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('1'),
      transform: [{ rotate: '-3deg' }],
    },
    cardAmount: { ...typography.metrics.xxl, fontFamily: typography.fonts.amountBold },
    bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 52, marginTop: spacing('3') },
    bar: { width: 14, borderRadius: radius('full'), backgroundColor: colors.card },
    barToday: { backgroundColor: colors.primary },
    chip: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      height: 36,
      paddingHorizontal: spacing('3'),
      borderRadius: radius('full'),
    },
    chipIn: { top: 60, right: spacing('4'), backgroundColor: hero.ink, paddingLeft: 6, transform: [{ rotate: '4deg' }] },
    chipDisc: { width: 24, height: 24, borderRadius: radius('full'), backgroundColor: alpha(colors.onInk, 'soft'), alignItems: 'center', justifyContent: 'center' },
    chipOut: { bottom: spacing('5'), right: spacing('6'), backgroundColor: colors.surface, transform: [{ rotate: '-2deg' }] },
    copy: { gap: spacing('2.5') },
    perks: { flexDirection: 'row', gap: spacing('2') },
    perk: {
      flex: 1,
      alignItems: 'center',
      gap: spacing('1.5'),
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('2'),
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
    },
  });
