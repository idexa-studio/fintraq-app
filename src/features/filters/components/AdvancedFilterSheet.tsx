import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Account } from '@/src/features/accounts/api/accounts';
import { Category } from '@/src/features/categories/api/categories';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import type { TransactionType } from '@/src/types';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../api/advanced-filters.service';

interface AdvancedFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
  resultCount: number;
}

const TYPE_OPTS = [
  { key: 'CR' as const, label: 'Income', colorKey: 'success' as const },
  { key: 'DR' as const, label: 'Expense', colorKey: 'danger' as const },
  { key: 'TR' as const, label: 'Transfer', colorKey: 'info' as const },
];

export const AdvancedFilterSheet = React.memo(function AdvancedFilterSheet({
  visible, onClose, filters, onApply, onReset, accounts, categories, resultCount,
}: AdvancedFilterSheetProps) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [local, setLocal] = useState<AdvancedFilters>(filters);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');

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

  const toggleAccount = useCallback((id: number) => setLocal(p => ({ ...p, accountIds: toggle(p.accountIds, id) })), [toggle]);
  const toggleCategory = useCallback((id: number) => setLocal(p => ({ ...p, categoryIds: toggle(p.categoryIds, id) })), [toggle]);
  const toggleType = useCallback((t: TransactionType) => setLocal(p => ({ ...p, types: toggle(p.types, t) })), [toggle]);

  const onStartDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowStart(false);
    if (d) setLocal(p => ({ ...p, dateRange: { startDate: d, endDate: p.dateRange?.endDate || new Date() } }));
  }, []);
  const onEndDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowEnd(false);
    if (d) { d.setHours(23, 59, 59, 999); setLocal(p => ({ ...p, dateRange: { startDate: p.dateRange?.startDate || new Date(), endDate: d } })); }
  }, []);

  const handleApply = useCallback(() => {
    const mn = minAmt ? parseFloat(minAmt) : undefined;
    const mx = maxAmt ? parseFloat(maxAmt) : undefined;
    onApply({ ...local, amountRange: (mn !== undefined || mx !== undefined) ? { min: mn, max: mx } : undefined });
    onClose();
  }, [local, minAmt, maxAmt, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocal(DEFAULT_ADVANCED_FILTERS);
    setMinAmt(''); setMaxAmt('');
    onReset();
  }, [onReset]);

  const activeCount = (local.accountIds?.length || 0) + (local.categoryIds?.length || 0) + (local.types?.length || 0) + (local.dateRange ? 1 : 0) + (minAmt || maxAmt ? 1 : 0) + (local.searchQuery?.trim() ? 1 : 0);

  const fmt = useCallback((d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>Filters</Text>
              {activeCount > 0 ? <View style={styles.badge}><Text style={[styles.badgeText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>{activeCount}</Text></View> : null}
            </View>
            <View style={styles.headerRight}>
              {activeCount > 0 ? <TouchableOpacity onPress={handleReset} activeOpacity={0.7}><Text style={[styles.resetText, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>Reset</Text></TouchableOpacity> : null}
              <TouchableOpacity onPress={onClose} activeOpacity={0.6}><Ionicons name="close" size={18} color={colors.textMuted} /></TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Type</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTS.map(opt => {
                const sel = local.types?.includes(opt.key) || false;
                const c = colors[opt.colorKey];
                return (
                  <TouchableOpacity key={opt.key} style={[styles.typePill, sel && { backgroundColor: c + '15' }]} onPress={() => toggleType(opt.key)} activeOpacity={0.7}>
                    <Text style={[styles.typePillText, { fontFamily: typography.fonts.semibold }, sel ? { color: c } : { color: colors.textMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Date range</Text>
            <View style={styles.card}>
              {local.dateRange ? (
                <View style={styles.dateRow}>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowStart(true)} activeOpacity={0.7}>
                    <Text style={[styles.dateFieldLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>From</Text>
                    <Text style={[styles.dateFieldValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{fmt(local.dateRange.startDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowEnd(true)} activeOpacity={0.7}>
                    <Text style={[styles.dateFieldLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>To</Text>
                    <Text style={[styles.dateFieldValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{fmt(local.dateRange.endDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLocal(p => ({ ...p, dateRange: undefined }))} activeOpacity={0.6}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)} activeOpacity={0.7}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.dateBtnText, { fontFamily: typography.fonts.regular, color: colors.primary }]}>Select dates</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Amount</Text>
            <View style={styles.card}>
              <View style={styles.amountRow}>
                <TextInput style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]} value={minAmt} onChangeText={setMinAmt} keyboardType="decimal-pad" placeholder="Min" placeholderTextColor={colors.textMuted + '50'} returnKeyType="done" />
                <View style={[styles.amountSep, { backgroundColor: colors.text + '0C' }]} />
                <TextInput style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]} value={maxAmt} onChangeText={setMaxAmt} keyboardType="decimal-pad" placeholder="Max" placeholderTextColor={colors.textMuted + '50'} returnKeyType="done" />
              </View>
            </View>

            {accounts.length > 0 ? (
              <>
                <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Accounts</Text>
                <View style={styles.card}>
                  {accounts.map((a, i) => {
                    const sel = local.accountIds?.includes(a.id) || false;
                    const ac = colorNumberToHex(a.color);
                    return (
                      <View key={a.id}>
                        <TouchableOpacity style={[styles.selectRow, sel && { backgroundColor: colors.text + '05' }]} onPress={() => toggleAccount(a.id)} activeOpacity={0.7}>
                          <Ionicons name={resolveIcon(a.icon, 'wallet-outline')} size={16} color={ac} />
                          <Text style={[styles.selectLabel, { fontFamily: typography.fonts.regular, color: colors.text }]}>{a.name}</Text>
                          <View style={[styles.check, sel && { backgroundColor: colors.text }]}>{sel ? <Ionicons name="checkmark" size={11} color={colors.background} /> : null}</View>
                        </TouchableOpacity>
                        {i < accounts.length - 1 ? <View style={[styles.sep, { backgroundColor: colors.text + '0C' }]} /> : null}
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {categories.length > 0 ? (
              <>
                <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Categories</Text>
                <View style={styles.chipGrid}>
                  {categories.map(c => {
                    const sel = local.categoryIds?.includes(c.id) || false;
                    const cc = colorNumberToHex(c.color);
                    return (
                      <TouchableOpacity key={c.id} style={[styles.chip, sel && { backgroundColor: cc + '18' }]} onPress={() => toggleCategory(c.id)} activeOpacity={0.7}>
                        <Ionicons name={resolveIcon(c.icon, 'pricetag-outline')} size={13} color={sel ? cc : colors.textMuted} />
                        <Text style={[styles.chipText, { fontFamily: typography.fonts.medium }, sel && { color: cc }]}>{c.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Sort</Text>
            <View style={styles.card}>
              <View style={styles.sortRow}>
                <Text style={[styles.sortLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Sort by</Text>
                <View style={styles.sortToggles}>
                  {(['date', 'amount'] as const).map(s => (
                    <TouchableOpacity key={s} style={[styles.sortToggle, local.sortBy === s && styles.sortToggleActive]} onPress={() => setLocal(p => ({ ...p, sortBy: s }))} activeOpacity={0.7}>
                      <Text style={[styles.sortToggleText, { fontFamily: typography.fonts.semibold }, local.sortBy === s && styles.sortToggleTextActive]}>{s === 'date' ? 'Date' : 'Amount'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.sep, { backgroundColor: colors.text + '0C' }]} />
              <View style={styles.sortRow}>
                <Text style={[styles.sortLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Order</Text>
                <View style={styles.sortToggles}>
                  {(['desc', 'asc'] as const).map(o => (
                    <TouchableOpacity key={o} style={[styles.sortToggle, local.sortOrder === o && styles.sortToggleActive]} onPress={() => setLocal(p => ({ ...p, sortOrder: o }))} activeOpacity={0.7}>
                      <Text style={[styles.sortToggleText, { fontFamily: typography.fonts.semibold }, local.sortOrder === o && styles.sortToggleTextActive]}>{o === 'desc' ? 'Newest' : 'Oldest'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={[styles.applyBtnText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>Show {resultCount} result{resultCount !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          </View>

          {showStart ? <DateTimePicker value={local.dateRange?.startDate || new Date()} mode="date" display="default" onChange={onStartDate} maximumDate={new Date()} /> : null}
          {showEnd ? <DateTimePicker value={local.dateRange?.endDate || new Date()} mode="date" display="default" onChange={onEndDate} maximumDate={new Date()} /> : null}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius('2xl'),
      borderTopRightRadius: radius('2xl'),
      maxHeight: '88%',
    },
    handle: { width: 36, height: 4, borderRadius: radius('full'), backgroundColor: colors.text + '15', alignSelf: 'center', marginTop: spacing('2.5') },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), paddingBottom: spacing('2') },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    title: { fontSize: typography.sizes.xxl },
    badge: { minWidth: 22, height: 22, borderRadius: radius('full'), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing('1') },
    badgeText: { fontSize: 11 },
    resetText: { fontSize: typography.sizes.sm },

    scroll: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('3') },
    label: { fontSize: 10, marginBottom: spacing('2.5'), paddingLeft: spacing('1'), opacity: 0.7 },

    card: { backgroundColor: colors.background, borderRadius: radius('xl'), overflow: 'hidden', marginBottom: spacing('5') },
    sep: { height: 1, marginHorizontal: 16 },

    typeRow: { flexDirection: 'row', gap: spacing('2'), marginBottom: spacing('5') },
    typePill: { flex: 1, height: 36, borderRadius: radius('md'), backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    typePillText: { fontSize: typography.sizes.xs },

    dateRow: { flexDirection: 'row', alignItems: 'center', padding: spacing('3.5'), gap: spacing('2') },
    dateField: { flex: 1, gap: spacing('0.5') },
    dateFieldLabel: { fontSize: 10, opacity: 0.6 },
    dateFieldValue: { fontSize: typography.sizes.sm },
    dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing('2'), paddingVertical: spacing('4') },
    dateBtnText: { fontSize: typography.sizes.sm },

    amountRow: { flexDirection: 'row' },
    amountInput: { flex: 1, fontSize: 24, padding: spacing('3.5'), textAlign: 'center' },
    amountSep: { width: 1, marginVertical: spacing('3') },

    selectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing('3'), paddingHorizontal: spacing('4'), gap: spacing('3') },
    selectLabel: { flex: 1, fontSize: typography.sizes.sm },
    check: { width: 20, height: 20, borderRadius: radius('xs'), borderWidth: 1.5, borderColor: colors.text + '20', alignItems: 'center', justifyContent: 'center' },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2'), marginBottom: spacing('5') },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing('3'), height: 34, borderRadius: radius('md'), backgroundColor: colors.background, gap: spacing('1.5') },
    chipText: { fontSize: typography.sizes.xs, color: colors.textMuted },

    sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing('4'), paddingVertical: spacing('3') },
    sortLabel: { fontSize: typography.sizes.sm },
    sortToggles: { flexDirection: 'row', gap: spacing('1.5') },
    sortToggle: { paddingHorizontal: spacing('3'), height: 30, borderRadius: radius('md'), backgroundColor: colors.text + '08', justifyContent: 'center' },
    sortToggleActive: { backgroundColor: colors.text },
    sortToggleText: { fontSize: typography.sizes.xs, color: colors.textMuted },
    sortToggleTextActive: { color: colors.background },

    footer: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('4'), paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.text + '0C' },
    applyBtn: { height: 52, borderRadius: radius('md'), backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
    applyBtnText: { fontSize: typography.sizes.md },
  });
