import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Badge, Button, Card, CardActions, DetailRow, FormBlock, IconCircle, ListGroup, ListRow, Money, Notice, Radio, Section, SheetPanel, Switch, Text, useTheme,
} from '@/design';
import { BudgetHead } from '@/features/budgets';
import type { BudgetView } from '@/features/budgets';
import { AccountStack, BalanceCard } from '@/features/home';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';
import React, { useState } from 'react';
import { View } from 'react-native';

const colorOf = (name: string) => toDbColor((OFFERED_COLORS.find((offered) => offered.name === name) ?? OFFERED_COLORS[0]!).hex);

type Account = React.ComponentProps<typeof AccountStack>['accounts'][number];
const account = (id: number, name: string, accountType: Account['accountType'], color: string, balance: number): Account => ({
  id, name, accountType, color: colorOf(color), balance, isDefault: id === 1, currency: 'USD', holderName: '', accountNumber: '', icon: 'building', income: 0, expense: 0, countsAsSpendable: null, createdAt: '', updatedAt: '',
});
/** Three accounts ready to spend; a savings account put aside beside them. */
const READY = [account(1, 'Everyday', 'bank', 'lilac', 3240.1), account(2, 'Cash', 'cash', 'green', 227.17), account(3, 'Travel card', 'credit_card', 'orange', -640)];
const READY_TOTAL = READY.reduce((sum, a) => sum + a.balance, 0);
const SAVED = 12400;
const SAVINGS = account(4, 'Savings', 'savings', 'teal', SAVED);

/** Nothing put aside: all four accounts count. Put aside: the three, with the savings on the line under. */
const balances = (putAside?: { amount: number; accounts: number }) => ({
  currency: 'USD', currencies: ['USD'], setCurrency: () => {},
  accounts: putAside ? READY : [...READY, SAVINGS],
  balance: putAside ? READY_TOTAL : READY_TOTAL + SAVED,
  ...(putAside ? { putAside } : {}),
});

const CADENCES = [
  { key: 'never', label: 'Never' },
  { key: 'week', label: 'Every week' },
  { key: 'twoWeeks', label: 'Every 2 weeks' },
  { key: 'month', label: 'Every month' },
  { key: 'year', label: 'Every year' },
];

const GROCERIES: BudgetView = { id: 1, categoryId: 1, category: { name: 'Groceries', icon: 'shopping-cart', color: colorOf('teal') }, currency: 'USD', monthlyLimit: 500, rollover: false, limit: 500, spent: 250 };
/** The 18th of a 30-day month, as in the budgets' specimens. */
const DAY = new Date(2026, 10, 18);

/**
 * Release 2.1.0, before any of it is built: the spendable balance and repeating items, each
 * screen and state on fixed data, for the owner to approve (plan tasks O1.02, I1.02 to I1.04).
 */
