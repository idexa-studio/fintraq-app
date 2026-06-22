import { CheckIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { PALETTE_COLOR_OPTIONS } from '@/src/constants/picker';
import type { InsertPerson, UpdatePersonData } from '@/src/features/persons/api/persons';
import {
  useCreatePerson,
  usePersons,
  useUpdatePerson,
} from '@/src/features/persons/hooks/persons';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, toDbColor } from '@/src/utils/format';

const FREE_PERSON_LIMIT = 10;
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
  const { colors, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();

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

  const initials = useMemo(
    () =>
      nameValue
        .trim()
        .split(' ')
        .map((w) => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') || '?',
    [nameValue],
  );

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
      Alert.alert(
        'Upgrade to Pro',
        `Free plan allows up to ${FREE_PERSON_LIMIT} persons. Upgrade for unlimited.`,
      );
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
      console.error('[PersonFormScreen] save failed:', e);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditing ? 'Edit person' : 'New person'} showBack />

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

          {/* ── Hero card ── */}
          <View style={[styles.heroCard, { marginHorizontal: layout.screenPadding }]}>
            <View style={styles.heroTop}>
              <View style={[styles.initialsWrap, { backgroundColor: colorHex + '18' }]}>
                <Text style={[styles.initialsText, { color: colorHex }]}>{initials}</Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {nameValue.trim() || 'Person name'}
                </Text>
                <Text style={styles.heroSub}>Choose accent color below</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            {/* Inline color palette */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {PALETTE_COLORS.map((hex) => {
                const isSelected = colorHex === hex;
                return (
                  <Pressable
                    key={hex}
                    onPress={() => setColorHex(hex)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: hex },
                      isSelected && styles.colorDotSelected,
                    ]}
                  >
                    {isSelected && (
                      <HugeiconsIcon icon={CheckIcon} size={12} color="#fff" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Contact details card ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>Contact details</Text>
            <View style={styles.fieldCard}>

              {/* Name */}
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Required',
                  minLength: { value: 2, message: 'Min 2 characters' },
                  maxLength: { value: 60, message: 'Max 60 characters' },
                }}
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Jane Smith"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={[styles.fieldInput, errors.name && styles.fieldInputError]}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                )}
              />

              <View style={styles.fieldDivider} />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                rules={{
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                }}
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      ref={emailRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="jane@example.com"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={[styles.fieldInput, errors.email && styles.fieldInputError]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                    />
                  </View>
                )}
              />

              <View style={styles.fieldDivider} />

              {/* Phone */}
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Phone</Text>
                    <TextInput
                      ref={phoneRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="+1 234 567 8900"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={styles.fieldInput}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => designationRef.current?.focus()}
                    />
                  </View>
                )}
              />
            </View>
            {(errors.name || errors.email) && (
              <Text style={styles.errorText}>
                {errors.name?.message ?? errors.email?.message}
              </Text>
            )}
          </View>

          {/* ── Work details card ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>Work (optional)</Text>
            <View style={styles.fieldCard}>

              {/* Designation */}
              <Controller
                control={control}
                name="designation"
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Role</Text>
                    <TextInput
                      ref={designationRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Manager"
                      placeholderTextColor={colors.textMuted + '60'}
                      style={styles.fieldInput}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => companyRef.current?.focus()}
                    />
                  </View>
                )}
              />

              <View style={styles.fieldDivider} />

              {/* Company */}
              <Controller
                control={control}
                name="company"
                render={({ field }) => (
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Company</Text>
                    <TextInput
                      ref={companyRef}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Acme Inc."
                      placeholderTextColor={colors.textMuted + '60'}
                      style={styles.fieldInput}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  </View>
                )}
              />
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save person' : 'Add person'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    initialsWrap: {
      width: 72,
      height: 72,
      borderRadius: radius('xl'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      fontFamily: typography.styles.profileMono.fontFamily,
      fontSize: 28,
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
    colorRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    colorDot: {
      width: 26,
      height: 26,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorDotSelected: {
      ...shadow('sm'),
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

    // ── Field card
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
      width: 64,
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
      marginLeft: spacing('4') + 64 + spacing('3'),
    },
    errorText: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.danger,
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
