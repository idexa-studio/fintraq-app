import { Calendar03Icon, CancelCircleIcon, Tag01Icon } from '@hugeicons/core-free-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, FormField, IconButton, ListGroup, SheetHeader, Text } from '@/src/components/ui';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { Account } from '@/src/features/accounts/api/accounts';
import { Category } from '@/src/features/categories/api/categories';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '@/src/features/filters/api/advanced-filters.service';
import { Person } from '@/src/features/persons/api/persons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { AccountType, TransactionType } from '@/src/types';
import { parseAmountInput } from '@/src/utils/amount';
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

const PRESETS = ['today', 'week', 'month', 'last30'] as const;
type Preset = (typeof PRESETS)[number];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Whole local days, weeks starting Monday. */
function presetRange(preset: Preset, now: Date): { startDate: Date; endDate: Date } {
  const endDate = endOfDay(now);
  switch (preset) {
    case 'today':
      return { startDate: startOfDay(now), endDate };
    case 'week': {
      const sinceMonday = (now.getDay() + 6) % 7;
      return { startDate: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday)), endDate };
    }
    case 'month':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate };
    case 'last30':
      return { startDate: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), endDate };
  }
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

  const minValue = parseAmountInput(minAmt);
  const maxValue = parseAmountInput(maxAmt);
  const amountError = useMemo(() => {
    if ((minAmt.trim() && minValue === null) || (maxAmt.trim() && maxValue === null)) return t('forms.invalidAmount');
    if (minValue !== null && maxValue !== null && minValue > maxValue) return t('filters.minLessThanMax');
    return null;
  }, [minAmt, maxAmt, minValue, maxValue, t]);

  // A category can serve several types ("DR,CR" — e.g. Others), so match any of them.
  const scopedCategories = useMemo(() => {
    const types = local.types;
    const matching = !types || types.length === 0 ? categories : categories.filter((c) => c.type.split(',').some((type) => types.includes(type as TransactionType)));
    // The user's own categories first, system catch-alls (Others) last — same order as the entry form.
    return [...matching].sort((a, b) => Number(a.isSystem) - Number(b.isSystem));
  }, [categories, local.types]);

  const activePreset = useMemo(() => {
    const range = local.dateRange;
    if (!range) return null;
    return PRESETS.find((preset) => {
      const expected = presetRange(preset, new Date());
      return sameDay(expected.startDate, range.startDate) && sameDay(expected.endDate, range.endDate);
    }) ?? null;
  }, [local.dateRange]);

  // A range the presets don't describe was picked by hand.
  const customRange = local.dateRange && !activePreset ? local.dateRange : null;

  const applyPreset = useCallback((preset: Preset) => {
    Haptics.selectionAsync().catch(() => {});
    setLocal((p) => ({ ...p, dateRange: presetRange(preset, new Date()) }));
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

  // Pickers give a moment in time; a range is whole days. Copies only — never mutate state.
  const setRangeEdge = useCallback((edge: 'start' | 'end', picked: Date) => {
    Haptics.selectionAsync().catch(() => {});
    setLocal((p) => {
      const current = p.dateRange ?? { startDate: startOfDay(picked), endDate: endOfDay(picked) };
      const start = edge === 'start' ? picked : current.startDate;
      const end = edge === 'end' ? picked : current.endDate;
      // Picking an edge past the other one swaps them rather than making an empty range.
      const [from, to] = start > end ? [end, start] : [start, end];
      return { ...p, dateRange: { startDate: startOfDay(from), endDate: endOfDay(to) } };
    });
  }, []);

  const onStartDate = useCallback((event: DateTimePickerEvent, picked?: Date) => {
    setShowStart(false);
    if (event.type === 'set' && picked) {
      setRangeEdge('start', picked);
      setShowEnd(true);
    }
  }, [setRangeEdge]);

  const onEndDate = useCallback((event: DateTimePickerEvent, picked?: Date) => {
    setShowEnd(false);
    if (event.type === 'set' && picked) setRangeEdge('end', picked);
  }, [setRangeEdge]);

  const handleApply = useCallback(() => {
    if (amountError) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const hasAmount = minValue !== null || maxValue !== null;
    onApply({ ...local, amountRange: hasAmount ? { min: minValue ?? undefined, max: maxValue ?? undefined } : undefined });
    onClose();
  }, [local, minValue, maxValue, amountError, onApply, onClose]);

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
  const presetLabels: Record<Preset, string> = {
    today: t('filters.today'),
    week: t('filters.thisWeek'),
    month: t('filters.thisMonth'),
    last30: t('filters.last30'),
  };

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
            {PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={presetLabels[preset]}
                isActive={activePreset === preset}
                // Tapping the active preset again clears the range.
                onPress={() => (activePreset === preset ? clearDateRange() : applyPreset(preset))}
                on="surface"
              />
            ))}
            <Chip
              label={customRange ? `${fmt(customRange.startDate)} – ${fmt(customRange.endDate)}` : t('filters.setDateRange')}
              icon={Calendar03Icon}
              isActive={!!customRange}
              onPress={() => setShowStart(true)}
              on="surface"
            />
            {customRange ? (
              <IconButton icon={CancelCircleIcon} variant="ghost" size="sm" onPress={clearDateRange} accessibilityLabel={t('filters.reset')} />
            ) : null}
          </FilterSection>

          <FilterSection title={t('filters.amount')}>
            <View style={styles.amountRow}>
              <ListGroup insetDividers={false} style={styles.amountField}>
                <FormField label={t('filters.min')} value={minAmt} onChangeText={setMinAmt} keyboardType="decimal-pad" placeholder="0" returnKeyType="done" />
              </ListGroup>
              <ListGroup insetDividers={false} style={styles.amountField}>
                <FormField label={t('filters.max')} value={maxAmt} onChangeText={setMaxAmt} keyboardType="decimal-pad" placeholder={t('filters.any')} returnKeyType="done" />
              </ListGroup>
            </View>
            {amountError ? (
              <Text variant="caption" tone="danger" style={styles.amountError}>
                {amountError}
              </Text>
            ) : null}
          </FilterSection>

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
    amountRow: { flexDirection: 'row', gap: spacing('2'), width: '100%' },
    amountField: { flex: 1, borderRadius: radius('xl'), borderWidth: StyleSheet.hairlineWidth, borderColor: alpha(colors.text, 'soft') },
    amountError: { marginTop: spacing('2'), marginLeft: spacing('1'), width: '100%' },
    footer: { paddingHorizontal: layout.screenPadding, paddingVertical: spacing('3'), backgroundColor: colors.surface },
  });
