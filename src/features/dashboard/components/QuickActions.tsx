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
 * One-tap entry points for the most common writes, each opening its form already set up. Rendered
 * inside the white card the hero sits on (see DashboardScreen), so hero and actions read as one block.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { colors } = theme;
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
          <View style={styles.iconTile}>
            <Icon name={action.icon} size={18} color={colors.primaryInk} weight="bold" />
          </View>
          <Text variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const TILE = 44;

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      paddingTop: spacing('3.5'),
      paddingBottom: spacing('3'),
      paddingHorizontal: spacing('2'),
    },
    action: { flex: 1, alignItems: 'center', gap: spacing('2') },
    iconTile: {
      width: TILE,
      height: TILE,
      borderRadius: radius('lg'),
      backgroundColor: alpha(colors.primary, 'subtle'),
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
