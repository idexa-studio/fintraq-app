import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import googleServicesConfig from '@/google-services.json';
import i18n from '@/src/i18n';
import { LoggerService } from '@/src/services/logger.service';
import type { CloudBackupFileMeta, GoogleUserAccount } from './backup.types';
import {
  GoogleDriveAuthError,
  GoogleDriveHttpError,
  GoogleDriveNetworkError,
  isScopeDeniedError,
  isTokenGrantError,
} from './google-drive.errors';
import { DriveProgressCallback, driveFetch, driveXhrRequest, transferTimeoutMs } from './google-drive.http';

type DriveFileResource = {
  id?: string;
  name?: string;
  modifiedTime?: string;
  size?: string | number;
};

type DriveFileList = { files?: DriveFileResource[] };

type OAuthClientEntry = { client_id?: string; client_type?: number };
type GoogleServicesConfig = { client?: { oauth_client?: OAuthClientEntry[] }[] };

const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = 'fintraq_backup.json';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_FIELDS = 'id,name,modifiedTime,size';

// Firebase restores the persisted session natively; on a cold headless start the JS side can
// briefly report no user. Bounded so a broken auth module can't stall a background task.
const AUTH_RESTORE_TIMEOUT_MS = 5_000;
// Token fetches right after the radio wakes from Doze can fail transiently; a couple of spaced
// attempts ride that out. Definitive answers (no saved credential, revoked grant) end it early.
const TOKEN_ATTEMPTS = 3;
const TOKEN_RETRY_BASE_MS = 1_000;
// OAuth client type 3 = web client, required to mint the idToken Firebase needs.
const WEB_CLIENT_TYPE = 3;

function getWebClientId(): string | undefined {
  const config = googleServicesConfig as GoogleServicesConfig;
  return config.client?.[0]?.oauth_client?.find((c) => c.client_type === WEB_CLIENT_TYPE)?.client_id;
}

function mapFirebaseUser(user: FirebaseUser): GoogleUserAccount {
  return { id: user.uid, email: user.email ?? '', name: user.displayName, photo: user.photoURL };
}

function toFileMeta(file: DriveFileResource, fallback: { id: string; size?: number }): CloudBackupFileMeta {
  return {
    id: file.id || fallback.id,
    name: file.name || BACKUP_FILENAME,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    size: Number(file.size ?? fallback.size ?? 0),
  };
}

// Upper bound (UTF-16 code units × 2) — only sizes a timeout, so no need to encode the payload.
const approxByteLength = (value: string) => value.length * 2;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, sleep(ms).then(() => undefined)]);
}

/**
 * Google Drive appDataFolder access plus the account session behind it.
 *
 * "Connected" means a Firebase user exists — Firebase persists it natively, so it resolves in
 * headless runs too. Drive calls need a Google OAuth token on top; when that grant is
 * definitively gone the session is ended on both sides, so every screen and the background task
 * agree the user must reconnect instead of retrying forever.
 */
class GoogleDriveServiceClass {
  private isInitialized = false;
  private activeTokenPromise: Promise<string> | null = null;
  private activeFindBackupPromise: Promise<CloudBackupFileMeta | null> | null = null;

  private initialize(force = false) {
    if (this.isInitialized && !force) return;
    try {
      const webClientId = getWebClientId();
      GoogleSignin.configure({
        ...(webClientId ? { webClientId } : {}),
        scopes: [DRIVE_APPDATA_SCOPE],
        offlineAccess: true,
      });
      this.isInitialized = true;
    } catch (e) {
      LoggerService.warn('GOOGLE_DRIVE', 'Failed to configure GoogleSignin', e);
    }
  }

  // ── Session ────────────────────────────────────────────────────────────────

  public async signIn(): Promise<GoogleUserAccount | null> {
    this.initialize(true);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;

    const idToken = response.data.idToken;
    if (!idToken) throw new GoogleDriveAuthError();

    // Google's granular consent screen lets people untick the Drive permission while still
    // signing in. Without it every backup 403s later, so ask again up front instead.
    if (!response.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
      LoggerService.warn('GOOGLE_DRIVE', 'Drive appdata scope not granted at sign-in, requesting again');
      const scoped = await GoogleSignin.addScopes({ scopes: [DRIVE_APPDATA_SCOPE] });
      if (!scoped || !isSuccessResponse(scoped) || !scoped.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
        await GoogleSignin.signOut().catch(() => {});
        throw new GoogleDriveAuthError(i18n.t('backup.errDrivePermission'));
      }
    }

    const { user } = await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
    const account = mapFirebaseUser(user);
    LoggerService.info('GOOGLE_DRIVE', `Signed in: ${account.email}`);
    return account;
  }

