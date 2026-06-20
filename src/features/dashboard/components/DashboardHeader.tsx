import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Search } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';

type Props = {
  name?: string;
  isPremium: boolean;
  onSearch: () => void;
};

export const DashboardHeader = React.memo(function DashboardHeader({
  name,
  isPremium,
  onSearch,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const monogram = useMemo(() => {
    return (name || 'L').charAt(0).toUpperCase();
  }, [name]);

  return (
    <View style={styles.container}>
      <BentoPressable style={styles.searchBar} onPress={onSearch}>
        <HugeiconsIcon icon={Search} size={20} color={colors.textMuted} />
        <Text style={styles.placeholder} numberOfLines={1}>
          Search transactions, accounts...
        </Text>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{monogram}</Text>
          </View>
          {isPremium && (
            <View style={styles.crownBadge}>
              <MaterialCommunityIcons name="crown" size={8} color="#FFFFFF" />
            </View>
          )}
        </View>
      </BentoPressable>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      paddingTop: spacing('3'),
      paddingBottom: spacing('4'),
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      paddingLeft: spacing('4'),
      paddingRight: spacing('2'),
      gap: spacing('3'),
    },
    placeholder: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 14,
      opacity: 0.7,
    },
    avatarContainer: {
      position: 'relative',
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
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 13,
    },
    crownBadge: {
      position: 'absolute',
      right: -3,
      top: -3,
      backgroundColor: colors.warning,
      width: 14,
      height: 14,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
  });

