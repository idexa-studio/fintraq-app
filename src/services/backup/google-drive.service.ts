import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import googleServicesConfig from '../../../google-services.json';
import { GoogleDriveAuthError } from './google-drive.errors';
import { DriveProgressCallback, driveFetch, driveXhrRequest } from './google-drive.http';

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
      console.warn('[GoogleDriveService] Failed to configure GoogleSignin:', e);
    }
  }

  public async signIn(): Promise<GoogleUserAccount | null> {
    this.initialize(true);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isSuccessResponse(response)) {
      const user = response.data.user;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.photo,
      };
    }
    return null;
  }

  public async getCurrentUser(): Promise<GoogleUserAccount | null> {
    this.initialize();
    try {
      const response = await GoogleSignin.signInSilently();
      if (response.type === 'success') {
        const user = response.data.user;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          photo: user.photo,
        };
      }
    } catch {
      // User not signed in or silent auth failed
    }
    return null;
  }

  public async signOut(): Promise<void> {
    this.initialize();
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.warn('[GoogleDriveService] Sign out error:', e);
    }
  }

  private async getAccessToken(): Promise<string> {
    this.initialize();
    try {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) return tokens.accessToken;
    } catch {
      // If getTokens fails, perform silent sign in to refresh token
    }

    try {
      const silent = await GoogleSignin.signInSilently();
      if (silent.type === 'success') {
        const tokens = await GoogleSignin.getTokens();
        if (tokens.accessToken) return tokens.accessToken;
      }
    } catch {
      // Silent auth failed
    }

    throw new GoogleDriveAuthError();
  }

  /**
   * Search for existing backup file in Google Drive AppData folder.
   * Returns null both when no backup exists and when the lookup fails —
   * callers that need to distinguish those cases should catch directly.
   */
  public async findLatestBackup(): Promise<CloudBackupFileMeta | null> {
    try {
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
    } catch (error) {
      console.warn('[GoogleDriveService] findLatestBackup error:', error);
      return null;
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

  /**
   * Upload (create or update) backup file payload in Google Drive AppData folder.
   * Pass `knownFileId` (e.g. from a previously fetched CloudBackupFileMeta)
   * to skip the extra `findLatestBackup` lookup and halve the network calls
   * needed for a routine backup.
   */
  public async uploadBackup(
    contentJsonString: string,
    knownFileId?: string,
    onProgress?: DriveProgressCallback,
  ): Promise<CloudBackupFileMeta> {
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
  }

  /**
   * Download content string of fileId from Google Drive
   */
  public async downloadBackup(fileId: string, onProgress?: DriveProgressCallback): Promise<string> {
    const token = await this.getAccessToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    return driveXhrRequest(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      operation: 'downloadBackup',
      timeoutMs: 20_000,
      onProgress,
    });
  }
}

export const GoogleDriveService = new GoogleDriveServiceClass();
