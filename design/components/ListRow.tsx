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
  /** Title and description are cut at one line each, so every row is the same height: for a long list that is scanned, not read. */
  oneLine?: boolean;
};

/** One row of a list: leading mark, title and description, then a value, control or chevron. */
export function ListRow({ title, subtitle, icon, leading, strong = false, value, valueTone = 'default', trailing, onPress, disabled = false, destructive = false, oneLine = false }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const tone: TextTone = disabled ? 'disabled' : destructive ? 'danger' : 'default';
  const body = (
    <>
      {leading ?? (icon ? <Icon name={icon} color={disabled ? colors.onDisabled : destructive ? colors.danger : colors.text} /> : null)}
      <View style={styles.text}>
        <Text variant={strong ? 'bodyStrong' : 'body'} tone={tone} numberOfLines={oneLine ? 1 : 2}>{title}</Text>
        {/* A third line is only ever reached at a large font size, where two would cut a due date short. */}
        {subtitle ? <Text variant="callout" tone={disabled ? 'disabled' : 'muted'} numberOfLines={oneLine ? 1 : 3}>{subtitle}</Text> : null}
      </View>
      {/* A figure is never cut short: it shrinks to fit, and may take up to half the row. */}
      {value ? <Text variant="amount" tone={disabled ? 'disabled' : valueTone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.value}>{ltr(value)}</Text> : null}
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
    trailing: { alignSelf: 'center' },
    value: { flexShrink: 1, maxWidth: '50%', textAlign: 'right' },
    group: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
    detail: { paddingHorizontal: size.cardPadding, paddingVertical: space.lg + space.xs, gap: space.sm },
  });
