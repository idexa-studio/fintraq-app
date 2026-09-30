import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/src/lib/query-keys';
import { usePremium } from '@/src/providers/PremiumProvider';
import type { GoogleUserAccount } from '@/src/services/backup/backup.types';
import { BackupPreferences } from '@/src/services/backup/backup-preferences';
import { CloudBackupProRequiredError } from '@/src/services/backup/google-drive.errors';
import { GoogleDriveService } from '@/src/services/backup/google-drive.service';
import { LoggerService } from '@/src/services/logger.service';

const accountKey = QUERY_KEYS.backup.account();

/**
 * The connected Google account, shared by every screen. Firebase auth state is the source of
 * truth: the subscription keeps the cache in step with sign-in, sign-out, and a session the
 * Drive layer ended — so all screens agree without remounting.
 */
export function useBackupAccount() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: accountKey,
    queryFn: () => GoogleDriveService.getCurrentUser(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(
    () => GoogleDriveService.subscribeToAccount((account) => queryClient.setQueryData(accountKey, account)),
    [queryClient],
  );

  const account = query.data ?? null;
  return { account, isConnected: account !== null, isLoading: query.isPending };
}

/** Google sign-in. Never retried automatically — a retry would reopen the sign-in sheet. */
export function useConnectBackupAccount() {
  const queryClient = useQueryClient();
  const { isPremium } = usePremium();

  return useMutation({
    retry: false,
    mutationFn: async (): Promise<GoogleUserAccount | null> => {
      if (!isPremium) throw new CloudBackupProRequiredError();
      return GoogleDriveService.signIn();
    },
    onSuccess: (account) => {
      if (!account) return;
      LoggerService.info('GOOGLE_BACKUP', `Connected Google account: ${account.email}`);
      queryClient.setQueryData(accountKey, account);
    },
  });
}

export function useDisconnectBackupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async () => {
      await GoogleDriveService.signOut();
      await BackupPreferences.clearBackupCache();
    },
    onSuccess: () => {
      queryClient.setQueryData(accountKey, null);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.backup.latests() });
      LoggerService.info('GOOGLE_BACKUP', 'Disconnected Google account and cleared backup cache');
    },
  });
}
