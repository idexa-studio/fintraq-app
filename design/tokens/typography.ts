import type { TextStyle } from 'react-native';

/**
 * One family throughout, as in the reference, whose lettering is a humanist
 * sans in the Gill Sans tradition: closed two-storey g, classical capitals,
 * headings in the bold with slightly flared strokes. That face is
 * proprietary; Proza Libre is the closest open-licence family in letter shape
 * and proportion, chosen by comparing 40 candidates against the reference's
 * own words. Keys are the names the fonts are loaded under.
 */
export const FONTS = {
  regular: 'ProzaLibre_400Regular',
  medium: 'ProzaLibre_500Medium',
  bold: 'ProzaLibre_700Bold',
} as const;

/** Font files, keyed by the family name each is loaded under. */
export const FONT_ASSETS = {
  [FONTS.regular]: require('@/assets/fonts/ProzaLibre/ProzaLibre_400Regular.ttf'),
  [FONTS.medium]: require('@/assets/fonts/ProzaLibre/ProzaLibre_500Medium.ttf'),
  [FONTS.bold]: require('@/assets/fonts/ProzaLibre/ProzaLibre_700Bold.ttf'),
};

export type TypeStyle = Required<Pick<TextStyle, 'fontSize' | 'lineHeight' | 'letterSpacing'>> &
  Pick<TextStyle, 'fontFamily' | 'fontWeight' | 'textTransform'>;

type Variant = TypeStyle & { fontFamily: string };

const v = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0): Variant => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
});

/**
 * The type ramp. Each size is the one at which the reference's own strings,
 * set in this family, come out the same width as in the reference. Line
 * heights follow the reference's line pitch, which is tight.
 */
export const TYPE = {
  /** The one headline of a full-screen message. */
  display: v(FONTS.bold, 21, 26),
  /** Section, question, sheet and dialog titles. */
  title: v(FONTS.bold, 18, 23),
  /** Button labels and the actions at the foot of a card. */
  action: v(FONTS.bold, 16, 21),
  /** Intro copy under a headline, choice labels, step rows. */
  lead: v(FONTS.regular, 16.5, 20),
  /** The greeting or screen name in the header. */
  leadStrong: v(FONTS.bold, 16.5, 21),
  body: v(FONTS.regular, 14.5, 18),
  bodyStrong: v(FONTS.bold, 14.5, 18),
  /** Descriptions and field labels. */
  callout: v(FONTS.regular, 13.5, 17),
  calloutStrong: v(FONTS.bold, 13.5, 17),
  /** Chips and small notes. */
  caption: v(FONTS.regular, 11.5, 15),
  captionStrong: v(FONTS.bold, 11.5, 15),
  /** Tab bar labels. */
  tab: v(FONTS.regular, 10.5, 13),
  tabActive: v(FONTS.bold, 10.5, 13),
  /** Badge text, set in capitals. */
  badge: { ...v(FONTS.bold, 10.5, 13, 0.3), textTransform: 'uppercase' },
  /** A screen's headline figure. */
  amountHero: v(FONTS.medium, 30, 38),
  /** The balance on an account card. */
  amountLarge: v(FONTS.medium, 21, 28),
  /** Figures in rows. */
  amount: v(FONTS.bold, 14.5, 19),
} as const satisfies Record<string, Variant>;

export type TypeVariant = keyof typeof TYPE;

/**
 * How far text follows the phone's font-size setting. Text grows with it up
 * to this multiple and no further: beyond that the layouts, which are built
 * around the measured sizes, stop fitting on a phone. Controls are sized to
 * hold text at this multiple.
 */
export const MAX_FONT_SCALE = 1.4;

/**
 * Marks a figure as left-to-right text. Without it, in a right-to-left
 * layout, the minus sign of "−$42.10" is moved to the far end and a sum such
 * as "12.50+3×4" is reordered.
 */
export const ltr = (figure: string): string => `\u2066${figure}\u2069`;

/** Pence are set smaller than pounds: £0.00 with ".00" at this share of the size. */
export const MINOR_UNITS_SCALE = 0.72;

/** The same ramp for every script: variant names never change, only how they are drawn. */
export type TypeRamp = Record<TypeVariant, TypeStyle>;

/**
 * Languages whose writing neither bundled face can draw. For these the whole
 * ramp switches to the phone's own font for that script, rather than letting
 * each missing letter fall back one by one, which would lose the bold weights
 * (a fallback glyph ignores the weight baked into our font files).
 */
const SYSTEM_FONT_LANGUAGES = ['hi', 'mr', 'bn', 'ta', 'te', 'kn', 'ja'];

/** True when text in this language (a tag such as "hi" or "ja-JP") must use the system-font ramp. */
export const needsSystemFont = (languageTag: string): boolean => SYSTEM_FONT_LANGUAGES.includes(languageTag.toLowerCase().split(/[-_]/)[0]);

/**
 * How much taller a line is in the system-font ramp. The Latin ramp is set
 * tight (about 1.1); Indic vowel signs above and below the line, and Japanese
 * at the same nominal size, need more room or they are clipped.
 */
const SYSTEM_LEADING = 1.45;

const weightOf = (family: string): TextStyle['fontWeight'] => (family.includes('700') ? '700' : family.includes('600') ? '600' : family.includes('500') ? '500' : '400');

/**
 * The ramp drawn in the phone's own font: same sizes, weight carried as a
 * weight instead of a font file, looser lines.
 */
export const TYPE_SYSTEM: TypeRamp = Object.fromEntries(
  (Object.entries(TYPE) as [TypeVariant, Variant][]).map(([name, style]) => [
    name,
    {
      fontSize: style.fontSize,
      lineHeight: Math.round(style.fontSize * SYSTEM_LEADING),
      letterSpacing: 0,
      fontWeight: weightOf(style.fontFamily),
      // Capitals do not exist in these scripts; leaving the transform on is harmless but pointless.
      textTransform: undefined,
    },
  ]),
) as TypeRamp;
