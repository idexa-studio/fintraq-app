import { Button, Dialog, ListGroup, ListRow, Notice, Section } from '@/design';
import { fileFailureOf } from '@/features/backup/backup-rules';
import type { FileFailure } from '@/features/backup/backup-rules';
import { chooseBackupFile, restoreBackupFile, saveBackupFile } from '@/platform/backup/file-backup';
import type { ChosenBackup } from '@/platform/backup/file-backup';
import { restartApp } from '@/platform/config/restart';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { LoggerService } from '@/shared/logging/logger';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Step = 'save' | 'restore';

/**
 * The backup the user keeps themselves: everything as one file, saved or
 * sent through the system's share sheet, and restored from a file they
 * choose. Free, and needs no account. A chosen file is read and checked
 * before the question is asked, so the confirmation can say what is in it.
 */
export function FileBackup({ onRestored }: { onRestored?: () => Promise<void> }) {
  const { t } = useTranslation('backup');
  const queryClient = useQueryClient();
  const [working, setWorking] = useState<Step | null>(null);
  const [failed, setFailed] = useState<{ step: Step; why: FileFailure } | null>(null);
  const [chosen, setChosen] = useState<ChosenBackup | null>(null);
  const [restored, setRestored] = useState<ChosenBackup | null>(null);
  const [restartFailed, setRestartFailed] = useState(false);

  const fail = (step: Step, error: unknown) => {
    LoggerService.warn('FILE_BACKUP_UI', `${step} failed`, error);
    setFailed({ step, why: fileFailureOf(error) });
  };
  const day = (backup: ChosenBackup) => formatDate(new Date(backup.metadata.timestamp), { day: 'numeric', month: 'long', year: 'numeric' });

  const save = async () => {
    setFailed(null);
    setWorking('save');
    try {
      await saveBackupFile(t('file.shareTitle'));
      Analytics.track('backup_created');
    } catch (e) {
      fail('save', e);
    } finally {
      setWorking(null);
    }
  };

  const choose = async () => {
    setFailed(null);
    setWorking('restore');
    try {
      setChosen(await chooseBackupFile());
    } catch (e) {
      fail('restore', e);
    } finally {
      setWorking(null);
    }
  };

  const restore = async () => {
    if (!chosen) return;
    const backup = chosen;
    setChosen(null);
    setWorking('restore');
    try {
      await restoreBackupFile(backup);
      Analytics.track('backup_restored');
      // Every cached query now describes data that no longer exists.
      queryClient.clear();
      await onRestored?.();
      setRestored(backup);
    } catch (e) {
      fail('restore', e);
    } finally {
      setWorking(null);
    }
  };

  // Everything in memory describes the data that was just replaced, so the app starts again.
  const restart = async () => {
    if (await restartApp()) return;
    setRestored(null);
    setRestartFailed(true);
  };

  return (
    <Section title={t('file.title')} hint={t('file.hint')}>
      {failed ? <Notice tone="danger" title={t(`file.failed.${failed.step}`)} body={t(`file.failed.${failed.why}`)} /> : null}
      {restartFailed ? <Notice tone="warning" title={t('file.manualTitle')} body={t('file.manualBody')} /> : null}
      <ListGroup>
        <ListRow icon="download-simple" title={t('file.save')} subtitle={t('file.saveHint')} disabled={working !== null} onPress={save} />
        <ListRow icon="upload" title={t('file.restore')} subtitle={t('file.restoreHint')} disabled={working !== null} onPress={choose} />
      </ListGroup>

      <Dialog
        visible={chosen !== null}
        onRequestClose={() => setChosen(null)}
        title={t('file.confirmTitle')}
        body={chosen ? t('file.confirmBody', { date: day(chosen), accounts: chosen.metadata.counts.accounts, transactions: chosen.metadata.counts.payments }) : undefined}
      >
        <Button label={t('file.confirm')} variant="danger" onPress={restore} />
        <Button label={t('file.keep')} variant="secondary" onPress={() => setChosen(null)} />
      </Dialog>
      {/* No way out but the restart: the screens behind still show what was replaced. */}
      <Dialog visible={restored !== null} title={t('file.restoredTitle')} body={restored ? t('file.restoredBody', { date: day(restored) }) : undefined}>
        <Button label={t('file.restart')} onPress={restart} />
      </Dialog>
    </Section>
  );
}
