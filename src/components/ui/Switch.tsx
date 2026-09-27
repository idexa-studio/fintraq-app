import { useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Switch as RNSwitch } from 'react-native';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export const Switch = React.memo(function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const { colors, alpha } = useTheme();

  const handleChange = useCallback((next: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    onValueChange(next);
  }, [onValueChange]);

  return (
    <RNSwitch
      value={value}
      onValueChange={handleChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: alpha(colors.text, 'soft'), true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={alpha(colors.text, 'soft')}
    />
  );
});
