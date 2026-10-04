import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
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
    icon: 'lightning' as const,
    colorKey: 'primary' as const,
    label: 'whatsNew' as const,
  },
  {
    icon: 'lock-key' as const,
    colorKey: 'success' as const,
    label: 'dataSafe' as const,
  },
  {
    icon: 'chart-bar' as const,
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
            <Text variant="title" style={styles.brand}>
              Fintraq<Text inline color={colors.primary}>.</Text>{/* design-system-ignore: logotype mark */}
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
            <Text variant="label" color={colors.primaryInk} style={styles.eyebrow}>{t('update.required')}</Text>
            <Text variant="display">
              {t('update.versionAvailable', { version: latestVersion })}
            </Text>
            <Text variant="body" tone="muted" style={styles.stepSubtitle}>
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
                  <Text variant="bodyStrong">{t(`update.${card.label}`)}</Text>
                  <Text variant="callout" tone="muted">{t(`update.${card.label}Detail`)}</Text>
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
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
    },
    brand: {
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
      textTransform: 'uppercase',
      marginBottom: spacing('3'),
    },
    stepSubtitle: {
      marginTop: spacing('2.5'),
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

    // ── Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('5') : spacing('6'),
      paddingTop: spacing('2'),
    },
  });
}
