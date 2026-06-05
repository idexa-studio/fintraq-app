import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Safely resolve a string (e.g. from the database) to a valid IoniconName.
 * Returns the fallback when the stored value is not a recognised icon key.
 */
export function resolveIcon(
  icon: string | null | undefined,
  fallback: IoniconName,
): IoniconName {
  if (!icon) return fallback;

  let resolved = icon;
  // If the icon is a filled version, check if we can make it an outline version
  if (!resolved.endsWith('-outline') && `${resolved}-outline` in Ionicons.glyphMap) {
    resolved = `${resolved}-outline`;
  }

  if (resolved in Ionicons.glyphMap) return resolved as IoniconName;
  return fallback;
}
