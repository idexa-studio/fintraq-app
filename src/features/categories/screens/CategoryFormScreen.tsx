import { GridIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { IconPickerBottomSheet } from '@/src/components/ui/IconPickerBottomSheet';
import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { CATEGORY_COLORS, CATEGORY_ICON_GROUPS, CATEGORY_ICONS } from '@/src/constants/picker';
import { ColorPickerRow } from '@/src/components/ui/ColorPickerRow';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/src/features/categories/hooks/categories';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

type CategoryFormValues = {
  name: string;
};

type TxType = 'CR' | 'DR' | 'TR';

const TYPE_OPTIONS: { value: TxType; label: string }[] = [
  { value: 'DR', label: 'Expense' },
  { value: 'CR', label: 'Income' },
  { value: 'TR', label: 'Transfer' },
];

export const CategoryFormScreen = React.memo(function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { colors, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: categories } = useCategories();
  const category = useMemo(
    () => (id ? categories?.find((c) => c.id === Number(id)) : undefined),
    [id, categories],
  );
  const isEditing = !!category;

  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateCategory } = useUpdateCategory();

  const [selectedTypes, setSelectedTypes] = useState<Set<TxType>>(new Set(['DR']));
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [colorHex, setColorHex] = useState<string>(
    () => CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
  );
  const [showIconPicker, setShowIconPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const categoryName = watch('name');

  useEffect(() => {
    if (category) {
      reset({ name: category.name });
      const parsed = category.type.split(',').filter((t): t is TxType => ['CR', 'DR', 'TR'].includes(t));
      setSelectedTypes(new Set(parsed.length > 0 ? parsed : ['DR']));
      setIcon(typeof category.icon === 'string' ? category.icon : CATEGORY_ICONS[0]);
      setColorHex(colorNumberToHex(category.color).toUpperCase());
    }
  }, [category, reset]);

  const resolvedIcon = useMemo(() => resolveIcon(icon, GridIcon), [icon]);

  const toggleType = useCallback((t: TxType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size === 1) return prev; // must keep at least one
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }, []);

  const typeString = useMemo(
    () => (['DR', 'CR', 'TR'] as TxType[]).filter(t => selectedTypes.has(t)).join(','),
    [selectedTypes],
  );

  const primaryType = selectedTypes.has('DR') ? 'DR' : selectedTypes.has('CR') ? 'CR' : 'TR';
  const typeColor = primaryType === 'DR' ? colors.danger : primaryType === 'CR' ? colors.success : colors.primary;
  const typeLabel = Array.from(selectedTypes).map(t => TYPE_OPTIONS.find(o => o.value === t)?.label).join(', ');

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      type: typeString,
      icon,
      color: toDbColor(colorHex),
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
      <Header title={isEditing ? 'Edit category' : 'New category'} showBack />

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
          <Pressable
            style={[styles.heroCard, { marginHorizontal: layout.screenPadding }]}
            onPress={() => setShowIconPicker(true)}
          >
            <View style={styles.heroTop}>
              <IconAvatar icon={resolvedIcon} color={colorHex} variant="solid" size={72} iconSize={32} />
              <View style={styles.heroMeta}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {categoryName.trim() || 'Category name'}
                </Text>
                <Text style={[styles.heroSub, { color: typeColor }]}>
                  {typeLabel}
                </Text>
                <Text style={styles.heroHint}>Tap to change icon</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />
            <ColorPickerRow colors={CATEGORY_COLORS} value={colorHex} onChange={setColorHex} />
          </Pressable>

          {/* ── Type selector (multi-select) ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>Applies to</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = selectedTypes.has(opt.value);
                const activeColor =
                  opt.value === 'DR' ? colors.danger :
                  opt.value === 'CR' ? colors.success :
                  colors.primary;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => toggleType(opt.value)}
                    style={[
                      styles.typePill,
                      isSelected && { backgroundColor: activeColor + '20', borderColor: activeColor + '40' },
                    ]}
                  >
                    <Text style={[styles.typePillText, isSelected && { color: activeColor }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Name field ── */}
          <View style={[styles.sectionGap, { paddingHorizontal: layout.screenPadding }]}>
            <Text style={styles.sectionLabel}>Category name</Text>
            <View style={styles.fieldCard}>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Required',
                  minLength: { value: 2, message: 'Min 2 characters' },
                  maxLength: { value: 50, message: 'Max 50 characters' },
                }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g. Groceries, Salary"
                    placeholderTextColor={colors.textMuted + '60'}
                    style={[styles.nameInput, errors.name && { color: colors.danger }]}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                )}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={styles.primaryBtnText}>
              {isEditing ? 'Save category' : 'Create category'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <IconPickerBottomSheet
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        value={icon}
        onChange={setIcon}
        groups={CATEGORY_ICON_GROUPS}
        accentColor={colorHex}
        title="Choose icon"
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
      gap: spacing('0.5'),
    },
    heroName: {
      fontFamily: typography.styles.profileName.fontFamily,
      fontSize: 18,
      color: colors.text,
    },
    heroSub: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: 13,
    },
    heroHint: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing('1'),
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

    // ── Type
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
    },
    typePill: {
      flex: 1,
      height: 40,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
    },
    typePillText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: 13,
      color: colors.textMuted,
    },
    // ── Name field
    fieldCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
    },
    nameInput: {
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
      minHeight: 52,
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
