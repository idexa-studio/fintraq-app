import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { Person } from '@/src/features/persons/api/persons';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveIcon } from '@/src/utils/icons';
import type { TransactionType } from '@/src/types';
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
  resultCount: number;
}

const TYPE_OPTS = [
  { key: 'CR' as const, label: 'Income',   icon: 'arrow-down-circle-outline' as const, colorKey: 'success' as const },
  { key: 'DR' as const, label: 'Expense',  icon: 'arrow-up-circle-outline' as const,   colorKey: 'danger'  as const },
  { key: 'TR' as const, label: 'Transfer', icon: 'swap-horizontal' as const,           colorKey: 'info'    as const },
] as const;

export const AdvancedFilterBottomSheet = React.memo(function AdvancedFilterBottomSheet({
  visible, onClose, filters, onApply, onReset, accounts, categories, persons, resultCount,
}: AdvancedFilterBottomSheetProps) {
  const theme = useTheme();
  const { colors, typography, overlay } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [local, setLocal]         = useState<AdvancedFilters>(filters);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd]     = useState(false);
  const [minAmt, setMinAmt]       = useState('');
  const [maxAmt, setMaxAmt]       = useState('');

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

  const toggleAccount  = useCallback((id: number) => setLocal(p => ({ ...p, accountIds:  toggle(p.accountIds,  id) })), [toggle]);
  const toggleCategory = useCallback((id: number) => setLocal(p => ({ ...p, categoryIds: toggle(p.categoryIds, id) })), [toggle]);
  const togglePerson   = useCallback((id: number) => setLocal(p => ({ ...p, personIds:   toggle(p.personIds,   id) })), [toggle]);
  const toggleType     = useCallback((t: TransactionType) => setLocal(p => ({ ...p, types: toggle(p.types, t) })), [toggle]);
  const clearDateRange = useCallback(() => setLocal(p => ({ ...p, dateRange: undefined })), []);

  const onStartDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowStart(false);
    if (d) setLocal(p => ({ ...p, dateRange: { startDate: d, endDate: p.dateRange?.endDate || new Date() } }));
  }, []);

  const onEndDate = useCallback((_e: DateTimePickerEvent, d?: Date) => {
    setShowEnd(false);
    if (d) {
      d.setHours(23, 59, 59, 999);
      setLocal(p => ({ ...p, dateRange: { startDate: p.dateRange?.startDate || new Date(), endDate: d } }));
    }
  }, []);

  const handleApply = useCallback(() => {
    const mn = minAmt ? parseFloat(minAmt) : undefined;
    const mx = maxAmt ? parseFloat(maxAmt) : undefined;
    onApply({ ...local, amountRange: (mn !== undefined || mx !== undefined) ? { min: mn, max: mx } : undefined });
    onClose();
  }, [local, minAmt, maxAmt, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocal(DEFAULT_ADVANCED_FILTERS);
    setMinAmt('');
    setMaxAmt('');
    onReset();
  }, [onReset]);

  const activeCount = useMemo(() =>
    (local.accountIds?.length  || 0) +
    (local.categoryIds?.length || 0) +
    (local.personIds?.length   || 0) +
    (local.types?.length       || 0) +
    (local.dateRange            ? 1 : 0) +
    (minAmt || maxAmt           ? 1 : 0) +
    (local.searchQuery?.trim()  ? 1 : 0),
    [local, minAmt, maxAmt]
  );

  const fmt = useCallback((d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: overlay.dim }]}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
                Filters
              </Text>
              {activeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>
                    {activeCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {activeCount > 0 && (
                <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                  <Text style={[styles.resetText, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.6}
                style={[styles.closeBtn, { backgroundColor: colors.text + '0A' }]}
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── TYPE: horizontal pills ── */}
            <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              TYPE
            </Text>
            <View style={styles.typeRow}>
              {TYPE_OPTS.map(opt => {
                const sel = local.types?.includes(opt.key) || false;
                const c   = colors[opt.colorKey];
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.typePill, { backgroundColor: sel ? c + '18' : colors.card }]}
                    onPress={() => toggleType(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typePillLabel, { fontFamily: typography.fonts.semibold, color: sel ? c : colors.textMuted }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── DATE RANGE: group card with rows ── */}
            <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              DATE RANGE
            </Text>
            <View style={[styles.group, { backgroundColor: colors.card }]}>
              {local.dateRange ? (
                <>
                  <TouchableOpacity style={styles.groupRow} onPress={() => setShowStart(true)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                      From
                    </Text>
                    <Text style={[styles.groupRowValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                      {fmt(local.dateRange.startDate)}
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.groupSep, { backgroundColor: colors.text + '08' }]} />
                  <TouchableOpacity style={styles.groupRow} onPress={() => setShowEnd(true)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                      To
                    </Text>
                    <Text style={[styles.groupRowValue, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                      {fmt(local.dateRange.endDate)}
                    </Text>
                    <TouchableOpacity onPress={clearDateRange} activeOpacity={0.6} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.groupRow, styles.groupRowPrompt]} onPress={() => setShowStart(true)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    Set date range
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={colors.textMuted} style={styles.groupChevron} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── AMOUNT: group card with rows ── */}
            <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              AMOUNT
            </Text>
            <View style={[styles.group, { backgroundColor: colors.card }]}>
              <View style={styles.groupRow}>
                <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Min
                </Text>
                <TextInput
                  style={[styles.amountInput, { fontFamily: typography.fonts.semibold, color: colors.text }]}
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
                  style={[styles.amountInput, { fontFamily: typography.fonts.semibold, color: colors.text }]}
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

            {/* ── ACCOUNTS: pill chips ── */}
            {accounts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  ACCOUNTS
                </Text>
                <View style={styles.pillGrid}>
                  {accounts.map(a => {
                    const sel = local.accountIds?.includes(a.id) || false;
                    const ac  = colorNumberToHex(a.color);
                    return (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.pill, { backgroundColor: sel ? ac + '18' : colors.card }]}
                        onPress={() => toggleAccount(a.id)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name={resolveIcon(a.icon, 'wallet-outline')} size={16} color={ac} />
                        <Text style={[styles.pillLabel, { color: sel ? ac : colors.text }]}>
                          {a.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── CATEGORIES: pill chips ── */}
            {categories.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  CATEGORIES
                </Text>
                <View style={styles.pillGrid}>
                  {categories.map(c => {
                    const sel = local.categoryIds?.includes(c.id) || false;
                    const cc  = colorNumberToHex(c.color);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.pill, { backgroundColor: sel ? cc + '18' : colors.card }]}
                        onPress={() => toggleCategory(c.id)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name={resolveIcon(c.icon, 'tag-outline')} size={16} color={cc} />
                        <Text style={[styles.pillLabel, { color: sel ? cc : colors.text }]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── PERSONS: pill chips ── */}
            {persons.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  PERSONS
                </Text>
                <View style={styles.pillGrid}>
                  {persons.map(p => {
                    const sel = local.personIds?.includes(p.id) || false;
                    const pc  = colorNumberToHex(p.color);
                    const initials = p.name.trim().split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.pill, { backgroundColor: sel ? pc + '18' : colors.card }]}
                        onPress={() => togglePerson(p.id)}
                        activeOpacity={0.8}
                      >
                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: pc, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 8 }}>{initials}</Text>
                        </View>
                        <Text style={[styles.pillLabel, { color: sel ? pc : colors.text }]}>
                          {p.name.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── SORT: group card, inline text toggles ── */}
            <Text style={[styles.sectionTitle, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              SORT
            </Text>
            <View style={[styles.group, { backgroundColor: colors.card }]}>
              <View style={styles.groupRow}>
                <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Sort by
                </Text>
                <View style={styles.inlineToggles}>
                  {(['date', 'amount'] as const).map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <Text style={[styles.toggleSep, { color: colors.textMuted }]}>·</Text>}
                      <TouchableOpacity onPress={() => setLocal(p => ({ ...p, sortBy: s }))} activeOpacity={0.7}>
                        <Text style={[
                          styles.toggleOption,
                          { fontFamily: local.sortBy === s ? typography.fonts.semibold : typography.fonts.regular },
                          { color: local.sortBy === s ? colors.text : colors.textMuted },
                        ]}>
                          {s === 'date' ? 'Date' : 'Amount'}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>
              <View style={[styles.groupSep, { backgroundColor: colors.text + '08' }]} />
              <View style={styles.groupRow}>
                <Text style={[styles.groupRowLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Order
                </Text>
                <View style={styles.inlineToggles}>
                  {(['desc', 'asc'] as const).map((o, i) => (
                    <React.Fragment key={o}>
                      {i > 0 && <Text style={[styles.toggleSep, { color: colors.textMuted }]}>·</Text>}
                      <TouchableOpacity onPress={() => setLocal(p => ({ ...p, sortOrder: o }))} activeOpacity={0.7}>
                        <Text style={[
                          styles.toggleOption,
                          { fontFamily: local.sortOrder === o ? typography.fonts.semibold : typography.fonts.regular },
                          { color: local.sortOrder === o ? colors.text : colors.textMuted },
                        ]}>
                          {o === 'desc' ? 'Newest' : 'Oldest'}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── Footer ── */}
          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.text }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={[styles.applyLabel, { fontFamily: typography.fonts.semibold, color: colors.background }]}>
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
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
      </View>
    </Modal>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '90%',
    },
    handle: {
      width: 32,
      height: 4,
      borderRadius: radius('full'),
      backgroundColor: colors.text + '24',
      alignSelf: 'center',
      marginTop: spacing('3'),
    },

    // ── Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: spacing('2'),
    },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    title:       { fontSize: 22 },
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
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Scroll
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
    },
    sectionTitle: {
      fontSize: 10,
      opacity: 0.7,
      marginBottom: spacing('2'),
      marginTop: spacing('5'),
      paddingLeft: spacing('0.5'),
    },

    // ── TYPE: horizontal pills
    typeRow:  { flexDirection: 'row', gap: spacing('2') },
    typePill: {
      flex: 1,
      height: 36,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typePillLabel: { fontSize: 13 },

    // ── Group card (Date / Amount / Accounts / Sort)
    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
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
    groupChevron:  { marginLeft: 'auto' },
    groupSep:      { height: 1, marginHorizontal: spacing('4') },

    // ── Amount inputs
    amountInput: {
      flex: 1,
      fontSize: typography.sizes.md,
      padding: 0,
      textAlign: 'right',
    },

    // ── Pill chips (accounts + categories)
    pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
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

    // ── Sort inline toggles
    inlineToggles: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    toggleSep:     { fontSize: typography.sizes.xs, opacity: 0.4 },
    toggleOption:  { fontSize: typography.sizes.sm },

    // ── Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('3'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
    },
    applyBtn: {
      height: 52,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyLabel: { fontSize: typography.sizes.md },
  });
