import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'delete' | '+' | '−' | '×' | '÷';

export type KeypadProps = {
  onKey?: (key: KeypadKey) => void;
  /** Amounts need a decimal point; a PIN does not. */
  decimal?: boolean;
  deleteLabel?: string;
  /** Adds a column of plus, minus, times and divide, for working out an amount in place. */
  operators?: boolean;
  operatorLabels?: Record<'+' | '−' | '×' | '÷', string>;
};

const ROWS: KeypadKey[][] = [
  ['1', '2', '3', '÷'],
  ['4', '5', '6', '×'],
  ['7', '8', '9', '−'],
  ['.', '0', 'delete', '+'],
];

const OPERATOR_LABELS = { '+': 'Plus', '−': 'Minus', '×': 'Times', '÷': 'Divided by' } as const;

/** Number keys for an amount or a PIN. */
export function Keypad({ onKey, decimal = true, deleteLabel = 'Delete', operators = false, operatorLabels = OPERATOR_LABELS }: KeypadProps) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            const operator = key in operatorLabels;
            if (operator && !operators) return null;
            if (key === '.' && !decimal) return <View key="blank" style={styles.blank} />;
            const label = key === 'delete' ? deleteLabel : operator ? operatorLabels[key as keyof typeof operatorLabels] : key;
            return (
              <Touchable key={key} onPress={() => onKey?.(key)} accessibilityLabel={label} style={[styles.key, key === 'delete' ? styles.bare : null, operator ? styles.operator : null]}>
                {key === 'delete' ? <Icon name="backspace" /> : <Text variant="amountLarge">{key}</Text>}
              </Touchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ colors, size, space, radius, border }: Theme) =>
  StyleSheet.create({
    // A keypad keeps its layout in right-to-left languages: 1 2 3 never becomes 3 2 1.
    pad: { gap: space.sm, direction: 'ltr' },
    row: { flexDirection: 'row', gap: space.sm },
    key: { flex: 1, height: size.row, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    bare: { backgroundColor: 'transparent' },
    operator: { backgroundColor: 'transparent', borderWidth: border.thin, borderColor: colors.border },
    blank: { flex: 1 },
  });
