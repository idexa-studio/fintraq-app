import { getErrorCode, toErrorMessage } from '@/src/utils/errors';

/**
 * Error model for the Drive layer. The one distinction that drives behaviour:
 *  - GoogleDriveAuthError — the session is gone (no saved credential, token rejected after a
 *    refresh, Drive permission missing). Only reconnecting fixes it.
 *  - everything transient (timeout, network, 429/5xx, rate-limit 403) — retry later; the user is
 *    still connected. Misclassifying these as auth errors would sign people out on a bad network.
 */

export class GoogleDriveTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Google Drive request timed out after ${timeoutMs}ms during "${operation}". Check network connectivity to googleapis.com.`);
    this.name = 'GoogleDriveTimeoutError';
  }
}

type DriveErrorBody = { error?: { errors?: { reason?: unknown }[]; status?: unknown; details?: { reason?: unknown }[] } };

export class GoogleDriveHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly operation: string,
    public readonly body: string,
  ) {
    super(`Google Drive request failed (${status}) during "${operation}": ${body}`);
    this.name = 'GoogleDriveHttpError';
  }

  /** Drive's machine-readable reason (e.g. `userRateLimitExceeded`), when the body carries one. */
  get reason(): string | undefined {
    try {
      const parsed = JSON.parse(this.body) as DriveErrorBody;
      const reason = parsed.error?.errors?.[0]?.reason ?? parsed.error?.details?.[0]?.reason ?? parsed.error?.status;
      return typeof reason === 'string' ? reason : undefined;
    } catch {
      return undefined;
    }
  }
}

export class GoogleDriveNetworkError extends Error {
  constructor(operation: string, cause: unknown) {
    super(`Google Drive network error during "${operation}": ${toErrorMessage(cause, String(cause))}`);
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

export class BackupInProgressError extends Error {
  public readonly code = 'BACKUP_IN_PROGRESS';
  constructor(message = 'A backup or restore is already in progress.') {
    super(message);
    this.name = 'BackupInProgressError';
  }
}

const RATE_LIMIT_REASONS = new Set(['rateLimitExceeded', 'userRateLimitExceeded', 'RESOURCE_EXHAUSTED']);
const SCOPE_REASONS = new Set(['insufficientPermissions', 'ACCESS_TOKEN_SCOPE_INSUFFICIENT', 'PERMISSION_DENIED']);

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** True for failures a later attempt can plausibly fix. Never true for auth or other 4xx. */
export function isTransientDriveError(error: unknown): boolean {
  if (error instanceof GoogleDriveTimeoutError || error instanceof GoogleDriveNetworkError) return true;
  if (!(error instanceof GoogleDriveHttpError)) return false;
  if (isRetryableStatus(error.status)) return true;
  // Drive signals per-user quota with 403 rather than 429.
  return error.status === 403 && RATE_LIMIT_REASONS.has(error.reason ?? '');
}

/** A 403 because the token lacks the Drive scope (user unticked it, or revoked it later). */
export function isScopeDeniedError(error: unknown): boolean {
  return error instanceof GoogleDriveHttpError && error.status === 403 && SCOPE_REASONS.has(error.reason ?? '');
}

/**
 * Whether a token-retrieval failure from google-signin means the grant itself is unusable
 * (revoked, consent required) rather than a connectivity problem. Android surfaces
 * GoogleAuthException/UserRecoverableAuthException only through the message, and in a headless
 * run a recoverable error arrives as "Cannot attempt recovery auth because app is not in foreground".
 */
export function isTokenGrantError(error: unknown): boolean {
  const message = toErrorMessage(error, '');
  return /recover(y|able)? auth|UserRecoverableAuth|NeedPermission|BadAuthentication|invalid_grant|ServiceDisabled|GoogleAuthException/i.test(message);
}

export function isAuthError(error: unknown): error is GoogleDriveAuthError {
  return error instanceof GoogleDriveAuthError;
}

/** Single source of truth for "does this error mean no backup exists". */
export function isNoBackupError(error: unknown): boolean {
  return error instanceof NoBackupFoundError || getErrorCode(error) === 'NO_BACKUP_FOUND';
}

/** Single source of truth for "does this error mean the caller isn't Pro". */
export function isProRequiredError(error: unknown): boolean {
  return error instanceof CloudBackupProRequiredError || getErrorCode(error) === 'CLOUD_BACKUP_PRO_REQUIRED';
}

export function isBackupInProgressError(error: unknown): boolean {
  return error instanceof BackupInProgressError;
}
