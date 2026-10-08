import * as LocalAuthentication from 'expo-local-authentication';
import i18n from '@/shared/i18n';

export type BiometricCapability = {
  available: boolean;
  /** What the phone can read. `either`: it has both, and the system decides which it asks for. */
  biometryType: 'face' | 'fingerprint' | 'either' | 'none';
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return { available: false, biometryType: 'none' };
  }

  return { available: true, biometryType: biometryOf(await LocalAuthentication.supportedAuthenticationTypesAsync()) };
}

/**
 * What to call the phone's biometrics. The system lists what the phone can read, not which of
 * them its owner set up, and its prompt takes whichever is there: a phone that reads both must
 * never be told it is one of them (it said "Unlock with face" to an owner using a fingerprint).
 */
export function biometryOf(types: readonly LocalAuthentication.AuthenticationType[]): BiometricCapability['biometryType'] {
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  // An iris reader on its own has no name here: the button then just says "Unlock".
  if (types.length > 1) return face || finger ? 'either' : 'none';
  return face ? 'face' : finger ? 'fingerprint' : 'none';
}

/**
 * Whether the device can verify its owner at all: biometrics or the screen-lock PIN, pattern or
 * passcode. `authenticateWithBiometrics` falls back to that credential, so a biometric app lock
 * stays usable after fingerprints or faces are removed.
 */
export async function canAuthenticateOnDevice(): Promise<boolean> {
  return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
}

export async function authenticateWithBiometrics(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: i18n.t('common.cancel'),
    disableDeviceFallback: false, // allows device PIN/passcode as fallback
    fallbackLabel: i18n.t('common.usePasscode'),
  });
  return result.success;
}
