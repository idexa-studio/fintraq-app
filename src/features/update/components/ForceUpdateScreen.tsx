import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { FlashIcon, LockPasswordIcon, BarChartIcon } from '@hugeicons/core-free-icons';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Button } from '@/src/components/ui/Button';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

type Props = {
  androidStoreUrl: string;
  iosStoreUrl: string;
  currentVersion: string;
  latestVersion: string;
  message?: string;
};

const INFO_CARDS = [
  {
    icon: FlashIcon,
    colorKey: 'primary' as const,
    label: 'whatsNew' as const,
  },
  {
    icon: LockPasswordIcon,
    colorKey: 'success' as const,
    label: 'dataSafe' as const,
  },
  {
    icon: BarChartIcon,
    colorKey: 'info' as const,
    label: 'freeUpdate' as const,
  },
];

export const ForceUpdateScreen = React.memo(function ForceUpdateScreen({
  androidStoreUrl,
  iosStoreUrl,
  latestVersion,
  message,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [opacity]);

  const handleUpdatePress = useCallback(async () => {
    const storeUrl = Platform.OS === 'ios' ? iosStoreUrl : androidStoreUrl;
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        await Linking.openURL(
          Platform.OS === 'ios' ? 'https://apps.apple.com' : 'https://play.google.com/store'
        );
      }
    } catch {
      // Silent — button stays available
    }
  }, [androidStoreUrl, iosStoreUrl]);

  return (
    <Screen variant="fixed" edges={['top', 'bottom']}>

      <Animated.View style={[styles.inner, { opacity }]}>
        {/* ── Brand header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerSlot} />
            <Text style={styles.brand}>
              Fintraq<Text inline color={colors.primary}>.</Text>
            </Text>
            <View style={styles.headerSlot} />
          </View>
        </View>

        {/* ── Scrollable content ────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step meta */}
          <View style={styles.stepMeta}>
            <Text style={styles.eyebrow}>{t('update.required')}</Text>
            <Text style={styles.stepTitle}>
              {t('update.versionAvailable', { version: latestVersion })}
            </Text>
            <Text style={styles.stepSubtitle}>
              {message || t('update.defaultMessage')}
            </Text>
          </View>

          {/* Info cards */}
          <View style={styles.cards}>
            {INFO_CARDS.map((card) => (
              <View key={card.label} style={styles.card}>
                <IconAvatar
                  icon={card.icon}
                  color={colors[card.colorKey]}
                  variant="subtle"
                  size={48}
                  iconSize={22}
                />
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{t(`update.${card.label}`)}</Text>
                  <Text style={styles.cardDetail}>{t(`update.${card.label}Detail`)}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ── Pinned footer ─────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Button title={t('update.updateNow')} onPress={handleUpdatePress} variant="primary" size="lg" />
        </View>
      </Animated.View>
    </Screen>
  );
});

function createStyles({ spacing, radius, typography, colors, layout }: ThemeContextType) {
  return StyleSheet.create({
    inner: {
      flex: 1,
    },

    // ── Header
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSlot: {
      width: 42,
      height: 42,
    },
    brand: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xxl,
      color: colors.text,
      textAlign: 'center',
    },

    // ── Scroll content
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('5'),
      paddingBottom: spacing('6'),
      flexGrow: 1,
    },

    // Step meta (eyebrow + title + subtitle)
    stepMeta: {
      marginBottom: spacing('5'),
    },
    eyebrow: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      ...typography.metrics.xs,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing('3'),
    },
    stepTitle: {
      fontFamily: typography.fonts.heading,
      ...typography.metrics.xxxl,
      color: colors.text,
    },
    stepSubtitle: {
      marginTop: spacing('2.5'),
      fontFamily: typography.fonts.regular,
      ...typography.metrics.md,
      color: colors.textMuted,
      maxWidth: 320,
    },

    // Info cards (WelcomeStep pattern)
    cards: {
      gap: spacing('3'),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
    cardText: {
      flex: 1,
      gap: spacing('1'),
    },
    cardLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    cardDetail: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.sm,
      color: colors.textMuted,
    },

    // ── Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('5') : spacing('6'),
      paddingTop: spacing('2'),
    },
  });
}
