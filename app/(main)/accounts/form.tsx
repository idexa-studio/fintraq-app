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

const createStyles = ({ colors, typography }: ThemeContextType) =>
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
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 40,
    },
    section: {
      paddingBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    labelSpaced: {
      marginTop: 16,
    },
    answerInput: {
      fontFamily: typography.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerInputAmount: {
      fontFamily: typography.fonts.amountBold,
      letterSpacing: 0,
    },
    answerLine: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '55',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: colors.danger + '88',
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    currencyValue: {
      fontFamily: typography.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    iconCell: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
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
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background + 'F2',
    },
    primaryBtn: {
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: typography.fonts.heading,
      fontSize: 14,
      color: colors.background,
      letterSpacing: 0.3,
      marginRight: 10,
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
      <Header
        title={isEditing ? 'Edit Account' : 'New Account'}
        subtitle="Configure where your money lives"
        showBack
      />

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
          <View style={styles.section}>
            <Text style={styles.label}>Account Name</Text>
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
                  style={styles.answerInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
            />
            <View style={[styles.answerLine, errors.name && styles.answerLineError]} />

            <Text style={[styles.label, styles.labelSpaced]}>Holder Name</Text>
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
                  style={styles.answerInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
            />
            <View style={styles.answerLine} />

            <Text style={[styles.label, styles.labelSpaced]}>Account Number</Text>
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
                  style={styles.answerInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              )}
            />
            <View style={styles.answerLine} />

            {!isEditing && (
              <>
                <Text style={[styles.label, styles.labelSpaced]}>Opening Balance</Text>
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
                      style={[styles.answerInput, styles.answerInputAmount]}
                      returnKeyType="done"
                    />
                  )}
                />
                <View style={[styles.answerLine, errors.balance && styles.answerLineError]} />
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Currency</Text>
            <TouchableOpacity
              style={styles.currencyRow}
              onPress={openCurrencyPicker}
              activeOpacity={0.85}
            >
              <Text style={styles.currencyValue}>{currency}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.answerLine} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Icon</Text>
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

          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.label}>Color</Text>
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save Account' : 'Create Account'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={closeCurrencyPicker}
        value={currency}
        onChange={setCurrency}
      />
    </SafeAreaView>
  );
});
