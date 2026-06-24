import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { PersonAvatar } from '@/src/components/ui/PersonAvatar';
import { BentoBottomSheet, useBottomSheet } from '@/src/components/ui/BottomSheet';
import { Account } from '@/src/features/accounts/api/accounts';
import { AccountType } from '@/src/types';
import { Category } from '@/src/features/categories/api/categories';
import { Person } from '@/src/features/persons/api/persons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { TransactionType } from '@/src/types';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon, resolveIcon } from '@/src/utils/icons';
import { ArrowRight01Icon, Calendar03Icon, CancelCircleIcon, Tag01Icon, Wallet05Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../api/advanced-filters.service';

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
  { key: 'CR' as const, label: 'Income', icon: 'arrow-down-circle-outline' as const, colorKey: 'success' as const },
  { key: 'DR' as const, label: 'Expense', icon: 'arrow-up-circle-outline' as const, colorKey: 'danger' as const },
  { key: 'TR' as const, label: 'Transfer', icon: 'swap-horizontal' as const, colorKey: 'info' as const },
] as const;

export const AdvancedFilterBottomSheet = React.memo(function AdvancedFilterBottomSheet({
  visible, onClose, filters, onApply, onReset, accounts, categories, persons,
}: AdvancedFilterBottomSheetProps) {
  const theme = useTheme();
  const { colors, typography } = theme;

  const [local, setLocal] = useState<AdvancedFilters>(filters);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const bottomSheet = useBottomSheet();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
      Haptics.selectionAsync().catch(() => { });
      setLocal(p => ({ ...p, dateRange: { startDate: d, endDate: p.dateRange?.endDate || new Date() } }));
    }
  }, []);

  const onEndDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowEnd(false);
    if (d) {
      Haptics.selectionAsync().catch(() => { });
      d.setHours(23, 59, 59, 999);
      setLocal(p => ({ ...p, dateRange: { startDate: p.dateRange?.startDate || new Date(), endDate: d } }));
    }
  }, []);

  const handleApply = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    const mn = minAmt ? parseFloat(minAmt) : undefined;
    const mx = maxAmt ? parseFloat(maxAmt) : undefined;
    onApply({ ...local, amountRange: (mn !== undefined || mx !== undefined) ? { min: mn, max: mx } : undefined });
    onClose();
  }, [local, minAmt, maxAmt, onApply, onClose]);

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

  const fmt = useCallback((d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), []);

  const snapPoints = useMemo(() => ['90%'], []);

  return (
    <BentoBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
    >
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
              Filters
            </Text>
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { fontFamily: typography.styles.badge.fontFamily, color: colors.background }]}>
                  {activeCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {activeCount > 0 && (
              <BentoPressable onPress={handleReset}>
                <Text style={[styles.resetText, { fontFamily: typography.styles.buttonLabel.fontFamily, color: colors.danger }]}>
                  Reset
                </Text>
              </BentoPressable>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onScroll={bottomSheet?.onScroll}
          scrollEventThrottle={16}
        >

          <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
            Type
          </Text>
          <View style={styles.typeRow}>
            {TYPE_OPTS.map(opt => {
              const sel = local.types?.includes(opt.key) || false;
              const c = colors[opt.colorKey];
              return (
                <BentoPressable
                  key={opt.key}
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: sel ? c + '18' : colors.card
                    }
                  ]}
                  onPress={() => toggleType(opt.key)}
                >
                  <Text style={[styles.typePillLabel, { fontFamily: typography.styles.chipLabel.fontFamily, color: sel ? c : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </BentoPressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
            Date range
          </Text>
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            {local.dateRange ? (
              <>
                <BentoPressable style={styles.groupRow} onPress={() => setShowStart(true)}>
                  <HugeiconsIcon icon={Calendar03Icon} size={16} color={colors.primary} />
                  <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    From
                  </Text>
                  <Text style={[styles.groupRowValue, { fontFamily: typography.styles.rowLabel.fontFamily, color: colors.text }]}>
                    {fmt(local.dateRange.startDate)}
                  </Text>
                </BentoPressable>
                <View style={[styles.groupSep, { backgroundColor: colors.text + '08' }]} />
                <BentoPressable style={styles.groupRow} onPress={() => setShowEnd(true)}>
                  <HugeiconsIcon icon={Calendar03Icon} size={16} color={colors.primary} />
                  <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    To
                  </Text>
                  <Text style={[styles.groupRowValue, { fontFamily: typography.styles.rowLabel.fontFamily, color: colors.text }]}>
                    {fmt(local.dateRange.endDate)}
                  </Text>
                  <BentoPressable onPress={clearDateRange} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <HugeiconsIcon icon={CancelCircleIcon} size={18} color={colors.textMuted} />
                  </BentoPressable>
                </BentoPressable>
              </>
            ) : (
              <BentoPressable style={[styles.groupRow, styles.groupRowPrompt]} onPress={() => setShowStart(true)}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} color={colors.primary} />
                <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Set date range
                </Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textMuted} style={styles.groupChevron} />
              </BentoPressable>
            )}
          </View>

          <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
            Amount
          </Text>
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            <View style={styles.groupRow}>
              <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Min
              </Text>
              <TextInput
                style={[styles.amountInput, { fontFamily: typography.styles.inputValue.fontFamily, color: colors.text }]}
                value={minAmt}
                onChangeText={setMinAmt}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '50'}
                returnKeyType="done"
                textAlign="right"
              />
            </View>
            <View style={[styles.groupSep, { backgroundColor: colors.text + '08' }]} />
            <View style={styles.groupRow}>
              <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                Max
              </Text>
              <TextInput
                style={[styles.amountInput, { fontFamily: typography.styles.inputValue.fontFamily, color: colors.text }]}
                value={maxAmt}
                onChangeText={setMaxAmt}
                keyboardType="decimal-pad"
                placeholder="Any"
                placeholderTextColor={colors.textMuted + '50'}
                returnKeyType="done"
                textAlign="right"
              />
            </View>
          </View>

          {accounts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                Accounts
              </Text>
              <View style={styles.pillGrid}>
                {accounts.map(a => {
                  const sel = local.accountIds?.includes(a.id) || false;
                  const ac = colorNumberToHex(a.color);
                  return (
                    <BentoPressable
                      key={a.id}
                      style={[styles.pill, { backgroundColor: sel ? ac + '18' : colors.card }]}
                      onPress={() => toggleAccount(a.id)}
                    >
                      <HugeiconsIcon icon={resolveAccountTypeIcon(a.accountType as AccountType | null)} size={16} color={ac} />
                      <Text style={[styles.pillLabel, { color: sel ? ac : colors.text }]}>
                        {a.name}
                      </Text>
                    </BentoPressable>
                  );
                })}
              </View>
            </>
          )}

          {categories.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                Categories
              </Text>
              <View style={styles.pillGrid}>
                {categories.map(c => {
                  const sel = local.categoryIds?.includes(c.id) || false;
                  const cc = colorNumberToHex(c.color);
                  return (
                    <BentoPressable
                      key={c.id}
                      style={[styles.pill, { backgroundColor: sel ? cc + '18' : colors.card }]}
                      onPress={() => toggleCategory(c.id)}
                    >
                      <HugeiconsIcon icon={resolveIcon(c.icon, Tag01Icon)} size={16} color={cc} />
                      <Text style={[styles.pillLabel, { color: sel ? cc : colors.text }]}>
                        {c.name}
                      </Text>
                    </BentoPressable>
                  );
                })}
              </View>
            </>
          )}

          {persons.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { fontFamily: typography.styles.sectionLabel.fontFamily, color: colors.textMuted }]}>
                Persons
              </Text>
              <View style={styles.pillGrid}>
                {persons.map(p => {
                  const sel = local.personIds?.includes(p.id) || false;
                  const pc = colorNumberToHex(p.color);
                  return (
                    <BentoPressable
                      key={p.id}
                      style={[styles.pill, { backgroundColor: sel ? pc + '18' : colors.card }]}
                      onPress={() => togglePerson(p.id)}
                    >
                      <PersonAvatar name={p.name} color={pc} size={16} variant="solid" />
                      <Text style={[styles.pillLabel, { color: sel ? pc : colors.text }]}>
                        {p.name.split(' ')[0]}
                      </Text>
                    </BentoPressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Footer ── */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <BentoPressable
            style={[styles.applyBtn, { backgroundColor: colors.text }]}
            onPress={handleApply}
          >
            <Text style={[styles.applyLabel, { fontFamily: typography.styles.buttonLabel.fontFamily, color: colors.background }]}>
              Apply filters
            </Text>
          </BentoPressable>
        </View>

        {showStart && (
          <DateTimePicker
            value={local.dateRange?.startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDate}
            maximumDate={new Date()}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={local.dateRange?.endDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDate}
            maximumDate={new Date()}
          />
        )}
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    title: { fontSize: 22 },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('1'),
    },
    badgeText: { fontSize: 10 },
    resetText: { fontSize: typography.sizes.sm },
    scroll: {
      paddingTop: spacing('3'),
    },
    sectionTitle: {
      fontSize: 12,
      opacity: 0.7,
      marginBottom: spacing('2'),
      marginTop: spacing('5'),
      paddingLeft: spacing('0.5'),
      marginHorizontal: layout.screenPadding,
    },
    typeRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginHorizontal: layout.screenPadding,
    },
    typePill: {
      flex: 1,
      height: 36,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typePillLabel: { fontSize: 13 },
    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginHorizontal: layout.screenPadding,
    },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      height: 52,
      gap: spacing('3'),
    },
    groupRowPrompt: {
      height: 52,
    },
    groupRowLabel: { fontSize: typography.sizes.sm },
    groupRowValue: { flex: 1, fontSize: typography.sizes.sm, textAlign: 'right' },
    groupChevron: { marginLeft: 'auto' },
    groupSep: { height: 1, marginHorizontal: spacing('4') },
    amountInput: {
      flex: 1,
      fontSize: typography.sizes.md,
      padding: 0,
      textAlign: 'right',
    },
    pillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2'),
      marginHorizontal: layout.screenPadding,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      paddingHorizontal: spacing('3'),
      height: 36,
      borderRadius: radius('full'),
    },
    pillLabel: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
    },
    inlineToggles: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    toggleSep: { fontSize: typography.sizes.xs, opacity: 0.4 },
    toggleOption: { fontSize: typography.sizes.sm },
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: spacing('3'),
    },
    applyBtn: {
      height: 52,
      borderRadius: radius('lg'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyLabel: { fontSize: typography.sizes.md },
  });
