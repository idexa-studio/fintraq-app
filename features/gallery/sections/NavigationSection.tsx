import { Specimen } from '@/features/gallery/components/Specimen';
import { Header, IconButton, IconCircle, Section, TabBar, useTheme } from '@/design';
import type { TabItem } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

type TabKey = 'home' | 'accounts' | 'add' | 'insights' | 'more';

const TABS: TabItem<TabKey>[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'accounts', label: 'Activity', icon: 'receipt' },
  { key: 'add', label: 'Add', icon: 'plus', action: true },
  { key: 'insights', label: 'Plan', icon: 'calendar' },
  { key: 'more', label: 'Insights', icon: 'chart-pie' },
];

export function NavigationSection() {
  const { colors, space } = useTheme();
  const [tab, setTab] = useState<TabKey>('home');
  const bleed = { marginHorizontal: -space.lg, backgroundColor: colors.background };
  return (
    <>
      <Section title="Header">
        <Specimen name="Home" note="The top of a tab: the title large at the start of the line. Home greets by the time of day under the date; the user's own mark opens Settings.">
          <View style={bleed}>
            <Header
              large
              eyebrow="Thursday, October 8"
              title="Good afternoon, John"
              right={<><IconButton icon="search" accessibilityLabel="Search" /><IconCircle initials="J" color="green" /></>}
            />
          </View>
        </Specimen>
        <Specimen name="Another tab" note="The same large title, with the tab's own actions at the end.">
          <View style={bleed}>
            <Header large title="Activity" right={<><IconButton icon="filter" accessibilityLabel="Filter" /><IconButton icon="search" accessibilityLabel="Search" /></>} />
          </View>
        </Specimen>
        <Specimen name="Pushed screen" note="Back on the left, the screen’s name in the middle.">
          <View style={bleed}>
            <Header title="Categories" onBack={() => {}} right={<IconButton icon="plus" accessibilityLabel="Add category" />} />
          </View>
        </Specimen>
        <Specimen name="Task" note="Sheets and step flows: bold title, close on the right, hairline below.">
          <View style={bleed}>
            <Header task title="Add expense" onClose={() => {}} />
          </View>
        </Specimen>
      </Section>

      <Section title="Tab bar">
        <Specimen name="Tab bar" note="Four places and, in the middle, the one action: a green tile that adds. The mark slides to the tab you choose.">
          <View style={bleed}>
            <TabBar items={TABS} activeKey={tab} onSelect={(key) => { if (key !== 'add') setTab(key); }} />
          </View>
        </Specimen>
      </Section>
    </>
  );
}
