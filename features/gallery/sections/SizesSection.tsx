import { Specimen } from '@/features/gallery/components/Specimen';
import { APP_TABS } from '@/features/gallery/sections/HomeSection';
import {
  Button, Card, CardActions, Column, Columns, DialogPanel, FeatureTile, Header, IconButton, IconCircle, LayoutProvider, ListGroup, ListRow, MarkTile, Money,
  OptionList, Screen, Section, SheetFrame, SheetPanel, TabBar, TabRail, Text, useLayout, useTheme,
} from '@/design';
import { MonthCardView } from '@/features/home';
import React, { useState } from 'react';
import { View } from 'react-native';

/** The sizes the app is checked at: the smallest phone still sold, an ordinary one, and a tablet both ways up. */
const SIZES = [
  { name: 'Small phone', note: '320 wide. Compact: today’s design, nothing cut off.', width: 320, height: 568 },
  { name: 'Phone', note: '412 wide. Compact.', width: 412, height: 800 },
  { name: 'Tablet, upright', note: '800 wide. Medium: one column in the middle, the tabs held to it.', width: 800, height: 1100 },
  { name: 'Tablet, on its side', note: '1280 wide. Expanded: the tabs are a rail, the cards take two columns.', width: 1280, height: 800 },
] as const;

type FrameProps = {
  width: number;
  height: number;
  children: React.ReactNode;
};

/** Draws its children on a screen of the given size, shrunk as a whole to fit the gallery's column. */
function Frame({ width, height, children }: FrameProps) {
  const { colors, radius, border } = useTheme();
  const [room, setRoom] = useState(0);
  const shrink = room ? Math.min(1, room / width) : 0;
  return (
    <View onLayout={(e) => setRoom(e.nativeEvent.layout.width)}>
      {shrink ? (
        <View style={{ alignSelf: 'center', width: width * shrink, height: height * shrink, borderRadius: radius.md, borderWidth: border.thin, borderColor: colors.divider, overflow: 'hidden' }}>
          <View style={{ width, height, transformOrigin: 'top left', transform: [{ scale: shrink }], backgroundColor: colors.background }}>
            <LayoutProvider width={width} height={height}>{children}</LayoutProvider>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Home, on stand-in figures, built from the same parts as the real one. */
function Home() {
  const { size } = useTheme();
  const { isExpanded } = useLayout();
  const page = (
    <Screen
      tabbed
      header={<Header title="Hi John" left={<IconButton icon="search" accessibilityLabel="Search" />} right={<IconButton icon="user-circle" accessibilityLabel="Settings" />} />}
      tabBar={isExpanded ? undefined : <TabBar items={APP_TABS} activeKey="home" />}
    >
      <Columns>
        <Column>
          <Card padded={false}>
            <View style={{ padding: size.cardPadding, gap: size.cardGap / 2 }}>
              <Text variant="bodyStrong">All accounts</Text>
              <Text variant="callout" tone="muted">Across 4 accounts in US dollar</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}><Money value="$36,707.27" variant="amountHero" /></View>
                <MarkTile icon="wallet" accessibilityLabel="Accounts" onPress={() => {}} />
              </View>
            </View>
            <CardActions actions={[{ label: 'Add expense' }, { label: 'Add income' }]} />
          </Card>
          <View style={{ flexDirection: 'row', gap: size.cardGap }}>
            <FeatureTile compact icon="arrows-left-right" color="lilac" description="Between your accounts" label="Transfer" onPress={() => {}} />
            <FeatureTile compact icon="hand-coins" color="pink" description="Money lent or borrowed" label="New loan" onPress={() => {}} />
          </View>
          <Section title="This month" hint="What came in, what went out, and what is left" actionLabel="Insights">
            <MonthCardView income={3454.65} expense={2231.42} currency="USD" />
          </Section>
        </Column>
        <Column>
          <Section title="Recent" hint="The latest things you recorded" actionLabel="See all">
            <ListGroup>
              <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Today · Everyday" value="−$42.10" onPress={() => {}} />
              <ListRow leading={<IconCircle icon="briefcase" color="green" />} strong title="Salary" subtitle="1 Oct · Everyday" value="+$3,200.00" valueTone="positive" onPress={() => {}} />
              <ListRow leading={<IconCircle icon="coffee" color="pink" />} strong title="Coffee" subtitle="30 Sep · Cash" value="−$4.50" onPress={() => {}} />
            </ListGroup>
          </Section>
        </Column>
      </Columns>
    </Screen>
  );
  if (!isExpanded) return page;
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <TabRail items={APP_TABS} activeKey="home" />
      <View style={{ flex: 1 }}>{page}</View>
    </View>
  );
}

const CURRENCIES = [
  { key: 'USD', title: 'USD', subtitle: 'US dollar' },
  { key: 'EUR', title: 'EUR', subtitle: 'Euro' },
  { key: 'INR', title: 'INR', subtitle: 'Indian rupee' },
];

/** A picker over the dimmed screen: a sheet on a phone, a card on anything wider. */
function Picker() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.scrim }}>
      <SheetFrame hug>
        <SheetPanel title="Which currency?" onClose={() => {}}>
          <OptionList groups={[{ options: CURRENCIES }]} selectedKey="USD" />
        </SheetPanel>
      </SheetFrame>
    </View>
  );
}

/** A question over the dimmed screen: never wider than it reads well. */
function Question() {
  const { colors, size } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: size.dialogMargin, backgroundColor: colors.scrim }}>
      <DialogPanel title="Delete this budget?" body="Its transactions stay where they are.">
        <Button label="Delete budget" />
        <Button label="Keep it" variant="secondary" />
      </DialogPanel>
    </View>
  );
}

/** How the app answers each size of screen. Drawn to scale, so a tablet can be judged on a phone. */
export function SizesSection() {
  return (
    <>
      <Section title="Home at each size" hint="The same screen, laid out by the width it is given">
        {SIZES.map((s) => (
          <Specimen key={s.name} name={s.name} note={s.note}>
            <Frame width={s.width} height={s.height}><Home /></Frame>
          </Specimen>
        ))}
      </Section>
      <Section title="Things that rise over a screen" hint="A sheet on a phone, a card in the middle of a tablet">
        <Specimen name="A picker on a phone">
          <Frame width={412} height={560}><Picker /></Frame>
        </Specimen>
        <Specimen name="A picker on a tablet" note="560 wide at most, clear of every edge.">
          <Frame width={800} height={560}><Picker /></Frame>
        </Specimen>
        <Specimen name="A dialog on a phone">
          <Frame width={412} height={420}><Question /></Frame>
        </Specimen>
        <Specimen name="A dialog on a tablet" note="400 wide at most.">
          <Frame width={800} height={420}><Question /></Frame>
        </Specimen>
      </Section>
    </>
  );
}
