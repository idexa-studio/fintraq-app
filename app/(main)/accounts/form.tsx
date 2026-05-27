import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Header } from '@/src/components/ui/Header';
import { CurrencyPickerModal } from '@/src/components/ui/CurrencyPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '@/src/constants/picker';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/src/features/accounts/hooks/accounts';
import { parseAmount, toDbColor, colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    body: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingTop: spacing('4'),
      paddingBottom: 120,
    },
    formBody: {
      gap: spacing('5'),
    },
    section: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('3'),
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    fieldInput: {
      height: 50,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing('4'),
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    fieldInputAmount: {
      fontFamily: typography.fonts.amountBold,
    },
    currencyBtn: {
      height: 50,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing('4'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    currencyValue: {
      fontFamily: typography.fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2.5'),
    },
    iconCell: {
      width: 44,
      height: 44,
      borderRadius: radius('md'),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('3'),
    },
    colorCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.08 }],
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: layout.screenPadding,
      right: layout.screenPadding,
    },
    primaryBtn: {
      height: 52,
      borderRadius: radius('xl'),
      backgroundColor: colors.text,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });

export default React.memo(function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { colors, onAccent } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: accounts } = useAccounts();
  const account = useMemo(
    () => (id ? accounts?.find((a) => a.id === Number(id)) : undefined),
    [id, accounts],
  );
  const isEditing = !!account;

  const { mutateAsync: createAccount } = useCreateAccount();
  const { mutateAsync: updateAccount } = useUpdateAccount();

  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>(ACCOUNT_ICONS[0]);

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
        balance: '',
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
    const payload = {
      name: data.name.trim(),
      holderName: data.holderName.trim(),
      accountNumber: data.accountNumber.trim(),
      balance: parseAmount(data.balance),
      currency,
      color: toDbColor(colorHex),
      icon: iconKey.replace('-outline', ''),
    };
    try {
      if (isEditing && account) {
        await updateAccount({ id: account.id, data: payload });
      } else {
        await createAccount(payload);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title={isEditing ? 'Edit Account' : 'New Account'} showBack />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formBody}>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCOUNT NAME</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Account name is required' }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Main Wallet"
                    placeholderTextColor={colors.textMuted + '50'}
                    autoFocus={!isEditing}
                    style={[styles.fieldInput, errors.name && { borderColor: colors.danger }]}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>HOLDER NAME</Text>
              <Controller
                control={control}
                name="holderName"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Account Holder"
                    placeholderTextColor={colors.textMuted + '50'}
                    style={styles.fieldInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCOUNT NUMBER</Text>
              <Controller
                control={control}
                name="accountNumber"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="IBAN / Account Number"
                    placeholderTextColor={colors.textMuted + '50'}
                    style={styles.fieldInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            {!isEditing && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>OPENING BALANCE</Text>
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
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted + '50'}
                      keyboardType="decimal-pad"
                      style={[
                        styles.fieldInput,
                        styles.fieldInputAmount,
                        errors.balance && { borderColor: colors.danger },
                      ]}
                      returnKeyType="done"
                    />
                  )}
                />
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CURRENCY</Text>
              <TouchableOpacity
                style={styles.currencyBtn}
                onPress={openCurrencyPicker}
                activeOpacity={0.85}
              >
                <Text style={styles.currencyValue}>{currency}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ICON</Text>
              <View style={styles.iconGrid}>
                {ACCOUNT_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIconKey(item)}
                    style={[
                      styles.iconCell,
                      iconKey === item && { backgroundColor: colorHex, borderColor: colorHex },
                    ]}
                  >
                    <Ionicons
                      name={resolveIcon(item, 'wallet-outline')}
                      size={18}
                      color={iconKey === item ? onAccent : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>COLOR</Text>
              <View style={styles.colorGrid}>
                {ACCOUNT_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setColorHex(item)}
                    style={[
                      styles.colorCell,
                      { backgroundColor: item },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? (
                      <Ionicons name="checkmark" size={14} color={onAccent} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.primaryBtnText}>
            {isEditing ? 'Save account' : 'Create account'}
          </Text>
        </TouchableOpacity>
      </View>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={setCurrency}
      />
    </SafeAreaView>
  );
});
