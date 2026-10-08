import { Text } from '@/src/components/ui/Text';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/shared/format/color';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import type { AccountType } from '@/shared/types';
import { Badge } from '@/src/components/ui/Badge';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { Account } from '@/data/repositories/accounts';
import { useTranslation } from 'react-i18next';

type Props = {
  accounts: Account[];
  onPressAccount: (id: number) => void;
  onPressAdd: () => void;
};

const ADD_TILE_WIDTH = 112;

export const AccountsCarousel = React.memo(function AccountsCarousel({ accounts, onPressAccount, onPressAdd }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  // ~1.6 cards on screen: enough peek to signal the row scrolls.
  const cardWidth = Math.round(screenWidth * 0.62);
  const gap = spacing('2.5');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
      snapToInterval={cardWidth + gap}
      snapToAlignment="start"
    >
      {accounts.map(acc => {
        const c = colorNumberToHex(acc.color);
        const masked = acc.accountNumber && acc.accountNumber !== 'N/A' ? `•••• ${acc.accountNumber.slice(-4)}` : null;

        return (
          <BentoPressable
            key={acc.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onPressAccount(acc.id)}
            accessibilityRole="button"
            accessibilityLabel={acc.name}
          >
            <View style={styles.topRow}>
              <IconAvatar
                icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)}
                color={c}
                size={36}
              />
              <View style={styles.meta}>
                <Text variant="calloutStrong" numberOfLines={1}>{acc.name}</Text>
                {masked ? <Text variant="caption" tone="muted" numberOfLines={1}>{masked}</Text> : null}
              </View>
              <Badge label={acc.currency} variant="muted" style={styles.badge} />
            </View>

            <View style={styles.balanceBlock}>
              <Text variant="caption" tone="muted">{t('common.availableBalance')}</Text>
              <MoneyText
                amount={acc.balance}
                currency={acc.currency}
                style={styles.balance}
                weight="bold"
                maxChars={13}
              />
            </View>
          </BentoPressable>
        );
      })}

      <BentoPressable
        style={[styles.addCard, { width: ADD_TILE_WIDTH }]}
        onPress={onPressAdd}
        accessibilityRole="button"
        accessibilityLabel={t('common.addAccount')}
      >
        <IconAvatar icon="plus" color={colors.primaryInk} size={36} />
        <Text variant="label" align="center">{t('common.addAccount')}</Text>
      </BentoPressable>
    </ScrollView>
  );
});

const CARD_HEIGHT = 124;

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    scrollContent: { paddingHorizontal: layout.screenPadding, gap: spacing('2.5') },
    card: {
      height: CARD_HEIGHT,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('4'),
      justifyContent: 'space-between',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    meta: { flex: 1, gap: spacing('0.5') },
    badge: { alignSelf: 'center' },
    balanceBlock: { gap: spacing('0.5') },
    balance: { ...typography.metrics.xl },
    addCard: {
      height: CARD_HEIGHT,
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      padding: spacing('4'),
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('2'),
    },
  });