  public async getCurrentUser(): Promise<GoogleUserAccount | null> {
    const auth = getAuth();
    if (!auth.currentUser) {
      await withTimeout(auth.authStateReady(), AUTH_RESTORE_TIMEOUT_MS);
    }
    return auth.currentUser ? mapFirebaseUser(auth.currentUser) : null;
  }

  /** Fires with the current account now and on every sign-in / sign-out / session loss. */
  public subscribeToAccount(listener: (account: GoogleUserAccount | null) => void): () => void {
    return onAuthStateChanged(getAuth(), (user) => listener(user ? mapFirebaseUser(user) : null));
  }

  public async signOut(): Promise<void> {
    this.initialize();
    const results = await Promise.allSettled([firebaseSignOut(getAuth()), GoogleSignin.signOut()]);
    results.forEach((r) => {
      if (r.status === 'rejected') LoggerService.warn('GOOGLE_DRIVE', 'Sign out error', r.reason);
    });
  }

  /** The grant is unusable: end the session everywhere so state stays consistent, then report it. */
  private async endSession(reason: string): Promise<never> {
    LoggerService.warn('GOOGLE_DRIVE', `Drive session lost (${reason}); signing out so the user can reconnect`);
    await this.signOut();
    throw new GoogleDriveAuthError();
  }

  // ── Tokens ─────────────────────────────────────────────────────────────────

  private getAccessToken(): Promise<string> {
    if (!this.activeTokenPromise) {
      this.activeTokenPromise = this.fetchAccessToken().finally(() => {
        this.activeTokenPromise = null;
      });
    }
    return this.activeTokenPromise;
  }

  private async fetchAccessToken(): Promise<string> {
    this.initialize();
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= TOKEN_ATTEMPTS; attempt++) {
      try {
        // getTokens() needs google-signin's in-memory user, which a fresh process (headless
        // included) doesn't have until signInSilently() restores it from the saved credential.
        if (!GoogleSignin.getCurrentUser()) {
          const silent = await GoogleSignin.signInSilently();
          if (silent.type === 'noSavedCredentialFound') {
            return this.endSession('no saved Google credential');
          }
        }
        const { accessToken } = await GoogleSignin.getTokens();
        if (accessToken) return accessToken;
        lastError = new Error('Empty access token');
      } catch (e) {
        if (e instanceof GoogleDriveAuthError) throw e;
        if (isTokenGrantError(e)) return this.endSession('token grant rejected');
        lastError = e;
        LoggerService.info('GOOGLE_DRIVE', `Token attempt ${attempt}/${TOKEN_ATTEMPTS} failed`, e);
      }
      if (attempt < TOKEN_ATTEMPTS) await sleep(TOKEN_RETRY_BASE_MS * attempt);
    }

