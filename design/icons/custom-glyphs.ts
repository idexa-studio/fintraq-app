/**
 * Icons the Remix set does not have, drawn here to sit beside it: the same
 * 24 by 24 grid, 2 unit lines, square joins. Each is a list of strokes; the
 * solid style fills the closed ones.
 *
 * All six are names saved in user data (category icons), so they must exist.
 */
export type CustomGlyph = {
  /** Open or closed line work. */
  strokes: string[];
  /** Closed shapes that fill in the solid style. Drawn as lines otherwise. */
  shapes: string[];
};

export const CUSTOM_GLYPHS = {
  pizza: {
    shapes: ['M3.5 6 C9 3.6 15 3.6 20.5 6 L12 21.5 Z'],
    strokes: ['M5.3 9.4 C9.6 7.8 14.4 7.8 18.7 9.4', 'M9.7 12.2 v0.1', 'M13.6 13.4 v0.1', 'M11.6 16.4 v0.1'],
  },
  hamburger: {
    shapes: ['M4 10.5 C4 6.6 7.6 4.5 12 4.5 C16.4 4.5 20 6.6 20 10.5 Z', 'M5 17.5 H19 V18 C19 19.1 18.1 20 17 20 H7 C5.9 20 5 19.1 5 18 Z'],
    strokes: ['M3 14 H21'],
  },
  egg: {
    shapes: ['M12 3 C8.4 3 5.5 8.6 5.5 13.5 C5.5 17.6 8.4 21 12 21 C15.6 21 18.5 17.6 18.5 13.5 C18.5 8.6 15.6 3 12 3 Z'],
    strokes: [],
  },
  'ice-cream': {
    shapes: ['M6.5 10.5 C6.5 6.6 9 4 12 4 C15 4 17.5 6.6 17.5 10.5 Z'],
    strokes: ['M7.5 10.5 L12 21 L16.5 10.5'],
  },
  cat: {
    shapes: ['M5 9.2 V4 L9.2 6.6 C11 6.1 13 6.1 14.8 6.6 L19 4 V9.2 C19.6 10.3 20 11.6 20 13 C20 17.2 16.4 20 12 20 C7.6 20 4 17.2 4 13 C4 11.6 4.4 10.3 5 9.2 Z'],
    strokes: ['M9 12.4 v1.4', 'M15 12.4 v1.4', 'M10.8 16 L12 17 L13.2 16'],
  },
  dumbbell: {
    shapes: [],
    strokes: ['M7 12 H17', 'M7 6.5 V17.5', 'M3.5 9 V15', 'M17 6.5 V17.5', 'M20.5 9 V15'],
  },
} as const satisfies Record<string, CustomGlyph>;

export type CustomIconName = keyof typeof CUSTOM_GLYPHS;

export const isCustomIcon = (name: string): name is CustomIconName => name in CUSTOM_GLYPHS;
