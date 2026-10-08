import { Card, CardActions } from '@/design/components/Card';
import type { CardAction } from '@/design/components/Card';
import { Text } from '@/design/components/Text';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type SummaryCardProps = {
  /** What the card sums up: "All accounts", "Net worth", "Open loans". */
  title: string;
  /** Sits opposite the title: the currency menu, where more than one is held. */
  trailing?: React.ReactNode;
  /** The two things done most from here, as the strip at the card's foot. */
  actions?: CardAction[];
  children: React.ReactNode;
};

/**
 * The card at the top of an overview: its title with the currency menu opposite, the figure or
 * bar that answers it, and optionally its two actions. The reference's balance card, so every
 * overview opens the same way.
 */
export function SummaryCard({ title, trailing, actions, children }: SummaryCardProps) {
  const styles = useStyles(createStyles);
  return (
    <Card padded={false}>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text variant="bodyStrong">{title}</Text>
          {trailing}
        </View>
        {children}
      </View>
      {actions ? <CardActions actions={actions} /> : null}
    </Card>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    body: { padding: size.cardPadding, gap: space.sm },
    // As tall as the menu whether or not one is shown, so the title sits at the same height on every overview.
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: size.chip },
  });
