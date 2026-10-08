import type { TextStyle } from 'react-native';

/**
 * Two families, as in the reference: a bold serif for headings and a humanist
 * sans for everything else. The reference faces are proprietary; these are the
 * closest open-licence matches by measured letter shape and width (Lora and
 * Hanken Grotesk). Keys are the names the fonts are loaded under.
 */
export const FONTS = {
  serifBold: 'Lora_700Bold',
  serifSemiBold: 'Lora_600SemiBold',
  sansRegular: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemiBold: 'HankenGrotesk_600SemiBold',
  sansBold: 'HankenGrotesk_700Bold',
} as const;

/** Font files, keyed by the family name each is loaded under. */
export const FONT_ASSETS = {
  [FONTS.serifBold]: require('@/assets/fonts/Lora/Lora_700Bold.ttf'),
  [FONTS.serifSemiBold]: require('@/assets/fonts/Lora/Lora_600SemiBold.ttf'),
  [FONTS.sansRegular]: require('@/assets/fonts/HankenGrotesk/HankenGrotesk_400Regular.ttf'),
  [FONTS.sansMedium]: require('@/assets/fonts/HankenGrotesk/HankenGrotesk_500Medium.ttf'),
  [FONTS.sansSemiBold]: require('@/assets/fonts/HankenGrotesk/HankenGrotesk_600SemiBold.ttf'),
  [FONTS.sansBold]: require('@/assets/fonts/HankenGrotesk/HankenGrotesk_700Bold.ttf'),
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
 * The type ramp. Each size was set so that the reference's own strings, drawn
 * in these faces on a phone, come out the same width as in the reference
 * (within 2%; see the gallery's `match` page). Line heights follow the
 * reference's line pitch, which is tight: about 1.1 of the size.
 */
export const TYPE = {
  /** Serif. The one headline of a full-screen message. */
  display: v(FONTS.serifBold, 23, 26),
  /** Serif. Section, question, sheet and dialog titles. */
  title: v(FONTS.serifBold, 19, 23),
  /** Button labels and the actions at the foot of a card. */
  action: v(FONTS.sansBold, 18, 21),
  /** Intro copy under a headline, choice labels, step rows. */
  lead: v(FONTS.sansRegular, 18, 19),
  /** The greeting or screen name in the header. */
  leadStrong: v(FONTS.sansBold, 18, 21),
  body: v(FONTS.sansRegular, 15.5, 17),
  bodyStrong: v(FONTS.sansBold, 16, 18),
  /** Descriptions and field labels. */
  callout: v(FONTS.sansRegular, 15, 17),
  calloutStrong: v(FONTS.sansBold, 15, 17),
  /** Chips and small notes. */
  caption: v(FONTS.sansRegular, 12.5, 15),
  captionStrong: v(FONTS.sansBold, 12.5, 15),
  /** Tab bar labels. */
  tab: v(FONTS.sansRegular, 11.5, 13),
  tabActive: v(FONTS.sansBold, 11.5, 13),
  /** Badge text, set in capitals. */
  badge: { ...v(FONTS.sansBold, 11.5, 13, 0.3), textTransform: 'uppercase' },
  /** A screen's headline figure. */
  amountHero: v(FONTS.sansMedium, 34, 38),
  /** The balance on an account card. */
  amountLarge: v(FONTS.sansMedium, 24, 28),
  /** Figures in rows. */
  amount: v(FONTS.sansBold, 16, 19),
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
 * weight instead of a font file, looser lines. Headings lose the serif, which
 * the system does not offer for every script; they stay bold.
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
