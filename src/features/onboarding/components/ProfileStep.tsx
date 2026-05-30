import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const nameError = errors.name?.message;

  return (
    <View style={styles.wrapper}>
      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Your name
        </Text>
        <Controller
          control={control}
          name="name"
          rules={{
            required: 'Please enter your name',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 30, message: 'Name must be under 30 characters' },
          }}
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted + '60'}
              style={[styles.input, { fontFamily: typography.fonts.heading, color: colors.text }]}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          )}
        />
        <View style={[styles.underline, nameError && styles.underlineError]} />
        {nameError ? (
          <Text style={[styles.error, { fontFamily: typography.fonts.regular, color: colors.danger }]}>
            {nameError}
          </Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
          Default currency
        </Text>
        <TouchableOpacity style={styles.currencyRow} onPress={onOpenCurrencyPicker} activeOpacity={0.7}>
          <View style={[styles.currencyBadge, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.currencyCode, { fontFamily: typography.fonts.semibold, color: colors.primary }]}>
              {currency}
            </Text>
          </View>
          <Text style={[styles.currencyHint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
            Tap to change
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing('7'),
    },
    field: {
      gap: spacing('2'),
    },
    label: {
      fontSize: 11,
    },
    input: {
      fontSize: 40,
      lineHeight: 46,
      paddingHorizontal: 0,
      paddingVertical: spacing('1'),
    },
    underline: {
      height: 2,
      borderRadius: radius('full'),
      backgroundColor: colors.primary + '66',
    },
    underlineError: {
      backgroundColor: colors.danger,
    },
    error: {
      fontSize: typography.sizes.xs,
      marginTop: spacing('1'),
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      height: 52,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('4'),
    },
    currencyBadge: {
      height: 28,
      paddingHorizontal: spacing('2.5'),
      borderRadius: radius('md'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    currencyCode: {
      fontSize: 13,
    },
    currencyHint: {
      flex: 1,
      fontSize: typography.sizes.sm,
    },
  });
