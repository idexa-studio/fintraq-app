import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import type { LoanStatus } from '../api/loans';

type Props = { status: LoanStatus };

export const LoanStatusBadge = React.memo(function LoanStatusBadge({ status }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, typography } = theme;

  const config = useMemo(() => {
    switch (status) {
      case 'repaid': return { label: 'Repaid', bg: colors.success + '20', text: colors.success };
      case 'overdue': return { label: 'Overdue', bg: colors.danger + '20', text: colors.danger };
      default:        return { label: 'Active',  bg: colors.primary + '20', text: colors.primary };
    }
  }, [status, colors]);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text, fontFamily: typography.fonts.semibold }]}>
        {config.label}
      </Text>
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    label: { fontSize: 11 },
  });
