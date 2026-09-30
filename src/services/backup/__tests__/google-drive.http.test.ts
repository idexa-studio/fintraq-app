import { GoogleDriveHttpError, GoogleDriveNetworkError } from '@/src/services/backup/google-drive.errors';
import { driveFetch, transferTimeoutMs } from '@/src/services/backup/google-drive.http';

describe('transferTimeoutMs', () => {
  it('has a one-minute floor, scales with size and caps at ten minutes', () => {
    expect(transferTimeoutMs(0)).toBe(60_000);
    expect(transferTimeoutMs(-5)).toBe(60_000);
    expect(transferTimeoutMs(2_000_000)).toBe(160_000);
    expect(transferTimeoutMs(500_000_000)).toBe(600_000);
  });
});

describe('driveFetch', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  const response = (status: number, body = '') =>
    ({ ok: status >= 200 && status < 300, status, text: async () => body }) as unknown as Response;

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  const run = async (promise: Promise<Response>) => {
    const settled = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    );
    await jest.runAllTimersAsync();
    return settled;
  };

  it('retries a 503 once and returns the successful response', async () => {
    fetchMock.mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
    const result = await run(driveFetch('https://x', { method: 'GET', headers: {}, operation: 'op' }));
    expect(result).toEqual({ value: expect.objectContaining({ status: 200 }) });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a rate-limit 403', async () => {
    const body = JSON.stringify({ error: { errors: [{ reason: 'userRateLimitExceeded' }] } });
    fetchMock.mockResolvedValueOnce(response(403, body)).mockResolvedValueOnce(response(200));
    await run(driveFetch('https://x', { method: 'GET', headers: {}, operation: 'op' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 401', async () => {
    fetchMock.mockResolvedValue(response(401, 'unauthorised'));
    const result = await run(driveFetch('https://x', { method: 'GET', headers: {}, operation: 'op' }));
    expect(result).toEqual({ error: expect.any(GoogleDriveHttpError) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces a network failure after the retry budget', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const result = await run(driveFetch('https://x', { method: 'GET', headers: {}, operation: 'op', retries: 2 }));
    expect(result).toEqual({ error: expect.any(GoogleDriveNetworkError) });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
