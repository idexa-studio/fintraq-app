import { Specimen } from '@/features/gallery/components/Specimen';
import { Card, Chip, Highlight, IconCircle, INK, Money, Receipt, ReceiptRule, Section, SlideToConfirm, Text, Timeline, WaveCard, useTheme } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

const QUICK = ['+5', '+10', '+20', '+50', '+100'];

/** The expressive widgets, each kept for a named screen (see docs/PLAN.md, B1.02). */
export function IdeasSection() {
  const { colors, space, size } = useTheme();
  const [settled, setSettled] = useState(false);

  return (
    <>
      <Section title="Brand moments">
        <Specimen name="Wave card" note="The three greens of the launch screen, for the one figure that matters most. Once per screen at most.">
          <WaveCard accessibilityLabel="Net worth, 36,707 dollars and 27 cents, up 1,223 dollars this month">
            <Text variant="bodyStrong" style={{ color: INK }}>Net worth</Text>
            <Text variant="amountHero" style={{ color: INK }}>$36,707.27</Text>
            <Text variant="callout" style={{ color: INK }}>Up $1,223.23 this month</Text>
          </WaveCard>
        </Specimen>
        <Specimen name="Highlight" note="A finding worth stopping for: a coloured mark, a serif sentence and the number behind it.">
          <Highlight icon="sparkle" statement="Saturdays cost you three times a weekday" detail="About $118 each Saturday over the last two months." />
          <Highlight icon="trend-down" color="teal" statement="Groceries are down $64 on last month" />
        </Specimen>
      </Section>

      <Section title="Records">
        <Specimen name="Receipt" note="One payment as a slip of paper with a torn edge.">
          <Receipt>
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <IconCircle icon="shopping-cart" color="teal" />
              <Text variant="bodyStrong">Groceries</Text>
              <Money value="−$42.10" variant="amountHero" />
            </View>
            <ReceiptRule />
            <View style={{ gap: space.md }}>
              {[['Account', 'Everyday'], ['Date', '8 October 2026'], ['Note', 'Weekly shop']].map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="callout" tone="muted">{label}</Text>
                  <Text variant="calloutStrong">{value}</Text>
                </View>
              ))}
            </View>
          </Receipt>
        </Specimen>
        <Specimen name="Timeline" note="A loan as a story: lent, part repaid, what is still due.">
          <Card>
            <Timeline
              items={[
                { title: 'You lent Rahul', subtitle: '12 September', value: '$200.00', state: 'done' },
                { title: 'First repayment', subtitle: '28 September', value: '$80.00', state: 'done' },
                { title: 'Due', subtitle: '20 October · in 12 days', value: '$120.00', state: 'current' },
                { title: 'Settled', state: 'upcoming' },
              ]}
            />
          </Card>
        </Specimen>
      </Section>

      <Section title="Input with feeling">
        <Specimen name="Slide to confirm" note="For settling up and other actions that should never happen by accident.">
          <SlideToConfirm label={settled ? 'Settled' : 'Slide to settle $120.00'} onConfirm={() => setSettled(true)} />
        </Specimen>
        <Specimen name="Quick amounts" note="Common amounts one tap away, above the keypad." row>
          {QUICK.map((label) => <Chip key={label} menu={false} label={label} />)}
        </Specimen>
      </Section>
    </>
  );
}
