import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ColorPickerBottomSheet } from '@/src/components/ui/ColorPickerBottomSheet';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { IconPickerBottomSheet } from '@/src/components/ui/IconPickerBottomSheet';
import { Input } from '@/src/components/ui/Input';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ACCOUNT_COLORS, ACCOUNT_ICON_GROUPS, ACCOUNT_ICONS, PALETTE_COLOR_OPTIONS } from '@/src/constants/picker';
import type { InsertAccount, UpdateAccountData } from '@/src/features/accounts/api/accounts';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/src/features/accounts/hooks/accounts';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { AnalyticsService } from '@/src/services/analytics';
import { colorNumberToHex, parseAmount, toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { Building01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

export const AccountFormScreen = React.memo(function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: accounts } = useAccounts();
  const account = useMemo(
    () => (id ? accounts?.find((a) => a.id === Number(id)) : undefined),
    [id, accounts],
  );
  const isEditing = !!account;

  const { mutateAsync: createAccount } = useCreateAccount();
  const { mutateAsync: updateAccount } = useUpdateAccount();

  const { profile } = useSettings();

  const [currency, setCurrency] = useState<string>(profile.defaultCurrency || 'USD');
  const [colorHex, setColorHex] = useState<string>(() => ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]);
  const [iconKey, setIconKey] = useState<string>(ACCOUNT_ICONS[0]);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        holderName: account.holderName,
        accountNumber: account.accountNumber,
        balance: String(account.balance),
      });
      setCurrency(account.currency);
      setColorHex(colorNumberToHex(account.color).toUpperCase());
      const matchedIcon =
        ACCOUNT_ICONS.find((i) => i === `${account.icon}-outline`) ?? ACCOUNT_ICONS[0];
      setIconKey(matchedIcon);
    }
  }, [account, reset]);

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);

  const handleSave = handleSubmit(async (data) => {
    try {
      if (isEditing && account) {
        const updateData: UpdateAccountData = {
          name: data.name.trim(),
          holderName: data.holderName.trim(),
          accountNumber: data.accountNumber.trim(),
          currency,
          color: toDbColor(colorHex),
          icon: iconKey.replace('-outline', ''),
        };
        await updateAccount({ id: account.id, data: updateData });
      } else {
        const createData: InsertAccount = {
          name: data.name.trim(),
          holderName: data.holderName.trim(),
          accountNumber: data.accountNumber.trim(),
          balance: parseAmount(data.balance),
          currency,
          color: toDbColor(colorHex),
          icon: iconKey.replace('-outline', ''),
          isDefault: false,
        };
        await createAccount(createData);
      }
      await AnalyticsService.accountSaved(
        isEditing ? 'edit' : 'create',
        currency,
        !isEditing && parseAmount(data.balance) > 0,
        iconKey.replace('-outline', '')
      );
      router.back();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditing ? 'Edit Account' : 'New Account'} showBack />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formBody}>

            {/* ── Account Name ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Account name</Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Account name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name must be 50 characters or less' },
                }}
                render={({ field }) => (
                  <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="e.g. Main Wallet, Savings" error={errors.name?.message} size="md" variant="filled" autoCapitalize="words" autoCorrect={false} returnKeyType="next" />
                )}
              />
            </View>

            {/* ── Holder Name ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Holder name</Text>
              <Controller
                control={control}
                name="holderName"
                rules={{
                  maxLength: { value: 50, message: 'Holder name must be 50 characters or less' },
                }}
                render={({ field }) => (
                  <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="e.g. John Doe (optional)" error={errors.holderName?.message} size="md" variant="filled" autoCapitalize="words" autoCorrect={false} returnKeyType="next" />
                )}
              />
            </View>

            {/* ── Account Number ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Account number</Text>
              <Controller
                control={control}
                name="accountNumber"
                rules={{
                  maxLength: { value: 100, message: 'Account number must be 100 characters or less' },
                }}
                render={({ field }) => (
                  <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="IBAN or account number (optional)" error={errors.accountNumber?.message} size="md" variant="filled" autoCorrect={false} autoCapitalize="none" returnKeyType="next" />
                )}
              />
            </View>

            {/* ── Balance + Currency ── */}
            <View style={styles.section}>
              <View style={styles.twoCol}>
                <View style={styles.colBalance}>
                  <Text style={styles.sectionLabel}>
                    {isEditing ? 'Current balance' : 'Initial balance'}
                  </Text>
                  <Controller
                    control={control}
                    name="balance"
                    rules={{
                      validate: (v) =>
                        !v.trim() ||
                        (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) ||
                        'Enter a valid positive amount',
                    }}
                    render={({ field }) => (
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted + '50'}
                        keyboardType="decimal-pad"
                        style={[
                          styles.fieldInput,
                          styles.fieldInputAmount,
                          errors.balance && styles.fieldInputError,
                          isEditing && styles.fieldInputDisabled,
                        ]}
                        returnKeyType="done"
                        editable={!isEditing}
                        selectTextOnFocus={!isEditing}
                      />
                    )}
                  />
                  {errors.balance && <Text style={styles.errorText}>{errors.balance.message}</Text>}
                </View>
                <View style={styles.colCurrency}>
                  <Text style={styles.sectionLabel}>Currency</Text>
                  <BentoPressable
                    style={styles.currencyBtn}
                    onPress={openCurrencyPicker}
                  >
                    <Text style={styles.currencyValue}>{currency}</Text>
                    <HugeiconsIcon icon={UnfoldMoreIcon} size={14} color={colors.textMuted} />
                  </BentoPressable>
                </View>
              </View>
            </View>

            {/* ── Appearance ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Appearance</Text>
              <View style={styles.appearanceRow}>

                <BentoPressable
                  style={styles.appearanceCard}
                  onPress={() => setShowIconPicker(true)}
                >
                  <IconAvatar
                     icon={resolveIcon(iconKey, Building01Icon)}
                     color={colorHex} variant="solid"
                    size={32}
                  />
                  <View style={styles.appearanceCardMeta}>
                    <Text style={styles.appearanceCardLabel}>Icon</Text>
                    <Text style={styles.appearanceCardHint} numberOfLines={1}>
                      {iconKey.replace('-outline', '')}
                    </Text>
                  </View>
                </BentoPressable>

                <BentoPressable
                  style={styles.appearanceCard}
                  onPress={() => setShowColorPicker(true)}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: colorHex }]} />
                  <View style={styles.appearanceCardMeta}>
                    <Text style={styles.appearanceCardLabel}>Color</Text>
                    <Text style={styles.appearanceCardHint} numberOfLines={1}>{colorHex}</Text>
                  </View>
                </BentoPressable>

              </View>
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <BentoPressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save account' : 'Create account'}
            </Text>
          </BentoPressable>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPickerBottomSheet
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={setCurrency}
      />
      <IconPickerBottomSheet
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        value={iconKey}
        onChange={setIconKey}
        groups={ACCOUNT_ICON_GROUPS}
        accentColor={colorHex}
      />
      <ColorPickerBottomSheet
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        value={colorHex}
        onChange={setColorHex}
        palette={PALETTE_COLOR_OPTIONS}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    body: { flex: 1 },
    scroll: { flex: 1 },
    content: {
      paddingTop: spacing('4'),
      paddingBottom: spacing('4'),
    },
    formBody: {
      gap: spacing('5'),
    },
    section: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('2.5'),
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.6,
    },
    fieldInput: {
      height: 50,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    fieldInputError: {
      borderWidth: 1,
      borderColor: colors.danger,
    },
    fieldInputDisabled: {
      color: colors.textMuted,
      opacity: 0.6,
    },
    fieldInputAmount: {
      fontFamily: typography.fonts.amountBold,
    },
    errorText: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.danger,
      marginTop: -spacing('1'),
    },
    twoCol: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    colBalance: {
      flex: 1,
      gap: spacing('2.5'),
    },
    colCurrency: {
      width: 110,
      gap: spacing('2.5'),
    },
    currencyBtn: {
      height: 50,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('3.5'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    currencyValue: {
      fontFamily: typography.fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    appearanceRow: {
      flexDirection: 'row',
      gap: spacing('3'),
    },
    appearanceCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2.5'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('3'),
    },
    appearanceCardMeta: {
      flex: 1,
      gap: 2,
    },
    appearanceCardLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    appearanceCardHint: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
    },
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('8'),
    },
    primaryBtn: {
      height: 52,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });
