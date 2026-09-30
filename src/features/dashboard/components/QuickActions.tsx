import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ArrowDownLeftIcon, ArrowsLeftRightIcon, ArrowUpRightIcon, HandCoinsIcon } from '@/src/components/ui/icons';
import { HeroCardPalette, ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Action = { key: string; label: string; icon: IconSource; href: Href };

type Props = {
  /** Transfers need two accounts; the button is hidden until there are. */
  canTransfer: boolean;
};

/**
 * One-tap entry points for the most common writes, each opening its form already set up. Drawn as
 * a dark dock inside the hero card, echoing the tab bar's dark islands, so it reads as one control.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { heroCard } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme, heroCard), [theme, heroCard]);

  const actions = useMemo((): Action[] => {
    const all: (Action | null)[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), icon: ArrowUpRightIcon, href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), icon: ArrowDownLeftIcon, href: '/transactions/create?type=CR' },
      canTransfer ? { key: 'transfer', label: t('dashboard.quickTransfer'), icon: ArrowsLeftRightIcon, href: '/transactions/create?type=TR' } : null,
      { key: 'loan', label: t('dashboard.quickLoan'), icon: HandCoinsIcon, href: '/(main)/loans/form' },
    ];
    return all.filter((a): a is Action => a !== null);
  }, [t, canTransfer]);

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel={t('dashboard.quickActions')}>
      {actions.map((action, index) => (
        <BentoPressable
          key={action.key}
          style={[styles.action, index > 0 && styles.divided]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push(action.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Icon icon={action.icon} size={20} color={heroCard.background} weight="bold" />
          <Text variant="label" color={heroCard.background} numberOfLines={1}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ spacing, radius, alpha }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginTop: spacing('1'),
      paddingVertical: spacing('3'),
      borderRadius: radius('xl'),
      backgroundColor: heroCard.textPrimary,
    },
    action: { flex: 1, alignItems: 'center', gap: spacing('1.5'), paddingHorizontal: spacing('1') },
    divided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: alpha(heroCard.background, 'medium') },
  });
