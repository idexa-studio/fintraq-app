import { StyleSheet } from 'react-native';
import type { ThemeContextType } from '@/src/providers/ThemeProvider';
import { alpha } from '@/src/theme/tokens';

/** Row styles shared by the Google backup card sections, so they stay visually identical. */
export const createBackupRowStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      backgroundColor: colors.surface,
    },
    rowInfo: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
    },
    rowLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      ...typography.metrics.md,
      color: colors.text,
    },
    rowSubtitle: {
      fontFamily: typography.fonts.regular,
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    trailingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      backgroundColor: alpha(colors.primary, 'subtle'),
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
    },
    trailingBadgeText: {
      fontFamily: typography.fonts.medium,
      ...typography.metrics.xs,
      color: colors.primary,
    },
  });
