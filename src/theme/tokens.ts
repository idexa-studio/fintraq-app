/**
 * Design Tokens - Fintraq Design System
 * 
 * Material 3-inspired Design Language
 * - Tonal surfaces with rounded shapes
 * - No arbitrary values - everything uses token system
 * - Consistent 4px base grid
 */

// ============================================
// SPACING SCALE (4px base)
// ============================================
export const SPACING = {
  // Base units (4px grid)
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 32,
  '8': 40,
  '9': 48,
  '10': 64,
  '11': 80,
  '12': 96,
} as const;

export type SpacingToken = keyof typeof SPACING;

// ============================================
// BORDER RADIUS SCALE
// MD3-friendly: rounded, soft, touch-first
// ============================================
export const RADIUS = {
  'none': 0,
  'xs': 4,
  'sm': 8,
  'md': 12,
  'lg': 16,
  'xl': 20,
  '2xl': 24,
  'full': 999, // Use sparingly - only for micro-badges
} as const;

export type RadiusToken = keyof typeof RADIUS;

// ============================================
// LAYOUT GRID
// ============================================
export const LAYOUT = {
  // Screen margins
  screenPadding: 16,
  
  // Content max widths for readability
  maxContentWidth: 400,
  
  // Component gaps
  sectionGap: 20,
  cardGap: 10,
  elementGap: 6,
  
  // Touch targets
  minTouchTarget: 44,
  
  // Icon sizes
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,
} as const;

// ============================================
// COMPONENT SIZE VARIANTS
// ============================================
export const COMPONENT_SIZES = {
  button: {
    sm: {
      height: 36,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.lg,
      fontSize: 13,
    },
    md: {
      height: 44,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.xl,
      fontSize: 14,
    },
    lg: {
      height: 52,
      paddingHorizontal: SPACING['5'],
      borderRadius: RADIUS.xl,
      fontSize: 15,
    },
  },

  input: {
    sm: {
      height: 40,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.lg,
    },
    md: {
      height: 50,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.lg,
    },
    lg: {
      height: 58,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.xl,
    },
  },

  card: {
    sm: {
      padding: SPACING['3'],
      borderRadius: RADIUS.lg,
    },
    md: {
      padding: SPACING['4'],
      borderRadius: RADIUS.xl,
    },
    lg: {
      padding: SPACING['5'],
      borderRadius: RADIUS['2xl'],
    },
  },

  iconButton: {
    sm: 32,
    md: 40,
    lg: 48,
  },
} as const;

// ============================================
// OPACITY SCALE
// ============================================
export const OPACITY = {
  '0': 0,
  '10': 0.1,
  '20': 0.2,
  '30': 0.3,
  '40': 0.4,
  '50': 0.5,
  '60': 0.6,
  '70': 0.7,
  '80': 0.8,
  '90': 0.9,
  '100': 1,
} as const;

// ============================================
// ELEVATION / SHADOWS
// MD3: low, soft elevation
// ============================================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

export type ShadowToken = keyof typeof SHADOWS;

// ============================================
// Z-INDEX SCALE
// ============================================
export const Z_INDEX = {
  '0': 0,
  '10': 10,
  '20': 20,
  '30': 30,
  '40': 40,
  '50': 50,
  'auto': 'auto',
} as const;

// ============================================
// TRANSITIONS / ANIMATION
// ============================================
export const ANIMATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

// ============================================
// TYPOGRAPHY LINE HEIGHT SCALE
// ============================================
export const LINE_HEIGHT = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ============================================
// LETTER SPACING
// ============================================
export const LETTER_SPACING = {
  tight: -1,
  snug: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// ============================================
// HERO CARD PALETTE
// Fixed dark-context palette — always dark regardless of theme.
// Use for full-bleed hero cards (dashboard balance, settings profile).
// Never hardcode these values in components — import from here.
// ============================================
export const HERO_CARD = {
  background:  '#00D473',
  backgroundDark: '#00B362',
  textPrimary: '#0A0A0A',
  textMuted:   '#2B2D30',
  separator:   'rgba(0, 0, 0, 0.07)',
  income:      '#004D20',
  expense:     '#800000',
  decoOverlay: 'rgba(255, 255, 255, 0.12)',
  glowLight:   'rgba(255, 255, 255, 0.04)',
} as const;

export type HeroCardPalette = typeof HERO_CARD;

// ============================================
// OVERLAY BACKGROUNDS
// Used for modal backdrops — never hardcode rgba in components
// ============================================
export const OVERLAY = {
  light: {
    dim: 'rgba(0,0,0,0.52)',
    dark: 'rgba(0,0,0,0.65)',
  },
  dark: {
    dim: 'rgba(0,0,0,0.78)',
    dark: 'rgba(0,0,0,0.88)',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get spacing value from token
 */
export function spacing(token: SpacingToken): number {
  return SPACING[token];
}

/**
 * Get border radius value from token
 */
export function radius(token: RadiusToken): number {
  return RADIUS[token];
}

/**
 * Get shadow style object
 */
export function shadow(token: ShadowToken) {
  return SHADOWS[token];
}

/**
 * Create a spacing object for StyleSheet
 * Usage: spacingStyle('margin', 4) => { margin: 16 }
 */
export function spacingStyle(
  property: 'margin' | 'marginHorizontal' | 'marginVertical' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'padding' | 'paddingHorizontal' | 'paddingVertical' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'gap',
  token: SpacingToken
) {
  return { [property]: SPACING[token] };
}
