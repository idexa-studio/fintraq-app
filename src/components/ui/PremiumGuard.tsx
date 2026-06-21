import { usePremium } from '@/src/providers/PremiumProvider';
import { LockPasswordIcon, SparklesIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

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
 * - small: 56px min height, 12px padding, 8px radius (squircle)
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
  const { colors, spacing, radius } = theme;
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
    
    return {
      isSmall: small,
      containerStyles: [
        styles.container,
        { 
          padding,
          borderRadius,
        },
        containerStyle
      ],
      iconBoxStyles: [
        styles.iconBox,
        { 
          backgroundColor: colors.primaryLight, 
          width: small ? 32 : 40,
          height: small ? 32 : 40,
          borderRadius: small ? 8 : 10, // iOS Squircle: Math.round(size * 0.25)
        },
      ],
      iconSize: small ? 14 : 16,
    };
  }, [size, colors.primaryLight, containerStyle, styles, spacing, radius]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <BentoPressable
      onPress={handlePress}
      style={containerStyles}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={iconBoxStyles}>
            <HugeiconsIcon icon={LockPasswordIcon} size={iconSize} color={colors.primary} />
          </View>

          <View style={styles.textDetails}>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>
              {label}
            </Text>
            {!isSmall && (
              <View style={styles.ctaRow}>
                <Text style={styles.subtitle}>
                  Unlock with Fintraq Pro
                </Text>
                <HugeiconsIcon icon={SparklesIcon} size={10} color={colors.warning} />
              </View>
            )}
          </View>

          {!isSmall && (
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.textMuted} />
          )}
        </View>
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, typography, spacing }: ThemeContextType) => StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 0,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
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
    fontSize: typography.sizes.md,
    lineHeight: 18,
    color: colors.text,
  },
  titleSmall: {
    fontSize: typography.sizes.xs,
    marginBottom: 0,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('1'),
    marginTop: spacing('0.5'),
  },
  subtitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.xs,
    lineHeight: 14,
    color: colors.primary,
  },
});
