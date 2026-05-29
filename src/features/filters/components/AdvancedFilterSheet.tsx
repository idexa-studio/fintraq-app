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
  { key: 'CR' as const, label: 'Income',   icon: 'arrow-down-circle-outline' as const, colorKey: 'success' as const },
  { key: 'DR' as const, label: 'Expense',  icon: 'arrow-up-circle-outline' as const,   colorKey: 'danger'  as const },
  { key: 'TR' as const, label: 'Transfer', icon: 'swap-horizontal-outline' as const,   colorKey: 'info'    as const },
] as const;

export const AdvancedFilterSheet = React.memo(function AdvancedFilterSheet({
  visible, onClose, filters, onApply, onReset, accounts, categories, resultCount,
}: AdvancedFilterSheetProps) {
  const theme = useTheme();
  const { colors, typography, layout } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [local, setLocal]       = useState<AdvancedFilters>(filters);
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
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { fontFamily: typography.fonts.heading, color: colors.text }]}>
                Filters
              </Text>
              {activeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>
                    {activeCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {activeCount > 0 && (
                <TouchableOpacity
                  onPress={handleReset}
                  activeOpacity={0.7}
                  style={[styles.resetChip, { backgroundColor: colors.danger + '12' }]}
                >
                  <Text style={[styles.resetText, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>
                    Reset all
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.6}
                style={[styles.closeBtn, { backgroundColor: colors.text + '08' }]}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Type ── */}
            <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Transaction type
            </Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTS.map(opt => {
                const sel = local.types?.includes(opt.key) || false;
                const c   = colors[opt.colorKey];
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.typeCard, { backgroundColor: sel ? c + '12' : colors.background }]}
                    onPress={() => toggleType(opt.key)}
                    activeOpacity={0.75}
                  >
                    {sel && (
                      <View style={[styles.typeCheckDot, { backgroundColor: c }]}>
                        <Ionicons name="checkmark" size={9} color={colors.background} />
                      </View>
                    )}
                    <View style={[styles.typeIconRing, { backgroundColor: sel ? c + '1E' : colors.text + '08' }]}>
                      <Ionicons name={opt.icon} size={18} color={sel ? c : colors.textMuted} />
                    </View>
                    <Text style={[styles.typeCardLabel, { fontFamily: typography.fonts.semibold, color: sel ? c : colors.textMuted }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Date range ── */}
            <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Date range
            </Text>
            {local.dateRange ? (
              <View style={[styles.dateCard, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.dateSide} onPress={() => setShowStart(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateSideLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>From</Text>
                  <Text style={[styles.dateSideValue, { fontFamily: typography.fonts.bold, color: colors.text }]}>
                    {fmt(local.dateRange.startDate)}
                  </Text>
                </TouchableOpacity>
                <View style={[styles.dateArrow, { backgroundColor: colors.text + '0C' }]}>
                  <Ionicons name="arrow-forward" size={11} color={colors.textMuted} />
                </View>
                <TouchableOpacity style={styles.dateSide} onPress={() => setShowEnd(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateSideLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>To</Text>
                  <Text style={[styles.dateSideValue, { fontFamily: typography.fonts.bold, color: colors.text }]}>
                    {fmt(local.dateRange.endDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearDateRange} activeOpacity={0.6} style={styles.dateClearBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted + 'BB'} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.dateEmpty, { backgroundColor: colors.background }]}
                onPress={() => setShowStart(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.dateEmptyIcon, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.dateEmptyMeta}>
                  <Text style={[styles.dateEmptyTitle, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
                    Select date range
                  </Text>
                  <Text style={[styles.dateEmptyHint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    Tap to set start and end dates
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {/* ── Amount ── */}
            <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Amount range
            </Text>
            <View style={[styles.amountCard, { backgroundColor: colors.background }]}>
              <View style={styles.amountSide}>
                <Text style={[styles.amountFieldLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Minimum
                </Text>
                <TextInput
                  style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]}
                  value={minAmt}
                  onChangeText={setMinAmt}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted + '40'}
                  returnKeyType="done"
                />
              </View>
              <View style={[styles.amountDivider, { backgroundColor: colors.text + '0C' }]} />
              <View style={styles.amountSide}>
                <Text style={[styles.amountFieldLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  Maximum
                </Text>
                <TextInput
                  style={[styles.amountInput, { fontFamily: typography.fonts.bold, color: colors.text }]}
                  value={maxAmt}
                  onChangeText={setMaxAmt}
                  keyboardType="decimal-pad"
                  placeholder="Any"
                  placeholderTextColor={colors.textMuted + '40'}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* ── Accounts ── */}
            {accounts.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  Accounts
                </Text>
                <View style={[styles.listCard, { backgroundColor: colors.background }]}>
                  {accounts.map((a, i) => {
                    const sel = local.accountIds?.includes(a.id) || false;
                    const ac  = colorNumberToHex(a.color);
                    return (
                      <View key={a.id}>
                        <TouchableOpacity style={styles.listRow} onPress={() => toggleAccount(a.id)} activeOpacity={0.7}>
                          <View style={[styles.accountAvatar, { backgroundColor: ac + '18' }]}>
                            <Ionicons name={resolveIcon(a.icon, 'wallet-outline')} size={16} color={ac} />
                          </View>
                          <Text style={[styles.listLabel, { fontFamily: typography.fonts.regular, color: colors.text }]}>
                            {a.name}
                          </Text>
                          <View style={[
                            styles.checkbox,
                            { borderColor: colors.text + '20' },
                            sel && { backgroundColor: colors.text, borderColor: colors.text },
                          ]}>
                            {sel && <Ionicons name="checkmark" size={11} color={colors.background} />}
                          </View>
                        </TouchableOpacity>
                        {i < accounts.length - 1 && (
                          <View style={[styles.rowSep, { backgroundColor: colors.text + '08' }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
                  Categories
                </Text>
                <View style={styles.chipGrid}>
                  {categories.map(c => {
                    const sel = local.categoryIds?.includes(c.id) || false;
                    const cc  = colorNumberToHex(c.color);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, { backgroundColor: sel ? cc + '18' : colors.background }]}
                        onPress={() => toggleCategory(c.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name={resolveIcon(c.icon, 'pricetag-outline')} size={13} color={sel ? cc : colors.textMuted} />
                        <Text style={[styles.chipText, { fontFamily: typography.fonts.medium, color: sel ? cc : colors.textMuted }]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Sort ── */}
            <Text style={[styles.sectionLabel, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>
              Sort
            </Text>
            <View style={[styles.listCard, { backgroundColor: colors.background }]}>
              <View style={styles.sortRow}>
                <Text style={[styles.sortLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Sort by</Text>
                <View style={[styles.segmented, { backgroundColor: colors.text + '08' }]}>
                  {(['date', 'amount'] as const).map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.segment, local.sortBy === s && { backgroundColor: colors.text }]}
                      onPress={() => setLocal(p => ({ ...p, sortBy: s }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.segmentText,
                        { fontFamily: typography.fonts.semibold, color: local.sortBy === s ? colors.background : colors.textMuted },
                      ]}>
                        {s === 'date' ? 'Date' : 'Amount'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.rowSep, { backgroundColor: colors.text + '08' }]} />
              <View style={styles.sortRow}>
                <Text style={[styles.sortLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Order</Text>
                <View style={[styles.segmented, { backgroundColor: colors.text + '08' }]}>
                  {(['desc', 'asc'] as const).map(o => (
                    <TouchableOpacity
                      key={o}
                      style={[styles.segment, local.sortOrder === o && { backgroundColor: colors.text }]}
                      onPress={() => setLocal(p => ({ ...p, sortOrder: o }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.segmentText,
                        { fontFamily: typography.fonts.semibold, color: local.sortOrder === o ? colors.background : colors.textMuted },
                      ]}>
                        {o === 'desc' ? 'Newest' : 'Oldest'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* ── Footer ── */}
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.text + '08' }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.text }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} />
              <Text style={[styles.applyBtnText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>
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

const createStyles = ({ colors, typography, spacing, radius, shadow, layout }: ThemeContextType) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius('2xl'),
      borderTopRightRadius: radius('2xl'),
      maxHeight: '90%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius('full'),
      backgroundColor: colors.text + '18',
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
      paddingBottom: spacing('3'),
    },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing('2') },
    title:       { fontSize: typography.sizes.xxl },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('1'),
    },
    badgeText: { fontSize: 11 },
    resetChip: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('md'),
    },
    resetText: { fontSize: typography.sizes.xs },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Scroll
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('1'),
    },
    sectionLabel: {
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginTop: spacing('5'),
      marginBottom: spacing('2.5'),
      paddingLeft: spacing('0.5'),
      opacity: 0.6,
    },

    // ── Type cards
    typeGrid: { flexDirection: 'row', gap: spacing('2') },
    typeCard: {
      flex: 1,
      paddingVertical: spacing('4'),
      borderRadius: radius('xl'),
      alignItems: 'center',
      gap: spacing('2'),
      position: 'relative',
      ...shadow('xs'),
    },
    typeCheckDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 16,
      height: 16,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeIconRing: {
      width: 40,
      height: 40,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeCardLabel: { fontSize: typography.sizes.xs },

    // ── Date range
    dateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius('xl'),
      paddingVertical: spacing('4'),
      paddingHorizontal: spacing('4'),
      gap: spacing('2'),
      ...shadow('xs'),
    },
    dateSide:      { flex: 1, gap: spacing('1') },
    dateSideLabel: { fontSize: 10, opacity: 0.7 },
    dateSideValue: { fontSize: typography.sizes.sm },
    dateArrow: {
      width: 26,
      height: 26,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateClearBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateEmpty: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius('xl'),
      padding: spacing('4'),
      gap: spacing('3'),
      ...shadow('xs'),
    },
    dateEmptyIcon: {
      width: 44,
      height: 44,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateEmptyMeta:  { flex: 1, gap: spacing('0.5') },
    dateEmptyTitle: { fontSize: typography.sizes.sm },
    dateEmptyHint:  { fontSize: typography.sizes.xs },

    // ── Amount
    amountCard: {
      flexDirection: 'row',
      borderRadius: radius('xl'),
      overflow: 'hidden',
      ...shadow('xs'),
    },
    amountSide:       { flex: 1, padding: spacing('4'), gap: spacing('1') },
    amountFieldLabel: { fontSize: 10, opacity: 0.7 },
    amountInput:      { fontSize: 22, padding: 0 },
    amountDivider:    { width: 1, marginVertical: spacing('4') },

    // ── List card (Accounts / Sort)
    listCard: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      ...shadow('xs'),
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      gap: spacing('3'),
    },
    accountAvatar: {
      width: 36,
      height: 36,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    listLabel: { flex: 1, fontSize: typography.sizes.sm },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius('sm'),
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowSep: { height: 1, marginHorizontal: spacing('4') },

    // ── Category chips
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('3'),
      height: 34,
      borderRadius: radius('lg'),
      gap: spacing('1.5'),
      ...shadow('xs'),
    },
    chipText: { fontSize: typography.sizes.xs },

    // ── Sort
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    sortLabel: { fontSize: typography.sizes.sm },
    segmented: {
      flexDirection: 'row',
      borderRadius: radius('md'),
      padding: 3,
      gap: 2,
    },
    segment: {
      paddingHorizontal: spacing('3'),
      height: 28,
      borderRadius: radius('sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentText: { fontSize: typography.sizes.xs },

    // ── Footer
    footer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('4'),
      paddingBottom: Platform.OS === 'ios' ? spacing('8') : spacing('6'),
      borderTopWidth: 1,
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: radius('xl'),
      gap: spacing('2'),
    },
    applyBtnText: { fontSize: typography.sizes.md },
  });
