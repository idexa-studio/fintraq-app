import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type Props = {
  greeting: string;
  dateLabel: string;
  isPremium: boolean;
  onSearch: () => void;
  onAnalytics: () => void;
  onSettings: () => void;
};

export const DashboardHeader = React.memo(function DashboardHeader({
  greeting,
  dateLabel,
  isPremium,
  onSearch,
  onAnalytics,
  onSettings,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSearch} activeOpacity={0.7}>
          <Ionicons name={isPremium ? 'search-outline' : 'search-outline'} size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAnalytics} activeOpacity={0.7}>
          <Ionicons name="pie-chart-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettings} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('5'),
    },
    left: { gap: spacing('1') },
    greeting: {
      fontFamily: typography.fonts.bold,
      color: colors.text,
      fontSize: 22,
      letterSpacing: -0.5,
    },
    date: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('4'),
    },
  });
