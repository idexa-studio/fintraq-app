import i18n from '@/shared/i18n';

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
  fallback: string = i18n.t('unexpectedError', { ns: 'common' }),
): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const { message } = err as { message?: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** Reads a string `code` off an unknown error (native modules and our own typed errors). */
export function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null || !('code' in err)) return undefined;
  const { code } = err as { code?: unknown };
  return typeof code === 'string' ? code : undefined;
}
