import React, { useCallback, useMemo } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CloudDownloadIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Button } from '@/src/components/ui/Button';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

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
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleUpdatePress = useCallback(async () => {
    const storeUrl = Platform.OS === 'ios' ? iosStoreUrl : androidStoreUrl;
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        const fallbackUrl = Platform.OS === 'ios'
          ? 'https://apps.apple.com'
          : 'https://play.google.com/store';
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Error opening store URL:', error);
    }
  }, [androidStoreUrl, iosStoreUrl]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Glowing Pulse Ring Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner}>
              <HugeiconsIcon icon={CloudDownloadIcon} size={32} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Text Details block */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.subtitle}>
            {message ||
              'A new version of Fintraq is available. To continue using the app securely, please download the latest update from the store.'}
          </Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>
              v{currentVersion} → v{latestVersion}
            </Text>
          </View>
        </View>

        {/* Action button container */}
        <View style={styles.buttonContainer}>
          <Button
            title="Update now"
            onPress={handleUpdatePress}
            variant="primary"
            size="lg"
            icon={CloudDownloadIcon}
          />
        </View>
      </View>
    </SafeAreaView>
  );
});

function createStyles({ spacing, radius, typography, colors }: ThemeContextType) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: spacing('8'),
      paddingVertical: spacing('10'),
    },
    // Graphic element
    graphicContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing('4'),
    },
    pulseOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary + '0B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pulseInner: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary + '18',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Text container
    infoContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('2'),
      paddingTop: spacing('2'),
    },
    title: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      opacity: 0.85,
    },
    versionBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
      marginTop: spacing('2'),
    },
    versionBadgeText: {
      fontFamily: typography.styles.badge.fontFamily,
      fontSize: 11,
      color: colors.primary,
    },
    // Buttons container
    buttonContainer: {
      width: '100%',
      paddingHorizontal: spacing('2'),
    },
  });
}
