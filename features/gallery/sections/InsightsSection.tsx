import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Badge, BarChart, Card, Chip, ChipRow, DayStreak, Delta, Gauge, HeatGrid, IconCircle, LineChart, ListGroup, ListRow, LockedCard, Money, Notice, PASTELS, PaceBar,
  PairedBars, PeriodStepper, ProgressBar, RankBars, Ring, Section, SplitBar, Stat, Text, useTheme,
} from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

const PERIODS = ['Week', 'Month', 'Year'];

const WEEK = [
  { label: 'Mon', value: 32 }, { label: 'Tue', value: 54 }, { label: 'Wed', value: 12 }, { label: 'Thu', value: 80 },
  { label: 'Fri', value: 46 }, { label: 'Sat', value: 120 }, { label: 'Sun', value: 0 },
];

const TREND = [
  { label: 'Mar', value: 28.1 }, { label: 'Apr', value: 29.4 }, { label: 'May', value: 29.0 }, { label: 'Jun', value: 31.2 },
  { label: 'Jul', value: 32.8 }, { label: 'Aug', value: 32.1 }, { label: 'Sep', value: 35.5 }, { label: 'Oct', value: 36.7 },
];

const MONTHS = [
  { label: 'May', first: 3100, second: 2650 }, { label: 'Jun', first: 3100, second: 2890 }, { label: 'Jul', first: 3450, second: 2410 },
  { label: 'Aug', first: 3100, second: 3320 }, { label: 'Sep', first: 3300, second: 2430 }, { label: 'Oct', first: 3455, second: 2231 },
];

const WEEKDAYS = [
  { label: 'Mon', value: 48 }, { label: 'Tue', value: 52 }, { label: 'Wed', value: 39 }, { label: 'Thu', value: 61 },
  { label: 'Fri', value: 84 }, { label: 'Sat', value: 118 }, { label: 'Sun', value: 70 },
];

const HEAT = [0.1, 0.3, 0, 0.6, 0.2, 1, 0.4, 0.2, 0.1, 0.5, 0.3, 0.2, 0.9, 0.3, 0, 0.2, 0.4, 0.1, 0.3, 0.8, 0.5, 0.2, 0.3, 0.1, 0.6, 0.2, 0.7, 0.4, 0.3, 0.2, 0.5];

const SHARES = [
  { label: 'Groceries', value: 640, display: '$640', color: PASTELS.teal },
  { label: 'Transport', value: 410, display: '$410', color: PASTELS.orange },
  { label: 'Eating out', value: 357, display: '$357', color: PASTELS.pink },
  { label: 'Everything else', value: 824, display: '$824', color: PASTELS.lilac },
];

const STREAK = [
  { label: 'M', state: 'done' }, { label: 'T', state: 'done' }, { label: 'W', state: 'missed' }, { label: 'T', state: 'done' },
  { label: 'F', state: 'done' }, { label: 'S', state: 'today' }, { label: 'S', state: 'ahead' },
] as const;

const TOP = [
  { name: 'Groceries', icon: 'shopping-cart', color: 'teal', amount: '$640.20', share: 0.29 },
  { name: 'Transport', icon: 'car', color: 'orange', amount: '$410.00', share: 0.18 },
  { name: 'Eating out', icon: 'fork-knife', color: 'pink', amount: '$356.75', share: 0.16 },
] as const;

