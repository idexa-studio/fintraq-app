import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ColorPickerBottomSheet } from '@/src/components/ui/ColorPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { Input } from '@/src/components/ui/Input';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { IconPickerBottomSheet } from '@/src/components/ui/IconPickerBottomSheet';
import { CATEGORY_COLORS, CATEGORY_ICON_GROUPS, CATEGORY_ICONS, PALETTE_COLOR_OPTIONS } from '@/src/constants/picker';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { GridIcon } from '@hugeicons/core-free-icons';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/src/features/categories/hooks/categories';

type CategoryFormValues = {
  name: string;
};

export const CategoryFormScreen = React.memo(function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: categories } = useCategories();
  const category = useMemo(
    () => (id ? categories?.find((c) => c.id === Number(id)) : undefined),
    [id, categories],
  );
  const isEditing = !!category;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [type, setType] = useState<'CR' | 'DR' | 'TR'>('DR');
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(() => CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name });
      setType(category.type);
      setIcon(typeof category.icon === 'string' ? category.icon : CATEGORY_ICONS[0]);
      setColorHex(colorNumberToHex(category.color).toUpperCase());
    }
  }, [category, reset]);

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      type,
      icon,
      color: parseInt(colorHex.replace('#', ''), 16),
    };
    try {
      if (isEditing && category) {
        await updateCategory({ id: category.id, data: payload });
      } else {
        await createCategory(payload);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title={isEditing ? 'Edit Category' : 'New Category'} showBack />

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

            {/* ── Type ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Type</Text>
              <View style={styles.typeRow}>
                <BentoPressable
                  onPress={() => !isEditing && setType('DR')}
                  disabled={isEditing}
                  style={[styles.typePill, type === 'DR' && styles.typePillExpense]}
                >
                  <Text style={[styles.typePillText, type === 'DR' && { color: theme.colors.danger }]}>
                    Expense
                  </Text>
                </BentoPressable>
                <BentoPressable
                  onPress={() => !isEditing && setType('CR')}
                  disabled={isEditing}
                  style={[styles.typePill, type === 'CR' && styles.typePillIncome]}
                >
                  <Text style={[styles.typePillText, type === 'CR' && { color: theme.colors.success }]}>
                    Income
                  </Text>
                </BentoPressable>
                <BentoPressable
                  onPress={() => !isEditing && setType('TR')}
                  disabled={isEditing}
                  style={[styles.typePill, type === 'TR' && styles.typePillTransfer]}
                >
                  <Text style={[styles.typePillText, type === 'TR' && { color: theme.colors.primary }]}>
                    Transfer
                  </Text>
                </BentoPressable>
              </View>
              {isEditing && (
                <Text style={styles.lockHint}>Type cannot be changed for existing categories.</Text>
              )}
            </View>

            {/* ── Name ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Category name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name must be 50 characters or less' },
                }}
                render={({ field }) => (
                  <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="e.g. Groceries, Salary" error={errors.name?.message} size="md" variant="filled" autoCapitalize="words" autoCorrect={false} returnKeyType="next" />
                )}
              />
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
                    icon={resolveIcon(icon, GridIcon)}
                    color={colorHex} variant="solid"
                    size={32}
                  />
                  <View style={styles.appearanceCardMeta}>
                    <Text style={styles.appearanceCardLabel}>Icon</Text>
                    <Text style={styles.appearanceCardHint} numberOfLines={1}>
                      {icon.replace('-outline', '')}
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
                    <Text style={styles.appearanceCardHint} numberOfLines={1}>
                      {colorHex}
                    </Text>
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
              {isEditing ? 'Save category' : 'Create category'}
            </Text>
          </BentoPressable>
        </View>
      </KeyboardAvoidingView>

      <IconPickerBottomSheet
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        value={icon}
        onChange={setIcon}
        groups={CATEGORY_ICON_GROUPS}
        accentColor={colorHex}
        title="Choose Icon"
      />

      <ColorPickerBottomSheet
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        value={colorHex}
        onChange={setColorHex}
        palette={PALETTE_COLOR_OPTIONS}
        title="Choose Color"
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
    body: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingTop: spacing('4'),
      paddingBottom: spacing('4'),
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
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2.5'),
    },
    typePill: {
      paddingHorizontal: spacing('4'),
      height: 36,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    typePillExpense: {
      backgroundColor: colors.danger + '18',
    },
    typePillIncome: {
      backgroundColor: colors.success + '18',
    },
    typePillTransfer: {
      backgroundColor: colors.primary + '18',
    },
    typePillText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
    },
    typePillTextActive: {
      color: colors.background,
    },
    lockHint: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
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
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });
