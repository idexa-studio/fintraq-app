import { Text } from '@/src/components/ui/Text';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { resolveIcon } from '@/src/utils/icons';
import { DashboardInsight } from '@/data/repositories/insights';

interface InsightCardProps {
  insight: DashboardInsight;
}

export const InsightCard = React.memo(function InsightCard({ insight }: InsightCardProps) {
  const theme = useTheme();
  const { colors } = theme;
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
        icon={resolveIcon(insight.icon, 'chart-line-data')}
        color={accent}
        variant="subtle"
        size={34}
        iconSize={16}
      />
      <View style={styles.text}>
        <Text variant="calloutStrong" numberOfLines={1}>
          {insight.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {insight.subtitle}
        </Text>
      </View>
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3.5'),
      alignItems: 'flex-start',
      minHeight: 88,
    },
    text: {
      flex: 1,
      gap: spacing('0.5'),
    },
  });
