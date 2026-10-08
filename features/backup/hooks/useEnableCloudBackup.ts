import { useCallback } from 'react';
import type { GoogleUserAccount } from '@/platform/backup/backup.types';
import { useAutoBackupSetting, type SetAutoBackupResult } from '@/features/backup/hooks/useAutoBackupSetting';
import { useBackupAccount, useConnectBackupAccount } from '@/features/backup/hooks/useBackupAccount';

export type EnableCloudBackupResult =
  | { status: 'cancelled' }
  | ({ status: 'enabled'; account: GoogleUserAccount } & SetAutoBackupResult);

/**
 * "Set up cloud backup" as the user means it: connect Google Drive (if needed) *and* turn on
 * automatic backups. Every entry point — Backup screen, dashboard prompt, onboarding — goes
 * through here so none of them can connect an account yet leave backups off.
 */
export function useEnableCloudBackup() {
  const { account } = useBackupAccount();
  const connect = useConnectBackupAccount();
  const { setAutoBackupEnabled } = useAutoBackupSetting();

  const enableCloudBackup = useCallback(async (): Promise<EnableCloudBackupResult> => {
    const connected = account ?? (await connect.mutateAsync());
    if (!connected) return { status: 'cancelled' };
    const prompts = await setAutoBackupEnabled(true);
    return { status: 'enabled', account: connected, ...prompts };
  }, [account, connect, setAutoBackupEnabled]);

  return { enableCloudBackup, isEnabling: connect.isPending };
}
