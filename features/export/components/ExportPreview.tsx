import type { TransactionListItem } from '@/data/repositories/transactions';
import { Card, Divider, IconCircle, Skeleton, Text, ltr, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import { dayLabel, signedAmount } from '@/features/transactions';
import { parseDateKey } from '@/shared/date/date';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type ExportPreviewProps = {
  /** What the file holds, in words: "142 transactions". */
  title: string;
  /** The period and the account it covers. */
  scope: string;
  /** The first rows the file will hold. Undefined while they are being read. */
  rows: readonly TransactionListItem[] | undefined;
  /** How many more rows there are than are shown, already in words; omitted when none. */
  more?: string;
  /** Said in the sheet when no row matches. */
  empty: string;
  /** A last line under the sheet, e.g. that loans are added. */
  note?: string;
  columns: { date: string; what: string; amount: string };
  /** Words for today and yesterday in the date column. */
  today: string;
  yesterday: string;
  /** What the picture is, for a screen reader. */
  accessibilityLabel: string;
};

/**
 * The file as a picture of itself: a small spreadsheet holding the first
 * rows that will be in it, under what it adds up to. It changes as the
 * choices below it change, so the user sees the file before making it.
 */
export function ExportPreview({ title, scope, rows, more, empty, note, columns, today, yesterday, accessibilityLabel }: ExportPreviewProps) {
  const { type } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconCircle icon="file-text" color="green" />
        <View style={styles.headText}>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text variant="callout" tone="muted">{scope}</Text>
        </View>
      </View>

      <View style={styles.sheet} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <View style={[styles.row, styles.headRow]}>
          <Text variant="captionStrong" style={styles.date}>{columns.date}</Text>
          <Text variant="captionStrong" style={styles.what}>{columns.what}</Text>
          <Text variant="captionStrong" style={styles.amount}>{columns.amount}</Text>
        </View>
        {!rows ? (
          <View style={styles.row}><Skeleton height={type.caption.lineHeight} /></View>
        ) : rows.length === 0 ? (
          <>
            <Divider />
            <View style={styles.row}><Text variant="caption" tone="muted" style={styles.what}>{empty}</Text></View>
          </>
        ) : (
          rows.map((tx) => (
            <React.Fragment key={tx.id}>
              <Divider />
              <View style={styles.row}>
                <Text variant="caption" tone="muted" numberOfLines={1} style={styles.date}>{dayLabel(parseDateKey(tx.datetime), today, yesterday)}</Text>
                <Text variant="caption" numberOfLines={1} style={styles.what}>{tx.note.trim() || tx.category.name}</Text>
                <Text variant="caption" numberOfLines={1} style={styles.amount}>{ltr(signedAmount(tx))}</Text>
              </View>
            </React.Fragment>
          ))
        )}
        {more ? (
          <>
            <Divider />
            <View style={styles.row}><Text variant="caption" tone="muted" style={styles.what}>{more}</Text></View>
          </>
        ) : null}
      </View>

      {note ? <Text variant="callout" tone="muted">{note}</Text> : null}
    </Card>
  );
}

const createStyles = ({ colors, border, radius, space }: Theme) =>
  StyleSheet.create({
    card: { gap: space.lg },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    headText: { flex: 1, gap: space.xs },
    // Ruled like a spreadsheet: an outline, a tinted first row, a line between rows.
    sheet: { borderWidth: border.thin, borderColor: colors.divider, borderRadius: radius.sm, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm },
    headRow: { backgroundColor: colors.surfaceMuted },
    date: { width: '26%' },
    what: { flex: 1 },
    amount: { width: '28%', textAlign: 'right' },
  });
