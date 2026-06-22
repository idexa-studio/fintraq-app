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
  xxs: 9.5, xs: 11, sm: 13, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28,
};

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
  profileMono:      { fontFamily: F.bold,           fontSize: S.xl   },

  // ── Utility ──────────────────────────────────────────────────────
  badge:            { fontFamily: F.medium,         fontSize: S.xxs  },
  caption:          { fontFamily: F.regular,         fontSize: S.xxs  },
  inputLabel:       { fontFamily: F.medium,         fontSize: S.sm   },
  inputValue:       { fontFamily: F.regular,         fontSize: S.md   },
} as const;

export type TextStyleKey = keyof typeof TEXT_STYLES;

export type TypographyTheme = {
  sizes: TypographyScale;
  weights: TypographyWeight;
  fonts: TypographyFonts;
  styles: typeof TEXT_STYLES;
};

export const TYPOGRAPHY: TypographyTheme = {
  sizes: {
    xxs: 9.5,
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
};
