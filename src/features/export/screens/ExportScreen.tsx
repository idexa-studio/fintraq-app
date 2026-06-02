import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '@/src/utils/icons';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { Header } from '@/src/components/ui/Header';
import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { CsvExportService, ExportDateRange } from '../api/csv-export.service';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';

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
  const { colors, typography } = theme;
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
        <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Date range</Text>
          <View style={styles.card}>
            {DATE_PRESETS.map((p, i) => (
              <React.Fragment key={p.key}>
                <TouchableOpacity style={styles.cardRow} onPress={() => handlePresetSelect(p.key)} activeOpacity={0.65}>
                  <Text style={[styles.cardRowText, { fontFamily: typography.fonts.regular, color: colors.text }]}>{p.label}</Text>
                  {selectedPreset === p.key && !customRange ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
                {i < DATE_PRESETS.length - 1 ? <View style={styles.sep} /> : null}
              </React.Fragment>
            ))}
            <View style={styles.sep} />
            <TouchableOpacity style={styles.cardRow} onPress={() => setShowStartPicker(true)} activeOpacity={0.65}>
              <Text style={[styles.cardRowText, { fontFamily: typography.fonts.regular, color: colors.text }]}>Custom range</Text>
              {customRange ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
            </TouchableOpacity>
            {customRange ? (
              <View style={styles.dateRow}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateLbl, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>From</Text>
                  <Text style={[styles.dateVal, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{formatDate(customRange.startDate)}</Text>
                </TouchableOpacity>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateLbl, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>To</Text>
                  <Text style={[styles.dateVal, { fontFamily: typography.fonts.semibold, color: colors.text }]}>{formatDate(customRange.endDate)}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Type</Text>
          <View style={styles.pillRow}>
            {TYPE_OPTIONS.map(t => {
              const active = selectedType === t.key;
              return (
                <TouchableOpacity key={t.key} style={[styles.pill, active && styles.pillActive]} onPress={() => setSelectedType(t.key)} activeOpacity={0.7}>
                  <Text style={[styles.pillText, { fontFamily: typography.fonts.semibold }, active && styles.pillTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { fontFamily: typography.fonts.semibold, color: colors.textMuted }]}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardRow} onPress={() => setSelectedAccountId(null)} activeOpacity={0.65}>
              <Text style={[styles.cardRowText, { fontFamily: typography.fonts.regular, color: colors.text }]}>All accounts</Text>
              {selectedAccountId === null ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
            </TouchableOpacity>
            {accountsQuery.data?.map(acc => {
              const c = colorNumberToHex(acc.color);
              const selected = selectedAccountId === acc.id;
              return (
                <React.Fragment key={acc.id}>
                  <View style={styles.sep} />
                  <TouchableOpacity style={styles.cardRow} onPress={() => setSelectedAccountId(acc.id)} activeOpacity={0.65}>
                    <View style={styles.accRow}>
                      <IconAvatar icon={resolveIcon(acc.icon, 'wallet-outline')} color={c} variant="solid" size={24} iconSize={11} />
                      <Text style={[styles.cardRowText, { fontFamily: typography.fonts.regular, color: colors.text }]}>{acc.name}</Text>
                    </View>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.primary} /> : null}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Transactions</Text>
              <Text style={[styles.summaryValue, { fontFamily: typography.fonts.heading, color: colors.text }]}>{previewCount !== null ? previewCount.toLocaleString() : '...'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>Period</Text>
              <Text style={[styles.summaryPeriod, { fontFamily: typography.fonts.regular, color: colors.text }]}>{formatDate(effectiveDateRange.startDate)} — {formatDate(effectiveDateRange.endDate)}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.exportBtn, (isExporting || previewCount === 0) && { opacity: 0.5 }]} onPress={handleExport} disabled={isExporting || previewCount === 0} activeOpacity={0.8}>
            {isExporting ? <ActivityIndicator size="small" color={colors.background} /> : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.background} />
                <Text style={[styles.exportBtnText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>Export CSV</Text>
              </>
            )}
          </TouchableOpacity>

          {previewCount === 0 ? (
            <View style={styles.warning}>
              <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { fontFamily: typography.fonts.regular, color: colors.warning }]}>No transactions match the selected filters.</Text>
            </View>
          ) : null}
      </ScrollView>

      {showStartPicker ? <DateTimePicker value={customRange?.startDate || new Date()} mode="date" display="default" onChange={handleStartChange} maximumDate={new Date()} /> : null}
      {showEndPicker ? <DateTimePicker value={customRange?.endDate || new Date()} mode="date" display="default" onChange={handleEndChange} maximumDate={new Date()} /> : null}

      <OptionsDialog visible={showExportOptions} onClose={() => { setShowExportOptions(false); setExportedData(null); }} title="Export complete" subtitle={exportedData ? `${previewCount?.toLocaleString()} transactions ready` : 'Choose how to save'} options={[
        { key: 'save', label: Platform.OS === 'ios' ? 'Save to files' : 'Save to folder', icon: 'folder-outline', selected: false, onPress: handleSave },
        { key: 'share', label: 'Share to apps', icon: 'share-outline', selected: false, onPress: handleShare },
      ]} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, typography, spacing, radius, sizes, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: spacing('9') },

    label: { fontSize: 10, marginBottom: spacing('2.5'), paddingLeft: spacing('1'), opacity: 0.7 },

    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), overflow: 'hidden', marginBottom: spacing('5') },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing('4'), paddingVertical: spacing('3.5') },
    cardRowText: { fontSize: typography.sizes.sm },
    sep: { height: 1, backgroundColor: colors.text + '0C', marginHorizontal: 16 },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('2.5'), paddingHorizontal: spacing('4'), paddingBottom: spacing('4') },
    dateBtn: { flex: 1, backgroundColor: colors.background, borderRadius: radius('md'), padding: spacing('3'), borderWidth: 1, borderColor: colors.text + '0C' },
    dateLbl: { fontSize: 10, marginBottom: spacing('0.5'), opacity: 0.6 },
    dateVal: { fontSize: typography.sizes.sm },

    pillRow: { flexDirection: 'row', gap: spacing('2'), marginBottom: spacing('5') },
    pill: { flex: 1, height: 36, borderRadius: radius('md'), backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    pillActive: { backgroundColor: colors.text },
    pillText: { fontSize: typography.sizes.xs, color: colors.text },
    pillTextActive: { color: colors.background },

    accRow: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },

    summary: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), marginBottom: spacing('4'), gap: spacing('3') },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: typography.sizes.sm },
    summaryValue: { fontSize: 20 },
    summaryPeriod: { fontSize: typography.sizes.xs, opacity: 0.7 },

    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing('2.5'), height: sizes.button.lg.height, borderRadius: sizes.button.lg.borderRadius, backgroundColor: colors.text, marginBottom: spacing('3') },
    exportBtnText: { fontSize: sizes.button.lg.fontSize },

    warning: { flexDirection: 'row', alignItems: 'center', gap: spacing('2.5'), backgroundColor: colors.warning + '10', borderRadius: radius('md'), padding: spacing('3') },
    warningText: { flex: 1, fontSize: typography.sizes.xs, lineHeight: 18 },
  });
