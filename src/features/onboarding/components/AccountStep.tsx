import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { IconAvatar, Input, ListGroup, ListItem } from '@/src/components/ui';
import { getCurrencySymbol } from '@/src/constants/currency';
import { ONBOARDING_ACCOUNT_TYPES } from '@/src/features/onboarding/constants';
import type { OnboardingAccountDraft } from '@/src/features/onboarding/types';
import { useTheme } from '@/src/providers/ThemeProvider';
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

/** The first account: where the money lives (a single-choice list, like the currency row), its name and what's in it. */
export const AccountStep = React.memo(function AccountStep({ draft, onChange, currency, nameError, balanceError }: Props) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const typeLabel = (type: OnboardingAccountDraft['type']) => t(`accounts.${TYPE_LABEL[type]}`);

  return (
    <View style={{ gap: spacing('6') }}>
      <ListGroup title={t('accountForm.accountType')}>
        {ONBOARDING_ACCOUNT_TYPES.map((type) => (
          <ListItem
            key={type}
            leading={<IconAvatar icon={resolveAccountTypeIcon(type)} color={colors.primaryInk} size={36} />}
            title={typeLabel(type)}
            subtitle={t(`onboardingFlow.typeHints.${type}`)}
            selected={draft.type === type}
            // Until the user names it, the name follows the type ("Cash", "Bank account"…).
            onPress={() => onChange({ ...draft, type, name: draft.nameEdited ? draft.name : typeLabel(type) })}
          />
        ))}
      </ListGroup>

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
