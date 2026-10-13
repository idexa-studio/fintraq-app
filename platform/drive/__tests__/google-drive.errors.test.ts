import {
  GoogleDriveAuthError,
  GoogleDriveHttpError,
  GoogleDriveNetworkError,
  GoogleDriveTimeoutError,
  isAuthError,
  isNoBackupError,
  isScopeDeniedError,
  isTokenGrantError,
  isTransientDriveError,
  NoBackupFoundError,
} from '@/platform/drive/google-drive.errors';

const driveBody = (reason: string) => JSON.stringify({ error: { code: 403, errors: [{ reason }] } });

describe('isTransientDriveError', () => {
  it.each([
    ['timeout', new GoogleDriveTimeoutError('op', 1000)],
    ['network', new GoogleDriveNetworkError('op', new Error('offline'))],
    ['429', new GoogleDriveHttpError(429, 'op', '')],
    ['500', new GoogleDriveHttpError(500, 'op', '')],
    ['503', new GoogleDriveHttpError(503, 'op', '')],
    ['403 userRateLimitExceeded', new GoogleDriveHttpError(403, 'op', driveBody('userRateLimitExceeded'))],
    ['403 rateLimitExceeded', new GoogleDriveHttpError(403, 'op', driveBody('rateLimitExceeded'))],
  ])('treats %s as transient', (_, error) => {
    expect(isTransientDriveError(error)).toBe(true);
  });

  it.each([
    ['401', new GoogleDriveHttpError(401, 'op', '')],
    ['404', new GoogleDriveHttpError(404, 'op', '')],
    ['403 insufficientPermissions', new GoogleDriveHttpError(403, 'op', driveBody('insufficientPermissions'))],
    ['403 without body', new GoogleDriveHttpError(403, 'op', 'not json')],
    ['auth error', new GoogleDriveAuthError()],
    ['plain error', new Error('boom')],
    ['non-error', 'boom'],
  ])('does not treat %s as transient', (_, error) => {
    expect(isTransientDriveError(error)).toBe(false);
  });
});

describe('GoogleDriveHttpError.reason', () => {
  it('reads the legacy errors[] reason and the newer details/status shapes', () => {
    expect(new GoogleDriveHttpError(403, 'op', driveBody('insufficientPermissions')).reason).toBe('insufficientPermissions');
    expect(new GoogleDriveHttpError(403, 'op', JSON.stringify({ error: { details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] } })).reason).toBe(
      'ACCESS_TOKEN_SCOPE_INSUFFICIENT',
    );
    expect(new GoogleDriveHttpError(403, 'op', JSON.stringify({ error: { status: 'PERMISSION_DENIED' } })).reason).toBe('PERMISSION_DENIED');
    expect(new GoogleDriveHttpError(500, 'op', '<html>').reason).toBeUndefined();
  });
});

describe('isScopeDeniedError', () => {
  it('matches only 403s caused by a missing Drive scope', () => {
    expect(isScopeDeniedError(new GoogleDriveHttpError(403, 'op', driveBody('insufficientPermissions')))).toBe(true);
    expect(isScopeDeniedError(new GoogleDriveHttpError(403, 'op', driveBody('userRateLimitExceeded')))).toBe(false);
    expect(isScopeDeniedError(new GoogleDriveHttpError(401, 'op', driveBody('insufficientPermissions')))).toBe(false);
  });
});

describe('isTokenGrantError', () => {
  it.each([
    'Cannot attempt recovery auth because app is not in foreground. NeedPermission',
    'com.google.android.gms.auth.UserRecoverableAuthException: NeedPermission',
    'BadAuthentication',
    'invalid_grant',
  ])('recognises grant failure: %s', (message) => {
    expect(isTokenGrantError(new Error(message))).toBe(true);
  });

  it.each(['java.io.IOException: NetworkError', 'timeout', 'Unable to resolve host "oauth2.googleapis.com"'])(
    'does not mistake connectivity for a grant failure: %s',
    (message) => {
      expect(isTokenGrantError(new Error(message))).toBe(false);
    },
  );
});

describe('type guards', () => {
  it('identifies auth and no-backup errors, including serialised no-backup codes', () => {
    expect(isAuthError(new GoogleDriveAuthError())).toBe(true);
    expect(isAuthError(new Error('GoogleDriveAuthError'))).toBe(false);
    expect(isNoBackupError(new NoBackupFoundError())).toBe(true);
    expect(isNoBackupError({ code: 'NO_BACKUP_FOUND' })).toBe(true);
    expect(isNoBackupError(new Error('x'))).toBe(false);
  });
});
