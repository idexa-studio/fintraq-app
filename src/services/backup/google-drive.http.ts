import { GoogleDriveHttpError, GoogleDriveNetworkError, GoogleDriveTimeoutError } from './google-drive.errors';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 500;

export type DriveRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | "DELETE";
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
  operation: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Fetch wrapper with real timeout attribution and bounded retry for transient
 * failures. Distinguishes timeout / network / HTTP errors so failures are
 * diagnosable instead of surfacing as a bare "Aborted".
 */
export async function driveFetch(url: string, options: DriveRequestOptions): Promise<Response> {
  const { method, headers, body, operation, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;

  let lastError: Error = new GoogleDriveNetworkError(operation, 'unknown failure');

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(url, { method, headers, body, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        if (isRetryableStatus(response.status) && attempt < retries) {
          lastError = new GoogleDriveHttpError(response.status, operation, errorText);
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw new GoogleDriveHttpError(response.status, operation, errorText);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GoogleDriveHttpError) {
        throw error;
      }

      const isAbort = error instanceof Error && error.name === 'AbortError';
      const elapsedMs = Date.now() - startedAt;

      if (isAbort) {
        lastError = new GoogleDriveTimeoutError(operation, elapsedMs);
      } else {
        lastError = new GoogleDriveNetworkError(operation, error);
      }

      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError;
}

export type DriveProgressCallback = (fraction: number) => void;

export type DriveXhrRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  operation: string;
  /** Fraction 0..1. Fires on upload progress for POST/PATCH, download progress for GET. */
  onProgress?: DriveProgressCallback;
};

const DEFAULT_XHR_TIMEOUT_MS = 30_000;

/**
 * XMLHttpRequest-based request for calls that need real byte-level progress
 * (upload/download) — the global `fetch` in React Native does not expose
 * upload progress and only exposes streamed download progress unreliably.
 */
export function driveXhrRequest(url: string, options: DriveXhrRequestOptions): Promise<string> {
  const { method, headers, body, operation, timeoutMs = DEFAULT_XHR_TIMEOUT_MS, onProgress } = options;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.timeout = timeoutMs;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
      xhr.onprogress = (event) => {
        if (method === 'GET' && event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve(xhr.responseText);
      } else {
        reject(new GoogleDriveHttpError(xhr.status, operation, xhr.responseText));
      }
    };
    xhr.ontimeout = () => reject(new GoogleDriveTimeoutError(operation, timeoutMs));
    xhr.onerror = () => reject(new GoogleDriveNetworkError(operation, new Error('XHR network error')));
    xhr.onabort = () => reject(new GoogleDriveNetworkError(operation, new Error('Request aborted')));

    xhr.send(body);
  });
}
