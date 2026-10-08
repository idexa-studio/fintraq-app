import { Button, Card, FormField, ListGroup, PersonAvatar, Text } from '@/src/components/ui';
import { Screen } from '@/src/components/ui/Screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { ColorPickerRow } from '@/src/components/pickers/ColorPickerRow';
import { PALETTE_COLOR_OPTIONS } from '@/shared/contracts/pickers';
import type { InsertPerson, UpdatePersonData } from '@/src/features/persons/api/persons';
import { useCreatePerson, usePersons, useUpdatePerson } from '@/src/features/persons/hooks/persons';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, toDbColor } from '@/shared/format/color';
import { LoggerService } from '@/shared/logging/logger';
import { FREE_PERSON_LIMIT } from '@/src/constants/iap';
import { useTranslation } from 'react-i18next';


const PALETTE_COLORS = PALETTE_COLOR_OPTIONS.map((c) => c.hex);

function randomPaletteColor(): string {
  return PALETTE_COLOR_OPTIONS[Math.floor(Math.random() * PALETTE_COLOR_OPTIONS.length)].hex;
}

type PersonFormValues = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  company: string;
};

export const PersonFormScreen = React.memo(function PersonFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium, openPaywall } = useProAccess();

  const { data: persons } = usePersons();
  const person = useMemo(
    () => (id ? persons?.find((p) => p.id === Number(id)) : undefined),
    [id, persons],
  );
  const isEditing = !!person;

  const { mutateAsync: createPerson } = useCreatePerson();
  const { mutateAsync: updatePerson } = useUpdatePerson();

  const [colorHex, setColorHex] = useState(randomPaletteColor);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const designationRef = useRef<TextInput>(null);
  const companyRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<PersonFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', email: '', phone: '', designation: '', company: '' },
  });

  const nameValue = watch('name');


  useEffect(() => {
    if (person) {
      reset({
        name: person.name,
        email: person.email ?? '',
        phone: person.phone ?? '',
        designation: person.designation ?? '',
        company: person.company ?? '',
      });
      setColorHex(colorNumberToHex(person.color).toUpperCase());
    }
  }, [person, reset]);

  const handleSave = handleSubmit(async (data) => {
    if (!isEditing && !isPremium && (persons?.length ?? 0) >= FREE_PERSON_LIMIT) {
      openPaywall('unlimited');
      return;
    }

    try {
      if (isEditing && person) {
        const updateData: UpdatePersonData = {
          name: data.name.trim(),
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          designation: data.designation.trim() || null,
          company: data.company.trim() || null,
          color: toDbColor(colorHex),
        };
        await updatePerson({ id: person.id, data: updateData });
      } else {
        const createData: InsertPerson = {
          name: data.name.trim(),
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          designation: data.designation.trim() || null,
          company: data.company.trim() || null,
          color: toDbColor(colorHex),
        };
        await createPerson(createData);
      }
      router.back();
    } catch (e) {
      LoggerService.error('PERSON_FORM', 'Failed to save person', e);
    }
  });

  return (
    <Screen
      header={{ title: isEditing ? t('persons.edit') : t('persons.new'), showBack: true }}
      keyboardAvoiding
      footer={
        <Button title={isEditing ? t('persons.save') : t('persons.add')} onPress={handleSave} disabled={!isValid} size="lg" fullWidth />
      }
    >
      {/* Preview */}
      <Card style={styles.preview}>
        <View style={styles.previewTop}>
          <PersonAvatar name={nameValue.trim() || '?'} color={colorHex} size={64} />
          <View style={styles.previewMeta}>
            <Text variant="subheading" numberOfLines={1}>{nameValue.trim() || t('persons.personName')}</Text>
            <Text variant="callout" tone="muted" numberOfLines={1}>{t('persons.chooseColor')}</Text>
          </View>
        </View>
        <View style={styles.previewColors}>
          <ColorPickerRow colors={PALETTE_COLORS} value={colorHex} onChange={setColorHex} />
        </View>
      </Card>

      <ListGroup title={t('persons.contactDetails')} insetDividers={false}>
        <Controller
          control={control}
          name="name"
          rules={{
            required: t('forms.required'),
            minLength: { value: 2, message: t('forms.minChars', { count: 2 }) },
            maxLength: { value: 60, message: t('forms.maxChars', { count: 60 }) },
          }}
          render={({ field, fieldState }) => (
            <FormField
              label={t('forms.name')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('persons.namePlaceholder')}
              error={fieldState.isTouched ? errors.name?.message : undefined}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={{
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('forms.invalidEmail') },
          }}
          render={({ field, fieldState }) => (
            <FormField
              ref={emailRef}
              label={t('forms.email')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('persons.emailPlaceholder')}
              error={fieldState.isTouched ? errors.email?.message : undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormField
              ref={phoneRef}
              label={t('forms.phone')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={'+1 234 567 8900'}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => designationRef.current?.focus()}
            />
          )}
        />
      </ListGroup>

      <ListGroup title={t('persons.work')} insetDividers={false}>
        <Controller
          control={control}
          name="designation"
          render={({ field, fieldState }) => (
            <FormField
              ref={designationRef}
              label={t('forms.role')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('persons.rolePlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => companyRef.current?.focus()}
            />
          )}
        />
        <Controller
          control={control}
          name="company"
          render={({ field, fieldState }) => (
            <FormField
              ref={companyRef}
              label={t('forms.company')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={t('persons.companyPlaceholder')}
              autoCapitalize="words"
              returnKeyType="done"
            />
          )}
        />
      </ListGroup>
    </Screen>
  );
});

const createStyles = ({ colors, spacing }: ThemeContextType) =>
  StyleSheet.create({
    preview: { padding: 0 },
    previewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('4'), padding: spacing('4') },
    previewMeta: { flex: 1, gap: spacing('0.5') },
    previewColors: { marginTop: -spacing('3') },
  });
