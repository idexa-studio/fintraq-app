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
