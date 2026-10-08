import { GLYPHS } from '@/design/icons/glyphs';
import type { GlyphName, SolidGlyphName } from '@/design/icons/glyphs';
import { LEGACY_ICON_MAP } from '@/shared/contracts/legacy-icon-names';

/** Every icon the app can draw. */
export type IconName = GlyphName;

/** The icons that also have a solid drawing: a tab icon or a tile's mark must be one of these. */
export type SolidIconName = SolidGlyphName;

export const isIconName = (value: unknown): value is IconName => typeof value === 'string' && value in GLYPHS;

/**
 * A stored icon string, from a category or an account, as an icon that can be
 * drawn. Names written by older versions go through the legacy map; anything
 * unrecognised becomes the fallback.
 */
export function resolveIcon(stored: string | null | undefined, fallback: IconName): IconName {
  if (!stored) return fallback;
  if (isIconName(stored)) return stored;
  const mapped = LEGACY_ICON_MAP[stored];
  return isIconName(mapped) ? mapped : fallback;
}
