import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

const FEATURES = [
  {
    icon: 'flash-outline' as const,
    label: 'Fast capture',
    detail: 'Log transactions anywhere in seconds.',
  },
  {
    icon: 'bar-chart-outline' as const,
    label: 'Built-in analytics',
    detail: 'Spending trends, category breakdown, insights.',
  },
  {
    icon: 'lock-closed-outline' as const,
    label: 'Private by design',
    detail: 'All data stays on your device. Always.',
  },
] as const;

export const WelcomeStep = React.memo(function WelcomeStep() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      {FEATURES.map((f, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={f.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
              {f.label}
            </Text>
            <Text style={[styles.detail, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={2}>
              {f.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
});

const createStyles = ({ typography, spacing }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing('6'),
      paddingHorizontal: spacing('2'),
    },
    row: {
      flexDirection: 'row',
      gap: spacing('4'),
    },
    iconWrap: {
      width: 24,
      alignItems: 'center',
      paddingTop: 2,
    },
    text: {
      flex: 1,
      gap: spacing('0.5'),
    },
    label: {
      fontSize: typography.sizes.md,
    },
    detail: {
      fontSize: typography.sizes.xs,
      lineHeight: 18,
      opacity: 0.65,
    },
  });
