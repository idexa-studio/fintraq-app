import { Button, Header, Message, Notice, Screen, useStyles } from '@/design';
import type { Theme } from '@/design';
import { BackupLink, useAutoBackupSetting, useBackupAccount, useBackupProgress, useCloudBackupActions, useConnectBackupAccount, useDisconnectBackupAccount } from '@/features/backup';
import { useOnboarding } from '@/features/onboarding/FirstRunProvider';
import { usePro } from '@/features/pro';
import { restartApp } from '@/platform/config/restart';
import { isNoBackupError, isProRequiredError, isTransientDriveError } from '@/platform/drive/google-drive.errors';
import { Analytics } from '@/platform/telemetry';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

type Failure = { why: 'noBackup' | 'needsPro' | 'offline' | 'other'; email: string };

/**
 * Coming back with a backup: sign in to the Drive it is in, and everything
 * in it is brought down to this phone. The picture is the same one Backup
 * uses, filling from the Drive towards the phone as the restore runs.
 */
export function RestoreScreen() {
  const { t } = useTranslation('firstRun');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { openPaywall } = usePro();
  const { account } = useBackupAccount();
  const { mutateAsync: connect } = useConnectBackupAccount();
  const { mutateAsync: disconnect } = useDisconnectBackupAccount();
  const { isRestoring, progress, stage } = useBackupProgress();
  const { restoreLatest } = useCloudBackupActions();
  const { setAutoBackupEnabled } = useAutoBackupSetting();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState<Failure | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(onboarding)'));

  const restore = async () => {
    setWorking(true);
    setFailed(null);
    let email = account?.email ?? '';
    try {
      const signedIn = account ?? (await connect());
      // Backing out of the sign-in is not a failure: the screen simply waits.
      if (!signedIn) return;
      email = signedIn.email;
      await restoreLatest();
      Analytics.track('backup_restored');
      // Someone restoring onto a new phone uses backup: keep them covered here too. A refused
      // notification permission must not undo a restore that worked.
      await setAutoBackupEnabled(true).catch((e) => LoggerService.warn('FIRST_RUN', 'Could not switch automatic backup on after the restore', e));
      await completeOnboarding();
      // What was restored went straight to storage, past everything held in memory.
      if (!(await restartApp())) router.replace('/(main)/(tabs)');
    } catch (e) {
      const cause = e instanceof Error && e.cause !== undefined ? e.cause : e;
      const why: Failure['why'] = isNoBackupError(cause) ? 'noBackup' : isProRequiredError(cause) ? 'needsPro' : isTransientDriveError(cause) ? 'offline' : 'other';
      LoggerService.warn('FIRST_RUN', `Restore failed: ${why}`, e);
      // Signed out again, so trying another account starts from the account chooser.
      await disconnect().catch(() => undefined);
      setFailed({ why, email });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Screen
      scroll={false}
      header={<Header onBack={working ? undefined : back} backLabel={t('restore.back')} />}
      footer={
        <>
          <Button label={isRestoring ? t('restore.working', { percent: progress }) : t('restore.connect')} loading={working && !isRestoring} disabled={isRestoring} onPress={restore} />
          <Button label={t('restore.fresh')} variant="secondary" disabled={working} onPress={() => router.replace('/(onboarding)/setup')} />
        </>
      }
    >
      <View style={styles.centre}>
        <View style={styles.picture}>
          <BackupLink state={isRestoring ? 'fetching' : 'apart'} value={progress / 100} phoneLabel={t('restore.phone')} driveLabel={t('restore.drive')} accessibilityLabel={t('restore.title')} />
        </View>
        <Message title={t('restore.title')} body={isRestoring && stage ? stage : t('restore.body')} />
        {failed ? (
          <Notice
            tone="danger"
            title={t('restore.failed.title')}
            body={t(`restore.failed.${failed.why}`, { email: failed.email })}
            linkLabel={failed.why === 'needsPro' ? t('restore.failed.seePro') : undefined}
            onLink={() => openPaywall('backup')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    centre: { flex: 1, justifyContent: 'center', gap: space.xl },
    // The picture is kept narrow, so the two ends read as a pair.
    picture: { paddingHorizontal: space.xxl },
  });
