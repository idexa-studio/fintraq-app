import { ColorPickerRow } from '@/src/components/ui/ColorPickerRow';
import { CurrencyPickerBottomSheet } from '@/src/components/ui/CurrencyPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ACCOUNT_COLORS } from '@/src/constants/picker';
import type { InsertAccount, UpdateAccountData } from '@/src/features/accounts/api/accounts';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/src/features/accounts/hooks/accounts';
import { useSettings } from '@/src/providers/SettingsProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { AnalyticsService } from '@/src/services/analytics';
import type { AccountType } from '@/src/types';
import { colorNumberToHex, parseAmount, toDbColor } from '@/src/utils/format';
import { ACCOUNT_TYPE_ICON_MAP, resolveAccountTypeIcon } from '@/src/utils/icons';
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

type AccountTypeOption = {
  value: AccountType;
  label: string;
};

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'ewallet', label: 'E-wallet' },
];

export const AccountFormScreen = React.memo(function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { colors, layout } = theme;
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
  const [colorHex, setColorHex] = useState<string>(
    () => ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)],
  );
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const holderRef = useRef<TextInput>(null);
  const accountNumberRef = useRef<TextInput>(null);
  const balanceRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  const accountName = watch('name');

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
      if (account.accountType) {
        setAccountType(account.accountType as AccountType);
      }
    }
  }, [account, reset]);

  const openCurrencyPicker = useCallback(() => setShowCurrencyPicker(true), []);
  const closeCurrencyPicker = useCallback(() => setShowCurrencyPicker(false), []);

  const resolvedIcon = useMemo(() => resolveAccountTypeIcon(accountType), [accountType]);
  const selectedTypeLabel = useMemo(
    () => ACCOUNT_TYPE_OPTIONS.find((o) => o.value === accountType)?.label ?? 'Bank',
    [accountType],
  );

  const handleSave = handleSubmit(async (data) => {
    try {
      if (isEditing && account) {
        const updateData: UpdateAccountData = {
          name: data.name.trim(),
          holderName: data.holderName.trim(),
          accountNumber: data.accountNumber.trim(),
          currency,
          color: toDbColor(colorHex),
          accountType,
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
          icon: 'building',
          accountType,
          isDefault: false,
        };
        await createAccount(createData);
      }
      await AnalyticsService.accountSaved(
        isEditing ? 'edit' : 'create',
        currency,
        !isEditing && parseAmount(data.balance) > 0,
        accountType,
      );
      router.back();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditing ? 'Edit account' : 'New account'} showBack />

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

          {/* ── Hero preview card ── */}
          <View style={[styles.heroCard, { marginHorizontal: layout.screenPadding }]}>
            <View style={styles.heroTop}>
              <IconAvatar icon={resolvedIcon} color={colorHex} variant="subtle" size={64} iconSize={28} />
              <View style={styles.heroMeta}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {accountName.trim() || 'Account name'}
                </Text>
                <Text style={styles.heroSub}>{selectedTypeLabel} · {currency}</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <ColorPickerRow colors={ACCOUNT_COLORS} value={colorHex} onChange={setColorHex} />
          </View>

          {/* ── Account type ── */}
          <View style={styles.sectionGap}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: layout.screenPadding }]}>
              Account type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.typeRow, { paddingHorizontal: layout.screenPadding }]}
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                const isSelected = accountType === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAccountType(opt.value)}
                    style={[
                      styles.typeChip,
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={ACCOUNT_TYPE_ICON_MAP[opt.value]}
                      size={15}
                      color={isSelected ? '#111' : colors.textMuted}
                    />
                    <Text style={[styles.typeChipLabel, isSelected && styles.typeChipLabelActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Details card ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>Account details</Text>
            <View style={styles.fieldCard}>

              {/* Account name */}
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Required',
                  minLength: { value: 2, message: 'Min 2 characters' },
                  maxLength: { value: 50, message: 'Max 50 characters' },
                }}
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="e.g. Main Wallet"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={[styles.fieldInput, errors.name && styles.fieldInputError]}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => holderRef.current?.focus()}
                    />
                  </View>
                )}
              />

              <View style={styles.fieldDivider} />

              {/* Holder name */}
              <Controller
                control={control}
                name="holderName"
                rules={{
                  maxLength: { value: 50, message: 'Max 50 characters' },
                }}
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Holder</Text>
                    <TextInput
                      ref={holderRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="John Doe (optional)"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={styles.fieldInput}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => accountNumberRef.current?.focus()}
                    />
                  </View>
                )}
              />

              <View style={styles.fieldDivider} />

              {/* Account number */}
              <Controller
                control={control}
                name="accountNumber"
                rules={{
                  maxLength: { value: 100, message: 'Max 100 characters' },
                }}
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Number</Text>
                    <TextInput
                      ref={accountNumberRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="IBAN (optional)"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={styles.fieldInput}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => balanceRef.current?.focus()}
                    />
                  </View>
                )}
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* ── Balance + Currency ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>
              {isEditing ? 'Current balance' : 'Initial balance'}
            </Text>
            <View style={styles.fieldCard}>
              <View style={styles.balanceRow}>
                <Controller
                  control={control}
                  name="balance"
                  rules={{
                    validate: (v) =>
                      !v.trim() ||
                      (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) ||
                      'Enter a valid amount',
                  }}
                  render={({ field }) => (
                    <TextInput
                      ref={balanceRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted + '50'}
                      keyboardType="decimal-pad"
                      style={[
                        styles.balanceInput,
                        errors.balance && styles.fieldInputError,
                        isEditing && styles.balanceInputDisabled,
                      ]}
                      returnKeyType="done"
                      editable={!isEditing}
                      selectTextOnFocus={!isEditing}
                    />
                  )}
                />
                <View style={styles.fieldDivider} />
                <TouchableOpacity
                  style={[styles.currencyBtn, isEditing && styles.balanceInputDisabled]}
                  onPress={isEditing ? undefined : openCurrencyPicker}
                  activeOpacity={isEditing ? 1 : 0.7}
                >
                  <Text style={styles.currencyValue}>{currency}</Text>
                  {!isEditing && <HugeiconsIcon icon={UnfoldMoreIcon} size={13} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>
            {errors.balance && (
              <Text style={styles.errorText}>{errors.balance.message}</Text>
            )}
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save account' : 'Create account'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPickerBottomSheet
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={setCurrency}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, shadow, layout }: ThemeContextType) =>
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
      paddingBottom: spacing('6'),
      gap: 0,
    },

    // ── Hero card
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      ...shadow('sm'),
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      padding: spacing('4'),
    },
    heroMeta: {
      flex: 1,
      gap: spacing('1'),
    },
    heroName: {
      fontFamily: typography.styles.profileName.fontFamily,
      fontSize: 18,
      color: colors.text,
    },
    heroSub: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    heroDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: spacing('4'),
    },
    // ── Section
    sectionGap: {
      marginTop: spacing('5'),
      gap: spacing('2.5'),
    },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.6,
    },

    // ── Type chips
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
    },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('2'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    typeChipLabel: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    typeChipLabelActive: {
      color: '#111',
    },

    // ── Field card (grouped inputs)
    fieldCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      minHeight: 52,
      gap: spacing('3'),
    },
    fieldLabel: {
      fontFamily: typography.fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
      width: 56,
    },
    fieldInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
      paddingVertical: spacing('3'),
    },
    fieldInputError: {
      color: colors.danger,
    },
    fieldDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing('4') + 56 + spacing('3'),
    },
    errorText: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.danger,
    },

    // ── Balance row
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    balanceInput: {
      flex: 1,
      fontFamily: typography.fonts.amountBold,
      fontSize: 20,
      color: colors.text,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    balanceInputDisabled: {
      color: colors.textMuted,
      opacity: 0.6,
    },
    currencyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    currencyValue: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: 15,
      color: colors.text,
    },

    // ── Footer
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
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: 15,
      color: colors.primaryForeground,
    },
  });
