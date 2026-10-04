import { BentoPressable } from '@/src/components/ui/BentoPressable';
import type { IconSource } from '@/src/components/ui/Icon';
import { Icon } from '@/src/components/ui/Icon';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab indices matching _layout.tsx order: 0=index, 1=accounts, 2=analytics, 3=settings
const TAB_ICONS: IconSource[] = ['home', 'wallet-stack', 'bar-chart', 'settings'];
const LEFT_INDICES = [0, 1];
const RIGHT_INDICES = [2, 3];

/** 48pt tiles inside 6pt island padding → islands and the add button are both 60 tall. */
const TILE = 48;
const PAD = 6;
const HEIGHT = TILE + PAD * 2;

type TabButtonProps = {
  icon: IconSource;
  label: string;
  focused: boolean;
  onPress: () => void;
};

const TabButton = React.memo(function TabButton({ icon, label, focused, onPress }: TabButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;

  return (
    <BentoPressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      style={[styles.tab, focused && { backgroundColor: colors.primary }]}
    >
      <Icon name={icon} size={22} color={focused ? colors.primaryForeground : colors.onInkMuted} weight={focused ? 'bold' : 'regular'} />
    </BentoPressable>
  );
});

export const SplitIslandTabBar = React.memo(function SplitIslandTabBar({
  state,
  navigation,
  descriptors,
}: BottomTabBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

  const handleTabPress = useCallback(
    (index: number) => {
      const route = state.routes[index];
      const isFocused = state.index === index;
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        Haptics.selectionAsync();
        navigation.navigate(route.name, route.params);
      }
    },
    [state, navigation],
  );

  // Always an "add" affordance; only the destination follows the tab
  // (Accounts → new account, everywhere else → new transaction).
  const onAccounts = state.index === 1;
  const handleFab = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(onAccounts ? '/(main)/accounts/form' : '/transactions/create');
  }, [router, onAccounts]);

  const renderIsland = (indices: number[]) => (
    <View style={styles.pill} accessibilityRole="tablist">
      {indices.map((tabIdx) => {
        const route = state.routes[tabIdx];
        if (!route) return null;
        return (
          <TabButton
            key={route.key}
            icon={TAB_ICONS[tabIdx]!}
            label={descriptors[route.key]?.options.title ?? route.name}
            focused={state.index === tabIdx}
            onPress={() => handleTabPress(tabIdx)}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Left pill: Home + Accounts */}
      <View style={styles.leftWrap}>{renderIsland(LEFT_INDICES)}</View>

      {/* Centre add — context-aware */}
      <View style={styles.fabWrap}>
        <BentoPressable
          style={styles.fab}
          onPress={handleFab}
          accessibilityRole="button"
          accessibilityLabel={onAccounts ? t('common.addAccount') : t('dashboard.addTransaction')}
        >
          <Icon name="plus" size={26} color={theme.colors.primaryForeground} weight="bold" />
        </BentoPressable>
      </View>

      {/* Right pill: Analytics + Settings */}
      <View style={styles.rightWrap}>{renderIsland(RIGHT_INDICES)}</View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType, bottomInset = 0) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: bottomInset > 0 ? bottomInset + spacing('2') : spacing('4'),
      left: layout.screenPadding,
      right: layout.screenPadding,
      flexDirection: 'row',
      // Islands and the add button share one height and one centre line.
      alignItems: 'center',
      gap: spacing('3'),
    },
    leftWrap: { flex: 1, alignItems: 'flex-start' },
    rightWrap: { flex: 1, alignItems: 'flex-end' },
    pill: {
      height: HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tabBarBackground,
      borderRadius: radius('xl'),
      padding: PAD,
      gap: spacing('1'),
    },
    tab: {
      width: TILE,
      height: TILE,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius('lg'),
    },
    fabWrap: { width: HEIGHT, height: HEIGHT },
    fab: {
      width: HEIGHT,
      height: HEIGHT,
      borderRadius: radius('xl'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
