import { Platform } from 'react-native';

export type TypographyScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export type TypographyWeight = {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
};

export type TypographyFonts = {
  /** Monospace — logs and raw data only. */
  mono: string;
  heading: 'MuseoModerno_Bold';
  headingRegular: 'MuseoModerno_Regular';
  regular: 'MuseoModerno_Regular';
  medium: 'MuseoModerno_Medium';
  semibold: 'MuseoModerno_SemiBold';
  bold: 'MuseoModerno_Bold';
  amountLight: 'MuseoModerno_Regular';
  amountRegular: 'MuseoModerno_Medium';
  amountBold: 'MuseoModerno_SemiBold';
};

// ─── Semantic Text Style Presets ────────────────────────────────────────────
// Source of truth for font weight per UI role. All components must use
// typography.styles.X.fontFamily rather than picking typography.fonts.X ad-hoc.
//
// Weight hierarchy:
//   heading/bold  → screen titles, dialog titles, profile hero names
//   semibold      → section labels, active-state chip/tab text
//   medium        → buttons, row labels, card titles, badges, input labels
//   regular       → body text, values, metadata, captions, descriptions
// ─────────────────────────────────────────────────────────────────────────────

const F = {
  mono:          Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  heading:       'MuseoModerno_Bold'     as const,
  bold:          'MuseoModerno_Bold'     as const,
  semibold:      'MuseoModerno_SemiBold' as const,
  medium:        'MuseoModerno_Medium'   as const,
  regular:       'MuseoModerno_Regular'  as const,
  amountBold:    'MuseoModerno_SemiBold' as const,
  amountRegular: 'MuseoModerno_Medium'   as const,
  amountLight:   'MuseoModerno_Regular'  as const,
};

const S = {
  xxs: 10, xs: 11, sm: 13, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28,
};

// ─── Optical text metrics ───────────────────────────────────────────────────
// Every text style in the app pulls its size from here rather than a bare
// number, so font size, line height and tracking always travel together.
//
// Rhythm rules:
//   • Display sizes get tight leading + negative tracking so large MuseoModerno
//     headings read as one solid block instead of drifting apart.
//   • Body sizes get generous leading (~1.45) for multi-line readability.
//   • Micro sizes get positive tracking so small caps-ish labels stay legible.
//   • includeFontPadding:false removes Android's extra glyph padding, which is
//     what otherwise makes text sit off-centre inside rows, chips and badges.
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_METRICS = {
  xxs:  { fontSize: S.xxs,  lineHeight: 14, letterSpacing:  0.3,  includeFontPadding: false },
  xs:   { fontSize: S.xs,   lineHeight: 16, letterSpacing:  0.2,  includeFontPadding: false },
  sm:   { fontSize: S.sm,   lineHeight: 19, letterSpacing:  0,    includeFontPadding: false },
  md:   { fontSize: S.md,   lineHeight: 21, letterSpacing: -0.1,  includeFontPadding: false },
  lg:   { fontSize: S.lg,   lineHeight: 23, letterSpacing: -0.2,  includeFontPadding: false },
  xl:   { fontSize: S.xl,   lineHeight: 25, letterSpacing: -0.3,  includeFontPadding: false },
  xxl:  { fontSize: S.xxl,  lineHeight: 29, letterSpacing: -0.5,  includeFontPadding: false },
  xxxl: { fontSize: S.xxxl, lineHeight: 36, letterSpacing: -0.8,  includeFontPadding: false },
  /** 34 — large amounts in inputs and heroes. */
  display: { fontSize: 34, lineHeight: 42, letterSpacing: -1,  includeFontPadding: false },
  /** 40 — the single biggest number on a screen (amount entry, PIN). */
  jumbo: { fontSize: 40, lineHeight: 48, letterSpacing: -1.2, includeFontPadding: false },
} as const;

export type TextMetricToken = keyof typeof TEXT_METRICS;

export const TEXT_STYLES = {
  // ── Navigation / Screen ──────────────────────────────────────────
  screenTitle:      { fontFamily: F.heading,       fontSize: S.xxl  },
  screenSubtitle:   { fontFamily: F.regular,        fontSize: S.sm   },

  // ── Section ──────────────────────────────────────────────────────
  sectionLabel:     { fontFamily: F.semibold,       fontSize: S.xs   },

  // ── Cards ────────────────────────────────────────────────────────
  cardTitle:        { fontFamily: F.medium,         fontSize: S.md   },
  cardBody:         { fontFamily: F.regular,         fontSize: S.sm   },

  // ── List rows ────────────────────────────────────────────────────
  rowLabel:         { fontFamily: F.medium,         fontSize: S.md   },
  rowValue:         { fontFamily: F.regular,         fontSize: S.sm   },
  rowMeta:          { fontFamily: F.regular,         fontSize: S.xs   },

  // ── Interactive ──────────────────────────────────────────────────
  buttonLabel:      { fontFamily: F.medium,         fontSize: S.md   },
  chipLabel:        { fontFamily: F.medium,         fontSize: S.xs   },
  chipLabelActive:  { fontFamily: F.semibold,       fontSize: S.xs   },

  // ── Dialogs / Sheets ─────────────────────────────────────────────
  dialogTitle:      { fontFamily: F.heading,        fontSize: S.xl   },
  dialogBody:       { fontFamily: F.regular,         fontSize: S.md   },
  dialogAction:     { fontFamily: F.medium,         fontSize: S.md   },

  // ── Monetary amounts ─────────────────────────────────────────────
  heroAmount:       { fontFamily: F.amountBold,     fontSize: S.xxxl },
  amountPrimary:    { fontFamily: F.amountBold,     fontSize: S.xxl  },
  amountSecondary:  { fontFamily: F.amountRegular,  fontSize: S.md   },

  // ── Empty states ─────────────────────────────────────────────────
  emptyTitle:       { fontFamily: F.medium,         fontSize: S.lg   },
  emptyBody:        { fontFamily: F.regular,         fontSize: S.sm   },
  emptyAction:      { fontFamily: F.medium,         fontSize: S.sm   },

  // ── Profile / Identity ───────────────────────────────────────────
  profileName:      { fontFamily: F.bold,           fontSize: S.lg   },
  profileMono:      { fontFamily: F.regular,           fontSize: S.xl   },

  // ── Utility ──────────────────────────────────────────────────────
  badge:            { fontFamily: F.medium,         fontSize: S.xxs  },
  caption:          { fontFamily: F.regular,         fontSize: S.xxs  },
  inputLabel:       { fontFamily: F.medium,         fontSize: S.sm   },
  inputValue:       { fontFamily: F.regular,         fontSize: S.md   },
} as const;

export type TextStyleKey = keyof typeof TEXT_STYLES;

// ─── Text variants ──────────────────────────────────────────────────────────
// The type ramp consumed by <Text variant="…">: family + size + line height +
// tracking as one unit, built on the brand face. Prefer these in new code.
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_VARIANTS = {
  display:       { fontFamily: F.heading,       ...TEXT_METRICS.xxxl },
  title:         { fontFamily: F.heading,       ...TEXT_METRICS.xxl },
  headline:      { fontFamily: F.heading,       ...TEXT_METRICS.xl },
  subheading:    { fontFamily: F.semibold,      ...TEXT_METRICS.lg },
  body:          { fontFamily: F.regular,       ...TEXT_METRICS.md },
  bodyStrong:    { fontFamily: F.medium,        ...TEXT_METRICS.md },
  callout:       { fontFamily: F.regular,       ...TEXT_METRICS.sm },
  calloutStrong: { fontFamily: F.medium,        ...TEXT_METRICS.sm },
  caption:       { fontFamily: F.regular,       ...TEXT_METRICS.xs },
  label:         { fontFamily: F.semibold,      ...TEXT_METRICS.xs },
  micro:         { fontFamily: F.medium,        ...TEXT_METRICS.xxs },
  amountHero:    { fontFamily: F.amountBold,    ...TEXT_METRICS.xxxl },
  amountLarge:   { fontFamily: F.amountBold,    ...TEXT_METRICS.xxl },
  amount:        { fontFamily: F.amountRegular, ...TEXT_METRICS.md },
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;

export type TypographyTheme = {
  sizes: TypographyScale;
  weights: TypographyWeight;
  fonts: TypographyFonts;
  styles: typeof TEXT_STYLES;
  /** Size + line height + tracking as one unit. Spread it: `...typography.metrics.md` */
  metrics: typeof TEXT_METRICS;
  /** Complete type ramp used by <Text variant> */
  variants: typeof TEXT_VARIANTS;
};

export const TYPOGRAPHY: TypographyTheme = {
  sizes: {
    xxs: 10,
    xs: 11,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    mono: F.mono,
    heading: 'MuseoModerno_Bold',
    headingRegular: 'MuseoModerno_Regular',
    regular: 'MuseoModerno_Regular',
    medium: 'MuseoModerno_Medium',
    semibold: 'MuseoModerno_SemiBold',
    bold: 'MuseoModerno_Bold',
    amountLight: 'MuseoModerno_Regular',
    amountRegular: 'MuseoModerno_Medium',
    amountBold: 'MuseoModerno_SemiBold',
  },
  styles: TEXT_STYLES,
  metrics: TEXT_METRICS,
  variants: TEXT_VARIANTS,
};
