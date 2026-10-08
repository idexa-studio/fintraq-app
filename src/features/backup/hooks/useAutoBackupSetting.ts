import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import { usePremium } from '@/src/providers/PremiumProvider';
import { runAutoBackupIfDue } from '@/src/services/backup/auto-backup.service';
import { syncBackgroundBackupTask } from '@/src/services/backup/background-backup.task';
import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import { LoggerService } from '@/shared/logging/logger';
import { NotificationService } from '@/src/services/notification.service';

export type SetAutoBackupResult = {
  /** Notification permission was denied, so nothing was enabled. */
  blockedByNotifications: boolean;
  /** First enable on Android — the caller should offer the battery-optimisation settings. */
  showBatteryPrompt: boolean;
};

const NO_PROMPTS: SetAutoBackupResult = { blockedByNotifications: false, showBatteryPrompt: false };
const switchKey = QUERY_KEYS.backup.autoBackupSwitch();

/** Applies the switch everywhere it matters: persisted pref, OS task, and a first run if due. */
async function applyAutoBackup(enabled: boolean, isPremium: boolean): Promise<SetAutoBackupResult> {
  if (enabled && !isPremium) return NO_PROMPTS;

  // Notifications are required, not advisory: backup status and "reconnect" alerts go through
  // them. Same hard gate the daily-reminder toggle uses — denied means nothing is enabled.
  if (enabled && !(await NotificationService.requestPermissions())) {
    LoggerService.info('GOOGLE_BACKUP', 'Auto-backup not enabled: notification permission denied');
    return { blockedByNotifications: true, showBatteryPrompt: false };
  }

  await BackupPreferences.setAutoBackupSwitch(enabled);
  await syncBackgroundBackupTask();
  LoggerService.info('GOOGLE_BACKUP', `Auto-backup ${enabled ? 'enabled' : 'disabled'}`);
  if (!enabled) return NO_PROMPTS;

  // Protect the user now rather than at the next launch/resume check.
  void runAutoBackupIfDue();
  const showBatteryPrompt = Platform.OS === 'android' && (await BackupPreferences.claimBatteryPrompt());
  return { blockedByNotifications: false, showBatteryPrompt };
}

/** The auto-backup switch. Effective only for Pro users, whatever was persisted. */
export function useAutoBackupSetting() {
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();

  const query = useQuery({
    queryKey: switchKey,
    queryFn: () => BackupPreferences.isAutoBackupSwitchOn(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    retry: false,
    mutationFn: (enabled: boolean) => applyAutoBackup(enabled, isPremium),
    onSuccess: (result, enabled) => {
      if (!result.blockedByNotifications && (isPremium || !enabled)) {
        queryClient.setQueryData(switchKey, enabled);
      }
    },
  });

  return {
    autoBackupEnabled: isPremium && query.data === true,
    setAutoBackupEnabled: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