export function ReleaseSection() {
  const { size, space } = useTheme();
  const [cadence, setCadence] = useState('month');
  const [asked, setAsked] = useState(true);
  const [ends, setEnds] = useState<'never' | 'date' | 'times'>('never');
  const [counts, setCounts] = useState(false);

  return (
    <>
      <Section title="Spendable balance">
        <Specimen name="Home, nothing put aside" note="As today: every account counts, so the card reads All accounts.">
          <BalanceCard balances={balances()} loading={false} onAddExpense={() => {}} onAddIncome={() => {}} onOpenAccounts={() => {}} />
        </Specimen>
        <Specimen name="Home, with savings put aside" note="The figure is what is ready to spend; what is put aside is a quiet line under it, so nothing is hidden. Net worth on Accounts still counts everything.">
          <BalanceCard balances={balances({ amount: SAVED, accounts: 1 })} loading={false} onAddExpense={() => {}} onAddIncome={() => {}} onOpenAccounts={() => {}} />
        </Specimen>
        <Specimen name="On the account form" note="Set by the kind of account (off for savings and investments) until changed by hand.">
          <ListGroup>
            <ListRow
              icon="wallet"
              title="Count in what I can spend"
              subtitle={counts ? 'Part of what Home shows as ready to spend' : 'Kept out of Home’s total, shown as put aside'}
              trailing={<Switch value={counts} onValueChange={setCounts} accessibilityLabel="Count in what I can spend" />}
            />
          </ListGroup>
        </Specimen>
        <Specimen name="On the account’s page" note="An account put aside says so beside its kind.">
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <IconCircle icon="piggy-bank" color="teal" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Savings</Text>
                <Text variant="callout" tone="muted">US dollar</Text>
              </View>
              <Badge label="Put aside" tone="neutral" />
            </View>
          </Card>
        </Specimen>
      </Section>

      <Section title="Repeating items">
        <Specimen name="Repeat on Add, not set" note="One more choice row in Details, plain until chosen, like a person.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="repeat" plain />} strong title="Doesn’t repeat" subtitle="Repeat" onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="Repeat on Add, set" note="Once chosen it takes a colour, and says how it will behave on its day.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="repeat" color="lilac" />} strong title="Every month" subtitle="Asked on its day · no end" onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="Choosing how it repeats" note="A sheet over Add. On its day and Ends appear once it repeats. A new item is asked about on its day, since amounts like a bill change.">
          <SheetPanel title="Repeat" onClose={() => {}} footer={<Button label="Done" />}>
            {/* Three choices of one kind, so one pattern: a label, then its options, all on the sheet's edge. */}
            <FormBlock label="How often:">
              {CADENCES.map((option) => <Radio key={option.key} label={option.label} selected={cadence === option.key} onPress={() => setCadence(option.key)} />)}
            </FormBlock>
            {cadence === 'never' ? null : (
              <>
                <FormBlock label="On its day:">
                  <Radio label="Ask me first" selected={asked} onPress={() => setAsked(true)} />
                  <Radio label="Add it by itself" selected={!asked} onPress={() => setAsked(false)} />
                </FormBlock>
                <FormBlock label="Ends:">
                  <Radio label="Never" selected={ends === 'never'} onPress={() => setEnds('never')} />
                  <Radio label="On a date" selected={ends === 'date'} onPress={() => setEnds('date')} />
                  <Radio label="After a number of times" selected={ends === 'times'} onPress={() => setEnds('times')} />
                </FormBlock>
              </>
            )}
          </SheetPanel>
        </Specimen>

        <Specimen name="Due today, on Home" note="Asked items wait here on their day. Add records it (tap the row first to change the amount); Skip lets this time pass. A day with nothing due shows nothing.">
          <View style={{ gap: size.cardGap }}>
            <Card padded={false}>
              <ListRow leading={<IconCircle icon="lightning" color="orange" />} strong title="Electricity bill" subtitle="Every month · Everyday" value="−$116.75" onPress={() => {}} />
              <CardActions actions={[{ label: 'Skip' }, { label: 'Add' }]} />
            </Card>
            <Card padded={false}>
              <ListRow leading={<IconCircle icon="house" color="pink" />} strong title="Rent" subtitle="Every month · Everyday" value="−$1,200.00" onPress={() => {}} />
              <CardActions actions={[{ label: 'Skip' }, { label: 'Add' }]} />
            </Card>
          </View>
        </Specimen>

        <Specimen name="Repeating items, on Plan" note="What it is, how often and when next, and the amount. Paused, ended and stopped items stay in the list and say so.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="Every month · next Sat, 1 Nov · added by itself" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="house" color="pink" />} strong title="Rent" subtitle="Every month · next Sat, 1 Nov" value="−$1,200.00" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="repeat" color="lilac" />} strong title="To savings" subtitle="Every month · next Mon, 3 Nov · Everyday to Savings" value="$300.00" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="coffee" color="orange" />} strong title="Coffee beans" subtitle="Every 2 weeks" trailing={<Badge label="Paused" tone="neutral" />} onPress={() => {}} />
            <ListRow leading={<IconCircle icon="wifi" color="teal" />} strong title="Home internet" subtitle="Its account was deleted" trailing={<Badge label="Stopped" tone="danger" />} onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="A third item on the free plan" note="Shown in place of the form. What is already there keeps working.">
          <Notice title="You have 2 repeating items" body="The free plan keeps 2. Fintraq Pro has no limit." linkLabel="See Fintraq Pro" onLink={() => {}} />
        </Specimen>

        <Specimen name="Upcoming, on Plan" note="The next 30 days, in date order, with loans’ due dates among them.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="Sat, 1 Nov" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="house" color="pink" />} strong title="Rent" subtitle="Sat, 1 Nov" value="−$1,200.00" onPress={() => {}} />
            <ListRow leading={<IconCircle initials="PN" color="lilac" />} strong title="Priya owes you" subtitle="Due Tue, 4 Nov · a loan" value="$300.00" valueTone="positive" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="lightning" color="orange" />} strong title="Electricity bill" subtitle="Fri, 14 Nov" value="−$116.75" onPress={() => {}} />
          </ListGroup>
        </Specimen>

        <Specimen name="An item’s page" note="The item, then what it has made. Change and Pause on the card; Delete in its menu, and the transactions it made stay.">
          <View style={{ gap: size.cardGap }}>
            <Card padded={false}>
              <View style={{ padding: size.cardPadding, gap: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <IconCircle icon="house" color="pink" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">Rent</Text>
                    <Text variant="callout" tone="muted">Expense · Everyday</Text>
                  </View>
                </View>
                <Money value="$1,200.00" variant="amountHero" />
              </View>
              {/* Detail rows carry the card's own inset, so they sit straight in the unpadded card, not in the padded head. */}
              <DetailRow label="How often" value="Every month, on the 1st" />
              <DetailRow label="Next" value="Sat, 1 Nov" />
              <DetailRow label="On its day" value="Asked first" />
              <DetailRow label="Ends" value="Never" />
              <CardActions actions={[{ label: 'Pause' }, { label: 'Change' }]} />
            </Card>
            <ListGroup>
              <ListRow leading={<IconCircle icon="house" color="pink" />} strong title="Rent" subtitle="Wed, 1 Oct · Everyday" value="−$1,200.00" onPress={() => {}} />
              <ListRow leading={<IconCircle icon="house" color="pink" />} strong title="Rent" subtitle="Mon, 1 Sep · Everyday" value="−$1,200.00" onPress={() => {}} />
            </ListGroup>
          </View>
        </Specimen>

        <Specimen name="A budget, with what is still to come" note="Shown, not taken off what is left.">
          <View style={{ gap: space.sm }}>
            <BudgetHead budget={GROCERIES} today={DAY} />
            <Text variant="callout" tone="muted" align="center">$45.00 still to come this month from repeating items</Text>
          </View>
        </Specimen>

        <Specimen name="The notification" note="At 9:00 on a day with asked items waiting, once; nothing for items added by themselves.">
          <Card style={{ gap: space.xs }}>
            <Text variant="callout" tone="muted">Fintraq · 9:00 AM</Text>
            <Text variant="bodyStrong">2 things are due today</Text>
            <Text variant="body">Rent and Electricity bill. Add them or skip them in Fintraq.</Text>
          </Card>
        </Specimen>
      </Section>
    </>
  );
}
