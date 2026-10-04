import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconAvatar, Input, MoneyText, SegmentedControl, Text } from '@/src/components/ui';
import { DEFAULT_CATEGORIES } from '@/src/constants/defaultCategories';
import { AmountField } from '@/src/features/onboarding/components/AmountField';
import { ChoiceTile } from '@/src/features/onboarding/components/ChoiceTile';
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
const COLUMNS = 3;

/**
 * The first entry, done for real: type, amount, a one-tap category. The preview is the row as it
 * will appear in the list and what the account's balance becomes — the app's loop in one screen.
 */
export const FirstEntryStep = React.memo(function FirstEntryStep({ draft, onChange, currency, accountName, openingBalance, amountError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const amount = parseAmountInput(draft.amount) ?? 0;
  const category = categoryOf(draft.category);
  const after = openingBalance + (draft.type === 'CR' ? amount : -amount);

  const names = FIRST_ENTRY_CATEGORIES[draft.type];
  const rows: (typeof names[number])[][] = [];
  for (let i = 0; i < names.length; i += COLUMNS) rows.push(names.slice(i, i + COLUMNS));

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

      <AmountField
        label={t('transactions.amount')}
        value={draft.amount}
        onChangeText={(value) => onChange({ ...draft, amount: value })}
        currency={currency}
        error={amountError}
      />

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>
          {t('transactions.category')}
        </Text>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {rows.map((row, i) => (
            <View key={i} style={styles.gridRow}>
              {row.map((name) => {
                const c = categoryOf(name);
                return (
                  <ChoiceTile
                    key={name}
                    layout="stack"
                    icon={resolveIcon(c?.icon, 'tag')}
                    color={c ? colorNumberToHex(c.color) : undefined}
                    title={name}
                    selected={draft.category === name}
                    onPress={() => onChange({ ...draft, category: name })}
                  />
                );
              })}
              {/* Keep a short last row on the grid instead of stretching its tiles. */}
              {Array.from({ length: COLUMNS - row.length }, (_, k) => (
                <View key={`pad-${k}`} style={styles.pad} />
              ))}
            </View>
          ))}
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

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>
          {t('onboardingFlow.previewLabel')}
        </Text>
        <View style={styles.preview}>
          <View style={styles.row}>
            <IconAvatar icon={resolveIcon(category?.icon, 'tag')} color={category ? colorNumberToHex(category.color) : theme.colors.text} size={40} />
            <View style={styles.rowMeta}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {draft.note.trim() || draft.category}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {`${draft.category} · ${accountName}`}
              </Text>
            </View>
            <MoneyText amount={amount} currency={currency} type={draft.type} weight="semibold" style={styles.rowAmount} />
          </View>
          <View style={styles.after}>
            <Text variant="caption" tone="muted" numberOfLines={1} style={styles.afterLabel}>
              {t('onboardingFlow.balanceAfter', { account: accountName })}
            </Text>
            <MoneyText amount={after} currency={currency} weight="bold" style={styles.rowAmount} />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('5') },
    section: { gap: spacing('2.5') },
    sectionLabel: { paddingHorizontal: spacing('1') },
    grid: { gap: spacing('2') },
    gridRow: { flexDirection: 'row', gap: spacing('2') },
    pad: { flex: 1 },
    preview: { backgroundColor: colors.surface, borderRadius: radius('xl'), overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('3'), padding: spacing('4') },
    rowMeta: { flex: 1, gap: 2 },
    rowAmount: { ...typography.metrics.md },
    after: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.card,
    },
    afterLabel: { flexShrink: 1 },
  });
