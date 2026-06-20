import { Platform, StyleSheet } from 'react-native';
import { ThemeContextType } from '../../providers/ThemeProvider';

export const createOnboardingStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    keyboardWrap: {
      flex: 1,
    },
    header: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      gap: spacing('3'),
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerBackButton: {
      width: 42,
      height: 42,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerBackPlaceholder: {
      width: 42,
      height: 42,
    },
    brand: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xxl,
      color: colors.text,
      textAlign: 'center',
    },
    stepPill: {
      minWidth: 42,
      height: 42,
      borderRadius: radius('full'),
      paddingHorizontal: spacing('2.5'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    stepPillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.text,
    },
    progressTrack: {
      flexDirection: 'row',
      gap: spacing('2'),
    },
    progressDot: {
      flex: 1,
      height: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('5'),
      paddingBottom: spacing('6'),
      flexGrow: 1,
    },
    stepMeta: {
      marginBottom: spacing('5'),
    },
    eyebrow: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.primary,
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
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? spacing('5') : spacing('6'),
      paddingTop: spacing('2'),
    },
    primaryAction: {
      width: '100%',
    },
  });
