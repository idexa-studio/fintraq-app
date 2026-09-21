import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Input } from '../../../components/ui/Input';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { OnboardingFormValues } from '../types';

type Props = {
  currency: string;
  onOpenCurrencyPicker: () => void;
};

export const ProfileStep = React.memo(function ProfileStep({ currency, onOpenCurrencyPicker }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <View style={styles.wrapper}>
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
            size="md"
            variant="filled"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
        )}
      />

      {!errors.name && (
        <Text style={[styles.hint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
          {t('onboarding.greetingHint')}
        </Text>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
          {t('onboarding.defaultCurrency')}
        </Text>
        <BentoPressable style={styles.currencyRow} onPress={onOpenCurrencyPicker}>
          <Text style={[styles.currencyCode, { fontFamily: typography.styles.badge.fontFamily, color: colors.primary }]}>{currency}</Text>
          <Text style={[styles.currencyHint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>{t('onboarding.tapToChange')}</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} />
        </BentoPressable>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: { gap: spacing('5') },
    hint: { ...typography.metrics.xs, opacity: 0.6, paddingLeft: spacing('1') },
    field: { gap: spacing('2') },
    label: { ...typography.metrics.xs, opacity: 0.6 },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      height: 52,
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      paddingHorizontal: spacing('4'),
    },
    currencyCode: { ...typography.metrics.sm },
    currencyHint: { flex: 1, ...typography.metrics.xs },
  });
