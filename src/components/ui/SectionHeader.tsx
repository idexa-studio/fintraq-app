import { Icon } from './Icon';
import { Text } from './Text';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

type Props = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
  noPadding?: boolean;
};

/**
 * Section title with an optional link. The link is plain ink text with a caret — a screen has
 * several of these, and a filled pill on each one competed with the content below.
 */
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
      <Text variant="subheading" numberOfLines={1} style={styles.title} accessibilityRole="header">{title}</Text>
      {rightText ? (
        onPressRight ? (
          <BentoPressable onPress={onPressRight} style={styles.link} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${rightText}, ${title}`}>
            <Text variant="label" color={colors.primaryInk}>{rightText}</Text>
            <Icon name="chevron-right" size={12} color={colors.primaryInk} weight="bold" />
          </BentoPressable>
        ) : (
          <Text variant="caption" tone="muted">{rightText}</Text>
        )
      ) : null}
    </View>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing('3'),
      minHeight: 28,
      paddingHorizontal: layout.screenPadding,
      marginTop: spacing('6'),
      marginBottom: spacing('3'),
    },
    noPadding: { paddingHorizontal: 0 },
    title: { flexShrink: 1 },
    link: { flexDirection: 'row', alignItems: 'center', gap: spacing('0.5'), height: 28 },
  });
