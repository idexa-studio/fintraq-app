import { Input, ListGroup, ListItem, Text } from '@/src/components/ui';
import { CURRENCIES, getCurrencySymbol } from '@/shared/currency/currencies';
import { OnboardingFormValues } from '@/src/features/onboarding/types';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Props = {
  currency: string;
  onOpenCurrencyPicker: () => void;
};

export const ProfileStep = React.memo(function ProfileStep({ currency, onOpenCurrencyPicker }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, alpha } = useTheme();
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const selected = CURRENCIES.find((c) => c.code === currency);

  return (
    <View style={{ gap: spacing('6') }}>
      <Controller
        control={control}
        name="name"
        rules={{
          required: t('onboarding.nameRequired'),
          minLength: { value: 2, message: t('onboarding.nameMin') },
          maxLength: { value: 30, message: t('onboarding.nameMax') },
        }}
        render={({ field }) => (
          <Input
            label={t('onboarding.name')}
            placeholder={t('onboarding.name')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
            helperText={t('onboarding.greetingHint')}
            variant="filled"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            maxLength={30}
          />
        )}
      />

      <ListGroup title={t('onboarding.defaultCurrency')}>
        <ListItem
          leading={
            <View style={{ width: 36, height: 36, borderRadius: radius('md'), backgroundColor: alpha(colors.primary, 'subtle'), alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyStrong" tone="primary" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {getCurrencySymbol(currency)}
              </Text>
            </View>
          }
          title={selected?.name ?? currency}
          subtitle={currency}
          onPress={onOpenCurrencyPicker}
        />
      </ListGroup>
    </View>
  );
});
