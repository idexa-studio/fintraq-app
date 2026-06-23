import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  disabled?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'] as const;

export const PinPad = React.memo(function PinPad({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
}: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles({ colors, spacing, radius }), [colors, spacing, radius]);

  const handleKey = useCallback((key: string) => {
    if (disabled) return;
    if (key === 'Del') {
      onChange(value.slice(0, -1));
    } else if (key !== '' && value.length < maxLength) {
      onChange(value + key);
    }
  }, [disabled, onChange, value, maxLength]);

  const dots = useMemo(() =>
    Array.from({ length: maxLength }, (_, i) => i < value.length),
    [maxLength, value.length],
  );

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {dots.map((filled, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: filled ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>

      <View style={styles.grid}>
        {KEYS.map((key, i) => {
          if (key === '') {
            return <View key={i} style={styles.keyPlaceholder} />;
          }
          return (
            <BentoPressable
              key={i}
              style={styles.key}
              onPress={() => handleKey(key)}
              disabled={disabled}
              scaleOnPress
            >
              {key === 'Del' ? (
                <Text style={[styles.delText, { fontFamily: typography.fonts.medium, color: colors.text }]}>
                  Del
                </Text>
              ) : (
                <Text style={[styles.keyText, { fontFamily: typography.styles.rowLabel.fontFamily, color: colors.text }]}>
                  {key}
                </Text>
              )}
            </BentoPressable>
          );
        })}
      </View>
    </View>
  );
});

type StyleDeps = Pick<ReturnType<typeof useTheme>, 'colors' | 'spacing' | 'radius'>;

function createStyles({ colors, spacing, radius }: StyleDeps) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing('8'),
    },
    dots: {
      flexDirection: 'row',
      gap: spacing('6'),
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: radius('full'),
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 280,
      gap: spacing('3'),
      justifyContent: 'center',
    },
    key: {
      width: 80,
      height: 80,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyPlaceholder: {
      width: 80,
      height: 80,
    },
    keyText: {
      fontSize: 32,
    },
    delText: {
      fontSize: 20,
    },
  });
}
