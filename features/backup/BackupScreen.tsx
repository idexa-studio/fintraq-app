import { Button, Dialog, Header, ListGroup, ListRow, Message, Notice, Screen, Section, Skeleton, Switch, Text, useStyles, useTheme, useToast } from '@/design';
import type { Theme } from '@/design';
import { backupDay, failureOf, nextAutoBackup, remedyOf, sizeText } from '@/features/backup/backup-rules';
import type { BackupFailure } from '@/features/backup/backup-rules';
import { BackupCard } from '@/features/backup/components/BackupCard';
import { BackupLink } from '@/features/backup/components/BackupLink';
import { useAutoBackupSetting } from '@/features/backup/hooks/useAutoBackupSetting';
import { useBackupAccount, useDisconnectBackupAccount } from '@/features/backup/hooks/useBackupAccount';
import { useBackupProgress } from '@/features/backup/hooks/useBackupProgress';
import { useCloudBackupActions } from '@/features/backup/hooks/useCloudBackupActions';
import { useEnableCloudBackup } from '@/features/backup/hooks/useEnableCloudBackup';
import { useLatestBackup } from '@/features/backup/hooks/useLatestBackup';
import { ProGateScreen, usePro } from '@/features/pro';
import { isBackupOverdue } from '@/platform/backup/backup-schedule';
import { openAppSettings, openBatteryOptimizationSettings } from '@/platform/backup/battery-optimization';
import { restartApp } from '@/platform/config/restart';
import { Analytics } from '@/platform/telemetry';
import { formatDate } from '@/shared/date/date';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

/** What was being done when something failed: it titles the notice. */
type Attempt = 'backup' | 'restore' | 'connect' | 'disconnect' | 'auto';
type Asking = 'restore' | 'replace' | 'disconnect' | 'battery' | 'restored' | null;

/**
 * Backup to the user's own Google Drive. The screen opens on the state, in
 * words: when the last backup was made and where it is. Pro as a whole until
 * the free backup file arrives (plan H1).
 */
export function BackupScreen() {
  const { isPro, ready } = usePro();
  if (!ready) return <Screen>{null}</Screen>;
  return isPro ? <Backup /> : <ProGateScreen feature="backup" />;
}

