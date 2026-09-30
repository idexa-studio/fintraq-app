import { getAuth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, User as FirebaseUser } from '@react-native-firebase/auth';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import googleServicesConfig from '@/google-services.json';
import { GoogleDriveAuthError, GoogleDriveHttpError } from './google-drive.errors';
import { DriveProgressCallback, driveFetch, driveXhrRequest, transferTimeoutMs } from './google-drive.http';
import { LoggerService } from '@/src/services/logger.service';

function mapFirebaseUser(user: FirebaseUser): GoogleUserAccount {
  return {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName,
    photo: user.photoURL,
  };
}

export type GoogleUserAccount = {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
};

export type CloudBackupFileMeta = {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
};

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
// OAuth client type 3 = web client, required to mint the idToken Firebase needs.
const WEB_CLIENT_TYPE = 3;

function getWebClientId(): string | undefined {
  const config = googleServicesConfig as GoogleServicesConfig;
  const oauthClients = config.client?.[0]?.oauth_client ?? [];
  return oauthClients.find((c) => c.client_type === WEB_CLIENT_TYPE)?.client_id;
}

function toFileMeta(file: DriveFileResource, fallback: { id: string; size?: number }): CloudBackupFileMeta {
  return {
    id: file.id || fallback.id,
    name: file.name || BACKUP_FILENAME,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    size: Number(file.size ?? fallback.size ?? 0),
  };
}

