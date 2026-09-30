import { BentoPressable } from './BentoPressable';
import { useTheme } from '@/src/providers/ThemeProvider';
import { foregroundOn } from '@/src/theme/tokens';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { Text } from './Text';

export type IconButtonVariant = 'ghost' | 'surface' | 'tonal' | 'filled' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = {
  icon: IconSource;
  onPress: () => void;
  /** Required: icon-only controls have no visible label for screen readers. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Tint for `tonal` / `filled`. Defaults to theme primary. */
  color?: string;
  disabled?: boolean;
  isLoading?: boolean;
  /** Small count bubble (active filters). Hidden when 0 / undefined. */
  badge?: number;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE: Record<IconButtonSize, number> = { sm: 17, md: 20, lg: 22 };

export const IconButton = React.memo(function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 'md',
  color,
  disabled = false,
  isLoading = false,
  badge,
  style,
}: IconButtonProps) {
  const { colors, sizes, radius, alpha, layout } = useTheme();
  const accent = color ?? colors.primary;
  const dimension = sizes.iconButton[size];

  const { bg, fg } = useMemo(() => {
    switch (variant) {
      case 'ghost': return { bg: 'transparent', fg: colors.text };
      case 'tonal': return { bg: alpha(accent, 'subtle'), fg: color ?? colors.primaryInk };
      case 'filled': return { bg: accent, fg: foregroundOn(accent) };
      case 'danger': return { bg: alpha(colors.danger, 'subtle'), fg: colors.danger };
      case 'surface':
      default:
        return { bg: colors.surface, fg: colors.text };
    }
  }, [variant, accent, color, colors, alpha]);

  // Keep the visual size but guarantee a 44pt hit area on small buttons.
  const hitSlop = Math.max(0, (layout.minTouchTarget - dimension) / 2);

  return (
    <BentoPressable
      onPress={onPress}
      disabled={disabled || isLoading}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      overflow={badge ? 'visible' : 'hidden'}
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: radius('full'),
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {isLoading
        ? <ActivityIndicator size="small" color={fg} />
        : <Icon icon={icon} size={ICON_SIZE[size]} color={fg} />}
      {badge ? (
        <View style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: radius('full'), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="micro" tone="onPrimary">{badge}</Text>
        </View>
      ) : null}
    </BentoPressable>
  );
});
