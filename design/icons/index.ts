import { CUSTOM_GLYPHS } from '@/design/icons/custom-glyphs';
import type { CustomIconName } from '@/design/icons/custom-glyphs';
import { GLYPHS } from '@/design/icons/glyphs';
import type { GlyphName } from '@/design/icons/glyphs';

/** Every icon the app can draw: the generated Remix glyphs and the few drawn by hand. */
export type IconName = GlyphName | CustomIconName;

export const isIconName = (value: unknown): value is IconName => typeof value === 'string' && (value in GLYPHS || value in CUSTOM_GLYPHS);
