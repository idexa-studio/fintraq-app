import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Badge, Button, Card, CardActions, DetailRow, EmptyState, Icon, IconCircle, ListGroup, ListRow, Money, ProgressBar, Section, Text, useTheme,
} from '@/design';
import { BudgetHead, BudgetList } from '@/features/budgets';
import type { BudgetView } from '@/features/budgets';
import { OFFERED_COLORS } from '@/shared/contracts/pickers';
import { toDbColor } from '@/shared/format/color';
import React from 'react';
import { View } from 'react-native';

const shade = (i: number) => toDbColor(OFFERED_COLORS[i % OFFERED_COLORS.length]!.hex);

/** One budget in each state: room left, near the limit, exactly at it, and over. */
const BUDGETS: BudgetView[] = [
  { id: 1, category: { name: 'Groceries', icon: 'shopping-cart', color: shade(1) }, currency: 'USD', limit: 500, spent: 250 },
  { id: 2, category: { name: 'Eating out', icon: 'fork-knife', color: shade(6) }, currency: 'USD', limit: 200, spent: 172.5 },
  { id: 3, category: { name: 'Transport', icon: 'car', color: shade(2) }, currency: 'USD', limit: 120, spent: 120 },
  { id: 4, category: { name: 'Shopping', icon: 'shopping-bag', color: shade(4) }, currency: 'USD', limit: 150, spent: 190 },
  { id: 5, category: null, currency: 'USD', limit: 2000, spent: 1140 },
];
/** A fixed day, so the head reads the same whenever it is looked at: the 18th of a 30-day month. */
const DAY = new Date(2026, 10, 18);

/** Accounts, transactions, people and loans: the things the app keeps. */
export function MoneySection() {
  const { space, size } = useTheme();
  return (
    <>
      <Section title="Accounts">
        <Specimen name="Account card" note="Name, kind, balance, and the two things you do with it.">
          <Card padded={false}>
            <View style={{ padding: size.cardPadding, gap: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="bodyStrong">Everyday</Text>
                <Icon name="dots-three" />
              </View>
              <Text variant="callout" tone="muted">Bank account · US dollars</Text>
              <Money value="$12,480.10" variant="amountLarge" />
            </View>
            <CardActions actions={[{ label: 'Add transaction' }, { label: 'Transfer' }]} />
          </Card>
        </Specimen>
        <Specimen name="Net worth" note="What you have, what you owe, and the difference.">
          <ListGroup>
            <DetailRow label="You have" value="$37,347.27" />
            <DetailRow label="You owe" value="$640.00" />
            <DetailRow label="Net worth" value="$36,707.27" />
          </ListGroup>
        </Specimen>
      </Section>

      <Section title="Transactions">
        <Specimen name="A day" note="Grouped under the date, newest first.">
          <View style={{ gap: space.sm }}>
            <Text variant="bodyStrong">Today</Text>
            <ListGroup>
              <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Everyday · Weekly shop" value="−$42.10" onPress={() => {}} />
              <ListRow leading={<IconCircle icon="arrows-left-right" color="lilac" />} strong title="Transfer" subtitle="Everyday to Cash" value="$100.00" onPress={() => {}} />
              <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="Everyday" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
            </ListGroup>
          </View>
        </Specimen>
        <Specimen name="One transaction" note="Read it back, then change or remove it.">
          <View style={{ gap: space.lg }}>
            <ListGroup>
              <View style={{ padding: size.cardPadding, alignItems: 'center', gap: space.sm }}>
                <IconCircle icon="shopping-cart" color="teal" />
                <Text variant="bodyStrong">Groceries</Text>
                <Money value="−$42.10" variant="amountHero" />
              </View>
              <DetailRow label="Account" value="Everyday" />
              <DetailRow label="Date" value="8 October 2026" />
              <DetailRow label="Note" value="Weekly shop" />
            </ListGroup>
            <Button label="Edit" variant="secondary" />
            <Button label="Delete transaction" variant="link" />
          </View>
        </Specimen>
        <Specimen name="Nothing yet" note="Say what belongs here and offer the first step.">
          <EmptyState icon="receipt" title="No transactions yet" body="Add what you spend and earn, and it will show up here." actionLabel="Add your first transaction" />
          <EmptyState icon="search" title="Nothing matches" body="Try a shorter word, or clear the filters." actionLabel="Clear filters" />
        </Specimen>
      </Section>

      <Section title="People and loans">
        <Specimen name="Loan" note="Who, which way, how much is left, and how far along.">
          <Card padded={false}>
            <View style={{ padding: size.cardPadding, gap: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <IconCircle initials="RK" color="pink" />
                <View style={{ flex: 1, gap: space.xxs }}>
                  <Text variant="bodyStrong">Rahul Kumar</Text>
                  <Text variant="callout" tone="muted">You lent · due 20 Oct</Text>
                </View>
                <Badge label="Overdue" tone="danger" />
              </View>
              <Money value="$120.00" variant="amountLarge" />
              <ProgressBar value={0.4} accessibilityLabel="Share repaid" />
              <Text variant="callout" tone="muted">$80.00 of $200.00 repaid</Text>
            </View>
            <CardActions actions={[{ label: 'Record repayment' }]} />
          </Card>
        </Specimen>
        <Specimen name="Balances with people" note="Green when they owe you; plain when you owe them.">
          <ListGroup>
            <ListRow leading={<IconCircle initials="RK" color="pink" />} strong title="Rahul Kumar" subtitle="Owes you" value="$120.00" valueTone="positive" onPress={() => {}} />
            <ListRow leading={<IconCircle initials="AS" color="lilac" />} strong title="Aylin Sahin" subtitle="You owe" value="$60.00" onPress={() => {}} />
            <ListRow leading={<IconCircle initials="MJ" color="teal" />} strong title="Maya Jones" subtitle="All settled" onPress={() => {}} />
          </ListGroup>
        </Specimen>
      </Section>

      <Section title="Budgets (2.1)">
        <Specimen name="Budgets on Plan" note="Above loans. What is left is the figure; the bar is green with room, amber from 80%, red at the limit and past it. The last row is the budget over all spending.">
          <BudgetList budgets={BUDGETS} onOpen={() => {}} onAdd={() => {}} />
        </Specimen>
        <Specimen name="No budget yet" note="One quiet card on Plan, with the first step.">
          <BudgetList budgets={[]} onOpen={() => {}} onAdd={() => {}} />
        </Specimen>
        <Specimen name="A budget, with room" note="The top of its screen: what is left, then spent and limit, then the month on one line. Solid is spent, the lighter run is where the pace so far ends, the mark is today.">
          <BudgetHead budget={BUDGETS[0]!} today={DAY} />
        </Specimen>
        <Specimen name="A budget heading over" note="Still under today, but the pace ends past the limit: the forecast turns red and says by how much.">
          <BudgetHead budget={BUDGETS[1]!} today={DAY} />
        </Specimen>
        <Specimen name="A budget over" note="The figure is how far over. Nothing is forecast: the limit is already passed.">
          <BudgetHead budget={BUDGETS[3]!} today={DAY} />
        </Specimen>
      </Section>

      <Section title="Categories">
        <Specimen name="Category list" note="The colour and icon are the user’s own.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} title="Groceries" subtitle="Expense" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="car" color="orange" />} title="Transport" subtitle="Expense" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="briefcase" color="green" />} title="Salary" subtitle="Income" onPress={() => {}} />
          </ListGroup>
        </Specimen>
      </Section>
    </>
  );
}
