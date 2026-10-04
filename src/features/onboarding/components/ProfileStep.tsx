import React, { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BentoPressable, Icon, Input, Text } from '@/src/components/ui';
import { CURRENCIES, getCurrencySymbol, getDeviceCurrencyCode } from '@/src/constants/currency';
import { OnboardingFormValues } from '@/src/features/onboarding/types';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { getGreetingKey } from '@/src/utils/greeting';

type Props = {
  currency: string;
  onCurrencyChange: (code: string) => void;
  onOpenCurrencyPicker: () => void;
};

/** One-tap picks: the device's own currency first, then the most used. The picker has the rest. */
const POPULAR = ['USD', 'EUR', 'GBP', 'INR'];

/**
 * Who you are and what you count in. The greeting card at the top is Home's, filled in as you
 * type, so the name field has an obvious purpose.
 */
export const ProfileStep = React.memo(function ProfileStep({ currency, onCurrencyChange, onOpenCurrencyPicker }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, heroCard: hero } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const name = useWatch({ control, name: 'name' }) ?? '';
  const firstName = name.trim().split(' ')[0] ?? '';

  const picks = useMemo(() => {
    const list = Array.from(new Set([getDeviceCurrencyCode(), ...POPULAR]));
    return list.includes(currency) ? list : [currency, ...list];
  }, [currency]);
  const selected = CURRENCIES.find((c) => c.code === currency);

  return (
    <View style={styles.root}>
      <View style={styles.greeting} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.avatar}>
          <Text variant="headline" color={hero.onInk}>
            {(firstName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.greetingText}>
          <Text variant="callout" color={hero.textMuted}>
            {t(getGreetingKey())},
          </Text>
          <Text variant="title" color={firstName ? hero.textPrimary : hero.placeholder} numberOfLines={1}>
            {firstName || t('onboardingFlow.yourName')}
          </Text>
        </View>
      </View>

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
            variant="filled"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            maxLength={30}
          />
        )}
      />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="label" tone="muted">
            {t('onboarding.defaultCurrency')}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={styles.currencyName}>
            {selected?.name ?? currency}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.picks}>
          {picks.map((code) => {
            const active = code === currency;
            return (
              <BentoPressable
                key={code}
                style={[styles.pick, active && styles.pickActive]}
                onPress={() => onCurrencyChange(code)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={code}
              >
                <View style={[styles.symbol, active && styles.symbolActive]}>
                  <Text variant="label" color={active ? colors.primaryForeground : colors.text} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                    {getCurrencySymbol(code)}
                  </Text>
                </View>
                <Text variant="calloutStrong" color={active ? colors.primaryInk : colors.text}>
                  {code}
                </Text>
              </BentoPressable>
            );
          })}
          <BentoPressable style={styles.pick} onPress={onOpenCurrencyPicker} accessibilityRole="button" accessibilityLabel={t('onboardingFlow.moreCurrencies')}>
            <View style={styles.symbol}>
              <Icon name="search-simple" size={14} color={colors.textMuted} />
            </View>
            <Text variant="calloutStrong" tone="muted">
              {t('onboardingFlow.moreCurrencies')}
            </Text>
          </BentoPressable>
        </ScrollView>
      </View>
    </View>
  );
});

const createStyles = ({ colors, heroCard: hero, spacing, radius, layout, alpha }: ThemeContextType) =>
  StyleSheet.create({
    root: { gap: spacing('6') },
    greeting: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      padding: spacing('4'),
      borderRadius: radius('2xl'),
      backgroundColor: hero.background,
    },
    avatar: { width: 52, height: 52, borderRadius: radius('full'), backgroundColor: hero.ink, alignItems: 'center', justifyContent: 'center' },
    greetingText: { flex: 1, gap: 2 },
    section: { gap: spacing('2.5') },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing('3'), paddingHorizontal: spacing('1') },
    currencyName: { flexShrink: 1 },
    bleed: { marginHorizontal: -layout.screenPadding },
    picks: { gap: spacing('2'), paddingHorizontal: layout.screenPadding },
    pick: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      height: 44,
      paddingLeft: 6,
      paddingRight: spacing('3.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    pickActive: { backgroundColor: alpha(colors.primary, 'subtle'), borderColor: colors.primary },
    symbol: { width: 30, height: 30, borderRadius: radius('full'), backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    symbolActive: { backgroundColor: colors.primary },
  });
