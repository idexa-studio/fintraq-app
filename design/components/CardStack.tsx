import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

export type StackCard = {
  key: string;
  /** The question the card asks when it is in front, e.g. "How much?". */
  label: string;
  /** The word for it on its strip when it is not in front, e.g. "Amount". */
  short: string;
  /** The answer so far, shown on its strip: given already, or a default still to be confirmed. */
  value?: string;
  content: React.ReactNode;
};

export type CardStackProps = {
  cards: StackCard[];
  /** Index of the card in front. */
  active: number;
  /** Tapping a strip brings that card to the front. */
  onSelect?: (index: number) => void;
};

/** How many strips step inwards before they share one width. */
const MAX_DEPTH = 3;

/**
 * An input as a deck of cards. The card in front asks one thing. The cards
 * already answered are tucked behind it above, the ones still to come peek
 * out below with the answer each will use unless changed, and every strip
 * brings its card forward when tapped. Nothing is hidden, so the whole entry
 * can be read at a glance and finished from any card.
 */
export function CardStack({ cards, active, onSelect }: CardStackProps) {
  const { space, motion, colors, size } = useTheme();
  const styles = useStyles(createStyles);
  const move = LinearTransition.duration(motion.slow);

  return (
    <View>
      {cards.map((card, i) => {
        if (i === active) {
          return (
            <Animated.View key={card.key} layout={move} style={styles.front}>
              <Animated.View key={`${card.key}-content`} entering={FadeIn.duration(motion.slow)} style={styles.frontContent}>
                <Text variant="title" accessibilityRole="header">{card.label}</Text>
                {card.content}
              </Animated.View>
            </Animated.View>
          );
        }
        const before = i < active;
        const depth = Math.min(Math.abs(active - i), MAX_DEPTH);
        return (
          <Animated.View key={card.key} layout={move} style={[{ marginHorizontal: depth * space.sm }, before ? styles.tuckedAbove : styles.tuckedBelow]}>
            <Touchable
              onPress={() => onSelect?.(i)}
              accessibilityLabel={`${card.short}: ${card.value ?? ''}`}
              accessibilityHint="Change"
              style={[styles.strip, before ? styles.stripAbove : styles.stripBelow]}
            >
              <Text variant="callout" tone={before ? 'default' : 'muted'}>{card.short}</Text>
              <Text variant="calloutStrong" numberOfLines={1} ellipsizeMode="tail" style={styles.value}>{card.value}</Text>
              <Icon name={before ? 'chevron-down' : 'chevron-up'} size={size.iconSmall} color={colors.textMuted} />
            </Touchable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radius, size, space, border }: Theme) =>
  StyleSheet.create({
    // The front card sits over the strips on both sides of it.
    front: { zIndex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: border.thin, borderColor: colors.border },
    frontContent: { padding: size.cardPadding, gap: space.lg },
    // Each strip runs under its neighbour by one corner radius, so the deck reads as overlapping cards.
    tuckedAbove: { marginBottom: -radius.md },
    tuckedBelow: { marginTop: -radius.md },
    strip: { height: size.field + radius.md, paddingHorizontal: size.cardPadding, borderWidth: border.thin, flexDirection: 'row', alignItems: 'center', gap: space.md },
    stripAbove: { paddingBottom: radius.md, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, backgroundColor: colors.divider, borderColor: colors.background },
    stripBelow: { paddingTop: radius.md, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, backgroundColor: colors.surface, borderColor: colors.divider },
    // Takes what is left of the strip and no more, so a long answer is cut at its end, not its start.
    value: { flex: 1, flexShrink: 1, minWidth: 0, textAlign: 'right' },
  });
