import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type DividerProps = {
  vertical?: boolean;
};

/** Hairline between rows, and between a card and its actions. */
export function Divider({ vertical = false }: DividerProps) {
  const { colors, border } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.divider },
        vertical ? { width: border.thin, alignSelf: 'stretch' } : { height: border.thin, alignSelf: 'stretch' },
      ]}
    />
  );
}