    // Still connected — most likely offline. Transient, so callers retry later without signing out.
    throw new GoogleDriveNetworkError('getAccessToken', lastError);
  }

  /**
   * Runs `fn` with an access token. Android's getTokens() can return a cached token that has
   * already expired, so a 401 evicts it and retries once; a second 401, or a 403 for a missing
   * Drive scope, means the grant itself is gone.
   */
  private async withAccessToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
    const token = await this.getAccessToken();
    try {
      return await fn(token);
    } catch (e) {
      if (isScopeDeniedError(e)) return this.endSession('Drive scope denied');
      if (!(e instanceof GoogleDriveHttpError) || e.status !== 401) throw e;

      LoggerService.info('GOOGLE_DRIVE', 'Access token rejected (401), refreshing and retrying once');
      await GoogleSignin.clearCachedAccessToken(token).catch(() => {});
      try {
        return await fn(await this.getAccessToken());
      } catch (retryError) {
        if (retryError instanceof GoogleDriveHttpError && retryError.status === 401) {
          return this.endSession('token rejected after refresh');
        }
        if (isScopeDeniedError(retryError)) return this.endSession('Drive scope denied');
        throw retryError;
      }
    }
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  /** Null when signed out or no backup exists; network/HTTP errors are rethrown, never swallowed. */
  public findLatestBackup(): Promise<CloudBackupFileMeta | null> {
    if (!this.activeFindBackupPromise) {
      this.activeFindBackupPromise = this.queryLatestBackup().finally(() => {
        this.activeFindBackupPromise = null;
      });
    }
    return this.activeFindBackupPromise;
  }

  private async queryLatestBackup(): Promise<CloudBackupFileMeta | null> {
    if (!(await this.getCurrentUser())) return null;

    return this.withAccessToken(async (token) => {
      const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and 'appDataFolder' in parents and trashed = false`);
      const url = `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(${FILE_FIELDS})&orderBy=modifiedTime%20desc`;
      const response = await driveFetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'findLatestBackup',
      });
      const latest = ((await response.json()) as DriveFileList).files?.[0];
      return latest?.id ? toFileMeta(latest, { id: latest.id }) : null;
    });
  }

  private async createBackupFileEntry(token: string): Promise<string> {
    const response = await driveFetch(`${DRIVE_FILES_URL}?fields=id`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: BACKUP_FILENAME, parents: ['appDataFolder'], mimeType: 'application/json' }),
      operation: 'createBackupFileEntry',
    });
    const { id } = (await response.json()) as DriveFileResource;
    if (!id) throw new Error('Failed to resolve Google Drive file ID for backup.');
    return id;
  }

  private async resolveBackupFileId(token: string): Promise<string> {
    return (await this.findLatestBackup())?.id ?? (await this.createBackupFileEntry(token));
  }

  private uploadContent(token: string, fileId: string, content: string, onProgress?: DriveProgressCallback): Promise<string> {
    return driveXhrRequest(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media&fields=${FILE_FIELDS}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: content,
      operation: 'uploadBackupContent',
      timeoutMs: transferTimeoutMs(approxByteLength(content)),
      onProgress,
    });
  }

  /**
   * Overwrites the single backup file. `knownFileId` (cached) skips a lookup; if that file has
   * since been deleted (user wiped app data from Drive settings) the 404 re-resolves it instead
   * of failing every backup until the cache happens to refresh.
   */
  public uploadBackup(content: string, knownFileId?: string, onProgress?: DriveProgressCallback): Promise<CloudBackupFileMeta> {
    return this.withAccessToken(async (token) => {
      let fileId = knownFileId ?? (await this.resolveBackupFileId(token));
      let responseText: string;
      try {
        responseText = await this.uploadContent(token, fileId, content, onProgress);
      } catch (e) {
        if (!(e instanceof GoogleDriveHttpError) || e.status !== 404 || !knownFileId) throw e;
        LoggerService.info('GOOGLE_DRIVE', 'Cached backup file id no longer exists, re-resolving');
        fileId = await this.resolveBackupFileId(token);
        responseText = await this.uploadContent(token, fileId, content, onProgress);
      }

      let parsed: DriveFileResource = {};
      try {
        parsed = JSON.parse(responseText) as DriveFileResource;
      } catch {
        // Upload succeeded (2xx); response metadata is best-effort.
      }
      return toFileMeta(parsed, { id: fileId, size: content.length });
    });
  }

  /** `expectedBytes` (from the file listing) scales the timeout for large backups. */
  public downloadBackup(fileId: string, onProgress?: DriveProgressCallback, expectedBytes = 0): Promise<string> {
    return this.withAccessToken((token) =>
      driveXhrRequest(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'downloadBackup',
        timeoutMs: transferTimeoutMs(expectedBytes),
        onProgress,
      }),
    );
  }

  /** Permanently deletes the backup file. Returns false when there was none. */
  public async deleteBackup(): Promise<boolean> {
    if (!(await this.getCurrentUser())) throw new GoogleDriveAuthError();
    const file = await this.findLatestBackup();
    if (!file) return false;

    await this.withAccessToken((token) =>
      driveFetch(`${DRIVE_FILES_URL}/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'deleteBackup',
      }),
    );
    return true;
  }
}

export const GoogleDriveService = new GoogleDriveServiceClass();
