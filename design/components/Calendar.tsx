import { IconButton } from '@/design/components/IconButton';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type CalendarProps = {
  /** The chosen day. Only its year, month and date are read. */
  value: Date;
  onChange?: (day: Date) => void;
  /** Days after this cannot be chosen, e.g. today for a transaction date. */
  max?: Date;
  min?: Date;
  /** 0 for Sunday, 1 for Monday. */
  weekStartsOn?: 0 | 1;
  /** For the month title and weekday letters, e.g. "en-GB". Defaults to the device's. */
  locale?: string;
  previousLabel?: string;
  nextLabel?: string;
};

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** A month of days to pick one from. The chosen day is solid; today is ringed in green. */
export function Calendar({ value, onChange, max, min, weekStartsOn = 1, locale, previousLabel = 'Previous month', nextLabel = 'Next month' }: CalendarProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [shown, setShown] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const today = new Date();

  const daysInMonth = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const lead = (shown.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(shown.getFullYear(), shown.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  // 2024-01-01 was a Monday, which makes the weekday letters easy to derive for any locale.
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + ((i + weekStartsOn + 6) % 7)).toLocaleDateString(locale, { weekday: 'narrow' }));
  const canGoNext = !max || new Date(shown.getFullYear(), shown.getMonth() + 1, 1) <= startOfDay(max);
  const canGoBack = !min || new Date(shown.getFullYear(), shown.getMonth(), 0) >= startOfDay(min);
  const move = (by: number) => setShown(new Date(shown.getFullYear(), shown.getMonth() + by, 1));

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <IconButton icon="chevron-left" onPress={() => move(-1)} disabled={!canGoBack} accessibilityLabel={previousLabel} />
        <Text variant="bodyStrong" accessibilityRole="header">{shown.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
        <IconButton icon="chevron-right" onPress={() => move(1)} disabled={!canGoNext} accessibilityLabel={nextLabel} />
      </View>
      <View style={styles.week}>
        {weekdays.map((letter, i) => <Text key={i} variant="caption" tone="muted" align="center" style={styles.cell}>{letter}</Text>)}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, d) => {
            if (!day) return <View key={d} style={styles.cell} />;
            const selected = sameDay(day, value);
            const off = (!!max && day > startOfDay(max)) || (!!min && day < startOfDay(min));
            return (
              <View key={d} style={styles.cell}>
                <Touchable
                  onPress={() => onChange?.(day)}
                  disabled={off}
                  hitSlop={styles.slop.padding}
                  accessibilityLabel={day.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  accessibilityState={{ selected, disabled: off }}
                  style={[styles.day, selected ? { backgroundColor: colors.action } : sameDay(day, today) ? [styles.today, { borderColor: colors.selected }] : null]}
                >
                  <Text variant={selected ? 'bodyStrong' : 'body'} tone={selected ? 'onAction' : off ? 'disabled' : 'default'}>{day.getDate()}</Text>
                </Touchable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ size, space, border }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.xs },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    week: { flexDirection: 'row' },
    cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    day: { width: size.iconCircle, height: size.iconCircle, borderRadius: size.iconCircle / 2, alignItems: 'center', justifyContent: 'center' },
    today: { borderWidth: border.thick },
    slop: { padding: (size.minTouch - size.iconCircle) / 2 },
  });
