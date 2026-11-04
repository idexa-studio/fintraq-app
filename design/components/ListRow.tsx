import { Divider } from '@/design/components/Divider';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import type { TextTone } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { ltr } from '@/design/tokens/typography';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** A line icon, or any node (IconCircle, IllustrationTile). */
  icon?: IconName;
  leading?: React.ReactNode;
  /** Bold title, for rows whose title is the thing itself (an account, a payee). */
  strong?: boolean;
  /** Right-aligned text, e.g. an amount or a current setting. */
  value?: string;
  valueTone?: TextTone;
  /** Replaces the chevron, e.g. a Switch or a Badge. */
  trailing?: React.ReactNode;
  /** Tappable rows show a chevron, unless a `value` or `trailing` already sits at the edge, or the row is disabled: nothing to go to. */
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /**
   * Title and description are cut at one line each: for a long list that is scanned, not read.
   * Any row's value sits on the title's line when both fit, and drops to a line of its own when
   * they do not (a long title, a narrow phone, a large font).
   */
  oneLine?: boolean;
};

/** One row of a list: leading mark, title and description, then a value, control or chevron. */
export function ListRow({ title, subtitle, icon, leading, strong = false, value, valueTone = 'default', trailing, onPress, disabled = false, destructive = false, oneLine = false }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const tone: TextTone = disabled ? 'disabled' : destructive ? 'danger' : 'default';
  const amount = value ? <Text variant="amount" tone={disabled ? 'disabled' : valueTone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.value}>{ltr(value)}</Text> : null;
  const name = <Text variant={strong ? 'bodyStrong' : 'body'} tone={tone} numberOfLines={oneLine ? 1 : 2} style={amount ? styles.title : undefined}>{title}</Text>;
  const body = (
    <>
      {leading ?? (icon ? <Icon name={icon} color={disabled ? colors.onDisabled : destructive ? colors.danger : colors.text} /> : null)}
      <View style={styles.text}>
        {/*
          A figure sits on the title's line when both fit; otherwise (a long title, a narrow phone, a
          large font) it drops to a line of its own, as in a budget's row, so neither is cut to a word.
        */}
        {amount ? <View style={styles.head}>{name}{amount}</View> : name}
        {/* In a scanned list a description is one line; elsewhere it is there to be read, so it is never cut. */}
        {subtitle ? <Text variant="callout" tone={disabled ? 'disabled' : 'muted'} numberOfLines={oneLine ? 1 : undefined}>{subtitle}</Text> : null}
      </View>
      {/* Wrapped so a trailing control that hugs its own top, such as a Badge, still sits mid-row. */}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : onPress && !value && !disabled ? <Icon name="chevron-right" color={colors.text} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Touchable onPress={onPress} disabled={disabled} accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} accessibilityState={{ disabled }} style={styles.row}>
      {body}
    </Touchable>
  );
}

export type ListGroupProps = {
  /** ListRow or DetailRow children; hairlines are drawn between them. */
  children: React.ReactNode;
};

/** Rows stacked in one card with hairlines between them. */
export function ListGroup({ children }: ListGroupProps) {
  const styles = useStyles(createStyles);
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Divider /> : null}
          {row}
        </React.Fragment>
      ))}
    </View>
  );
}

export type DetailRowProps = {
  label: string;
  value: string;
};

/** A read-only fact: a quiet label above a bold value. */
export function DetailRow({ label, value }: DetailRowProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.detail} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="callout" tone="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const createStyles = ({ colors, radius, size, space }: Theme) =>
  StyleSheet.create({
    row: { minHeight: size.row, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: size.cardPadding, paddingVertical: space.md },
    text: { flex: 1, gap: space.xs },
    head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.md, rowGap: space.xxs },
    // Never squeezed for the figure: when both do not fit, the figure wraps. Cut only when longer than a whole line.
    title: { flexShrink: 1 },
    trailing: { alignSelf: 'center' },
    // Pushed to the end of whichever line it lands on, and shrinks to fit rather than being cut.
    value: { marginStart: 'auto', maxWidth: '100%', textAlign: 'right' },
    group: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
    // The same spacing as a row's: a list of details reads as a list, not as spaced-out blocks.
    detail: { paddingHorizontal: size.cardPadding, paddingVertical: space.md, gap: space.xs },
  });