function utf8ByteLength(value: string): number {
  // Close-enough upper bound without allocating an encoded copy of a potentially large payload.
  return value.length * 2;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

class GoogleDriveServiceClass {
  private isInitialized = false;
  private activeTokenPromise: Promise<string> | null = null;
  private activeFindBackupPromise: Promise<CloudBackupFileMeta | null> | null = null;

  public initialize(force = false) {
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

  public async signIn(): Promise<GoogleUserAccount | null> {
    this.initialize(true);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) return null;

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new GoogleDriveAuthError();
    }

    // Google's granular consent screen lets people untick the Drive permission while still
    // signing in. Without it every backup 403s later, so ask again up front instead.
    if (!response.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
      LoggerService.warn('GOOGLE_DRIVE', 'Drive appdata scope not granted at sign-in, requesting again');
      const scoped = await GoogleSignin.addScopes({ scopes: [DRIVE_APPDATA_SCOPE] });
      if (!scoped || !isSuccessResponse(scoped) || !scoped.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
        await GoogleSignin.signOut().catch(() => {});
        throw new GoogleDriveAuthError('Google Drive permission is required for cloud backup.');
      }
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const { user } = await signInWithCredential(getAuth(), credential);
    const account = mapFirebaseUser(user);
    LoggerService.info('GOOGLE_DRIVE', `Signed in to Firebase Auth: ${account.email}`);
    return account;
  }

  /** Firebase Auth persists the session natively (Keychain/SharedPreferences) and resolves
   * without needing UI, which is what headless background execution actually requires. */
  public async getCurrentUser(): Promise<GoogleUserAccount | null> {
    const auth = getAuth();
    if (!auth.currentUser) {
      await withTimeout(auth.authStateReady(), AUTH_RESTORE_TIMEOUT_MS);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      return mapFirebaseUser(currentUser);
    }

    LoggerService.info('GOOGLE_DRIVE', 'No signed-in Firebase user resolved');
    return null;
  }

  public async signOut(): Promise<void> {
    this.initialize();
    try {
      await Promise.all([firebaseSignOut(getAuth()), GoogleSignin.signOut()]);
    } catch (e) {
      LoggerService.warn('GOOGLE_DRIVE', 'Sign out error', e);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.activeTokenPromise) {
      LoggerService.info('GOOGLE_DRIVE', 'Single-flight: sharing active getAccessToken request across callers');
      return this.activeTokenPromise;
    }

    this.activeTokenPromise = (async () => {
      this.initialize();

      // After long device sleep (headless background task woken from hours of Doze), the
      // first signInSilently() attempt can hit a transient network/timeout blip before the
      // radio is fully back up. Retry a couple times, but never retry SIGN_IN_REQUIRED —
      // that means there's genuinely no session, and retrying can't fix that.
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) return tokens.accessToken;
        } catch (e) {
          LoggerService.info('GOOGLE_DRIVE', `getTokens attempt ${attempt} note`, e);
        }

        try {
          const silent = await GoogleSignin.signInSilently();
          if (silent.type === 'success') {
            const tokens = await GoogleSignin.getTokens();
            if (tokens.accessToken) return tokens.accessToken;
          }
        } catch (e) {
          LoggerService.info('GOOGLE_DRIVE', `signInSilently attempt ${attempt} note`, e);
          if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_REQUIRED) break;
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      LoggerService.warn('GOOGLE_DRIVE', 'Could not retrieve active OAuth access token for Google Drive API');
      throw new GoogleDriveAuthError();
    })();

    try {
      return await this.activeTokenPromise;
    } finally {
      this.activeTokenPromise = null;
    }
  }

  /**
   * Runs `fn` with a fresh access token. Android's getTokens() can hand back a cached token
   * that has already expired; on a 401 we evict it and retry once before declaring the
   * session dead.
   */
  private async withAccessToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
    const token = await this.getAccessToken();
    try {
      return await fn(token);
    } catch (e) {
      if (!(e instanceof GoogleDriveHttpError) || e.status !== 401) throw e;

      LoggerService.info('GOOGLE_DRIVE', 'Access token rejected (401), refreshing and retrying once');
      await GoogleSignin.clearCachedAccessToken(token).catch(() => {});
      const freshToken = await this.getAccessToken();
      try {
        return await fn(freshToken);
      } catch (retryError) {
        if (retryError instanceof GoogleDriveHttpError && retryError.status === 401) {
          throw new GoogleDriveAuthError();
        }
        throw retryError;
      }
    }
  }

  /** Returns null only if no signed-in user or no backup exists; network/HTTP errors are rethrown, not swallowed. */
  public async findLatestBackup(): Promise<CloudBackupFileMeta | null> {
    if (this.activeFindBackupPromise) {
      LoggerService.info('GOOGLE_DRIVE', 'Single-flight: sharing active findLatestBackup request across callers');
      return this.activeFindBackupPromise;
    }

    this.activeFindBackupPromise = (async () => {
      const user = await this.getCurrentUser();
      if (!user) return null;

      return this.withAccessToken(async (token) => {
        const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and 'appDataFolder' in parents and trashed = false`);
        const url = `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(${FILE_FIELDS})&orderBy=modifiedTime%20desc`;

        const response = await driveFetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          operation: 'findLatestBackup',
        });

        const data = (await response.json()) as DriveFileList;
        const latest = data.files?.[0];
        if (!latest?.id) return null;
        return toFileMeta(latest, { id: latest.id });
      });
    })();

    try {
      return await this.activeFindBackupPromise;
    } finally {
      this.activeFindBackupPromise = null;
    }
  }

  private async createBackupFileEntry(token: string): Promise<string> {
    const response = await driveFetch(`${DRIVE_FILES_URL}?fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: BACKUP_FILENAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      }),
      operation: 'createBackupFileEntry',
    });

    const data = (await response.json()) as DriveFileResource;
    if (!data.id) {
      throw new Error('Failed to resolve Google Drive file ID for backup.');
    }
    return data.id;
  }

  private uploadContent(
    token: string,
    fileId: string,
    content: string,
    onProgress?: DriveProgressCallback,
  ): Promise<string> {
    return driveXhrRequest(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media&fields=${FILE_FIELDS}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: content,
      operation: 'uploadBackupContent',
      timeoutMs: transferTimeoutMs(utf8ByteLength(content)),
      onProgress,
    });
  }

  /** Pass `knownFileId` to skip the extra `findLatestBackup` lookup. */
  public async uploadBackup(
    contentJsonString: string,
    knownFileId?: string,
    onProgress?: DriveProgressCallback,
  ): Promise<CloudBackupFileMeta> {
    return this.withAccessToken(async (token) => {
      let fileId = knownFileId ?? (await this.findLatestBackup())?.id ?? (await this.createBackupFileEntry(token));

      let responseText: string;
      try {
        responseText = await this.uploadContent(token, fileId, contentJsonString, onProgress);
      } catch (e) {
        // A cached file id goes stale when the user wipes app data from Drive settings;
        // without this every future backup would 404 until the cache happened to refresh.
        if (!(e instanceof GoogleDriveHttpError) || e.status !== 404 || !knownFileId) throw e;
        LoggerService.info('GOOGLE_DRIVE', 'Cached backup file id no longer exists, re-resolving');
        fileId = (await this.findLatestBackup())?.id ?? (await this.createBackupFileEntry(token));
        responseText = await this.uploadContent(token, fileId, contentJsonString, onProgress);
      }

      let parsed: DriveFileResource = {};
      try {
        parsed = JSON.parse(responseText) as DriveFileResource;
      } catch {
        // Upload succeeded (2xx); metadata is best-effort.
      }
      return toFileMeta(parsed, { id: fileId, size: contentJsonString.length });
    });
  }

  /**
   * Download content string of fileId from Google Drive.
   * `expectedBytes` (from the file listing) scales the timeout for large backups.
   */
  public async downloadBackup(fileId: string, onProgress?: DriveProgressCallback, expectedBytes = 0): Promise<string> {
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

  /**
   * Permanently delete existing backup file from Google Drive AppData folder
   */
  public async deleteBackup(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Please sign in to Google Drive first.');
    }

    const file = await this.findLatestBackup();
    if (!file?.id) {
      return false;
    }

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
