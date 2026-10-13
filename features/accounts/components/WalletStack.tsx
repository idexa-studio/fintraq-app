import { Icon, INK, Text, Touchable, ltr, useStyles } from '@/design';
import type { IconName, Theme } from '@/design';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type WalletCard = {
  key: string;
  name: string;
  /** Under the name on the front card: its kind, its number. */
  detail?: string;
  /** What it holds, already written as money. */
  amount: string;
  /** The card's own colour, as a pastel. */
  color: string;
  /** The front card's mark. */
  icon?: IconName;
};

export type WalletStackProps = {
  /** From the furthest back to the one in front. The last is shown in full. */
  cards: readonly WalletCard[];
  /** Makes every card a way to what it stands for. */
  onPress?: (key: string) => void;
};

/**
 * Accounts as cards in a wallet: each in its own colour, the ones behind
 * showing the edge that names them and says what they hold, the one in front
 * shown in full. Text is black on every card, in both schemes, as the cards
 * keep their colours. One card alone is simply that card.
 */
export function WalletStack({ cards, onPress }: WalletStackProps) {
  const styles = useStyles(createStyles);
  const front = cards[cards.length - 1];
  if (!front) return null;
  const behind = cards.slice(0, -1);
  const press = (key: string) => (onPress ? () => onPress(key) : undefined);
  const label = (card: WalletCard) => [card.name, card.detail, card.amount].filter(Boolean).join(', ');

  return (
    <View>
      {behind.map((card) => (
        <Touchable key={card.key} onPress={press(card.key)} disabled={!onPress} accessibilityLabel={label(card)} style={[styles.card, styles.edge, { backgroundColor: card.color }]}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>{card.name}</Text>
          <Text variant="amount" numberOfLines={1} style={styles.ink}>{ltr(card.amount)}</Text>
        </Touchable>
      ))}
      <Touchable onPress={press(front.key)} disabled={!onPress} accessibilityLabel={label(front)} style={[styles.card, styles.front, { backgroundColor: front.color }]}>
        <View style={styles.row}>
          <View style={styles.title}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.ink}>{front.name}</Text>
            {front.detail ? <Text variant="callout" numberOfLines={1} style={styles.ink}>{front.detail}</Text> : null}
          </View>
          {front.icon ? <Icon name={front.icon} color={INK} /> : null}
        </View>
        <Text variant="amountLarge" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.ink}>{ltr(front.amount)}</Text>
      </Touchable>
    </View>
  );
}

const createStyles = ({ border, radius, size, space }: Theme) =>
  StyleSheet.create({
    // Outlined, as the pale colours need an edge against the page and against each other.
    card: { borderRadius: radius.md, borderWidth: border.thin, borderColor: INK, paddingHorizontal: size.cardPadding },
    // A card behind shows its top edge; the rest of it is tucked under the card below.
    edge: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.lg, paddingTop: space.md, height: size.field + radius.md + space.xs, marginBottom: -(radius.md + space.xs) },
    front: { paddingVertical: size.cardPadding, gap: space.lg },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    title: { flex: 1, gap: space.xxs },
    name: { flex: 1, color: INK },
    ink: { color: INK },
  });
