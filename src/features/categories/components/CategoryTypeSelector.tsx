import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

interface CategoryTypeSelectorProps {
  activeType: 'CR' | 'DR';
  onTypeChange: (type: 'CR' | 'DR') => void;
}

export const CategoryTypeSelector = React.memo(function CategoryTypeSelector({
  activeType,
  onTypeChange,
}: CategoryTypeSelectorProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDR = useCallback(() => onTypeChange('DR'), [onTypeChange]);
  const handleCR = useCallback(() => onTypeChange('CR'), [onTypeChange]);

  return (
    <View style={styles.typeTabsRail}>
      <TouchableOpacity
        style={[styles.segmentPill, activeType === 'DR' && styles.segmentPillActive]}
        onPress={handleDR}
        activeOpacity={0.9}
      >
        <Ionicons
          name="arrow-down-circle-outline"
          size={14}
          color={activeType === 'DR' ? colors.background : colors.textMuted}
        />
        <Text style={[styles.segmentPillText, activeType === 'DR' && styles.segmentPillTextActive]}>
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segmentPill, activeType === 'CR' && styles.segmentPillActive]}
        onPress={handleCR}
        activeOpacity={0.9}
      >
        <Ionicons
          name="arrow-up-circle-outline"
          size={14}
          color={activeType === 'CR' ? colors.background : colors.textMuted}
        />
        <Text style={[styles.segmentPillText, activeType === 'CR' && styles.segmentPillTextActive]}>
          Income
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) => StyleSheet.create({
  typeTabsRail: {
    flexDirection: 'row',
    height: 46,
    borderRadius: radius('md'),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'D9',
    padding: spacing('1'),
    gap: spacing('1'),
  },
  segmentPill: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing('1.5'),
    borderRadius: radius('sm'),
    backgroundColor: 'transparent',
  },
  segmentPillActive: {
    backgroundColor: colors.text,
  },
  segmentPillText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  segmentPillTextActive: {
    color: colors.background,
  },
});
