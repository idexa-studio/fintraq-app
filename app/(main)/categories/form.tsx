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
    answerInput: {
      fontFamily: typography.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
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
    typeTabsRow: {
      flexDirection: 'row',
      gap: 6,
      alignSelf: 'flex-start',
    },
    typeTab: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: colors.background + 'AA',
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeTabActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    typeTabText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
    typeTabTextActive: {
      color: colors.background,
    },
    lockHint: {
      marginTop: 8,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
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
      <Header
        title={isEditing ? 'Edit Category' : 'New Category'}
       
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
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeTabsRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => !isEditing && setType('DR')}
                disabled={isEditing}
                style={[styles.typeTab, type === 'DR' && styles.typeTabActive]}
              >
                <Text style={[styles.typeTabText, type === 'DR' && styles.typeTabTextActive]}>
                  EXPENSE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => !isEditing && setType('CR')}
                disabled={isEditing}
                style={[styles.typeTab, type === 'CR' && styles.typeTabActive]}
              >
                <Text style={[styles.typeTabText, type === 'CR' && styles.typeTabTextActive]}>
                  INCOME
                </Text>
              </TouchableOpacity>
            </View>
            {isEditing && (
              <Text style={styles.lockHint}>Type cannot be changed for existing categories</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
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
                  style={styles.answerInput}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
            />
            <View style={[styles.answerLine, errors.name && styles.answerLineError]} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Icon</Text>
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

          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.label}>Color</Text>
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save Category' : 'Create Category'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});
