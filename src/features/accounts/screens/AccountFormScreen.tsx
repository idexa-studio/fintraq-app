import { ColorPickerRow } from '@/src/components/pickers/ColorPickerRow';
import { CurrencyPickerBottomSheet } from '@/src/components/pickers/CurrencyPickerBottomSheet';
import { Button, Card, Chip, FormField, Icon, IconAvatar, ListGroup, Screen, Text } from '@/src/components/ui';
import { ACCOUNT_COLORS } from '@/shared/contracts/pickers';
import type { InsertAccount, UpdateAccountData } from '@/data/repositories/accounts';
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/features/accounts';
import { useSettings } from '@/features/settings';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { Analytics } from '@/platform/telemetry';
import type { AccountType } from '@/shared/types';
import { parseAmountInput } from '@/shared/format/amount';
import { colorNumberToHex, toDbColor } from '@/shared/format/color';
import { parseAmount } from '@/shared/format/money';
import { ACCOUNT_TYPE_ICON_MAP, resolveAccountTypeIcon } from '@/src/utils/icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { LoggerService } from '@/shared/logging/logger';
import { useTranslation } from 'react-i18next';

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

type AccountTypeOption = {
  value: AccountType;
  label: 'cash' | 'bank' | 'savings' | 'creditCard' | 'investment' | 'loan' | 'ewallet';
};

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: 'cash', label: 'cash' },
  { value: 'bank', label: 'bank' },
  { value: 'savings', label: 'savings' },
  { value: 'credit_card', label: 'creditCard' },
  { value: 'investment', label: 'investment' },
  { value: 'loan', label: 'loan' },
  { value: 'ewallet', label: 'ewallet' },
];

export const AccountFormScreen = React.memo(function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
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
    () => t(`accounts.${ACCOUNT_TYPE_OPTIONS.find((o) => o.value === accountType)?.label ?? 'bank'}`),
    [accountType, t],
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
      Analytics.track('account_saved', { account_type: accountType, mode: isEditing ? 'edit' : 'create' });
      router.back();
    } catch (error) {
      LoggerService.error('ACCOUNT_FORM', 'Failed to save account', error);
    }
  });

  return (
    <Screen
      header={{ title: isEditing ? t('accountForm.edit') : t('accountForm.new'), showBack: true }}
      keyboardAvoiding
      footer={
        <Button
          title={isEditing ? t('accountForm.save') : t('accountForm.create')}
          onPress={handleSave}
          disabled={!isValid}
          size="lg"
          fullWidth
        />
      }
      overlays={
        <CurrencyPickerBottomSheet
          visible={showCurrencyPicker}
          onClose={closeCurrencyPicker}
          value={currency}
          onChange={setCurrency}
        />
      }
    >
      {/* Live preview — updates as you type, pick a type or a colour */}
      <Card style={styles.preview}>
        <View style={styles.previewTop}>
          <IconAvatar icon={resolvedIcon} color={colorHex} size={56} />
          <View style={styles.previewMeta}>
            <Text variant="subheading" numberOfLines={1}>{accountName.trim() || t('accountForm.accountName')}</Text>
            <Text variant="callout" tone="muted">{selectedTypeLabel} · {currency}</Text>
          </View>
        </View>
        <View style={styles.previewColors}>
          <ColorPickerRow colors={ACCOUNT_COLORS} value={colorHex} onChange={setColorHex} />
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>{t('accountForm.accountType')}</Text>
        {/* Every type visible at once — no hidden options in a sideways scroll */}
        <View style={styles.typeGrid}>
          {ACCOUNT_TYPE_OPTIONS.filter((opt) => !isEditing || opt.value === accountType).map((opt) => (
            <Chip
              key={opt.value}
              label={t(`accounts.${opt.label}`)}
              icon={ACCOUNT_TYPE_ICON_MAP[opt.value]}
              isActive={accountType === opt.value}
              onPress={() => { if (!isEditing) setAccountType(opt.value); }}
            />
          ))}
        </View>
      </View>

      <ListGroup title={t('accountForm.accountDetails')} insetDividers={false}>
        <Controller
          control={control}
          name="name"
          rules={{
            required: t('forms.required'),
            minLength: { value: 2, message: t('forms.minChars', { count: 2 }) },
            maxLength: { value: 50, message: t('forms.maxChars', { count: 50 }) },
          }}
          render={({ field, fieldState }) => (
            <FormField
              label={t('forms.name')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.isTouched ? errors.name?.message : undefined}
              placeholder={t('accountForm.namePlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => holderRef.current?.focus()}
            />
          )}
        />
        <Controller
          control={control}
          name="holderName"
          rules={{ maxLength: { value: 50, message: t('forms.maxChars', { count: 50 }) } }}
          render={({ field }) => (
            <FormField
              ref={holderRef}
              label={t('forms.holder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.holderName?.message}
              placeholder={t('accountForm.holderPlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => accountNumberRef.current?.focus()}
            />
          )}
        />
        <Controller
          control={control}
          name="accountNumber"
          rules={{ maxLength: { value: 100, message: t('forms.maxChars', { count: 100 }) } }}
          render={({ field }) => (
            <FormField
              ref={accountNumberRef}
              label={t('forms.number')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.accountNumber?.message}
              placeholder={t('accountForm.numberPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={isEditing ? 'done' : 'next'}
              onSubmitEditing={() => { if (!isEditing) balanceRef.current?.focus(); }}
            />
          )}
        />
      </ListGroup>

      <ListGroup insetDividers={false}>
        <Controller
          control={control}
          name="balance"
          rules={{
            validate: (v) =>
              !v.trim() || (!v.trim().startsWith('-') && parseAmountInput(v) !== null) || t('forms.invalidAmount'),
          }}
          render={({ field }) => (
            <FormField
              ref={balanceRef}
              large
              label={isEditing ? t('accountForm.currentBalance') : t('accountForm.initialBalance')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.balance?.message}
              placeholder="0.00"
              keyboardType="decimal-pad"
              returnKeyType="done"
              editable={!isEditing}
              selectTextOnFocus={!isEditing}
              trailing={
                isEditing ? (
                  <Icon name="lock-key" size={18} color={colors.textMuted} />
                ) : (
                  <Button
                    title={currency}
                    icon="chevron-down"
                    iconPosition="trailing"
                    variant="tonal"
                    size="sm"
                    onPress={openCurrencyPicker}
                    accessibilityLabel={t('ui.currency')}
                  />
                )
              }
            />
          )}
        />
      </ListGroup>

      {isEditing ? (
        <Text variant="caption" tone="muted" style={styles.lockedHint}>{t('accountForm.lockedHint')}</Text>
      ) : null}
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    preview: { padding: 0 },
    previewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('3.5'), padding: spacing('4') },
    previewMeta: { flex: 1, gap: spacing('0.5') },
    previewColors: { marginTop: -spacing('3') },
    section: { gap: spacing('2') },
    sectionLabel: { marginLeft: spacing('1') },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    lockedHint: { marginHorizontal: spacing('1'), marginTop: -spacing('2') },
  });
