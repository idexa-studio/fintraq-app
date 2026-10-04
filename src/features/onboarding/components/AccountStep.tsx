import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HeroSurface, Icon, Input, MoneyText, Text } from '@/src/components/ui';
import { AmountField } from '@/src/features/onboarding/components/AmountField';
import { ChoiceTile } from '@/src/features/onboarding/components/ChoiceTile';
import { ONBOARDING_ACCOUNT_TYPES } from '@/src/features/onboarding/constants';
import type { OnboardingAccountDraft } from '@/src/features/onboarding/types';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { parseAmountInput } from '@/src/utils/amount';
import { resolveAccountTypeIcon } from '@/src/utils/icons';

type Props = {
  draft: OnboardingAccountDraft;
  onChange: (next: OnboardingAccountDraft) => void;
  currency: string;
  /** Shown under the name field once the user tried to continue without one. */
  nameError?: string;
  balanceError?: string;
};

const TYPE_LABEL = { cash: 'cash', bank: 'bank', ewallet: 'ewallet', credit_card: 'creditCard' } as const;

/**
 * The first account, built live: pick where the money lives, name it, say what's in it. The card
 * on top is Home's balance hero, so the user sees exactly where this lands.
 */
export const AccountStep = React.memo(function AccountStep({ draft, onChange, currency, nameError, balanceError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const typeLabel = (type: OnboardingAccountDraft['type']) => t(`accounts.${TYPE_LABEL[type]}`);
  const balance = parseAmountInput(draft.balance) ?? 0;
  const pick = (type: OnboardingAccountDraft['type']) =>
    // Until the user names it, the name follows the type ("Cash", "Bank account"…).
    onChange({ ...draft, type, name: draft.nameEdited ? draft.name : typeLabel(type) });

  return (
    <View style={styles.root}>
      <HeroSurface>
        <View style={styles.previewTop}>
          <View style={styles.disc}>
            <Icon name={resolveAccountTypeIcon(draft.type)} size={18} color={hero.onInk} weight="bold" />
          </View>
          <View style={styles.previewName}>
            <Text variant="bodyStrong" color={hero.textPrimary} numberOfLines={1}>
              {draft.name.trim() || typeLabel(draft.type)}
            </Text>
            <Text variant="caption" color={hero.textMuted} numberOfLines={1}>
              {`${typeLabel(draft.type)} · ${currency}`}
            </Text>
          </View>
        </View>
        <View style={styles.previewBalance}>
          <Text variant="caption" color={hero.textMuted}>
            {t('dashboard.balance')}
          </Text>
          <MoneyText amount={balance} currency={currency} weight="bold" style={styles.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} />
        </View>
      </HeroSurface>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {[ONBOARDING_ACCOUNT_TYPES.slice(0, 2), ONBOARDING_ACCOUNT_TYPES.slice(2)].map((row, i) => (
          <View key={i} style={styles.gridRow}>
            {row.map((type) => (
              <ChoiceTile
                key={type}
                icon={resolveAccountTypeIcon(type)}
                title={typeLabel(type)}
                hint={t(`onboardingFlow.typeHints.${type}`)}
                selected={draft.type === type}
                onPress={() => pick(type)}
              />
            ))}
          </View>
        ))}
      </View>

      <Input
        label={t('accountForm.accountName')}
        placeholder={t('accountForm.namePlaceholder')}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name, nameEdited: true })}
        error={nameError}
        variant="filled"
        autoCapitalize="words"
        maxLength={50}
      />

      <AmountField
        label={t('accountForm.currentBalance')}
        value={draft.balance}
        onChangeText={(value) => onChange({ ...draft, balance: value })}
        currency={currency}
        error={balanceError}
        helperText={t('onboardingFlow.balanceHint')}
      />
    </View>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('5') },
    previewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    disc: { width: 40, height: 40, borderRadius: radius('full'), backgroundColor: hero.ink, alignItems: 'center', justifyContent: 'center' },
    previewName: { flex: 1, gap: 2 },
    previewBalance: { gap: spacing('0.5') },
    balance: { ...typography.metrics.display, color: hero.textPrimary },
    grid: { gap: spacing('2.5') },
    gridRow: { flexDirection: 'row', gap: spacing('2.5') },
  });
