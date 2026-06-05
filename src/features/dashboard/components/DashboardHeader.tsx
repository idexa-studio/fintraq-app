import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type Props = {
  greeting: string;
  dateLabel: string;
  isPremium: boolean;
  onSearch: () => void;
};

export const DashboardHeader = React.memo(function DashboardHeader({
  greeting,
  dateLabel,
  isPremium,
  onSearch,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <MaterialCommunityIcons name="crown" size={12} color={colors.primary} />
            <Text style={styles.premiumText}>Pro</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={onSearch} activeOpacity={0.8}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <Text style={styles.placeholder} numberOfLines={1}>
          Search transactions, accounts...
        </Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{isPremium ? '★' : 'L'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('5'),
      gap: spacing('3'),
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    left: { gap: spacing('0.5') },
    greeting: {
      fontFamily: typography.fonts.bold,
      color: colors.text,
      fontSize: 22,
    },
    date: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1'),
      backgroundColor: colors.primary + '15',
      paddingHorizontal: spacing('2.5'),
      paddingVertical: spacing('1'),
      borderRadius: radius('full'),
    },
    premiumText: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 11,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      paddingLeft: spacing('4'),
      paddingRight: spacing('2.5'),
      gap: spacing('3'),
    },
    placeholder: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 13,
      opacity: 0.8,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: typography.fonts.bold,
      color: colors.primary,
      fontSize: 13,
    },
  });
