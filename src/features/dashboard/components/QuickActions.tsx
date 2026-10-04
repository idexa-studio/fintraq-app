import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import type { IconSource } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Action = { key: string; label: string; icon: IconSource; href: Href };

type Props = {
  /** Transfers need two accounts; the button is hidden until there are. */
  canTransfer: boolean;
};

/**
 * One-tap entry points for the most common writes, each opening its form already set up. Drawn as
 * compact ink discs with the label beneath, like a phone's dock — the balance stays the hero.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = useMemo((): Action[] => {
    const all: (Action | null)[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), icon: 'arrow-up-right', href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), icon: 'arrow-down-left', href: '/transactions/create?type=CR' },
      canTransfer ? { key: 'transfer', label: t('dashboard.quickTransfer'), icon: 'arrows-left-right', href: '/transactions/create?type=TR' } : null,
      { key: 'loan', label: t('dashboard.quickLoan'), icon: 'hand-coins', href: '/(main)/loans/form' },
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
          <View style={styles.disc}>
            <Icon name={action.icon} size={20} color={hero.onInk} weight="bold" />
          </View>
          <Text variant="label" color={hero.textPrimary} numberOfLines={1}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const DISC = 48;

const createStyles = ({ heroCard: hero, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing('1') },
    action: { flex: 1, maxWidth: 88, alignItems: 'center', gap: spacing('1.5') },
    disc: {
      width: DISC,
      height: DISC,
      borderRadius: radius('full'),
      backgroundColor: hero.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
