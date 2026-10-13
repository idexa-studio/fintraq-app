import { Keypad, useStyles } from '@/design';
import type { KeypadKey, Theme } from '@/design';
import { PIN_LENGTH } from '@/features/lock/lock-rules';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type PinPadProps = {
  /** The digits entered so far. Never shown: only how many there are. */
  pin: string;
  onKey: (key: KeypadKey) => void;
  /** Keys cannot be pressed for now. The screen says why above the pad. */
  disabled?: boolean;
  /** How far the entry has got, for a screen reader: "2 of 6 digits entered". */
  marksLabel: string;
  deleteLabel: string;
};

/** Six marks that fill as the PIN is typed, over a keypad with no decimal key. */
export function PinPad({ pin, onKey, disabled = false, marksLabel, deleteLabel }: PinPadProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.pad}>
      <View style={styles.marks} accessible accessibilityLabel={marksLabel}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => <View key={i} style={[styles.mark, i < pin.length ? styles.filled : null]} />)}
      </View>
      <Keypad decimal={false} onKey={onKey} disabled={disabled} deleteLabel={deleteLabel} />
    </View>
  );
}

const createStyles = ({ colors, border, space }: Theme) =>
  StyleSheet.create({
    pad: { gap: space.xl },
    marks: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
    mark: { width: space.lg, height: space.lg, borderRadius: space.sm, borderWidth: border.thin, borderColor: colors.border, backgroundColor: colors.surface },
    filled: { backgroundColor: colors.action },
  });
