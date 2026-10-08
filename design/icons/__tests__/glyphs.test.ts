import { GLYPHS } from '@/design/icons/glyphs';
import { isIconName } from '@/design/icons/index';
import { LEGACY_ICON_MAP } from '@/shared/contracts/legacy-icon-names';
import { STORED_ICON_NAMES } from '@/shared/contracts/stored-icon-names';

describe('icon glyphs', () => {
  // Category and account icons are saved in user data by name. Every name ever
  // offered must keep drawing something after the redesign.
  it('can draw every icon name stored in user data', () => {
    const missing = STORED_ICON_NAMES.filter((name) => !isIconName(name));
    expect(missing).toEqual([]);
  });

  // Names written by older versions resolve through the legacy map; what they resolve to must draw too.
  it('can draw every icon an older version\'s name maps to', () => {
    const missing = Object.entries(LEGACY_ICON_MAP).filter(([, name]) => !isIconName(name)).map(([old, name]) => `${old} -> ${name}`);
    expect(missing).toEqual([]);
  });

  it('gives every icon both an outline and a solid drawing', () => {
    for (const [name, glyph] of Object.entries(GLYPHS)) {
      expect(`${name}:${glyph.line.length > 0 && glyph.fill.length > 0}`).toBe(`${name}:true`);
    }
  });
});
