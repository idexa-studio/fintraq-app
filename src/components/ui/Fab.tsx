import { BentoPressable } from './BentoPressable';
import { Icon, IconSource } from './Icon';
import { PlusIcon } from './icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FabProps = {
  onPress: () => void;
  /** Required — the FAB is icon-only. */
  accessibilityLabel: string;
  icon?: IconSource;
  /** Tab screens: sit above the floating tab bar instead of the screen edge. */
  aboveTabBar?: boolean;
};

/** The one primary "create" action on list screens. Bottom-right, lime, flat. */
export const Fab = React.memo(function Fab({ onPress, accessibilityLabel, icon = PlusIcon, aboveTabBar = false }: FabProps) {
  const { colors, radius, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + spacing('4') + (aboveTabBar ? layout.tabBarHeight + layout.tabBarGap : 0);

  return (
    <BentoPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        position: 'absolute',
        right: layout.screenPadding,
        bottom,
        width: 56,
        height: 56,
        borderRadius: radius('full'),
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon icon={icon} size={24} color={colors.primaryForeground} weight="bold" />
    </BentoPressable>
  );
});
