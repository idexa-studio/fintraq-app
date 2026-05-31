import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type ColorKey = 'primary' | 'info' | 'success';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; detail: string; colorKey: ColorKey }[] = [
  {
    icon: 'flash-outline',
    label: 'Fast capture',
    detail: 'Log transactions anywhere in seconds.',
    colorKey: 'primary',
  },
  {
    icon: 'bar-chart-outline',
    label: 'Built-in analytics',
    detail: 'Spending trends, category breakdown, and smart insights.',
    colorKey: 'info',
  },
  {
    icon: 'lock-closed-outline',
    label: 'Private by design',
    detail: 'All your data stays on your device. Always.',
    colorKey: 'success',
  },
];

export const WelcomeStep = React.memo(function WelcomeStep() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      {FEATURES.map((f) => {
        const accent = colors[f.colorKey];
        return (
          <View key={f.label} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
              <Ionicons name={f.icon} size={22} color={accent} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                {f.label}
              </Text>
              <Text style={[styles.detail, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                {f.detail}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing('3'),
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    text: {
      flex: 1,
      gap: spacing('1'),
    },
    label: {
      fontSize: 15,
    },
    detail: {
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
  });
