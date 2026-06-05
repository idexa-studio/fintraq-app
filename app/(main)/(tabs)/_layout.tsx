import { useTheme } from '@/src/providers/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';

export default function TabsLayout() {
  const { colors, typography } = useTheme();

  const renderTabBarIcon = useCallback((iconName: string) => {
    const TabBarIconComponent = ({ focused }: { focused: boolean }) => {
      const solidName = iconName.endsWith('-outline')
        ? iconName.slice(0, -8)
        : iconName;

      return (
        <View style={{
          width: 56,
          height: 32,
          borderRadius: 16,
          backgroundColor: focused ? colors.primary + '18' : 'transparent', // 10% opacity primary container
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MaterialCommunityIcons
            name={(focused ? solidName : iconName) as any}
            size={22}
            color={focused ? colors.primary : colors.textMuted}
          />
        </View>
      );
    };
    TabBarIconComponent.displayName = `TabBarIcon(${iconName})`;
    return TabBarIconComponent;
  }, [colors.primary, colors.textMuted]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.semibold,
          fontSize: 11,
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 92 : 76,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
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
