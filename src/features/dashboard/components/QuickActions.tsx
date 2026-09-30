import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, IconAvatar, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ArrowDownLeftIcon, ArrowsLeftRightIcon, ArrowUpRightIcon, HandCoinsIcon } from '@/src/components/ui/icons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Action = { key: string; label: string; icon: IconSource; color: string; href: Href };

type Props = {
  /** Transfers need two accounts; the tile is hidden until there are. */
  canTransfer: boolean;
};

/** One-tap entry points for the most common writes, each opening its form already set up. */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = useMemo((): Action[] => {
    const all: (Action | null)[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), icon: ArrowUpRightIcon, color: colors.danger, href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), icon: ArrowDownLeftIcon, color: colors.success, href: '/transactions/create?type=CR' },
      canTransfer
        ? { key: 'transfer', label: t('dashboard.quickTransfer'), icon: ArrowsLeftRightIcon, color: colors.info, href: '/transactions/create?type=TR' }
        : null,
      { key: 'loan', label: t('dashboard.quickLoan'), icon: HandCoinsIcon, color: colors.warning, href: '/(main)/loans/form' },
    ];
    return all.filter((a): a is Action => a !== null);
  }, [t, colors, canTransfer]);

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel={t('dashboard.quickActions')}>
      {actions.map((action) => (
        <BentoPressable
          key={action.key}
          style={styles.tile}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push(action.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <IconAvatar icon={action.icon} color={action.color} size={36} iconSize={17} weight="bold" />
          <Text variant="label" numberOfLines={1}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginHorizontal: layout.screenPadding,
    },
    tile: {
      flex: 1,
      alignItems: 'center',
      gap: spacing('2'),
      paddingVertical: spacing('3'),
      paddingHorizontal: spacing('1'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
  });
