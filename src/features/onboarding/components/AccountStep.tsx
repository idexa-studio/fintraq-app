import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, IconAvatar, Input, Text } from '@/src/components/ui';
import { AmountField } from '@/src/features/onboarding/components/AmountField';
import { ONBOARDING_ACCOUNT_TYPES } from '@/src/features/onboarding/constants';
import type { OnboardingAccountDraft } from '@/src/features/onboarding/types';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
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
 * The first account, laid out like the account form: the account as a card with its balance as the
 * headline figure, type as chips, then its name.
 */
export const AccountStep = React.memo(function AccountStep({ draft, onChange, currency, nameError, balanceError }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const typeLabel = (type: OnboardingAccountDraft['type']) => t(`accounts.${TYPE_LABEL[type]}`);
  const name = draft.name.trim() || typeLabel(draft.type);
  const hint = t(`onboardingFlow.typeHints.${draft.type}`);

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <View style={styles.identity}>
          <IconAvatar icon={resolveAccountTypeIcon(draft.type)} color={theme.colors.primaryInk} size={44} />
          <View style={styles.identityMeta}>
            <Text variant="subheading" numberOfLines={1}>{name}</Text>
            {/* A name the user chose gets its type alongside; the suggested name already is the type. */}
            <Text variant="caption" tone="muted" numberOfLines={1}>{name === typeLabel(draft.type) ? hint : `${typeLabel(draft.type)} · ${hint}`}</Text>
          </View>
        </View>
        <Divider />
        <AmountField
          label={t('accountForm.currentBalance')}
          value={draft.balance}
          onChangeText={(balance) => onChange({ ...draft, balance })}
          currency={currency}
          error={balanceError}
          helperText={t('onboardingFlow.balanceHint')}
        />
      </Card>

      <View style={styles.section}>
        <Text variant="label" tone="muted">{t('accountForm.accountType')}</Text>
        <View style={styles.chips}>
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
    </View>
  );
});

const createStyles = ({ spacing }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('5') },
    card: { gap: spacing('4') },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    identityMeta: { flex: 1, gap: 2 },
    section: { gap: spacing('2') },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
  });
