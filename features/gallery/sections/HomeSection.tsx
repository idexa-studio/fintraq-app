import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Card, CardActions, EmptyState, FeatureTile, Header, MarkTile, Select, Icon, IconButton, IconCircle, IllustrationTile, ListGroup, ListRow, Money,
  ProgressBar, Section, Stat, TabBar, Text, useTheme,
} from '@/design';
import type { SelectOption, TabItem } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

export const APP_TABS: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'activity', label: 'Activity', icon: 'receipt' },
  { key: 'add', label: 'Add', icon: 'plus' },
  { key: 'plan', label: 'Plan', icon: 'calendar' },
  { key: 'insights', label: 'Insights', icon: 'chart-pie' },
];

type Currency = 'USD' | 'EUR' | 'TRY' | 'INR';

const CURRENCIES: SelectOption<Currency>[] = [
  { key: 'USD', label: 'USD', detail: 'US dollar' },
  { key: 'EUR', label: 'EUR', detail: 'Euro' },
  { key: 'TRY', label: 'TRY', detail: 'Turkish lira' },
  { key: 'INR', label: 'INR', detail: 'Indian rupee' },
];

const BALANCES: Record<Currency, string> = { USD: '$36,707.27', EUR: '€4,120.00', TRY: '₺18,450.75', INR: '₹2,40,300.00' };

/** The Home tab: where you stand and what to do next. */
export function HomeSection() {
  const { colors, space, size, border } = useTheme();
  const [currency, setCurrency] = useState<Currency>('USD');
  // Cancels the gallery's page margin so the screen is drawn at full width.
  const frame = { marginHorizontal: -space.lg, backgroundColor: colors.background, borderTopWidth: border.thin, borderBottomWidth: border.thin, borderColor: colors.divider };

  return (
    <>
      <Specimen name="Home" note="As in the reference: a white balance card with its two actions, then quick actions as tiles. The currency is a dropdown on the card, hidden with a single currency.">
        <View style={frame}>
          <Header
            title="Hi John"
            left={<IconButton icon="search" accessibilityLabel="Search" />}
            right={<><IconButton icon="bell" accessibilityLabel="Reminders" /><IconButton icon="user-circle" accessibilityLabel="Profile" /></>}
          />
          <View style={{ paddingHorizontal: size.screenPadding, gap: size.sectionGap, paddingTop: space.lg, paddingBottom: space.xl }}>
            <Section title="Your balance">
              <Card padded={false}>
                <View style={{ padding: size.cardPadding, gap: space.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyStrong">All accounts</Text>
                    <Select options={CURRENCIES} value={currency} onChange={setCurrency} accessibilityLabel="Currency" />
                  </View>
                  <Text variant="callout" tone="muted">4 accounts · {CURRENCIES.find((c) => c.key === currency)?.detail}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
                    <View style={{ flex: 1 }}><Money value={BALANCES[currency]} variant="amountHero" /></View>
                    <MarkTile icon="wallet" accessibilityLabel="Accounts" onPress={() => {}} />
                  </View>
                </View>
                <CardActions actions={[{ label: 'Add expense' }, { label: 'Add income' }]} />
              </Card>
            </Section>

            <Section title="Quick actions">
              <View style={{ flexDirection: 'row', gap: size.cardGap }}>
                <FeatureTile icon="arrows-left-right" color="lilac" description="Move money between your accounts" label="Transfer" onPress={() => {}} />
                <FeatureTile icon="hand-coins" color="pink" description="Track money lent or borrowed" label="Lend or borrow" onPress={() => {}} />
              </View>
            </Section>

            <Section title="This month" actionLabel="Insights">
              <Card style={{ gap: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.lg }}>
                  <Stat label="Money in" value="$3,454.65" tone="positive" />
                  <Stat label="Money out" value="$2,231.42" />
                </View>
                <View style={{ gap: space.sm }}>
                  <ProgressBar value={0.65} accessibilityLabel="Share of income spent" />
                  <Text variant="callout" tone="muted">You’ve kept 35% of what came in</Text>
                </View>
              </Card>
            </Section>

            <Section title="Accounts" actionLabel="See all">
              <ListGroup>
                <ListRow leading={<IconCircle icon="bank" color="lilac" />} strong title="Everyday" subtitle="Bank account" value="$12,480.10" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="cash" color="green" />} strong title="Cash" subtitle="Wallet" value="$227.17" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="credit-card" color="orange" />} strong title="Travel card" subtitle="Credit card" value="−$640.00" onPress={() => {}} />
              </ListGroup>
            </Section>

            <Section title="Recent" actionLabel="See all">
              <ListGroup>
                <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Today · Everyday" value="−$42.10" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="1 Oct · Everyday" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="coffee" color="pink" />} strong title="Coffee" subtitle="30 Sep · Cash" value="−$4.50" onPress={() => {}} />
              </ListGroup>
            </Section>

            <Section title="People and loans" actionLabel="See all">
              <ListGroup>
                <ListRow leading={<IconCircle initials="RK" color="pink" />} strong title="Rahul Kumar" subtitle="Owes you" value="$120.00" valueTone="positive" onPress={() => {}} />
                <ListRow leading={<IconCircle initials="AS" color="lilac" />} strong title="Aylin Sahin" subtitle="You owe" value="$60.00" onPress={() => {}} />
              </ListGroup>
            </Section>
          </View>
          <TabBar items={APP_TABS} activeKey="home" />
        </View>
      </Specimen>

      <Section title="Before there is anything">
        <Specimen name="Empty sections" note="A new user's Home keeps its sections. Each one says what will appear and offers the first step.">
          <EmptyState compact icon="receipt" title="Your spending shows up here" body="Add what you spend and earn." actionLabel="Add a transaction" />
          <EmptyState compact icon="wallet" title="Keep cash, bank and cards apart" body="One account is enough to start." actionLabel="Add an account" />
          <EmptyState compact icon="users" title="Remember who owes what" body="Track money lent, borrowed or split." actionLabel="Add a person" />
        </Specimen>
      </Section>
    </>
  );
}
