import i18n from '@/src/i18n';

/**
 * Extract a human-readable message from an unknown caught value.
 *
 * Usage:
 *   catch (err) {
 *     Alert.alert('Error', toErrorMessage(err));
 *   }
 */
export function toErrorMessage(
  err: unknown,
  fallback: string = i18n.t('common.unexpectedError'),
): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
