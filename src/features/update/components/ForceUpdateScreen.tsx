import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashIcon, LockPasswordIcon, BarChartIcon } from '@hugeicons/core-free-icons';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { Button } from '@/src/components/ui/Button';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

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
    label: "What's new",
    detail: 'Performance improvements, bug fixes, and refined experience.',
  },
  {
    icon: LockPasswordIcon,
    colorKey: 'success' as const,
    label: 'Your data is safe',
    detail: 'All your data stays on your device, untouched.',
  },
  {
    icon: BarChartIcon,
    colorKey: 'info' as const,
    label: 'Free update',
    detail: 'All Fintraq updates are free, forever.',
  },
];

export const ForceUpdateScreen = React.memo(function ForceUpdateScreen({
  androidStoreUrl,
  iosStoreUrl,
  latestVersion,
  message,
}: Props) {
  const theme = useTheme();
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <PageBackground />

      <Animated.View style={[styles.inner, { opacity }]}>
        {/* ── Brand header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerSlot} />
            <Text style={styles.brand}>
              Fintraq<Text style={{ color: colors.primary }}>.</Text>
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
            <Text style={styles.eyebrow}>Update required</Text>
            <Text style={styles.stepTitle}>
              Version {latestVersion}{'\n'}is available
            </Text>
            <Text style={styles.stepSubtitle}>
              {message ||
                'Please update Fintraq to continue. It only takes a moment.'}
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
                  <Text style={styles.cardLabel}>{card.label}</Text>
                  <Text style={styles.cardDetail}>{card.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ── Pinned footer ─────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Button title="Update now" onPress={handleUpdatePress} variant="primary" size="lg" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
});

function createStyles({ spacing, radius, typography, colors, layout }: ThemeContextType) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
      fontSize: typography.sizes.xxl,
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
      fontSize: typography.sizes.xs,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing('3'),
    },
    stepTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      lineHeight: 34,
      color: colors.text,
    },
    stepSubtitle: {
      marginTop: spacing('2.5'),
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      lineHeight: 22,
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
      fontSize: 15,
      color: colors.text,
    },
    cardDetail: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
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
