export class GoogleDriveTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Google Drive request timed out after ${timeoutMs}ms during "${operation}". Check network connectivity to googleapis.com.`);
    this.name = 'GoogleDriveTimeoutError';
  }
}

export class GoogleDriveHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly operation: string,
    public readonly body: string,
  ) {
    super(`Google Drive request failed (${status}) during "${operation}": ${body}`);
    this.name = 'GoogleDriveHttpError';
  }
}

export class GoogleDriveNetworkError extends Error {
  constructor(operation: string, cause: unknown) {
    super(`Google Drive network error during "${operation}": ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'GoogleDriveNetworkError';
    this.cause = cause;
  }
}

export class GoogleDriveAuthError extends Error {
  constructor(message = 'Google Drive access token unavailable. Please sign in again.') {
    super(message);
    this.name = 'GoogleDriveAuthError';
  }
}

export class NoBackupFoundError extends Error {
  public readonly code = 'NO_BACKUP_FOUND';
  constructor(message = 'No previous Fintraq backup file was found in your connected cloud account.') {
    super(message);
    this.name = 'NoBackupFoundError';
  }
}

export class CloudBackupProRequiredError extends Error {
  public readonly code = 'CLOUD_BACKUP_PRO_REQUIRED';
  constructor(message = 'Cloud backup and restore are a Fintraq Pro feature.') {
    super(message);
    this.name = 'CloudBackupProRequiredError';
  }
}

/** Single source of truth for "does this error mean no backup exists". */
export function isNoBackupError(error: unknown): boolean {
  return error instanceof NoBackupFoundError || (error as any)?.code === 'NO_BACKUP_FOUND';
}

/** Single source of truth for "does this error mean the caller isn't Pro". */
export function isProRequiredError(error: unknown): boolean {
  return error instanceof CloudBackupProRequiredError || (error as any)?.code === 'CLOUD_BACKUP_PRO_REQUIRED';
}

