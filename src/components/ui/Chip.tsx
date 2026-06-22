import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

type ChipProps = {
  label: string;
  isActive?: boolean;
  /** Accent color for active bg tint + text. Defaults to theme primary. */
  color?: string;
  icon?: IconSvgElement;
  onPress: () => void;
  style?: ViewStyle;
};

export const Chip = React.memo(function Chip({
  label,
  isActive = false,
  color,
  icon,
  onPress,
  style,
}: ChipProps) {
  const { colors, typography, spacing, radius } = useTheme();

  const accent = color ?? colors.primary;

  const bg = useMemo(
    () => (isActive ? accent + '18' : colors.surface),
    [isActive, accent, colors.surface],
  );

  const textColor = useMemo(
    () => (isActive ? accent : colors.textMuted),
    [isActive, accent, colors.textMuted],
  );

  const fontFamily = useMemo(
    () => isActive
      ? typography.styles.chipLabelActive.fontFamily
      : typography.styles.chipLabel.fontFamily,
    [isActive, typography],
  );

  const containerStyle = useMemo(
    () => [styles.base, { backgroundColor: bg, gap: icon ? spacing('2') : 0 }, style],
    [bg, icon, spacing, style],
  );

  const textStyle = useMemo(
    () => ({ fontFamily, fontSize: typography.sizes.sm, color: textColor }),
    [fontFamily, typography.sizes.sm, textColor],
  );

  const handlePress = useCallback(onPress, [onPress]);

  return (
    <BentoPressable
      style={containerStyle}
      onPress={handlePress}
    >
      {icon && (
        <HugeiconsIcon icon={icon} size={14} color={isActive ? accent : colors.textMuted} />
      )}
      <Text style={textStyle} numberOfLines={1}>{label}</Text>
    </BentoPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
});
