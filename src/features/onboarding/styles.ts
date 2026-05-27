import { Platform, StyleSheet } from 'react-native';
import { ThemeContextType } from '../../providers/ThemeProvider';

export const createOnboardingStyles = ({ colors, typography , layout }: ThemeContextType) =>
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
      paddingTop: 12,
      gap: 14,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerBackButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary + '22',
    },
    headerBackPlaceholder: {
      width: 42,
      height: 42,
    },
    brand: {
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    stepPill: {
      minWidth: 42,
      height: 42,
      borderRadius: 21,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary + '22',
    },
    stepPillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.text,
      letterSpacing: 0.4,
    },
    progressTrack: {
      flexDirection: 'row',
      gap: 8,
    },
    progressDot: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 20,
      paddingBottom: 24,
      flexGrow: 1,
    },
    stepMeta: {
      marginBottom: 20,
    },
    eyebrow: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    stepTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 34,
      lineHeight: 36,
      color: colors.text,
      letterSpacing: -1.1,
    },
    stepSubtitle: {
      marginTop: 10,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textMuted,
      maxWidth: 320,
    },
    contentCard: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 420,
    },
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: Platform.OS === 'ios' ? 18 : 24,
      paddingTop: 8,
    },
    primaryAction: {
      width: '100%',
    },
  });
