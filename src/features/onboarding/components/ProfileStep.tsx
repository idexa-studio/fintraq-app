import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Input } from '../../../components/ui/Input';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';
import { OnboardingFormValues } from '../types';

type Props = {
  currency: string;
  onOpenCurrencyPicker: () => void;
};

export const ProfileStep = React.memo(function ProfileStep({ currency, onOpenCurrencyPicker }: Props) {
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
          required: 'Please enter your name',
          minLength: { value: 2, message: 'At least 2 characters' },
          maxLength: { value: 30, message: 'Under 30 characters' },
        }}
        render={({ field }) => (
          <Input
            label="Your name"
            placeholder="Your name"
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
          This is how we{"'"}ll greet you in the app
        </Text>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Default currency
        </Text>
        <TouchableOpacity style={styles.currencyRow} onPress={onOpenCurrencyPicker} activeOpacity={0.7}>
          <Text style={[styles.currencyCode, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>{currency}</Text>
          <Text style={[styles.currencyHint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Tap to change</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: { gap: spacing('5') },
    hint: { fontSize: typography.sizes.xs, opacity: 0.6, paddingLeft: spacing('1') },
    field: { gap: spacing('2') },
    label: { fontSize: typography.sizes.xs, opacity: 0.7 },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      height: 52,
      backgroundColor: colors.surface,
      borderRadius: radius('lg'),
      paddingHorizontal: spacing('4'),
    },
    currencyCode: { fontSize: typography.sizes.sm },
    currencyHint: { flex: 1, fontSize: typography.sizes.xs },
  });
