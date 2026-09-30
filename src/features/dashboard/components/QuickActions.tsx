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

const BUTTON = 48;

/**
 * One-tap entry points for the most common writes, each opening its form already set up. Drawn for
 * the hero card: ink-filled circles on the brand fill, so they read as the card's own controls.
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
      {actions.map((action) => (
        <BentoPressable
          key={action.key}
          style={styles.action}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push(action.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View style={styles.circle}>
            <Icon icon={action.icon} size={20} color={heroCard.background} weight="bold" />
          </View>
          <Text variant="label" color={heroCard.textPrimary} numberOfLines={1}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ spacing, radius }: ThemeContextType, heroCard: HeroCardPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: spacing('4'),
      marginTop: spacing('1'),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: heroCard.separator,
    },
    action: { flex: 1, alignItems: 'center', gap: spacing('1.5') },
    circle: {
      width: BUTTON,
      height: BUTTON,
      borderRadius: radius('full'),
      backgroundColor: heroCard.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