/** The Insights tab: why the numbers are what they are. */
export function InsightsSection() {
  const { space, size } = useTheme();
  const [period, setPeriod] = useState('Week');
  return (
    <>
      <Section title="Period">
        <Specimen name="Period summary" note="One headline figure, the chart behind it, then in and out.">
          <View style={{ marginHorizontal: -space.lg }}>
            <ChipRow>
              {PERIODS.map((label) => <Chip key={label} label={label} selected={label === period} onPress={() => setPeriod(label)} />)}
            </ChipRow>
          </View>
          <PeriodStepper label="5 to 11 October" nextDisabled />
          <Card style={{ gap: space.xl }}>
            <View style={{ gap: space.xs }}>
              <Text variant="callout" tone="muted">Spent this week</Text>
              <Money value="$344.00" variant="amountHero" />
              <Text variant="callout" tone="muted">$52.00 less than last week</Text>
            </View>
            <BarChart bars={WEEK} highlight={5} accessibilityLabel="Spending by day this week. Saturday was highest at 120 dollars." />
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Stat label="Money in" value="$800.00" tone="positive" />
              <Stat label="Money out" value="$344.00" />
            </View>
          </Card>
        </Specimen>
      </Section>

      <Section title="Over time">
        <Specimen name="Line chart" note="One figure month by month. Ends in a green dot at now.">
          <Card style={{ gap: space.lg }}>
            <View style={{ gap: space.xs }}>
              <Text variant="callout" tone="muted">Net worth</Text>
              <Money value="$36,707.27" variant="amountLarge" />
            </View>
            <LineChart points={TREND} accessibilityLabel="Net worth over the last eight months, rising from 28 thousand to 36.7 thousand dollars" />
          </Card>
        </Specimen>
      </Section>

      <Section title="Against last time">
        <Specimen name="Change" note="The figure, then which way it moved and whether that is welcome. Less spending is green; less income is red.">
          <Card style={{ gap: space.lg }}>
            <View style={{ gap: space.xs }}>
              <Text variant="callout" tone="muted">Spent in October</Text>
              <Money value="$2,231.42" variant="amountLarge" />
              <Delta direction="down" good label="8% less than September" />
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="callout" tone="muted">Eating out</Text>
              <Money value="$356.75" variant="amountLarge" />
              <Delta direction="up" good={false} label="$92 more than September" />
            </View>
          </Card>
        </Specimen>
        <Specimen name="In against out" note="Six months side by side. A month where black is taller than green cost more than it brought in.">
          <Card>
            <PairedBars pairs={MONTHS} firstLabel="Money in" secondLabel="Money out" accessibilityLabel="Money in and out for the last six months. Only August spent more than came in." />
          </Card>
        </Specimen>
      </Section>

      <Section title="Where the month is heading">
        <Specimen name="Forecast" note="Solid is spent, the lighter stretch is where the pace leads, the green mark is today.">
          <Card style={{ gap: space.lg }}>
            <View style={{ gap: space.xs }}>
              <Text variant="callout" tone="muted">On course to spend</Text>
              <Money value="$2,610.00" variant="amountLarge" />
              <Text variant="callout" tone="muted">About $84 a day. That is $180 more than September.</Text>
            </View>
            <PaceBar spent={0.86} projected={1.07} today={0.29} startLabel="1 Oct" endLabel="September’s $2,430" todayLabel="Today" accessibilityLabel="Spent 86 percent of September’s total with 29 percent of October gone; on course to finish 7 percent over" />
          </Card>
        </Specimen>
        <Specimen name="What you kept" note="The share of income not spent, as a filling arc.">
          <Card style={{ alignItems: 'center', gap: space.md }}>
            <Gauge value={0.35} width={size.illustrationTile * 3.5} accessibilityLabel="35 percent of income kept this month">
              <Text variant="amountLarge">35%</Text>
            </Gauge>
            <Text variant="callout" tone="muted" align="center">of what came in is still yours: $1,223.23</Text>
          </Card>
        </Specimen>
      </Section>

      <Section title="At a glance">
        <Specimen name="Figures" note="Four numbers that describe the period, two to a row.">
          <Card style={{ gap: space.xl }}>
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Stat label="A typical day" value="$74.38" />
              <Stat label="Costliest day" value="$212.40" />
            </View>
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Stat label="Transactions" value="86" />
              <Stat label="Days with no spending" value="4" />
            </View>
          </Card>
        </Specimen>
        <Specimen name="Largest expenses" note="The few items that moved the total most.">
          <ListGroup>
            <ListRow leading={<IconCircle icon="house" color="lilac" />} strong title="Rent" subtitle="1 Oct · Everyday" value="−$950.00" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="airplane" color="orange" />} strong title="Flights" subtitle="3 Oct · Travel card" value="−$312.00" onPress={() => {}} />
            <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="5 Oct · Everyday" value="−$128.60" onPress={() => {}} />
          </ListGroup>
        </Specimen>
      </Section>

      <Section title="Rhythm">
        <Specimen name="By weekday" note="What a typical Monday to Sunday costs. The dearest day is green.">
          <Card>
            <BarChart bars={WEEKDAYS} highlight={5} accessibilityLabel="Average spending by weekday. Saturday is highest at 118 dollars, Wednesday lowest at 39." />
          </Card>
        </Specimen>
        <Specimen name="The month as a calendar" note="Darker where more was spent. Today is green.">
          <Card style={{ gap: space.md }}>
            <Text variant="bodyStrong">October</Text>
            <HeatGrid values={HEAT} columns={['M', 'T', 'W', 'T', 'F', 'S', 'S']} highlight={7} accessibilityLabel="Spending by day in October. Saturdays are the heaviest days." />
          </Card>
        </Specimen>
        <Specimen name="Logging habit" note="A tick for each day recorded.">
          <Card style={{ gap: space.lg }}>
            <Text variant="bodyStrong">4 days logged this week</Text>
            <DayStreak days={[...STREAK]} accessibilityLabel="Four of the last five days logged; today is still open" />
          </Card>
        </Specimen>
      </Section>

      <Section title="Breakdown">
        <Specimen name="By category" note="Shares around the total, then the same as a bar with its legend.">
          <Card style={{ alignItems: 'center', gap: space.xl }}>
            <Ring segments={SHARES} size={size.illustrationTile * 3} accessibilityLabel="Spending by category this month">
              <Text variant="callout" tone="muted">Spent</Text>
              <Money value="$2,231" variant="amountLarge" />
            </Ring>
            <View style={{ alignSelf: 'stretch' }}><SplitBar segments={SHARES} /></View>
          </Card>
        </Specimen>
        <Specimen name="Ranked" note="Each bar is drawn against the largest, so lengths compare directly. For categories, accounts or people.">
          <Card>
            <RankBars
              items={[
                { key: 'g', label: 'Groceries', value: 640, display: '$640.20', note: '29%', leading: <IconCircle icon="shopping-cart" color="teal" size={size.icon + space.sm} /> },
                { key: 't', label: 'Transport', value: 410, display: '$410.00', note: '18%', leading: <IconCircle icon="car" color="orange" size={size.icon + space.sm} /> },
                { key: 'e', label: 'Eating out', value: 357, display: '$356.75', note: '16%', leading: <IconCircle icon="fork-knife" color="pink" size={size.icon + space.sm} /> },
                { key: 'f', label: 'Fun', value: 120, display: '$120.00', note: '5%', leading: <IconCircle icon="gamepad" color="lilac" size={size.icon + space.sm} /> },
              ]}
            />
          </Card>
        </Specimen>
        <Specimen name="Who you spend with" note="The same ranking for people.">
          <Card>
            <RankBars
              items={[
                { key: 'rk', label: 'Rahul Kumar', value: 420, display: '$420.00', note: '12 times', leading: <IconCircle initials="RK" color="pink" size={size.icon + space.sm} /> },
                { key: 'as', label: 'Aylin Sahin', value: 260, display: '$260.00', note: '5 times', leading: <IconCircle initials="AS" color="lilac" size={size.icon + space.sm} /> },
                { key: 'mj', label: 'Maya Jones', value: 75, display: '$75.00', note: 'twice', leading: <IconCircle initials="MJ" color="teal" size={size.icon + space.sm} /> },
              ]}
            />
          </Card>
        </Specimen>
      </Section>

      <Section title="Where it went" actionLabel="All categories">
        <Specimen name="Top categories" note="Amount, and its share of the total as a bar.">
          <Card style={{ gap: space.lg }}>
            {TOP.map((item) => (
              <View key={item.name} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <IconCircle icon={item.icon} color={item.color} size={size.icon + space.sm} />
                  <Text variant="bodyStrong" style={{ flex: 1 }}>{item.name}</Text>
                  <Money value={item.amount} />
                </View>
                <ProgressBar value={item.share} accessibilityLabel={`${item.name}, ${Math.round(item.share * 100)} percent of spending`} />
              </View>
            ))}
          </Card>
        </Specimen>
      </Section>

      <Section title="Worth knowing">
        <Specimen name="Insight" note="A plain sentence about a pattern, with the figure that backs it.">
          <Notice title="Saturdays cost you most" body="You spend about $118 on a Saturday, three times a weekday." />
          <Notice tone="positive" title="Groceries are down" body="$64 less than last month so far." />
        </Specimen>
        <Specimen name="Locked on the free plan" note="One card for everything Pro adds here, with one way in.">
          <LockedCard
            badge="Pro"
            title="Forecast, rhythm and people"
            body="See where the month is heading before it gets there."
            items={[{ icon: 'trending-up-down', title: 'Month-end forecast' }, { icon: 'chart-bar', title: 'Which days cost most' }, { icon: 'users', title: 'Who you spend with' }]}
            actionLabel="See Fintraq Pro"
          />
        </Specimen>
        <Specimen name="Locked row" note="One Pro item inside a free list: the row stays readable and says which plan opens it.">
          <ListGroup>
            <ListRow icon="search" title="Search" subtitle="Find anything in your history" trailing={<Badge label="Pro" />} onPress={() => {}} />
            <ListRow icon="download-simple" title="Export" subtitle="Transactions as a spreadsheet" trailing={<Badge label="Pro" />} onPress={() => {}} />
          </ListGroup>
        </Specimen>
      </Section>
    </>
  );
}
