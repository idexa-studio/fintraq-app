import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/ui/Button';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  androidStoreUrl: string;
  iosStoreUrl: string;
  currentVersion: string;
  latestVersion: string;
  message?: string;
};

export const ForceUpdateScreen = React.memo(function ForceUpdateScreen({
  androidStoreUrl,
  iosStoreUrl,
  currentVersion,
  latestVersion,
  message,
}: Props) {
  const theme = useTheme();
  const { colors, heroCard } = theme;
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 55, friction: 13, useNativeDriver: true }),
    ]).start();
  }, [opacity, slideUp]);

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[styles.content, { opacity, transform: [{ translateY: slideUp }] }]}
      >
        {/* ── Hero block ───────────────────────────────────────────────────── */}
        <View style={[styles.heroBlock, { backgroundColor: heroCard.background }]}>
          <Text style={[styles.heroBadge, { color: heroCard.textMuted }]}>New version</Text>
          <Text style={[styles.heroVersion, { color: heroCard.textPrimary }]}>v{latestVersion}</Text>
          <Text style={[styles.heroApp, { color: heroCard.textMuted }]}>Fintraq</Text>
        </View>

        {/* ── Info ─────────────────────────────────────────────────────────── */}
        <View style={styles.infoSection}>
          <View style={styles.textBlock}>
            <Text style={styles.eyebrow}>Update required</Text>
            <Text style={styles.title}>A newer version{'\n'}is available</Text>
            <Text style={styles.subtitle}>
              {message ||
                'Please update Fintraq to continue. Your data is safe and will be right here when you return.'}
            </Text>
          </View>

          <View style={styles.versionRow}>
            <View style={[styles.versionCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.versionLabel, { color: colors.textMuted }]}>Current</Text>
              <Text style={[styles.versionValue, { color: colors.textMuted }]}>
                v{currentVersion}
              </Text>
            </View>
            <View style={[styles.versionCard, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.versionLabel, { color: colors.primary }]}>Required</Text>
              <Text style={[styles.versionValue, { color: colors.primary }]}>v{latestVersion}</Text>
            </View>
          </View>
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <View style={styles.ctaSection}>
          <Button title="Update now" onPress={handleUpdatePress} variant="primary" size="lg" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
});

function createStyles(
  { spacing, radius, typography, colors, layout }: ThemeContextType,
  heroCard: HeroCardPalette
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing('8'),
    },

    // ── Hero block
    heroBlock: {
      borderRadius: radius('2xl'),
      paddingHorizontal: spacing('6'),
      paddingTop: spacing('6'),
      paddingBottom: spacing('8'),
      gap: spacing('1'),
    },
    heroBadge: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroVersion: {
      fontFamily: typography.fonts.heading,
      fontSize: 48,
      lineHeight: 52,
      marginTop: spacing('1'),
    },
    heroApp: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
    },

    // ── Info
    infoSection: {
      gap: spacing('5'),
    },
    textBlock: {
      gap: spacing('2'),
    },
    eyebrow: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      lineHeight: 34,
      color: colors.text,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textMuted,
      marginTop: spacing('1'),
    },

    // ── Version row
    versionRow: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    versionCard: {
      flex: 1,
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('4'),
      borderRadius: radius('xl'),
      gap: spacing('0.5'),
    },
    versionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    versionValue: {
      fontFamily: typography.styles.cardTitle.fontFamily,
      fontSize: typography.styles.cardTitle.fontSize,
    },

    // ── CTA
    ctaSection: {
      paddingTop: spacing('4'),
    },
  });
}
