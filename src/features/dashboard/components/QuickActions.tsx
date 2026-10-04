import type { IconSource } from '@/src/components/ui';
import { BentoPressable, Icon, IconAvatar, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ViewStyle } from 'react-native';

type Action = { key: string; label: string; hint: string; icon: IconSource; color: string; href: Href };

type QuickActionsProps = {
  /** Transfers need two accounts. Until there are, only Expense and Income are shown. */
  canTransfer: boolean;
};

/** The compact icon tile: small enough that the label and its hint fit beside it on a narrow phone. */
const TILE = 36;

const COLUMNS = 2;
/** The round plus badge on the corner of each icon tile. */
const ADD_MARK = 16;
const ADD_RING = 2;
const ADD_OVERHANG = 5;

/**
 * Corner radii for the card at `index`: corners on the outside of the grid take the full card
 * radius, the ones that meet another card stay tight, so the group reads as one rounded card cut
 * into pieces. Works for a single row (two cards) and for the two-by-two.
 */
function cornersFor(index: number, count: number, outer: number): ViewStyle {
  const lastRow = Math.floor((count - 1) / COLUMNS);
  const row = Math.floor(index / COLUMNS);
  const isLeft = index % COLUMNS === 0;
  const isRight = index % COLUMNS === COLUMNS - 1;
  const isTop = row === 0;
  const isBottom = row === lastRow;
  return {
    ...(isTop && isLeft ? { borderTopLeftRadius: outer } : null),
    ...(isTop && isRight ? { borderTopRightRadius: outer } : null),
    ...(isBottom && isLeft ? { borderBottomLeftRadius: outer } : null),
    ...(isBottom && isRight ? { borderBottomRightRadius: outer } : null),
  };
}

/**
 * One-tap entry points for the most common writes, each opening its form already set up. A group
 * of its own on the page, directly under the hero.
 *
 * A two-column grid of small cards: the app's own icon tile (tinted squircle, glyph in the colour
 * its type has everywhere else) with a small plus badge on its corner, the action, and a line
 * saying what it records. The badge marks the card as something to tap rather than a figure to read. Always a full
 * row of two or a full two-by-two.
 */
export const QuickActions = React.memo(function QuickActions({ canTransfer }: QuickActionsProps) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const actions = useMemo((): Action[] => {
    const core: Action[] = [
      { key: 'expense', label: t('dashboard.quickExpense'), hint: t('dashboard.quickExpenseHint'), icon: 'arrow-up-right', color: colors.danger, href: '/transactions/create?type=DR' },
      { key: 'income', label: t('dashboard.quickIncome'), hint: t('dashboard.quickIncomeHint'), icon: 'arrow-down-left', color: colors.success, href: '/transactions/create?type=CR' },
    ];
    // The second row is all or nothing: without a second account there is no Transfer, and Loan
    // alone would leave a lopsided row, so a one-account ledger shows just the two everyday actions.
    if (!canTransfer) return core;
    return [
      ...core,
      { key: 'transfer', label: t('dashboard.quickTransfer'), hint: t('dashboard.quickTransferHint'), icon: 'arrows-left-right', color: colors.info, href: '/transactions/create?type=TR' },
      { key: 'loan', label: t('dashboard.quickLoan'), hint: t('dashboard.quickLoanHint'), icon: 'hand-coins', color: colors.warning, href: '/(main)/loans/form' },
    ];
  }, [t, canTransfer, colors]);

  const outer = theme.radius('xl');

  const open = useCallback(
    (href: Href) => {
      Haptics.selectionAsync().catch(() => {});
      router.push(href);
    },
    [router],
  );

  return (
    <View style={styles.grid} accessibilityRole="toolbar" accessibilityLabel={t('dashboard.quickActions')}>
      {actions.map((action, index) => (
        <BentoPressable
          key={action.key}
          style={[styles.card, cornersFor(index, actions.length, outer)]}
          onPress={() => open(action.href)}
          accessibilityRole="button"
          accessibilityLabel={`${action.label}, ${action.hint}`}
        >
          {/* The plus rides on the tile's corner: it says "tap to add" without taking a column of
              its own, which is what made the card feel crowded. */}
          <View>
            <IconAvatar icon={action.icon} color={action.color} size={TILE} iconSize={16} weight="bold" />
            <View style={styles.add}>
              <Icon name="plus" size={9} color={colors.surface} weight="bold" />
            </View>
          </View>
          <View style={styles.text}>
            <Text variant="calloutStrong" numberOfLines={1}>{action.label}</Text>
            {/* No auto-shrink: Android scales each line differently, leaving four hints at four sizes. */}
            <Text variant="caption" tone="muted" numberOfLines={1}>{action.hint}</Text>
          </View>
        </BentoPressable>
      ))}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.elementGap, marginHorizontal: layout.screenPadding, marginTop: layout.cardGap },
    card: {
      // Two per row.
      flexBasis: '46%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      padding: spacing('3'),
      // Tight where cards meet; `cornersFor` gives the group's outer corners the card radius.
      borderRadius: radius('md'),
      // Cards on the page, like every other card on Home.
      backgroundColor: colors.surface,
    },
    text: { flex: 1 },
    add: {
      position: 'absolute',
      right: -ADD_OVERHANG,
      bottom: -ADD_OVERHANG,
      width: ADD_MARK + ADD_RING * 2,
      height: ADD_MARK + ADD_RING * 2,
      borderRadius: radius('full'),
      // Ink on the card, with a ring in the card's own colour so it reads as sitting on the tile.
      backgroundColor: colors.text,
      borderWidth: ADD_RING,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
