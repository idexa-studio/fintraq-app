import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, IconAvatar, Input, MoneyText, SegmentedControl, Text } from '@/src/components/ui';
import { DEFAULT_CATEGORIES } from '@/src/constants/defaultCategories';
import { AmountField } from '@/src/features/onboarding/components/AmountField';
import { FIRST_ENTRY_CATEGORIES } from '@/src/features/onboarding/constants';
import type { OnboardingEntryDraft } from '@/src/features/onboarding/types';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { parseAmountInput } from '@/src/utils/amount';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type Props = {
  draft: OnboardingEntryDraft;
  onChange: (next: OnboardingEntryDraft) => void;
  currency: string;
  accountName: string;
  /** The first account's opening balance, so the preview can show where it lands. */
  openingBalance: number;
  amountError?: string;
};

const categoryOf = (name: string) => DEFAULT_CATEGORIES.find((c) => c.name === name);

/**
 * The first entry, in the transaction form's order: type, the amount as the headline figure, a
 * one-tap category, a note. Under the amount, the entry as it will be listed and what the account
 * holds afterwards — the app's loop in one card.
 */
export const FirstEntryStep = React.memo(function FirstEntryStep({ draft, onChange, currency, accountName, openingBalance, amountError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const amount = parseAmountInput(draft.amount) ?? 0;
  const category = categoryOf(draft.category);
  const after = openingBalance + (draft.type === 'CR' ? amount : -amount);

  return (
    <View style={styles.root}>
      <SegmentedControl
        options={[
          { value: 'DR' as const, label: t('transactions.expense'), icon: 'arrow-up-right' as const },
          { value: 'CR' as const, label: t('transactions.income'), icon: 'arrow-down-left' as const },
        ]}
        value={draft.type}
        // Switching type also switches to that type's first suggestion.
        onChange={(type) => onChange({ ...draft, type, category: FIRST_ENTRY_CATEGORIES[type][0] })}
      />

      <Card style={styles.card}>
        <AmountField
          label={t('transactions.amount')}
          value={draft.amount}
          onChangeText={(value) => onChange({ ...draft, amount: value })}
          currency={currency}
          error={amountError}
        />
        <Divider />
        <View style={styles.row}>
          <IconAvatar icon={resolveIcon(category?.icon, 'tag')} color={category ? colorNumberToHex(category.color) : theme.colors.text} size={40} />
          <View style={styles.rowMeta}>
            <Text variant="bodyStrong" numberOfLines={1}>{draft.note.trim() || draft.category}</Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>{t('onboardingFlow.balanceAfter', { account: accountName })}</Text>
          </View>
          <View style={styles.rowFigures}>
            <MoneyText amount={amount} currency={currency} type={draft.type} weight="semibold" style={styles.rowAmount} />
            <MoneyText amount={after} currency={currency} weight="medium" style={styles.rowAfter} />
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="label" tone="muted">{t('transactions.category')}</Text>
        <View style={styles.chips}>
          {FIRST_ENTRY_CATEGORIES[draft.type].map((name) => {
            const c = categoryOf(name);
            return (
              <Chip
                key={name}
                label={name}
                icon={resolveIcon(c?.icon, 'tag')}
                isActive={draft.category === name}
                onPress={() => onChange({ ...draft, category: name })}
              />
            );
          })}
        </View>
      </View>

      <Input
        label={t('onboardingFlow.entryNote')}
        placeholder={t('onboardingFlow.entryNotePlaceholder')}
        value={draft.note}
        onChangeText={(note) => onChange({ ...draft, note })}
        variant="filled"
        maxLength={80}
      />
    </View>
  );
});

const createStyles = ({ colors, spacing, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('5') },
    card: { gap: spacing('4') },
    section: { gap: spacing('2') },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    rowMeta: { flex: 1, gap: 2 },
    rowFigures: { alignItems: 'flex-end', gap: 2 },
    rowAmount: { ...typography.metrics.md },
    rowAfter: { ...typography.metrics.xs, color: colors.textMuted },
  });
