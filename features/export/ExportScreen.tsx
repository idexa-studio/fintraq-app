import { CsvExportService } from '@/data/export/csv-export';
import { Button, Calendar, Card, Chip, Header, IconCircle, ListGroup, ListRow, Notice, OptionList, Screen, Section, Sheet, Switch, Text, TextField, useStyles, useToast } from '@/design';
import type { Theme } from '@/design';
import { accountTypeIcon, useAccounts } from '@/features/accounts';
import { ExportPreview } from '@/features/export/components/ExportPreview';
import { EXPORT_KINDS, EXPORT_PERIODS, exportBlockerOf, exportOptionsOf, newExportDraft, previewFiltersOf, rangeOf } from '@/features/export/export-rules';
import type { ExportDraft } from '@/features/export/export-rules';
import { ProGateScreen, usePro } from '@/features/pro';
import { useTransactions } from '@/features/transactions';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import { LoggerService } from '@/shared/logging/logger';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

/** How many rows of the file the preview shows. */
const PREVIEW_ROWS = 3;

type Step = 'save' | 'share';

/**
 * A spreadsheet of what was recorded, to save or share. The file is shown
 * first, as it will be, and follows every choice made under it. Pro as a
 * whole, so a free user arriving by any way sees what it is instead.
 */
export function ExportScreen() {
  const { isPro, ready } = usePro();
  if (!ready) return <Screen>{null}</Screen>;
  return isPro ? <Export /> : <ProGateScreen feature="export" />;
}

