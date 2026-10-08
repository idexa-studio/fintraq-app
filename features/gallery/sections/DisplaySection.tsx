import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Badge, Card, MarkTile, Checklist, DayHeader, DetailRow, SwipeRow, FeatureTile, Icon, IconCircle, IllustrationTile, ListGroup, ListRow,
  Money, ProgressBar, Section, Skeleton, Stat, StepRow, Text, useTheme,
} from '@/design';
import React from 'react';
import { View } from 'react-native';

export function DisplaySection() {
  const { space, size, colors } = useTheme();
  return (
    <>
      <Section title="Money">
        <Card style={{ gap: space.lg }}>
          <Specimen name="Hero, large, in a row" note="Minor units are set smaller on the two large sizes.">
            <Money value="₹1,20,450.75" variant="amountHero" />
            <Money value="$282.95" variant="amountLarge" />
            <View style={{ flexDirection: 'row', gap: space.xl }}>
              <Money value="−$42.10" />
              <Money value="+$1,500.00" tone="positive" />
            </View>
          </Specimen>
          <Specimen name="Stat" note="A labelled figure; two side by side at most.">
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Stat label="Money in" value="$2,310.00" tone="positive" />
              <Stat label="Money out" value="$1,845.20" />
            </View>
          </Specimen>
        </Card>
      </Section>

      <Section title="Rows">
        <Specimen name="Navigation" note="Tappable rows end in a chevron.">
          <ListGroup>
            <ListRow icon="bank" title="Accounts" subtitle="4 accounts" onPress={() => {}} />
            <ListRow icon="tag" title="Categories" onPress={() => {}} />
            <ListRow icon="cloud-arrow-up" title="Backup" value="On" onPress={() => {}} />
            <ListRow icon="lock" title="App lock" subtitle="Needs a device passcode" disabled onPress={() => {}} />
            <ListRow icon="trash" title="Delete all data" destructive onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="Transactions" note="Category circle, what and when, then the amount.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Today · Everyday account" value="−$42.10" />
            <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="1 Oct · Everyday account" value="+$1,500.00" valueTone="positive" />
            <ListRow leading={<IconCircle initials="RK" color="pink" />} strong title="Rahul Kumar" subtitle="Owes you" value="$120.00" onPress={() => {}} />
          </ListGroup>
        </Specimen>
        <Specimen name="A day in a list" note="Day header with the day's net; swipe a row left for edit and delete.">
          <View style={{ gap: space.sm }}>
            <DayHeader label="Today" value="−$46.60" />
            <ListGroup>
              <SwipeRow actions={[{ label: 'Edit', icon: 'pencil', onPress: () => {} }, { label: 'Delete', icon: 'trash', tone: 'danger', onPress: () => {} }]}>
                <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Everyday · Weekly shop" value="−$42.10" onPress={() => {}} />
              </SwipeRow>
              <SwipeRow actions={[{ label: 'Edit', icon: 'pencil', onPress: () => {} }, { label: 'Delete', icon: 'trash', tone: 'danger', onPress: () => {} }]}>
                <ListRow leading={<IconCircle icon="coffee" color="pink" />} strong title="Coffee" subtitle="Cash" value="−$4.50" onPress={() => {}} />
              </SwipeRow>
            </ListGroup>
          </View>
        </Specimen>
        <Specimen name="Promo" note="An illustration tile leads to a place worth visiting.">
          <Card padded={false}>
            <ListRow
              leading={<IllustrationTile><Icon name="arrows-left-right" size={size.iconLarge} color={colors.selected} /></IllustrationTile>}
              title="Transfer or lend"
              subtitle="Move money between accounts or people"
              onPress={() => {}}
            />
          </Card>
        </Specimen>
        <Specimen name="Details" note="Read-only facts: quiet label, bold value.">
          <ListGroup>
            <DetailRow label="Account" value="Everyday account" />
            <DetailRow label="Date" value="8 October 2026" />
            <DetailRow label="Note" value="Weekly shop" />
          </ListGroup>
        </Specimen>
      </Section>

      <Section title="Steps">
        <Specimen name="Journey" note="Done, current, still to come.">
          <View style={{ gap: space.lg + space.xs }}>
            <StepRow icon="hand-tap" label="Your name" state="done" />
            <StepRow icon="user" label="Your currency" state="current" />
            <StepRow icon="coins-stack" label="Your first account" state="upcoming" />
          </View>
        </Specimen>
        <Specimen name="Checklist" note="What to have ready before the next step.">
          <Checklist items={['Sign in with Google', 'Keep the app open until the backup finishes']} />
        </Specimen>
      </Section>

      <Section title="Tiles and marks">
        <Specimen name="Feature tiles" note="Two to a row.">
          <View style={{ flexDirection: 'row', gap: size.cardGap }}>
            <FeatureTile icon="credit-card" color="lilac" description="Split a bill or note who owes you" label="Add a person" onPress={() => {}} />
            <FeatureTile icon="dashboard-speed" color="pink" description="See where this month’s money went" label="Your insights" onPress={() => {}} />
          </View>
        </Specimen>
        <Specimen name="Icon circles and badges" row>
          <MarkTile icon="wallet" />
          <MarkTile icon="bank" />
          <IconCircle icon="flag" color="orange" />
          <IconCircle icon="leaf" color="teal" />
          <IconCircle initials="NA" color="lilac" />
          <Badge label="New" />
          <Badge label="Pro" tone="neutral" />
          <Badge label="Overdue" tone="danger" />
        </Specimen>
        <Specimen name="Progress" note="Share of a limit used; red once over.">
          <Card style={{ gap: space.md }}>
            <Text variant="callout" tone="muted">Groceries · $180 of $300</Text>
            <ProgressBar value={0.6} accessibilityLabel="Groceries budget used" />
            <Text variant="callout" tone="muted">Eating out · $140 of $100</Text>
            <ProgressBar value={1} over accessibilityLabel="Eating out budget used" />
          </Card>
        </Specimen>
        <Specimen name="Loading placeholder" note="Takes the shape of what is coming.">
          <Card style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
            <Skeleton height={size.iconCircle} circle />
            <View style={{ flex: 1, gap: space.sm }}>
              <Skeleton height={space.lg} width="60%" />
              <Skeleton height={space.md} width="40%" />
            </View>
          </Card>
        </Specimen>
      </Section>
    </>
  );
}
