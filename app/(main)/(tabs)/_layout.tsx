import { useTheme } from '@/src/providers/ThemeProvider';
import {
  BarChartIcon,
  Building01Icon,
  Home01Icon,
  Settings01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colors, spacing, radius, layout } = useTheme();
  const insets = useSafeAreaInsets();

  const floatingBottom = insets.bottom > 0 ? insets.bottom + spacing('2') : spacing('4');
  const barHeight = 70;

  const renderTabBarIcon = useCallback((IconComponent: typeof Home01Icon) => {
    const TabBarIconComponent = ({ focused }: { focused: boolean }) => {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', }}>
          <View style={{
            width: 50,
            height: 40,
            borderRadius: radius('full'), // Squircle / rounded box
            backgroundColor: focused ? `${colors.primary}` : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HugeiconsIcon
              icon={IconComponent}
              size={22}
              color={focused ? "#111" : colors.textMuted}
            />
          </View>
        </View>
      );
    };
    TabBarIconComponent.displayName = `TabBarIcon`;
    return TabBarIconComponent;
  }, [colors.primary, colors.textMuted, radius]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { height: 0, fontSize: 0, },
        tabBarIconStyle: {
          height: barHeight - 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: floatingBottom,
          left: 0,
          right: 0,
          marginHorizontal: layout.screenPadding,
          backgroundColor: colors.tabBarBackground,
          borderRadius: radius('full'),
          height: barHeight,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 0
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: renderTabBarIcon(Home01Icon),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: renderTabBarIcon(Building01Icon),
        }}
      />
      <Tabs.Screen
        name="persons"
        options={{
          title: 'Persons',
          tabBarIcon: renderTabBarIcon(UserGroupIcon),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: renderTabBarIcon(BarChartIcon),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: renderTabBarIcon(Settings01Icon),
        }}
      />
    </Tabs>
  );
}
