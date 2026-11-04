import { useLayout } from '@/design';
import { AppTabBar } from '@/features/shell';
import { Tabs } from 'expo-router';
import React from 'react';

/**
 * Changing tab shows the new page at once, on both platforms, as the phones' own tab bars do.
 * A tab-change animation (bottom-tabs' "shift" or "fade") starts the new page invisible and has
 * React Native's native animation driver bring it in. After a task sheet has been shown and
 * closed, that animation can fail to run, and the page stays invisible until another tab is
 * chosen and this one again: seen on iOS 27, and on Android (Samsung S25, 2.1.0 release build) when a tab was
 * chosen just after saving an expense. bottom-tabs always uses the native driver, so no
 * animation is safe here.
 */
const TAB_CHANGE = 'none';

export default function TabsLayout() {
  // A screen wide enough for it carries the tabs as a rail at the side.
  const { isExpanded } = useLayout();
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false, animation: TAB_CHANGE, tabBarPosition: isExpanded ? 'left' : 'bottom' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="insights" />
    </Tabs>
  );
}
