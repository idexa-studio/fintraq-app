import { AppTabBar } from '@/features/shell';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

/**
 * Changing tab slides the new page in on Android. On iOS it changes at once, as iOS's own tab
 * bars do, and for a second reason: there the slide leaves a page invisible when it is first
 * opened after a task sheet has been shown and closed (seen on iOS 27 with React Native 0.86).
 * The page's fade is run by the native animation driver and never finishes.
 */
const TAB_CHANGE = Platform.OS === 'ios' ? 'none' : 'shift';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false, animation: TAB_CHANGE }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="insights" />
    </Tabs>
  );
}
