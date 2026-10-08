import { Text, useTheme } from '@/design';
import type { TypeVariant } from '@/design';
import React from 'react';
import { View } from 'react-native';

/**
 * Strings taken from the reference screens, one per line, each in the variant
 * that should reproduce it. Captured on a phone and measured against the
 * reference to tune the type ramp (plan tasks B2.05 and B2.07). Not a design
 * specimen: it is reachable only by link (`?section=match`).
 */
export const MATCH_LINES: [TypeVariant, string][] = [
  ['display', 'We’re glad you’re here'],
  ['display', 'Welcome'],
  ['title', 'Current accounts'],
  ['title', 'Are you new to Lloyds?'],
  ['title', 'Add payment details'],
  ['title', 'Please wait'],
  ['action', 'Let’s get you logged on'],
  ['action', 'Continue'],
  ['action', 'Pay & transfer'],
  ['bodyStrong', 'Add accounts'],
  ['bodyStrong', 'Your personal information'],
  ['bodyStrong', 'From:'],
  ['body', 'Manage Cards'],
  ['body', 'Make a standing order'],
  ['lead', 'Yes, I’m a new customer'],
  ['lead', 'Your identity'],
  ['lead', 'Part of the same family'],
  ['callout', 'View PIN, freeze card and more'],
  ['callout', 'Given name(s)'],
  ['caption', 'Summary'],
  ['tab', 'Payments'],
  ['tabActive', 'Home'],
  ['badge', 'NEW'],
  ['amountLarge', '£0'],
];

export function MatchSection() {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {MATCH_LINES.map(([variant, line], i) => (
        <Text key={i} variant={variant} numberOfLines={1}>{line}</Text>
      ))}
      <View style={{ height: space.xxxl }} />
      <Text variant="lead" style={{ width: 300 }}>Join the millions of customers already enjoying Lloyds.</Text>
      <Text variant="body" tone="muted" style={{ width: 150 }}>Check your credit score and track your progress</Text>
      <Text variant="display" align="center" style={{ width: 300 }}>Want account updates as they happen?</Text>
    </View>
  );
}
