import { ColorPickerModal } from '@/src/components/ui/ColorPickerModal';
import { Header } from '@/src/components/ui/Header';
import { Input } from '@/src/components/ui/Input';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FREE_PERSON_LIMIT = 10;

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

function PersonInitialsPreview({ name, color }: { name: string; color: string }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
  return (
    <View style={{
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 24 }}>{initials}</Text>
    </View>
  );
}

export const PersonFormScreen = React.memo(function PersonFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isPremium } = usePremium();

  const { data: persons } = usePersons();
  const person = useMemo(
    () => (id ? persons?.find(p => p.id === Number(id)) : undefined),
    [id, persons],
  );
  const isEditing = !!person;

  const { mutateAsync: createPerson } = useCreatePerson();
  const { mutateAsync: updatePerson } = useUpdatePerson();

  const [colorHex, setColorHex] = useState(randomPaletteColor);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const openColorPicker = useCallback(() => setShowColorPicker(true), []);
  const closeColorPicker = useCallback(() => setShowColorPicker(false), []);

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
      Alert.alert('Upgrade to Pro', `Free plan allows up to ${FREE_PERSON_LIMIT} persons. Upgrade for unlimited.`);
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

  const { colors } = theme;

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditing ? 'Edit Person' : 'New Person'} showBack />

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar preview + color picker */}
          <View style={styles.avatarSection}>
            <PersonInitialsPreview name={nameValue} color={colorHex} />
            <TouchableOpacity
              style={[styles.colorBtn, { backgroundColor: colors.surface }]}
              onPress={openColorPicker}
              activeOpacity={0.8}
            >
              <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
              <Text style={styles.colorBtnText}>Change color</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formBody}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Full name</Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                  maxLength: { value: 60, message: 'Max 60 characters' },
                }}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g. Jane Smith"
                    error={errors.name?.message}
                    size="md"
                    variant="filled"
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Email</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                }}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="jane@example.com (optional)"
                    error={errors.email?.message}
                    size="md"
                    variant="filled"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Phone</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="+1 234 567 8900 (optional)"
                    size="md"
                    variant="filled"
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                )}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowCol}>
                <Text style={styles.sectionLabel}>Designation</Text>
                <Controller
                  control={control}
                  name="designation"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Manager (optional)"
                      size="md"
                      variant="filled"
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  )}
                />
              </View>
              <View style={styles.rowCol}>
                <Text style={styles.sectionLabel}>Company</Text>
                <Controller
                  control={control}
                  name="company"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Acme Inc. (optional)"
                      size="md"
                      variant="filled"
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  )}
                />
              </View>
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
              {isEditing ? 'Save person' : 'Add person'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ColorPickerModal
        visible={showColorPicker}
        onClose={closeColorPicker}
        value={colorHex}
        onChange={setColorHex}
        palette={PALETTE_COLOR_OPTIONS}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    body: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingTop: spacing('5'), paddingBottom: spacing('4') },

    avatarSection: {
      alignItems: 'center',
      gap: spacing('3'),
      marginBottom: spacing('6'),
    },
    colorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('2'),
      borderRadius: radius('full'),
    },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    colorBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },

    formBody: { gap: spacing('5') },
    section: { paddingHorizontal: layout.screenPadding, gap: spacing('2.5') },
    row: {
      flexDirection: 'row',
      gap: spacing('3'),
      paddingHorizontal: layout.screenPadding,
    },
    rowCol: { flex: 1, gap: spacing('2.5') },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      opacity: 0.6,
    },

    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('8'),
    },
    primaryBtn: {
      height: 52,
      borderRadius: radius('xl'),
      backgroundColor: colors.text,
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
