import { Banner, Button, Card, Divider, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, SegmentedControl, SelectField, Text } from '@/src/components/ui';
import { CalendarBlankIcon } from '@/src/components/ui/icons';
import { Screen } from '@/src/components/ui/Screen';

import { IconAvatar } from '@/src/components/ui/IconAvatar';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { resolveAccountTypeIcon } from '@/src/utils/icons';
import type { AccountType } from '@/src/types';
import { Download01Icon, Folder01Icon, Share01Icon } from '@hugeicons/core-free-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { CsvExportService, ExportDateRange } from '@/src/features/export/api/csv-export.service';
import { useTranslation } from 'react-i18next';


const DATE_PRESETS = [
  { key: '7d', label: 'last7', days: 7 },
  { key: '30d', label: 'last30', days: 30 },
  { key: '90d', label: 'last90', days: 90 },
  { key: '12m', label: 'last12m', days: 365 },
] as const;

const TYPE_OPTIONS = [
  { key: 'ALL' as const, label: 'all' },
  { key: 'CR' as const, label: 'income' },
  { key: 'DR' as const, label: 'expense' },
  { key: 'TR' as const, label: 'transfer' },
] as const;

export const ExportScreen = React.memo(function ExportScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
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
      Alert.alert(t('export.failed'), error instanceof Error ? error.message : t('export.failedMessage'));
    } finally {
      setIsExporting(false);
    }
  }, [effectiveDateRange, selectedAccountId, selectedType, includeLoans, t]);

  const handleSave = useCallback(async () => {
    if (!exportedData) return;
    setShowExportOptions(false);
    try { await CsvExportService.saveToFolder(exportedData.content, exportedData.filename); }
    catch (error) { Alert.alert(t('export.saveFailed'), error instanceof Error ? error.message : t('export.saveFailedMessage')); }
    finally { setExportedData(null); }
  }, [exportedData, t]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;
    setShowExportOptions(false);
    try { await CsvExportService.shareFile(exportedData.content, exportedData.filename); }
    catch (error) { Alert.alert(t('export.shareFailed'), error instanceof Error ? error.message : t('export.shareFailedMessage')); }
    finally { setExportedData(null); }
  }, [exportedData, t]);

  return (
    <Screen header={{ title: t('export.title'), showBack: true }} variant="fixed" edges={['top', 'right', 'bottom', 'left']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Date range ── */}
        <ListGroup title={t('export.dateRange')} insetDividers={false} style={styles.group}>
          {DATE_PRESETS.map(p => (
            <ListItem
              key={p.key}
              title={t(`export.${p.label}`)}
              selected={selectedPreset === p.key && !customRange}
              onPress={() => handlePresetSelect(p.key)}
            />
          ))}
          <ListItem title={t('export.customRange')} selected={!!customRange} onPress={() => setShowStartPicker(true)} />
        </ListGroup>
        {customRange ? (
          <ListGroup insetDividers={false} style={styles.group}>
            <SelectField label={t('export.from')} value={formatDate(customRange.startDate)} trailingIcon={CalendarBlankIcon} onPress={() => setShowStartPicker(true)} />
            <SelectField label={t('export.to')} value={formatDate(customRange.endDate)} trailingIcon={CalendarBlankIcon} onPress={() => setShowEndPicker(true)} />
          </ListGroup>
        ) : null}

        {/* ── Type ── */}
        <Text variant="label" tone="muted" style={styles.sectionLabel}>{t('export.type')}</Text>
        <SegmentedControl
          options={TYPE_OPTIONS.map(opt => ({ value: opt.key, label: t(`export.${opt.label}`) }))}
          value={selectedType}
          onChange={setSelectedType}
          style={styles.group}
        />

        {/* ── Account ── */}
        <ListGroup title={t('export.account')} style={styles.group}>
          <ListItem title={t('export.allAccounts')} selected={selectedAccountId === null} onPress={() => setSelectedAccountId(null)} />
          {accountsQuery.data?.map(acc => (
            <ListItem
              key={acc.id}
              title={acc.name}
              leading={<IconAvatar icon={resolveAccountTypeIcon(acc.accountType as AccountType | null)} color={colorNumberToHex(acc.color)} variant="subtle" size={LIST_ITEM_LEADING_SIZE} />}
              selected={selectedAccountId === acc.id}
              onPress={() => setSelectedAccountId(acc.id)}
            />
          ))}
        </ListGroup>

        {/* ── Options ── */}
        <ListGroup title={t('export.options')} style={styles.group}>
          <ListItem title={t('export.includeLoans')} switchValue={includeLoans} onSwitchChange={setIncludeLoans} />
        </ListGroup>

        {/* ── Summary ── */}
        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text variant="callout" tone="muted">{t('export.transactions')}</Text>
            <Text variant="title">{previewCount !== null ? previewCount.toLocaleString() : '—'}</Text>
          </View>
          <Divider />
          <View style={styles.summaryRow}>
            <Text variant="callout" tone="muted">{t('export.period')}</Text>
            <Text variant="caption" tone="muted">
              {formatDate(effectiveDateRange.startDate)} — {formatDate(effectiveDateRange.endDate)}
            </Text>
          </View>
        </Card>

        {/* ── Export button ── */}
        <Button
          title={t('export.title')}
          icon={Download01Icon}
          onPress={handleExport}
          disabled={previewCount === 0}
          isLoading={isExporting}
          size="lg"
          fullWidth
        />

        {previewCount === 0 ? (
          <Banner tone="warning" title={t('export.noMatch')} style={styles.warning} />
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
        title={t('export.ready')}
        subtitle={exportedData ? t('export.readyCount', { count: previewCount ?? 0 }) : t('export.chooseSave')}
        options={[
          { key: 'save', label: Platform.OS === 'ios' ? t('export.saveToFiles') : t('export.saveToFolder'), icon: Folder01Icon, selected: false, onPress: handleSave },
          { key: 'share', label: t('export.shareToApps'), icon: Share01Icon, selected: false, onPress: handleShare },
        ]}
      />
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('10'),
    },
    group: { marginBottom: spacing('5') },
    sectionLabel: { marginBottom: spacing('2'), marginLeft: spacing('1') },
    summary: { marginBottom: spacing('4'), gap: spacing('3') },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing('3'),
    },
    warning: { marginTop: spacing('3') },
  });
