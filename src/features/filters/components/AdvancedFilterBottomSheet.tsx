import { Calendar03Icon, CancelCircleIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, FormField, IconButton, ListGroup, ListItem, SheetHeader, Text } from '@/src/components/ui';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { Account } from '@/src/features/accounts/api/accounts';
import { Category } from '@/src/features/categories/api/categories';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '@/src/features/filters/api/advanced-filters.service';
import { Person } from '@/src/features/persons/api/persons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';

interface AdvancedFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
  persons: Person[];
}

const TYPE_OPTS = [
  { key: 'CR', label: 'income', colorKey: 'success' },
  { key: 'DR', label: 'expense', colorKey: 'danger' },
  { key: 'TR', label: 'transfer', colorKey: 'info' },
] as const;

export const AdvancedFilterBottomSheet = React.memo(function AdvancedFilterBottomSheet({
  visible, onClose, filters, onApply, onReset, accounts, categories, persons,
}: AdvancedFilterBottomSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;

  const [local, setLocal] = useState<AdvancedFilters>(filters);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const bottomSheet = useBottomSheet();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const amountError = useMemo(() => {
    const mn = minAmt ? parseFloat(minAmt) : undefined;
    const mx = maxAmt ? parseFloat(maxAmt) : undefined;
    if (mn !== undefined && mx !== undefined && mn > mx) return t('filters.minLessThanMax');
    return null;
  }, [minAmt, maxAmt, t]);

  const scopedCategories = useMemo(() => {
    if (!local.types || local.types.length === 0) return categories;
    return categories.filter(c => local.types!.includes(c.type as TransactionType));
  }, [categories, local.types]);

  const applyPreset = useCallback((preset: 'today' | 'week' | 'month' | 'last30') => {
    Haptics.selectionAsync().catch(() => {});
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);
    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'week') {
      const day = now.getDay();
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      start.setHours(0, 0, 0, 0);
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }
    setLocal(p => ({ ...p, dateRange: { startDate: start, endDate: end } }));
  }, []);

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      setMinAmt(filters.amountRange?.min?.toString() || '');
      setMaxAmt(filters.amountRange?.max?.toString() || '');
    }
  }, [visible, filters]);

  const toggle = useCallback(<T,>(arr: T[] | undefined, v: T): T[] => {
    const a = arr || [];
    return a.includes(v) ? a.filter(x => x !== v) : [...a, v];
  }, []);

  const toggleAccount = useCallback((id: number) => {
    Haptics.selectionAsync().catch(() => { });
    setLocal(p => ({ ...p, accountIds: toggle(p.accountIds, id) }));
  }, [toggle]);
  const toggleCategory = useCallback((id: number) => {
    Haptics.selectionAsync().catch(() => { });
    setLocal(p => ({ ...p, categoryIds: toggle(p.categoryIds, id) }));
  }, [toggle]);
  const togglePerson = useCallback((id: number) => {
    Haptics.selectionAsync().catch(() => { });
    setLocal(p => ({ ...p, personIds: toggle(p.personIds, id) }));
  }, [toggle]);
  const toggleType = useCallback((t: TransactionType) => {
    Haptics.selectionAsync().catch(() => { });
    setLocal(p => ({ ...p, types: toggle(p.types, t) }));
  }, [toggle]);
  const clearDateRange = useCallback(() => {
    Haptics.selectionAsync().catch(() => { });
    setLocal(p => ({ ...p, dateRange: undefined }));
  }, []);

  const onStartDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowStart(false);
    if (d) {
      Haptics.selectionAsync().catch(() => {});
      setLocal(p => {
        const end = p.dateRange?.endDate ?? new Date();
        // Auto-swap: if new start is after existing end, swap them
        const [resolvedStart, resolvedEnd] = d > end ? [end, d] : [d, end];
        resolvedEnd.setHours(23, 59, 59, 999);
        return { ...p, dateRange: { startDate: resolvedStart, endDate: resolvedEnd } };
      });
    }
  }, []);

  const onEndDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowEnd(false);
    if (d) {
      Haptics.selectionAsync().catch(() => {});
      d.setHours(23, 59, 59, 999);
      setLocal(p => {
        const start = p.dateRange?.startDate ?? new Date();
        // Auto-swap: if new end is before existing start, swap them
        const [resolvedStart, resolvedEnd] = d < start ? [d, start] : [start, d];
        resolvedEnd.setHours(23, 59, 59, 999);
        return { ...p, dateRange: { startDate: resolvedStart, endDate: resolvedEnd } };
      });
    }
  }, []);

  const handleApply = useCallback(() => {
    if (amountError) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const mn = minAmt ? parseFloat(minAmt) : undefined;
    const mx = maxAmt ? parseFloat(maxAmt) : undefined;
    onApply({ ...local, amountRange: (mn !== undefined || mx !== undefined) ? { min: mn, max: mx } : undefined });
    onClose();
  }, [local, minAmt, maxAmt, amountError, onApply, onClose]);

  const handleReset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    setLocal(DEFAULT_ADVANCED_FILTERS);
    setMinAmt('');
    setMaxAmt('');
    onReset();
  }, [onReset]);

  const activeCount = useMemo(() =>
    (local.accountIds?.length || 0) +
    (local.categoryIds?.length || 0) +
    (local.personIds?.length || 0) +
    (local.types?.length || 0) +
    (local.dateRange ? 1 : 0) +
    (minAmt || maxAmt ? 1 : 0) +
    (local.searchQuery?.trim() ? 1 : 0),
    [local, minAmt, maxAmt]
  );

  const fmt = (d: Date) => formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
  const snapPoints = useMemo(() => ['90%'], []);
  const presets = [
    { key: 'today', label: t('filters.today') },
    { key: 'week', label: t('filters.thisWeek') },
    { key: 'month', label: t('filters.thisMonth') },
    { key: 'last30', label: t('filters.last30') },
  ] as const;

  return (
    <BentoBottomSheet visible={visible} onClose={onClose} snapPoints={snapPoints} keyboardBehavior="interactive">
      <View style={styles.fill}>
        <SheetHeader
          title={t('filters.title')}
          subtitle={activeCount > 0 ? t('filters.activeCount', { count: activeCount }) : undefined}
          trailing={activeCount > 0 ? <Button title={t('filters.reset')} variant="ghost" size="sm" onPress={handleReset} /> : undefined}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        >
          <FilterSection title={t('filters.type')}>
            {TYPE_OPTS.map((opt) => (
              <Chip
                key={opt.key}
                label={t(`transactions.${opt.label}`)}
                color={colors[opt.colorKey]}
                isActive={local.types?.includes(opt.key) ?? false}
                onPress={() => toggleType(opt.key)}
                on="surface"
              />
            ))}
          </FilterSection>

          <FilterSection title={t('filters.dateRange')}>
            {presets.map((preset) => (
              <Chip key={preset.key} label={preset.label} onPress={() => applyPreset(preset.key)} on="surface" />
            ))}
          </FilterSection>
          <ListGroup style={styles.group}>
            {local.dateRange ? (
              <ListItem icon={Calendar03Icon} iconColor={colors.primaryInk} title={t('filters.from')} value={fmt(local.dateRange.startDate)} onPress={() => setShowStart(true)} />
            ) : null}
            {local.dateRange ? (
              <ListItem
                icon={Calendar03Icon}
                iconColor={colors.primaryInk}
                title={t('filters.to')}
                value={fmt(local.dateRange.endDate)}
                onPress={() => setShowEnd(true)}
                trailing={<IconButton icon={CancelCircleIcon} variant="ghost" size="sm" onPress={clearDateRange} accessibilityLabel={t('filters.reset')} />}
              />
            ) : (
              <ListItem icon={Calendar03Icon} iconColor={colors.primaryInk} title={t('filters.setDateRange')} onPress={() => setShowStart(true)} />
            )}
          </ListGroup>

          <Text variant="label" tone="muted" style={styles.sectionTitle}>
            {t('filters.amount')}
          </Text>
          <ListGroup insetDividers={false} style={styles.group}>
            <FormField label={t('filters.min')} value={minAmt} onChangeText={setMinAmt} keyboardType="decimal-pad" placeholder="0.00" returnKeyType="done" />
            <FormField
              label={t('filters.max')}
              value={maxAmt}
              onChangeText={setMaxAmt}
              keyboardType="decimal-pad"
              placeholder={t('filters.any')}
              returnKeyType="done"
              error={amountError ?? undefined}
            />
          </ListGroup>

          {accounts.length > 0 ? (
            <FilterSection title={t('filters.accounts')}>
              {accounts.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  icon={resolveAccountTypeIcon(a.accountType as AccountType | null)}
                  color={colorNumberToHex(a.color)}
                  isActive={local.accountIds?.includes(a.id) ?? false}
                  onPress={() => toggleAccount(a.id)}
                  on="surface"
                />
              ))}
            </FilterSection>
          ) : null}

          {scopedCategories.length > 0 ? (
            <FilterSection title={local.types && local.types.length > 0 ? t('filters.categoriesByType') : t('filters.categories')}>
              {scopedCategories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  icon={resolveIcon(c.icon, Tag01Icon)}
                  color={colorNumberToHex(c.color)}
                  isActive={local.categoryIds?.includes(c.id) ?? false}
                  onPress={() => toggleCategory(c.id)}
                  on="surface"
                />
              ))}
            </FilterSection>
          ) : null}

          {persons.length > 0 ? (
            <FilterSection title={t('filters.persons')}>
              {persons.map((p) => (
                <Chip
                  key={p.id}
                  label={p.name}
                  color={colorNumberToHex(p.color)}
                  isActive={local.personIds?.includes(p.id) ?? false}
                  onPress={() => togglePerson(p.id)}
                  on="surface"
                />
              ))}
            </FilterSection>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button title={t('filters.apply')} onPress={handleApply} disabled={!!amountError} size="lg" fullWidth />
        </View>

        {showStart ? (
          <DateTimePicker value={local.dateRange?.startDate ?? new Date()} mode="date" display="default" onChange={onStartDate} maximumDate={new Date()} />
        ) : null}
        {showEnd ? (
          <DateTimePicker value={local.dateRange?.endDate ?? new Date()} mode="date" display="default" onChange={onEndDate} maximumDate={new Date()} />
        ) : null}
      </View>
    </BentoBottomSheet>
  );
});

/** A labelled, wrapping row of chips. */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View>
      <Text variant="label" tone="muted" style={{ marginTop: spacing('5'), marginBottom: spacing('2'), marginLeft: spacing('1') }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') }}>{children}</View>
    </View>
  );
}

const createStyles = ({ colors, spacing, radius, layout, alpha }: ThemeContextType) =>
  StyleSheet.create({
    fill: { flex: 1 },
    scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing('8') },
    // Rows share the sheet's surface colour, so an outline marks the group's edge.
    group: { marginTop: spacing('3'), borderRadius: radius('xl'), borderWidth: StyleSheet.hairlineWidth, borderColor: alpha(colors.text, 'soft') },
    sectionTitle: { marginTop: spacing('5'), marginLeft: spacing('1') },
    footer: { paddingHorizontal: layout.screenPadding, paddingVertical: spacing('3'), backgroundColor: colors.surface },
  });
