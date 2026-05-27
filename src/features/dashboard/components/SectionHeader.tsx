import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

type SectionHeaderProps = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
};

export const SectionHeader = React.memo(function SectionHeader({
  title,
  rightText,
  onPressRight,
}: SectionHeaderProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? (
        onPressRight ? (
          <TouchableOpacity onPress={onPressRight} activeOpacity={0.8}>
            <Text style={styles.right}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.right}>{rightText}</Text>
        )
      ) : null}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing , layout }: ThemeContextType) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing('3'),
    },
    title: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
      letterSpacing: 1.5,
    },
    right: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 12,
    },
  });
