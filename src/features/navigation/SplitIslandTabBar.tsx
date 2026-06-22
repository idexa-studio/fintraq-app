import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import {
  BarChartIcon,
  Home01Icon,
  PlusSignIcon,
  Settings01Icon,
  Wallet05Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab indices matching _layout.tsx order: 0=index, 1=accounts, 2=analytics, 3=settings
const TAB_ICONS: IconSvgElement[] = [Home01Icon, Wallet05Icon, BarChartIcon, Settings01Icon];
const LEFT_INDICES = [0, 1];
const RIGHT_INDICES = [2, 3];

type TabButtonProps = {
  icon: IconSvgElement;
  focused: boolean;
  onPress: () => void;
};

const TabButton = React.memo(function TabButton({ icon, focused, onPress }: TabButtonProps) {
  const { colors, radius } = useTheme();
  return (
    <BentoPressable
      onPress={onPress}
      style={[
        tabBtnBase,
        {
          borderRadius: radius('lg'),
          backgroundColor: focused ? colors.primary : 'transparent',
        },
      ]}
    >
      <HugeiconsIcon
        icon={icon}
        size={22}
        color={focused ? colors.primaryForeground : colors.textMuted}
      />
    </BentoPressable>
  );
});

const tabBtnBase = { width: 48, height: 48, alignItems: 'center' as const, justifyContent: 'center' as const };

export const SplitIslandTabBar = React.memo(function SplitIslandTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleTabPress = useCallback(
    (index: number) => {
      const route = state.routes[index];
      const isFocused = state.index === index;
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [state, navigation],
  );

  const handleFab = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (state.index === 1) {
      // Accounts tab → add account
      router.push('/(main)/accounts/form');
    } else {
      router.push('/transactions/create');
    }
  }, [router, state.index]);

  const fabIcon = state.index === 1 ? Wallet05Icon : PlusSignIcon;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Left pill: Home + Accounts */}
      <View style={styles.leftWrap}>
        <View style={styles.pill}>
          {LEFT_INDICES.map((tabIdx) => (
            <TabButton
              key={tabIdx}
              icon={TAB_ICONS[tabIdx]!}
              focused={state.index === tabIdx}
              onPress={() => handleTabPress(tabIdx)}
            />
          ))}
        </View>
      </View>

      {/* Center FAB — context-aware */}
      <View style={styles.fabWrap}>
        <BentoPressable style={styles.fab} onPress={handleFab}>
          <HugeiconsIcon icon={fabIcon} size={26} color={theme.colors.primaryForeground} />
        </BentoPressable>
      </View>

      {/* Right pill: Analytics + Settings */}
      <View style={styles.rightWrap}>
        <View style={styles.pill}>
          {RIGHT_INDICES.map((tabIdx) => (
            <TabButton
              key={tabIdx}
              icon={TAB_ICONS[tabIdx]!}
              focused={state.index === tabIdx}
              onPress={() => handleTabPress(tabIdx)}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

const createStyles = (
  { colors, spacing, radius, shadow, layout }: ThemeContextType,
  insets: { bottom: number },
) => {
  const bottom = insets.bottom > 0 ? insets.bottom + spacing('2') : spacing('4');
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom,
      left: layout.screenPadding,
      right: layout.screenPadding,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    leftWrap: {
      flex: 1,
      alignItems: 'flex-start',
    },
    rightWrap: {
      flex: 1,
      alignItems: 'flex-end',
    },
    fabWrap: {
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      marginBottom: spacing('1'),
    },
    pill: {
      flexDirection: 'row',
      backgroundColor: colors.tabBarBackground,
      borderRadius: radius('2xl'),
      padding: spacing('1.5'),
      gap: spacing('1'),
      ...shadow('md'),
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow('lg'),
    },
  });
};
