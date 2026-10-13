import { AuthenticationType } from 'expo-local-authentication';
import { biometryOf } from '@/platform/lock/useLocalAuth';

jest.mock('@/shared/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

describe('biometryOf', () => {
  it('names the one kind a phone can read', () => {
    expect(biometryOf([AuthenticationType.FINGERPRINT])).toBe('fingerprint');
    expect(biometryOf([AuthenticationType.FACIAL_RECOGNITION])).toBe('face');
  });

  it('never picks one for a phone that reads both', () => {
    expect(biometryOf([AuthenticationType.FINGERPRINT, AuthenticationType.FACIAL_RECOGNITION])).toBe('either');
    expect(biometryOf([AuthenticationType.FINGERPRINT, AuthenticationType.IRIS])).toBe('either');
  });

  it('says none when the phone lists nothing', () => {
    expect(biometryOf([])).toBe('none');
  });
});
