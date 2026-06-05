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
 * PremiumGuard - Editorial Brutalist Design
 * 
 * Sizes:
 * - small: 56px min height, 12px padding, 12px radius (md)
 * - medium: 76px min height, 16px padding, 16px radius (lg)
 * - large: 90px min height, 20px padding, 20px radius (xl)
 * 
 * Icon box: 44px (md), 32px (sm)
 * Action badge: 12px radius (md), 8px (sm)
 */
export const PremiumGuard = React.memo(function PremiumGuard({
  children,
  label = 'Pro only',
  size = 'large',
  containerStyle
}: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const theme = useTheme();
  const { colors, spacing, radius } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const { isSmall, containerStyles, iconBoxStyles, iconSize } = useMemo(() => {
    const small = size === 'small';
    const medium = size === 'medium';
    
    // Size-specific values
    const padding = small ? spacing('3') : medium ? spacing('4') : spacing('5');
    const borderRadius = small ? radius('md') : medium ? radius('lg') : radius('xl');
    const minHeight = small ? 56 : medium ? 76 : 90;
    
    return {
      isSmall: small,
      containerStyles: [
        styles.container,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          padding,
          borderRadius,
          minHeight,
        },
        containerStyle
      ],
      iconBoxStyles: [
        styles.iconBox,
        { 
          backgroundColor: colors.background, 
          borderColor: colors.border,
          width: small ? 32 : 44,
          height: small ? 32 : 44,
          borderRadius: radius('full'),
        },
      ],
      iconSize: small ? 14 : 18,
    };
  }, [size, colors.surface, colors.border, colors.background, containerStyle, styles, spacing, radius]);

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
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, opacity: 0.02 }]} />
      <MaterialCommunityIcons
        name="creation"
        size={isSmall ? 60 : 120}
        color={colors.primary}
        style={[styles.watermark, { opacity: 0.05 }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>

          <View style={iconBoxStyles}>
             <MaterialCommunityIcons name="lock-outline" size={iconSize} color={colors.text} />
          </View>

          <View style={styles.textDetails}>
             <Text style={[styles.title, { color: colors.text }, isSmall && styles.titleSmall]}>
               {label}
             </Text>
             {!isSmall && (
               <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                 Premium member exclusive
               </Text>
             )}
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = ({ typography, spacing }: ThemeContextType) => StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    right: -spacing('5'),
    bottom: -spacing('8'),
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
    borderWidth: 1,
  },
  textDetails: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    marginBottom: spacing('1'),
  },
  titleSmall: {
    fontSize: 11,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
  },
  actionBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
