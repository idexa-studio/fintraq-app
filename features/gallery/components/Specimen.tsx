import { Text, useTheme } from '@/design';
import React from 'react';
import { View } from 'react-native';

type SpecimenProps = {
  name: string;
  /** When to use it, in a line. */
  note?: string;
  children?: React.ReactNode;
  /** Lay the children out in a wrapping row instead of a column. */
  row?: boolean;
};

/** One component in the gallery: its name, when to use it, and the live thing. */
export function Specimen({ name, note, children, row = false }: SpecimenProps) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <Text variant="captionStrong">{name}</Text>
        {note ? <Text variant="caption" tone="muted">{note}</Text> : null}
      </View>
      <View style={row ? { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md } : { gap: space.md }}>{children}</View>
    </View>
  );
}
