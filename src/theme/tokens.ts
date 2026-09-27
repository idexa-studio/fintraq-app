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
// Concentric rule: an element inside a container uses (container radius −
// container padding). Cards 20 with 16 padding → inner tiles/inputs 10–12.
// Shape language — two families, never mixed on one element:
//   PILL (full): where it reads best — buttons, chips, badges, segmented
//         controls, search, tab indicator, toggles; icon buttons are circles.
//   SOFT: everything else. Cards/list groups xl, hero/sheets/dialogs 2xl,
//         tiles inside cards lg, text inputs lg, icon tiles and avatars are
//         squircles (30% of size). Nested shapes are concentric.
export const RADIUS = {
  'none': 0,
  'xs': 6,    // tiny inline marks
  'sm': 10,   // nested blocks inside cards
  'md': 12,   // inner blocks, keypad keys
  'lg': 16,   // tiles inside a card, text inputs
  'xl': 24,   // cards, list groups
  '2xl': 28,  // hero card, sheets, dialogs
  'full': 999, // pills and circles — every control
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

  // Floating tab bar footprint — see tabBarClearance()
  tabBarHeight: 60,
  tabBarGap: 8,
  
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
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.full,
      fontSize: 13,
    },
    md: {
      height: 44,
      paddingHorizontal: SPACING['5'],
      borderRadius: RADIUS.full,
      fontSize: 14,
    },
    lg: {
      height: 52,
      paddingHorizontal: SPACING['6'],
      borderRadius: RADIUS.full,
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
      height: 48,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.lg,
    },
    lg: {
      height: 56,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.lg,
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

  // Same 36 / 44 / 52 scale as buttons, so a row of mixed controls lines up.
  iconButton: {
    sm: 36,
    md: 44,
    lg: 52,
  },
} as const;

// ============================================
// ALPHA SCALE
// Named translucency levels for tinting a solid theme colour.
//
// Before this existed the app hand-wrote 20 different hex suffixes
// ('12', '14', '15', '18', '1A', '1E', '20' …) that were visually
// indistinguishable but never matched. Use a named level instead:
//   backgroundColor: alpha(colors.primary, 'subtle')
// ============================================
export const ALPHA = {
  /** 6% — hairline separators, barely-there wash */
  faint:  '0F',
  /** 10% — tinted icon tiles, chip fills, soft card borders */
  subtle: '1A',
  /** 17% — pressed states, stronger dividers */
  soft:   '2B',
  /** 30% — disabled fills, inactive tracks */
  medium: '4D',
  /** 50% — scrims, muted overlay text */
  strong: '80',
} as const;

export type AlphaToken = keyof typeof ALPHA;

/**
 * Tint a solid 6-digit hex colour with a named alpha level.
 * `alpha('#00CC6A', 'subtle')` → `'#00CC6A1A'`
 */
export function alpha(hexColor: string, level: AlphaToken): string {
  return `${hexColor}${ALPHA[level]}`;
}

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
// INTERACTION STATES
// One value per state so every disabled / pressed control looks the same.
// ============================================
export const STATE = {
  disabled: 0.45,
  pressed: 0.6,
} as const;

// ============================================
// TRANSITIONS / ANIMATION
// ============================================
export const ANIMATION = {
  /** 150ms — backdrop fades, colour/opacity cross-fades */
  fast: 150,
  /** 200ms — standard enter transitions */
  normal: 200,
  /** 220ms — sheet/modal dismissal, needs to outlast the backdrop fade */
  exit: 220,
  /** 300ms — large travel, full-screen transitions */
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
 * Bottom padding a scrollable tab screen needs so its last row clears the
 * floating tab bar instead of hiding behind it.
 *
 * The tab bar floats at `insets.bottom + tabBarGap` and is `tabBarHeight` tall.
 * Screens use `edges={['top']}`, so the bottom inset is NOT consumed by the
 * SafeAreaView and has to be added here.
 */
export function tabBarClearance(bottomInset: number): number {
  return bottomInset + LAYOUT.tabBarHeight + LAYOUT.tabBarGap + SPACING['6'];
}

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