function Backup() {
  const { t } = useTranslation('backup');
  const { size } = useTheme();
  const styles = useStyles(createStyles);
  const router = useRouter();
  const toast = useToast();

  const { account, isLoading: findingAccount } = useBackupAccount();
  const { latestBackup, isFromAnotherInstall, isLoading: findingBackup } = useLatestBackup();
  const { isRestoring, isBusy, progress, stage } = useBackupProgress();
  const { autoBackupEnabled, setAutoBackupEnabled, isUpdating } = useAutoBackupSetting();
  const { enableCloudBackup, isEnabling } = useEnableCloudBackup();
  const disconnect = useDisconnectBackupAccount();
  const { backupNow, restoreLatest } = useCloudBackupActions();

  const [asking, setAsking] = useState<Asking>(null);
  const [failed, setFailed] = useState<{ attempt: Attempt; why: BackupFailure } | null>(null);
  // Notifications were refused, so automatic backup stayed off: said beside the switch until it works.
  const [blocked, setBlocked] = useState(false);
  // The battery settings could not be opened for the user, so the way there is spelled out.
  const [batteryManual, setBatteryManual] = useState(false);
  const [restartFailed, setRestartFailed] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const header = <Header title={t('title')} onBack={back} backLabel={t('back')} />;

  const fail = (attempt: Attempt) => (error: unknown) => {
    LoggerService.warn('BACKUP_UI', `${attempt} failed`, error);
    setFailed({ attempt, why: failureOf(error) });
  };
  const openBattery = () => void openBatteryOptimizationSettings(() => setBatteryManual(true));

  /** What switching automatic backup on turned up: a refusal to say, or the battery question to ask once. */
  const follow = (result: { blockedByNotifications: boolean; showBatteryPrompt: boolean }) => {
    setBlocked(result.blockedByNotifications);
    if (!result.blockedByNotifications && result.showBatteryPrompt) setAsking('battery');
  };

  const connect = async () => {
    setFailed(null);
    try {
      const result = await enableCloudBackup();
      if (result.status === 'cancelled') return;
      toast.show({ message: t('done.connected') });
      follow(result);
    } catch (e) {
      fail('connect')(e);
    }
  };

  const setAuto = (on: boolean) => {
    setFailed(null);
    setAutoBackupEnabled(on).then(on ? follow : () => setBlocked(false), fail('auto'));
  };

  const backUp = async () => {
    setAsking(null);
    setFailed(null);
    try {
      await backupNow();
      Analytics.track('backup_created');
      toast.show({ message: t('done.backup') });
    } catch (e) {
      fail('backup')(e);
    }
  };

  const restore = async () => {
    setAsking(null);
    setFailed(null);
    try {
      await restoreLatest();
      Analytics.track('backup_restored');
      setAsking('restored');
    } catch (e) {
      fail('restore')(e);
    }
  };

  // Everything in memory describes the data that was just replaced, so the app starts again.
  const restart = async () => {
    if (await restartApp()) return;
    setAsking(null);
    setRestartFailed(true);
    router.replace('/');
  };

  const leave = async () => {
    setAsking(null);
    setFailed(null);
    try {
      await disconnect.mutateAsync();
      toast.show({ message: t('done.disconnected') });
    } catch (e) {
      fail('disconnect')(e);
    }
  };

  if (findingAccount) {
    return (
      <Screen header={header}>
        <Skeleton height={size.row * 3} />
        <Skeleton height={size.row * 2} />
      </Screen>
    );
  }

  const failure = failed ? (
    <Notice
      tone="danger"
      title={t(`failed.${failed.attempt}`)}
      body={t(`failed.why.${failed.why}`, { email: account?.email ?? '' })}
      linkLabel={remedyOf(failed.why) ? t('failed.reconnect') : undefined}
      onLink={connect}
    />
  ) : null;

  if (!account) {
    return (
      <Screen scroll={false} header={header} footer={<Button label={t('connect.action')} loading={isEnabling} onPress={connect} />}>
        <View style={styles.centre}>
          <View style={styles.picture}>
            <BackupLink state="apart" phoneLabel={t('phone')} driveLabel={t('drive')} accessibilityLabel={t('state.none')} />
          </View>
          <Message title={t('connect.title')} body={t('connect.body')} />
          <Text variant="callout" tone="muted" align="center">{t('connect.private')}</Text>
          {failure}
        </View>
      </Screen>
    );
  }

  const madeOn = latestBackup ? new Date(latestBackup.modifiedTime) : null;
  const dateText = madeOn ? formatDate(madeOn, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const day = latestBackup ? backupDay(latestBackup.modifiedTime) : null;
  const stateTitle = !madeOn || !day
    ? findingBackup ? t('state.checking') : t('state.none')
    : day === 'earlier' ? t('state.earlier', { date: dateText }) : t(`state.${day}`, { time: formatDate(madeOn, { hour: 'numeric', minute: '2-digit' }) });
  const sizeLabel = latestBackup ? sizeText(latestBackup.size) : '';
  // Background work can be stopped by the phone without a word; say so instead of looking protected.
  const next = nextAutoBackup(latestBackup?.modifiedTime);
  const overdue = autoBackupEnabled && isBackupOverdue(latestBackup?.modifiedTime, Date.now());

  return (
    <Screen header={header}>
      {failure}

      <BackupCard
        title={isBusy ? t(isRestoring ? 'running.restore' : 'running.backup', { percent: progress }) : stateTitle}
        detail={isBusy && stage ? stage : !latestBackup && !findingBackup ? t('state.noneBody') : sizeLabel ? t('state.whereSize', { email: account.email, size: sizeLabel }) : t('state.where', { email: account.email })}
        hasBackup={!!latestBackup}
        working={isBusy ? { operation: isRestoring ? 'restore' : 'backup', value: progress / 100 } : undefined}
        phoneLabel={t('phone')}
        driveLabel={t('drive')}
        backUpLabel={t('backUp')}
        restoreLabel={t('restore')}
        // A backup this phone never restored is only replaced on purpose.
        onBackUp={isFromAnotherInstall ? () => setAsking('replace') : backUp}
        onRestore={() => setAsking('restore')}
      />

      {isFromAnotherInstall && latestBackup ? <Notice tone="warning" title={t('other.title')} body={t('other.body', { date: dateText })} /> : null}
      {overdue ? <Notice tone="warning" title={t('overdue.title')} body={t('overdue.body')} linkLabel={t('overdue.link')} onLink={openBattery} /> : null}
      {restartFailed ? <Notice tone="warning" title={t('restored.manualTitle')} body={t('restored.manualBody')} /> : null}

      <Section title={t('auto.title')}>
        <ListGroup>
          <ListRow
            icon="repeat"
            title={t('auto.label')}
            subtitle={!autoBackupEnabled ? t('auto.off') : next ? t('auto.onNext', { time: formatDate(next, { hour: 'numeric', minute: '2-digit' }) }) : t('auto.on')}
            trailing={<Switch value={autoBackupEnabled} onValueChange={setAuto} disabled={isUpdating} accessibilityLabel={t('auto.label')} />}
          />
          {Platform.OS === 'android' && autoBackupEnabled ? <ListRow icon="battery-charging" title={t('auto.battery')} subtitle={batteryManual ? t('auto.batteryManual') : t('auto.batteryHint')} onPress={openBattery} /> : null}
        </ListGroup>
        {blocked ? <Notice tone="warning" title={t('auto.blockedTitle')} body={t('auto.blockedBody')} linkLabel={t('auto.openSettings')} onLink={() => void openAppSettings()} /> : null}
      </Section>

      <Section title={t('account.title')}>
        <ListGroup>
          <ListRow icon="cloud" title={account.email} subtitle={t('account.drive')} />
          <ListRow icon="cloud-slash" title={t('account.disconnect')} destructive disabled={isBusy} onPress={() => setAsking('disconnect')} />
        </ListGroup>
        <Text variant="callout" tone="muted">{t('connect.private')}</Text>
      </Section>

      <Dialog visible={asking === 'restore'} onRequestClose={() => setAsking(null)} title={t('restoreConfirm.title')} body={t('restoreConfirm.body', { date: dateText })}>
        <Button label={t('restoreConfirm.confirm')} variant="danger" onPress={restore} />
        <Button label={t('restoreConfirm.keep')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'replace'} onRequestClose={() => setAsking(null)} title={t('replace.title')} body={t('replace.body', { date: dateText })}>
        <Button label={t('replace.confirm')} variant="danger" onPress={backUp} />
        <Button label={t('replace.keep')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'disconnect'} onRequestClose={() => setAsking(null)} title={t('account.confirmTitle')} body={t('account.confirmBody')}>
        <Button label={t('account.confirm')} variant="danger" loading={disconnect.isPending} onPress={leave} />
        <Button label={t('account.keep')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      <Dialog visible={asking === 'battery'} onRequestClose={() => setAsking(null)} title={t('auto.promptTitle')} body={t('auto.promptBody')}>
        <Button label={t('auto.promptYes')} onPress={() => { setAsking(null); openBattery(); }} />
        <Button label={t('auto.promptNo')} variant="secondary" onPress={() => setAsking(null)} />
      </Dialog>
      {/* No way out but the restart: the screens behind still show what was replaced. */}
      <Dialog visible={asking === 'restored'} title={t('restored.title')} body={t('restored.body', { date: dateText })}>
        <Button label={t('restored.restart')} onPress={restart} />
      </Dialog>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center', gap: space.xl },
    // The picture is kept narrow, so the two ends read as a pair.
    picture: { paddingHorizontal: space.xxl },
  });
