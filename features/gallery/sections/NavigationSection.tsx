import { Specimen } from '@/features/gallery/components/Specimen';
import { Header, IconButton, Section, TabBar, useTheme } from '@/design';
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
        <Specimen name="Home" note="As the reference: a greeting in the middle between icon actions.">
          <View style={bleed}>
            <Header title="Hi John" left={<IconButton icon="search" accessibilityLabel="Search" />} right={<IconButton icon="user-circle" accessibilityLabel="Settings" />} />
          </View>
        </Specimen>
        <Specimen name="Another tab" note="The tab's name in the middle, its actions at the end.">
          <View style={bleed}>
            <Header title="Activity" right={<><IconButton icon="filter" accessibilityLabel="Filter" /><IconButton icon="search" accessibilityLabel="Search" /></>} />
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
        <Specimen name="Tab bar" note="As the reference: every item an icon over its label, a green mark the width of the tab above the active one. Add opens the entry task and is never the active tab.">
          <View style={bleed}>
            <TabBar items={TABS} activeKey={tab} onSelect={(key) => { if (key !== 'add') setTab(key); }} />
          </View>
        </Specimen>
      </Section>
    </>
  );
}
