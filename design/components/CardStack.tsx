import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

export type StackCard = {
  key: string;
  /** What this step asks for, e.g. "Amount". */
  label: string;
  /** The answer given, shown once the step is behind the current one. */
  value?: string;
  content: React.ReactNode;
};

export type CardStackProps = {
  cards: StackCard[];
  /** Index of the card in front. Earlier cards are tucked behind it; later ones are not shown yet. */
  active: number;
  /** Tapping a tucked card brings it back to the front. */
  onSelect?: (index: number) => void;
};

/** How many tucked cards step inwards before they share one width. */
const MAX_DEPTH = 3;

/**
 * A step-by-step input as a deck: the current step is the white card in
 * front, and each answered step stays visible as a strip tucked behind it,
 * narrower the further back it is.
 */
export function CardStack({ cards, active, onSelect }: CardStackProps) {
  const { space, motion } = useTheme();
  const styles = useStyles(createStyles);
  const current = cards[active];
  return (
    <View>
      {cards.slice(0, active).map((card, i) => {
        const depth = Math.min(active - i, MAX_DEPTH);
        return (
          <Animated.View key={card.key} layout={LinearTransition.duration(motion.normal)} style={{ marginHorizontal: depth * space.sm }}>
            <Touchable onPress={() => onSelect?.(i)} accessibilityLabel={`${card.label}: ${card.value ?? ''}. Change`} style={styles.strip}>
              <Text variant="callout">{card.label}</Text>
              <Text variant="calloutStrong" numberOfLines={1} style={styles.value}>{card.value}</Text>
            </Touchable>
          </Animated.View>
        );
      })}
      {current ? (
        <Animated.View key={current.key} entering={FadeInDown.duration(motion.normal)} layout={LinearTransition.duration(motion.normal)} style={styles.front}>
          <Text variant="title" accessibilityRole="header">{current.label}</Text>
          {current.content}
        </Animated.View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radius, size, space, border }: Theme) =>
  StyleSheet.create({
    // Each strip runs under the card in front of it by one corner radius, so the stack reads as overlapping sheets.
    strip: {
      height: size.field + radius.md,
      marginBottom: -radius.md,
      paddingHorizontal: size.cardPadding,
      paddingBottom: radius.md,
      borderTopLeftRadius: radius.md,
      borderTopRightRadius: radius.md,
      borderWidth: border.thin,
      borderColor: colors.background,
      backgroundColor: colors.divider,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.lg,
    },
    value: { flexShrink: 1 },
    front: { backgroundColor: colors.surface, borderRadius: radius.md, padding: size.cardPadding, gap: space.lg },
  });
