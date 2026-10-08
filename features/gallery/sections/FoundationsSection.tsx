import { Specimen } from '@/features/gallery/components/Specimen';
import { Card, Icon, IconCircle, PASTELS, Section, Text, useTheme } from '@/design';
import type { ColorRoles, TypeVariant } from '@/design';
import React from 'react';
import { View } from 'react-native';

const ROLES: [keyof ColorRoles, string][] = [
  ['background', 'Page'],
  ['surface', 'Cards, sheets, fields'],
  ['surfaceMuted', 'Unavailable surface'],
  ['text', 'Primary content'],
  ['textMuted', 'Descriptions, labels'],
  ['divider', 'Hairlines'],
  ['action', 'Main action, selected chip'],
  ['disabled', 'Unavailable action'],
  ['accent', 'Badge, active tab, on switch'],
  ['selected', 'Current item outline'],
  ['brandDeep', 'Brand, deep'],
  ['brand', 'Brand'],
  ['brandBright', 'Brand, bright'],
  ['brandTint', 'Behind illustration'],
  ['positive', 'Money in'],
  ['danger', 'Destructive, error'],
  ['warning', 'Needs checking'],
];

const TYPE_ROLES: [TypeVariant, string][] = [
  ['display', 'Know where your money goes'],
  ['title', 'Your balance'],
  ['action', 'Add expense'],
  ['leadStrong', 'Hi John'],
  ['lead', 'Everything stays on your phone.'],
  ['bodyStrong', 'Rahul Kumar'],
  ['body', 'Expenses'],
  ['calloutStrong', 'See all'],
  ['callout', 'Today · Everyday account'],
  ['captionStrong', 'Expenses'],
  ['caption', 'Income'],
  ['tabActive', 'Home'],
  ['tab', 'Accounts'],
  ['badge', 'New'],
  ['amountHero', '$36,707.27'],
  ['amountLarge', '$12,480.10'],
  ['amount', '−$42.10'],
];

export function FoundationsSection() {
  const { colors, type, space, radius, border } = useTheme();
  return (
    <>
      <Section title="Colour">
        <Card padded={false}>
          {ROLES.map(([role, use]) => (
            <View key={role} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
              <View style={{ width: space.xxl, height: space.xxl, borderRadius: radius.sm, backgroundColor: colors[role], borderWidth: border.thin, borderColor: colors.divider }} />
              <View style={{ flex: 1 }}>
                <Text variant="calloutStrong">{role}</Text>
                <Text variant="caption" tone="muted">{use}</Text>
              </View>
              <Text variant="caption" tone="muted">{colors[role]}</Text>
            </View>
          ))}
        </Card>
        <Specimen name="Pastels" note="Icon circles only. The glyph on top is always black." row>
          {Object.entries(PASTELS).map(([name, hex]) => (
            <View key={name} style={{ alignItems: 'center', gap: space.xs }}>
              <View style={{ width: space.xxxl, height: space.xxxl, borderRadius: radius.pill, backgroundColor: hex }} />
              <Text variant="caption" tone="muted">{name}</Text>
            </View>
          ))}
        </Specimen>
      </Section>

      <Section title="Icons">
        <Specimen name="Drawn by hand" note="Six category icons the icon set lacks, drawn to sit beside it. The second row is from the set, for comparison." row>
          {(['pizza', 'hamburger', 'egg', 'ice-cream', 'cat', 'dumbbell'] as const).map((name) => <Icon key={name} name={name} size={space.xxl} />)}
        </Specimen>
        <Specimen name="From the set" row>
          {(['coffee', 'shopping-cart', 'beer', 'car', 'gift', 'heart'] as const).map((name) => <Icon key={name} name={name} size={space.xxl} />)}
        </Specimen>
        <Specimen name="On a category" row>
          <IconCircle icon="pizza" color="orange" />
          <IconCircle icon="hamburger" color="pink" />
          <IconCircle icon="ice-cream" color="teal" />
          <IconCircle icon="cat" color="lilac" />
          <IconCircle icon="dumbbell" color="green" />
          <IconCircle icon="egg" color="orange" />
        </Specimen>
      </Section>

      <Section title="Type">
        <Card style={{ gap: space.lg }}>
          {TYPE_ROLES.map(([variant, sample]) => (
            <View key={variant} style={{ gap: space.xxs }}>
              <Text variant={variant}>{sample}</Text>
              <Text variant="caption" tone="muted">{`${variant} · ${(type[variant].fontFamily ?? 'System').replace('_', ' ')} · ${type[variant].fontSize}/${type[variant].lineHeight}`}</Text>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Shape and space">
        <Specimen name="Radius" note="Soft rectangles. Only badges and switches are pills." row>
          {(['sm', 'tile', 'chip', 'md', 'field', 'pill'] as const).map((token) => (
            <View key={token} style={{ alignItems: 'center', gap: space.xs }}>
              <View style={{ width: space.xxxl + space.lg, height: space.xxxl, borderRadius: radius[token], backgroundColor: colors.surface, borderWidth: border.thin, borderColor: colors.border }} />
              <Text variant="caption" tone="muted">{`${token} ${radius[token] === 999 ? '' : radius[token]}`}</Text>
            </View>
          ))}
        </Specimen>
        <Specimen name="Space" note="4pt grid. Page margin and card padding are both 16." row>
          {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const).map((token) => (
            <View key={token} style={{ alignItems: 'center', gap: space.xs }}>
              <View style={{ width: space[token], height: space[token], backgroundColor: colors.action }} />
              <Text variant="caption" tone="muted">{`${token} ${space[token]}`}</Text>
            </View>
          ))}
        </Specimen>
      </Section>
    </>
  );
}
