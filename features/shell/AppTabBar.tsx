import { TabBar } from '@/design';
import type { IconName, TabItem } from '@/design';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The four places, in order. Their keys are the route names under `app/(main)/(tabs)`. */
const PLACES = ['index', 'activity', 'plan', 'insights'] as const;
type Place = (typeof PLACES)[number];
type TabKey = Place | 'add';

const ICONS: Record<TabKey, IconName> = { index: 'house', activity: 'receipt', add: 'plus', plan: 'calendar', insights: 'chart-pie' };
const LABELS = { index: 'tabs.home', activity: 'tabs.activity', add: 'tabs.add', plan: 'tabs.plan', insights: 'tabs.insights' } as const;

/**
 * The app's tab bar: four places with Add in the middle. Add is not a place:
 * it opens the entry task over whichever tab is showing.
 */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation('shell');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const keys: TabKey[] = [PLACES[0], PLACES[1], 'add', PLACES[2], PLACES[3]];
  const items: TabItem<TabKey>[] = keys.map((key) => ({ key, label: t(LABELS[key]), icon: ICONS[key] }));
  const active = state.routes[state.index]?.name as Place;

  const select = (key: TabKey) => {
    if (key === 'add') {
      router.push('/add');
      return;
    }
    const route = state.routes.find((r) => r.name === key);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (key !== active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return <TabBar items={items} activeKey={active} onSelect={select} bottomInset={insets.bottom} />;
}
