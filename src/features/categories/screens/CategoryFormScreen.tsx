import { GridIcon } from '@hugeicons/core-free-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ColorPickerRow } from '@/src/components/pickers/ColorPickerRow';
import { IconPickerBottomSheet } from '@/src/components/pickers/IconPickerBottomSheet';
import { BentoPressable, Button, Card, Chip, FormField, Icon, IconAvatar, ListGroup, Screen, Text } from '@/src/components/ui';
import { DotsThreeIcon, PencilSimpleIcon } from '@/src/components/ui/icons';
import { CATEGORY_COLORS, CATEGORY_ICON_GROUPS, CATEGORY_ICONS } from '@/src/constants/picker';
import { useCategories, useCreateCategory, useUpdateCategory } from '@/src/features/categories/hooks/categories';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { LoggerService } from '@/src/services/logger.service';
import { colorNumberToHex, toDbColor } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';

// Common picks shown inline so most people never need the full icon sheet.
const QUICK_ICONS = ['shopping-basket', 'fork', 'coffee', 'car', 'home', 'shopping-bag', 'flash', 'heart-pulse', 'airplane', 'gift', 'cash', 'wallet', 'receipt-text', 'school'];
const QUICK_COLUMNS = 7;

type CategoryFormValues = {
  name: string;
};

type TxType = 'CR' | 'DR' | 'TR';

const TYPE_OPTIONS: { value: TxType; label: 'expense' | 'income' | 'transfer' }[] = [
  { value: 'DR', label: 'expense' },
  { value: 'CR', label: 'income' },
  { value: 'TR', label: 'transfer' },
];

export const CategoryFormScreen = React.memo(function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, layout } = theme;
  const { width } = useWindowDimensions();
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

  const typeColor = (type: TxType) => (type === 'DR' ? colors.danger : type === 'CR' ? colors.success : colors.info);
  const typeLabel = (['DR', 'CR', 'TR'] as TxType[])
    .filter((type) => selectedTypes.has(type))
    .map((type) => t(`categoryForm.${TYPE_OPTIONS.find((o) => o.value === type)!.label}`))
    .join(' · ');

  // Quick-pick row: the current icon first (if it isn't a quick pick), then the
  // common ones, trimmed so the last cell is always "More".
  const quickIcons = useMemo(() => {
    const list = QUICK_ICONS.includes(icon) ? QUICK_ICONS : [icon, ...QUICK_ICONS];
    return list.slice(0, QUICK_COLUMNS * 2 - 1);
  }, [icon]);
  const cell = Math.floor((width - layout.screenPadding * 2 - 8 * (QUICK_COLUMNS - 1)) / QUICK_COLUMNS);

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
      LoggerService.error('CATEGORY_FORM', 'Failed to save category', error);
    }
  });

  return (
    <Screen
      header={{ title: isEditing ? t('categoryForm.edit') : t('categoryForm.new'), showBack: true }}
      keyboardAvoiding
      footer={
        <Button
          title={isEditing ? t('categoryForm.save') : t('categoryForm.create')}
          onPress={handleSave}
          disabled={!isValid}
          size="lg"
          fullWidth
        />
      }
      overlays={
        <IconPickerBottomSheet
          visible={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          value={icon}
          onChange={setIcon}
          groups={CATEGORY_ICON_GROUPS}
          accentColor={colorHex}
          title={t('categoryForm.chooseIcon')}
        />
      }
    >
      {/* Preview — only the icon tile opens the picker, so taps elsewhere never surprise */}
      <Card style={styles.preview}>
        <View style={styles.previewTop}>
          <BentoPressable
            onPress={() => setShowIconPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={t('categoryForm.chooseIcon')}
            style={styles.previewIcon}
          >
            <IconAvatar icon={resolvedIcon} color={colorHex} size={64} iconSize={30} />
            <View style={[styles.editBadge, { backgroundColor: colors.text }]}>
              <Icon icon={PencilSimpleIcon} size={12} color={colors.surface} weight="bold" />
            </View>
          </BentoPressable>
          <View style={styles.previewMeta}>
            <Text variant="subheading" numberOfLines={1}>{categoryName.trim() || t('categoryForm.categoryName')}</Text>
            <Text variant="callout" tone="muted" numberOfLines={1}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.previewColors}>
          <ColorPickerRow colors={CATEGORY_COLORS} value={colorHex} onChange={setColorHex} />
        </View>
      </Card>

      <ListGroup insetDividers={false}>
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
              label={t('categoryForm.categoryName')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.isTouched ? errors.name?.message : undefined}
              placeholder={t('categoryForm.namePlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={50}
            />
          )}
        />
      </ListGroup>

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>{t('categoryForm.chooseIcon')}</Text>
        <View style={styles.iconGrid}>
          {quickIcons.map((key) => {
            const selected = key === icon;
            return (
              <BentoPressable
                key={key}
                onPress={() => setIcon(key)}
                accessibilityRole="button"
                accessibilityLabel={key.replace(/-/g, ' ')}
                accessibilityState={{ selected }}
                style={[styles.iconCell, { width: cell, height: cell, backgroundColor: selected ? colorHex : colors.surface }]}
              >
                <Icon icon={resolveIcon(key, GridIcon)} size={20} color={selected ? colors.onColor : colors.text} />
              </BentoPressable>
            );
          })}
          <BentoPressable
            onPress={() => setShowIconPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={t('categoryForm.moreIcons')}
            style={[styles.iconCell, { width: cell, height: cell, backgroundColor: colors.surface }]}
          >
            <Icon icon={DotsThreeIcon} size={20} color={colors.textMuted} weight="bold" />
          </BentoPressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted" style={styles.sectionLabel}>{t('categoryForm.appliesTo')}</Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={t(`categoryForm.${opt.label}`)}
              color={typeColor(opt.value)}
              isActive={selectedTypes.has(opt.value)}
              onPress={() => toggleType(opt.value)}
            />
          ))}
        </View>
        <Text variant="caption" tone="muted" style={styles.sectionLabel}>{t('categoryForm.appliesToHint')}</Text>
      </View>
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius }: ThemeContextType) =>
  StyleSheet.create({
    preview: { padding: 0 },
    previewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('4'), padding: spacing('4') },
    previewIcon: { borderRadius: Math.round(64 * 0.3), overflow: 'visible' },
    editBadge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 24,
      height: 24,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewMeta: { flex: 1, gap: spacing('0.5') },
    previewColors: { marginTop: -spacing('3') },
    section: { gap: spacing('2') },
    sectionLabel: { marginHorizontal: spacing('1') },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    iconCell: { borderRadius: radius('md'), alignItems: 'center', justifyContent: 'center' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
  });
