import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        <TouchableOpacity style={styles.iconBtn} onPress={onSearch} activeOpacity={0.75}>
          <MaterialCommunityIcons name="magnify" size={19} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onAnalytics} activeOpacity={0.75}>
          <MaterialCommunityIcons name="chart-pie" size={19} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onSettings} activeOpacity={0.75}>
          <MaterialCommunityIcons name="cog-outline" size={19} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('4'),
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
      gap: spacing('2'),
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
