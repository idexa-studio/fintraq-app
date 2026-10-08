import { IconButton } from '@/design/components/IconButton';
import { Text } from '@/design/components/Text';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TimeValue = {
  /** 0 to 23. */
  hour: number;
  /** 0 to 59. */
  minute: number;
};

export type TimePickerProps = {
  value: TimeValue;
  onChange?: (value: TimeValue) => void;
  /** Minutes moved per tap. */
  minuteStep?: number;
  /** Shows 1 to 12 with am and pm instead of 0 to 23. */
  twelveHour?: boolean;
  labels?: { am: string; pm: string; earlier: string; later: string; hour: string; minute: string; period: string };
};

const LABELS = { am: 'am', pm: 'pm', earlier: 'Earlier', later: 'Later', hour: 'Hour', minute: 'Minute', period: 'Morning or afternoon' };
const pad = (n: number) => String(n).padStart(2, '0');

/** A time set by stepping the hour and the minute up or down. For a reminder, where a few taps beat a clock face. */
export function TimePicker({ value, onChange, minuteStep = 5, twelveHour = true, labels = LABELS }: TimePickerProps) {
  const styles = useStyles(createStyles);
  const set = (hour: number, minute: number) => onChange?.({ hour: (hour + 24) % 24, minute: (minute + 60) % 60 });
  const shownHour = twelveHour ? value.hour % 12 || 12 : value.hour;
  const columns = [
    { key: 'hour', label: labels.hour, text: twelveHour ? String(shownHour) : pad(shownHour), up: () => set(value.hour + 1, value.minute), down: () => set(value.hour - 1, value.minute) },
    { key: 'minute', label: labels.minute, text: pad(value.minute), up: () => set(value.hour, value.minute + minuteStep), down: () => set(value.hour, value.minute - minuteStep) },
    ...(twelveHour
      ? [{ key: 'period', label: labels.period, text: value.hour < 12 ? labels.am : labels.pm, up: () => set(value.hour + 12, value.minute), down: () => set(value.hour + 12, value.minute) }]
      : []),
  ];
  return (
    <View style={styles.row}>
      {columns.map((column, i) => (
        <React.Fragment key={column.key}>
          {i === 1 ? <Text variant="amountHero">:</Text> : null}
          <View style={styles.column} accessible accessibilityRole="adjustable" accessibilityLabel={column.label} accessibilityValue={{ text: column.text }}>
            <IconButton icon="chevron-up" onPress={column.up} accessibilityLabel={`${column.label}: ${labels.later}`} />
            <Text variant="amountHero" style={styles.value} align="center">{column.text}</Text>
            <IconButton icon="chevron-down" onPress={column.down} accessibilityLabel={`${column.label}: ${labels.earlier}`} />
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
    column: { alignItems: 'center' },
    value: { minWidth: space.xxxl + space.lg, fontVariant: ['tabular-nums'] },
  });
