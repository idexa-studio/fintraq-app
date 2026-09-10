import { getAuth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, User as FirebaseUser } from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import googleServicesConfig from '../../../google-services.json';
import { GoogleDriveAuthError, GoogleDriveHttpError } from './google-drive.errors';
import { DriveProgressCallback, driveFetch, driveXhrRequest } from './google-drive.http';
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

const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = 'fintraq_backup.json';

function getWebClientId(): string | undefined {
  try {
    const oauthClients = (googleServicesConfig as any)?.client?.[0]?.oauth_client || [];
    const webClient = oauthClients.find((c: any) => c.client_type === 3);
    return webClient?.client_id;
  } catch {
    return undefined;
  }
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

    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (!idToken) {
        throw new GoogleDriveAuthError();
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(getAuth(), credential);
      const account = mapFirebaseUser(user);
      LoggerService.info('GOOGLE_DRIVE', `Signed in to Firebase Auth: ${account.email}`);
      return account;
    }
    return null;
  }

  /** Firebase Auth persists the session natively (Keychain/SharedPreferences) and resolves
   * without needing UI, which is what headless background execution actually requires. */
  public async getCurrentUser(): Promise<GoogleUserAccount | null> {
    const currentUser = getAuth().currentUser;
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
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens.accessToken) return tokens.accessToken;
      } catch (e) {
        LoggerService.info('GOOGLE_DRIVE', 'getTokens initial attempt note', e);
      }

      try {
        const silent = await GoogleSignin.signInSilently();
        if (silent.type === 'success') {
          const tokens = await GoogleSignin.getTokens();
          if (tokens.accessToken) return tokens.accessToken;
        }
      } catch (e) {
        LoggerService.info('GOOGLE_DRIVE', 'signInSilently fallback attempt note', e);
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

  private async withAuthErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e: any) {
      if (e instanceof GoogleDriveHttpError && e.status === 401) {
        throw new GoogleDriveAuthError();
      }
      throw e;
    }
  }

  /** Returns null only if no signed-in user or no backup exists; network/HTTP errors are rethrown, not swallowed. */
  public async findLatestBackup(): Promise<CloudBackupFileMeta | null> {
    if (this.activeFindBackupPromise) {
      LoggerService.info('GOOGLE_DRIVE', 'Single-flight: sharing active findLatestBackup request across callers');
      return this.activeFindBackupPromise;
    }

    this.activeFindBackupPromise = this.withAuthErrorHandling(async () => {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const token = await this.getAccessToken();
      const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and 'appDataFolder' in parents and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime%20desc`;

      const response = await driveFetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'findLatestBackup',
      });

      const data = await response.json();
      const files: any[] = data.files || [];
      if (files.length === 0) return null;

      return {
        id: files[0].id,
        name: files[0].name,
        modifiedTime: files[0].modifiedTime,
        size: Number(files[0].size || 0),
      };
    });

    try {
      return await this.activeFindBackupPromise;
    } finally {
      this.activeFindBackupPromise = null;
    }
  }

  private async createBackupFileEntry(token: string): Promise<string> {
    const response = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
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

    const data = await response.json();
    if (!data.id) {
      throw new Error('Failed to resolve Google Drive file ID for backup.');
    }
    return data.id;
  }

  /** Pass `knownFileId` to skip the extra `findLatestBackup` lookup. */
  public async uploadBackup(
    contentJsonString: string,
    knownFileId?: string,
    onProgress?: DriveProgressCallback,
  ): Promise<CloudBackupFileMeta> {
    return this.withAuthErrorHandling(async () => {
      const token = await this.getAccessToken();
      const fileId = knownFileId ?? (await this.findLatestBackup())?.id ?? (await this.createBackupFileEntry(token));

      const uploadEndpoint = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,modifiedTime,size`;

      const responseText = await driveXhrRequest(uploadEndpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: contentJsonString,
        operation: 'uploadBackupContent',
        timeoutMs: 30_000,
        onProgress,
      });

      const data = JSON.parse(responseText);
      return {
        id: data.id || fileId,
        name: data.name || BACKUP_FILENAME,
        modifiedTime: data.modifiedTime || new Date().toISOString(),
        size: Number(data.size || contentJsonString.length),
      };
    });
  }

  /**
   * Download content string of fileId from Google Drive
   */
  public async downloadBackup(fileId: string, onProgress?: DriveProgressCallback): Promise<string> {
    return this.withAuthErrorHandling(async () => {
      const token = await this.getAccessToken();
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

      return driveXhrRequest(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'downloadBackup',
        timeoutMs: 20_000,
        onProgress,
      });
    });
  }

  /**
   * Permanently delete existing backup file from Google Drive AppData folder
   */
  public async deleteBackup(): Promise<boolean> {
    return this.withAuthErrorHandling(async () => {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Please sign in to Google Drive first.');
      }

      const file = await this.findLatestBackup();
      if (!file?.id) {
        return false;
      }

      const token = await this.getAccessToken();
      const url = `https://www.googleapis.com/drive/v3/files/${file.id}`;

      await driveFetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        operation: 'deleteBackup',
      });

      return true;
    });
  }
}

export const GoogleDriveService = new GoogleDriveServiceClass();
