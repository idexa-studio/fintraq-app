import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Touchable } from '@/design/components/Touchable';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';

export type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  /** Required: an icon alone says nothing to a screen reader. */
  accessibilityLabel: string;
  size?: number;
  disabled?: boolean;
};

/**
 * A bare icon with a full-size touch target, as in the header. Drawn at the
 * reference's header size (about 22pt of ink in a 28pt box); `Icon` keeps the
 * line at the reference's weight at that size.
 */
export function IconButton({ icon, onPress, accessibilityLabel, size, disabled = false }: IconButtonProps) {
  const { size: sizes, colors } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={{ width: sizes.minTouch, height: sizes.minTouch, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={size ?? sizes.iconLarge} color={disabled ? colors.onDisabled : colors.text} />
    </Touchable>
  );
}
