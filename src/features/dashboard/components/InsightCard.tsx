import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconAvatar } from '../../../components/ui/IconAvatar';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { formatCurrency } from '../../../utils/format';
import { resolveIcon } from '../../../utils/icons';
import { DashboardInsight } from '../api/insights';

interface InsightCardProps {
  insight: DashboardInsight;
}

export const InsightCard = React.memo(function InsightCard({ insight }: InsightCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const status = useMemo(() => {
    switch (insight.type) {
      case 'success': return { bg: colors.success + '15', text: colors.success };
      case 'danger': return { bg: colors.danger + '15', text: colors.danger };
      case 'warning': return { bg: colors.warning + '15', text: colors.warning };
      case 'info': return { bg: colors.info + '15', text: colors.info };
      default: return { bg: colors.surface, text: colors.text };
    }
  }, [insight.type, colors.success, colors.danger, colors.warning, colors.info, colors.surface, colors.text]);

  const displayValue = useMemo(() => {
    switch (insight.valueType) {
      case 'amount':
        return formatCurrency(insight.amount, insight.currency);
      case 'percentage':
        return `${insight.percentage > 0 ? '+' : ''}${insight.percentage.toFixed(0)}%`;
      case 'text':
        return insight.text;
    }
  }, [insight]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface + '90', borderColor: colors.border }]}>
      <View style={styles.header}>
        <IconAvatar icon={resolveIcon(insight.icon, 'analytics-outline')} bg={status.bg} color={status.text} size={28} iconSize={14} />
        <Text style={[styles.title, { color: colors.textMuted }]}>{insight.title.toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{displayValue}</Text>
        <View style={styles.trendContainer}>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {insight.subtitle}
          </Text>
          {insight.trend && (
            <Ionicons
              name={insight.trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={insight.type === 'danger' ? colors.danger : colors.success}
              style={styles.trendIcon}
            />
          )}
        </View>
      </View>

    </View>
  );
});

const createStyles = ({ typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  card: {
    width: 210,
    minHeight: 115,
    borderRadius: radius('2xl'),
    borderWidth: 1,
    padding: spacing('3.5'),
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('2'),
    marginBottom: spacing('2'),
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontFamily: typography.fonts.amountBold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing('0.5'),
  },
  subtitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.2,
    flex: 1,
  },
  trendIcon: {
    marginLeft: spacing('1'),
  },
});
