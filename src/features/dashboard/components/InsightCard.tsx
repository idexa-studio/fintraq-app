import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { resolveIcon } from '../../../utils/icons';
import { DashboardInsight } from '../api/insights';

interface InsightCardProps {
  insight: DashboardInsight;
}

export const InsightCard = React.memo(function InsightCard({ insight }: InsightCardProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accent = useMemo(() => {
    switch (insight.type) {
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.text;
    }
  }, [insight.type, colors]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <IconAvatar
        icon={resolveIcon(insight.icon, 'chart-timeline-variant')}
        color={accent}
        variant="subtle"
        size={34}
        iconSize={16}
      />
      <View style={styles.text}>
        <Text style={[styles.title, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
          {insight.title}
        </Text>
        <Text style={[styles.sub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={2}>
          {insight.subtitle}
        </Text>
      </View>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3.5'),
      alignItems: 'center',
      minHeight: 80,
    },
    text: {
      flex: 1,
      gap: spacing('0.5'),
    },
    title: {
      fontSize: typography.sizes.sm,
      lineHeight: 18,
    },
    sub: {
      fontSize: typography.sizes.xs,
      lineHeight: 16,
      opacity: 0.65,
    },
  });
