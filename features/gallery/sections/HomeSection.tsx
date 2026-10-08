import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Card, CardActions, EmptyState, FeatureTile, Header, MarkTile, Notice, Select, IconButton, IconCircle, ListGroup, ListRow, Money,
  Section, TabBar, Text, useTheme,
} from '@/design';
import { AccountStack, GettingStarted, MonthCardView, PeopleStrip, gettingStartedSteps } from '@/features/home';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';
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

const colorOf = (name: string) => toDbColor((OFFERED_COLORS.find((offered) => offered.name === name) ?? OFFERED_COLORS[0]!).hex);

type StackAccount = React.ComponentProps<typeof AccountStack>['accounts'][number];
const account = (id: number, name: string, accountType: StackAccount['accountType'], color: string, balance: number, isDefault = false): StackAccount => ({
  id, name, accountType, color: colorOf(color), balance, isDefault, currency: 'USD', holderName: '', accountNumber: '', icon: 'building', income: 0, expense: 0, createdAt: '', updatedAt: '',
});
const ACCOUNTS = [account(1, 'Everyday', 'bank', 'lilac', 12480.1, true), account(2, 'Cash', 'cash', 'green', 227.17), account(3, 'Travel card', 'credit_card', 'orange', -640)];

type StripPerson = NonNullable<React.ComponentProps<typeof PeopleStrip>['people']>[number];
const person = (id: number, name: string, color: string, net: number) => ({ id, name, color: colorOf(color), net }) as StripPerson;
const PEOPLE = [person(1, 'Rahul Kumar', 'pink', 120), person(2, 'Aylin Sahin', 'lilac', -60), person(3, 'Mina Park', 'teal', 0)];

const FIRST_STEPS = gettingStartedSteps({ accountCount: 1, transactionCount: 0, reminderOn: false, isPro: false, autoBackupOn: false });

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
            right={<IconButton icon="user-circle" accessibilityLabel="Settings" />}
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

            <Section title="Quick actions" hint="Shortcuts to what you do often">
              <View style={{ flexDirection: 'row', gap: size.cardGap }}>
                <FeatureTile icon="arrows-left-right" color="lilac" description="Move money between your accounts" label="Transfer" onPress={() => {}} />
                <FeatureTile icon="hand-coins" color="pink" description="Track money lent or borrowed" label="Lend or borrow" onPress={() => {}} />
              </View>
            </Section>

            <Section title="Accounts" hint="Tap a card to open it" actionLabel="See all">
              <AccountStack accounts={ACCOUNTS} onOpen={() => {}} onOpenAll={() => {}} />
            </Section>

            <Section title="This month" hint="What came in, what went out, and what is left" actionLabel="Insights">
              <MonthCardView income={3454.65} expense={2231.42} currency="USD" />
            </Section>

            <Section title="Recent" hint="The latest things you recorded" actionLabel="See all">
              <ListGroup>
                <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Today · Everyday" value="−$42.10" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="1 Oct · Everyday" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
                <ListRow leading={<IconCircle icon="coffee" color="pink" />} strong title="Coffee" subtitle="30 Sep · Cash" value="−$4.50" onPress={() => {}} />
              </ListGroup>
            </Section>

            <Section title="People and loans" hint="What stands between you, from open loans" actionLabel="See all">
              <PeopleStrip people={PEOPLE} currency="USD" loading={false} onOpen={() => {}} onAdd={() => {}} />
            </Section>
          </View>
          <TabBar items={APP_TABS} activeKey="home" />
        </View>
      </Specimen>

      <Section title="For someone new">
        <Specimen name="Getting started" note="Under the balance until every step is done, it is hidden, or ten things are recorded. Done steps are ticked, the next one is ready to tap, the rest wait.">
          <GettingStarted steps={FIRST_STEPS} onStep={() => {}} onHide={() => {}} />
        </Specimen>
        <Specimen name="Backup prompt" note="For a Pro user with no Drive connected, after three entries. A card on the page, never laid over it; put away, it stays away two weeks.">
          <Notice title="Your records live only on this phone" body="Keep a copy in your own Google Drive, updated twice a day." linkLabel="Set up backup" onDismiss={() => {}} dismissLabel="Not now" />
        </Specimen>
      </Section>

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
