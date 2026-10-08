import { Specimen } from '@/features/gallery/components/Specimen';
import { Header, IconButton, Section, TabBar, useTheme } from '@/design';
import type { TabItem } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

type TabKey = 'home' | 'accounts' | 'add' | 'insights' | 'more';

const TABS: TabItem<TabKey>[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'accounts', label: 'Accounts', icon: 'bank' },
  { key: 'add', label: 'Add', icon: 'plus' },
  { key: 'insights', label: 'Insights', icon: 'chart-pie' },
  { key: 'more', label: 'More', icon: 'dots-three' },
];

export function NavigationSection() {
  const { colors, space } = useTheme();
  const [tab, setTab] = useState<TabKey>('home');
  const bleed = { marginHorizontal: -space.lg, backgroundColor: colors.background };
  return (
    <>
      <Section title="Header">
        <Specimen name="Home" note="A greeting between icon actions.">
          <View style={bleed}>
            <Header
              title="Hi John"
              left={<IconButton icon="search" accessibilityLabel="Search" />}
              right={<><IconButton icon="bell" accessibilityLabel="Reminders" /><IconButton icon="user-circle" accessibilityLabel="Profile" /></>}
            />
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
        <Specimen name="Tab bar" note="Five places at most. A green mark and bold label show where you are.">
          <View style={bleed}>
            <TabBar items={TABS} activeKey={tab} onSelect={setTab} />
          </View>
        </Specimen>
      </Section>
    </>
  );
}
