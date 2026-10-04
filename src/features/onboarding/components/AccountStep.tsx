import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Chip, HeroSurface, Icon, Input, MoneyText, Text } from '@/src/components/ui';
import { getCurrencySymbol } from '@/src/constants/currency';
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
 * The first account, built live: pick where the money lives, name it, say what's in it. The hero
 * on top is the balance card Home will open on.
 */
export const AccountStep = React.memo(function AccountStep({ draft, onChange, currency, nameError, balanceError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const typeLabel = (type: OnboardingAccountDraft['type']) => t(`accounts.${TYPE_LABEL[type]}`);
  const balance = parseAmountInput(draft.balance) ?? 0;

  return (
    <View style={styles.root}>
      <HeroSurface>
        <View style={styles.previewTop}>
          <View style={styles.previewChip}>
            <Icon name={resolveAccountTypeIcon(draft.type)} size={14} color={hero.textPrimary} weight="bold" />
            <Text variant="label" color={hero.textPrimary} numberOfLines={1}>{draft.name.trim() || typeLabel(draft.type)}</Text>
          </View>
          <Text variant="caption" color={hero.textMuted}>{currency}</Text>
        </View>
        <View style={styles.previewBalance}>
          <Text variant="caption" color={hero.textMuted}>{t('dashboard.balance')}</Text>
          <MoneyText amount={balance} currency={currency} weight="bold" style={styles.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} />
        </View>
      </HeroSurface>

      <View style={styles.section}>
        <Text variant="label" tone="muted">{t('accountForm.accountType')}</Text>
        <View style={styles.types}>
          {ONBOARDING_ACCOUNT_TYPES.map((type) => (
            <Chip
              key={type}
              label={typeLabel(type)}
              icon={resolveAccountTypeIcon(type)}
              isActive={draft.type === type}
              // Until the user names it, the name follows the type ("Cash", "Bank account"…).
              onPress={() => onChange({ ...draft, type, name: draft.nameEdited ? draft.name : typeLabel(type) })}
            />
          ))}
        </View>
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

      <Input
        label={`${t('accountForm.currentBalance')} (${getCurrencySymbol(currency)})`}
        placeholder="0"
        value={draft.balance}
        onChangeText={(value) => onChange({ ...draft, balance: value })}
        error={balanceError}
        helperText={t('onboardingFlow.balanceHint')}
        variant="filled"
        keyboardType="decimal-pad"
        maxLength={16}
      />
    </View>
  );
});

const createStyles = ({ heroCard: hero, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('5') },
    previewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing('3') },
    previewChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      flexShrink: 1,
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: hero.separator,
    },
    previewBalance: { gap: spacing('0.5') },
    balance: { ...typography.metrics.display, color: hero.textPrimary },
    section: { gap: spacing('2') },
    types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
  });
