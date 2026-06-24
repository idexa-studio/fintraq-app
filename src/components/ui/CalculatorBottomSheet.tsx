import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeContextType, useTheme } from '../../providers/ThemeProvider';
import { BentoBottomSheet } from './BottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onConfirm: (value: string) => void;
  currency?: string;
};

type Op = '+' | '-' | '×' | '÷' | null;

function evaluate(a: number, op: Op, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : a;
    default: return b;
  }
}

function formatNum(n: number): string {
  const s = parseFloat(n.toFixed(10)).toString();
  return s;
}

const ROWS: (string | null)[][] = [
  ['C', '+/-', '%', '÷'],
  ['7', '8',   '9', '×'],
  ['4', '5',   '6', '-'],
  ['1', '2',   '3', '+'],
  [null, '0',  '.', '='],
];

export const CalculatorBottomSheet = React.memo(function CalculatorBottomSheet({
  visible,
  onClose,
  value,
  onConfirm,
  currency,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [input, setInput] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [expression, setExpression] = useState('');

  // Sync incoming value on open
  useEffect(() => {
    if (visible) {
      const parsed = parseFloat(value);
      const init = !isNaN(parsed) && parsed > 0 ? formatNum(parsed) : '0';
      setInput(init);
      setPrevValue(null);
      setOperator(null);
      setJustEvaluated(false);
      setExpression('');
    }
  }, [visible, value]);

  const currentNum = useMemo(() => parseFloat(input) || 0, [input]);

  const handlePress = useCallback((key: string) => {
    if (key === 'C') {
      setInput('0');
      setPrevValue(null);
      setOperator(null);
      setJustEvaluated(false);
      setExpression('');
      return;
    }

    if (key === '⌫') {
      setInput(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    if (key === '+/-') {
      setInput(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
      return;
    }

    if (key === '%') {
      setInput(prev => formatNum(parseFloat(prev) / 100));
      return;
    }

    if (key === '.' ) {
      if (justEvaluated) {
        setInput('0.');
        setJustEvaluated(false);
        return;
      }
      setInput(prev => (prev.includes('.') ? prev : prev + '.'));
      return;
    }

    const isOp = ['+', '-', '×', '÷'].includes(key);

    if (isOp) {
      const op = key as Op;
      if (prevValue !== null && operator && !justEvaluated) {
        const result = evaluate(prevValue, operator, currentNum);
        setExpression(`${formatNum(result)} ${op}`);
        setPrevValue(result);
        setInput(formatNum(result));
      } else {
        setExpression(`${input} ${op}`);
        setPrevValue(currentNum);
      }
      setOperator(op);
      setJustEvaluated(true);
      return;
    }

    if (key === '=') {
      if (prevValue !== null && operator) {
        const result = evaluate(prevValue, operator, currentNum);
        setExpression(`${expression} ${input} =`);
        setInput(formatNum(result));
        setPrevValue(null);
        setOperator(null);
        setJustEvaluated(true);
      }
      return;
    }

    // Digit
    if (justEvaluated) {
      setInput(key === '0' ? '0' : key);
      setExpression(operator ? expression : '');
      setJustEvaluated(false);
    } else {
      setInput(prev => {
        if (prev === '0' && key !== '.') return key;
        if (prev.replace('-', '').replace('.', '').length >= 12) return prev;
        return prev + key;
      });
    }
  }, [currentNum, prevValue, operator, justEvaluated, input, expression]);

  const handleConfirm = useCallback(() => {
    const finalVal = prevValue !== null && operator === null ? formatNum(prevValue) : input;
    const num = parseFloat(finalVal);
    onConfirm(isNaN(num) || num <= 0 ? '' : parseFloat(num.toFixed(2)).toString());
    onClose();
  }, [input, prevValue, operator, onConfirm, onClose]);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['83%']}
      enablePanDownToClose={true}
      enableBackdropDismiss={true}
    >
      <View style={styles.root}>
        {/* ── Display ── */}
        <View style={styles.display}>
          <Text style={styles.expressionText} numberOfLines={1}>{expression || ' '}</Text>
          <View style={styles.displayRow}>
            {currency ? <Text style={styles.displayCurrency}>{currency}</Text> : null}
            <Text style={styles.displayValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {input}
            </Text>
          </View>
        </View>

        {/* ── Buttons ── */}
        <View style={styles.grid}>
          {ROWS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((key, ci) => {
                if (key === null) {
                  // backspace in bottom-left
                  return (
                    <Pressable
                      key={`${ri}-${ci}-bsp`}
                      style={({ pressed }) => [styles.key, styles.keyFunction, pressed && styles.keyPressed]}
                      onPress={() => handlePress('⌫')}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.text} />
                    </Pressable>
                  );
                }

                const isOp = ['+', '-', '×', '÷'].includes(key);
                const isEq = key === '=';
                const isFunc = ['C', '+/-', '%'].includes(key);

                return (
                  <Pressable
                    key={`${ri}-${ci}`}
                    style={({ pressed }) => [
                      styles.key,
                      isOp && styles.keyOp,
                      isEq && [styles.keyOp, { backgroundColor: colors.primary }],
                      isFunc && styles.keyFunction,
                      pressed && styles.keyPressed,
                    ]}
                    onPress={() => handlePress(key)}
                  >
                    <Text style={[
                      styles.keyText,
                      isOp && { color: colors.primary },
                      isEq && { color: colors.primaryForeground },
                      isFunc && { color: colors.textMuted },
                    ]}>
                      {key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Done ── */}
        <Pressable style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
          <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
        </Pressable>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, shadow }: ThemeContextType) =>
  StyleSheet.create({
    root: {
      paddingHorizontal: spacing('4'),
      paddingBottom: spacing('2'),
      gap: spacing('3'),
    },

    // Display
    display: {
      backgroundColor: colors.background,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      minHeight: 80,
      justifyContent: 'flex-end',
      gap: spacing('0.5'),
    },
    expressionText: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'right',
    },
    displayRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      gap: spacing('1.5'),
    },
    displayCurrency: {
      fontFamily: typography.fonts.medium,
      fontSize: 18,
      color: colors.textMuted,
      paddingBottom: 4,
    },
    displayValue: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 40,
      color: colors.text,
    },

    // Grid
    grid: {
      gap: spacing('2'),
    },
    row: {
      flexDirection: 'row',
      gap: spacing('2'),
    },
    key: {
      flex: 1,
      height: 52,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyOp: {
      backgroundColor: colors.primary + '14',
    },
    keyFunction: {
      backgroundColor: colors.text + '0C',
    },
    keyPressed: {
      opacity: 0.6,
    },
    keyText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 20,
      color: colors.text,
    },

    // Done
    doneBtn: {
      height: 48,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing('1'),
      ...shadow('sm'),
    },
    doneBtnText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 15,
    },
  });
