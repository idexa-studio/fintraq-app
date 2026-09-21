import { SplitIslandTabBar } from '@/src/features/navigation/SplitIslandTabBar';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      tabBar={(props) => <SplitIslandTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('navigation.home') }} />
      <Tabs.Screen name="accounts" options={{ title: t('navigation.accounts') }} />
      <Tabs.Screen name="analytics" options={{ title: t('navigation.analytics') }} />
      <Tabs.Screen name="settings" options={{ title: t('navigation.settings') }} />
    </Tabs>
  );
}
