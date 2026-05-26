import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

type Props = {
  value: 'CR' | 'DR';
  onChange: (value: 'CR' | 'DR') => void;
};

export const TransactionTypePicker = React.memo(function TransactionTypePicker({
  value,
  onChange,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDR = useCallback(() => onChange('DR'), [onChange]);
  const handleCR = useCallback(() => onChange('CR'), [onChange]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'DR' && { backgroundColor: colors.danger, borderColor: colors.danger },
        ]}
        onPress={handleDR}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillText, { color: value === 'DR' ? colors.background : colors.textMuted }]}>Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'CR' && { backgroundColor: colors.success, borderColor: colors.success },
        ]}
        onPress={handleCR}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillText, { color: value === 'CR' ? colors.background : colors.textMuted }]}>Income</Text>
      </TouchableOpacity>
    </View>
  );
});

const createStyles = ({ typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing('6'),
    paddingTop: spacing('4'),
    paddingBottom: spacing('2'),
    flexDirection: 'row',
    gap: spacing('2.5'),
  },
  pill: {
    paddingHorizontal: spacing('4'),
    height: 36,
    borderRadius: radius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 13,
  },
});
