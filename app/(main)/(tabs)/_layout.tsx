import { useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { ComponentProps, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function TabsLayout() {
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const barHeight = 78 + insets.bottom;

  const renderTabBarIcon = useCallback((iconName: MCIName) => {
    const TabBarIconComponent = ({ focused }: { focused: boolean }) => {
      const solidName = (iconName.endsWith('-outline')
        ? iconName.slice(0, -8)
        : iconName) as MCIName;

      return (
        <View style={{
          width: 64,
          height: 34,
          borderRadius: radius('full'),
          backgroundColor: focused ? colors.primaryLight : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MaterialCommunityIcons
            name={focused ? solidName : iconName}
            size={22}
            color={focused ? colors.primary : colors.textMuted}
          />
        </View>
      );
    };
    TabBarIconComponent.displayName = `TabBarIcon(${iconName})`;
    return TabBarIconComponent;
  }, [colors.primary, colors.primaryLight, colors.textMuted, radius]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.medium,
          fontSize: 12,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: barHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: renderTabBarIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarLabel: 'Accounts',
          tabBarIcon: renderTabBarIcon('wallet-outline'),
        }}
      />
      <Tabs.Screen
        name="persons"
        options={{
          title: 'Persons',
          tabBarLabel: 'Persons',
          tabBarIcon: renderTabBarIcon('account-group-outline'),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: renderTabBarIcon('chart-bar'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: renderTabBarIcon('cog-outline'),
        }}
      />
    </Tabs>
  );
}