function Export() {
  const { t } = useTranslation(['export', 'common']);
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();
  const { data: accounts } = useAccounts();

  const [draft, setDraft] = useState<ExportDraft>(() => newExportDraft());
  const [picking, setPicking] = useState<'from' | 'to' | 'account' | null>(null);
  const [working, setWorking] = useState<Step | null>(null);
  const [failed, setFailed] = useState<Step | 'make' | null>(null);
  const change = (next: Partial<ExportDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setFailed(null);
  };

  // The day the screen was opened: a period counted back from "now" must not shift while the user is choosing.
  const [opened] = useState(() => new Date());
  const options = useMemo(() => exportOptionsOf(draft, opened), [draft, opened]);
  const filters = useMemo(() => previewFiltersOf(draft, opened), [draft, opened]);
  const range = rangeOf(draft, opened);

  const { data: count } = useQuery({ queryKey: ['export', 'count', filters], queryFn: () => CsvExportService.getTransactionCount(options) });
  const { data: rows } = useTransactions(PREVIEW_ROWS, filters);
  const blocker = exportBlockerOf(count, draft.includeLoans);

  const account = draft.accountId === null ? null : accounts?.find((a) => a.id === draft.accountId);
  const day = (date: Date) => formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
  // The first day drops its year when both days share one, so the line stays short.
  const firstDay = range.startDate.getFullYear() === range.endDate.getFullYear() ? formatDate(range.startDate, { day: 'numeric', month: 'short' }) : day(range.startDate);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const make = async (step: Step) => {
    setFailed(null);
    setWorking(step);
    let file: { content: string; filename: string };
    try {
      file = await CsvExportService.exportToCsv(options);
    } catch (e) {
      LoggerService.warn('EXPORT_UI', 'Building the file failed', e);
      setFailed('make');
      setWorking(null);
      return;
    }
    try {
      if (step === 'share') {
        await CsvExportService.shareFile(file.content, file.filename);
        Analytics.track('data_exported', { destination: 'share' });
      } else if ((await CsvExportService.saveToFolder(file.content, file.filename)) === 'saved') {
        Analytics.track('data_exported', { destination: 'save' });
        // iOS confirms in its own sheet; Android writes silently, so the app says where it went.
        if (Platform.OS === 'android') toast.show({ message: t('done.saved', { name: file.filename }) });
      }
    } catch (e) {
      LoggerService.warn('EXPORT_UI', `${step} failed`, e);
      setFailed(step);
    } finally {
      setWorking(null);
    }
  };

  return (
    <Screen
      header={<Header title={t('title')} onBack={back} backLabel={t('back')} />}
      footer={
        <>
          {blocker ? <Text variant="callout" tone="muted" align="center">{t(`blocked.${blocker}`)}</Text> : null}
          <Button label={Platform.OS === 'ios' ? t('saveIos') : t('save')} disabled={!!blocker || working === 'share'} loading={working === 'save'} onPress={() => make('save')} />
          <Button label={t('share')} variant="secondary" disabled={!!blocker || working === 'save'} loading={working === 'share'} onPress={() => make('share')} />
        </>
      }
    >
      {failed ? <Notice tone="danger" title={t(failed === 'make' ? 'failed.title' : `failed.${failed}`)} body={t('failed.body')} /> : null}

      <ExportPreview
        title={count === undefined ? t('file.counting') : count === 0 ? t('file.none') : t('file.count', { count })}
        scope={t('file.scope', { from: firstDay, to: day(range.endDate), account: account?.name ?? t('choose.allAccounts') })}
        rows={rows}
        more={count !== undefined && rows && count > rows.length ? t('file.more', { count: count - rows.length }) : undefined}
        empty={t('file.empty')}
        note={draft.includeLoans ? `${t('file.loans')}. ${t('file.format')}` : t('file.format')}
        columns={{ date: t('file.columns.date'), what: t('file.columns.what'), amount: t('file.columns.amount') }}
        today={t('common:today')}
        yesterday={t('common:yesterday')}
        accessibilityLabel={t('file.label')}
      />

      <Section title={t('choose.title')} hint={t('choose.hint')}>
        <Card style={styles.choices}>
          <View style={styles.choice}>
            <Text variant="callout" tone="muted">{t('choose.period')}</Text>
            <View style={styles.chips} accessibilityRole="tablist">
              {EXPORT_PERIODS.map((days) => <Chip key={days} label={t(`choose.periods.d${days}`)} selected={draft.period === days} onPress={() => change({ period: days })} />)}
              <Chip label={t('choose.periods.custom')} selected={draft.period === 'custom'} onPress={() => change({ period: 'custom' })} />
            </View>
            {draft.period === 'custom' ? (
              // One under the other: side by side, a full date does not fit beside its label.
              <View style={styles.dates}>
                <TextField label={t('choose.from')} value={day(range.startDate)} onPress={() => setPicking('from')} />
                <TextField label={t('choose.to')} value={day(range.endDate)} onPress={() => setPicking('to')} />
              </View>
            ) : null}
          </View>
          <View style={styles.choice}>
            <Text variant="callout" tone="muted">{t('choose.kind')}</Text>
            <View style={styles.chips} accessibilityRole="tablist">
              {EXPORT_KINDS.map((kind) => <Chip key={kind} label={t(`choose.kinds.${kind}`)} selected={draft.kind === kind} onPress={() => change({ kind })} />)}
            </View>
          </View>
        </Card>
        <ListGroup>
          <ListRow
            leading={account ? <IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} /> : undefined}
            icon={account ? undefined : 'wallet'}
            title={t('choose.account')}
            subtitle={account?.name ?? t('choose.allAccounts')}
            onPress={() => setPicking('account')}
          />
          <ListRow
            icon="hand-coins"
            title={t('choose.loans')}
            subtitle={t('choose.loansHint')}
            trailing={<Switch value={draft.includeLoans} onValueChange={(includeLoans) => change({ includeLoans })} accessibilityLabel={t('choose.loans')} />}
          />
        </ListGroup>
      </Section>

      <Sheet visible={picking === 'from' || picking === 'to'} onClose={() => setPicking(null)} title={t(picking === 'to' ? 'choose.pickTo' : 'choose.pickFrom')} footer={<Button label={t('choose.done')} onPress={() => setPicking(null)} />}>
        <Calendar
          value={picking === 'to' ? range.endDate : range.startDate}
          max={opened}
          onChange={(date) => change(picking === 'to' ? { from: range.startDate, to: date } : { from: date, to: range.endDate })}
        />
      </Sheet>

      <Sheet visible={picking === 'account'} onClose={() => setPicking(null)} title={t('choose.account')}>
        <OptionList
          groups={[{
            options: [
              { key: 'all', title: t('choose.allAccounts'), icon: 'wallet' },
              ...(accounts ?? []).map((a) => ({ key: String(a.id), title: a.name, value: a.currency, leading: <IconCircle icon={accountTypeIcon(a.accountType)} color={colorNumberToHex(a.color)} /> })),
            ],
          }]}
          selectedKey={draft.accountId === null ? 'all' : String(draft.accountId)}
          onSelect={(key) => {
            change({ accountId: key === 'all' ? null : Number(key) });
            setPicking(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    choices: { gap: space.xl },
    choice: { gap: space.md },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    dates: { gap: space.md },
  });
