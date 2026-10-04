import type { IconSource } from '@/src/components/ui';
import { BentoPressable, Icon, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Action = { key: string; label: string; icon: IconSource; color: string; href: Href };

type Props = {
  /** Transfers need two accounts; the button is hidden until there are. */
  canTransfer: boolean;
};

/**
 * One-tap entry points for the most common writes, each opening its form already set up. Rendered
 * inside the white card the hero sits on (see DashboardScreen), so hero and actions read as one block.
 * Compact pills, like the app's chips: the icon carries the colour its type has everywhere else.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = useMemo((): Action[] => {
    const all: (Action | null)[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), icon: 'arrow-up-right', color: colors.danger, href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), icon: 'arrow-down-left', color: colors.success, href: '/transactions/create?type=CR' },
      canTransfer ? { key: 'transfer', label: t('dashboard.quickTransfer'), icon: 'arrows-left-right', color: colors.info, href: '/transactions/create?type=TR' } : null,
      { key: 'loan', label: t('dashboard.quickLoan'), icon: 'hand-coins', color: colors.warning, href: '/(main)/loans/form' },
    ];
    return all.filter((a): a is Action => a !== null);
  }, [t, canTransfer, colors]);

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel={t('dashboard.quickActions')}>
      {actions.map((action, index) => (
        <BentoPressable
          key={action.key}
          style={
            [styles.action, 
              index == 0 && styles.actionFirst,
              index == actions.length - 1 && styles.actionLast
            ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push(action.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Icon name={action.icon} size={15} color={action.color} weight="bold" />
          <Text variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={styles.label}>
            {action.label}
          </Text>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, sizes }: ThemeContextType) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing('1'), padding: spacing('2.5') },
    action: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('1'),
      height: sizes.button.sm.height,
      paddingHorizontal: spacing('1.5'),
      borderRadius: radius('sm'),
      // The page's paper tone: lighter than the inset `card` grey, still distinct on the white strip.
      backgroundColor: colors.background,
    },
    actionFirst: {
      borderTopLeftRadius: radius('lg'),
      borderBottomLeftRadius: radius('lg'),
    },
    actionLast: {
      borderTopRightRadius: radius('lg'),
      borderBottomRightRadius: radius('lg'),
    },
    // Lets a long label shrink inside its pill instead of pushing the icon out.
    label: { flexShrink: 1 },
  });
