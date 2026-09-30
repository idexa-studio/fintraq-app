import { GoogleDriveHttpError, GoogleDriveNetworkError, GoogleDriveTimeoutError, isTransientDriveError } from './google-drive.errors';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 500;

// Floor covers TLS + token round-trips; the per-byte budget assumes a poor ~20 KB/s mobile link
// so large histories on slow networks don't hit a fixed ceiling mid-transfer.
const MIN_TRANSFER_TIMEOUT_MS = 60_000;
const MAX_TRANSFER_TIMEOUT_MS = 10 * 60_000;
const SLOW_LINK_BYTES_PER_MS = 20;

/** Timeout for an upload/download of `bytes`, scaled to payload size. */
export function transferTimeoutMs(bytes: number): number {
  const scaled = MIN_TRANSFER_TIMEOUT_MS + Math.ceil(Math.max(0, bytes) / SLOW_LINK_BYTES_PER_MS);
  return Math.min(MAX_TRANSFER_TIMEOUT_MS, scaled);
}

export type DriveRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number;
  operation: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch wrapper for small JSON calls: timeout attribution + bounded retry of transient failures. */
export async function driveFetch(url: string, options: DriveRequestOptions): Promise<Response> {
  const { method, headers, body, operation, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    let error: Error;
    try {
      const response = await fetch(url, { method, headers, body, signal: controller.signal });
      if (response.ok) return response;
      error = new GoogleDriveHttpError(response.status, operation, await response.text());
    } catch (e) {
      const isAbort = e instanceof Error && e.name === 'AbortError';
      error = isAbort ? new GoogleDriveTimeoutError(operation, Date.now() - startedAt) : new GoogleDriveNetworkError(operation, e);
    } finally {
      clearTimeout(timeoutId);
    }

    if (attempt >= retries || !isTransientDriveError(error)) throw error;
    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
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

/**
 * XHR-based request for real byte-level progress — RN's `fetch` doesn't expose upload progress.
 * No built-in retry: callers retry whole transfers (see cloud-backup.service).
 */
export function driveXhrRequest(url: string, options: DriveXhrRequestOptions): Promise<string> {
  const { method, headers, body, operation, timeoutMs = MIN_TRANSFER_TIMEOUT_MS, onProgress } = options;

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
