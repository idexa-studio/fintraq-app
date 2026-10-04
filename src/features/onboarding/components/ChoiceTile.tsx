import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, IconAvatar, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  icon: IconSource;
  /** Icon tint; defaults to brand ink. */
  color?: string;
  title: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  /** `row` for a 2-up grid with a hint; `stack` for a compact 3-up grid (icon over label). */
  layout?: 'row' | 'stack';
};

/**
 * One choice in an onboarding grid. Selection is a tinted fill and a brand outline with a tick, so
 * the picked option reads at a glance without relying on colour alone.
 */
export const ChoiceTile = React.memo(function ChoiceTile({ icon, color, title, hint, selected, onPress, layout = 'row' }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tint = color ?? colors.primaryInk;
  const stack = layout === 'stack';

  return (
    <BentoPressable
      style={[styles.tile, stack && styles.tileStack, selected && styles.tileSelected]}
      onPress={() => {
        if (!selected) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={hint ? `${title}, ${hint}` : title}
    >
      <IconAvatar icon={icon} color={tint} size={stack ? 36 : 38} iconSize={stack ? 17 : 18} />
      <View style={[styles.text, stack && styles.textStack]}>
        <Text variant={stack ? 'calloutStrong' : 'bodyStrong'} numberOfLines={1} align={stack ? 'center' : undefined}>
          {title}
        </Text>
        {hint && !stack ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.tick}>
          <Icon name="tick" size={10} color={colors.primaryForeground} weight="bold" />
        </View>
      ) : null}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: 0,
      gap: spacing('3'),
      padding: spacing('3.5'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    tileStack: { alignItems: 'center', gap: spacing('2'), paddingVertical: spacing('3.5'), paddingHorizontal: spacing('2') },
    tileSelected: { backgroundColor: alpha(colors.primary, 'subtle'), borderColor: colors.primary },
    text: { gap: 2 },
    textStack: { alignItems: 'center', alignSelf: 'stretch' },
    tick: {
      position: 'absolute',
      top: spacing('2.5'),
      right: spacing('2.5'),
      width: 18,
      height: 18,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
