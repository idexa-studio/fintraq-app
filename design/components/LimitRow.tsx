import { Icon } from '@/design/components/Icon';
import { ProgressBar } from '@/design/components/ProgressBar';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { ltr } from '@/design/tokens/typography';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/** under: room left. near: close to the limit. over: at it or past it. */
export type LimitState = 'under' | 'near' | 'over';

export type LimitRowProps = {
  /** The mark of what is limited, e.g. a category's IconCircle. */
  leading?: React.ReactNode;
  title: string;
  /** What is used against the limit, already formatted: "$320 of $500". */
  detail: string;
  /** What that leaves, already formatted: "$180 left", "$40 over". */
  remaining: string;
  /** Used as a share of the limit, 0 to 1 and beyond. */
  share: number;
  state?: LimitState;
  onPress?: () => void;
};

/**
 * Something with a limit, as one row of a list: its mark and name, what is left opposite, and a
 * bar for how much is used. The bar and what is left change colour together as the limit nears.
 */
export function LimitRow({ leading, title, detail, remaining, share, state = 'under', onPress }: LimitRowProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const body = (
    <>
      {leading}
      <View style={styles.text}>
        <View style={styles.head}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>{title}</Text>
          {/* A long figure gives way before the name does: it shrinks to fit rather than cutting the name short. */}
          <Text variant="calloutStrong" tone={state === 'over' ? 'danger' : 'default'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.remaining}>{ltr(remaining)}</Text>
        </View>
        <ProgressBar value={share} over={state === 'over'} near={state === 'near'} accessibilityLabel={title} />
        <Text variant="callout" tone="muted" numberOfLines={1}>{ltr(detail)}</Text>
      </View>
      {onPress ? <Icon name="chevron-right" color={colors.text} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Touchable onPress={onPress} accessibilityLabel={`${title}, ${remaining}, ${detail}`} style={styles.row}>
      {body}
    </Touchable>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    // The list row's own measures, so it sits in a ListGroup among ordinary rows.
    row: { minHeight: size.row, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: size.cardPadding, paddingVertical: space.lg },
    text: { flex: 1, gap: space.sm },
    head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
    title: { flex: 1 },
    // Bounded, so that fitting has a width to fit to; the name keeps the rest.
    remaining: { maxWidth: '40%', textAlign: 'right' },
  });
