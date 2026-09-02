import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import type { AccountType } from '@/src/types';
import { CheckmarkCircle01Icon, Download01Icon, Folder01Icon, InformationCircleIcon, Share01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CsvExportService, ExportDateRange } from '../api/csv-export.service';

const DATE_PRESETS = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '12m', label: 'Last 12 months', days: 365 },
] as const;

const TYPE_OPTIONS = [
  { key: 'ALL' as const, label: 'All' },
  { key: 'CR' as const, label: 'Income' },
  { key: 'DR' as const, label: 'Expense' },
  { key: 'TR' as const, label: 'Transfer' },
] as const;

export const ExportScreen = React.memo(function ExportScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const accountsQuery = useAccounts();

  const [selectedPreset, setSelectedPreset] = useState<string>(DATE_PRESETS[1].key);
  const [customRange, setCustomRange] = useState<ExportDateRange | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'ALL' | 'CR' | 'DR' | 'TR'>('ALL');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportedData, setExportedData] = useState<{ content: string; filename: string } | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [includeLoans, setIncludeLoans] = useState(false);

  const effectiveDateRange = useMemo(() => {
    if (customRange) return customRange;
    const preset = DATE_PRESETS.find(p => p.key === selectedPreset);
    if (preset) {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - preset.days);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    }
    return { startDate: new Date(), endDate: new Date() };
  }, [customRange, selectedPreset]);

  const formatDate = useCallback((date: Date) =>
    date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    [],
  );

  const handlePresetSelect = useCallback((key: string) => {
    setSelectedPreset(key);
    setCustomRange(null);
  }, []);

  const handleStartChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(false);
    if (date) setCustomRange(prev => ({ startDate: date, endDate: prev?.endDate || new Date() }));
  }, []);

  const handleEndChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(false);
    if (date) {
      date.setHours(23, 59, 59, 999);
      setCustomRange(prev => ({ startDate: prev?.startDate || new Date(), endDate: date }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const options = {
      dateRange: effectiveDateRange,
      ...(selectedAccountId !== null && { accountId: selectedAccountId }),
      ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' | 'TR' }),
    };
    CsvExportService.getTransactionCount(options).then(count => {
      if (mounted) setPreviewCount(count);
    });
    return () => { mounted = false; };
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const result = await CsvExportService.exportToCsv({
        dateRange: effectiveDateRange,
        ...(selectedAccountId !== null && { accountId: selectedAccountId }),
        ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' | 'TR' }),
        includeLoans,
      });
      setExportedData(result);
      setShowExportOptions(true);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Failed to export');
    } finally {
      setIsExporting(false);
    }
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleSave = useCallback(async () => {
    if (!exportedData) return;
    setShowExportOptions(false);
    try { await CsvExportService.saveToFolder(exportedData.content, exportedData.filename); }
    catch (error) { Alert.alert('Save failed', error instanceof Error ? error.message : 'Failed to save'); }
    finally { setExportedData(null); }
  }, [exportedData]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;
    setShowExportOptions(false);
    try { await CsvExportService.shareFile(exportedData.content, exportedData.filename); }
    catch (error) { Alert.alert('Share failed', error instanceof Error ? error.message : 'Failed to share'); }
    finally { setExportedData(null); }
  }, [exportedData]);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header title="Export CSV" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Date range ── */}
        <Text style={styles.sectionLabel}>Date range</Text>
        <View style={styles.card}>
          {DATE_PRESETS.map((p, i) => (
            <React.Fragment key={p.key}>
              <BentoPressable style={styles.cardRow} onPress={() => handlePresetSelect(p.key)} scaleOnPress={false}>
                <Text style={styles.cardRowText}>{p.label}</Text>
                {selectedPreset === p.key && !customRange
                  ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.primary} />
                  : null}
              </BentoPressable>
              {i < DATE_PRESETS.length - 1 ? <View style={styles.sep} /> : null}
            </React.Fragment>
          ))}
          <View style={styles.sep} />
          <BentoPressable style={styles.cardRow} onPress={() => setShowStartPicker(true)} scaleOnPress={false}>
            <Text style={styles.cardRowText}>Custom range</Text>
            {customRange ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.primary} /> : null}
          </BentoPressable>
          {customRange ? (
            <View style={styles.dateRow}>
              <BentoPressable style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateLbl}>From</Text>
                <Text style={styles.dateVal}>{formatDate(customRange.startDate)}</Text>
              </BentoPressable>
              <View style={styles.dateSep} />
              <BentoPressable style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateLbl}>To</Text>
                <Text style={styles.dateVal}>{formatDate(customRange.endDate)}</Text>
              </BentoPressable>
            </View>
          ) : null}
        </View>

        {/* ── Type ── */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.pillRow}>
          {TYPE_OPTIONS.map(t => {
            const active = selectedType === t.key;
            return (
              <BentoPressable key={t.key} style={[styles.pill, active && styles.pillActive]} onPress={() => setSelectedType(t.key)}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{t.label}</Text>
              </BentoPressable>
            );
          })}
        </View>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <BentoPressable style={styles.cardRow} onPress={() => setSelectedAccountId(null)} scaleOnPress={false}>
            <Text style={styles.cardRowText}>All accounts</Text>
            {selectedAccountId === null ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.primary} /> : null}
          </BentoPressable>
          {accountsQuery.data?.map(acc => {
            const c = colorNumberToHex(acc.color);
            const selected = selectedAccountId === acc.id;
            return (
              <React.Fragment key={acc.id}>
                <View style={styles.sep} />
                <BentoPressable style={styles.cardRow} onPress={() => setSelectedAccountId(acc.id)} scaleOnPress={false}>
                  <View style={styles.accRow}>
                    <IconAvatar icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)} color={c} variant="subtle" size={24} iconSize={11} />
                    <Text style={styles.cardRowText}>{acc.name}</Text>
                  </View>
                  {selected ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color={colors.primary} /> : null}
                </BentoPressable>
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Options ── */}
        <Text style={styles.sectionLabel}>Options</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowText}>Include loans</Text>
            <Switch
              value={includeLoans}
              onValueChange={setIncludeLoans}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={includeLoans ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* ── Summary ── */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>
              {previewCount !== null ? previewCount.toLocaleString() : '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period</Text>
            <Text style={styles.summaryPeriod}>
              {formatDate(effectiveDateRange.startDate)} — {formatDate(effectiveDateRange.endDate)}
            </Text>
          </View>
        </View>

        {/* ── Export button ── */}
        <BentoPressable
          style={[styles.exportBtn, (isExporting || previewCount === 0) && styles.exportBtnDisabled]}
          onPress={handleExport}
          disabled={isExporting || previewCount === 0}
        >
          {isExporting
            ? <ActivityIndicator size="small" color={colors.primaryForeground} />
            : (
              <>
                <HugeiconsIcon icon={Download01Icon} size={18} color={colors.primaryForeground} />
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </>
            )}
        </BentoPressable>

        {previewCount === 0 ? (
          <View style={styles.warning}>
            <HugeiconsIcon icon={InformationCircleIcon} size={15} color={colors.warning} />
            <Text style={styles.warningText}>No transactions match the selected filters.</Text>
          </View>
        ) : null}

      </ScrollView>

      {showStartPicker
        ? <DateTimePicker value={customRange?.startDate || new Date()} mode="date" display="default" onChange={handleStartChange} maximumDate={new Date()} />
        : null}
      {showEndPicker
        ? <DateTimePicker value={customRange?.endDate || new Date()} mode="date" display="default" onChange={handleEndChange} maximumDate={new Date()} />
        : null}

      <OptionsDialog
        visible={showExportOptions}
        onClose={() => { setShowExportOptions(false); setExportedData(null); }}
        title="Export ready"
        subtitle={exportedData ? `${previewCount?.toLocaleString()} transactions ready` : 'Choose how to save'}
        options={[
          { key: 'save', label: Platform.OS === 'ios' ? 'Save to Files' : 'Save to folder', icon: Folder01Icon, selected: false, onPress: handleSave },
          { key: 'share', label: 'Share to apps', icon: Share01Icon, selected: false, onPress: handleShare },
        ]}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('10'),
    },

    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xxs,
      color: colors.textMuted,
      marginBottom: spacing('2'),
      marginLeft: spacing('1'),
    },

    // ── List card ──
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('5'),
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    cardRowText: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    sep: {
      height: 1,
      backgroundColor: colors.text + '0C',
      marginHorizontal: spacing('4'),
    },

    // ── Custom date range ──
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      paddingBottom: spacing('3'),
      gap: spacing('2'),
    },
    dateBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius('lg'),
      paddingVertical: spacing('2.5'),
      paddingHorizontal: spacing('3'),
    },
    dateSep: {
      width: 1,
      height: 32,
      backgroundColor: colors.text + '12',
    },
    dateLbl: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xxs,
      color: colors.textMuted,
      marginBottom: spacing('0.5'),
    },
    dateVal: {
      fontFamily: typography.styles.rowValue.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },

    // ── Type pills ──
    pillRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      marginBottom: spacing('5'),
    },
    pill: {
      flex: 1,
      height: sizes.button.sm.height,
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: colors.primary + '15',
    },
    pillText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    pillTextActive: {
      fontFamily: typography.styles.chipLabelActive.fontFamily,
      color: colors.primary,
    },

    // ── Account row ──
    accRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
    },

    // ── Summary card ──
    summary: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('4'),
      marginBottom: spacing('4'),
      gap: spacing('3'),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.text + '0C',
    },
    summaryLabel: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    summaryValue: {
      fontFamily: typography.fonts.heading,
      fontSize: typography.sizes.xxl,
      color: colors.text,
    },
    summaryPeriod: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },

    // ── Export button ──
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing('2'),
      height: sizes.button.lg.height,
      borderRadius: radius('full'),
      backgroundColor: colors.primary,
      marginBottom: spacing('3'),
    },
    exportBtnDisabled: {
      opacity: 0.5,
    },
    exportBtnText: {
      fontFamily: typography.styles.buttonLabel.fontFamily,
      fontSize: sizes.button.lg.fontSize,
      color: colors.primaryForeground,
    },

    // ── Warning ──
    warning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      backgroundColor: colors.warning + '10',
      borderRadius: radius('lg'),
      padding: spacing('3'),
    },
    warningText: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.warning,
      lineHeight: 18,
    },
  });
