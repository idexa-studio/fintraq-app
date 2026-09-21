import * as LocalAuthentication from 'expo-local-authentication';
import i18n from '@/src/i18n';

export type BiometricCapability = {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'none';
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return { available: false, biometryType: 'none' };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

  return {
    available: true,
    biometryType: hasFace ? 'face' : 'fingerprint',
  };
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
