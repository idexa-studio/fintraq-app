import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/src/constants/picker';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/src/features/categories/hooks/categories';

type CategoryFormValues = {
  name: string;
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
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    typePillExpense: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    typePillIncome: {
      backgroundColor: colors.success,
      borderColor: colors.success,
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
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2.5'),
    },
    iconCell: {
      width: 44,
      height: 44,
      borderRadius: radius('full'),
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

export default React.memo(function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { colors, onAccent } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: categories } = useCategories();
  const category = useMemo(
    () => (id ? categories?.find((c) => c.id === Number(id)) : undefined),
    [id, categories],
  );
  const isEditing = !!category;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(CATEGORY_COLORS[0]);

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
      <BlurBackground />
      <Header title={isEditing ? 'Edit Category' : 'New Category'} showBack />

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
              <Text style={styles.sectionLabel}>TYPE</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('DR')}
                  disabled={isEditing}
                  style={[styles.typePill, type === 'DR' && styles.typePillExpense]}
                >
                  <Text style={[styles.typePillText, type === 'DR' && styles.typePillTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => !isEditing && setType('CR')}
                  disabled={isEditing}
                  style={[styles.typePill, type === 'CR' && styles.typePillIncome]}
                >
                  <Text style={[styles.typePillText, type === 'CR' && styles.typePillTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
              {isEditing && (
                <Text style={styles.lockHint}>Type cannot be changed for existing categories.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NAME</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Category name is required' }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Groceries"
                    placeholderTextColor={colors.textMuted + '50'}
                    autoFocus={!isEditing}
                    style={[styles.fieldInput, errors.name && { borderColor: colors.danger }]}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ICON</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIcon(item)}
                    style={[
                      styles.iconCell,
                      icon === item && { backgroundColor: colorHex, borderColor: colorHex },
                    ]}
                  >
                    <Ionicons
                      name={resolveIcon(item, 'grid-outline')}
                      size={18}
                      color={icon === item ? onAccent : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>COLOR</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((item) => (
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
            {isEditing ? 'Save category' : 'Create category'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});
