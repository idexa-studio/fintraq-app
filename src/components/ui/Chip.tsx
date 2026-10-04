import type { IconSource } from './Icon';
import { Icon } from './Icon';
import React, { useMemo, useCallback } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';
import { alpha } from '@/src/theme/tokens';

type ChipProps = {
  label: string;
  isActive?: boolean;
  /** Accent color for active bg tint + text. Defaults to theme primary. */
  color?: string;
  icon?: IconSource;
  onPress: () => void;
  /** Shows a ✕ that removes the chip (active filters). */
  onClear?: () => void;
  /** What the chip sits on: `page` (default) or a `surface` card/sheet, where it uses the inset fill to stay visible. */
  on?: 'page' | 'surface';
  /** `sm` for compact pickers that sit above content (a currency filter); `md` (default) everywhere else. */
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

export const Chip = React.memo(function Chip({
  label,
  isActive = false,
  color,
  icon,
  onPress,
  onClear,
  on = 'page',
  size = 'md',
  style,
}: ChipProps) {
  const { colors, typography, spacing } = useTheme();

  const accent = color ?? colors.primary;
  // Lime tint behind, deeper ink green for the label so it stays readable.
  const ink = color ?? colors.primaryInk;

  const bg = useMemo(
    () => (isActive ? alpha(accent, 'subtle') : on === 'surface' ? colors.card : colors.surface),
    [isActive, accent, on, colors.surface, colors.card],
  );

  const textColor = useMemo(
    () => (isActive ? ink : colors.textMuted),
    [isActive, ink, colors.textMuted],
  );

  const fontFamily = useMemo(
    () => isActive
      ? typography.styles.chipLabelActive.fontFamily
      : typography.styles.chipLabel.fontFamily,
    [isActive, typography],
  );

  const containerStyle = useMemo(
    () => [styles.base, size === 'sm' && styles.sm, { backgroundColor: bg, gap: icon ? spacing('2') : 0 }, style],
    [bg, icon, size, spacing, style],
  );

  const textStyle = useMemo(
    () => ({ fontFamily, ...(size === 'sm' ? typography.metrics.xs : typography.metrics.sm), color: textColor }),
    [fontFamily, size, typography.metrics, textColor],
  );

  const handlePress = useCallback(onPress, [onPress]);

  return (
    <BentoPressable
      style={containerStyle}
      onPress={handlePress}
      hitSlop={size === 'sm' ? 8 : 4}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {icon && (
        <Icon name={icon} size={size === 'sm' ? 12 : 14} color={isActive ? ink : colors.textMuted} />
      )}
      <Text style={textStyle} numberOfLines={1}>{label}</Text>
      {onClear ? (
        <BentoPressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel={`${label} ✕`} style={styles.clear}>
          <Icon name="x" size={12} color={isActive ? ink : colors.textMuted} weight="bold" />
        </BentoPressable>
      ) : null}
    </BentoPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  sm: { height: 28, paddingHorizontal: 12 },
  clear: { marginLeft: 6, marginRight: -4, padding: 2, borderRadius: 999 },
});
