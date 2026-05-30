import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';

type Props = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
};

export const SectionHeader = React.memo(function SectionHeader({
  title,
  rightText,
  onPressRight,
}: Props) {
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

const createStyles = ({ colors, typography, spacing, layout }: ThemeContextType) =>
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
      fontSize: typography.sizes.sm,
    },
    right: {
      fontFamily: typography.fonts.semibold,
      color: colors.primary,
      fontSize: 12,
    },
  });
