import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

type Props = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
  noPadding?: boolean;
};

export const SectionHeader = React.memo(function SectionHeader({
  title,
  rightText,
  onPressRight,
  noPadding = false,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.wrap, noPadding && styles.noPadding]}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? (
        onPressRight ? (
          <BentoPressable onPress={onPressRight} style={styles.rightBtn}>
            <Text style={styles.right}>{rightText}</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={colors.primary} />
          </BentoPressable>
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
      marginTop: spacing('4'),
      marginBottom: spacing('2'),
    },
    noPadding: {
      paddingHorizontal: 0,
    },
    title: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      lineHeight: 18,
    },
    rightBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('0.5'),
    },
    right: {
      fontFamily: typography.fonts.medium,
      color: colors.primary,
      fontSize: 12,
      lineHeight: 16,
    },
  });
