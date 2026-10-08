import { Text } from '@/design/components/Text';
import { useTheme } from '@/design/ThemeProvider';
import React from 'react';
import { View } from 'react-native';

export type FormBlockProps = {
  /** What the block asks for, ending in a colon as in the reference: "From:", "Details:". */
  label: string;
  children: React.ReactNode;
};

/** One question of a form: its bold label over the card that answers it. Every form is a run of these. */
export function FormBlock({ label, children }: FormBlockProps) {
  const { size } = useTheme();
  return (
    <View style={{ gap: size.labelGap }}>
      <Text variant="bodyStrong">{label}</Text>
      {children}
    </View>
  );
}

export type FieldStackProps = {
  /** Pads like a card. For fields that share a `ListGroup` with rows; inside a `Card` leave it off. */
  padded?: boolean;
  children: React.ReactNode;
};

/** Fields one under another, the same distance apart in every form. */
export function FieldStack({ padded = false, children }: FieldStackProps) {
  const { size } = useTheme();
  return <View style={{ gap: size.fieldGap, padding: padded ? size.cardPadding : 0 }}>{children}</View>;
}
