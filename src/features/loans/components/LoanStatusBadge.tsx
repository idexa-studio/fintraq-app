import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import type { LoanStatus } from '../api/loans';
import { useTranslation } from 'react-i18next';

type Props = { status: LoanStatus };

export const LoanStatusBadge = React.memo(function LoanStatusBadge({ status }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  const config = useMemo(() => {
    switch (status) {
      case 'repaid': return { label: t('loans.statusRepaid'), bg: colors.success + '20', text: colors.success };
      case 'overdue': return { label: t('loans.statusOverdue'), bg: colors.danger + '20', text: colors.danger };
      default:        return { label: t('loans.statusActive'),  bg: colors.primary + '20', text: colors.primary };
    }
  }, [status, colors, t]);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
});

const createStyles = ({ spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: spacing('2'),
      paddingVertical: spacing('0.5'),
      borderRadius: radius('full'),
    },
    label: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.styles.chipLabelActive.fontFamily,
    },
  });
