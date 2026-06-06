import { usePremium } from '@/src/providers/PremiumProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
}

/**
 * PremiumGuard - Editorial Bento & MD3 Locked Card Design
 * 
 * Sizes:
 * - small: 56px min height, 12px padding, 12px radius (md)
 * - medium: 76px min height, 16px padding, 16px radius (lg)
 * - large: 90px min height, 20px padding, 20px radius (xl)
 */
export const PremiumGuard = React.memo(function PremiumGuard({
  children,
  label = 'Pro only',
  size = 'large',
  containerStyle
}: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const theme = useTheme();
  const { colors, spacing, radius, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const { isSmall, containerStyles, iconBoxStyles, iconSize } = useMemo(() => {
    const small = size === 'small';
    const medium = size === 'medium';
    
    const padding = small ? spacing('3') : medium ? spacing('4') : spacing('5');
    const borderRadius = small ? radius('md') : medium ? radius('lg') : radius('xl');
    const minHeight = small ? 56 : medium ? 76 : 90;
    
    return {
      isSmall: small,
      containerStyles: [
        styles.container,
        { 
          backgroundColor: colors.surface, 
          padding,
          borderRadius,
          minHeight,
          marginHorizontal: layout.screenPadding, // Default margin to align with bento layout
        },
        containerStyle
      ],
      iconBoxStyles: [
        styles.iconBox,
        { 
          backgroundColor: colors.primary + '12', 
          width: small ? 32 : 44,
          height: small ? 32 : 44,
          borderRadius: radius('full'),
        },
      ],
      iconSize: small ? 14 : 18,
    };
  }, [size, colors.surface, colors.primary, layout.screenPadding, containerStyle, styles, spacing, radius]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={containerStyles}
    >
      {/* Background Accent & Watermark */}
      <View style={styles.accentOverlay} />
      <MaterialCommunityIcons
        name="creation"
        size={isSmall ? 60 : 120}
        color={colors.primary}
        style={styles.watermark}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={iconBoxStyles}>
            <MaterialCommunityIcons name="lock-outline" size={iconSize} color={colors.primary} />
          </View>

          <View style={styles.textDetails}>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>
              {label}
            </Text>
            {!isSmall && (
              <Text style={styles.subtitle}>
                Unlock with Keeep Pro
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) => StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 0,
  },
  accentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.02,
  },
  watermark: {
    position: 'absolute',
    right: -spacing('5'),
    bottom: -spacing('8'),
    opacity: 0.05,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('3.5'),
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  textDetails: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing('1'),
  },
  titleSmall: {
    fontSize: 11,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
